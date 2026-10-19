import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export type StatCardTone = 'neutral' | 'info' | 'warn' | 'danger' | 'ok' | 'gold';

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

/**
 * Indicador institucional (KPI). Tono = acento lateral + icono teñido.
 * Es enlace o botón cuando recibe `href`/`onClick`; de lo contrario, solo lectura.
 */
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
  const isInteractive = Boolean(href || onClick);
  const classes = [
    'sg-stat',
    `tone-${tone}`,
    isInteractive ? 'is-interactive' : '',
    active ? 'is-active' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const body = (
    <>
      <div className="sg-stat-head">
        <span className="sg-stat-label">{label}</span>
        {icon && (
          <span className="sg-stat-icon" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <strong className="sg-stat-value">{value}</strong>
      {hint && <span className="sg-stat-hint">{hint}</span>}
      {isInteractive && (
        <ArrowUpRight size={16} className="sg-stat-arrow" aria-hidden="true" />
      )}
    </>
  );

  if (href) {
    return (
      <Link
        to={href}
        onClick={onClick}
        className={classes}
        aria-current={active ? 'true' : undefined}
      >
        {body}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={classes}
        aria-pressed={active}
        style={{ textAlign: 'left', cursor: 'pointer' }}
      >
        {body}
      </button>
    );
  }

  return <div className={classes}>{body}</div>;
}
