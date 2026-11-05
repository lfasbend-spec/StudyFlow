export type ItemType = 'assignment' | 'exam' | 'quiz' | 'project' | 'reading';

export interface StudyCheckpoint {
  id: string;
  title: string;
  targetDate: string; // YYYY-MM-DD
  completed: boolean;
  notes?: string;
}

export interface AcademicItem {
  id: string;
  courseId: string;
  title: string;
  type: ItemType;
  dueDate: string; // YYYY-MM-DD
  time?: string;   // e.g. "11:59 PM" or "10:00 AM"
  location?: string;
  weight?: string; // e.g. "20% of final grade"
  completed: boolean;
  completedAt?: string;
  notes?: string;
  studyCheckpoints?: StudyCheckpoint[]; // For exams, quizzes, and major projects
  createdAt: string;

  // Grade Tracking Fields
  score?: number;     // e.g. 96
  maxScore?: number;  // e.g. 100
  gradedDate?: string; // YYYY-MM-DD
}

export interface Course {
  id: string;
  code: string;       // e.g. "CS 201"
  name: string;       // e.g. "Data Structures & Algorithms"
  color: string;      // Tailwind color identifier e.g. "indigo", "emerald", "sky", "amber", "rose", "violet"
  instructor?: string;
  targetGrade?: string; // e.g. "A" or "95%"
  credits?: number;     // Default 3 or 4
  description?: string;
}

export type ViewMode = 'timeline' | 'calendar' | 'courses' | 'grades';

export interface FilterState {
  searchQuery: string;
  selectedCourseId: string | 'all';
  selectedType: ItemType | 'all';
  showCompleted: boolean;
}

export interface GradeDataPoint {
  date: string;
  itemTitle: string;
  courseId: string;
  courseCode: string;
  score: number;
  maxScore: number;
  percentage: number;
  cumulativeGpa: number;
  coursePercentage: number;
}

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export interface PomodoroSession {
  id: string;
  itemId?: string;
  itemTitle?: string;
  courseCode?: string;
  mode: PomodoroMode;
  durationMinutes: number;
  completedAt: string;
}

export interface PomodoroStats {
  totalFocusMinutes: number;
  completedPomodoros: number;
  sessions: PomodoroSession[];
}

export interface DailyStudyTip {
  id: string;
  type: 'tip' | 'quote';
  title?: string;
  content: string;
  author?: string;
  source?: string;
  contextTag: string;
  suggestedAction?: string;
  relatedItemId?: string;
  isAiGenerated?: boolean;
}
