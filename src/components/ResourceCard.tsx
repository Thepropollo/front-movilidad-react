import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export interface ResourceCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: string;
  className?: string;
}

/** Acceso directo a un proceso o recurso del sistema. */
export default function ResourceCard({
  title,
  subtitle,
  description,
  icon,
  href,
  onClick,
  badge,
  className = '',
}: ResourceCardProps) {
  const text = subtitle || description;
  const classes = ['sg-resource', className].filter(Boolean).join(' ');

  const body = (
    <>
      <span className="sg-resource-body">
        {icon && (
          <span className="sg-resource-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="sg-resource-text">
          <span className="sg-resource-title">
            {title}
            {badge && <span className="sg-badge is-brand">{badge}</span>}
          </span>
          {text && <span className="sg-resource-sub">{text}</span>}
        </span>
      </span>
      <ArrowUpRight size={18} className="sg-resource-arrow" aria-hidden="true" />
    </>
  );

  if (href) {
    return (
      <Link to={href} onClick={onClick} className={classes}>
        {body}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {body}
      </button>
    );
  }

  return <div className={classes}>{body}</div>;
}
