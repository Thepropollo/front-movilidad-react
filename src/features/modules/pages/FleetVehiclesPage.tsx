import { useEffect, useState } from 'react';
import { Search, Car, ShieldCheck, Wrench, AlertTriangle } from 'lucide-react';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { modulesApi } from '../api';
import { HeroMetricCard, StatCard, ResourceCard } from '@/components/Cards';
import {
  DOCUMENT_STATUS_META,
  EMPTY_VEHICLE_DOCUMENTS,
  VEHICLE_DOCUMENT_TYPES,
  getDocumentStatus,
  getVehicleDocument,
  type VehicleDocumentDraft,
  type VehicleDocumentType,
  type VehicleDocument,
} from '../vehicleDocuments';

interface VehicleRecord {
  id: number;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  fuel_type?: string;
  current_mileage?: number;
  next_oil_change_mileage?: number;
  operational_status: string;
  registration_number?: string;
  documents?: Record<string, VehicleDocument>;
}

const empty = {
  plate: '',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  color: 'Blanco',
  fuel_type: 'diesel',
  current_mileage: 0,
  next_oil_change_mileage: 5000,
  operational_status: 'disponible',
  registration_number: '',
};

export default function FleetVehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState(EMPTY_VEHICLE_DOCUMENTS);
  const [vehicleSearch, setVehicleSearch] = useState('');

  const load = async () => {
    const { data } = await modulesApi.vehicles();
    setVehicles(data || []);
  };

  useEffect(() => {
    let ignore = false;
    modulesApi
      .vehicles()
      .then(({ data }) => {
        if (!ignore) {
          setVehicles(data || []);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError('No se pudieron cargar vehículos.');
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const reset = () => {
    setForm(empty);
    setDocuments(EMPTY_VEHICLE_DOCUMENTS);
    setEditingId(null);
  };

  const startEdit = (v: VehicleRecord) => {
    setEditingId(v.id);
    setMsg(null);
    setError(null);
    setForm({
      plate: v.plate ?? '',
      brand: v.brand ?? '',
      model: v.model ?? '',
      year: Number(v.year ?? new Date().getFullYear()),
      color: v.color ?? 'Blanco',
      fuel_type: v.fuel_type ?? 'diesel',
      current_mileage: Number(v.current_mileage ?? 0),
      next_oil_change_mileage: Number(v.next_oil_change_mileage ?? 5000),
      operational_status: v.operational_status ?? 'disponible',
      registration_number: v.registration_number ?? '',
    });
    setDocuments(
      Object.fromEntries(
        VEHICLE_DOCUMENT_TYPES.map(({ type }) => {
          const document = getVehicleDocument(v, type);
          return [
            type,
            {
              issue_date: document?.issue_date ?? '',
              expiration_date: document?.expiration_date ?? '',
            },
          ];
        })
      ) as Record<VehicleDocumentType, VehicleDocumentDraft>
    );
  };

  const updateDocument = (
    type: VehicleDocumentType,
    field: keyof VehicleDocumentDraft,
    value: string
  ) => {
    setDocuments((current) => ({
      ...current,
      [type]: { ...current[type], [field]: value },
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setError(null);
    try {
      let vehicleId = editingId;
      if (editingId) {
        const { data } = await modulesApi.updateVehicle(editingId, {
          brand: form.brand,
          model: form.model,
          year: form.year,
          color: form.color,
          fuel_type: form.fuel_type,
          current_mileage: form.current_mileage,
          next_oil_change_mileage: form.next_oil_change_mileage,
          operational_status: form.operational_status,
          registration_number: form.registration_number,
        });
        setMsg(data.message);
      } else {
        const { data } = await modulesApi.createVehicle({
          plate: form.plate,
          brand: form.brand,
          model: form.model,
          year: form.year,
          color: form.color,
          fuel_type: form.fuel_type,
          current_mileage: form.current_mileage,
          next_oil_change_mileage: form.next_oil_change_mileage,
          operational_status: form.operational_status,
          registration_number: form.registration_number,
        });
        setMsg(data.message);
        vehicleId = data.vehicle?.id ?? null;
      }
      if (vehicleId) {
        const { data } = await modulesApi.updateVehicleDocuments(vehicleId, {
          documents,
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

  const toggleStatus = async (v: VehicleRecord) => {
    setMsg(null);
    setError(null);
    const nextStatus = v.operational_status === 'inactivo' ? 'disponible' : 'inactivo';
    try {
      const { data } = await modulesApi.updateVehicle(v.id, {
        operational_status: nextStatus,
      });
      setMsg(data.message);
      await load();
    } catch (err: unknown) {
      const er = err as { response?: { data?: { message?: string } } };
      setError(er.response?.data?.message || 'Error al actualizar.');
    }
  };

  const normalizedVehicleSearch = vehicleSearch.trim().toLocaleLowerCase();
  const filteredVehicles = normalizedVehicleSearch
    ? vehicles.filter((v) =>
        [v.plate, v.brand, v.model].some((value) =>
          String(value ?? '').toLocaleLowerCase().includes(normalizedVehicleSearch)
        )
      )
    : vehicles;

  const availableCount = vehicles.filter((v) => v.operational_status === 'disponible').length;
  const maintenanceCount = vehicles.filter((v) =>
    ['en_taller', 'mantenimiento', 'bloqueado_aceite'].includes(v.operational_status)
  ).length;
  const inactiveCount = vehicles.filter((v) => v.operational_status === 'inactivo').length;

  return (
    <section className="module-page flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-6">
      <HeroMetricCard
        badge="Flota Institucional"
        badgeVariant="indigo"
        title="Inventario y Control de Flota Vehicular"
        description="Parque automotor institucional, control de kilometraje, estado de operatividad y permisos de circulación técnica."
        metricValue={`${vehicles.length ? Math.round((availableCount / vehicles.length) * 100) : 100}%`}
        metricLabel="OPERATIVIDAD"
        actionLabel="Registrar Unidad"
        onAction={() => reset()}
      />

      {/* Modern Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Unidades"
          value={vehicles.length}
          hint="Parque automotor"
          icon={<Car size={16} />}
          tone="neutral"
        />
        <StatCard
          label="Operativos"
          value={availableCount}
          hint="Listos para ruta"
          icon={<ShieldCheck size={16} />}
          tone="ok"
        />
        <StatCard
          label="En Taller / Aceite"
          value={maintenanceCount}
          hint="Revisión técnica"
          icon={<Wrench size={16} />}
          tone={maintenanceCount > 0 ? 'warn' : 'neutral'}
        />
        <StatCard
          label="Inactivos"
          value={inactiveCount}
          hint="Fuera de servicio"
          icon={<AlertTriangle size={16} />}
          tone={inactiveCount > 0 ? 'danger' : 'neutral'}
        />
      </div>

      {/* Quick Resource Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <ResourceCard
          title="Auditoría Documental"
          subtitle="Monitoreo de SOAT, matrículas y vigencias"
          icon={<ShieldCheck size={18} />}
          href="/app/secretaria/flota/estado"
        />
        <ResourceCard
          title="Matriz de Disponibilidad"
          subtitle="Ver qué choferes y autos están libres hoy"
          icon={<Car size={18} />}
          href="/app/secretaria/disponibilidad"
        />
        <ResourceCard
          title="Taller de Mantenimiento"
          subtitle="Libro de novedades y órdenes mecánicas"
          icon={<Wrench size={18} />}
          href="/app/secretaria/taller"
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
            {editingId ? 'Editar vehículo' : 'Registrar nuevo vehículo'}
          </h2>
          <p className="sgv-dark-form-subtitle">
            Ingresa las especificaciones mecánicas y vigencia de permisos de la unidad
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
            id="vehicle-plate"
            label="Placa"
            value={form.plate}
            onChange={(e) => setForm({ ...form, plate: e.target.value })}
            disabled={!!editingId}
            required={!editingId}
          />
          <Input
            id="vehicle-registration"
            label="No. matrícula"
            value={form.registration_number}
            onChange={(e) =>
              setForm({ ...form, registration_number: e.target.value })
            }
          />
          <Input
            id="vehicle-brand"
            label="Marca"
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            required
          />
          <Input
            id="vehicle-model"
            label="Modelo"
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            required
          />
          <Input
            id="vehicle-year"
            label="Año"
            type="number"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
            required
          />
          <Input
            id="vehicle-color"
            label="Color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
          />
          <div className="form-group">
            <label className="form-label" htmlFor="vehicle-fuel">
              Tipo de combustible
            </label>
            <select
              id="vehicle-fuel"
              className="form-select"
              value={form.fuel_type}
              onChange={(e) => setForm({ ...form, fuel_type: e.target.value })}
            >
              <option value="diesel">Diésel</option>
              <option value="extra">Extra</option>
              <option value="super">Súper</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="vehicle-status">
              Estado operativo
            </label>
            <select
              id="vehicle-status"
              className="form-select"
              value={form.operational_status}
              onChange={(e) =>
                setForm({ ...form, operational_status: e.target.value })
              }
            >
              <option value="disponible">Disponible</option>
              <option value="en_viaje">En viaje</option>
              <option value="en_taller">En taller</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          <Input
            id="vehicle-mileage"
            label="Kilometraje actual"
            type="number"
            value={form.current_mileage}
            onChange={(e) =>
              setForm({ ...form, current_mileage: Number(e.target.value) })
            }
            required
          />
          <Input
            id="vehicle-oil"
            label="Próximo cambio de aceite (km)"
            type="number"
            value={form.next_oil_change_mileage}
            onChange={(e) =>
              setForm({
                ...form,
                next_oil_change_mileage: Number(e.target.value),
              })
            }
            required
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <h3 style={{ margin: '8px 0 12px', color: 'var(--color-primary)', fontSize: 15 }}>
            Documentación del vehículo
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: 12,
            }}
          >
            {VEHICLE_DOCUMENT_TYPES.map(({ type, label }) => (
              <fieldset
                key={type}
                style={{
                  minWidth: 0,
                  margin: 0,
                  padding: '12px 12px 0',
                  border: '1px solid var(--border-color)',
                  borderRadius: 10,
                }}
              >
                <legend style={{ padding: '0 4px', fontWeight: 700, fontSize: 13 }}>
                  {label}
                </legend>
                <Input
                  id={`vehicle-${type}-issue`}
                  label="Fecha de emisión"
                  type="date"
                  value={documents[type].issue_date}
                  onChange={(e) => updateDocument(type, 'issue_date', e.target.value)}
                  containerStyle={{ marginBottom: 12 }}
                />
                <Input
                  id={`vehicle-${type}-expiration`}
                  label="Vence el"
                  type="date"
                  value={documents[type].expiration_date}
                  onChange={(e) =>
                    updateDocument(type, 'expiration_date', e.target.value)
                  }
                  containerStyle={{ marginBottom: 12 }}
                />
              </fieldset>
            ))}
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
            {editingId ? 'Guardar cambios' : 'Registrar vehículo'}
          </Button>
        </div>
      </form>

      <div className="sgv-dark-table-card p-6">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
          <div>
            <h2 className="font-mono text-xl font-bold text-slate-900 tracking-tight">
              Vehículos registrados
            </h2>
            <p className="font-mono text-xs text-slate-500 mt-0.5">
              Inventario de la flota vehicular y vigencia documental
            </p>
          </div>
        </div>
        <Input
          id="vehicle-search"
          label="Buscar vehículo"
          placeholder="Buscar por placa, marca o modelo"
          value={vehicleSearch}
          onChange={(e) => setVehicleSearch(e.target.value)}
          icon={<Search size={18} aria-hidden="true" />}
          containerStyle={{ marginBottom: 16 }}
        />
        <div className="sgv-dark-table-wrapper">
          <table className="sgv-dark-table">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Unidad</th>
                {VEHICLE_DOCUMENT_TYPES.map(({ type, shortLabel }) => (
                  <th key={type}>{shortLabel}</th>
                ))}
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((v, idx) => (
                  <tr key={v.id}>
                    <td className="font-mono font-bold text-slate-900">{v.plate}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className={`sgv-avatar-squircle ${
                            idx % 3 === 0
                              ? 'is-mint'
                              : idx % 3 === 1
                              ? 'is-lavender'
                              : 'is-amber'
                          }`}
                          aria-hidden="true"
                        />
                        <div>
                          <span className="font-mono font-semibold text-slate-900 block">
                            {v.brand} {v.model}
                          </span>
                          <span className="font-mono text-xs text-slate-500">
                            Año {v.year} · {v.color}
                          </span>
                        </div>
                      </div>
                    </td>
                    {VEHICLE_DOCUMENT_TYPES.map(({ type }) => {
                      const status = getDocumentStatus(v, type);
                      const meta = DOCUMENT_STATUS_META[status] ?? DOCUMENT_STATUS_META.missing;
                      const document = getVehicleDocument(v, type);
                      const pillTone =
                        status === 'valid'
                          ? 'is-active'
                          : status === 'expiring'
                          ? 'is-warn'
                          : 'is-danger';
                      return (
                        <td key={type}>
                          <span className={`sgv-pill-capsule ${pillTone}`}>
                            {meta.label}
                          </span>
                          {document?.expiration_date && (
                            <small className="block font-mono text-[11px] text-slate-500 mt-1">
                              Vence: {document.expiration_date}
                            </small>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-right">
                      <div className="inline-flex gap-2 justify-end">
                        <button
                          className="btn-dark-cancel text-xs cursor-pointer"
                          style={{ padding: '6px 12px' }}
                          onClick={() => startEdit(v)}
                        >
                          Editar
                        </button>
                        <button
                          className={
                            v.operational_status === 'inactivo'
                              ? 'btn-dark-submit text-xs cursor-pointer'
                              : 'btn-dark-cancel text-xs cursor-pointer'
                          }
                          style={{ padding: '6px 12px' }}
                          onClick={() => void toggleStatus(v)}
                        >
                          {v.operational_status === 'inactivo'
                            ? 'Activar'
                            : 'Desactivar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3 + VEHICLE_DOCUMENT_TYPES.length}
                    className="text-center py-8 font-mono text-slate-400 text-sm"
                  >
                    {vehicleSearch.trim()
                      ? 'No se encontraron vehículos con esa búsqueda.'
                      : 'No hay vehículos registrados.'}
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
