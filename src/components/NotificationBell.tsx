import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { useAlerts, type AlertItem } from '../context/AlertsContext';
import { getFocusable, trapTabKey } from '@/lib/focusTrap';

interface NotificationBellProps {
  placement?: 'right' | 'down';
}

const DROPDOWN_WIDTH = 440;

const DETAIL_LABEL: Record<string, string> = {
  origen: 'Origen',
  destino: 'Destino',
  salida: 'Salida',
  retorno: 'Retorno',
  solicitante: 'Solicitante',
  motivo: 'Motivo',
  estado: 'Estado',
  accion: 'Qué hacer',
  vehiculo: 'Vehículo',
  conductor: 'Conductor',
  hoja_ruta: 'Hoja de ruta',
  vence: 'Vence',
  documento: 'Documento',
  km_actual: 'Km actual',
  proximo_cambio: 'Próximo cambio',
  estacion: 'Estación',
  restante: 'Restante',
};

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

function detailEntries(alert: AlertItem) {
  const detail = alert.detail || {};
  return Object.entries(detail).filter(([, value]) => {
    if (value === null || value === undefined) return false;
    return String(value).trim() !== '';
  });
}

export default function NotificationBell({
  placement = 'right',
}: NotificationBellProps) {
  const { alerts, unreadCount, importantUnreadCount, markRead, refresh } =
    useAlerts();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; maxHeight: number } | null>(
    null
  );
  const menuId = useId();
  const titleId = useId();
  const hintId = useId();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const placePanel = useCallback(() => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) {
      setPos({ left: 8, top: 8, maxHeight: window.innerHeight - 16 });
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(DROPDOWN_WIDTH, Math.max(280, vw - 16));
    const maxHeight = Math.min(560, vh - 24);

    let left: number;
    let top: number;

    if (placement === 'down') {
      left = Math.max(8, Math.min(rect.right - width, vw - width - 8));
      top = Math.min(rect.bottom + 8, vh - 80);
    } else {
      left = rect.right + 8;
      if (left + width > vw - 8) {
        left = Math.max(8, rect.left - width - 8);
      }
      top = Math.max(8, Math.min(rect.top, vh - maxHeight - 8));
    }

    setPos({ left, top, maxHeight });
  }, [placement]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    refresh();
    placePanel();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      const first = dropdownRef.current
        ? getFocusable(dropdownRef.current)[0]
        : undefined;
      first?.focus();
    });

    const onPointer = (e: MouseEvent) => {
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
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        btnRef.current?.focus();
        return;
      }
      if (dropdownRef.current) trapTabKey(dropdownRef.current, e);
    };
    const onViewport = () => placePanel();

    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onViewport);
    window.addEventListener('scroll', onViewport, true);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onViewport);
      window.removeEventListener('scroll', onViewport, true);
    };
  }, [open, placePanel]);

  const handleSelect = (alert: AlertItem) => {
    void markRead(alert.id);
    setOpen(false);
    btnRef.current?.focus();
    if (alert.route) navigate(alert.route);
  };

  const label =
    unreadCount > 0
      ? `Notificaciones, ${unreadCount} sin leer`
      : 'Notificaciones, no hay avisos nuevos';

  return (
    <div className="notif" ref={rootRef}>
      <button
        ref={btnRef}
        type="button"
        className="notif-btn"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        onClick={toggle}
      >
        <Bell size={20} aria-hidden />
        {importantUnreadCount > 0 ? (
          <span className="notif-badge" aria-hidden>
            {importantUnreadCount}
          </span>
        ) : unreadCount > 0 ? (
          <span className="notif-dot" aria-hidden />
        ) : null}
      </button>
      <span className="sr-only" aria-live="polite">
        {unreadCount > 0 ? `${unreadCount} notificaciones sin leer` : ''}
      </span>

      {open &&
        pos &&
        createPortal(
          <div
            ref={dropdownRef}
            id={menuId}
            className="notif-dropdown"
            style={{
              left: pos.left,
              top: pos.top,
              width: Math.min(DROPDOWN_WIDTH, window.innerWidth - 16),
              maxHeight: pos.maxHeight,
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={hintId}
          >
            <div className="notif-head">
              <div>
                <strong id={titleId}>Notificaciones</strong>
                <p id={hintId}>
                  Si ya resolvió el trámite, el aviso desaparece solo.
                </p>
              </div>
              <div className="notif-head-actions">
                {unreadCount > 0 && (
                  <span className="notif-unread">{unreadCount} sin leer</span>
                )}
                <button
                  type="button"
                  className="notif-close"
                  onClick={() => {
                    setOpen(false);
                    btnRef.current?.focus();
                  }}
                  aria-label="Cerrar notificaciones"
                >
                  <X size={16} aria-hidden />
                </button>
              </div>
            </div>
            <ul className="notif-list">
              {alerts.map((a) => {
                const rows = detailEntries(a);
                return (
                  <li key={a.id}>
                    <button
                      type="button"
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
                        {rows.length > 0 && (
                          <dl className="notif-detail">
                            {rows.map(([key, value]) => (
                              <div
                                key={key}
                                className={
                                  key === 'accion' ? 'is-action' : undefined
                                }
                              >
                                <dt>{DETAIL_LABEL[key] || key}</dt>
                                <dd>{String(value)}</dd>
                              </div>
                            ))}
                          </dl>
                        )}
                        <small className="notif-time">
                          {timeAgo(a.created_at)}
                          {a.route ? ' · Abrir pantalla' : ''}
                        </small>
                      </span>
                    </button>
                  </li>
                );
              })}
              {alerts.length === 0 && (
                <li className="notif-empty">No hay avisos pendientes.</li>
              )}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}
