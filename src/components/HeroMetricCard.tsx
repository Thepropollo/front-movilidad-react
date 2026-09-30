import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';

export interface HeroMetricCardProps {
  headline?: string;
  title?: string;
  author?: string;
  description?: string;
  tag?: {
    icon?: ReactNode;
    label: string;
    onClick?: () => void;
  };
  badge?: string;
  badgeVariant?: 'indigo' | 'amber' | 'emerald' | 'rose' | 'slate' | string;
  metricValue: string | number;
  metricLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
  backgroundImage?: string;
  gradientClass?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export default function HeroMetricCard({
  headline,
  title,
  author,
  description,
  tag,
  badge,
  badgeVariant,
  metricValue,
  metricLabel,
  actionLabel,
  onAction,
  actionLoading,
  backgroundImage,
  gradientClass = 'from-blue-700 via-blue-600 to-sky-600',
  href,
  onClick,
  className = '',
}: HeroMetricCardProps) {
  const displayTitle = headline || title || '';
  const displaySub = author || description || '';

  const badgeColorClass =
    badgeVariant === 'amber'
      ? 'bg-amber-400/20 text-amber-200 border-amber-300/30'
      : badgeVariant === 'emerald'
      ? 'bg-emerald-400/20 text-emerald-200 border-emerald-300/30'
      : badgeVariant === 'rose'
      ? 'bg-rose-400/20 text-rose-200 border-rose-300/30'
      : 'bg-white/20 text-white border-white/20';

  const content = (
    <div
      className={`relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-md bg-gradient-to-r ${gradientClass} ${className}`}
    >
      {/* Background image if provided */}
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <img
            src={backgroundImage}
            alt=""
            className="w-full h-full object-cover mix-blend-overlay opacity-30"
          />
          <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-[1px]" />
        </div>
      )}

      {/* Decorative ambient glow */}
      <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

      {/* Card Content */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Side: Headline + Author/Description + Tag/Badge */}
        <div className="flex flex-col items-start max-w-xl">
          {(badge || tag) && (
            <div className="flex items-center gap-2 mb-3">
              {badge && (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-medium border backdrop-blur-md ${badgeColorClass}`}
                >
                  {badge}
                </span>
              )}
              {tag && (
                <div
                  onClick={(e) => {
                    if (tag.onClick) {
                      e.stopPropagation();
                      e.preventDefault();
                      tag.onClick();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-mono font-medium border border-white/20 shadow-xs hover:bg-white/30 transition-all select-none"
                >
                  {tag.icon}
                  <span>{tag.label}</span>
                </div>
              )}
            </div>
          )}

          <h2 className="font-mono font-bold text-lg md:text-2xl text-white leading-snug tracking-tight">
            {displayTitle}
          </h2>

          {displaySub && (
            <p className="font-mono text-xs text-white/80 mt-2 leading-relaxed">
              {displaySub}
            </p>
          )}

          {actionLabel && onAction && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAction();
              }}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 active:bg-white/30 border border-white/25 text-white font-mono text-xs font-semibold mt-4 transition cursor-pointer select-none"
            >
              <RefreshCw
                size={14}
                className={actionLoading ? 'animate-spin' : ''}
                aria-hidden="true"
              />
              <span>{actionLabel}</span>
            </button>
          )}
        </div>

        {/* Right Side: Giant Metric Typography */}
        <div className="flex flex-col items-start md:items-end justify-center select-none flex-shrink-0">
          {metricLabel && (
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-white/70 mb-0.5">
              {metricLabel}
            </span>
          )}
          <span className="font-mono font-black text-5xl md:text-7xl lg:text-8xl text-white tracking-tight drop-shadow-sm leading-none">
            {metricValue}
          </span>
        </div>
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

  return (
    <div onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      {content}
    </div>
  );
}
