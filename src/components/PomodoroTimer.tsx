import React, { useState, useEffect, useRef } from 'react';
import { AcademicItem, Course, PomodoroMode, PomodoroSession, PomodoroStats } from '../types';
import { formatDate } from '../utils/dateUtils';
import { getCourseTheme } from '../utils/courseTheme';
import { playChime, startAmbientSound, stopAmbientSound, setAmbientVolume } from '../utils/audioUtils';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  X,
  Clock,
  Sparkles,
  CheckCircle2,
  Circle,
  CloudRain,
  Radio,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PomodoroTimerProps {
  isOpen: boolean;
  onClose: () => void;
  activeItem: AcademicItem | null;
  items: AcademicItem[];
  courses: Course[];
  onSelectTask: (item: AcademicItem | null) => void;
  onToggleItemComplete: (itemId: string) => void;
  onToggleCheckpoint: (itemId: string, checkpointId: string) => void;
}

const STORAGE_POMODORO_STATS = 'studyflow_pomodoro_stats_v1';

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  isOpen,
  onClose,
  activeItem,
  items,
  courses,
  onSelectTask,
  onToggleItemComplete,
  onToggleCheckpoint,
}) => {
  // Preset durations in minutes
  const [focusDuration, setFocusDuration] = useState<number>(25);
  const [shortBreakDuration, setShortBreakDuration] = useState<number>(5);
  const [longBreakDuration, setLongBreakDuration] = useState<number>(15);

  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [completedCycles, setCompletedCycles] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [ambientMode, setAmbientMode] = useState<'none' | 'rain' | 'whitenoise'>('none');
  const [ambientVol, setAmbientVol] = useState<number>(0.3);
  const [showTaskSelector, setShowTaskSelector] = useState<boolean>(false);
  const [showCheckpoints, setShowCheckpoints] = useState<boolean>(true);

  // Focus statistics from LocalStorage
  const [stats, setStats] = useState<PomodoroStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_POMODORO_STATS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not parse pomodoro stats:', e);
    }
    return {
      totalFocusMinutes: 0,
      completedPomodoros: 0,
      sessions: [],
    };
  });

  // Keep stats in storage
  useEffect(() => {
    localStorage.setItem(STORAGE_POMODORO_STATS, JSON.stringify(stats));
  }, [stats]);

  // Total seconds for current mode
  const currentTotalSeconds =
    mode === 'focus'
      ? focusDuration * 60
      : mode === 'shortBreak'
      ? shortBreakDuration * 60
      : longBreakDuration * 60;

  // Sync timer when duration changes and timer is paused
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(currentTotalSeconds);
    }
  }, [focusDuration, shortBreakDuration, longBreakDuration, mode]);

  // Main countdown timer interval
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleIntervalComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft]);

  // Handle ambient sound playback based on state
  useEffect(() => {
    if (isRunning && ambientMode !== 'none') {
      startAmbientSound(ambientMode, ambientVol);
    } else {
      stopAmbientSound();
    }
    return () => {
      stopAmbientSound();
    };
  }, [isRunning, ambientMode, ambientVol]);

  // Triggered when the timer hits zero
  const handleIntervalComplete = () => {
    setIsRunning(false);

    if (soundEnabled) {
      playChime(mode === 'focus' ? 'focusComplete' : 'breakComplete');
    }

    if (mode === 'focus') {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FBCFE8', '#F472B6', '#FDA4AF', '#FFF1F2', '#FDE68A'],
      });

      const newCycles = completedCycles + 1;
      setCompletedCycles(newCycles);

      // Record completed session
      const course = courses.find((c) => c.id === activeItem?.courseId);
      const newSession: PomodoroSession = {
        id: `pomo-${Date.now()}`,
        itemId: activeItem?.id,
        itemTitle: activeItem?.title,
        courseCode: course?.code,
        mode: 'focus',
        durationMinutes: focusDuration,
        completedAt: new Date().toISOString(),
      };

      setStats((prev) => ({
        totalFocusMinutes: prev.totalFocusMinutes + focusDuration,
        completedPomodoros: prev.completedPomodoros + 1,
        sessions: [newSession, ...prev.sessions.slice(0, 49)],
      }));

      // Switch to long break after 4 cycles, or short break
      if (newCycles % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(longBreakDuration * 60);
      } else {
        setMode('shortBreak');
        setTimeLeft(shortBreakDuration * 60);
      }
    } else {
      // Break completed -> Ready for focus
      setMode('focus');
      setTimeLeft(focusDuration * 60);
    }
  };

  const handleTogglePlay = () => {
    setIsRunning(!isRunning);
    if (!isRunning && soundEnabled) {
      playChime('tick');
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(currentTotalSeconds);
  };

  const handleSkip = () => {
    setIsRunning(false);
    if (mode === 'focus') {
      const nextMode = (completedCycles + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
      setMode(nextMode);
      setTimeLeft(nextMode === 'longBreak' ? longBreakDuration * 60 : shortBreakDuration * 60);
    } else {
      setMode('focus');
      setTimeLeft(focusDuration * 60);
    }
  };

  const switchMode = (newMode: PomodoroMode) => {
    setIsRunning(false);
    setMode(newMode);
    if (newMode === 'focus') {
      setTimeLeft(focusDuration * 60);
    } else if (newMode === 'shortBreak') {
      setTimeLeft(shortBreakDuration * 60);
    } else {
      setTimeLeft(longBreakDuration * 60);
    }
  };

  if (!isOpen) return null;

  // Format mm:ss
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // SVG circular progress calculation
  const radius = 108;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = currentTotalSeconds > 0 ? (currentTotalSeconds - timeLeft) / currentTotalSeconds : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const activeCourse = courses.find((c) => c.id === activeItem?.courseId);
  const activeCourseTheme = getCourseTheme(activeCourse?.color);
  const checkpoints = activeItem?.studyCheckpoints || [];

  // ==========================================
  // FLOATING MINIMIZED PICTURE-IN-PICTURE DOCK
  // ==========================================
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="bg-white/95 dark:bg-[#23121d]/95 backdrop-blur-md border border-pink-200/80 dark:border-pink-900/60 rounded-2xl shadow-xl shadow-pink-200/30 dark:shadow-none p-3.5 flex items-center gap-3.5 min-w-[280px] max-w-sm">
          {/* Mini progress circle */}
          <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
            <svg className="w-11 h-11 -rotate-90">
              <circle
                cx="22"
                cy="22"
                r="18"
                stroke="currentColor"
                strokeWidth="3.5"
                fill="none"
                className="text-pink-100 dark:text-pink-950/60"
              />
              <circle
                cx="22"
                cy="22"
                r="18"
                stroke="currentColor"
                strokeWidth="3.5"
                fill="none"
                strokeDasharray={2 * Math.PI * 18}
                strokeDashoffset={(2 * Math.PI * 18) * (1 - progressRatio)}
                strokeLinecap="round"
                className="text-pink-500 dark:text-pink-400 transition-all duration-300"
              />
            </svg>
            <button
              onClick={handleTogglePlay}
              className="absolute inset-0 flex items-center justify-center text-pink-600 dark:text-pink-300 hover:scale-110 transition-transform"
            >
              {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
            </button>
          </div>

          {/* Time & Task information */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-mono tabular-nums text-base font-extrabold text-slate-900 dark:text-pink-50">
                {timeFormatted}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-pink-600 dark:text-pink-400">
                {mode === 'focus' ? 'Focus' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-pink-200 truncate">
              {activeItem ? activeItem.title : 'General Study Session'}
            </p>
          </div>

          {/* Expand and Close controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1.5 text-slate-400 hover:text-pink-600 dark:hover:text-pink-300 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-950/40 transition-colors"
              title="Expand Timer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsRunning(false);
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              title="Close Timer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // FULL EXPANDED POMODORO MODAL / DRAWER
  // ==========================================
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#23121d] border border-pink-100 dark:border-pink-900/50 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-pink-100/80 dark:border-pink-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-300 via-pink-400 to-rose-300 text-white flex items-center justify-center shadow-sm shadow-pink-200/50">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-pink-50 leading-tight">
                Pomodoro Study Timer
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-pink-300/80">
                Spaced focus sessions with gentle ambient soundscapes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 text-slate-400 hover:text-pink-600 dark:hover:text-pink-300 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-950/40 transition-colors"
              title="Minimize to Floating Dock"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsRunning(false);
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-pink-600 dark:hover:text-pink-300 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-950/40 transition-colors"
              title="Close Timer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Mode Selector Tabs (Segmented Control) */}
          <div className="flex items-center p-1 bg-pink-50/70 dark:bg-pink-950/40 border border-pink-100 dark:border-pink-900/40 rounded-2xl text-xs font-semibold">
            <button
              onClick={() => switchMode('focus')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all ${
                mode === 'focus'
                  ? 'bg-white dark:bg-[#1a0e17] text-pink-700 dark:text-pink-200 shadow-sm border border-pink-100 dark:border-pink-900/50'
                  : 'text-slate-600 dark:text-pink-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Focus ({focusDuration}m)
            </button>
            <button
              onClick={() => switchMode('shortBreak')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all ${
                mode === 'shortBreak'
                  ? 'bg-white dark:bg-[#1a0e17] text-pink-700 dark:text-pink-200 shadow-sm border border-pink-100 dark:border-pink-900/50'
                  : 'text-slate-600 dark:text-pink-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Short Break ({shortBreakDuration}m)
            </button>
            <button
              onClick={() => switchMode('longBreak')}
              className={`flex-1 py-2 px-3 rounded-xl transition-all ${
                mode === 'longBreak'
                  ? 'bg-white dark:bg-[#1a0e17] text-pink-700 dark:text-pink-200 shadow-sm border border-pink-100 dark:border-pink-900/50'
                  : 'text-slate-600 dark:text-pink-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Long Break ({longBreakDuration}m)
            </button>
          </div>

          {/* Linked Task Context Header */}
          <div className="bg-pink-50/40 dark:bg-pink-950/20 border border-pink-100/80 dark:border-pink-900/40 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <span className="text-[11px] font-semibold text-pink-700 dark:text-pink-300 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-pink-500" />
                <span>Active Focus Target</span>
              </span>
              <button
                onClick={() => setShowTaskSelector(!showTaskSelector)}
                className="text-xs font-semibold text-pink-600 dark:text-pink-400 hover:underline"
              >
                {showTaskSelector ? 'Close List' : 'Change Task'}
              </button>
            </div>

            {activeItem ? (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-pink-300/80 mb-0.5">
                    <span className={`font-semibold ${activeCourseTheme.badgeText}`}>
                      {activeCourse?.code}
                    </span>
                    <span aria-hidden="true" className="text-pink-200">·</span>
                    <span className="capitalize">{activeItem.type}</span>
                    <span aria-hidden="true" className="text-pink-200">·</span>
                    <span className="font-mono">{formatDate(activeItem.dueDate, { shortMonth: true })}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-pink-50 leading-snug">
                    {activeItem.title}
                  </h3>
                </div>

                {/* Direct complete toggle */}
                <button
                  onClick={() => onToggleItemComplete(activeItem.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors shrink-0 flex items-center gap-1.5 ${
                    activeItem.completed
                      ? 'bg-pink-100/80 text-pink-800 border-pink-200 dark:bg-pink-950/60 dark:text-pink-200'
                      : 'bg-white dark:bg-[#1a0e17] text-slate-700 dark:text-pink-200 border-pink-200 hover:bg-pink-50 dark:hover:bg-pink-950/40'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-pink-500" />
                  <span>{activeItem.completed ? 'Completed' : 'Mark Done'}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-pink-300/80">
                <span>No specific task linked. General focus mode.</span>
                <button
                  onClick={() => setShowTaskSelector(true)}
                  className="font-semibold text-pink-600 dark:text-pink-400 hover:underline"
                >
                  Link a Task &rarr;
                </button>
              </div>
            )}

            {/* Task Switcher Dropdown */}
            {showTaskSelector && (
              <div className="mt-3 pt-3 border-t border-pink-100 dark:border-pink-900/40 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                <button
                  onClick={() => {
                    onSelectTask(null);
                    setShowTaskSelector(false);
                  }}
                  className="w-full text-left p-2 rounded-xl text-xs hover:bg-pink-100/60 dark:hover:bg-pink-950/50 text-slate-600 dark:text-pink-300 font-medium"
                >
                  • General Session (No linked task)
                </button>
                {items.map((item) => {
                  const c = courses.find((course) => course.id === item.courseId);
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTask(item);
                        setShowTaskSelector(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        activeItem?.id === item.id
                          ? 'bg-pink-100 text-pink-900 dark:bg-pink-950 dark:text-pink-100 font-semibold'
                          : 'hover:bg-pink-50/70 dark:hover:bg-pink-950/30 text-slate-800 dark:text-pink-200'
                      }`}
                    >
                      <span className="truncate">
                        <strong>{c?.code}:</strong> {item.title}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0 ml-2">
                        {formatDate(item.dueDate, { shortMonth: true })}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Central Circular Timer Visualizer */}
          <div className="flex flex-col items-center justify-center pt-2 pb-2">
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Outer soft ambient glow */}
              <div
                className={`absolute inset-4 rounded-full transition-all duration-700 blur-xl ${
                  isRunning
                    ? 'bg-gradient-to-tr from-pink-300/30 via-rose-300/30 to-pink-200/20'
                    : 'bg-transparent'
                }`}
              />

              {/* SVG Circular Progress Track and Fill */}
              <svg className="w-full h-full -rotate-90 select-none">
                <circle
                  cx="128"
                  cy="128"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-pink-100/70 dark:text-pink-950/40"
                />
                <circle
                  cx="128"
                  cy="128"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="text-pink-400 dark:text-pink-400 transition-all duration-500"
                />
              </svg>

              {/* Inside Counter & Phase Info */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono tabular-nums text-5xl font-black text-slate-900 dark:text-pink-50 tracking-tight">
                  {timeFormatted}
                </span>

                <span className="text-xs font-semibold text-pink-600 dark:text-pink-400 uppercase tracking-widest mt-1">
                  {mode === 'focus' ? 'Focus Session' : mode === 'shortBreak' ? 'Short Rest' : 'Deep Break'}
                </span>

                {/* 4-cycle cycle progress dots */}
                <div className="flex items-center gap-1.5 mt-3" title="Interval progress">
                  {[0, 1, 2, 3].map((step) => {
                    const isFilled = step < completedCycles % 4;
                    const isCurrent = step === completedCycles % 4 && mode === 'focus';
                    return (
                      <span
                        key={step}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          isFilled
                            ? 'bg-pink-400 dark:bg-pink-400'
                            : isCurrent
                            ? 'bg-pink-300 ring-2 ring-pink-400 animate-pulse'
                            : 'bg-pink-100 dark:bg-pink-950/60'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Play, Pause, Reset, Skip Action Buttons */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleReset}
                title="Reset current interval"
                className="p-3 text-slate-400 hover:text-slate-700 dark:hover:text-pink-200 hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-2xl transition-colors border border-pink-100 dark:border-pink-900/40"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={handleTogglePlay}
                className="px-8 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-pink-400 via-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 rounded-2xl shadow-md shadow-pink-200/50 hover:shadow-lg hover:shadow-pink-300/40 hover:scale-105 transition-all flex items-center gap-2"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-5 h-5 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 ml-0.5 fill-current" />
                    <span>Start Focus</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSkip}
                title="Skip to next interval"
                className="p-3 text-slate-400 hover:text-slate-700 dark:hover:text-pink-200 hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-2xl transition-colors border border-pink-100 dark:border-pink-900/40"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Duration Customizer */}
          <div className="pt-2 border-t border-pink-100/80 dark:border-pink-900/40">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-pink-400/80 uppercase tracking-wider block mb-2 text-center">
              Customize {mode === 'focus' ? 'Focus Duration' : 'Break Duration'}
            </span>
            <div className="flex items-center justify-center gap-2">
              {mode === 'focus' ? (
                [15, 25, 45, 50, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      setFocusDuration(mins);
                      if (!isRunning) setTimeLeft(mins * 60);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                      focusDuration === mins
                        ? 'bg-pink-100/80 text-pink-800 border-pink-200 dark:bg-pink-950/70 dark:text-pink-200 shadow-xs'
                        : 'bg-white dark:bg-[#1a0e17] text-slate-600 dark:text-pink-300 border-pink-100 hover:bg-pink-50 dark:hover:bg-pink-950/40'
                    }`}
                  >
                    {mins}m
                  </button>
                ))
              ) : (
                [3, 5, 10, 15, 20].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      if (mode === 'shortBreak') {
                        setShortBreakDuration(mins);
                      } else {
                        setLongBreakDuration(mins);
                      }
                      if (!isRunning) setTimeLeft(mins * 60);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                      (mode === 'shortBreak' ? shortBreakDuration : longBreakDuration) === mins
                        ? 'bg-pink-100/80 text-pink-800 border-pink-200 dark:bg-pink-950/70 dark:text-pink-200 shadow-xs'
                        : 'bg-white dark:bg-[#1a0e17] text-slate-600 dark:text-pink-300 border-pink-100 hover:bg-pink-50 dark:hover:bg-pink-950/40'
                    }`}
                  >
                    {mins}m
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Audio & Ambient Soundscape Settings */}
          <div className="p-4 rounded-2xl bg-pink-50/40 dark:bg-pink-950/20 border border-pink-100/80 dark:border-pink-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Chime sound toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl border transition-colors flex items-center gap-1.5 ${
                  soundEnabled
                    ? 'bg-white dark:bg-[#1a0e17] text-pink-700 dark:text-pink-300 border-pink-200'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent'
                }`}
                title={soundEnabled ? 'Mute Completion Chime' : 'Enable Completion Chime'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-pink-500" /> : <VolumeX className="w-4 h-4" />}
                <span className="font-semibold">{soundEnabled ? 'Chime On' : 'Muted'}</span>
              </button>
            </div>

            {/* Ambient Background Audio */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-pink-300/80 font-medium">Ambience:</span>
              <button
                onClick={() => setAmbientMode('none')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  ambientMode === 'none'
                    ? 'bg-white dark:bg-[#1a0e17] text-pink-700 dark:text-pink-200 border border-pink-200 shadow-xs'
                    : 'text-slate-500 hover:bg-pink-50 dark:hover:bg-pink-950/40'
                }`}
              >
                Off
              </button>
              <button
                onClick={() => setAmbientMode('rain')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                  ambientMode === 'rain'
                    ? 'bg-white dark:bg-[#1a0e17] text-pink-700 dark:text-pink-200 border border-pink-200 shadow-xs'
                    : 'text-slate-500 hover:bg-pink-50 dark:hover:bg-pink-950/40'
                }`}
              >
                <CloudRain className="w-3 h-3 text-pink-500" />
                <span>Soft Rain</span>
              </button>
              <button
                onClick={() => setAmbientMode('whitenoise')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                  ambientMode === 'whitenoise'
                    ? 'bg-white dark:bg-[#1a0e17] text-pink-700 dark:text-pink-200 border border-pink-200 shadow-xs'
                    : 'text-slate-500 hover:bg-pink-50 dark:hover:bg-pink-950/40'
                }`}
              >
                <Radio className="w-3 h-3 text-pink-500" />
                <span>Pink Noise</span>
              </button>
            </div>
          </div>

          {/* Exam Prep Checkpoints for Active Task (if any) */}
          {activeItem && checkpoints.length > 0 && (
            <div className="border border-pink-100/80 dark:border-pink-900/40 rounded-2xl p-4 bg-[#FFFDFE] dark:bg-[#1f101a]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-pink-200 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-pink-500" />
                  <span>Exam Milestones for this Session</span>
                </span>
                <button
                  onClick={() => setShowCheckpoints(!showCheckpoints)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-pink-200"
                >
                  {showCheckpoints ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {showCheckpoints && (
                <div className="space-y-1.5 mt-2">
                  {checkpoints.map((chk) => (
                    <div
                      key={chk.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-pink-50/40 dark:bg-pink-950/20 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <button
                          onClick={() => onToggleCheckpoint(activeItem.id, chk.id)}
                          className="text-slate-400 hover:text-pink-500 shrink-0"
                        >
                          {chk.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-pink-500 dark:text-pink-400" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <span
                          className={`truncate ${
                            chk.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-pink-100 font-medium'
                          }`}
                        >
                          {chk.title}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0">
                        Target: {formatDate(chk.targetDate, { shortMonth: true })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Focus Performance Summary Footer */}
          <div className="pt-2 text-center text-xs text-slate-400 dark:text-pink-400/80 font-mono">
            <span>Completed Today: <strong>{stats.completedPomodoros} focus sessions</strong> ({stats.totalFocusMinutes} minutes)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
