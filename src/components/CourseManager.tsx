import React, { useState } from 'react';
import { Course, AcademicItem } from '../types';
import { getCourseTheme } from '../utils/courseTheme';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Award,
  CheckCircle2,
  Calendar,
  Sparkles,
  RotateCcw,
  User,
  GraduationCap,
} from 'lucide-react';

interface CourseManagerProps {
  courses: Course[];
  items: AcademicItem[];
  onAddCourse: (course: Course) => void;
  onUpdateCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  onResetSeedData: () => void;
  onOpenImport: () => void;
}

export const CourseManager: React.FC<CourseManagerProps> = ({
  courses,
  items,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onResetSeedData,
  onOpenImport,
}) => {
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isAddingCourse, setIsAddingCourse] = useState<boolean>(false);
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [instructor, setInstructor] = useState('');
  const [targetGrade, setTargetGrade] = useState('A');
  const [color, setColor] = useState('pink');
  const [description, setDescription] = useState('');

  const handleStartAdd = () => {
    setCourseCode('');
    setCourseName('');
    setInstructor('');
    setTargetGrade('A');
    setColor('pink');
    setDescription('');
    setIsAddingCourse(true);
  };

  const handleStartEdit = (c: Course) => {
    setEditingCourse(c);
    setCourseCode(c.code);
    setCourseName(c.name);
    setInstructor(c.instructor || '');
    setTargetGrade(c.targetGrade || 'A');
    setColor(c.color);
    setDescription(c.description || '');
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode.trim() || !courseName.trim()) return;

    if (editingCourse) {
      onUpdateCourse({
        ...editingCourse,
        code: courseCode.trim(),
        name: courseName.trim(),
        instructor: instructor.trim() || undefined,
        targetGrade: targetGrade.trim() || undefined,
        color,
        description: description.trim() || undefined,
      });
      setEditingCourse(null);
    } else {
      const newCourse: Course = {
        id: `course-${Date.now()}`,
        code: courseCode.trim(),
        name: courseName.trim(),
        instructor: instructor.trim() || undefined,
        targetGrade: targetGrade.trim() || undefined,
        color,
        description: description.trim() || undefined,
      };
      onAddCourse(newCourse);
      setIsAddingCourse(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#23121d] border border-pink-100 dark:border-pink-900/40 rounded-2xl p-5 shadow-[0_2px_12px_-2px_rgba(244,114,182,0.06)]">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-pink-50 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-pink-500 dark:text-pink-400" />
            <span>Enrolled Course Roster</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-pink-300/80 mt-0.5">
            Manage course targets, instructors, colors, and syllabus details.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onResetSeedData}
            title="Reset to default sample university courses"
            className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-pink-300 hover:text-slate-900 hover:bg-pink-50 dark:hover:bg-pink-950/40 border border-pink-100 dark:border-pink-900/40 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>

          <button
            onClick={onOpenImport}
            className="px-3.5 py-2 text-xs font-semibold text-pink-700 dark:text-pink-300 bg-pink-50/80 dark:bg-pink-950/60 hover:bg-pink-100 dark:hover:bg-pink-900/60 border border-pink-100 dark:border-pink-900/50 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Import Syllabus</span>
          </button>

          <button
            onClick={handleStartAdd}
            className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-pink-400 via-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 rounded-xl shadow-sm shadow-pink-200/50 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {courses.map((course) => {
          const theme = getCourseTheme(course.color);
          const courseItems = items.filter((i) => i.courseId === course.id);
          const completedCount = courseItems.filter((i) => i.completed).length;
          const totalCount = courseItems.length;
          const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
          const examsCount = courseItems.filter((i) => i.type === 'exam').length;

          return (
            <div
              key={course.id}
              className="bg-white dark:bg-[#23121d] border border-pink-100 dark:border-pink-900/40 rounded-2xl p-5 shadow-[0_2px_12px_-2px_rgba(244,114,182,0.06)] hover:border-pink-200 dark:hover:border-pink-800 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header: Code & Color Bar */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${theme.dotBg}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${theme.badgeText}`}>
                      {course.code}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 dark:text-pink-300">
                    <button
                      onClick={() => handleStartEdit(course)}
                      className="p-1 hover:text-pink-600 dark:hover:text-pink-200 rounded"
                      title="Edit Course"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete ${course.code}?`)) {
                          onDeleteCourse(course.id);
                        }
                      }}
                      className="p-1 hover:text-red-500 rounded"
                      title="Delete Course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-pink-50 leading-snug mb-1">
                  {course.name}
                </h3>

                {course.instructor && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-pink-300/80 mb-2">
                    <User className="w-3 h-3" />
                    <span>{course.instructor}</span>
                  </div>
                )}

                {course.description && (
                  <p className="text-xs text-slate-600 dark:text-pink-300/70 line-clamp-2 mb-3">
                    {course.description}
                  </p>
                )}
              </div>

              {/* Progress & Target Section */}
              <div className="pt-4 border-t border-pink-100/80 dark:border-pink-900/40 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-pink-300/80">Target Grade:</span>
                  <span className="font-bold text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/60 border border-pink-100 dark:border-pink-900/50 px-2 py-0.5 rounded-md text-xs">
                    {course.targetGrade || 'A'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-pink-300/80">Completion</span>
                    <span className="font-mono tabular-nums text-slate-700 dark:text-pink-200 font-semibold">
                      {completedCount}/{totalCount} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-pink-50 dark:bg-pink-950/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${theme.accentBar} rounded-full transition-all duration-300`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-pink-400/80 pt-1">
                  <span>{examsCount} Exams scheduled</span>
                  <span>{courseItems.filter((i) => i.type === 'assignment').length} Assignments</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Course Modal */}
      {(isAddingCourse || editingCourse) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#23121d] border border-pink-100 dark:border-pink-900/40 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-pink-50 mb-4">
              {editingCourse ? 'Edit Course' : 'Add New Course'}
            </h3>

            <form onSubmit={handleSaveCourse} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-pink-200 mb-1">
                  Course Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS 201, CHEM 220"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-pink-50/30 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/60 rounded-xl focus:ring-2 focus:ring-pink-300 text-slate-900 dark:text-pink-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-pink-200 mb-1">
                  Course Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures & Algorithms"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-pink-50/30 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/60 rounded-xl focus:ring-2 focus:ring-pink-300 text-slate-900 dark:text-pink-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-pink-200 mb-1">
                    Instructor
                  </label>
                  <input
                    type="text"
                    placeholder="Prof. Evelyn Vance"
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-pink-50/30 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/60 rounded-xl focus:ring-2 focus:ring-pink-300 text-slate-900 dark:text-pink-50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-pink-200 mb-1">
                    Target Grade
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. A or 95%"
                    value={targetGrade}
                    onChange={(e) => setTargetGrade(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-pink-50/30 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/60 rounded-xl focus:ring-2 focus:ring-pink-300 text-slate-900 dark:text-pink-50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-pink-200 mb-1">
                  Color Tag
                </label>
                <div className="flex items-center gap-2">
                  {['pink', 'rose', 'fuchsia', 'emerald', 'sky', 'amber', 'violet'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        c === 'pink'
                          ? 'bg-pink-400'
                          : c === 'rose'
                          ? 'bg-rose-400'
                          : c === 'fuchsia'
                          ? 'bg-fuchsia-400'
                          : c === 'emerald'
                          ? 'bg-emerald-500'
                          : c === 'sky'
                          ? 'bg-sky-500'
                          : c === 'amber'
                          ? 'bg-amber-500'
                          : 'bg-violet-500'
                      } ${color === c ? 'scale-125 border-pink-300 dark:border-pink-500 shadow-sm' : 'border-transparent opacity-70'}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-pink-200 mb-1">
                  Description / Office Hours
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional details or office hours schedule..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-pink-50/30 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-900/60 rounded-xl focus:ring-2 focus:ring-pink-300 text-slate-900 dark:text-pink-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-pink-100 dark:border-pink-900/40">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCourse(false);
                    setEditingCourse(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-pink-300 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-pink-400 via-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 rounded-xl shadow-sm shadow-pink-200/50"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
