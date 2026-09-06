import { useEffect, useState } from 'react';
import { DRIVER_RESPONSE_LABEL, labelOf } from '@/lib/labels';
import { formatDateReadable } from '@/lib/datetime';
import { modulesApi } from '../api';

export default function ReassignPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [form, setForm] = useState<
    Record<number, { driver_id: string; vehicle_id: string }>
  >({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTrips = async () => {
    const { data } = await modulesApi.myTrips();
    setTrips(
      (data || []).filter((x: any) =>
        ['rechazado', 'pendiente'].includes(x.driver_response)
      )
    );
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      modulesApi.myTrips(),
      modulesApi.drivers(),
      modulesApi.vehicles(),
    ])
      .then(([t, d, v]) => {
        setTrips(
          (t.data || []).filter((x: any) =>
            ['rechazado', 'pendiente'].includes(x.driver_response)
          )
        );
        setDrivers(d.data || []);
        setVehicles(v.data || []);
      })
      .catch(() => setError('No se pudo cargar reasignaciones.'))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (id: number) => {
    setMsg(null);
    setError(null);
    setSavingId(id);
    try {
      const f = form[id];
      const { data } = await modulesApi.reassign(id, {
        driver_id: Number(f?.driver_id),
        vehicle_id: f?.vehicle_id ? Number(f.vehicle_id) : undefined,
      });
      setMsg(data.message);
      setForm((s) => {
        const next = { ...s };
        delete next[id];
        return next;
      });
      await loadTrips();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Error al reasignar.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Operación diaria</p>
        <h1>Reasignar conductor</h1>
        <p className="module-lead">
          Viajes rechazados o pendientes de aceptación que requieren un nuevo
          conductor o vehículo.
        </p>
      </header>

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {loading ? (
        <div className="module-panel" style={{ textAlign: 'center', padding: 48 }}>
          <span
            className="spinner"
            style={{
              display: 'inline-block',
              width: 36,
              height: 36,
              marginBottom: 12,
            }}
          />
          <p className="ops-muted">Cargando viajes por reasignar…</p>
        </div>
      ) : trips.length === 0 ? (
        <div className="module-panel" style={{ textAlign: 'center', padding: 48 }}>
          <p className="ops-muted" style={{ fontSize: 16 }}>
            No hay viajes por reasignar.
          </p>
          <p className="ops-muted">
            Todos los conductores han aceptado sus asignaciones.
          </p>
        </div>
      ) : (
        trips.map((t) => {
          const current = form[t.id] || { driver_id: '', vehicle_id: '' };
          const canSubmit = Boolean(current.driver_id);
          const statusBadge =
            t.driver_response === 'rechazado' ? 'alert-danger' : 'alert-info';
          return (
            <div key={t.id} className="module-panel" style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <h2 style={{ margin: 0, fontSize: 18 }}>
                  #{t.id} · {t.request?.destination}
                </h2>
                <span
                  className={`alert ${statusBadge}`}
                  style={{
                    margin: 0,
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {labelOf(DRIVER_RESPONSE_LABEL, t.driver_response)}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div>
                  <span className="ops-muted">Origen</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 600 }}>
                    {t.request?.origin || '—'}
                  </p>
                </div>
                <div>
                  <span className="ops-muted">Salida</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 600 }}>
                    {formatDateReadable(t.request?.departure_date)}
                  </p>
                </div>
                <div>
                  <span className="ops-muted">Conductor actual</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 600 }}>
                    {t.driver?.user?.first_name} {t.driver?.user?.last_name}
                  </p>
                </div>
                <div>
                  <span className="ops-muted">Vehículo actual</span>
                  <p style={{ margin: '2px 0 0', fontWeight: 600 }}>
                    {t.vehicle?.plate || '—'}
                  </p>
                </div>
              </div>

              {t.driver_reject_reason && (
                <p className="ops-muted" style={{ marginBottom: 12 }}>
                  <strong>Motivo del rechazo:</strong> {t.driver_reject_reason}
                </p>
              )}

              <div className="filters-row" style={{ marginBottom: 0 }}>
                <label style={{ flex: '1 1 220px' }}>
                  Nuevo conductor
                  <select
                    className="form-select"
                    value={current.driver_id}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        [t.id]: { ...current, driver_id: e.target.value },
                      }))
                    }
                  >
                    <option value="">Seleccione conductor…</option>
                    {drivers.map((d: any) => (
                      <option
                        key={d.id}
                        value={d.id}
                        disabled={!d.is_selectable}
                      >
                        {d.name ||
                          `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim()}
                        {!d.is_selectable ? ` — ${d.status_details}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ flex: '1 1 220px' }}>
                  Nuevo vehículo (opcional)
                  <select
                    className="form-select"
                    value={current.vehicle_id}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        [t.id]: { ...current, vehicle_id: e.target.value },
                      }))
                    }
                  >
                    <option value="">Mantener actual</option>
                    {vehicles.map((v: any) => (
                      <option
                        key={v.id}
                        value={v.id}
                        disabled={!v.is_selectable}
                      >
                        {v.plate} — {v.brand} {v.model}
                        {!v.is_selectable ? ' (no disponible)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: 'auto', padding: '12px 24px' }}
                  disabled={!canSubmit || savingId === t.id}
                  onClick={() => void submit(t.id)}
                >
                  {savingId === t.id ? 'Reasignando…' : 'Reasignar'}
                </button>
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}
