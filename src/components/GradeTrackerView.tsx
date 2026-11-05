import React, { useState } from 'react';
import { Course, AcademicItem } from '../types';
import {
  calculateSemesterGpa,
  calculateCourseGrade,
  percentageToLetterGrade,
} from '../utils/gradeUtils';
import { formatDate } from '../utils/dateUtils';
import { getCourseTheme } from '../utils/courseTheme';
import { GradeChart } from './GradeChart';
import {
  Award,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  BookOpen,
  Sparkles,
  HelpCircle,
  Percent,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GradeTrackerViewProps {
  courses: Course[];
  items: AcademicItem[];
  onUpdateItemGrade: (itemId: string, score: number, maxScore: number, gradedDate?: string) => void;
  onRemoveItemGrade: (itemId: string) => void;
}

export const GradeTrackerView: React.FC<GradeTrackerViewProps> = ({
  courses,
  items,
  onUpdateItemGrade,
  onRemoveItemGrade,
}) => {
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string | 'all'>('all');
  const [isGradeModalOpen, setIsGradeModalOpen] = useState<boolean>(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [inputScore, setInputScore] = useState<string>('');
  const [inputMaxScore, setInputMaxScore] = useState<string>('100');
  const [inputDate, setInputDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Overall calculations
  const semesterGpa = calculateSemesterGpa(courses, items);
  const courseSummaries = courses.map((c) => calculateCourseGrade(c, items));

  const filteredSummaries =
    selectedCourseFilter === 'all'
      ? courseSummaries
      : courseSummaries.filter((s) => s.courseId === selectedCourseFilter);

  // Filtered deliverables that are graded
  const gradedItems = items.filter(
    (i) => i.score !== undefined && i.maxScore !== undefined && i.maxScore > 0
  );

  const handleOpenGradeModal = (item?: AcademicItem) => {
    if (item) {
      setSelectedItemId(item.id);
      setInputScore(item.score !== undefined ? String(item.score) : '');
      setInputMaxScore(item.maxScore !== undefined ? String(item.maxScore) : '100');
      setInputDate(item.gradedDate || new Date().toISOString().split('T')[0]);
    } else {
      const firstUngraded = items.find((i) => i.score === undefined);
      setSelectedItemId(firstUngraded?.id || items[0]?.id || '');
      setInputScore('');
      setInputMaxScore('100');
      setInputDate(new Date().toISOString().split('T')[0]);
    }
    setIsGradeModalOpen(true);
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !inputScore || !inputMaxScore) return;

    const numScore = parseFloat(inputScore);
    const numMax = parseFloat(inputMaxScore);

    if (isNaN(numScore) || isNaN(numMax) || numMax <= 0) return;

    onUpdateItemGrade(selectedItemId, numScore, numMax, inputDate);

    // Celebrate if high score!
    if (numScore / numMax >= 0.9) {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.6 },
      });
    }

    setIsGradeModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top GPA & Performance Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Semester GPA */}
        <div className="bg-white dark:bg-[#23121d] border border-pink-100 dark:border-pink-900/40 rounded-2xl p-5 shadow-[0_2px_12px_-2px_rgba(244,114,182,0.06)]">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-pink-400/80 mb-1">
            <span className="font-semibold uppercase tracking-wider">Cumulative Semester GPA</span>
            <Award className="w-4 h-4 text-pink-500 dark:text-pink-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-pink-50">
              {semesterGpa.gpa.toFixed(2)}
            </span>
            <span className="text-xs text-pink-400/80 font-mono">/ 4.00</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {percentageToLetterGrade(semesterGpa.averagePercentage)} Average
            </span>
            <span aria-hidden="true" className="text-pink-200">·</span>
            <span className="text-slate-500 dark:text-pink-300/80">
              {semesterGpa.totalCredits} credits
            </span>
          </div>
        </div>

        {/* Card 2: Average Percentage */}
        <div className="bg-white dark:bg-[#23121d] border border-pink-100 dark:border-pink-900/40 rounded-2xl p-5 shadow-[0_2px_12px_-2px_rgba(244,114,182,0.06)]">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-pink-400/80 mb-1">
            <span className="font-semibold uppercase tracking-wider">Overall Average</span>
            <Percent className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-pink-50">
              {semesterGpa.averagePercentage}%
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-pink-300/80 mt-2">
            Across {semesterGpa.gradedCoursesCount} courses with graded work
          </p>
        </div>

        {/* Card 3: Graded Items Progress */}
        <div className="bg-white dark:bg-[#23121d] border border-pink-100 dark:border-pink-900/40 rounded-2xl p-5 shadow-[0_2px_12px_-2px_rgba(244,114,182,0.06)]">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-pink-400/80 mb-1">
            <span className="font-semibold uppercase tracking-wider">Deliverables Graded</span>
            <CheckCircle2 className="w-4 h-4 text-sky-500 dark:text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-pink-50">
              {gradedItems.length}
            </span>
            <span className="text-xs text-pink-400/80 font-mono">/ {items.length} total</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-pink-300/80 mt-2">
            {items.length - gradedItems.length} upcoming or pending grading
          </p>
        </div>

        {/* Card 4: Quick Action Button */}
        <div className="bg-gradient-to-br from-[#FFF5F8] to-[#FFF0F4] dark:bg-pink-950/40 border border-pink-200/70 dark:border-pink-900/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-pink-700 dark:text-pink-300 uppercase tracking-wider block mb-1">
              Grade Entry
            </span>
            <p className="text-xs text-pink-900/80 dark:text-pink-200/80">
              Got an exam or homework grade back? Record it to update your GPA trajectory.
            </p>
          </div>
          <button
            onClick={() => handleOpenGradeModal()}
            className="mt-3 w-full py-2 px-3 text-xs font-semibold text-white bg-gradient-to-r from-pink-400 via-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 rounded-xl shadow-sm shadow-pink-200/50 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Grade</span>
          </button>
        </div>
      </div>

      {/* Interactive Grade Progress Chart */}
      <GradeChart courses={courses} items={items} />

      {/* Course Grade Cards & Gradebook Breakdown */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-pink-50">
              Course Gradebook & Standing
            </h3>
            <p className="text-xs text-slate-500 dark:text-pink-300/80 mt-0.5">
              Weighted averages, target grades, and individual returned assignments.
            </p>
          </div>

          {/* Filter Course Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setSelectedCourseFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap font-medium ${
                selectedCourseFilter === 'all'
                  ? 'bg-pink-100/70 text-pink-800 dark:bg-pink-950/70 dark:text-pink-200 border border-pink-200/60 shadow-sm'
                  : 'text-slate-600 dark:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-950/40'
              }`}
            >
              All Courses
            </button>
            {courses.map((course) => {
              const theme = getCourseTheme(course.color);
              const isSelected = selectedCourseFilter === course.id;
              return (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourseFilter(course.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap font-medium ${
                    isSelected
                      ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-sm shadow-pink-200/50'
                      : 'text-slate-700 dark:text-pink-200 hover:bg-pink-50 dark:hover:bg-pink-950/40'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : theme.dotBg}`} />
                  <span>{course.code}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Course Breakdown Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {filteredSummaries.map((summary) => {
            const courseTheme = getCourseTheme(summary.color);
            const courseDeliverables = items.filter((i) => i.courseId === summary.courseId);

            return (
              <div
                key={summary.courseId}
                className="bg-white dark:bg-[#23121d] border border-pink-100 dark:border-pink-900/40 rounded-2xl p-5 shadow-[0_2px_12px_-2px_rgba(244,114,182,0.06)] flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${courseTheme.dotBg}`} />
                      <span className={`text-xs font-bold uppercase tracking-wider ${courseTheme.badgeText}`}>
                        {summary.courseCode}
                      </span>
                    </div>

                    <div className="text-right">
                      {summary.currentPercentage !== null ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-pink-50">
                            {summary.currentPercentage}%
                          </span>
                          <span className="text-xs font-semibold text-pink-600 dark:text-pink-400">
                            ({summary.letterGrade})
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-pink-900/60 italic">No grades yet</span>
                      )}
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-pink-50 mb-1">
                    {summary.courseName}
                  </h4>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-pink-300/80 mb-4">
                    <span>Target: <strong className="text-slate-700 dark:text-pink-200">{summary.targetGrade || 'A'}</strong></span>
                    <span aria-hidden="true" className="text-pink-200">·</span>
                    <span>{summary.credits} credits</span>
                    <span aria-hidden="true" className="text-pink-200">·</span>
                    <span>{summary.gradedItemsCount}/{summary.totalItemsCount} graded</span>
                  </div>

                  {/* List of Deliverables for this course */}
                  <div className="space-y-2 border-t border-pink-100/80 dark:border-pink-900/40 pt-3">
                    <span className="text-[11px] font-semibold text-pink-400 uppercase tracking-wider block mb-1">
                      Assignments & Exams:
                    </span>
                    {courseDeliverables.map((item) => {
                      const isGraded = item.score !== undefined && item.maxScore !== undefined;
                      const pct = isGraded ? Math.round((item.score! / item.maxScore!) * 100) : null;

                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-pink-50/40 dark:bg-pink-950/20 border border-pink-100/60 dark:border-pink-900/40 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-slate-800 dark:text-pink-100 block truncate">
                              {item.title}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-pink-400/80">
                              <span className="capitalize">{item.type}</span>
                              {item.weight && (
                                <>
                                  <span aria-hidden="true" className="text-pink-200">·</span>
                                  <span>{item.weight}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isGraded ? (
                              <button
                                onClick={() => handleOpenGradeModal(item)}
                                className="font-mono tabular-nums text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                                title="Click to edit grade"
                              >
                                {item.score}/{item.maxScore} ({pct}%)
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenGradeModal(item)}
                                className="text-[11px] font-semibold text-pink-600 dark:text-pink-400 hover:underline"
                              >
                                + Add Grade
                              </button>
                            )}

                            {isGraded && (
                              <button
                                onClick={() => onRemoveItemGrade(item.id)}
                                title="Remove grade"
                                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grade Entry / Edit Modal */}
      {isGradeModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#23121d] border border-pink-100 dark:border-pink-900/40 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-pink-50 mb-1">
              Log Deliverable Grade
            </h3>
            <p className="text-xs text-slate-500 dark:text-pink-300/80 mb-4">
              Enter the score earned to automatically recalculate your course average and semester GPA.
            </p>

            <form onSubmit={handleSaveGrade} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-pink-200 mb-1">
                  Select Assignment or Exam *
                </label>
                <select
                  required
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-pink-50/30 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/60 rounded-xl focus:ring-2 focus:ring-pink-300 text-slate-900 dark:text-pink-50"
                >
                  {items.map((i) => {
                    const c = courses.find((course) => course.id === i.courseId);
                    return (
                      <option key={i.id} value={i.id}>
                        {c?.code}: {i.title} ({i.type})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-pink-200 mb-1">
                    Score Earned *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    placeholder="e.g. 95"
                    value={inputScore}
                    onChange={(e) => setInputScore(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-pink-50/30 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/60 rounded-xl focus:ring-2 focus:ring-pink-300 text-slate-900 dark:text-pink-50 font-mono"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-pink-200 mb-1">
                    Max Possible Score *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    placeholder="100"
                    value={inputMaxScore}
                    onChange={(e) => setInputMaxScore(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-pink-50/30 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/60 rounded-xl focus:ring-2 focus:ring-pink-300 text-slate-900 dark:text-pink-50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-pink-200 mb-1">
                  Date Returned / Graded
                </label>
                <input
                  type="date"
                  value={inputDate}
                  onChange={(e) => setInputDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-pink-50/30 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/60 rounded-xl focus:ring-2 focus:ring-pink-300 text-slate-900 dark:text-pink-50 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-pink-100 dark:border-pink-900/40">
                <button
                  type="button"
                  onClick={() => setIsGradeModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-pink-300 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-pink-400 via-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 rounded-xl shadow-sm shadow-pink-200/50"
                >
                  Save Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
