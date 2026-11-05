import { AcademicItem, Course, GradeDataPoint } from '../types';

export function parseWeightValue(weightStr?: string): number {
  if (!weightStr) return 1;
  const match = weightStr.match(/(\d+(\.\d+)?)\s*%/);
  if (match) {
    return parseFloat(match[1]);
  }
  const anyNum = weightStr.match(/(\d+(\.\d+)?)/);
  return anyNum ? parseFloat(anyNum[1]) : 1;
}

export function percentageToGpa(percentage: number): number {
  if (percentage >= 93) return 4.0;
  if (percentage >= 90) return 3.7;
  if (percentage >= 87) return 3.3;
  if (percentage >= 83) return 3.0;
  if (percentage >= 80) return 2.7;
  if (percentage >= 77) return 2.3;
  if (percentage >= 73) return 2.0;
  if (percentage >= 70) return 1.7;
  if (percentage >= 67) return 1.3;
  if (percentage >= 60) return 1.0;
  return 0.0;
}

export function percentageToLetterGrade(percentage: number): string {
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 60) return 'D';
  return 'F';
}

export interface CourseGradeSummary {
  courseId: string;
  courseCode: string;
  courseName: string;
  color: string;
  credits: number;
  gradedItemsCount: number;
  totalItemsCount: number;
  currentPercentage: number | null; // e.g. 94.5
  letterGrade: string;
  gpaPoints: number;
  targetGrade?: string;
  earnedPoints: number;
  maxPoints: number;
}

export function calculateCourseGrade(course: Course, items: AcademicItem[]): CourseGradeSummary {
  const courseItems = items.filter((i) => i.courseId === course.id);
  const gradedItems = courseItems.filter(
    (i) => i.score !== undefined && i.maxScore !== undefined && i.maxScore > 0
  );

  let totalWeightedScore = 0;
  let totalWeights = 0;
  let totalEarned = 0;
  let totalPossible = 0;

  gradedItems.forEach((item) => {
    const score = item.score!;
    const maxScore = item.maxScore!;
    const weight = parseWeightValue(item.weight);

    totalWeightedScore += (score / maxScore) * weight;
    totalWeights += weight;

    totalEarned += score;
    totalPossible += maxScore;
  });

  let currentPercentage: number | null = null;
  if (gradedItems.length > 0) {
    if (totalWeights > 0) {
      currentPercentage = Math.round((totalWeightedScore / totalWeights) * 1000) / 10;
    } else if (totalPossible > 0) {
      currentPercentage = Math.round((totalEarned / totalPossible) * 1000) / 10;
    }
  }

  const letterGrade = currentPercentage !== null ? percentageToLetterGrade(currentPercentage) : 'N/A';
  const gpaPoints = currentPercentage !== null ? percentageToGpa(currentPercentage) : 0;

  return {
    courseId: course.id,
    courseCode: course.code,
    courseName: course.name,
    color: course.color,
    credits: course.credits || 3,
    gradedItemsCount: gradedItems.length,
    totalItemsCount: courseItems.length,
    currentPercentage,
    letterGrade,
    gpaPoints,
    targetGrade: course.targetGrade,
    earnedPoints: Math.round(totalEarned * 10) / 10,
    maxPoints: Math.round(totalPossible * 10) / 10,
  };
}

export function calculateSemesterGpa(courses: Course[], items: AcademicItem[]): {
  gpa: number;
  totalCredits: number;
  gradedCoursesCount: number;
  averagePercentage: number;
} {
  const summaries = courses.map((c) => calculateCourseGrade(c, items));
  const gradedSummaries = summaries.filter((s) => s.currentPercentage !== null);

  if (gradedSummaries.length === 0) {
    return { gpa: 4.0, totalCredits: 0, gradedCoursesCount: 0, averagePercentage: 0 };
  }

  let totalWeightedGpa = 0;
  let totalCredits = 0;
  let totalPercentage = 0;

  gradedSummaries.forEach((s) => {
    totalWeightedGpa += s.gpaPoints * s.credits;
    totalCredits += s.credits;
    totalPercentage += s.currentPercentage!;
  });

  const gpa = totalCredits > 0 ? Math.round((totalWeightedGpa / totalCredits) * 100) / 100 : 0;
  const averagePercentage =
    gradedSummaries.length > 0
      ? Math.round((totalPercentage / gradedSummaries.length) * 10) / 10
      : 0;

  return {
    gpa,
    totalCredits,
    gradedCoursesCount: gradedSummaries.length,
    averagePercentage,
  };
}

/**
 * Reconstructs the historical progression of grades and GPA over time
 * by stepping through each graded assignment and exam chronologically.
 */
export function buildSemesterGradeTimeline(courses: Course[], items: AcademicItem[]): GradeDataPoint[] {
  const gradedItems = items
    .filter((i) => i.score !== undefined && i.maxScore !== undefined && i.maxScore > 0)
    .sort((a, b) => {
      const dateA = a.gradedDate || a.completedAt || a.dueDate;
      const dateB = b.gradedDate || b.completedAt || b.dueDate;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

  if (gradedItems.length === 0) {
    return [];
  }

  const timeline: GradeDataPoint[] = [];
  const itemsSoFar: AcademicItem[] = [];

  gradedItems.forEach((item) => {
    itemsSoFar.push(item);
    const dateStr = item.gradedDate || item.completedAt || item.dueDate;
    const course = courses.find((c) => c.id === item.courseId);
    const courseCode = course?.code || 'Course';

    // Calculate state as of this item
    const gpaResult = calculateSemesterGpa(courses, itemsSoFar);
    const courseSummary = course ? calculateCourseGrade(course, itemsSoFar) : null;

    timeline.push({
      date: dateStr,
      itemTitle: item.title,
      courseId: item.courseId,
      courseCode,
      score: item.score!,
      maxScore: item.maxScore!,
      percentage: Math.round((item.score! / item.maxScore!) * 1000) / 10,
      cumulativeGpa: gpaResult.gpa,
      coursePercentage: courseSummary?.currentPercentage || 0,
    });
  });

  return timeline;
}
