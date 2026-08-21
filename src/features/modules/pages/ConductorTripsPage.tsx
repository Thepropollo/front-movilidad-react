import { useEffect, useState } from 'react';
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

  const load = async () => {
    const { data } = await modulesApi.myTrips();
    setTrips(data);
  };

  useEffect(() => {
    void load().catch(() => setError('No se pudieron cargar viajes.'));
  }, []);

  const respond = async (id: number, action: 'accept' | 'reject') => {
    setMsg(null);
    setError(null);
    try {
      const { data } = await modulesApi.respondTrip(id, {
        action,
        reason: reason[id],
      });
      setMsg(data.message);
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Error al responder.');
    }
  };

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Mis viajes</p>
        <h1>Asignaciones</h1>
        <p className="module-lead">
          Acepte o rechace viajes asignados por Secretaría.
        </p>
      </header>
      {msg && <div className="alert alert-info">{msg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
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
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Motivo si rechaza"
                  value={reason[t.id] || ''}
                  onChange={(e) =>
                    setReason((s) => ({ ...s, [t.id]: e.target.value }))
                  }
                />
              )}
            </div>
            {t.driver_response === 'pendiente' && (
              <div className="ops-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void respond(t.id, 'accept')}
                >
                  Aceptar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => void respond(t.id, 'reject')}
                >
                  Rechazar
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {trips.length === 0 && (
        <div className="module-panel">
          <p>No tiene viajes asignados.</p>
        </div>
      )}
    </section>
  );
}
