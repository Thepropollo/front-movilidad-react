import { useEffect, useState } from 'react';
import Button from '@/components/Button';
import Pagination, { type PaginationMeta } from '@/components/Pagination';
import { DRIVER_RESPONSE_LABEL } from '@/lib/labels';
import { modulesApi } from '../api';

type Event = {
  id: number;
  date: string;
  return_date: string;
  destination: string;
  trip_status: string;
  driver_response: string;
  driver: string;
  vehicle: string;
};

interface Filters {
  from: string;
  to: string;
  tripStatus: string;
  q: string;
}

interface AgendaPayload {
  from?: string;
  to?: string;
  events?: PaginationMeta & { data?: Event[] };
}

const TRIP_STATUSES = [
  { value: '', label: 'Todos los estados' },
  { value: 'programado', label: 'Programado' },
  { value: 'en_ruta', label: 'En ruta' },
  { value: 'pendiente_feedback', label: 'Pendiente de evaluación' },
  { value: 'finalizado', label: 'Finalizado' },
];

const STATUS_LABEL: Record<string, string> = {
  programado: 'Programado',
  en_ruta: 'En ruta',
  pendiente_feedback: 'Pend. evaluación',
  finalizado: 'Finalizado',
};

const toISODate = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const startOfWeek = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return toISODate(monday);
};

const endOfWeek = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + diff);
  return toISODate(sunday);
};

const addDaysISO = (iso: string, days: number) => {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  return toISODate(date);
};

const weekDays = (start: string) =>
  Array.from({ length: 7 }, (_, i) => addDaysISO(start, i));

const dayLabel = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return {
    weekday: date
      .toLocaleDateString('es-EC', { weekday: 'short' })
      .replace('.', ''),
    dayMonth: date
      .toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })
      .replace('.', ''),
  };
};

const statusClass = (status: string) =>
  `schedule-status status-${status.replace(/[^a-z0-9_]/g, '-')}`;

export default function AgendaPage() {
  const [view, setView] = useState<'horario' | 'lista'>('horario');

  // Vista lista
  const [events, setEvents] = useState<Event[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [from, setFrom] = useState(startOfWeek());
  const [to, setTo] = useState(endOfWeek());
  const [tripStatus, setTripStatus] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vista horario
  const [weekStart, setWeekStart] = useState(startOfWeek());
  const [weekEvents, setWeekEvents] = useState<Event[]>([]);
  const [weekLoading, setWeekLoading] = useState(true);

  const apply = (data: AgendaPayload) => {
    setEvents(data.events?.data ?? []);
    setMeta(data.events ?? null);
  };

  const buildParams = (targetPage: number, filters: Filters) => ({
    from: filters.from || undefined,
    to: filters.to || undefined,
    trip_status: filters.tripStatus || undefined,
    q: filters.q.trim() || undefined,
    page: targetPage,
  });

  const load = (targetPage: number, overrides?: Partial<Filters>) => {
    const filters: Filters = { from, to, tripStatus, q, ...overrides };

    if (filters.from && filters.to && filters.from > filters.to) {
      setError('La fecha "desde" no puede ser posterior a la fecha "hasta".');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    modulesApi
      .agenda(buildParams(targetPage, filters))
      .then(({ data }) => apply(data))
      .catch(() => setError('No se pudo cargar la agenda.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    modulesApi
      .agenda({ from: startOfWeek(), to: endOfWeek(), page: 1 })
      .then(({ data }) => apply(data))
      .catch(() => setError('No se pudo cargar la agenda.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    modulesApi
      .agenda({ from: weekStart, to: addDaysISO(weekStart, 6), per_page: 100 })
      .then(({ data }) => {
        setWeekEvents(data.events?.data ?? []);
        setError(null);
      })
      .catch(() => setError('No se pudo cargar la agenda.'))
      .finally(() => setWeekLoading(false));
  }, [weekStart]);

  const goWeek = (offset: number) => {
    setWeekLoading(true);
    setWeekStart((w) => addDaysISO(w, offset * 7));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    load(1);
  };

  const clear = () => {
    const reset: Filters = {
      from: startOfWeek(),
      to: endOfWeek(),
      tripStatus: '',
      q: '',
    };
    setFrom(reset.from);
    setTo(reset.to);
    setTripStatus(reset.tripStatus);
    setQ(reset.q);
    load(1, reset);
  };

  const days = weekDays(weekStart);
  const today = toISODate(new Date());
  const byDay: Record<string, Event[]> = {};
  for (const e of weekEvents) {
    (byDay[e.date] ??= []).push(e);
  }

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Agenda</p>
        <h1>Agenda semanal</h1>
        <p className="module-lead">
          Horario de viajes por conductor y vehículo.
        </p>
      </header>

      <div
        className="view-toggle"
        role="tablist"
        style={{ marginBottom: 16 }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={view === 'horario'}
          className={view === 'horario' ? 'is-active' : ''}
          onClick={() => setView('horario')}
        >
          Horario
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'lista'}
          className={view === 'lista' ? 'is-active' : ''}
          onClick={() => setView('lista')}
        >
          Lista
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {view === 'horario' && (
        <>
          <div className="module-panel schedule-week-nav">
            <Button
              type="button"
              variant="secondary"
              fullWidth={false}
              onClick={() => goWeek(-1)}
            >
              Semana anterior
            </Button>
            <span className="ops-muted">
              {dayLabel(weekStart).dayMonth} – {dayLabel(addDaysISO(weekStart, 6)).dayMonth}
            </span>
            <Button
              type="button"
              variant="secondary"
              fullWidth={false}
              onClick={() => goWeek(1)}
            >
              Semana siguiente
            </Button>
            <Button
              type="button"
              variant="outline"
              fullWidth={false}
              onClick={() => {
                setWeekLoading(true);
                setWeekStart(startOfWeek());
              }}
            >
              Semana actual
            </Button>
            <span className="ops-muted" style={{ marginLeft: 'auto' }}>
              {weekEvents.length} viaje(s)
            </span>
          </div>

          {weekLoading ? (
            <div className="module-panel">
              <p className="ops-muted">Cargando horario…</p>
            </div>
          ) : (
            <div className="schedule-grid">
              {days.map((day) => {
                const label = dayLabel(day);
                const dayEvents = byDay[day] ?? [];
                return (
                  <article
                    key={day}
                    className={`schedule-day${day === today ? ' is-today' : ''}`}
                  >
                    <header className="schedule-day-header">
                      <span className="schedule-day-title">
                        {label.weekday}
                      </span>
                      <span className="schedule-day-date">
                        {label.dayMonth}
                      </span>
                    </header>
                    <div className="schedule-cards">
                      {dayEvents.map((e) => (
                        <div key={e.id} className="schedule-card">
                          <span className={statusClass(e.trip_status)}>
                            {STATUS_LABEL[e.trip_status] ?? e.trip_status}
                          </span>
                          <strong>{e.destination}</strong>
                          <small>{e.driver || 'Sin conductor'}</small>
                          <small>{e.vehicle || 'Sin vehículo'}</small>
                        </div>
                      ))}
                      {dayEvents.length === 0 && (
                        <p className="schedule-empty">Sin viajes</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {view === 'lista' && (
        <>
          <form className="module-panel" onSubmit={submit}>
            <div className="filters-row">
              <label>
                Desde
                <input
                  type="date"
                  className="form-input"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </label>
              <label>
                Hasta
                <input
                  type="date"
                  className="form-input"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </label>
              <label>
                Estado del viaje
                <select
                  className="form-select"
                  value={tripStatus}
                  onChange={(e) => setTripStatus(e.target.value)}
                >
                  {TRIP_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <input
                className="form-input"
                placeholder="Buscar por destino, placa o conductor"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Button type="submit" fullWidth={false} isLoading={loading}>
                Actualizar
              </Button>
              <Button
                type="button"
                variant="secondary"
                fullWidth={false}
                onClick={clear}
              >
                Limpiar
              </Button>
            </div>
          </form>
          <div className="module-panel">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Destino</th>
                  <th>Conductor</th>
                  <th>Vehículo</th>
                  <th>Estado viaje</th>
                  <th>Respuesta</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td>{e.date}</td>
                    <td>{e.destination}</td>
                    <td>{e.driver}</td>
                    <td>{e.vehicle}</td>
                    <td>{STATUS_LABEL[e.trip_status] ?? e.trip_status}</td>
                    <td>{DRIVER_RESPONSE_LABEL[e.driver_response] ?? e.driver_response}</td>
                  </tr>
                ))}
                {events.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="ops-muted">
                      Sin viajes en este rango.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <Pagination
              meta={meta}
              loading={loading}
              onPageChange={(p) => load(p)}
            />
          </div>
        </>
      )}
    </section>
  );
}
