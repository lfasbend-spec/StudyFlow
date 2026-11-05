import React from 'react';
import { Course, ItemType, FilterState } from '../types';
import { getCourseTheme } from '../utils/courseTheme';
import { Search, Filter, CheckSquare, ArrowUpDown } from 'lucide-react';

interface TimelineFiltersProps {
  filter: FilterState;
  onFilterChange: (newFilter: FilterState) => void;
  courses: Course[];
  sortBy: 'date' | 'weight' | 'course';
  onSortChange: (sort: 'date' | 'weight' | 'course') => void;
  itemsCount: number;
}

export const TimelineFilters: React.FC<TimelineFiltersProps> = ({
  filter,
  onFilterChange,
  courses,
  sortBy,
  onSortChange,
  itemsCount,
}) => {
  return (
    <div className="bg-white dark:bg-[#23121d] border border-pink-100 dark:border-pink-900/40 rounded-2xl p-4 mb-6 shadow-[0_2px_12px_-2px_rgba(244,114,182,0.06)] space-y-3.5">
      {/* Top Row: Search and Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-pink-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks, exams, chapters, or notes..."
            value={filter.searchQuery}
            onChange={(e) => onFilterChange({ ...filter, searchQuery: e.target.value })}
            className="w-full pl-9 pr-4 py-2 text-xs bg-pink-50/30 dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 text-slate-900 dark:text-pink-50 placeholder-pink-300/80 dark:placeholder-pink-800"
          />
          {filter.searchQuery && (
            <button
              onClick={() => onFilterChange({ ...filter, searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-pink-400 hover:text-pink-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Sort & Completed Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-pink-300/80">
            <ArrowUpDown className="w-3.5 h-3.5 text-pink-400" />
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className="px-2.5 py-1 text-xs bg-pink-50/50 dark:bg-pink-950/40 border border-pink-100 dark:border-pink-900/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 text-slate-800 dark:text-pink-200 font-medium"
            >
              <option value="date">Due Date (Earliest)</option>
              <option value="weight">Grade Weight</option>
              <option value="course">Course Code</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-pink-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filter.showCompleted}
              onChange={(e) => onFilterChange({ ...filter, showCompleted: e.target.checked })}
              className="rounded border-pink-200 dark:border-pink-800 text-pink-500 focus:ring-pink-300"
            />
            <span>Show Completed</span>
          </label>
        </div>
      </div>

      {/* Course Filter Bar (Segmented Control Buttons) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 dark:text-pink-400/70 text-xs shrink-0 mr-1">Course:</span>
        <button
          onClick={() => onFilterChange({ ...filter, selectedCourseId: 'all' })}
          className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap shrink-0 font-medium ${
            filter.selectedCourseId === 'all'
              ? 'bg-pink-100/70 text-pink-800 dark:bg-pink-950/70 dark:text-pink-200 border border-pink-200/60 shadow-sm'
              : 'text-slate-600 dark:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-950/40'
          }`}
        >
          All Courses
        </button>

        {courses.map((course) => {
          const isSelected = filter.selectedCourseId === course.id;
          const theme = getCourseTheme(course.color);
          return (
            <button
              key={course.id}
              onClick={() => onFilterChange({ ...filter, selectedCourseId: course.id })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap shrink-0 font-medium ${
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

      {/* Deliverable Type Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs pt-1.5 border-t border-pink-100/80 dark:border-pink-900/40">
        <span className="text-slate-400 dark:text-pink-400/70 text-xs shrink-0 mr-1">Type:</span>
        {(
          [
            { id: 'all', label: 'All Types' },
            { id: 'exam', label: 'Exams Only' },
            { id: 'assignment', label: 'Assignments' },
            { id: 'quiz', label: 'Quizzes' },
            { id: 'project', label: 'Projects' },
          ] as const
        ).map((tab) => {
          const isSelected = filter.selectedType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onFilterChange({ ...filter, selectedType: tab.id as any })}
              className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap shrink-0 font-medium ${
                isSelected
                  ? 'bg-pink-100/70 dark:bg-pink-950/70 text-pink-800 dark:text-pink-200 border border-pink-200/60 font-semibold'
                  : 'text-slate-600 dark:text-pink-300 hover:text-slate-900 dark:hover:text-white hover:bg-pink-50/50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}

        <div className="ml-auto text-pink-400/80 font-mono text-[11px] shrink-0">
          Showing {itemsCount} items
        </div>
      </div>
    </div>
  );
};
