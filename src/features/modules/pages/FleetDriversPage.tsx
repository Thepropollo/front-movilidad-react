import { useEffect, useState } from 'react';
import { modulesApi } from '../api';

const empty = {
  national_id: '', first_name: '', last_name: '', email: '', contract_type: 'contrato',
  license_type: 'E', current_points: 30, expiration_date: '',
};

export default function FleetDriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [form, setForm] = useState(empty);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data } = await modulesApi.drivers();
    setDrivers(data || []);
  };

  useEffect(() => { void load().catch(() => setError('No se pudieron cargar conductores.')); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await modulesApi.createDriver(form);
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
        <h1>Conductores</h1>
        <p className="module-lead">Registrar y consultar conductores con licencia.</p>
      </header>
      {msg && <div className="alert alert-info">{msg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      <form className="module-panel" onSubmit={(e) => void submit(e)} style={{ marginBottom: 16, display: 'grid', gap: 10 }}>
        <div className="filters-row">
          <input className="form-input" placeholder="Cédula" value={form.national_id} onChange={(e) => setForm({ ...form, national_id: e.target.value })} required />
          <input className="form-input" placeholder="Nombres" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
          <input className="form-input" placeholder="Apellidos" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
        </div>
        <div className="filters-row">
          <input className="form-input" type="email" placeholder="Correo" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <select className="form-select" value={form.contract_type} onChange={(e) => setForm({ ...form, contract_type: e.target.value })}>
            <option value="contrato">Contrato</option>
            <option value="nombramiento">Nombramiento</option>
          </select>
          <input className="form-input" placeholder="Tipo licencia" value={form.license_type} onChange={(e) => setForm({ ...form, license_type: e.target.value })} required />
          <input className="form-input" type="date" value={form.expiration_date} onChange={(e) => setForm({ ...form, expiration_date: e.target.value })} required />
        </div>
        <button className="btn btn-primary" type="submit">Registrar conductor</button>
      </form>
      <div className="module-panel">
        <table className="ops-table">
          <thead><tr><th>Nombre</th><th>Disponible</th><th>Licencia</th></tr></thead>
          <tbody>
            {drivers.map((d) => (
              <tr key={d.id}>
                <td>{d.user?.first_name || d.name} {d.user?.last_name}</td>
                <td>{String(d.is_available ?? d.is_selectable)}</td>
                <td>{d.license_type || d.licenses?.[0]?.license_type || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
