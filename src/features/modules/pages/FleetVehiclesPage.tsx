import { useEffect, useState } from 'react';
import Input from '@/components/Input';
import { OPERATIONAL_STATUS_LABEL, labelOf } from '@/lib/labels';
import { modulesApi } from '../api';

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

  const load = async () => {
    const { data } = await modulesApi.vehicles();
    setVehicles(data || []);
  };

  useEffect(() => {
    void load().catch(() => setError('No se pudieron cargar vehículos.'));
  }, []);

  const reset = () => {
    setForm(empty);
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
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setError(null);
    try {
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

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Flota</p>
        <h1>Vehículos</h1>
        <p className="module-lead">
          Registrar, editar y dar de baja el estado operativo de la flota.
        </p>
      </header>
      {msg && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

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
        <table className="ops-table">
          <thead>
            <tr>
              <th>Placa</th>
              <th>Unidad</th>
              <th>Km</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td>{v.plate}</td>
                <td>
                  {v.brand} {v.model}
                </td>
                <td>{v.current_mileage}</td>
                <td>
                  {v.status_details || labelOf(OPERATIONAL_STATUS_LABEL, v.operational_status)}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
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
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
