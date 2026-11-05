import React from 'react';
import { AcademicItem, Course } from '../types';
import { getDaysDifference, formatDate } from '../utils/dateUtils';
import { getCourseTheme } from '../utils/courseTheme';
import { calculateSemesterGpa } from '../utils/gradeUtils';
import { AlertCircle, CheckCircle2, Clock, Calendar, Sparkles, Plus, Award, TrendingUp } from 'lucide-react';

interface StatsBannerProps {
  items: AcademicItem[];
  courses: Course[];
  onOpenAdd: () => void;
  onOpenImport: () => void;
  onFilterExamsOnly: () => void;
  onNavigateToGrades?: () => void;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  items,
  courses,
  onOpenAdd,
  onOpenImport,
  onFilterExamsOnly,
  onNavigateToGrades,
}) => {
  // Find nearest upcoming incomplete exam
  const upcomingExams = items
    .filter((item) => item.type === 'exam' && !item.completed)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const nextExam = upcomingExams[0];
  const nextExamCourse = nextExam ? courses.find((c) => c.id === nextExam.courseId) : null;
  const nextExamDays = nextExam ? getDaysDifference(nextExam.dueDate) : null;

  // Next incomplete study checkpoint across all exams
  let nextCheckpoint: { item: AcademicItem; checkpoint: NonNullable<AcademicItem['studyCheckpoints']>[0] } | null = null;
  for (const exam of upcomingExams) {
    if (exam.studyCheckpoints) {
      const pendingChk = exam.studyCheckpoints.find((c) => !c.completed);
      if (pendingChk) {
        nextCheckpoint = { item: exam, checkpoint: pendingChk };
        break;
      }
    }
  }

  // General counts
  const totalItems = items.length;
  const completedItems = items.filter((i) => i.completed).length;
  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Due in next 7 days
  const urgentCount = items.filter((i) => {
    if (i.completed) return false;
    const diff = getDaysDifference(i.dueDate);
    return diff >= 0 && diff <= 7;
  }).length;

  const gpaInfo = calculateSemesterGpa(courses, items);
  const nextExamTheme = getCourseTheme(nextExamCourse?.color);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Card 1: Nearest Exam Alert & Active Checkpoint */}
      <div className="md:col-span-2 bg-white dark:bg-[#23121d] border border-pink-100 dark:border-pink-900/40 rounded-2xl p-5 shadow-[0_2px_12px_-2px_rgba(244,114,182,0.06)] relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-pink-300/70 mb-1">
              <span className="uppercase tracking-wider">Upcoming Exam Priority</span>
              <span aria-hidden="true">·</span>
              <span className="text-pink-600 dark:text-pink-400 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-pink-400" />
                {nextExamDays !== null
                  ? nextExamDays === 0
                    ? 'Exam Today!'
                    : nextExamDays === 1
                    ? '1 day remaining'
                    : `${nextExamDays} days remaining`
                  : 'No upcoming exams'}
              </span>
            </div>

            {nextExam ? (
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-pink-50 flex items-center gap-2">
                  <span>{nextExam.title}</span>
                </h2>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 dark:text-pink-200/70">
                  <span className={`font-semibold ${nextExamTheme.badgeText}`}>
                    {nextExamCourse?.code || 'Course'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{formatDate(nextExam.dueDate, { includeDayOfWeek: true })}</span>
                  {nextExam.time && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{nextExam.time}</span>
                    </>
                  )}
                  {nextExam.weight && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-slate-700 dark:text-pink-200">
                        {nextExam.weight}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-pink-200/70 mt-1">
                All upcoming exams are completed or none are scheduled yet. Import a syllabus to generate your exam roadmap.
              </p>
            )}
          </div>

          <button
            onClick={onFilterExamsOnly}
            className="text-xs font-medium text-pink-500 dark:text-pink-400 hover:text-pink-600 dark:hover:text-pink-300 hover:underline shrink-0"
          >
            View all exams &rarr;
          </button>
        </div>

        {/* Active Study Checkpoint Callout */}
        {nextCheckpoint && (
          <div className="mt-4 pt-3.5 border-t border-pink-100 dark:border-pink-900/40 flex items-center justify-between gap-3 text-xs bg-pink-50/70 dark:bg-pink-950/30 -mx-5 -mb-5 px-5 py-3 rounded-b-2xl">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-pink-700 dark:text-pink-300 shrink-0">
                Next Study Milestone:
              </span>
              <span className="truncate text-slate-800 dark:text-pink-100 font-medium">
                {nextCheckpoint.checkpoint.title}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 font-mono tabular-nums text-pink-700/80 dark:text-pink-300/80">
              <span>Goal: {formatDate(nextCheckpoint.checkpoint.targetDate, { shortMonth: true })}</span>
            </div>
          </div>
        )}
      </div>

      {/* Card 2: Workload & Grade Preparation Meter */}
      <div className="bg-white dark:bg-[#23121d] border border-pink-100 dark:border-pink-900/40 rounded-2xl p-5 shadow-[0_2px_12px_-2px_rgba(244,114,182,0.06)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-pink-300/70 mb-2">
            <span className="font-semibold uppercase tracking-wider">Semester Progress</span>
            <span className="font-mono tabular-nums font-bold text-slate-700 dark:text-pink-200">
              {completedItems}/{totalItems} ({completionPercentage}%)
            </span>
          </div>

          {/* Progress bar in soft blush to pastel rose gradient */}
          <div className="w-full h-2.5 bg-pink-100/70 dark:bg-pink-950/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-300 via-pink-400 to-rose-300 rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-pink-100/80 dark:border-pink-900/40 text-xs">
            <div>
              <span className="text-slate-500 dark:text-pink-300/70 block truncate">Due 7 Days</span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-800 dark:text-pink-50">
                {urgentCount} items
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-pink-300/70 block truncate">Courses</span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-800 dark:text-pink-50">
                {courses.length} active
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-pink-300/70 block truncate">Semester GPA</span>
              {onNavigateToGrades ? (
                <button
                  onClick={onNavigateToGrades}
                  className="text-sm font-bold font-mono tabular-nums text-pink-500 dark:text-pink-300 hover:underline block"
                  title="View Grade Tracker"
                >
                  {gpaInfo.gpa.toFixed(2)} &rarr;
                </button>
              ) : (
                <span className="text-sm font-bold font-mono tabular-nums text-pink-500 dark:text-pink-300">
                  {gpaInfo.gpa.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-pink-100/80 dark:border-pink-900/40">
          <button
            onClick={onOpenAdd}
            className="w-1/2 py-2 px-3 text-xs font-medium text-pink-700 dark:text-pink-200 bg-pink-50/90 dark:bg-pink-950/40 hover:bg-pink-100 border border-pink-200/60 dark:border-pink-900/50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-pink-500" />
            <span>Add Item</span>
          </button>
          <button
            onClick={onOpenImport}
            className="w-1/2 py-2 px-3 text-xs font-semibold text-white bg-gradient-to-r from-pink-400 via-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-pink-200/50"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-100" />
            <span>AI Parser</span>
          </button>
        </div>
      </div>
    </div>
  );
};
