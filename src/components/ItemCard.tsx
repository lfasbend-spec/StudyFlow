import React, { useState } from 'react';
import { AcademicItem, Course, StudyCheckpoint } from '../types';
import { formatDate, getCountdownBadge, getCheckpointCountdown } from '../utils/dateUtils';
import { getCourseTheme } from '../utils/courseTheme';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Calendar,
  AlertTriangle,
  Award,
  MoreVertical,
  Plus,
  Trash2,
  Edit2,
  BookOpen,
  FileText,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ItemCardProps {
  item: AcademicItem;
  course?: Course;
  onToggleComplete: (itemId: string) => void;
  onToggleCheckpoint: (itemId: string, checkpointId: string) => void;
  onAddCheckpoint: (itemId: string, title: string, targetDate: string) => void;
  onDeleteCheckpoint: (itemId: string, checkpointId: string) => void;
  onEditItem: (item: AcademicItem) => void;
  onDeleteItem: (itemId: string) => void;
  onLogGrade?: (item: AcademicItem) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  course,
  onToggleComplete,
  onToggleCheckpoint,
  onAddCheckpoint,
  onDeleteCheckpoint,
  onEditItem,
  onDeleteItem,
  onLogGrade,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [isAddingCheckpoint, setIsAddingCheckpoint] = useState<boolean>(false);
  const [newCheckpointTitle, setNewCheckpointTitle] = useState<string>('');
  const [newCheckpointDate, setNewCheckpointDate] = useState<string>('');

  const countdown = getCountdownBadge(item.dueDate, item.completed);
  const courseTheme = getCourseTheme(course?.color);

  // Checkpoints statistics
  const checkpoints = item.studyCheckpoints || [];
  const totalCheckpoints = checkpoints.length;
  const completedCheckpoints = checkpoints.filter((c) => c.completed).length;
  const allCheckpointsDone = totalCheckpoints > 0 && completedCheckpoints === totalCheckpoints;

  const handleToggleItem = () => {
    onToggleComplete(item.id);
    if (!item.completed) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#FBCFE8', '#F472B6', '#FDA4AF', '#FFF1F2', '#FDE68A'],
      });
    }
  };

  const handleCheckpointToggle = (chkId: string) => {
    onToggleCheckpoint(item.id, chkId);
    const targetChk = checkpoints.find((c) => c.id === chkId);
    if (targetChk && !targetChk.completed) {
      // Check if this was the last pending checkpoint
      if (completedCheckpoints + 1 === totalCheckpoints) {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#FBCFE8', '#F472B6', '#FDA4AF', '#FFF1F2', '#FDE68A'],
        });
      }
    }
  };

  const handleCreateCheckpoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckpointTitle.trim() || !newCheckpointDate) return;
    onAddCheckpoint(item.id, newCheckpointTitle.trim(), newCheckpointDate);
    setNewCheckpointTitle('');
    setNewCheckpointDate('');
    setIsAddingCheckpoint(false);
  };

  // Type styling
  const getTypeBadge = () => {
    switch (item.type) {
      case 'exam':
        return { label: 'Exam', color: 'text-rose-600 dark:text-rose-300 font-bold' };
      case 'quiz':
        return { label: 'Quiz', color: 'text-pink-600 dark:text-pink-300 font-medium' };
      case 'project':
        return { label: 'Project', color: 'text-fuchsia-600 dark:text-fuchsia-300 font-medium' };
      case 'reading':
        return { label: 'Reading', color: 'text-emerald-600 dark:text-emerald-300 font-medium' };
      default:
        return { label: 'Assignment', color: 'text-slate-600 dark:text-slate-300 font-medium' };
    }
  };

  const typeInfo = getTypeBadge();

  return (
    <div
      className={`group relative bg-white dark:bg-[#23121d] border rounded-2xl p-4 sm:p-5 transition-all duration-200 ${
        item.completed
          ? 'border-pink-100/60 dark:border-pink-950/40 bg-pink-50/20 dark:bg-[#1a0e17]/50 opacity-75'
          : item.type === 'exam'
          ? 'border-pink-200/90 dark:border-pink-900/50 shadow-[0_2px_12px_-2px_rgba(244,114,182,0.06)] hover:border-pink-300 dark:hover:border-pink-700'
          : 'border-pink-100/80 dark:border-pink-900/30 shadow-[0_2px_12px_-2px_rgba(244,114,182,0.04)] hover:border-pink-200 dark:hover:border-pink-800'
      }`}
    >
      {/* Top Header Row: Status, Title, Metadata, More Actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Main Item Checkbox */}
          <button
            onClick={handleToggleItem}
            aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
            className="mt-0.5 text-slate-400 hover:text-pink-500 dark:hover:text-pink-300 focus:outline-none transition-colors shrink-0"
          >
            {item.completed ? (
              <CheckCircle2 className="w-5 h-5 text-pink-400 dark:text-pink-300" />
            ) : (
              <Circle className="w-5 h-5 group-hover:text-pink-400" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            {/* Metadata Line: Zero-Pill Unboxed Text with typographic separators */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className={`font-semibold ${courseTheme.badgeText}`}>
                {course?.code || 'General'}
              </span>
              <span aria-hidden="true">·</span>
              <span className={typeInfo.color}>{typeInfo.label}</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 font-mono tabular-nums">
                <Calendar className="w-3 h-3 text-slate-400" />
                {formatDate(item.dueDate, { includeDayOfWeek: true, shortMonth: true })}
              </span>
              {item.time && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{item.time}</span>
                </>
              )}
              {item.weight && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {item.weight}
                  </span>
                </>
              )}
              {item.score !== undefined && item.maxScore !== undefined && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                    Grade: {item.score}/{item.maxScore} ({Math.round((item.score / item.maxScore) * 100)}%)
                  </span>
                </>
              )}
            </div>

            {/* Title */}
            <h3
              className={`text-base font-semibold text-slate-900 dark:text-white leading-snug ${
                item.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
              }`}
            >
              {item.title}
            </h3>

            {/* Location or Notes */}
            {(item.location || item.notes) && (
              <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                {item.location && (
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{item.location}</span>
                  </div>
                )}
                {item.notes && (
                  <p className="line-clamp-2 text-slate-600 dark:text-slate-400 pt-0.5">
                    {item.notes}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Countdown badge & Context Menu */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-xs font-mono tabular-nums px-2.5 py-1 rounded-md font-medium ${
              countdown.urgency === 'completed'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                : countdown.urgency === 'overdue'
                ? 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 font-semibold'
                : countdown.urgency === 'today'
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold animate-pulse'
                : countdown.urgency === 'urgent'
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {countdown.text}
          </span>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20 text-xs">
                  {onLogGrade && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onLogGrade(item);
                      }}
                      className="w-full text-left px-3 py-2 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/50 flex items-center gap-2"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>{item.score !== undefined ? 'Edit Grade' : 'Log Grade'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEditItem(item);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Task</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDeleteItem(item.id);
                    }}
                    className="w-full text-left px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* EXAM / MAJOR PROJECT STUDY CHECKPOINTS SECTION */}
      {checkpoints.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800">
          {/* Header of checkpoints */}
          <div className="flex items-center justify-between gap-3 text-xs mb-2.5">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold hover:text-pink-600 dark:hover:text-pink-400 focus:outline-none"
            >
              <Award className="w-4 h-4 text-pink-500" />
              <span>Exam Prep Checkpoints</span>
              <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400 font-normal">
                ({completedCheckpoints}/{totalCheckpoints} completed)
              </span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Mini Progress Bar */}
            <div className="flex items-center gap-2">
              <div className="w-20 sm:w-28 h-1.5 bg-pink-100/70 dark:bg-pink-950/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    allCheckpointsDone ? 'bg-pink-400' : 'bg-gradient-to-r from-pink-300 via-pink-400 to-rose-300'
                  }`}
                  style={{
                    width: `${totalCheckpoints > 0 ? (completedCheckpoints / totalCheckpoints) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="font-mono tabular-nums text-slate-500 dark:text-pink-300/80 text-[11px]">
                {totalCheckpoints > 0 ? Math.round((completedCheckpoints / totalCheckpoints) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Expandable Checkpoints List */}
          {isExpanded && (
            <div className="space-y-2 mt-2 bg-[#FFF9FB] dark:bg-pink-950/20 rounded-xl p-3 border border-pink-100/80 dark:border-pink-900/40">
              {checkpoints.map((chk, idx) => {
                const chkCountdown = getCheckpointCountdown(chk.targetDate, chk.completed);
                return (
                  <div
                    key={chk.id || idx}
                    className={`flex items-start justify-between gap-3 text-xs py-1.5 px-2 rounded-md transition-colors ${
                      chk.completed
                        ? 'text-slate-400 dark:text-slate-500'
                        : 'text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-[#23121d]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <button
                        onClick={() => handleCheckpointToggle(chk.id)}
                        className="mt-0.5 text-slate-400 hover:text-pink-500 dark:hover:text-pink-300 focus:outline-none transition-colors shrink-0"
                      >
                        {chk.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-pink-400 dark:text-pink-300" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <span
                          className={`font-medium block leading-tight ${
                            chk.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                          }`}
                        >
                          {chk.title}
                        </span>
                        {chk.notes && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            {chk.notes}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[11px] font-mono tabular-nums ${
                          chk.completed
                            ? 'text-slate-400 dark:text-slate-500'
                            : chkCountdown.status === 'due'
                            ? 'text-pink-500 dark:text-pink-300 font-semibold'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {formatDate(chk.targetDate, { shortMonth: true })} ({chkCountdown.text})
                      </span>

                      <button
                        onClick={() => onDeleteCheckpoint(item.id, chk.id)}
                        title="Delete checkpoint"
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add Checkpoint Form */}
              {isAddingCheckpoint ? (
                <form onSubmit={handleCreateCheckpoint} className="pt-2 mt-2 border-t border-pink-200/60 dark:border-slate-700/60">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Phase 2: Solve 20 past exam problems"
                      value={newCheckpointTitle}
                      onChange={(e) => setNewCheckpointTitle(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
                      autoFocus
                    />
                    <input
                      type="date"
                      value={newCheckpointDate}
                      onChange={(e) => setNewCheckpointDate(e.target.value)}
                      className="px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500 font-mono"
                    />
                    <div className="flex items-center gap-1.5">
                      <button
                        type="submit"
                        className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white rounded-md shadow-xs"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingCheckpoint(false)}
                        className="px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setIsAddingCheckpoint(true);
                    // Default date 3 days before exam
                    const d = new Date(item.dueDate);
                    d.setDate(d.getDate() - 3);
                    setNewCheckpointDate(d.toISOString().split('T')[0]);
                  }}
                  className="w-full mt-1 py-1 px-2 text-xs text-pink-600 dark:text-pink-300 hover:text-pink-700 dark:hover:text-pink-200 hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-md transition-colors flex items-center justify-center gap-1 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Study Checkpoint</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* If exam doesn't have checkpoints yet, allow creating them */}
      {item.type === 'exam' && checkpoints.length === 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            No study checkpoints set yet for this exam.
          </span>
          <button
            onClick={() => {
              // Add standard 3 checkpoints
              const examDate = new Date(item.dueDate);
              const d1 = new Date(examDate);
              d1.setDate(d1.getDate() - 7);
              const d2 = new Date(examDate);
              d2.setDate(d2.getDate() - 3);
              const d3 = new Date(examDate);
              d3.setDate(d3.getDate() - 1);

              onAddCheckpoint(item.id, 'Phase 1: Concept & Reading Review', d1.toISOString().split('T')[0]);
              onAddCheckpoint(item.id, 'Phase 2: Practice Problems & Flashcards', d2.toISOString().split('T')[0]);
              onAddCheckpoint(item.id, 'Phase 3: Timed Mock Exam & Formula Sheet', d3.toISOString().split('T')[0]);
            }}
            className="text-xs font-semibold text-pink-600 dark:text-pink-400 hover:underline flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            <span>Generate 3-Phase Study Plan</span>
          </button>
        </div>
      )}
    </div>
  );
};
