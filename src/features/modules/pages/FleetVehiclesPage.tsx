import { useEffect, useState } from 'react';
import { modulesApi } from '../api';

const empty = {
  plate: '', brand: '', model: '', year: new Date().getFullYear(), color: 'Blanco',
  fuel_type: 'diesel', current_mileage: 0, next_oil_change_mileage: 5000, operational_status: 'disponible',
};

export default function FleetVehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [form, setForm] = useState(empty);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data } = await modulesApi.vehicles();
    setVehicles(data || []);
  };

  useEffect(() => { void load().catch(() => setError('No se pudieron cargar vehículos.')); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await modulesApi.createVehicle(form);
      setMsg(data.message);
      setForm(empty);
      await load();
    } catch (err: unknown) {
      const er = err as { response?: { data?: { message?: string } } };
      setError(er.response?.data?.message || 'Error al registrar.');
    }
  };

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Flota</p>
        <h1>Vehículos</h1>
        <p className="module-lead">Registrar y consultar estado operativo de la flota.</p>
      </header>
      {msg && <div className="alert alert-info">{msg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      <form className="module-panel" onSubmit={(e) => void submit(e)} style={{ marginBottom: 16, display: 'grid', gap: 10 }}>
        <div className="filters-row">
          <input className="form-input" placeholder="Placa" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} required />
          <input className="form-input" placeholder="Marca" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required />
          <input className="form-input" placeholder="Modelo" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required />
          <input className="form-input" type="number" placeholder="Año" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} required />
        </div>
        <div className="filters-row">
          <input className="form-input" type="number" placeholder="Km actual" value={form.current_mileage} onChange={(e) => setForm({ ...form, current_mileage: Number(e.target.value) })} required />
          <input className="form-input" type="number" placeholder="Próximo aceite" value={form.next_oil_change_mileage} onChange={(e) => setForm({ ...form, next_oil_change_mileage: Number(e.target.value) })} required />
          <button className="btn btn-primary" type="submit">Registrar vehículo</button>
        </div>
      </form>
      <div className="module-panel">
        <table className="ops-table">
          <thead><tr><th>Placa</th><th>Unidad</th><th>Km</th><th>Estado</th></tr></thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td>{v.plate}</td>
                <td>{v.brand} {v.model}</td>
                <td>{v.current_mileage}</td>
                <td>{v.operational_status || v.statusLabel || v.status_details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
