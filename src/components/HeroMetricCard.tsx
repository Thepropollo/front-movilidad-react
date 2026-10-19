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
  /** Se conserva por compatibilidad; la cabecera usa siempre la paleta institucional. */
  badgeVariant?: 'indigo' | 'amber' | 'emerald' | 'rose' | 'slate' | string;
  metricValue: string | number;
  metricLabel?: string;
  metricHint?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
  backgroundImage?: string;
  /** Se conserva por compatibilidad; ya no se aplica. */
  gradientClass?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  /** Nivel de encabezado del título (por defecto h2). */
  as?: 'h1' | 'h2';
}

/**
 * Cabecera institucional de módulo: contexto (sello, título, descripción)
 * y la cifra más relevante del momento.
 */
export default function HeroMetricCard({
  headline,
  title,
  author,
  description,
  tag,
  badge,
  metricValue,
  metricLabel,
  metricHint,
  actionLabel,
  onAction,
  actionLoading,
  backgroundImage,
  href,
  onClick,
  className = '',
  as: Heading = 'h2',
}: HeroMetricCardProps) {
  const displayTitle = headline || title || '';
  const displaySub = author || description || '';
  const classes = ['sg-hero', className].filter(Boolean).join(' ');

  const content = (
    <>
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.16,
            mixBlendMode: 'luminosity',
          }}
        />
      )}

      <div className="sg-hero-main" style={{ position: 'relative' }}>
        {(badge || tag) && (
          <div className="sg-hero-tags">
            {badge && <span className="sg-hero-tag is-gold">{badge}</span>}
            {tag &&
              (tag.onClick ? (
                <button
                  type="button"
                  className="sg-hero-tag is-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    tag.onClick?.();
                  }}
                >
                  {tag.icon}
                  <span>{tag.label}</span>
                </button>
              ) : (
                <span className="sg-hero-tag">
                  {tag.icon}
                  <span>{tag.label}</span>
                </span>
              ))}
          </div>
        )}

        <Heading>{displayTitle}</Heading>
        {displaySub && <p>{displaySub}</p>}

        {actionLabel && onAction && (
          <button
            type="button"
            className="sg-hero-action"
            onClick={(event) => {
              event.stopPropagation();
              onAction();
            }}
            disabled={actionLoading}
            aria-busy={actionLoading || undefined}
          >
            <RefreshCw
              size={15}
              className={actionLoading ? 'ops-spin' : ''}
              aria-hidden="true"
            />
            <span>{actionLabel}</span>
          </button>
        )}
      </div>

      <div className="sg-hero-metric" style={{ position: 'relative' }}>
        {metricLabel && <span>{metricLabel}</span>}
        <strong>{metricValue}</strong>
        {metricHint && <em>{metricHint}</em>}
      </div>
    </>
  );

  if (href) {
    return (
      <Link to={href} onClick={onClick} className={classes}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={classes}
        style={{ textAlign: 'left', cursor: 'pointer', width: '100%' }}
      >
        {content}
      </button>
    );
  }

  return <section className={classes}>{content}</section>;
}
