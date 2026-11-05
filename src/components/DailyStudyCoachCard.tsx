import React, { useState, useEffect, useMemo } from 'react';
import { AcademicItem, Course, DailyStudyTip } from '../types';
import { getPersonalizedTipsAndQuotes } from '../utils/studyTips';
import { getDaysDifference } from '../utils/dateUtils';
import {
  Lightbulb,
  Quote,
  Sparkles,
  RotateCw,
  Play,
  ChevronDown,
  ChevronUp,
  Bookmark,
  CheckCircle2,
  Calendar,
  Compass,
} from 'lucide-react';

interface DailyStudyCoachCardProps {
  items: AcademicItem[];
  courses: Course[];
  onStartPomodoro?: (item: AcademicItem) => void;
}

const STORAGE_SAVED_TIP_KEY = 'studyflow_daily_coach_cache_v1';

export const DailyStudyCoachCard: React.FC<DailyStudyCoachCardProps> = ({
  items,
  courses,
  onStartPomodoro,
}) => {
  const [activeTab, setActiveTab] = useState<'tip' | 'quote'>('tip');
  const [cycleIndex, setCycleIndex] = useState<number>(0);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [aiCustomTip, setAiCustomTip] = useState<DailyStudyTip | null>(null);
  const [aiCustomQuote, setAiCustomQuote] = useState<DailyStudyTip | null>(null);

  // Derive rule-based contextual tips and quotes based on upcoming deadlines
  const { tip: heuristicTip, quote: heuristicQuote, contextHeadline } = useMemo(() => {
    return getPersonalizedTipsAndQuotes(items, courses, cycleIndex);
  }, [items, courses, cycleIndex]);

  // Current active tip and quote (prefer AI generated if active for this cycle, else heuristic)
  const currentTip = aiCustomTip || heuristicTip;
  const currentQuote = aiCustomQuote || heuristicQuote;

  // Find related item if available to support 1-click Pomodoro launch
  const relatedItem = useMemo(() => {
    const id = activeTab === 'tip' ? currentTip.relatedItemId : currentQuote.relatedItemId;
    if (!id) return undefined;
    return items.find((i) => i.id === id);
  }, [items, activeTab, currentTip.relatedItemId, currentQuote.relatedItemId]);

  const relatedCourse = useMemo(() => {
    if (!relatedItem) return undefined;
    return courses.find((c) => c.id === relatedItem.courseId);
  }, [courses, relatedItem]);

  const handleNextInsight = () => {
    // Reset AI custom override on manual cycle so user explores the curated library
    setAiCustomTip(null);
    setAiCustomQuote(null);
    setCycleIndex((prev) => prev + 1);
  };

  // Call Gemini server endpoint for real-time bespoke study strategy
  const handleAskGemini = async () => {
    setIsAiLoading(true);
    try {
      const pendingItems = items
        .filter((i) => !i.completed)
        .map((i) => ({
          title: i.title,
          type: i.type,
          dueDate: i.dueDate,
          daysLeft: getDaysDifference(i.dueDate),
          weight: i.weight,
          courseCode: courses.find((c) => c.id === i.courseId)?.code,
        }))
        .slice(0, 8);

      const nextExamItem = items
        .filter((i) => i.type === 'exam' && !i.completed)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

      const nextExam = nextExamItem
        ? {
            title: nextExamItem.title,
            dueDate: nextExamItem.dueDate,
            daysLeft: getDaysDifference(nextExamItem.dueDate),
            courseCode: courses.find((c) => c.id === nextExamItem.courseId)?.code,
          }
        : null;

      const res = await fetch('/api/study-tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upcomingItems: pendingItems,
          nextExam,
          courseNames: courses.map((c) => `${c.code} - ${c.name}`),
        }),
      });

      if (!res.ok) {
        throw new Error('Server returned an error');
      }

      const data = await res.json();
      if (data.tip) {
        setAiCustomTip({
          id: `ai-tip-${Date.now()}`,
          type: 'tip',
          title: data.tip.title,
          content: data.tip.content,
          contextTag: data.tip.contextTag || 'Personalized AI Strategy',
          suggestedAction: data.tip.suggestedAction,
          relatedItemId: nextExamItem?.id || pendingItems[0] ? items.find((i) => i.title === pendingItems[0]?.title)?.id : undefined,
          isAiGenerated: true,
        });
      }

      if (data.quote) {
        setAiCustomQuote({
          id: `ai-quote-${Date.now()}`,
          type: 'quote',
          content: data.quote.content,
          author: data.quote.author,
          source: data.quote.source,
          contextTag: data.quote.contextTag || 'AI Mindset Coach',
          isAiGenerated: true,
        });
      }
    } catch (e) {
      console.error('Failed to generate Gemini tip:', e);
      // Fallback gracefully: cycle heuristic
      setCycleIndex((prev) => prev + 1);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="mb-6 bg-white dark:bg-[#23121d] border border-pink-100 dark:border-pink-900/40 rounded-2xl p-4 sm:p-5 shadow-[0_2px_12px_-2px_rgba(244,114,182,0.06)] transition-all">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: Icon, Label, and Context Indicator */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-pink-50 dark:bg-pink-950/60 border border-pink-200/60 dark:border-pink-900/50 flex items-center justify-center shrink-0">
            {activeTab === 'tip' ? (
              <Lightbulb className="w-3.5 h-3.5 text-pink-500" />
            ) : (
              <Quote className="w-3.5 h-3.5 text-pink-500" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-pink-500 dark:text-pink-400">
                Daily Study Coach
              </span>
              <span aria-hidden="true" className="text-pink-200 text-xs hidden sm:inline">
                ·
              </span>
              <span className="text-xs text-slate-500 dark:text-pink-300/70 truncate font-medium">
                {contextHeadline}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Tab toggles and controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Tip / Quote segmented switch */}
          <div className="flex items-center bg-pink-50/80 dark:bg-pink-950/40 p-0.5 rounded-lg border border-pink-100 dark:border-pink-900/50 text-xs">
            <button
              onClick={() => setActiveTab('tip')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'tip'
                  ? 'bg-white dark:bg-[#2b1724] text-pink-600 dark:text-pink-200 shadow-xs'
                  : 'text-slate-600 dark:text-pink-300/70 hover:text-slate-900'
              }`}
            >
              Tip
            </button>
            <button
              onClick={() => setActiveTab('quote')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'quote'
                  ? 'bg-white dark:bg-[#2b1724] text-pink-600 dark:text-pink-200 shadow-xs'
                  : 'text-slate-600 dark:text-pink-300/70 hover:text-slate-900'
              }`}
            >
              Quote
            </button>
          </div>

          {/* Cycle / Next Button */}
          <button
            onClick={handleNextInsight}
            title="Next Insight"
            aria-label="Next Study Tip"
            className="p-1.5 text-slate-500 hover:text-pink-600 dark:text-pink-300/70 dark:hover:text-pink-200 hover:bg-pink-50 dark:hover:bg-pink-950/50 rounded-lg transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Ask Gemini Button */}
          <button
            onClick={handleAskGemini}
            disabled={isAiLoading}
            title="Generate personalized AI coaching with Gemini"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-pink-700 dark:text-pink-200 bg-pink-50 dark:bg-pink-950/50 hover:bg-pink-100 dark:hover:bg-pink-900/50 border border-pink-200/60 dark:border-pink-900/40 rounded-lg transition-colors disabled:opacity-60"
          >
            <Sparkles className={`w-3 h-3 text-pink-500 ${isAiLoading ? 'animate-spin' : ''}`} />
            <span>{isAiLoading ? 'Thinking...' : 'AI Coach'}</span>
          </button>

          {/* Collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Coach' : 'Collapse Coach'}
            aria-label={isCollapsed ? 'Expand Coach' : 'Collapse Coach'}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-pink-400/60 dark:hover:text-pink-200 hover:bg-pink-50 dark:hover:bg-pink-950/50 rounded-lg transition-colors"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Body Content (Collapsible) */}
      {!isCollapsed && (
        <div className="mt-3 pt-3 border-t border-pink-100/70 dark:border-pink-900/40">
          {activeTab === 'tip' ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-pink-50">
                    {currentTip.title}
                  </h4>
                  {currentTip.isAiGenerated && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-pink-600 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/60 px-1.5 py-0.5 rounded border border-pink-200/60 dark:border-pink-900/40">
                      <Sparkles className="w-2.5 h-2.5" /> AI Insight
                    </span>
                  )}
                  <span className="text-[10px] font-medium text-pink-700/80 dark:text-pink-300/80 bg-pink-50/80 dark:bg-pink-950/40 px-2 py-0.5 rounded-md">
                    {currentTip.contextTag}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-pink-200/80 leading-relaxed">
                  {currentTip.content}
                </p>
                {currentTip.suggestedAction && (
                  <p className="text-[11px] font-medium text-pink-600 dark:text-pink-300 flex items-center gap-1.5 pt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                    <span>Micro-step: {currentTip.suggestedAction}</span>
                  </p>
                )}
              </div>

              {/* Action Button: Launch Focus sprint if linked to an upcoming task */}
              {relatedItem && onStartPomodoro && (
                <div className="shrink-0 flex items-center sm:self-center">
                  <button
                    onClick={() => onStartPomodoro(relatedItem)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-pink-400 via-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 rounded-xl shadow-xs shadow-pink-200/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    title={`Start 25m Pomodoro for ${relatedItem.title}`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Focus on {relatedCourse ? relatedCourse.code : 'Task'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1.5 min-w-0 flex-1">
                <blockquote className="text-sm font-medium italic text-slate-700 dark:text-pink-100 leading-relaxed">
                  &ldquo;{currentQuote.content}&rdquo;
                </blockquote>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-pink-300/70">
                  <span className="font-semibold text-slate-800 dark:text-pink-200">
                    — {currentQuote.author}
                  </span>
                  {currentQuote.source && (
                    <>
                      <span aria-hidden="true">·</span>
                      <cite className="not-italic text-slate-500 dark:text-pink-300/60">
                        {currentQuote.source}
                      </cite>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span className="text-[10px] font-medium text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/40 px-2 py-0.5 rounded-md">
                    {currentQuote.contextTag}
                  </span>
                  {currentQuote.isAiGenerated && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-pink-600 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/60 px-1.5 py-0.5 rounded border border-pink-200/60">
                      <Sparkles className="w-2.5 h-2.5" /> AI
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button: Start Focus sprint */}
              {relatedItem && onStartPomodoro && (
                <div className="shrink-0 flex items-center sm:self-center">
                  <button
                    onClick={() => onStartPomodoro(relatedItem)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-pink-400 via-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 rounded-xl shadow-xs shadow-pink-200/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    title={`Start 25m Pomodoro for ${relatedItem.title}`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Focus Sprint</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
