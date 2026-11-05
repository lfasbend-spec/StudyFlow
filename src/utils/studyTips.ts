import { AcademicItem, Course, DailyStudyTip } from '../types';
import { getDaysDifference } from './dateUtils';

interface ScenarioTips {
  tips: Array<{
    title: string;
    content: (context: { itemTitle?: string; courseCode?: string; days?: number }) => string;
    contextTag: string;
    suggestedAction?: string;
  }>;
  quotes: Array<{
    content: string;
    author: string;
    source?: string;
    contextTag: string;
  }>;
}

const KNOWLEDGE_BASE: Record<string, ScenarioTips> = {
  imminent_exam: {
    tips: [
      {
        title: 'Formula & Concept "Blurting" Sheet',
        content: ({ itemTitle, courseCode, days }) =>
          `For ${itemTitle || 'your exam'}${courseCode ? ` (${courseCode})` : ''} in ${days === 0 ? 'a few hours' : '1-2 days'}, take a blank sheet of paper and write down all formulas and definitions from memory. Recheck your notes only for the gaps you missed.`,
        contextTag: 'High Priority Exam Prep',
        suggestedAction: 'Spend 15 mins testing recall from memory',
      },
      {
        title: 'Prioritize Sleep Over Midnight Cramming',
        content: ({ itemTitle }) =>
          `Complex memory consolidation occurs during slow-wave and REM sleep. An extra 90 minutes of sleep before ${itemTitle || 'your test'} will boost cognitive retrieval more than exhausted late-night reading.`,
        contextTag: 'Exam Day Readiness',
        suggestedAction: 'Set a hard cutoff time for sleep tonight',
      },
      {
        title: 'Target Your Error Log First',
        content: () =>
          `Do not passively re-read slides. Open previous practice problems or quizzes you got wrong and redo them cleanly without peeking at the answers.`,
        contextTag: 'Targeted Retrieval',
        suggestedAction: 'Redo 3 difficult practice problems',
      },
    ],
    quotes: [
      {
        content: 'Start where you are. Use what you have. Do what you can.',
        author: 'Arthur Ashe',
        source: 'Championship Tennis & Life',
        contextTag: 'Pre-Exam Confidence',
      },
      {
        content: 'You do not rise to the level of your goals. You fall to the level of your systems.',
        author: 'James Clear',
        source: 'Atomic Habits',
        contextTag: 'Calm Execution',
      },
      {
        content: 'We suffer more often in imagination than in reality.',
        author: 'Seneca',
        source: 'Letters from a Stoic',
        contextTag: 'Taming Test Anxiety',
      },
    ],
  },
  approaching_exam: {
    tips: [
      {
        title: 'The Feynman Explanation Technique',
        content: ({ itemTitle, courseCode, days }) =>
          `You have ${days} days until ${itemTitle || 'your exam'}${courseCode ? ` (${courseCode})` : ''}. Explain the hardest concept out loud as if teaching a 12-year-old without jargon. Where you stumble is where your review needs focus.`,
        contextTag: 'Conceptual Mastery',
        suggestedAction: 'Explain 1 core theory in plain language',
      },
      {
        title: 'Interleaved Practice Sessions',
        content: () =>
          `Instead of practicing one topic for 3 hours, mix 2-3 different question types together. Interleaving forces your brain to identify which method applies to which problem, mirroring real exam conditions.`,
        contextTag: 'Cognitive Science',
        suggestedAction: 'Mix two distinct problem types in your next session',
      },
      {
        title: 'Simulate Timed Exam Conditions',
        content: ({ itemTitle }) =>
          `Take 30 minutes to complete 5 practice questions for ${itemTitle || 'your upcoming exam'} under closed-book, timed conditions. Desensitizing yourself to the timer reduces adrenaline on test day.`,
        contextTag: 'Exam Simulation',
        suggestedAction: 'Start a 30m timed test simulation',
      },
    ],
    quotes: [
      {
        content: 'Deep work is the ability to focus without distraction on a cognitively demanding task.',
        author: 'Cal Newport',
        source: 'Deep Work',
        contextTag: 'Distraction-Free Study',
      },
      {
        content: 'It does not matter how slowly you go as long as you do not stop.',
        author: 'Confucius',
        source: 'Analects',
        contextTag: 'Steady Momentum',
      },
      {
        content: 'Learning is not attained by chance, it must be sought for with ardor and attended to with diligence.',
        author: 'Abigail Adams',
        source: 'Historical Correspondence',
        contextTag: 'Purposeful Learning',
      },
    ],
  },
  urgent_task: {
    tips: [
      {
        title: 'The 2-Minute Starter Rule',
        content: ({ itemTitle, courseCode }) =>
          `${itemTitle || 'An assignment'}${courseCode ? ` for ${courseCode}` : ''} is due very soon. Tell yourself you will only work on the outline or opening problem for 2 minutes. Getting past the friction of starting eliminates 80% of procrastination.`,
        contextTag: 'Instant Momentum',
        suggestedAction: 'Open the file and work for just 2 minutes',
      },
      {
        title: '"Done is Better Than Perfect" First Pass',
        content: ({ itemTitle }) =>
          `Perfectionism causes paralysis. Complete an imperfect, messy draft of ${itemTitle || 'your deliverable'} first. It is infinitely easier to edit and polish an existing draft than a blank screen.`,
        contextTag: 'Overcoming Friction',
        suggestedAction: 'Finish the rough draft before editing',
      },
      {
        title: 'Single-Tasking Phone Lockdown',
        content: () =>
          `Even having your phone face-down on your desk drains working memory capacity. Place your phone in another room for one uninterrupted 25-minute Pomodoro sprint.`,
        contextTag: 'Focus Protocol',
        suggestedAction: 'Leave phone outside the room for 25 minutes',
      },
    ],
    quotes: [
      {
        content: 'Action is the foundational key to all success.',
        author: 'Pablo Picasso',
        source: 'Art & Work Ethic',
        contextTag: 'Taking Immediate Action',
      },
      {
        content: 'The secret of getting ahead is getting started.',
        author: 'Mark Twain',
        source: 'Collected Works',
        contextTag: 'Beating Procrastination',
      },
      {
        content: 'Almost all good writing begins with terrible first efforts. You need to start somewhere.',
        author: 'Anne Lamott',
        source: 'Bird by Bird',
        contextTag: 'Drafting Confidence',
      },
    ],
  },
  heavy_load: {
    tips: [
      {
        title: 'The 80/20 Grade Triage Rule',
        content: () =>
          `With multiple upcoming deliverables this week, sort them by percentage grade weight. Dedicate your peak morning energy to deliverables worth 15%+ and schedule shorter afternoon blocks for smaller readings.`,
        contextTag: 'Strategic Prioritization',
        suggestedAction: 'Tackle the highest-weight deliverable first',
      },
      {
        title: 'Time-Boxing vs Endless To-Do Lists',
        content: () =>
          `Assign fixed 45-minute calendar blocks for each subject rather than keeping an open-ended to-do list. Parkinson’s Law dictates that work expands to fill the time allotted to it.`,
        contextTag: 'Workload Management',
        suggestedAction: 'Set a 45-minute countdown for your next task',
      },
    ],
    quotes: [
      {
        content: 'The key is not to prioritize what’s on your schedule, but to schedule your priorities.',
        author: 'Stephen Covey',
        source: 'The 7 Habits of Highly Effective People',
        contextTag: 'Intentional Planning',
      },
      {
        content: 'If you have more than three priorities, you don’t have any.',
        author: 'Jim Collins',
        source: 'Good to Great',
        contextTag: 'Focus Under Pressure',
      },
    ],
  },
  balanced: {
    tips: [
      {
        title: 'The 24-Hour Review Window',
        content: () =>
          `Combat the Ebbinghaus forgetting curve by spending 5 minutes reviewing today’s lecture notes within 24 hours. This preserves up to 80% of retained information with minimal effort.`,
        contextTag: 'Habit Mastery',
        suggestedAction: 'Spend 5 minutes reviewing today’s notes',
      },
      {
        title: 'Pre-Reading the Next Topic',
        content: () =>
          `Skim headings, bold terms, and summary questions for your upcoming lectures before class. Pre-exposure primes your brain’s neural scaffolding so lectures feel like reinforcement.`,
        contextTag: 'Proactive Learning',
        suggestedAction: 'Preview chapter headings for next week',
      },
    ],
    quotes: [
      {
        content: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
        author: 'Aristotle',
        source: 'Nicomachean Ethics',
        contextTag: 'Sustainable Habits',
      },
      {
        content: 'An investment in knowledge pays the best interest.',
        author: 'Benjamin Franklin',
        source: 'Poor Richard’s Almanack',
        contextTag: 'Lifelong Growth',
      },
    ],
  },
};

/**
 * Analyzes the user's current items and courses to pick the most relevant personalized tips and quotes.
 */
export function getPersonalizedTipsAndQuotes(
  items: AcademicItem[],
  courses: Course[],
  cycleIndex = 0
): { tip: DailyStudyTip; quote: DailyStudyTip; contextHeadline: string } {
  // 1. Identify active deliverables
  const pendingItems = items
    .filter((i) => !i.completed)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // 2. Identify nearest exam
  const pendingExams = pendingItems.filter((i) => i.type === 'exam');
  const nearestExam = pendingExams[0];
  const nearestExamDays = nearestExam ? getDaysDifference(nearestExam.dueDate) : 999;
  const nearestExamCourse = nearestExam ? courses.find((c) => c.id === nearestExam.courseId) : undefined;

  // 3. Identify nearest assignment / task
  const nearestTask = pendingItems[0];
  const nearestTaskDays = nearestTask ? getDaysDifference(nearestTask.dueDate) : 999;
  const nearestTaskCourse = nearestTask ? courses.find((c) => c.id === nearestTask.courseId) : undefined;

  // 4. Count urgent items due within 5 days
  const urgentCount = pendingItems.filter((i) => {
    const diff = getDaysDifference(i.dueDate);
    return diff >= 0 && diff <= 5;
  }).length;

  let scenarioKey = 'balanced';
  let contextHeadline = 'Steady Progress & Balanced Habits';
  let targetItem: AcademicItem | undefined = undefined;
  let targetCourse: Course | undefined = undefined;
  let targetDays = 0;

  if (nearestExam && nearestExamDays <= 2) {
    scenarioKey = 'imminent_exam';
    targetItem = nearestExam;
    targetCourse = nearestExamCourse;
    targetDays = nearestExamDays;
    contextHeadline = `Final Sprint: ${nearestExam.title} (${nearestExamDays === 0 ? 'Today' : `${nearestExamDays}d out`})`;
  } else if (nearestExam && nearestExamDays <= 7) {
    scenarioKey = 'approaching_exam';
    targetItem = nearestExam;
    targetCourse = nearestExamCourse;
    targetDays = nearestExamDays;
    contextHeadline = `Approaching Exam: ${nearestExam.title} (${nearestExamDays} days away)`;
  } else if (urgentCount >= 3) {
    scenarioKey = 'heavy_load';
    targetItem = nearestTask;
    targetCourse = nearestTaskCourse;
    targetDays = nearestTaskDays;
    contextHeadline = `Heavy Workload: ${urgentCount} deliverables due in the next 5 days`;
  } else if (nearestTask && nearestTaskDays <= 1) {
    scenarioKey = 'urgent_task';
    targetItem = nearestTask;
    targetCourse = nearestTaskCourse;
    targetDays = nearestTaskDays;
    contextHeadline = `Due Soon: ${nearestTask.title} (${nearestTaskDays === 0 ? 'Today' : 'Tomorrow'})`;
  }

  const scenario = KNOWLEDGE_BASE[scenarioKey] || KNOWLEDGE_BASE.balanced;
  const tipDef = scenario.tips[Math.abs(cycleIndex) % scenario.tips.length];
  const quoteDef = scenario.quotes[Math.abs(cycleIndex) % scenario.quotes.length];

  const tip: DailyStudyTip = {
    id: `tip-${scenarioKey}-${Math.abs(cycleIndex) % scenario.tips.length}`,
    type: 'tip',
    title: tipDef.title,
    content: tipDef.content({
      itemTitle: targetItem?.title,
      courseCode: targetCourse?.code,
      days: targetDays,
    }),
    contextTag: tipDef.contextTag,
    suggestedAction: tipDef.suggestedAction,
    relatedItemId: targetItem?.id,
  };

  const quote: DailyStudyTip = {
    id: `quote-${scenarioKey}-${Math.abs(cycleIndex) % scenario.quotes.length}`,
    type: 'quote',
    content: quoteDef.content,
    author: quoteDef.author,
    source: quoteDef.source,
    contextTag: quoteDef.contextTag,
    relatedItemId: targetItem?.id,
  };

  return { tip, quote, contextHeadline };
}
