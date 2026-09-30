import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Plus,
  Target,
} from 'lucide-react';

export interface ProgressRingMetric {
  label: string;
  value: number | string;
  unit?: string;
  percent: number; // 0 - 100
  color?: string; // hex or tailwind stroke color
}

export interface MetricGoalItem {
  id: string | number;
  text: string;
  completed: boolean;
  onClick?: () => void;
}

export interface MetricProgressCardProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  metrics: ProgressRingMetric[];
  goalsTitle?: string;
  goals?: MetricGoalItem[];
  onAddGoal?: () => void;
  footerText?: string;
  footerHref?: string;
  onFooterClick?: () => void;
  className?: string;
}

function ProgressRing({
  metric,
}: {
  metric: ProgressRingMetric;
}) {
  const radius = 32;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, metric.percent)) / 100) * circumference;
  const ringColor = metric.color || '#3b82f6';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 76 76">
          {/* Background track */}
          <circle
            cx="38"
            cy="38"
            r={radius}
            fill="transparent"
            stroke="#f4f4f5"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx="38"
            cy="38"
            r={radius}
            fill="transparent"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
          <span className="font-mono font-bold text-base text-zinc-900 leading-none">
            {metric.value}
          </span>
          {metric.unit && (
            <span className="font-mono text-[10px] text-zinc-400 mt-0.5">
              {metric.unit}
            </span>
          )}
        </div>
      </div>

      {/* Metric Label and Percent below */}
      <div className="text-center mt-1.5 flex flex-col items-center">
        <span className="font-mono text-xs font-semibold text-zinc-800">
          {metric.label}
        </span>
        <span className="font-mono text-[10px] text-zinc-400">
          {metric.percent}%
        </span>
      </div>
    </div>
  );
}

export default function MetricProgressCard({
  title = "Today's Progress",
  subtitle = 'Activity',
  icon,
  metrics,
  goalsTitle = "Today's Goals",
  goals = [],
  onAddGoal,
  footerText = 'View Activity Details',
  footerHref,
  onFooterClick,
  className = '',
}: MetricProgressCardProps) {
  return (
    <div
      className={`bg-white border border-zinc-200 rounded-3xl p-5 md:p-6 shadow-xs flex flex-col gap-5 ${className}`}
    >
      {/* 1. Header: Icon + Title + Subtitle */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 flex-shrink-0">
          {icon || <Activity size={18} />}
        </div>
        <div className="flex flex-col min-w-0">
          <h3 className="font-mono font-bold text-sm text-zinc-900 leading-tight truncate">
            {title}
          </h3>
          {subtitle && (
            <span className="font-mono text-xs text-zinc-400 mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* 2. Gauges Row */}
      {metrics.length > 0 && (
        <div className="flex items-center justify-around gap-2 pt-1 pb-2">
          {metrics.map((m, idx) => (
            <ProgressRing key={m.label + '-' + idx} metric={m} />
          ))}
        </div>
      )}

      {/* 3. Goals / Checklist Section */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-zinc-700">
          <div className="flex items-center gap-2">
            <Target size={15} className="text-zinc-500" />
            <span className="font-mono text-xs font-semibold text-zinc-800">
              {goalsTitle}
            </span>
          </div>
          {onAddGoal && (
            <button
              type="button"
              onClick={onAddGoal}
              className="text-zinc-400 hover:text-zinc-800 p-0.5 rounded cursor-pointer transition-colors"
              title="Añadir meta"
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {/* Goals Checklist Items */}
        <div className="flex flex-col gap-2">
          {goals.length === 0 ? (
            <div className="p-3 bg-zinc-50 rounded-xl text-center text-xs font-mono text-zinc-400">
              No hay metas asignadas hoy.
            </div>
          ) : (
            goals.map((goal) => (
              <div
                key={goal.id}
                onClick={goal.onClick}
                className={`p-3 rounded-xl border border-zinc-100 flex items-center gap-2.5 transition-all ${
                  goal.onClick ? 'cursor-pointer hover:border-zinc-300' : ''
                } ${goal.completed ? 'bg-zinc-50/60' : 'bg-zinc-50'}`}
              >
                {goal.completed ? (
                  <CheckCircle2
                    size={16}
                    className="text-emerald-500 flex-shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <div
                    className="w-4 h-4 rounded-full border border-zinc-300 flex-shrink-0"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`font-mono text-xs select-none truncate ${
                    goal.completed
                      ? 'line-through text-zinc-400'
                      : 'text-zinc-800 font-medium'
                  }`}
                >
                  {goal.text}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Footer Link */}
      {(footerHref || onFooterClick) && (
        <>
          <div className="border-t border-zinc-100" />
          <div>
            {footerHref ? (
              <Link
                to={footerHref}
                onClick={onFooterClick}
                className="group inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-zinc-700 hover:text-black transition-colors"
              >
                <span>{footerText}</span>
                <ArrowUpRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            ) : (
              <button
                type="button"
                onClick={onFooterClick}
                className="group inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-zinc-700 hover:text-black transition-colors cursor-pointer"
              >
                <span>{footerText}</span>
                <ArrowUpRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
