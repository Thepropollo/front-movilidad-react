import { useEffect, useState } from 'react';
import { Search, User, UserCheck, UserX, ShieldCheck } from 'lucide-react';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { modulesApi } from '../api';
import { HeroMetricCard, StatCard, ResourceCard } from '@/components/Cards';

interface DriverRecord {
  id: number;
  national_id: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  contract_type?: string;
  license_type?: string;
  current_points?: number;
  points?: number;
  expiration_date?: string;
  is_available: boolean;
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;
  licenses?: Array<{ license_type?: string }>;
}

const empty = {
  national_id: '',
  first_name: '',
  last_name: '',
  email: '',
  contract_type: 'contrato',
  license_type: 'E',
  current_points: 30,
  expiration_date: '',
  is_available: true,
};

export default function FleetDriversPage() {
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [driverSearch, setDriverSearch] = useState('');

  const load = async () => {
    const { data } = await modulesApi.drivers();
    setDrivers(data || []);
  };

  useEffect(() => {
    let ignore = false;
    modulesApi
      .drivers()
      .then(({ data }) => {
        if (!ignore) {
          setDrivers(data || []);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError('No se pudieron cargar conductores.');
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

  const startEdit = (d: DriverRecord) => {
    setEditingId(d.id);
    setMsg(null);
    setError(null);
    setForm({
      national_id: d.national_id ?? '',
      first_name: d.first_name ?? '',
      last_name: d.last_name ?? '',
      email: d.email ?? '',
      contract_type: d.contract_type ?? 'contrato',
      license_type: d.license_type ?? 'E',
      current_points: Number(d.points ?? d.current_points ?? 30),
      expiration_date:
        d.expiration_date && d.expiration_date !== 'N/A'
          ? String(d.expiration_date).slice(0, 10)
          : '',
      is_available: Boolean(d.is_available),
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setError(null);
    try {
      if (editingId) {
        const { data } = await modulesApi.updateDriver(editingId, {
          first_name: form.first_name,
          last_name: form.last_name,
          contract_type: form.contract_type,
          license_type: form.license_type,
          current_points: form.current_points,
          expiration_date: form.expiration_date,
          is_available: form.is_available,
        });
        setMsg(data.message);
      } else {
        const { data } = await modulesApi.createDriver({
          national_id: form.national_id,
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          contract_type: form.contract_type,
          license_type: form.license_type,
          current_points: form.current_points,
          expiration_date: form.expiration_date,
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

  const toggleAvailability = async (d: DriverRecord) => {
    setMsg(null);
    setError(null);
    try {
      const { data } = await modulesApi.updateDriver(d.id, {
        is_available: !d.is_available,
      });
      setMsg(data.message);
      await load();
    } catch (err: unknown) {
      const er = err as { response?: { data?: { message?: string } } };
      setError(er.response?.data?.message || 'Error al actualizar.');
    }
  };

  const normalizedDriverSearch = driverSearch.trim().toLocaleLowerCase();
  const filteredDrivers = normalizedDriverSearch
    ? drivers.filter((d) => {
        const name = `${d.user?.first_name || d.first_name || d.name || ''} ${
          d.user?.last_name || d.last_name || ''
        }`;
        const license = d.license_type || d.licenses?.[0]?.license_type || '';
        return [name, d.national_id, d.email, license].some((value) =>
          String(value ?? '').toLocaleLowerCase().includes(normalizedDriverSearch)
        );
      })
    : drivers;

  const availableCount = drivers.filter((d) => d.is_available).length;
  const fullPointsCount = drivers.filter((d) => (d.current_points ?? 30) >= 20).length;

  return (
    <section className="module-page flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-6">
      <HeroMetricCard
        badge="Gestión de Flota"
        badgeVariant="indigo"
        title="Directorio de Choferes Institucionales"
        description="Habilitación, control de puntos de licencia y turnos operativos de los conductores autorizados para la flota ULEAM."
        metricValue={`${drivers.length ? Math.round((availableCount / drivers.length) * 100) : 100}%`}
        metricLabel="DISPONIBILIDAD"
        actionLabel="Nuevo Conductor"
        onAction={() => reset()}
      />

      {/* Modern Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Choferes"
          value={drivers.length}
          hint="Personal registrado"
          icon={<User size={16} />}
          tone="neutral"
        />
        <StatCard
          label="Habilitados"
          value={availableCount}
          hint="Listos para ruta"
          icon={<UserCheck size={16} />}
          tone="ok"
        />
        <StatCard
          label="Puntos Plenos"
          value={fullPointsCount}
          hint="≥ 20 puntos"
          icon={<ShieldCheck size={16} />}
          tone="neutral"
        />
        <StatCard
          label="No Disponibles"
          value={drivers.length - availableCount}
          hint="En descanso o sanción"
          icon={<UserX size={16} />}
          tone={drivers.length - availableCount > 0 ? 'warn' : 'neutral'}
        />
      </div>

      {/* Quick Resource Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <ResourceCard
          title="Matriz de Disponibilidad"
          subtitle="Seguimiento de turnos y comisiones en tiempo real"
          icon={<UserCheck size={18} />}
          href="/app/secretaria/disponibilidad"
        />
        <ResourceCard
          title="Catálogo de Vehículos"
          subtitle="Asignar y emparejar unidades vehiculares de flota"
          icon={<User size={18} />}
          href="/app/secretaria/flota/vehiculos"
        />
        <ResourceCard
          title="Hojas de Ruta"
          subtitle="Emitir comisiones y órdenes de movilización"
          icon={<ShieldCheck size={18} />}
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
            {editingId ? 'Editar conductor' : 'Registrar nuevo conductor'}
          </h2>
          <p className="sgv-dark-form-subtitle">
            Credenciales institucionales, categoría de licencia y habilitación operativa
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
            id="driver-national-id"
            label="Cédula"
            value={form.national_id}
            onChange={(e) => setForm({ ...form, national_id: e.target.value })}
            disabled={!!editingId}
            required={!editingId}
          />
          <Input
            id="driver-first-name"
            label="Nombres"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            required
          />
          <Input
            id="driver-last-name"
            label="Apellidos"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            required
          />
          <Input
            id="driver-email"
            label="Correo electrónico"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            disabled={!!editingId}
            required={!editingId}
          />
          <div className="form-group">
            <label className="form-label" htmlFor="driver-contract">
              Tipo de contrato
            </label>
            <select
              id="driver-contract"
              className="form-select"
              value={form.contract_type}
              onChange={(e) =>
                setForm({ ...form, contract_type: e.target.value })
              }
            >
              <option value="contrato">Contrato</option>
              <option value="nombramiento">Nombramiento</option>
            </select>
          </div>
          <Input
            id="driver-license-type"
            label="Tipo de licencia"
            value={form.license_type}
            onChange={(e) => setForm({ ...form, license_type: e.target.value })}
            required
          />
          <Input
            id="driver-points"
            label="Puntos de licencia"
            type="number"
            min={0}
            max={30}
            value={form.current_points}
            onChange={(e) =>
              setForm({ ...form, current_points: Number(e.target.value) })
            }
            required
          />
          <Input
            id="driver-expiration"
            label="Vencimiento de licencia"
            type="date"
            value={form.expiration_date}
            onChange={(e) =>
              setForm({ ...form, expiration_date: e.target.value })
            }
            required
          />
          <div className="form-group">
            <label className="form-label">Disponibilidad</label>
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
                checked={form.is_available}
                onChange={(e) =>
                  setForm({ ...form, is_available: e.target.checked })
                }
              />
              Conductor disponible para asignación
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
            {editingId ? 'Guardar cambios' : 'Registrar conductor'}
          </Button>
        </div>
      </form>

      <div className="sgv-dark-table-card p-6">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
          <div>
            <h2 className="font-mono text-xl font-bold text-slate-900 tracking-tight">
              Conductores registrados
            </h2>
            <p className="font-mono text-xs text-slate-500 mt-0.5">
              Nómina de choferes institucionales y estatus de disponibilidad
            </p>
          </div>
        </div>
        <Input
          id="driver-search"
          label="Buscar conductor"
          placeholder="Buscar por nombre, cédula, correo o licencia"
          value={driverSearch}
          onChange={(e) => setDriverSearch(e.target.value)}
          icon={<Search size={18} aria-hidden="true" />}
          containerStyle={{ marginBottom: 16 }}
        />
        <div className="sgv-dark-table-wrapper">
          <table className="sgv-dark-table">
            <thead>
              <tr>
                <th>Conductor</th>
                <th>Disponibilidad</th>
                <th>Licencia</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.length > 0 ? (
                filteredDrivers.map((d, idx) => (
                  <tr key={d.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className={`sgv-avatar-squircle ${
                            idx % 3 === 0
                              ? 'is-purple'
                              : idx % 3 === 1
                              ? 'is-mint'
                              : 'is-amber'
                          }`}
                          aria-hidden="true"
                        />
                        <div>
                          <span className="font-mono font-bold text-slate-900 block">
                            {d.user?.first_name || d.name} {d.user?.last_name}
                          </span>
                          <span className="font-mono text-xs text-slate-500">
                            {d.user?.email || d.national_id || '—'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`sgv-pill-capsule ${
                          d.is_available ? 'is-active' : 'is-suspended'
                        }`}
                      >
                        {d.is_available ? 'Disponible' : 'No disponible'}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-slate-700">
                        {d.license_type || d.licenses?.[0]?.license_type || '—'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="inline-flex gap-2 justify-end">
                        <button
                          className="btn-dark-cancel text-xs cursor-pointer"
                          style={{ padding: '6px 12px' }}
                          onClick={() => startEdit(d)}
                        >
                          Editar
                        </button>
                        <button
                          className={
                            d.is_available
                              ? 'btn-dark-cancel text-xs cursor-pointer'
                              : 'btn-dark-submit text-xs cursor-pointer'
                          }
                          style={{ padding: '6px 12px' }}
                          onClick={() => void toggleAvailability(d)}
                        >
                          {d.is_available ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-8 font-mono text-slate-400 text-sm"
                  >
                    {driverSearch.trim()
                      ? 'No se encontraron conductores con esa búsqueda.'
                      : 'No hay conductores registrados.'}
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
