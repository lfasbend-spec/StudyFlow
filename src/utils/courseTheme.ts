export interface CourseTheme {
  border: string;
  badgeBg: string;
  badgeText: string;
  accentBar: string;
  dotBg: string;
  subtleBg: string;
}

export const COURSE_COLOR_MAP: Record<string, CourseTheme> = {
  pink: {
    border: 'border-pink-200/70 dark:border-pink-900/40',
    badgeBg: 'bg-pink-50/80 dark:bg-pink-950/40',
    badgeText: 'text-pink-600 dark:text-pink-300',
    accentBar: 'bg-pink-400',
    dotBg: 'bg-pink-400',
    subtleBg: 'hover:bg-pink-50/60 dark:hover:bg-pink-950/30',
  },
  rose: {
    border: 'border-rose-200/70 dark:border-rose-900/40',
    badgeBg: 'bg-rose-50/80 dark:bg-rose-950/40',
    badgeText: 'text-rose-600 dark:text-rose-300',
    accentBar: 'bg-rose-400',
    dotBg: 'bg-rose-400',
    subtleBg: 'hover:bg-rose-50/60 dark:hover:bg-rose-950/30',
  },
  fuchsia: {
    border: 'border-fuchsia-200/70 dark:border-fuchsia-900/40',
    badgeBg: 'bg-fuchsia-50/80 dark:bg-fuchsia-950/40',
    badgeText: 'text-fuchsia-600 dark:text-fuchsia-300',
    accentBar: 'bg-fuchsia-400',
    dotBg: 'bg-fuchsia-400',
    subtleBg: 'hover:bg-fuchsia-50/60 dark:hover:bg-fuchsia-950/30',
  },
  indigo: {
    border: 'border-indigo-200 dark:border-indigo-900/60',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/50',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    accentBar: 'bg-indigo-600',
    dotBg: 'bg-indigo-500',
    subtleBg: 'hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30',
  },
  emerald: {
    border: 'border-emerald-200 dark:border-emerald-900/60',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    accentBar: 'bg-emerald-600',
    dotBg: 'bg-emerald-500',
    subtleBg: 'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30',
  },
  sky: {
    border: 'border-sky-200 dark:border-sky-900/60',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/50',
    badgeText: 'text-sky-700 dark:text-sky-300',
    accentBar: 'bg-sky-600',
    dotBg: 'bg-sky-500',
    subtleBg: 'hover:bg-sky-50/50 dark:hover:bg-sky-950/30',
  },
  amber: {
    border: 'border-amber-200 dark:border-amber-900/60',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/50',
    badgeText: 'text-amber-700 dark:text-amber-300',
    accentBar: 'bg-amber-600',
    dotBg: 'bg-amber-500',
    subtleBg: 'hover:bg-amber-50/50 dark:hover:bg-amber-950/30',
  },
  violet: {
    border: 'border-violet-200 dark:border-violet-900/60',
    badgeBg: 'bg-violet-50 dark:bg-violet-950/50',
    badgeText: 'text-violet-700 dark:text-violet-300',
    accentBar: 'bg-violet-600',
    dotBg: 'bg-violet-500',
    subtleBg: 'hover:bg-violet-50/50 dark:hover:bg-violet-950/30',
  },
  teal: {
    border: 'border-teal-200 dark:border-teal-900/60',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/50',
    badgeText: 'text-teal-700 dark:text-teal-300',
    accentBar: 'bg-teal-600',
    dotBg: 'bg-teal-500',
    subtleBg: 'hover:bg-teal-50/50 dark:hover:bg-teal-950/30',
  },
};

export function getCourseTheme(colorName?: string): CourseTheme {
  if (colorName && COURSE_COLOR_MAP[colorName]) {
    return COURSE_COLOR_MAP[colorName];
  }
  return COURSE_COLOR_MAP.pink;
}
