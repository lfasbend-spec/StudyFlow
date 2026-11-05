import React from 'react';
import { ViewMode } from '../types';
import { Sparkles, Calendar, CheckSquare, BookOpen, Sun, Moon, Plus, Award, Clock } from 'lucide-react';

interface NavbarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onOpenImport: () => void;
  onOpenAdd: () => void;
  onOpenPomodoro?: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  totalPendingCount: number;
  upcomingExamsCount: number;
  cumulativeGpa?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  onOpenImport,
  onOpenAdd,
  onOpenPomodoro,
  isDark,
  onToggleTheme,
  totalPendingCount,
  upcomingExamsCount,
  cumulativeGpa,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#1f101a]/90 backdrop-blur-md border-b border-pink-100 dark:border-pink-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Strictly compliant with Top Bar Contract: Zone 1 (Wordmark) — Zone 2 (Nav links) — Zone 3 (1 Primary Action + theme) */}
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onViewChange('timeline')}
              className="text-left group flex items-center gap-2.5 focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-300 via-pink-400 to-rose-300 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-pink-200/60 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-800 dark:text-pink-50 whitespace-nowrap">
                  StudyFlow
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-mono text-pink-400/90 dark:text-pink-300 font-medium">
                  pastel
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onViewChange('timeline')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'timeline'
                  ? 'bg-pink-100/70 dark:bg-pink-950/60 text-pink-800 dark:text-pink-200 border border-pink-200/60 dark:border-pink-900/50 shadow-xs'
                  : 'text-slate-600 dark:text-pink-200/70 hover:text-pink-700 dark:hover:text-pink-100 hover:bg-pink-50/70 dark:hover:bg-pink-950/30'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-pink-400" />
              <span>Timeline & To-Do</span>
              {totalPendingCount > 0 && (
                <span className="text-xs font-mono tabular-nums text-pink-600 dark:text-pink-300 font-semibold">
                  {totalPendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onViewChange('calendar')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'calendar'
                  ? 'bg-pink-100/70 dark:bg-pink-950/60 text-pink-800 dark:text-pink-200 border border-pink-200/60 dark:border-pink-900/50 shadow-xs'
                  : 'text-slate-600 dark:text-pink-200/70 hover:text-pink-700 dark:hover:text-pink-100 hover:bg-pink-50/70 dark:hover:bg-pink-950/30'
              }`}
            >
              <Calendar className="w-4 h-4 text-pink-400" />
              <span>Calendar</span>
              {upcomingExamsCount > 0 && (
                <span className="text-xs font-mono tabular-nums text-pink-600 dark:text-pink-300 font-semibold">
                  {upcomingExamsCount} exams
                </span>
              )}
            </button>

            <button
              onClick={() => onViewChange('grades')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'grades'
                  ? 'bg-pink-100/70 dark:bg-pink-950/60 text-pink-800 dark:text-pink-200 border border-pink-200/60 dark:border-pink-900/50 shadow-xs'
                  : 'text-slate-600 dark:text-pink-200/70 hover:text-pink-700 dark:hover:text-pink-100 hover:bg-pink-50/70 dark:hover:bg-pink-950/30'
              }`}
            >
              <Award className="w-4 h-4 text-pink-400" />
              <span>Grade Tracker</span>
              {cumulativeGpa !== undefined && (
                <span className="text-xs font-mono tabular-nums text-pink-600 dark:text-pink-300 font-bold">
                  {cumulativeGpa.toFixed(2)}
                </span>
              )}
            </button>

            <button
              onClick={() => onViewChange('courses')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'courses'
                  ? 'bg-pink-100/70 dark:bg-pink-950/60 text-pink-800 dark:text-pink-200 border border-pink-200/60 dark:border-pink-900/50 shadow-xs'
                  : 'text-slate-600 dark:text-pink-200/70 hover:text-pink-700 dark:hover:text-pink-100 hover:bg-pink-50/70 dark:hover:bg-pink-950/30'
              }`}
            >
              <BookOpen className="w-4 h-4 text-pink-400" />
              <span>Courses</span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action + Pomodoro timer + theme toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {onOpenPomodoro && (
              <button
                onClick={onOpenPomodoro}
                aria-label="Open Pomodoro Timer"
                title="Pomodoro Study Timer"
                className="px-2.5 py-1.5 text-xs font-semibold text-pink-700 dark:text-pink-300 bg-pink-50/80 hover:bg-pink-100 dark:bg-pink-950/50 dark:hover:bg-pink-900/50 border border-pink-100 dark:border-pink-900/40 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-pink-500" />
                <span className="hidden md:inline">Focus Timer</span>
              </button>
            )}

            <button
              onClick={onToggleTheme}
              aria-label="Toggle color theme"
              className="p-2 text-slate-500 dark:text-pink-300/80 hover:text-pink-600 dark:hover:text-pink-200 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-950/40 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenAdd}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-pink-700 dark:text-pink-200 bg-pink-50/90 dark:bg-pink-950/50 hover:bg-pink-100 border border-pink-200/60 dark:border-pink-900/50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-pink-500" />
              <span>Add Task</span>
            </button>

            <button
              onClick={onOpenImport}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-pink-400 via-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 rounded-lg shadow-sm shadow-pink-200/60 hover:shadow transition-all whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-100" />
              <span>Import Syllabus</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
