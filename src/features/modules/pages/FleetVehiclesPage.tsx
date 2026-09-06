import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import Input from '@/components/Input';
import { modulesApi } from '../api';
import {
  DOCUMENT_STATUS_META,
  EMPTY_VEHICLE_DOCUMENTS,
  VEHICLE_DOCUMENT_TYPES,
  getDocumentStatus,
  getVehicleDocument,
  type VehicleDocumentDraft,
  type VehicleDocumentType,
} from '../vehicleDocuments';

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
};

const actionBtn: React.CSSProperties = {
  width: 'auto',
  padding: '8px 16px',
  fontSize: 14,
};

export default function FleetVehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
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
    void load().catch(() => setError('No se pudieron cargar vehículos.'));
  }, []);

  const reset = () => {
    setForm(empty);
    setDocuments(EMPTY_VEHICLE_DOCUMENTS);
    setEditingId(null);
  };

  const startEdit = (v: any) => {
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

  const toggleStatus = async (v: any) => {
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

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Flota</p>
        <h1>Vehículos</h1>
        <p className="module-lead">
          Registrar vehículos y mantener al día sus permisos, revisión técnica y matrícula.
        </p>
      </header>
      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <form
        className="module-panel"
        onSubmit={(e) => void submit(e)}
        style={{ marginBottom: 16 }}
      >
        <h2 style={{ marginBottom: 16 }}>
          {editingId ? 'Editar vehículo' : 'Registrar nuevo vehículo'}
        </h2>
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
        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            type="submit"
            style={{ width: 'auto', padding: '14px 28px' }}
          >
            {editingId ? 'Guardar cambios' : 'Registrar vehículo'}
          </button>
          {editingId && (
            <button
              className="btn btn-secondary"
              type="button"
              onClick={reset}
              style={{ width: 'auto', padding: '14px 28px' }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="module-panel">
        <h2>Vehículos registrados</h2>
        <Input
          id="vehicle-search"
          label="Buscar vehículo"
          placeholder="Buscar por placa, marca o modelo"
          value={vehicleSearch}
          onChange={(e) => setVehicleSearch(e.target.value)}
          icon={<Search size={18} aria-hidden="true" />}
          containerStyle={{ marginBottom: 16 }}
        />
        <div style={{ overflowX: 'auto' }}>
          <table className="ops-table" style={{ minWidth: 780 }}>
            <thead>
              <tr>
                <th>Placa</th>
                <th>Unidad</th>
                {VEHICLE_DOCUMENT_TYPES.map(({ type, shortLabel }) => (
                  <th key={type}>{shortLabel}</th>
                ))}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((v) => (
                  <tr key={v.id}>
                    <td>{v.plate}</td>
                    <td>
                      {v.brand} {v.model}
                    </td>
                    {VEHICLE_DOCUMENT_TYPES.map(({ type }) => {
                      const status = getDocumentStatus(v, type);
                      const meta = DOCUMENT_STATUS_META[status] ?? DOCUMENT_STATUS_META.missing;
                      const document = getVehicleDocument(v, type);
                      return (
                        <td key={type}>
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
                            <small
                              style={{
                                display: 'block',
                                marginTop: 4,
                                color: 'var(--text-muted)',
                              }}
                            >
                              Vence: {document.expiration_date}
                            </small>
                          )}
                        </td>
                      );
                    })}
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-secondary"
                          style={actionBtn}
                          onClick={() => startEdit(v)}
                        >
                          Editar
                        </button>
                        <button
                          className={
                            v.operational_status === 'inactivo'
                              ? 'btn btn-success'
                              : 'btn btn-outline'
                          }
                          style={actionBtn}
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
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
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
