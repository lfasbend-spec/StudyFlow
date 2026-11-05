/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Course, AcademicItem, ViewMode, FilterState, ItemType } from './types';
import { INITIAL_COURSES, INITIAL_ITEMS } from './data/seedData';
import { Navbar } from './components/Navbar';
import { StatsBanner } from './components/StatsBanner';
import { ItemCard } from './components/ItemCard';
import { CalendarView } from './components/CalendarView';
import { CourseManager } from './components/CourseManager';
import { GradeTrackerView } from './components/GradeTrackerView';
import { TimelineFilters } from './components/TimelineFilters';
import { SyllabusImportModal } from './components/SyllabusImportModal';
import { AddItemModal } from './components/AddItemModal';
import { PomodoroTimer } from './components/PomodoroTimer';
import { DailyStudyCoachCard } from './components/DailyStudyCoachCard';
import { getDaysDifference } from './utils/dateUtils';
import { calculateSemesterGpa } from './utils/gradeUtils';
import { CheckSquare, Calendar, Sparkles, Plus, AlertCircle, BookOpen, Award } from 'lucide-react';

const STORAGE_COURSES_KEY = 'studyflow_courses_v1';
const STORAGE_ITEMS_KEY = 'studyflow_items_v1';
const STORAGE_THEME_KEY = 'studyflow_theme_v1';

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_THEME_KEY);
    return saved ? saved === 'dark' : false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_THEME_KEY, 'light');
    }
  }, [isDark]);

  // Core Data State
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_COURSES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse courses from storage', e);
    }
    return INITIAL_COURSES;
  });

  const [items, setItems] = useState<AcademicItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ITEMS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse items from storage', e);
    }
    return INITIAL_ITEMS;
  });

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_COURSES_KEY, JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_ITEMS_KEY, JSON.stringify(items));
  }, [items]);

  // View & Filter State
  const [currentView, setCurrentView] = useState<ViewMode>('timeline');
  const [filter, setFilter] = useState<FilterState>({
    searchQuery: '',
    selectedCourseId: 'all',
    selectedType: 'all',
    showCompleted: true,
  });
  const [sortBy, setSortBy] = useState<'date' | 'weight' | 'course'>('date');

  // Modals & Focus Timer
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<AcademicItem | null>(null);
  const [addModalDefaultDate, setAddModalDefaultDate] = useState<string | undefined>(undefined);
  const [isPomodoroOpen, setIsPomodoroOpen] = useState<boolean>(false);
  const [pomodoroItem, setPomodoroItem] = useState<AcademicItem | null>(null);

  const handleStartPomodoro = (item?: AcademicItem) => {
    setPomodoroItem(item || null);
    setIsPomodoroOpen(true);
  };

  // Handlers for Items
  const handleToggleComplete = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              completed: !item.completed,
              completedAt: !item.completed ? new Date().toISOString() : undefined,
            }
          : item
      )
    );
  };

  const handleToggleCheckpoint = (itemId: string, checkpointId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId || !item.studyCheckpoints) return item;
        const updatedCheckpoints = item.studyCheckpoints.map((chk) =>
          chk.id === checkpointId ? { ...chk, completed: !chk.completed } : chk
        );
        return {
          ...item,
          studyCheckpoints: updatedCheckpoints,
        };
      })
    );
  };

  const handleAddCheckpoint = (itemId: string, title: string, targetDate: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const newChk = {
          id: `chk-${Date.now()}`,
          title,
          targetDate,
          completed: false,
        };
        return {
          ...item,
          studyCheckpoints: [...(item.studyCheckpoints || []), newChk],
        };
      })
    );
  };

  const handleDeleteCheckpoint = (itemId: string, checkpointId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId || !item.studyCheckpoints) return item;
        return {
          ...item,
          studyCheckpoints: item.studyCheckpoints.filter((c) => c.id !== checkpointId),
        };
      })
    );
  };

  const handleSaveItem = (savedItem: AcademicItem) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === savedItem.id);
      if (exists) {
        return prev.map((i) => (i.id === savedItem.id ? savedItem : i));
      }
      return [savedItem, ...prev];
    });
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Grade Tracking Handlers
  const handleUpdateItemGrade = (
    itemId: string,
    score: number,
    maxScore: number,
    gradedDate?: string
  ) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              score,
              maxScore,
              gradedDate: gradedDate || new Date().toISOString().split('T')[0],
              completed: true,
              completedAt: item.completedAt || new Date().toISOString(),
            }
          : item
      )
    );
  };

  const handleRemoveItemGrade = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              score: undefined,
              maxScore: undefined,
              gradedDate: undefined,
            }
          : item
      )
    );
  };

  // Handlers for Courses
  const handleAddCourse = (newCourse: Course) => {
    setCourses((prev) => [...prev, newCourse]);
  };

  const handleUpdateCourse = (updated: Course) => {
    setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleDeleteCourse = (courseId: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    setItems((prev) => prev.filter((i) => i.courseId !== courseId));
  };

  const handleImportComplete = (newCourse: Course, newItems: AcademicItem[]) => {
    setCourses((prev) => {
      // Check if course code already exists
      const existingIdx = prev.findIndex(
        (c) => c.code.toLowerCase() === newCourse.code.toLowerCase()
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], ...newCourse, id: copy[existingIdx].id };
        return copy;
      }
      return [...prev, newCourse];
    });

    setItems((prev) => [...newItems, ...prev]);
  };

  const handleResetSeedData = () => {
    if (confirm('Reset workspace with sample university courses, assignments, and exams?')) {
      setCourses(INITIAL_COURSES);
      setItems(INITIAL_ITEMS);
    }
  };

  // Filtered & Sorted Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search query
      if (filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesNotes = item.notes?.toLowerCase().includes(q);
        const course = courses.find((c) => c.id === item.courseId);
        const matchesCourse = course?.code.toLowerCase().includes(q) || course?.name.toLowerCase().includes(q);
        if (!matchesTitle && !matchesNotes && !matchesCourse) return false;
      }

      // Course filter
      if (filter.selectedCourseId !== 'all' && item.courseId !== filter.selectedCourseId) {
        return false;
      }

      // Type filter
      if (filter.selectedType !== 'all' && item.type !== filter.selectedType) {
        return false;
      }

      // Completed filter
      if (!filter.showCompleted && item.completed) {
        return false;
      }

      return true;
    });
  }, [items, courses, filter]);

  const sortedItems = useMemo(() => {
    const list = [...filteredItems];
    if (sortBy === 'date') {
      return list.sort((a, b) => {
        // Incomplete items first, then by date
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else if (sortBy === 'weight') {
      return list.sort((a, b) => {
        const extractNum = (w?: string) => {
          if (!w) return 0;
          const match = w.match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        };
        return extractNum(b.weight) - extractNum(a.weight);
      });
    } else if (sortBy === 'course') {
      return list.sort((a, b) => {
        const ca = courses.find((c) => c.id === a.courseId)?.code || '';
        const cb = courses.find((c) => c.id === b.courseId)?.code || '';
        return ca.localeCompare(cb);
      });
    }
    return list;
  }, [filteredItems, sortBy, courses]);

  // Group items by urgency for timeline view
  const groupedTimeline = useMemo(() => {
    const todayAndTomorrow: AcademicItem[] = [];
    const thisWeek: AcademicItem[] = [];
    const nextWeek: AcademicItem[] = [];
    const later: AcademicItem[] = [];
    const completed: AcademicItem[] = [];

    sortedItems.forEach((item) => {
      if (item.completed) {
        completed.push(item);
        return;
      }

      const diff = getDaysDifference(item.dueDate);
      if (diff <= 1) {
        todayAndTomorrow.push(item);
      } else if (diff <= 7) {
        thisWeek.push(item);
      } else if (diff <= 14) {
        nextWeek.push(item);
      } else {
        later.push(item);
      }
    });

    return { todayAndTomorrow, thisWeek, nextWeek, later, completed };
  }, [sortedItems]);

  const totalPendingCount = items.filter((i) => !i.completed).length;
  const upcomingExamsCount = items.filter((i) => i.type === 'exam' && !i.completed).length;
  const cumulativeGpa = calculateSemesterGpa(courses, items).gpa;

  return (
    <div className="min-h-screen bg-[#FFF7F9] dark:bg-[#1A0E17] text-slate-800 dark:text-pink-50 flex flex-col transition-colors selection:bg-pink-100 selection:text-pink-800">
      {/* Top Navbar adhering to Top Bar Contract */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenAdd={() => {
          setEditingItem(null);
          setAddModalDefaultDate(undefined);
          setIsAddModalOpen(true);
        }}
        onOpenPomodoro={() => handleStartPomodoro()}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        totalPendingCount={totalPendingCount}
        upcomingExamsCount={upcomingExamsCount}
        cumulativeGpa={cumulativeGpa}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* VIEW 1: TIMELINE & TO-DO LIST */}
        {currentView === 'timeline' && (
          <div>
            {/* High-level status banner with nearest exam prioritization & GPA */}
            <StatsBanner
              items={items}
              courses={courses}
              onOpenAdd={() => {
                setEditingItem(null);
                setAddModalDefaultDate(undefined);
                setIsAddModalOpen(true);
              }}
              onOpenImport={() => setIsImportModalOpen(true)}
              onFilterExamsOnly={() => setFilter({ ...filter, selectedType: 'exam' })}
              onNavigateToGrades={() => setCurrentView('grades')}
            />

            {/* Daily Personalized Study Tip & Productivity Quote Card */}
            <DailyStudyCoachCard
              items={items}
              courses={courses}
              onStartPomodoro={handleStartPomodoro}
            />

            {/* Filter and Search Bar */}
            <TimelineFilters
              filter={filter}
              onFilterChange={setFilter}
              courses={courses}
              sortBy={sortBy}
              onSortChange={setSortBy}
              itemsCount={sortedItems.length}
            />

            {/* Empty state */}
            {sortedItems.length === 0 && (
              <div className="bg-white dark:bg-[#23121d] border border-pink-100 dark:border-pink-900/40 rounded-2xl p-12 text-center shadow-[0_2px_12px_-2px_rgba(244,114,182,0.06)]">
                <BookOpen className="w-12 h-12 text-pink-400 mx-auto mb-3 opacity-80" />
                <h3 className="text-base font-bold text-slate-800 dark:text-pink-100 mb-1">
                  No deliverables match your active filter
                </h3>
                <p className="text-xs text-slate-500 dark:text-pink-300/80 max-w-md mx-auto mb-5">
                  Try clearing your search query or import a course syllabus to automatically populate assignments and test dates.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() =>
                      setFilter({
                        searchQuery: '',
                        selectedCourseId: 'all',
                        selectedType: 'all',
                        showCompleted: true,
                      })
                    }
                    className="px-3.5 py-2 text-xs font-semibold text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/60 border border-pink-100 dark:border-pink-900/50 rounded-xl hover:bg-pink-100"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-pink-400 via-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 rounded-xl shadow-sm shadow-pink-200/50"
                  >
                    Import Syllabus
                  </button>
                </div>
              </div>
            )}

            {/* Chronological Timeline Groups */}
            <div className="space-y-6">
              {/* Group 1: Today & Tomorrow */}
              {groupedTimeline.todayAndTomorrow.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                      Due Today & Tomorrow ({groupedTimeline.todayAndTomorrow.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {groupedTimeline.todayAndTomorrow.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        course={courses.find((c) => c.id === item.courseId)}
                        onToggleComplete={handleToggleComplete}
                        onToggleCheckpoint={handleToggleCheckpoint}
                        onAddCheckpoint={handleAddCheckpoint}
                        onDeleteCheckpoint={handleDeleteCheckpoint}
                        onEditItem={(it) => {
                          setEditingItem(it);
                          setIsAddModalOpen(true);
                        }}
                        onDeleteItem={handleDeleteItem}
                        onLogGrade={() => setCurrentView('grades')}
                        onStartPomodoro={handleStartPomodoro}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Group 2: This Week */}
              {groupedTimeline.thisWeek.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-pink-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-pink-700 dark:text-pink-300">
                      Coming Up This Week (Next 7 Days) ({groupedTimeline.thisWeek.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {groupedTimeline.thisWeek.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        course={courses.find((c) => c.id === item.courseId)}
                        onToggleComplete={handleToggleComplete}
                        onToggleCheckpoint={handleToggleCheckpoint}
                        onAddCheckpoint={handleAddCheckpoint}
                        onDeleteCheckpoint={handleDeleteCheckpoint}
                        onEditItem={(it) => {
                          setEditingItem(it);
                          setIsAddModalOpen(true);
                        }}
                        onDeleteItem={handleDeleteItem}
                        onLogGrade={() => setCurrentView('grades')}
                        onStartPomodoro={handleStartPomodoro}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Group 3: Next Week */}
              {groupedTimeline.nextWeek.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-pink-300 dark:bg-pink-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-pink-300/80">
                      Next Week (8 - 14 Days Out) ({groupedTimeline.nextWeek.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {groupedTimeline.nextWeek.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        course={courses.find((c) => c.id === item.courseId)}
                        onToggleComplete={handleToggleComplete}
                        onToggleCheckpoint={handleToggleCheckpoint}
                        onAddCheckpoint={handleAddCheckpoint}
                        onDeleteCheckpoint={handleDeleteCheckpoint}
                        onEditItem={(it) => {
                          setEditingItem(it);
                          setIsAddModalOpen(true);
                        }}
                        onDeleteItem={handleDeleteItem}
                        onLogGrade={() => setCurrentView('grades')}
                        onStartPomodoro={handleStartPomodoro}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Group 4: Later this semester */}
              {groupedTimeline.later.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-pink-200 dark:bg-pink-800" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-pink-400/70">
                      Later This Semester ({groupedTimeline.later.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {groupedTimeline.later.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        course={courses.find((c) => c.id === item.courseId)}
                        onToggleComplete={handleToggleComplete}
                        onToggleCheckpoint={handleToggleCheckpoint}
                        onAddCheckpoint={handleAddCheckpoint}
                        onDeleteCheckpoint={handleDeleteCheckpoint}
                        onEditItem={(it) => {
                          setEditingItem(it);
                          setIsAddModalOpen(true);
                        }}
                        onDeleteItem={handleDeleteItem}
                        onLogGrade={() => setCurrentView('grades')}
                        onStartPomodoro={handleStartPomodoro}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Group 5: Completed */}
              {filter.showCompleted && groupedTimeline.completed.length > 0 && (
                <div className="pt-4 border-t border-pink-100/80 dark:border-pink-900/40">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Completed Deliverables ({groupedTimeline.completed.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {groupedTimeline.completed.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        course={courses.find((c) => c.id === item.courseId)}
                        onToggleComplete={handleToggleComplete}
                        onToggleCheckpoint={handleToggleCheckpoint}
                        onAddCheckpoint={handleAddCheckpoint}
                        onDeleteCheckpoint={handleDeleteCheckpoint}
                        onEditItem={(it) => {
                          setEditingItem(it);
                          setIsAddModalOpen(true);
                        }}
                        onDeleteItem={handleDeleteItem}
                        onLogGrade={() => setCurrentView('grades')}
                        onStartPomodoro={handleStartPomodoro}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: MONTHLY CALENDAR GRID */}
        {currentView === 'calendar' && (
          <div>
            <CalendarView
              items={items}
              courses={courses}
              onToggleComplete={handleToggleComplete}
              onToggleCheckpoint={handleToggleCheckpoint}
              onStartPomodoro={handleStartPomodoro}
              onOpenAddWithDate={(dateStr) => {
                setEditingItem(null);
                setAddModalDefaultDate(dateStr);
                setIsAddModalOpen(true);
              }}
            />
          </div>
        )}

        {/* VIEW 3: COURSE ROSTER MANAGER */}
        {currentView === 'courses' && (
          <div>
            <CourseManager
              courses={courses}
              items={items}
              onAddCourse={handleAddCourse}
              onUpdateCourse={handleUpdateCourse}
              onDeleteCourse={handleDeleteCourse}
              onResetSeedData={handleResetSeedData}
              onOpenImport={() => setIsImportModalOpen(true)}
            />
          </div>
        )}

        {/* VIEW 4: GRADE TRACKER & PROGRESS CHART */}
        {currentView === 'grades' && (
          <div>
            <GradeTrackerView
              courses={courses}
              items={items}
              onUpdateItemGrade={handleUpdateItemGrade}
              onRemoveItemGrade={handleRemoveItemGrade}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-pink-100/80 dark:border-pink-900/40 py-6 mt-12 bg-white/70 dark:bg-[#1f101a]/70 backdrop-blur-sm text-center text-xs text-slate-500 dark:text-pink-300/80">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-pink-200">StudyFlow</span>
            <span aria-hidden="true" className="text-pink-200">·</span>
            <span>Academic Deadline & Exam Milestone Manager</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span>{totalPendingCount} pending tasks</span>
            <span aria-hidden="true" className="text-pink-200">·</span>
            <span>{courses.length} active courses</span>
          </div>
        </div>
      </footer>

      {/* Modals & Focus Timer */}
      <SyllabusImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onSaveItem={handleSaveItem}
        courses={courses}
        initialItem={editingItem}
        defaultDate={addModalDefaultDate}
      />

      <PomodoroTimer
        isOpen={isPomodoroOpen}
        onClose={() => setIsPomodoroOpen(false)}
        activeItem={pomodoroItem}
        items={items}
        courses={courses}
        onSelectTask={(it) => setPomodoroItem(it)}
        onToggleItemComplete={handleToggleComplete}
        onToggleCheckpoint={handleToggleCheckpoint}
      />
    </div>
  );
}
