import { useEffect, useState } from 'react';
import { modulesApi } from '../api';

export default function ReassignPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [form, setForm] = useState<Record<number, { driver_id: string; vehicle_id: string }>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([modulesApi.myTrips(), modulesApi.drivers(), modulesApi.vehicles()])
      .then(([t, d, v]) => {
        setTrips((t.data || []).filter((x: any) => ['rechazado', 'pendiente'].includes(x.driver_response)));
        setDrivers(d.data || []);
        setVehicles(v.data || []);
      })
      .catch(() => setError('No se pudo cargar reasignaciones.'));
  }, []);

  const submit = async (id: number) => {
    setMsg(null);
    setError(null);
    try {
      const f = form[id];
      const { data } = await modulesApi.reassign(id, {
        driver_id: Number(f?.driver_id),
        vehicle_id: f?.vehicle_id ? Number(f.vehicle_id) : undefined,
      });
      setMsg(data.message);
      const refreshed = await modulesApi.myTrips();
      setTrips((refreshed.data || []).filter((x: any) => ['rechazado', 'pendiente'].includes(x.driver_response)));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Error al reasignar.');
    }
  };

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Agenda</p>
        <h1>Reasignar conductor</h1>
        <p className="module-lead">Viajes rechazados o pendientes de aceptación.</p>
      </header>
      {msg && <div className="alert alert-info">{msg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      <ul className="ops-list">
        {trips.map((t) => (
          <li key={t.id} className="ops-item">
            <div style={{ width: '100%' }}>
              <strong>#{t.id} · {t.request?.destination}</strong>
              <p className="ops-muted">Respuesta actual: {t.driver_response} {t.driver_reject_reason ? `· ${t.driver_reject_reason}` : ''}</p>
              <div className="filters-row">
                <label>
                  Conductor
                  <select
                    className="form-select"
                    value={form[t.id]?.driver_id || ''}
                    onChange={(e) => setForm((s) => ({ ...s, [t.id]: { ...s[t.id], driver_id: e.target.value, vehicle_id: s[t.id]?.vehicle_id || '' } }))}
                  >
                    <option value="">Seleccione…</option>
                    {drivers.map((d: any) => (
                      <option key={d.id} value={d.id} disabled={!d.is_selectable && !d.is_available}>
                        {d.user?.first_name} {d.user?.last_name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Vehículo (opcional)
                  <select
                    className="form-select"
                    value={form[t.id]?.vehicle_id || ''}
                    onChange={(e) => setForm((s) => ({ ...s, [t.id]: { ...s[t.id], vehicle_id: e.target.value, driver_id: s[t.id]?.driver_id || '' } }))}
                  >
                    <option value="">Mantener actual</option>
                    {vehicles.map((v: any) => (
                      <option key={v.id} value={v.id}>{v.plate || v.license_plate}</option>
                    ))}
                  </select>
                </label>
                <button type="button" className="btn btn-primary" onClick={() => void submit(t.id)}>Reasignar</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {trips.length === 0 && <div className="module-panel"><p>No hay viajes por reasignar.</p></div>}
    </section>
  );
}
