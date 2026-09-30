import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';

export type StatCardTone = 'neutral' | 'info' | 'warn' | 'danger' | 'ok';

export interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: StatCardTone;
  active?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
}

const TONE_STYLES: Record<
  StatCardTone,
  { label: string; text: string; icon: string; border: string; activeBorder: string }
> = {
  neutral: {
    label: 'text-zinc-500',
    text: 'text-zinc-900',
    icon: 'text-zinc-400',
    border: 'border-zinc-200',
    activeBorder: 'border-zinc-900 ring-2 ring-zinc-900/10',
  },
  info: {
    label: 'text-blue-600',
    text: 'text-blue-600',
    icon: 'text-blue-500',
    border: 'border-blue-100',
    activeBorder: 'border-blue-500 ring-2 ring-blue-500/20',
  },
  warn: {
    label: 'text-amber-600',
    text: 'text-amber-600',
    icon: 'text-amber-500',
    border: 'border-amber-100',
    activeBorder: 'border-amber-500 ring-2 ring-amber-500/20',
  },
  danger: {
    label: 'text-rose-600',
    text: 'text-rose-600',
    icon: 'text-rose-500',
    border: 'border-rose-100',
    activeBorder: 'border-rose-500 ring-2 ring-rose-500/20',
  },
  ok: {
    label: 'text-emerald-600',
    text: 'text-emerald-600',
    icon: 'text-emerald-500',
    border: 'border-emerald-100',
    activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20',
  },
};

export default function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'neutral',
  active = false,
  href,
  onClick,
  className = '',
}: StatCardProps) {
  const styles = TONE_STYLES[tone] || TONE_STYLES.neutral;
  const isInteractive = Boolean(href || onClick);

  const content = (
    <div
      className={`group p-4 bg-white rounded-xl shadow-xs flex flex-col justify-between gap-3 transition-all duration-150 border ${
        active ? styles.activeBorder : `${styles.border} hover:border-zinc-400 hover:shadow-sm`
      } ${isInteractive ? 'cursor-pointer select-none' : ''} ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`font-mono text-xs font-semibold uppercase tracking-wider truncate ${styles.label}`}
        >
          {label}
        </span>
        {icon && (
          <span className={`shrink-0 transition-transform ${isInteractive ? 'group-hover:scale-110' : ''} ${styles.icon}`}>
            {icon}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <strong className={`font-mono font-bold text-2xl leading-none ${styles.text}`}>
          {value}
        </strong>
        {hint && (
          <span className="font-mono text-[11px] text-zinc-400 truncate max-w-[120px] text-right">
            {hint}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link to={href} onClick={onClick} className="block text-inherit no-underline">
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left bg-transparent border-0 p-0 m-0 font-inherit cursor-pointer"
      >
        {content}
      </button>
    );
  }

  return content;
}
