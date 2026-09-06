import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { formatDateTimeReadable } from '@/lib/datetime';
import { DRIVER_RESPONSE_LABEL, TRIP_STATUS_LABEL, labelOf } from '@/lib/labels';
import { modulesApi } from '../api';

type Trip = {
  id: number;
  trip_status: string;
  driver_response: string;
  driver_reject_reason?: string;
  request?: { destination: string; departure_date: string; origin: string };
  vehicle?: { plate: string; brand: string; model: string };
};

export default function ConductorTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [reason, setReason] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await modulesApi.myTrips();
      setTrips(data);
    } catch {
      setError('No se pudieron cargar viajes. Intente actualizar nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const respond = async (id: number, action: 'accept' | 'reject') => {
    if (action === 'reject' && !reason[id]?.trim()) {
      setError('Escriba un motivo antes de rechazar el viaje.');
      return;
    }

    setMsg(null);
    setError(null);
    setProcessingId(id);
    try {
      const { data } = await modulesApi.respondTrip(id, {
        action,
        reason: reason[id],
      });
      setMsg(data.message);
      setReason((current) => ({ ...current, [id]: '' }));
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Error al responder.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Mis viajes</p>
        <h1>Asignaciones</h1>
        <div className="module-header-actions">
          <p className="module-lead">
            Acepte o rechace viajes asignados por Secretaría.
          </p>
          <button
            type="button"
            className="btn btn-outline module-refresh"
            onClick={() => void load()}
            disabled={loading || processingId !== null}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} aria-hidden />
            Actualizar
          </button>
        </div>
      </header>
      {msg && <div className="alert alert-info" role="status">{msg}</div>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {loading ? (
        <div className="module-panel module-state" role="status">
          <span className="spinner" aria-hidden />
          <p>Cargando asignaciones…</p>
        </div>
      ) : error && trips.length === 0 ? (
        <div className="module-panel module-state" role="alert">
          <strong>No se pudieron cargar las asignaciones</strong>
          <p>Use «Actualizar» para intentarlo nuevamente.</p>
        </div>
      ) : trips.length === 0 ? (
        <div className="module-panel module-state" role="status">
          <strong>No tienes viajes asignados</strong>
          <p>Las nuevas asignaciones aparecerán aquí.</p>
        </div>
      ) : (
      <ul className="ops-list">
        {trips.map((t) => (
          <li key={t.id} className="ops-item">
            <div>
              <strong>
                #{t.id} · {t.request?.destination}
              </strong>
              <p>
                {t.request?.origin} → {t.request?.destination} ·{' '}
                {formatDateTimeReadable(t.request?.departure_date)}
              </p>
              <p>
                {t.vehicle?.plate} · {t.vehicle?.brand} {t.vehicle?.model}
              </p>
              <p className="ops-muted">
                Viaje: {labelOf(TRIP_STATUS_LABEL, t.trip_status)} · Respuesta:{' '}
                {labelOf(DRIVER_RESPONSE_LABEL, t.driver_response)}
              </p>
              {t.driver_response === 'pendiente' && (
                <>
                  <label className="form-label" htmlFor={`trip-reason-${t.id}`}>
                    Motivo si rechaza
                  </label>
                  <textarea
                    id={`trip-reason-${t.id}`}
                    className="form-input"
                    rows={2}
                    placeholder="Explique brevemente el motivo"
                    value={reason[t.id] || ''}
                    onChange={(e) =>
                      setReason((s) => ({ ...s, [t.id]: e.target.value }))
                    }
                  />
                </>
              )}
            </div>
            {t.driver_response === 'pendiente' && (
              <div className="ops-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={processingId !== null}
                  onClick={() => void respond(t.id, 'accept')}
                >
                  Aceptar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={processingId !== null}
                  onClick={() => void respond(t.id, 'reject')}
                >
                  Rechazar
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      )}
    </section>
  );
}
