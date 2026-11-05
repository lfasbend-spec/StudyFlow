import React, { useState, useMemo } from 'react';
import { Course, AcademicItem } from '../types';
import { buildSemesterGradeTimeline } from '../utils/gradeUtils';
import { formatDate } from '../utils/dateUtils';
import { getCourseTheme } from '../utils/courseTheme';
import { TrendingUp, Layers, Info } from 'lucide-react';

interface GradeChartProps {
  courses: Course[];
  items: AcademicItem[];
}

export const GradeChart: React.FC<GradeChartProps> = ({ courses, items }) => {
  const [chartMode, setChartMode] = useState<'gpa' | 'courses'>('gpa');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeCourseFilter, setActiveCourseFilter] = useState<string | 'all'>('all');

  const timeline = useMemo(() => {
    return buildSemesterGradeTimeline(courses, items);
  }, [courses, items]);

  // SVG Geometry
  const width = 800;
  const height = 300;
  const padding = { top: 30, right: 30, bottom: 40, left: 55 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Compute Scales
  const { gpaPointsList, courseCurves, dates } = useMemo(() => {
    if (timeline.length === 0) {
      return { gpaPointsList: [], courseCurves: {}, dates: [] };
    }

    // X positions spaced evenly or by date
    const n = timeline.length;
    const stepX = n > 1 ? chartWidth / (n - 1) : chartWidth / 2;

    const gpaPoints = timeline.map((pt, idx) => {
      const x = padding.left + (n > 1 ? idx * stepX : chartWidth / 2);
      // GPA range: 2.0 to 4.0 (or min to max)
      const minGpa = 2.0;
      const maxGpa = 4.0;
      const normalizedGpa = Math.max(0, Math.min(1, (pt.cumulativeGpa - minGpa) / (maxGpa - minGpa)));
      const y = padding.top + (1 - normalizedGpa) * chartHeight;
      return { x, y, data: pt };
    });

    // Course curves
    // For each course, trace its running grade at each timeline step
    const curves: Record<string, { x: number; y: number; pct: number }[]> = {};
    courses.forEach((c) => {
      curves[c.id] = [];
    });

    // We can track each course's score at each timeline event
    courses.forEach((c) => {
      let latestPct = 0;
      let hasGrade = false;

      timeline.forEach((pt, idx) => {
        const x = padding.left + (n > 1 ? idx * stepX : chartWidth / 2);
        if (pt.courseId === c.id) {
          latestPct = pt.coursePercentage;
          hasGrade = true;
        }

        if (hasGrade) {
          // Percent range 50% to 100%
          const minPct = 50;
          const maxPct = 100;
          const norm = Math.max(0, Math.min(1, (latestPct - minPct) / (maxPct - minPct)));
          const y = padding.top + (1 - norm) * chartHeight;
          curves[c.id].push({ x, y, pct: latestPct });
        }
      });
    });

    const datesList = timeline.map((pt) => pt.date);

    return { gpaPointsList: gpaPoints, courseCurves: curves, dates: datesList };
  }, [timeline, courses, chartWidth, chartHeight, padding]);

  // Construct SVG Path string for GPA
  const gpaPathString = useMemo(() => {
    if (gpaPointsList.length === 0) return '';
    return gpaPointsList.reduce((acc, curr, i) => {
      if (i === 0) return `M ${curr.x} ${curr.y}`;
      // Smooth curve or straight line
      return `${acc} L ${curr.x} ${curr.y}`;
    }, '');
  }, [gpaPointsList]);

  // Area under the curve
  const gpaAreaString = useMemo(() => {
    if (gpaPointsList.length === 0) return '';
    const first = gpaPointsList[0];
    const last = gpaPointsList[gpaPointsList.length - 1];
    const bottom = padding.top + chartHeight;
    return `${gpaPathString} L ${last.x} ${bottom} L ${first.x} ${bottom} Z`;
  }, [gpaPathString, gpaPointsList, padding, chartHeight]);

  if (timeline.length === 0) {
    return (
      <div className="bg-white dark:bg-[#23121d] border border-pink-100 dark:border-pink-900/40 rounded-2xl p-8 text-center shadow-[0_2px_12px_-2px_rgba(244,114,182,0.06)]">
        <TrendingUp className="w-10 h-10 text-pink-400 mx-auto mb-2.5 opacity-70" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-pink-200 mb-1">
          No Graded Items Recorded Yet
        </h3>
        <p className="text-xs text-slate-500 dark:text-pink-300/80 max-w-md mx-auto">
          Input your earned scores on completed assignments or tests below to generate your semester GPA trajectory and course grade curves.
        </p>
      </div>
    );
  }

  const activePoint = hoveredIndex !== null ? gpaPointsList[hoveredIndex] : null;

  return (
    <div className="bg-white dark:bg-[#23121d] border border-pink-100 dark:border-pink-900/40 rounded-2xl p-5 shadow-[0_2px_12px_-2px_rgba(244,114,182,0.06)]">
      {/* Chart Top Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-pink-50 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-pink-500 dark:text-pink-400" />
              <span>Semester Grade Progress Chart</span>
            </h3>
            <span className="text-xs text-pink-400/80 font-mono tabular-nums">
              ({timeline.length} grades logged)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-pink-300/80 mt-0.5">
            Real-time semester trajectory as each assignment and exam grade is returned.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-pink-50/70 dark:bg-pink-950/40 border border-pink-100 dark:border-pink-900/40 rounded-xl text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setChartMode('gpa')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              chartMode === 'gpa'
                ? 'bg-white dark:bg-[#23121d] text-pink-600 dark:text-pink-300 shadow-sm border border-pink-100 dark:border-pink-900/50 font-semibold'
                : 'text-slate-600 dark:text-pink-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Cumulative GPA (4.0)
          </button>
          <button
            onClick={() => setChartMode('courses')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              chartMode === 'courses'
                ? 'bg-white dark:bg-[#23121d] text-pink-600 dark:text-pink-300 shadow-sm border border-pink-100 dark:border-pink-900/50 font-semibold'
                : 'text-slate-600 dark:text-pink-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Course Averages (%)
          </button>
        </div>
      </div>

      {/* Responsive SVG Chart Viewport */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[300px] select-none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            {/* Linear Gradient for GPA Area */}
            <linearGradient id="gpaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F472B6" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#F472B6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y-axis scale */}
          {chartMode === 'gpa' ? (
            // GPA Grid: 4.0, 3.5, 3.0, 2.5, 2.0
            [4.0, 3.5, 3.0, 2.5, 2.0].map((val) => {
              const norm = (val - 2.0) / 2.0;
              const y = padding.top + (1 - norm) * chartHeight;
              return (
                <g key={val}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="currentColor"
                    className="text-pink-100/70 dark:text-pink-900/30"
                    strokeDasharray={val === 4.0 || val === 3.0 ? '' : '3 3'}
                    strokeWidth={1}
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[11px] font-mono fill-pink-400/80 dark:fill-pink-400/60 tabular-nums"
                  >
                    {val.toFixed(1)}
                  </text>
                  {val === 4.0 && (
                    <text
                      x={width - padding.right}
                      y={y - 6}
                      textAnchor="end"
                      className="text-[10px] font-mono fill-emerald-600 dark:fill-emerald-400 font-semibold"
                    >
                      Dean's List / 4.0 Max
                    </text>
                  )}
                </g>
              );
            })
          ) : (
            // Course % Grid: 100%, 90% (A), 80% (B), 70% (C), 60% (D)
            [100, 90, 80, 70, 60].map((val) => {
              const norm = (val - 50) / 50;
              const y = padding.top + (1 - norm) * chartHeight;
              const letter = val === 90 ? 'A-' : val === 80 ? 'B-' : val === 70 ? 'C-' : '';
              return (
                <g key={val}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="currentColor"
                    className="text-pink-100/70 dark:text-pink-900/30"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[11px] font-mono fill-pink-400/80 dark:fill-pink-400/60 tabular-nums"
                  >
                    {val}%
                  </text>
                  {letter && (
                    <text
                      x={padding.left + 8}
                      y={y - 4}
                      className="text-[9px] font-mono fill-slate-400 dark:fill-pink-400/60"
                    >
                      {letter} baseline
                    </text>
                  )}
                </g>
              );
            })
          )}

          {/* X Axis Baseline */}
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={width - padding.right}
            y2={padding.top + chartHeight}
            stroke="currentColor"
            className="text-pink-200/80 dark:text-pink-900/60"
            strokeWidth={1.5}
          />

          {/* X Axis Labels */}
          {gpaPointsList.map((pt, i) => {
            // Show label on first, last, or spaced points
            const showLabel =
              i === 0 ||
              i === gpaPointsList.length - 1 ||
              gpaPointsList.length <= 6 ||
              i % Math.ceil(gpaPointsList.length / 5) === 0;

            if (!showLabel) return null;

            return (
              <text
                key={i}
                x={pt.x}
                y={padding.top + chartHeight + 20}
                textAnchor="middle"
                className="text-[10px] font-mono fill-slate-500 dark:fill-pink-300/80"
              >
                {formatDate(pt.data.date, { shortMonth: true })}
              </text>
            );
          })}

          {/* RENDER MODE 1: Cumulative GPA Line & Filled Gradient */}
          {chartMode === 'gpa' && (
            <>
              {/* Shaded Area */}
              <path d={gpaAreaString} fill="url(#gpaGradient)" />

              {/* Main Line */}
              <path
                d={gpaPathString}
                fill="none"
                stroke="#F472B6"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {gpaPointsList.map((pt, idx) => {
                const isHovered = hoveredIndex === idx;
                return (
                  <g key={idx} className="cursor-pointer">
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : 4}
                      className="fill-white dark:fill-[#23121d] stroke-pink-400 transition-all"
                      strokeWidth={isHovered ? 3 : 2}
                    />
                  </g>
                );
              })}
            </>
          )}

          {/* RENDER MODE 2: Course Curves */}
          {chartMode === 'courses' && (
            <>
              {courses.map((course) => {
                if (activeCourseFilter !== 'all' && activeCourseFilter !== course.id) {
                  return null;
                }
                const points = courseCurves[course.id];
                if (!points || points.length === 0) return null;

                const pathStr = points.reduce((acc, curr, i) => {
                  return i === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
                }, '');

                const colorCode =
                  course.color === 'emerald'
                    ? '#10B981'
                    : course.color === 'sky'
                    ? '#0284C7'
                    : course.color === 'amber'
                    ? '#D97706'
                    : course.color === 'rose'
                    ? '#FB7185'
                    : course.color === 'fuchsia'
                    ? '#E879F9'
                    : course.color === 'violet'
                    ? '#A78BFA'
                    : '#F472B6';

                return (
                  <g key={course.id}>
                    <path
                      d={pathStr}
                      fill="none"
                      stroke={colorCode}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-all"
                    />
                    {points.map((pt, pIdx) => (
                      <circle
                        key={pIdx}
                        cx={pt.x}
                        cy={pt.y}
                        r={3.5}
                        fill={colorCode}
                        className="stroke-white dark:stroke-[#23121d]"
                        strokeWidth={1.5}
                      />
                    ))}
                  </g>
                );
              })}
            </>
          )}

          {/* Interactive Scrubbing Columns for Hover */}
          {gpaPointsList.map((pt, idx) => {
            const n = gpaPointsList.length;
            const stepX = n > 1 ? chartWidth / (n - 1) : chartWidth;
            const rectX = pt.x - stepX / 2;
            const rectW = stepX;

            return (
              <rect
                key={idx}
                x={rectX}
                y={padding.top}
                width={rectW}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
              />
            );
          })}

          {/* Hover guideline vertical rule */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={padding.top}
              x2={activePoint.x}
              y2={padding.top + chartHeight}
              stroke="currentColor"
              className="text-pink-300 dark:text-pink-400"
              strokeDasharray="2 2"
              strokeWidth={1.5}
            />
          )}
        </svg>

        {/* Floating Tooltip Box */}
        {activePoint && (
          <div
            className="absolute z-20 pointer-events-none bg-white/95 dark:bg-[#23121d]/95 text-slate-800 dark:text-pink-50 p-2.5 rounded-xl shadow-xl text-xs backdrop-blur-sm border border-pink-100 dark:border-pink-900/60 max-w-xs transition-all duration-150"
            style={{
              left: `${Math.min(75, Math.max(10, (activePoint.x / width) * 100))}%`,
              top: '15px',
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-pink-100 dark:border-pink-900/50 pb-1 mb-1 text-[11px] text-slate-400 dark:text-pink-300 font-mono">
              <span>{formatDate(activePoint.data.date, { includeDayOfWeek: true })}</span>
              <span className="font-bold text-pink-600 dark:text-pink-300">{activePoint.data.courseCode}</span>
            </div>
            <p className="font-semibold text-slate-800 dark:text-pink-100 truncate mb-1">
              {activePoint.data.itemTitle}
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-0.5">
              <div>
                <span className="text-slate-400 dark:text-pink-400/80 block">Score Earned:</span>
                <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">
                  {activePoint.data.score}/{activePoint.data.maxScore} ({activePoint.data.percentage}%)
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-pink-400/80 block">
                  {chartMode === 'gpa' ? 'Semester GPA:' : 'Course Avg:'}
                </span>
                <span className="font-mono tabular-nums text-pink-600 dark:text-pink-300 font-bold">
                  {chartMode === 'gpa'
                    ? `${activePoint.data.cumulativeGpa.toFixed(2)} GPA`
                    : `${activePoint.data.coursePercentage}%`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Course Color Legend & Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3.5 border-t border-pink-100/80 dark:border-pink-900/40 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-slate-400 dark:text-pink-400/70 text-xs font-medium">Courses:</span>
          {courses.map((course) => {
            const theme = getCourseTheme(course.color);
            const isHighlighted = activeCourseFilter === 'all' || activeCourseFilter === course.id;
            return (
              <button
                key={course.id}
                onClick={() => {
                  if (activeCourseFilter === course.id) {
                    setActiveCourseFilter('all');
                  } else {
                    setActiveCourseFilter(course.id);
                  }
                }}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                  isHighlighted ? 'opacity-100' : 'opacity-40'
                } hover:bg-pink-50 dark:hover:bg-pink-950/40`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${theme.dotBg}`} />
                <span className="font-medium text-slate-700 dark:text-pink-200">
                  {course.code}
                </span>
              </button>
            );
          })}
        </div>

        {/* Current status summary badge */}
        <div className="text-xs text-slate-500 dark:text-pink-300/80 font-mono tabular-nums">
          Latest Cumulative GPA:{' '}
          <span className="font-bold text-pink-500 dark:text-pink-400 text-sm">
            {timeline[timeline.length - 1].cumulativeGpa.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
