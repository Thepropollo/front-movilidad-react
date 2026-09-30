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
  const displaySubtitle = subtitle || description;

  const content = (
    <div
      className={`group relative flex items-start justify-between gap-4 p-4 md:p-5 bg-white border border-zinc-200 rounded-xl shadow-xs hover:border-zinc-400 hover:shadow-md transition-all duration-200 cursor-pointer ${className}`}
    >
      <div className="flex items-start gap-3.5 min-w-0">
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200/60 flex items-center justify-center text-zinc-800 group-hover:bg-zinc-200/70 transition-colors">
            {icon}
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-mono font-bold text-sm text-zinc-900 leading-snug group-hover:text-black transition-colors truncate">
              {title}
            </h3>
            {badge && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
                {badge}
              </span>
            )}
          </div>
          {displaySubtitle && (
            <p className="font-mono text-xs text-zinc-400 mt-1 leading-normal line-clamp-2">
              {displaySubtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 text-zinc-400 group-hover:text-zinc-900 transition-colors pt-0.5">
        <ArrowUpRight
          size={16}
          className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden="true"
        />
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
