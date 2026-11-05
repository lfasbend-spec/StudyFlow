import React, { useState } from 'react';
import { AcademicItem, Course } from '../types';
import { getMonthDays, formatDate, getCountdownBadge } from '../utils/dateUtils';
import { getCourseTheme } from '../utils/courseTheme';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Plus,
  Award,
  BookOpen,
  Clock,
  MapPin,
  X,
} from 'lucide-react';

interface CalendarViewProps {
  items: AcademicItem[];
  courses: Course[];
  onToggleComplete: (itemId: string) => void;
  onToggleCheckpoint: (itemId: string, checkpointId: string) => void;
  onOpenAddWithDate: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  items,
  courses,
  onToggleComplete,
  onToggleCheckpoint,
  onOpenAddWithDate,
}) => {
  // Start with November 2026 based on context, or current month
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    today.toISOString().split('T')[0]
  );

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDateStr(now.toISOString().split('T')[0]);
  };

  const calendarDays = getMonthDays(currentYear, currentMonth);

  // Group items by due date
  const itemsByDate: Record<string, AcademicItem[]> = {};
  items.forEach((item) => {
    if (!itemsByDate[item.dueDate]) {
      itemsByDate[item.dueDate] = [];
    }
    itemsByDate[item.dueDate].push(item);
  });

  // Group study checkpoints by target date
  const checkpointsByDate: Record<string, { item: AcademicItem; checkpoint: NonNullable<AcademicItem['studyCheckpoints']>[0] }[]> = {};
  items.forEach((item) => {
    if (item.studyCheckpoints) {
      item.studyCheckpoints.forEach((chk) => {
        if (!checkpointsByDate[chk.targetDate]) {
          checkpointsByDate[chk.targetDate] = [];
        }
        checkpointsByDate[chk.targetDate].push({ item, checkpoint: chk });
      });
    }
  });

  // Items and checkpoints for the selected date
  const selectedDayItems = itemsByDate[selectedDateStr] || [];
  const selectedDayCheckpoints = checkpointsByDate[selectedDateStr] || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Calendar Grid: 2 columns on large screen */}
      <div className="lg:col-span-2 bg-white dark:bg-[#23121d] border border-pink-100 dark:border-pink-900/40 rounded-2xl p-5 shadow-[0_2px_12px_-2px_rgba(244,114,182,0.06)]">
        {/* Month Navigation Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-pink-50">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={handleGoToday}
              className="px-2.5 py-1 text-xs font-semibold text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/60 hover:bg-pink-100 dark:hover:bg-pink-900/60 border border-pink-100 dark:border-pink-900/50 rounded-lg transition-colors"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="p-1.5 text-slate-600 dark:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-1.5 text-slate-600 dark:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-pink-400/80 dark:text-pink-400/70 mb-2">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* 42 Day Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((dayObj) => {
            const dateStr = dayObj.dateStr;
            const dayNum = dayObj.date.getDate();
            const dayItems = itemsByDate[dateStr] || [];
            const dayCheckpoints = checkpointsByDate[dateStr] || [];
            const isSelected = selectedDateStr === dateStr;
            const isToday =
              dateStr === new Date().toISOString().split('T')[0];

            const hasExams = dayItems.some((i) => i.type === 'exam');
            const hasAssignments = dayItems.some((i) => i.type !== 'exam');
            const hasCheckpoints = dayCheckpoints.length > 0;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDateStr(dateStr)}
                className={`min-h-[78px] sm:min-h-[92px] p-1.5 text-left rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'ring-2 ring-pink-300 border-pink-300 bg-pink-50/70 dark:bg-pink-950/40 shadow-sm'
                    : isToday
                    ? 'border-pink-200 dark:border-pink-800 bg-pink-50/30 dark:bg-pink-950/20'
                    : dayObj.isCurrentMonth
                    ? 'border-pink-100/70 dark:border-pink-900/30 bg-white dark:bg-[#23121d] hover:border-pink-200 dark:hover:border-pink-800'
                    : 'border-transparent bg-pink-50/20 dark:bg-pink-950/10 text-slate-300 dark:text-pink-900/60'
                }`}
              >
                {/* Day Number and Badges */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-mono tabular-nums font-semibold ${
                      isToday
                        ? 'w-5 h-5 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 text-white flex items-center justify-center text-[11px] shadow-sm shadow-pink-200/50'
                        : dayObj.isCurrentMonth
                        ? 'text-slate-800 dark:text-pink-100'
                        : 'text-slate-400 dark:text-pink-900/60'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {/* Indicators */}
                  <div className="flex items-center gap-1">
                    {hasExams && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" title="Exam date" />
                    )}
                    {hasCheckpoints && (
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-400" title="Study checkpoint" />
                    )}
                  </div>
                </div>

                {/* Compact Item chips */}
                <div className="w-full space-y-1 mt-1 overflow-hidden">
                  {dayItems.slice(0, 2).map((item) => {
                    const c = courses.find((course) => course.id === item.courseId);
                    const theme = getCourseTheme(c?.color);
                    return (
                      <div
                        key={item.id}
                        className={`truncate text-[10px] px-1.5 py-0.5 rounded-md ${
                          item.completed
                            ? 'line-through text-slate-400 dark:text-slate-500 bg-pink-50/40 dark:bg-pink-950/30'
                            : item.type === 'exam'
                            ? 'font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200 border border-rose-100 dark:border-rose-900/50'
                            : `${theme.badgeBg} ${theme.badgeText} font-medium`
                        }`}
                        title={item.title}
                      >
                        {item.type === 'exam' ? '★ ' : ''}
                        {c?.code || ''}: {item.title}
                      </div>
                    );
                  })}

                  {dayCheckpoints.length > 0 && dayItems.length === 0 && (
                    <div
                      className="truncate text-[10px] px-1.5 py-0.5 rounded-md bg-pink-50/80 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 font-medium border border-pink-100/70 dark:border-pink-900/50"
                      title={dayCheckpoints[0].checkpoint.title}
                    >
                      Prep: {dayCheckpoints[0].checkpoint.title}
                    </div>
                  )}

                  {dayItems.length > 2 && (
                    <div className="text-[9px] text-pink-400/80 font-mono pl-1">
                      +{dayItems.length - 2} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Inspector Panel */}
      <div className="bg-white dark:bg-[#23121d] border border-pink-100 dark:border-pink-900/40 rounded-2xl p-5 shadow-[0_2px_12px_-2px_rgba(244,114,182,0.06)] flex flex-col h-full">
        <div className="flex items-center justify-between pb-3 border-b border-pink-100/80 dark:border-pink-900/40 mb-4">
          <div>
            <span className="text-xs font-semibold text-pink-500 dark:text-pink-400 uppercase tracking-wider block">
              Day Agenda
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-pink-50">
              {formatDate(selectedDateStr, { includeDayOfWeek: true })}
            </h3>
          </div>

          <button
            onClick={() => onOpenAddWithDate(selectedDateStr)}
            className="p-1.5 text-xs font-medium text-pink-600 dark:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-lg transition-colors flex items-center gap-1 border border-pink-100 dark:border-pink-900/40"
            title="Add task on this date"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>

        {/* Content list for this day */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Deliverables Section */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 dark:text-pink-300/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-pink-400" />
              <span>Deliverables & Exams ({selectedDayItems.length})</span>
            </h4>

            {selectedDayItems.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-pink-900/60 italic py-2">
                No assignments or exams due on this date.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedDayItems.map((item) => {
                  const course = courses.find((c) => c.id === item.courseId);
                  const theme = getCourseTheme(course?.color);
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border text-xs transition-colors ${
                        item.completed
                          ? 'border-pink-100/60 dark:border-pink-900/40 bg-pink-50/20 dark:bg-pink-950/20 opacity-70'
                          : item.type === 'exam'
                          ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20'
                          : 'border-pink-100/80 dark:border-pink-900/40 bg-[#FFFDFE] dark:bg-[#1f101a]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <button
                          onClick={() => onToggleComplete(item.id)}
                          className="mt-0.5 text-slate-300 hover:text-pink-500 dark:hover:text-pink-300 shrink-0"
                        >
                          {item.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-pink-500 dark:text-pink-400" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-semibold ${theme.badgeText}`}>
                              {course?.code}
                            </span>
                            <span aria-hidden="true" className="text-pink-200">·</span>
                            <span className="capitalize font-medium text-slate-600 dark:text-pink-300">
                              {item.type}
                            </span>
                            {item.time && (
                              <>
                                <span aria-hidden="true" className="text-pink-200">·</span>
                                <span className="font-mono text-slate-500 dark:text-pink-400/80">{item.time}</span>
                              </>
                            )}
                          </div>
                          <p
                            className={`font-semibold text-slate-900 dark:text-pink-100 ${
                              item.completed ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {item.title}
                          </p>
                          {item.weight && (
                            <span className="text-[11px] text-slate-500 dark:text-pink-400/70 block mt-0.5">
                              Weight: {item.weight}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Study Checkpoints Section */}
          <div>
            <h4 className="text-xs font-semibold text-slate-500 dark:text-pink-300/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-pink-400" />
              <span>Study Checkpoints Scheduled ({selectedDayCheckpoints.length})</span>
            </h4>

            {selectedDayCheckpoints.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-pink-900/60 italic py-2">
                No study checkpoints targeted for this day.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedDayCheckpoints.map(({ item, checkpoint }) => {
                  const course = courses.find((c) => c.id === item.courseId);
                  return (
                    <div
                      key={checkpoint.id}
                      className="p-3 rounded-xl border border-pink-100/90 dark:border-pink-900/50 bg-[#FFF7F9] dark:bg-pink-950/20 text-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <button
                          onClick={() => onToggleCheckpoint(item.id, checkpoint.id)}
                          className="mt-0.5 text-slate-300 hover:text-pink-500 dark:hover:text-pink-300 shrink-0"
                        >
                          {checkpoint.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-pink-500 dark:text-pink-400" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <div>
                          <span className="font-semibold text-pink-900 dark:text-pink-200 block">
                            {checkpoint.title}
                          </span>
                          <span className="text-[11px] text-slate-600 dark:text-pink-300/80 block mt-0.5">
                            Exam: {course?.code} - {item.title} (due {formatDate(item.dueDate, { shortMonth: true })})
                          </span>
                          {checkpoint.notes && (
                            <span className="text-[11px] text-slate-500 dark:text-pink-400/70 italic block mt-0.5">
                              {checkpoint.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
