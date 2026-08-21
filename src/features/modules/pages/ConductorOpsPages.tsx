import { useEffect, useState } from 'react';
import {
  MapPin,
  Droplet,
  Filter,
  Wrench,
  Package,
  AlertTriangle,
  ShieldAlert,
  Car,
  Flag,
  CircleDot,
  Send,
  CheckCircle2,
  Wallet,
} from 'lucide-react';
import { getCurrentPosition } from '@/lib/geo';
import { formatDateTimeReadable } from '@/lib/datetime';
import {
  MOBILIZATION_TYPE_LABEL,
  REQUEST_STATUS_LABEL,
  COMPENSATION_STATUS_LABEL,
  labelOf,
} from '@/lib/labels';
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
  const [error, setError] = useState<string | null>(null);
  const [obs, setObs] = useState<Record<number, string>>({});
  const [disputing, setDisputing] = useState<Record<number, boolean>>({});
  const [busy, setBusy] = useState<number | null>(null);

  const load = async () => {
    const { data } = await modulesApi.myCompensations();
    setRows(data || []);
  };

  useEffect(() => {
    void modulesApi
      .myCompensations()
      .then((r) => setRows(r.data || []))
      .catch(() => setError('No se pudieron cargar los pagos.'));
  }, []);

  const act = async (id: number, action: 'confirm' | 'dispute') => {
    setBusy(id);
    setMsg(null);
    setError(null);
    try {
      const { data } = await modulesApi.confirmCompensation(id, {
        action,
        observation: obs[id],
      });
      setMsg(data.message);
      await load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'No se pudo registrar la respuesta.');
    } finally {
      setBusy(null);
    }
  };

  const money = (v: unknown) => `$${Number(v ?? 0).toFixed(2)}`;

  const statusBadge = (s: string) =>
    ({
      pendiente_comprobante: 'pay-status st-pending',
      confirmado_conductor: 'pay-status st-done',
      en_disputa: 'pay-status st-dispute',
      verificado_movilidad: 'pay-status st-verified',
    }[s] ?? 'pay-status st-pending');

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Mis pagos</p>
        <h1>Viáticos y pagos</h1>
        <p className="module-lead">
          Confirme o dispute los montos de sus comisiones de viaje.
        </p>
      </header>
      {msg && <div className="alert alert-info">{msg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {rows.length === 0 ? (
        <div className="module-panel pay-empty">
          <Wallet size={44} />
          <p>Sin pagos registrados.</p>
          <span>
            Cuando Secretaría liquide sus comisiones aparecerán aquí.
          </span>
        </div>
      ) : (
        <div className="pay-list">
          {rows.map((r) => {
            const pending = r.payment_status === 'pendiente_comprobante';
            const isDisputing = Boolean(disputing[r.id]);
            return (
              <div className="pay-card" key={r.id}>
                <div className="pay-head">
                  <div className="pay-head-info">
                    <p className="pay-dest">
                      {r.route_sheet?.request?.destination ?? 'Comisión de viaje'}
                    </p>
                    <span className="ops-muted">
                      Viaje #{r.route_sheet_id} ·{' '}
                      {formatDateTimeReadable(
                        r.route_sheet?.request?.departure_date
                      )}
                    </span>
                  </div>
                  <span className="pay-total">{money(r.total_payout)}</span>
                </div>

                <div className="pay-breakdown">
                  <div>
                    <span>Viáticos</span>
                    <strong>{money(r.allowances_amount)}</strong>
                  </div>
                  <div>
                    <span>H. extras 50%</span>
                    <strong>{money(r.overtime_50_amount)}</strong>
                  </div>
                  <div>
                    <span>H. extras 100%</span>
                    <strong>{money(r.overtime_100_amount)}</strong>
                  </div>
                </div>

                <div className="pay-foot">
                  <span className={statusBadge(r.payment_status)}>
                    {labelOf(COMPENSATION_STATUS_LABEL, r.payment_status)}
                  </span>

                  {pending && (
                    <div className="pay-actions">
                      {isDisputing ? (
                        <div className="pay-dispute">
                          <input
                            className="form-input"
                            placeholder="Motivo de la disputa"
                            value={obs[r.id] || ''}
                            onChange={(e) =>
                              setObs((s) => ({ ...s, [r.id]: e.target.value }))
                            }
                          />
                          <button
                            className="btn btn-danger"
                            disabled={busy === r.id || !obs[r.id]?.trim()}
                            onClick={() => void act(r.id, 'dispute')}
                          >
                            Enviar disputa
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() =>
                              setDisputing((s) => ({ ...s, [r.id]: false }))
                            }
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            className="btn btn-danger"
                            onClick={() =>
                              setDisputing((s) => ({ ...s, [r.id]: true }))
                            }
                          >
                            Disputar
                          </button>
                          <button
                            className="btn btn-primary"
                            disabled={busy === r.id}
                            onClick={() => void act(r.id, 'confirm')}
                          >
                            {busy === r.id ? 'Confirmando…' : 'Confirmar'}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {r.payment_status === 'confirmado_conductor' && (
                    <span className="pay-done">
                      <CheckCircle2 size={15} /> Confirmado por usted
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

const NOVELTY_TYPES: Array<{
  value: string;
  label: string;
  icon: typeof Wrench;
}> = [
  { value: 'averia', label: 'Avería mecánica', icon: Wrench },
  { value: 'accidente', label: 'Accidente', icon: AlertTriangle },
  { value: 'robo', label: 'Robo', icon: ShieldAlert },
  { value: 'pinchazo', label: 'Pinchazo / llanta', icon: CircleDot },
  { value: 'otro', label: 'Otra novedad', icon: Flag },
];

export function ConductorNoveltyPage() {
  const [vehicleId, setVehicleId] = useState('');
  const [issueType, setIssueType] = useState('averia');
  const [city, setCity] = useState('');
  const [breakdownDate, setBreakdownDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mine, setMine] = useState<any>(null);

  useEffect(() => {
    void modulesApi.myVehicle().then((r) => {
      setMine(r.data);
      if (r.data?.vehicle?.id) setVehicleId(String(r.data.vehicle.id));
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);
    setError(null);
    try {
      const { data } = await modulesApi.createNovelty({
        vehicle_id: Number(vehicleId),
        route_sheet_id: mine?.route_sheet_id,
        description,
        city,
        issue_type: issueType,
        breakdown_date: breakdownDate,
      });
      setMsg(data.message);
      setDescription('');
      setCity('');
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { message?: string } } };
      setError(e2.response?.data?.message || 'No se pudo registrar la novedad.');
    } finally {
      setSubmitting(false);
    }
  };

  const v = mine?.vehicle;

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Mi vehículo</p>
        <h1>Reportar novedad</h1>
        <p className="module-lead">
          Reporte averías, accidentes o anomalías de su unidad.
        </p>
      </header>

      {msg && <div className="alert alert-info">{msg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="novelty-layout">
        <aside className="module-panel">
          {v ? (
            <div className="vehicle-summary">
              <p className="vehicle-summary-label">Vehículo asignado</p>
              <p className="vehicle-summary-plate">{v.plate}</p>
              <p className="vehicle-summary-model">
                {v.brand} {v.model} · {v.year}
              </p>
              <div className="vehicle-summary-stats">
                <div>
                  <span>Km actual</span>
                  <strong>{v.current_mileage}</strong>
                </div>
                <div>
                  <span>Próx. mantenimiento</span>
                  <strong>{v.next_oil_change_mileage}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="pay-empty">
              <Car size={40} />
              <p>Sin vehículo asignado.</p>
              <span>
                No podrá reportar novedades hasta que se le asigne una unidad.
              </span>
            </div>
          )}
        </aside>

        <form className="module-panel" onSubmit={(e) => void submit(e)}>
          <label className="form-label">Tipo de novedad</label>
          <div className="novelty-types">
            {NOVELTY_TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  type="button"
                  key={t.value}
                  className={`novelty-type ${issueType === t.value ? 'is-active' : ''}`}
                  onClick={() => setIssueType(t.value)}
                >
                  <Icon size={18} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="filters-row" style={{ marginTop: 14 }}>
            <label>
              Ciudad
              <input
                className="form-input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ej: Manta"
              />
            </label>
            <label>
              Fecha
              <input
                className="form-input"
                type="date"
                value={breakdownDate}
                onChange={(e) => setBreakdownDate(e.target.value)}
              />
            </label>
          </div>

          <label className="form-label" style={{ marginTop: 14 }}>
            Descripción
          </label>
          <textarea
            className="form-input"
            rows={4}
            placeholder="Describa el problema con el mayor detalle posible…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting || !vehicleId}
            style={{ width: '100%', marginTop: 16 }}
          >
            {submitting ? (
              'Enviando…'
            ) : (
              <>
                <Send size={16} /> Reportar novedad
              </>
            )}
          </button>
        </form>
      </div>
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

const MAINTENANCE_TYPE_LABEL: Record<string, string> = {
  preventivo: 'Preventivo',
  correctivo: 'Correctivo',
  cambio_aceite: 'Cambio de aceite',
};

export function MechanicHistoryPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [type, setType] = useState('todos');
  const [status, setStatus] = useState('todos');

  useEffect(() => {
    void modulesApi.workOrders().then((r) => setRows(r.data || []));
  }, []);

  const filtered = rows.filter((r) => {
    const plate = (r.vehicle?.plate || '').toLowerCase();
    const details = (r.work_details || '').toLowerCase();
    const matchQ =
      !q || plate.includes(q.toLowerCase()) || details.includes(q.toLowerCase());
    const matchType = type === 'todos' || r.maintenance_type === type;
    const closed = Boolean(r.exit_date);
    const matchStatus =
      status === 'todos' || (status === 'abierta' ? !closed : closed);
    return matchQ && matchType && matchStatus;
  });

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Mantenimiento</p>
        <h1>Historial de mantenimientos</h1>
        <p className="module-lead">
          Órdenes de trabajo realizadas en la flota.
        </p>
      </header>

      <div className="module-panel">
        <div className="filters-row">
          <label>
            Buscar (placa / trabajo)
            <input
              className="form-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ej: MBA-1234, aceite…"
            />
          </label>
          <label>
            Tipo de mantenimiento
            <select
              className="form-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="todos">Todos</option>
              {Object.entries(MAINTENANCE_TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estado
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="abierta">Abiertas</option>
              <option value="cerrada">Cerradas</option>
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <p className="ops-muted" style={{ textAlign: 'center', padding: 24 }}>
            No hay órdenes de trabajo con esos filtros.
          </p>
        ) : (
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
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>
                    {r.vehicle?.plate}
                    <span className="ops-muted" style={{ display: 'block' }}>
                      {r.vehicle?.brand} {r.vehicle?.model}
                    </span>
                  </td>
                  <td>{MAINTENANCE_TYPE_LABEL[r.maintenance_type] ?? r.maintenance_type}</td>
                  <td>{formatDateTimeReadable(r.entry_date)}</td>
                  <td>
                    {r.exit_date ? (
                      formatDateTimeReadable(r.exit_date)
                    ) : (
                      <span className="hist-pill hist-open">Abierta</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

const CATEGORY_META: Record<
  string,
  { label: string; icon: typeof Droplet }
> = {
  aceite: { label: 'Aceites y lubricantes', icon: Droplet },
  filtro: { label: 'Filtros', icon: Filter },
  freno: { label: 'Frenos y fluidos', icon: Wrench },
  otro: { label: 'Otros insumos', icon: Package },
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  ok: { label: 'En stock', cls: 'ok' },
  bajo: { label: 'Stock bajo', cls: 'bajo' },
  agotado: { label: 'Agotado', cls: 'agotado' },
};

function supplyName(r: any): string {
  return r.supply_name || r.name || r.description || 'Insumo';
}

function supplyStock(r: any): number {
  return Number(r.current_stock ?? r.stock ?? r.quantity ?? 0);
}

function supplyCategory(n: string): string {
  const x = n.toLowerCase();
  if (x.includes('aceite') || x.includes('lubricante') || x.includes('motor'))
    return 'aceite';
  if (x.includes('filtro')) return 'filtro';
  if (
    x.includes('freno') ||
    x.includes('pastilla') ||
    x.includes('líquido') ||
    x.includes('liquido')
  )
    return 'freno';
  return 'otro';
}

function stockStatus(s: number): string {
  if (s <= 0) return 'agotado';
  if (s < 5) return 'bajo';
  return 'ok';
}

export function LubricantsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('todos');
  const [status, setStatus] = useState('todos');

  const toRows = (payload: unknown) =>
    Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { data?: unknown[] } | null)?.data)
        ? ((payload as { data: unknown[] }).data as any[])
        : [];

  useEffect(() => {
    void modulesApi.insumos().then((r) => setRows(toRows(r.data)));
  }, []);

  const filtered = rows.filter((r) => {
    const n = supplyName(r);
    const cat = supplyCategory(n);
    const st = stockStatus(supplyStock(r));
    const matchQ = !q || n.toLowerCase().includes(q.toLowerCase());
    const matchCat = category === 'todos' || cat === category;
    const matchStatus = status === 'todos' || st === status;
    return matchQ && matchCat && matchStatus;
  });

  const lowCount = rows.filter((r) => stockStatus(supplyStock(r)) === 'bajo').length;
  const outCount = rows.filter((r) => stockStatus(supplyStock(r)) === 'agotado').length;

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Mantenimiento</p>
        <h1>Provisión de lubricantes</h1>
        <p className="module-lead">
          Inventario de aceites, filtros y fluidos disponibles para las órdenes
          de trabajo.
        </p>
      </header>

      <div className="supply-kpis">
        <div className="supply-kpi">
          <span className="supply-kpi-value">{rows.length}</span>
          <span className="supply-kpi-label">Insumos totales</span>
        </div>
        <div className="supply-kpi supply-kpi-warn">
          <span className="supply-kpi-value">{lowCount}</span>
          <span className="supply-kpi-label">Stock bajo</span>
        </div>
        <div className="supply-kpi supply-kpi-danger">
          <span className="supply-kpi-value">{outCount}</span>
          <span className="supply-kpi-label">Agotados</span>
        </div>
      </div>

      <div className="module-panel">
        <div className="filters-row">
          <label style={{ flex: '1 1 200px' }}>
            Buscar
            <input
              className="form-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ej: aceite, filtro…"
            />
          </label>
          <label>
            Categoría
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="todos">Todas</option>
              {Object.entries(CATEGORY_META).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Disponibilidad
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="todos">Todas</option>
              <option value="ok">En stock</option>
              <option value="bajo">Stock bajo</option>
              <option value="agotado">Agotado</option>
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <p className="ops-muted" style={{ textAlign: 'center', padding: 24 }}>
            No se encontraron insumos con esos filtros.
          </p>
        ) : (
          <div className="supply-grid">
            {filtered.map((r) => {
              const n = supplyName(r);
              const cat = supplyCategory(n);
              const meta = CATEGORY_META[cat];
              const st = stockStatus(supplyStock(r));
              const stMeta = STATUS_META[st];
              const Icon = meta.icon;
              return (
                <div className="supply-card" key={r.id}>
                  <div className={`supply-icon cat-${cat}`}>
                    <Icon size={22} />
                  </div>
                  <div className="supply-info">
                    <p className="supply-name">{n}</p>
                    <span className="supply-unit">{r.measurement_unit || r.unit || 'u'}</span>
                  </div>
                  <div className="supply-stock">
                    <span className="supply-stock-value">{supplyStock(r)}</span>
                    <span className={`supply-badge st-${st}`}>{stMeta.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export function DocumentsHistoryPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('todos');
  const [type, setType] = useState('todos');

  useEffect(() => {
    void modulesApi.listSolicitudes().then((r) => setRows(r.data || []));
  }, []);

  const filtered = rows.filter((r) => {
    const dest = (r.destination || '').toLowerCase();
    const origin = (r.origin || '').toLowerCase();
    const matchQ =
      !q || dest.includes(q.toLowerCase()) || origin.includes(q.toLowerCase());
    const matchStatus = status === 'todos' || r.status === status;
    const matchType = type === 'todos' || r.mobilization_type === type;
    return matchQ && matchStatus && matchType;
  });

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
        <div className="filters-row">
          <label style={{ flex: '1 1 200px' }}>
            Buscar (origen / destino)
            <input
              className="form-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ej: Quito, Manta…"
            />
          </label>
          <label>
            Estado
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="todos">Todos</option>
              {Object.entries(REQUEST_STATUS_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tipo de movilización
            <select
              className="form-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="todos">Todos</option>
              {Object.entries(MOBILIZATION_TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <p className="ops-muted" style={{ textAlign: 'center', padding: 24 }}>
            No hay solicitudes con esos filtros.
          </p>
        ) : (
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
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>{r.destination}</td>
                  <td>{labelOf(MOBILIZATION_TYPE_LABEL, r.mobilization_type)}</td>
                  <td>{labelOf(REQUEST_STATUS_LABEL, r.status)}</td>
                  <td>{formatDateTimeReadable(r.departure_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
