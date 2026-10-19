import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowUpRight, CheckCircle2, Plus, Target } from 'lucide-react';

export interface ProgressRingMetric {
  label: string;
  value: number | string;
  unit?: string;
  percent: number; // 0 - 100
  color?: string;
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

/* Serie de datos fija (azul, celeste, verde, ámbar), igual que en el tablero. */
const RING_COLORS = ['#0b63b4', '#22a3cf', '#26a65e', '#e08a00'];

function ProgressRing({ metric, index }: { metric: ProgressRingMetric; index: number }) {
  const radius = 34;
  const stroke = 7;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, metric.percent));
  const offset = circumference - (pct / 100) * circumference;
  const color = metric.color || RING_COLORS[index % RING_COLORS.length];

  return (
    <div className="sg-ring">
      <div
        className="sg-ring-svg"
        role="img"
        aria-label={`${metric.label}: ${metric.value}${metric.unit ? ` ${metric.unit}` : ''}, ${pct}%`}
      >
        <svg viewBox="0 0 84 84" aria-hidden="true">
          <circle cx="42" cy="42" r={radius} fill="none" stroke="#eceff3" strokeWidth={stroke} />
          <circle
            cx="42"
            cy="42"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="sg-ring-center">
          <strong>{metric.value}</strong>
          {metric.unit && <small>{metric.unit}</small>}
        </div>
      </div>
      <span className="sg-ring-label">{metric.label}</span>
      <span className="sg-ring-pct">{pct}%</span>
    </div>
  );
}

export default function MetricProgressCard({
  title = 'Avance del día',
  subtitle = 'Actividad',
  icon,
  metrics,
  goalsTitle = 'Metas del día',
  goals = [],
  onAddGoal,
  footerText = 'Ver detalle',
  footerHref,
  onFooterClick,
  className = '',
}: MetricProgressCardProps) {
  return (
    <section className={`sg-progress ${className}`.trim()} aria-label={title}>
      <header className="sg-progress-head">
        <span className="sg-progress-head-icon" aria-hidden="true">
          {icon || <Activity size={18} />}
        </span>
        <div>
          <h3>{title}</h3>
          {subtitle && <span>{subtitle}</span>}
        </div>
      </header>

      {metrics.length > 0 && (
        <div className="sg-progress-rings">
          {metrics.map((metric, index) => (
            <ProgressRing key={`${metric.label}-${index}`} metric={metric} index={index} />
          ))}
        </div>
      )}

      <div className="sg-goals">
        <div className="sg-goals-head">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Target size={15} aria-hidden="true" />
            {goalsTitle}
          </span>
          {onAddGoal && (
            <button
              type="button"
              onClick={onAddGoal}
              className="sg-link-more"
              aria-label="Añadir meta"
            >
              <Plus size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        {goals.length === 0 ? (
          <p className="ops-muted">No hay metas asignadas hoy.</p>
        ) : (
          goals.map((goal) => {
            const classes = `sg-goal${goal.completed ? ' is-done' : ''}${goal.onClick ? ' is-button' : ''}`;
            const inner = (
              <>
                {goal.completed ? (
                  <CheckCircle2 size={16} aria-hidden="true" style={{ color: 'var(--ok-600)' }} />
                ) : (
                  <span className="sg-goal-dot" aria-hidden="true" />
                )}
                <span>{goal.text}</span>
              </>
            );
            return goal.onClick ? (
              <button key={goal.id} type="button" className={classes} onClick={goal.onClick}>
                {inner}
              </button>
            ) : (
              <div key={goal.id} className={classes}>
                {inner}
              </div>
            );
          })
        )}
      </div>

      {(footerHref || onFooterClick) && (
        <footer style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
          {footerHref ? (
            <Link to={footerHref} onClick={onFooterClick} className="sg-link-more">
              <span>{footerText}</span>
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          ) : (
            <button type="button" onClick={onFooterClick} className="sg-link-more">
              <span>{footerText}</span>
              <ArrowUpRight size={14} aria-hidden="true" />
            </button>
          )}
        </footer>
      )}
    </section>
  );
}
