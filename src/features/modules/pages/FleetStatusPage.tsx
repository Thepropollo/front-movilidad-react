import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '@/components/Input';
import HeroMetricCard from '@/components/HeroMetricCard';
import { Car, ShieldCheck, AlertTriangle, XCircle } from 'lucide-react';
import { modulesApi } from '../api';
import {
  DOCUMENT_STATUS_META,
  VEHICLE_DOCUMENT_TYPES,
  getDocumentStatus,
  getVehicleDocument,
  type VehicleRecord,
} from '../vehicleDocuments';

const STATUS_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'valid', label: 'Al día' },
  { value: 'expiring', label: 'Por vencer' },
  { value: 'expired', label: 'Vencidos' },
  { value: 'missing', label: 'Pendientes' },
];

function getOverallStatus(vehicle: VehicleRecord) {
  const statuses = VEHICLE_DOCUMENT_TYPES.map(({ type }) =>
    getDocumentStatus(vehicle, type)
  );
  if (statuses.includes('expired')) return 'expired';
  if (statuses.includes('missing')) return 'missing';
  if (statuses.includes('expiring')) return 'expiring';
  return 'valid';
}

function DocumentStatus({
  vehicle,
  type,
}: {
  vehicle: VehicleRecord;
  type: (typeof VEHICLE_DOCUMENT_TYPES)[number]['type'];
}) {
  const status = getDocumentStatus(vehicle, type);
  const meta = DOCUMENT_STATUS_META[status] ?? DOCUMENT_STATUS_META.missing;
  const document = getVehicleDocument(vehicle, type);

  return (
    <div>
      <span
        style={{
          display: 'inline-flex',
          padding: '4px 8px',
          borderRadius: 999,
          color: meta.color,
          background: meta.background,
          fontSize: 12,
          fontWeight: 700,
          whiteSpace: 'nowrap',
        }}
      >
        {meta.label}
      </span>
      {document?.expiration_date && (
        <small style={{ display: 'block', marginTop: 4, color: 'var(--text-muted)' }}>
          Vence: {document.expiration_date}
        </small>
      )}
    </div>
  );
}

export default function FleetStatusPage() {
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    modulesApi
      .vehicles()
      .then(({ data }) => setVehicles(data || []))
      .catch(() => setError('No se pudo cargar el estado documental de la flota.'))
      .finally(() => setLoading(false));
  }, []);

  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      !normalizedSearch ||
      [vehicle.plate, vehicle.brand, vehicle.model].some((value) =>
        String(value ?? '').toLocaleLowerCase().includes(normalizedSearch)
      );
    const matchesStatus =
      statusFilter === 'all' || getOverallStatus(vehicle) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const upToDateCount = vehicles.filter((vehicle) => getOverallStatus(vehicle) === 'valid').length;
  const attentionCount = vehicles.length - upToDateCount;
  const expiredCount = vehicles.filter((vehicle) =>
    VEHICLE_DOCUMENT_TYPES.some(({ type }) => getDocumentStatus(vehicle, type) === 'expired')
  ).length;

  return (
    <section className="module-page flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-6">
      <HeroMetricCard
        badge="Flota Vehicular"
        badgeVariant="indigo"
        title="Estado Documental y Revisiones Técnicas"
        description="Inspección de vigencia de matrícula institucional, SOAT, permisos de circulación y estado documental del parque automotor."
        metricValue={`${vehicles.length ? Math.round((upToDateCount / vehicles.length) * 100) : 100}%`}
        metricLabel="DOCUMENTACIÓN AL DÍA"
      />

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {loading ? (
        <div className="module-panel" style={{ textAlign: 'center', padding: 48 }}>
          <span className="spinner" style={{ display: 'inline-block', marginBottom: 12 }} />
          <p className="ops-muted">Consultando documentación…</p>
        </div>
      ) : (
        <>
          {/* Modern Statistics Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div className="group p-4 bg-white border border-zinc-200 rounded-xl shadow-xs flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Registrados
                </span>
                <Car size={16} className="text-zinc-400" />
              </div>
              <div className="flex items-baseline justify-between">
                <strong className="font-mono font-bold text-2xl text-zinc-900 leading-none">
                  {vehicles.length}
                </strong>
                <span className="font-mono text-[11px] text-zinc-400">Total unidades</span>
              </div>
            </div>

            <div className="group p-4 bg-white border border-zinc-200 rounded-xl shadow-xs flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                  Al Día
                </span>
                <ShieldCheck size={16} className="text-emerald-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <strong className="font-mono font-bold text-2xl text-emerald-600 leading-none">
                  {upToDateCount}
                </strong>
                <span className="font-mono text-[11px] text-emerald-600 font-semibold">Sin novedades</span>
              </div>
            </div>

            <div className="group p-4 bg-white border border-zinc-200 rounded-xl shadow-xs flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-amber-600 uppercase tracking-wider">
                  Por Vencer
                </span>
                <AlertTriangle size={16} className="text-amber-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <strong className="font-mono font-bold text-2xl text-amber-600 leading-none">
                  {attentionCount}
                </strong>
                <span className="font-mono text-[11px] text-amber-500 font-semibold">Atención requerida</span>
              </div>
            </div>

            <div className="group p-4 bg-white border border-zinc-200 rounded-xl shadow-xs flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-rose-600 uppercase tracking-wider">
                  Vencidos
                </span>
                <XCircle size={16} className="text-rose-500" />
              </div>
              <div className="flex items-baseline justify-between">
                <strong className="font-mono font-bold text-2xl text-rose-600 leading-none">
                  {expiredCount}
                </strong>
                <span className="font-mono text-[11px] text-rose-500 font-semibold">Urgente</span>
              </div>
            </div>
          </div>

          <div className="module-panel">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 16,
                alignItems: 'end',
                marginBottom: 12,
              }}
            >
              <Input
                id="fleet-document-search"
                label="Buscar vehículo"
                placeholder="Buscar por placa, marca o modelo"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                containerStyle={{ marginBottom: 0 }}
              />
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="fleet-document-status">
                  Estado documental
                </label>
                <select
                  id="fleet-document-status"
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {STATUS_FILTERS.map((filter) => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredVehicles.length === 0 ? (
              <p className="ops-muted">
                {vehicles.length === 0
                  ? 'No hay vehículos registrados.'
                  : 'No hay vehículos que coincidan con los filtros.'}
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="ops-table" style={{ minWidth: 820 }}>
                  <thead>
                    <tr>
                      <th>Unidad</th>
                      {VEHICLE_DOCUMENT_TYPES.map(({ type, shortLabel }) => (
                        <th key={type}>{shortLabel}</th>
                      ))}
                      <th>Resultado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVehicles.map((vehicle) => {
                      const overallStatus = getOverallStatus(vehicle);
                      const overallMeta = DOCUMENT_STATUS_META[overallStatus];
                      return (
                        <tr key={vehicle.id}>
                          <td>
                            <strong>{vehicle.plate}</strong>
                            <br />
                            <span className="ops-muted">
                              {vehicle.brand} {vehicle.model}
                            </span>
                          </td>
                          {VEHICLE_DOCUMENT_TYPES.map(({ type }) => (
                            <td key={type}>
                              <DocumentStatus vehicle={vehicle} type={type} />
                            </td>
                          ))}
                          <td>
                            <span style={{ color: overallMeta.color, fontWeight: 700 }}>
                              {overallMeta.label}
                            </span>
                          </td>
                          <td>
                            <Link
                              className="btn btn-secondary"
                              style={{ width: 'auto', padding: '8px 12px', fontSize: 13 }}
                              to="/app/secretaria/flota/vehiculos"
                            >
                              Gestionar
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
