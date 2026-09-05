import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '@/components/Input';
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
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Flota</p>
        <h1>Estado documental de la flota</h1>
        <p className="module-lead">
          Revise si los permisos, la revisión técnica y la matrícula están al día.
        </p>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="module-panel" style={{ textAlign: 'center', padding: 48 }}>
          <span className="spinner" style={{ display: 'inline-block', marginBottom: 12 }} />
          <p className="ops-muted">Consultando documentación…</p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 14,
              marginBottom: 20,
            }}
          >
            <div className="module-panel">
              <p className="participants-kpi-label">Vehículos registrados</p>
              <strong style={{ fontSize: 28, color: 'var(--color-primary)' }}>{vehicles.length}</strong>
            </div>
            <div className="module-panel">
              <p className="participants-kpi-label">Documentación al día</p>
              <strong style={{ fontSize: 28, color: 'var(--success)' }}>{upToDateCount}</strong>
            </div>
            <div className="module-panel">
              <p className="participants-kpi-label">Requieren atención</p>
              <strong style={{ fontSize: 28, color: attentionCount ? 'var(--warning)' : 'var(--success)' }}>
                {attentionCount}
              </strong>
            </div>
            <div className="module-panel">
              <p className="participants-kpi-label">Con documentos vencidos</p>
              <strong style={{ fontSize: 28, color: expiredCount ? 'var(--danger)' : 'var(--success)' }}>
                {expiredCount}
              </strong>
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
