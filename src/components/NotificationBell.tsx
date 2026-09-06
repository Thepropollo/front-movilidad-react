import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAlerts, type AlertItem } from '../context/AlertsContext';

interface NotificationBellProps {
  placement?: 'right' | 'down';
}

const DROPDOWN_WIDTH = 340;
const DROPDOWN_MAX_HEIGHT = 420;

const timeAgo = (iso: string) => {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return 'ahora';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
};

export default function NotificationBell({
  placement = 'right',
}: NotificationBellProps) {
  const { alerts, unreadCount, importantUnreadCount, markRead } = useAlerts();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const menuId = useId();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }

    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) {
      setOpen(true);
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(DROPDOWN_WIDTH, vw - 16);

    let left: number;
    let top: number;

    if (placement === 'down') {
      left = Math.max(8, Math.min(rect.right - width, vw - width - 8));
      top = rect.bottom + 8;
    } else {
      left = rect.right + 8;
      if (left + width > vw - 8) {
        left = Math.max(8, rect.left - width - 8);
      }
      top = Math.max(8, Math.min(rect.top, vh - DROPDOWN_MAX_HEIGHT - 8));
    }

    setPos({ left, top });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        rootRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onResize = () => setOpen(false);

    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  const handleSelect = (alert: AlertItem) => {
    void markRead(alert.id);
    setOpen(false);
    if (alert.route) navigate(alert.route);
  };

  return (
    <div className="notif" ref={rootRef}>
      <button
        ref={btnRef}
        type="button"
        className="notif-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Alertas (${unreadCount} sin leer)`}
        onClick={toggle}
      >
        <Bell size={20} aria-hidden />
        {importantUnreadCount > 0 ? (
          <span className="notif-badge">{importantUnreadCount}</span>
        ) : unreadCount > 0 ? (
          <span className="notif-dot" aria-hidden />
        ) : null}
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={dropdownRef}
            id={menuId}
            className="notif-dropdown"
            style={{ left: pos.left, top: pos.top }}
            role="menu"
          >
            <div className="notif-head">
              <strong>Alertas</strong>
              {unreadCount > 0 && (
                <span className="notif-unread">{unreadCount} sin leer</span>
              )}
            </div>
            <ul className="notif-list">
              {alerts.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    role="menuitem"
                    className={`notif-item${a.read ? ' is-read' : ''}`}
                    onClick={() => handleSelect(a)}
                  >
                    <span
                      className={`notif-severity ${a.severity}`}
                      aria-hidden
                    />
                    <span className="notif-body">
                      <strong>{a.title}</strong>
                      <small>{a.message}</small>
                      <small className="notif-time">
                        {timeAgo(a.created_at)}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
              {alerts.length === 0 && (
                <li className="notif-empty">Sin alertas activas.</li>
              )}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}
