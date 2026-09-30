import { useEffect, useState } from 'react';
import { Search, Fuel, CheckCircle2, DollarSign } from 'lucide-react';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { modulesApi } from '../api';
import { HeroMetricCard, StatCard, ResourceCard } from '@/components/Cards';

interface StationRecord {
  id: number;
  commercial_name: string;
  ruc: string;
  address: string;
  price_per_liter: number;
  monthly_quota_liters: number;
  contract_start?: string;
  contract_end?: string;
  active_agreement: boolean;
}

const empty = {
  commercial_name: '',
  ruc: '',
  address: '',
  price_per_liter: 1.8,
  monthly_quota_liters: 10000,
  contract_start: '',
  contract_end: '',
  active_agreement: true,
};

const normalizeSearchValue = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();

export default function GasStationsPage() {
  const [stations, setStations] = useState<StationRecord[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stationSearch, setStationSearch] = useState('');

  const load = async () => {
    const { data } = await modulesApi.stations();
    setStations(data || []);
  };

  useEffect(() => {
    let ignore = false;
    modulesApi
      .stations()
      .then(({ data }) => {
        if (!ignore) {
          setStations(data || []);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError('No se pudieron cargar gasolineras.');
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const reset = () => {
    setForm(empty);
    setEditingId(null);
  };

  const startEdit = (s: StationRecord) => {
    setEditingId(s.id);
    setMsg(null);
    setError(null);
    setForm({
      commercial_name: s.commercial_name ?? '',
      ruc: s.ruc ?? '',
      address: s.address ?? '',
      price_per_liter: Number(s.price_per_liter ?? 0),
      monthly_quota_liters: Number(s.monthly_quota_liters ?? 0),
      contract_start: s.contract_start
        ? String(s.contract_start).slice(0, 10)
        : '',
      contract_end: s.contract_end ? String(s.contract_end).slice(0, 10) : '',
      active_agreement: Boolean(s.active_agreement),
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setError(null);
    try {
      if (editingId) {
        const { data } = await modulesApi.updateStation(editingId, {
          commercial_name: form.commercial_name,
          address: form.address,
          price_per_liter: form.price_per_liter,
          monthly_quota_liters: form.monthly_quota_liters,
          contract_start: form.contract_start,
          contract_end: form.contract_end,
          active_agreement: form.active_agreement,
        });
        setMsg(data.message);
      } else {
        const { data } = await modulesApi.createStation({
          commercial_name: form.commercial_name,
          ruc: form.ruc,
          address: form.address,
          price_per_liter: form.price_per_liter,
          monthly_quota_liters: form.monthly_quota_liters,
          contract_start: form.contract_start,
          contract_end: form.contract_end,
          active_agreement: form.active_agreement,
        });
        setMsg(data.message);
      }
      reset();
      await load();
    } catch (err: unknown) {
      const er = err as { response?: { data?: { message?: string } } };
      setError(er.response?.data?.message || 'Error al guardar.');
    }
  };

  const toggle = async (s: StationRecord) => {
    setMsg(null);
    setError(null);
    try {
      const { data } = await modulesApi.updateStation(s.id, {
        active_agreement: !s.active_agreement,
      });
      setMsg(data.message);
      await load();
    } catch (err: unknown) {
      const er = err as { response?: { data?: { message?: string } } };
      setError(er.response?.data?.message || 'Error al actualizar.');
    }
  };

  const normalizedStationSearch = normalizeSearchValue(stationSearch.trim());
  const filteredStations = normalizedStationSearch
    ? stations.filter((s) =>
        [s.commercial_name, s.ruc, s.address].some((value) =>
          normalizeSearchValue(value).includes(normalizedStationSearch)
        )
      )
    : stations;

  const activeStations = stations.filter((s) => s.active_agreement).length;
  const totalQuota = stations.reduce(
    (acc, s) => acc + (Number(s.monthly_quota_liters) || 0),
    0
  );
  const avgPrice = stations.length
    ? (
        stations.reduce((acc, s) => acc + (Number(s.price_per_liter) || 0), 0) /
        stations.length
      ).toFixed(2)
    : '0.00';

  return (
    <section className="module-page flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-6">
      <HeroMetricCard
        badge="Flota y Combustible"
        badgeVariant="indigo"
        title="Convenios y Contratos de Combustible"
        description="Red de estaciones de servicio autorizadas, cupos mensuales asignados y vigencia contractual para la flota ULEAM."
        metricValue={`${stations.length ? Math.round((activeStations / stations.length) * 100) : 100}%`}
        metricLabel="VIGENCIA"
        actionLabel="Nueva Estación"
        onAction={() => reset()}
      />

      {/* Modern Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Estaciones Aliadas"
          value={stations.length}
          hint="Puntos registrados"
          icon={<Fuel size={16} />}
          tone="neutral"
        />
        <StatCard
          label="Convenios Activos"
          value={activeStations}
          hint="Vigentes para despacho"
          icon={<CheckCircle2 size={16} />}
          tone="ok"
        />
        <StatCard
          label="Cupo Mensual"
          value={`${totalQuota.toLocaleString()} L`}
          hint="Capacidad global"
          icon={<DollarSign size={16} />}
          tone="info"
        />
        <StatCard
          label="Precio Promedio"
          value={`$${avgPrice}`}
          hint="Por litro contratado"
          icon={<Fuel size={16} />}
          tone="neutral"
        />
      </div>

      {/* Quick Resource Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <ResourceCard
          title="Emisión de Vales"
          subtitle="Generar órdenes de carga de combustible por comisión"
          icon={<Fuel size={18} />}
          href="/app/secretaria/combustible/despacho"
        />
        <ResourceCard
          title="Auditoría de Liquidaciones"
          subtitle="Verificar tickets y facturas post-viaje"
          icon={<CheckCircle2 size={18} />}
          href="/app/secretaria/economico"
        />
        <ResourceCard
          title="Panel de Transporte"
          subtitle="Despacho institucional y hojas de ruta"
          icon={<DollarSign size={18} />}
          href="/app/secretaria/asignar"
        />
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <form
        className="sgv-dark-form-card mb-6"
        onSubmit={(e) => void submit(e)}
      >
        <div className="sgv-dark-form-header">
          <h2 className="sgv-dark-form-title">
            {editingId ? 'Editar contrato' : 'Registrar nuevo contrato'}
          </h2>
          <p className="sgv-dark-form-subtitle">
            Cupo mensual, tarifas por litro y vigencia del convenio institucional
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            columnGap: 16,
          }}
        >
          <Input
            id="station-name"
            label="Nombre comercial"
            value={form.commercial_name}
            onChange={(e) =>
              setForm({ ...form, commercial_name: e.target.value })
            }
            required
          />
          <Input
            id="station-ruc"
            label="RUC"
            value={form.ruc}
            onChange={(e) => setForm({ ...form, ruc: e.target.value })}
            disabled={!!editingId}
            required={!editingId}
          />
          <Input
            id="station-address"
            label="Dirección"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            required
          />
          <Input
            id="station-price"
            label="Precio por litro"
            type="number"
            step="0.001"
            value={form.price_per_liter}
            onChange={(e) =>
              setForm({ ...form, price_per_liter: Number(e.target.value) })
            }
          />
          <Input
            id="station-quota"
            label="Cupo mensual (litros)"
            type="number"
            value={form.monthly_quota_liters}
            onChange={(e) =>
              setForm({ ...form, monthly_quota_liters: Number(e.target.value) })
            }
          />
          <Input
            id="station-start"
            label="Inicio del contrato"
            type="date"
            value={form.contract_start}
            onChange={(e) =>
              setForm({ ...form, contract_start: e.target.value })
            }
          />
          <Input
            id="station-end"
            label="Fin del contrato"
            type="date"
            value={form.contract_end}
            onChange={(e) => setForm({ ...form, contract_end: e.target.value })}
          />
          <div className="form-group">
            <label className="form-label">Convenio</label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: '10px 0',
              }}
            >
              <input
                type="checkbox"
                style={{ width: 20, height: 20 }}
                checked={form.active_agreement}
                onChange={(e) =>
                  setForm({ ...form, active_agreement: e.target.checked })
                }
              />
              Convenio activo
            </label>
          </div>
        </div>
        <div className="sgv-dark-divider">
          {editingId && (
            <Button
              variant="dark-cancel"
              type="button"
              onClick={reset}
              fullWidth={false}
            >
              Cancelar
            </Button>
          )}
          <Button
            variant="dark-submit"
            type="submit"
            fullWidth={false}
          >
            {editingId ? 'Guardar cambios' : 'Registrar contrato'}
          </Button>
        </div>
      </form>

      <div className="sgv-dark-table-card p-6">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
          <div>
            <h2 className="font-mono text-xl font-bold text-slate-900 tracking-tight">
              Estaciones de servicio registradas
            </h2>
            <p className="font-mono text-xs text-slate-500 mt-0.5">
              Convenios institucionales activos y volumen de combustible
            </p>
          </div>
        </div>
        <Input
          id="station-search"
          label="Buscar estación"
          placeholder="Buscar por nombre, RUC o dirección"
          value={stationSearch}
          onChange={(e) => setStationSearch(e.target.value)}
          icon={<Search size={18} aria-hidden="true" />}
          containerStyle={{ marginBottom: 16 }}
          aria-label="Buscar estación por nombre, RUC o dirección"
        />
        <div className="sgv-dark-table-wrapper">
          <table className="sgv-dark-table">
            <thead>
              <tr>
                <th>Estación</th>
                <th>RUC</th>
                <th>Precio/L</th>
                <th>Cupo mensual</th>
                <th>Estado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredStations.length > 0 ? (
                filteredStations.map((s, idx) => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className={`sgv-avatar-squircle ${
                            idx % 3 === 0
                              ? 'is-amber'
                              : idx % 3 === 1
                              ? 'is-mint'
                              : 'is-lavender'
                          }`}
                          aria-hidden="true"
                        />
                        <div>
                          <span className="font-mono font-bold text-slate-900 block">
                            {s.commercial_name}
                          </span>
                          <span className="font-mono text-xs text-slate-500">
                            {s.address}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-slate-700">{s.ruc}</span>
                    </td>
                    <td>
                      <span className="font-mono font-bold text-emerald-600">
                        {s.price_per_liter ? `$${Number(s.price_per_liter).toFixed(3)}` : '—'}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-slate-700">
                        {s.monthly_quota_liters ? `${s.monthly_quota_liters} L` : '—'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`sgv-pill-capsule ${
                          s.active_agreement ? 'is-active' : 'is-suspended'
                        }`}
                      >
                        {s.active_agreement ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="inline-flex gap-2 justify-end">
                        <button
                          className="btn-dark-cancel text-xs cursor-pointer"
                          style={{ padding: '6px 12px' }}
                          onClick={() => startEdit(s)}
                        >
                          Editar
                        </button>
                        <button
                          className={
                            s.active_agreement
                              ? 'btn-dark-cancel text-xs cursor-pointer'
                              : 'btn-dark-submit text-xs cursor-pointer'
                          }
                          style={{ padding: '6px 12px' }}
                          onClick={() => void toggle(s)}
                        >
                          {s.active_agreement ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-8 font-mono text-slate-400 text-sm"
                  >
                    {stationSearch.trim()
                      ? 'No se encontraron estaciones con esa búsqueda.'
                      : 'No hay estaciones registradas.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
