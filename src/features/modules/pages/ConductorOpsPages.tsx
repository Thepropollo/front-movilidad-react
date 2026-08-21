import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { getCurrentPosition } from '@/lib/geo';
import { formatDateTimeReadable } from '@/lib/datetime';
import { modulesApi } from '../api';

export function ConductorStopsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [selected, setSelected] = useState<number | ''>('');
  const [stops, setStops] = useState<any[]>([]);
  const [form, setForm] = useState({
    location: '',
    odometer_km: '',
    notes: '',
    latitude: '' as string,
    longitude: '' as string,
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void modulesApi
      .myTrips()
      .then((r) =>
        setTrips(
          (r.data || []).filter((t: any) => t.driver_response === 'aceptado')
        )
      );
  }, []);

  const loadStops = async (id: number) => {
    const { data } = await modulesApi.stops(id);
    setStops(data || []);
  };

  const captureGps = async () => {
    setError(null);
    try {
      const pos = await getCurrentPosition();
      setForm((f) => ({
        ...f,
        latitude: String(pos.lat),
        longitude: String(pos.lng),
        location:
          f.location ||
          `Punto GPS ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`,
      }));
      setMsg('Ubicacion GPS capturada.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo capturar GPS.');
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setError(null);
    const { data } = await modulesApi.addStop(Number(selected), {
      location: form.location,
      odometer_km: form.odometer_km ? Number(form.odometer_km) : undefined,
      notes: form.notes,
      arrival_time: new Date().toISOString(),
      latitude: form.latitude ? Number(form.latitude) : undefined,
      longitude: form.longitude ? Number(form.longitude) : undefined,
    });
    setMsg(data.message);
    setForm({
      location: '',
      odometer_km: '',
      notes: '',
      latitude: '',
      longitude: '',
    });
    await loadStops(Number(selected));
  };

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Mis viajes</p>
        <h1>Registrar hoja de ruta</h1>
        <p className="module-lead">
          Paradas con GPS del dispositivo. Esas coordenadas alimentan el mapa de
          rutas.
        </p>
      </header>
      {msg && <div className="alert alert-info">{msg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="module-panel" style={{ marginBottom: 16 }}>
        <select
          className="form-select"
          value={selected}
          onChange={(e) => {
            const id = Number(e.target.value);
            setSelected(id);
            if (id) void loadStops(id);
          }}
        >
          <option value="">Seleccione viaje…</option>
          {trips.map((t) => (
            <option key={t.id} value={t.id}>
              #{t.id} · {t.request?.destination}
            </option>
          ))}
        </select>
      </div>
      {selected && (
        <form
          className="module-panel"
          onSubmit={(e) => void add(e)}
          style={{ marginBottom: 16, display: 'grid', gap: 8 }}
        >
          <input
            className="form-input"
            placeholder="Ubicacion / canton"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            required
          />
          <div className="filters-row">
            <input
              className="form-input"
              type="number"
              placeholder="Odometro km"
              value={form.odometer_km}
              onChange={(e) =>
                setForm({ ...form, odometer_km: e.target.value })
              }
            />
            <input
              className="form-input"
              placeholder="Latitud"
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            />
            <input
              className="form-input"
              placeholder="Longitud"
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            />
            <button
              type="button"
              className="btn btn-uleam-sso"
              onClick={() => void captureGps()}
            >
              <MapPin size={16} aria-hidden /> Capturar GPS
            </button>
          </div>
          <input
            className="form-input"
            placeholder="Notas"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <button className="btn btn-primary" type="submit">
            Agregar parada
          </button>
        </form>
      )}
      <div className="module-panel">
        <ol>
          {stops.map((s) => (
            <li key={s.id}>
              {s.sequence}. {s.location || s.visited_canton} · km{' '}
              {s.odometer_km ?? '—'}
              {s.latitude && s.longitude
                ? ` · GPS ${s.latitude}, ${s.longitude}`
                : ' · sin GPS'}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function ConductorPaymentsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [obs, setObs] = useState<Record<number, string>>({});

  const load = async () => {
    const { data } = await modulesApi.myCompensations();
    setRows(data || []);
  };

  useEffect(() => {
    void load();
  }, []);

  const act = async (id: number, action: 'confirm' | 'dispute') => {
    const { data } = await modulesApi.confirmCompensation(id, {
      action,
      observation: obs[id],
    });
    setMsg(data.message);
    await load();
  };

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Mis pagos</p>
        <h1>Viáticos y pagos</h1>
        <p className="module-lead">
          Confirme o dispute los montos registrados por Secretaría.
        </p>
      </header>
      {msg && <div className="alert alert-info">{msg}</div>}
      <ul className="ops-list">
        {rows.map((r) => (
          <li key={r.id} className="ops-item">
            <div>
              <strong>Total ${r.total_payout}</strong>
              <p className="ops-muted">
                Estado: {r.payment_status} · Viaje #{r.route_sheet_id}
              </p>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Observación si disputa"
                value={obs[r.id] || ''}
                onChange={(e) =>
                  setObs((s) => ({ ...s, [r.id]: e.target.value }))
                }
              />
            </div>
            <div className="ops-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void act(r.id, 'confirm')}
              >
                Confirmar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => void act(r.id, 'dispute')}
              >
                Disputar
              </button>
            </div>
          </li>
        ))}
      </ul>
      {rows.length === 0 && (
        <div className="module-panel">
          <p>Sin pagos registrados.</p>
        </div>
      )}
    </section>
  );
}

export function ConductorNoveltyPage() {
  const [vehicleId, setVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [mine, setMine] = useState<any>(null);

  useEffect(() => {
    void modulesApi.myVehicle().then((r) => {
      setMine(r.data);
      if (r.data?.vehicle?.id) setVehicleId(String(r.data.vehicle.id));
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await modulesApi.createNovelty({
      vehicle_id: Number(vehicleId),
      route_sheet_id: mine?.route_sheet_id,
      description,
      city,
      issue_type: 'averia',
    });
    setMsg(data.message);
    setDescription('');
  };

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Mi vehículo</p>
        <h1>Reportar novedad</h1>
        <p className="module-lead">
          Accidente, robo o anomalía con descripción.
        </p>
      </header>
      {msg && <div className="alert alert-info">{msg}</div>}
      <form
        className="module-panel"
        onSubmit={(e) => void submit(e)}
        style={{ display: 'grid', gap: 10 }}
      >
        <input
          className="form-input"
          placeholder="ID vehículo"
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          required
        />
        <input
          className="form-input"
          placeholder="Ciudad"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <textarea
          className="form-input"
          rows={4}
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <button className="btn btn-primary" type="submit">
          Enviar novedad
        </button>
      </form>
    </section>
  );
}

export function ConductorVehiclePage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    void modulesApi.myVehicle().then((r) => setData(r.data));
  }, []);
  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Mi vehículo</p>
        <h1>Estado del vehículo asignado</h1>
      </header>
      <div className="module-panel">
        {!data?.vehicle ? (
          <p>{data?.message || 'Sin asignación activa.'}</p>
        ) : (
          <>
            <p>
              <strong>{data.vehicle.plate}</strong> · {data.vehicle.brand}{' '}
              {data.vehicle.model}
            </p>
            <p>Km actual: {data.vehicle.current_mileage}</p>
            <p>Próximo mantenimiento: {data.vehicle.next_oil_change_mileage}</p>
            <p>Km restantes: {data.km_to_maintenance}</p>
            {data.maintenance_due && (
              <p className="alert alert-danger">
                Mantenimiento vencido por kilometraje.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export function MechanicHistoryPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    void modulesApi.workOrders().then((r) => setRows(r.data || []));
  }, []);
  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Mantenimiento</p>
        <h1>Historial de mantenimientos</h1>
      </header>
      <div className="module-panel">
        <table className="ops-table">
          <thead>
            <tr>
              <th>OT</th>
              <th>Vehículo</th>
              <th>Tipo</th>
              <th>Ingreso</th>
              <th>Salida</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>#{r.id}</td>
                <td>{r.vehicle?.plate}</td>
                <td>{r.maintenance_type}</td>
                <td>
                  {formatDateTimeReadable(r.entry_date)}
                </td>
                <td>
                  {r.exit_date ? formatDateTimeReadable(r.exit_date) : 'abierta'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function LubricantsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const toRows = (payload: unknown) =>
    Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { data?: unknown[] } | null)?.data)
        ? ((payload as { data: unknown[] }).data as any[])
        : [];

  useEffect(() => {
    void modulesApi.insumos().then((r) => setRows(toRows(r.data)));
  }, []);
  const search = async () => {
    const { data } = await modulesApi.insumos(q);
    setRows(toRows(data));
  };
  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Mantenimiento</p>
        <h1>Provisión de lubricantes</h1>
        <p className="module-lead">
          Inventario de aceites y filtros disponibles para OT.
        </p>
      </header>
      <div className="module-panel filters-row" style={{ marginBottom: 16 }}>
        <input
          className="form-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar insumo"
        />
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void search()}
        >
          Buscar
        </button>
      </div>
      <div className="module-panel">
        <table className="ops-table">
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Stock</th>
              <th>Unidad</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id}>
                <td>{r.name || r.supply_name || r.description}</td>
                <td>{r.stock ?? r.quantity ?? r.current_stock}</td>
                <td>{r.unit || 'u'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function DocumentsHistoryPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    void modulesApi.listSolicitudes().then((r) => setRows(r.data || []));
  }, []);
  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Documentos</p>
        <h1>Historial de documentos / viajes</h1>
        <p className="module-lead">
          Solicitudes y estados documentales del flujo.
        </p>
      </header>
      <div className="module-panel">
        <table className="ops-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Destino</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Salida</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>#{r.id}</td>
                <td>{r.destination}</td>
                <td>{r.mobilization_type}</td>
                <td>{r.status}</td>
                <td>{formatDateTimeReadable(r.departure_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function TripDetailPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    void modulesApi
      .myInvitations()
      .then((r) => setRows(r.data || []))
      .catch(async () => {
        const s = await modulesApi.listSolicitudes();
        setRows(
          (s.data || []).map((x: any) => ({
            id: x.id,
            request: x,
            invitation_status: 'n/a',
          }))
        );
      });
  }, []);
  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Seguimiento</p>
        <h1>Conductor, vehículo y horarios</h1>
      </header>
      <ul className="ops-list">
        {rows.map((r) => (
          <li key={r.id} className="ops-item">
            <div>
              <strong>{r.request?.destination}</strong>
              <p>Estado solicitud: {r.request?.status}</p>
              <p className="ops-muted">
                Conductor:{' '}
                {r.request?.route_sheet?.driver?.user?.first_name ||
                  'Pendiente'}{' '}
                · Vehículo:{' '}
                {r.request?.route_sheet?.vehicle?.plate || 'Pendiente'}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
