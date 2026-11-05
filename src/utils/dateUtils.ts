export function parseDate(dateStr: string): Date {
  // Safe parsing of YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(dateStr);
}

export function formatDate(dateStr: string, options?: { includeDayOfWeek?: boolean; shortMonth?: boolean }): string {
  try {
    const date = parseDate(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    return date.toLocaleDateString('en-US', {
      weekday: options?.includeDayOfWeek ? 'short' : undefined,
      month: options?.shortMonth ? 'short' : 'long',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return dateStr;
  }
}

export function getDaysDifference(targetDateStr: string): number {
  const target = parseDate(targetDateStr);
  target.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function getCountdownBadge(dateStr: string, completed?: boolean): { text: string; urgency: 'overdue' | 'today' | 'urgent' | 'soon' | 'future' | 'completed' } {
  if (completed) {
    return { text: 'Completed', urgency: 'completed' };
  }

  const days = getDaysDifference(dateStr);

  if (days < 0) {
    const absDays = Math.abs(days);
    return {
      text: absDays === 1 ? '1 day overdue' : `${absDays} days overdue`,
      urgency: 'overdue',
    };
  }
  if (days === 0) {
    return { text: 'Due Today', urgency: 'today' };
  }
  if (days === 1) {
    return { text: 'Due Tomorrow', urgency: 'urgent' };
  }
  if (days <= 3) {
    return { text: `In ${days} days`, urgency: 'urgent' };
  }
  if (days <= 7) {
    return { text: `In ${days} days`, urgency: 'soon' };
  }
  return { text: `${days} days left`, urgency: 'future' };
}

export function getCheckpointCountdown(targetDateStr: string, completed: boolean): { text: string; status: 'due' | 'active' | 'done' } {
  if (completed) return { text: 'Completed', status: 'done' };

  const days = getDaysDifference(targetDateStr);
  if (days < 0) return { text: `${Math.abs(days)}d past goal`, status: 'due' };
  if (days === 0) return { text: 'Target today', status: 'due' };
  if (days === 1) return { text: 'Target tomorrow', status: 'active' };
  return { text: `Target in ${days}d`, status: 'active' };
}

export function getMonthDays(year: number, month: number): { date: Date; dateStr: string; isCurrentMonth: boolean }[] {
  const firstDay = new Date(year, month, 1);
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sun, 1 = Mon...
  
  // Start from Sunday of the first week
  const startDate = new Date(year, month, 1 - startingDayOfWeek);

  const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];
  
  // Generate 5 or 6 weeks (35 or 42 days)
  for (let i = 0; i < 42; i++) {
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    days.push({
      date: current,
      dateStr,
      isCurrentMonth: current.getMonth() === month,
    });
  }

  return days;
}
