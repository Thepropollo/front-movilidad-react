import { useEffect, useState } from 'react';
import { modulesApi } from '../api';

const empty = {
  commercial_name: '', ruc: '', address: '', price_per_liter: 1.8,
  monthly_quota_liters: 10000, contract_start: '', contract_end: '',
};

export default function GasStationsPage() {
  const [stations, setStations] = useState<any[]>([]);
  const [form, setForm] = useState(empty);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data } = await modulesApi.stations();
    setStations(data || []);
  };

  useEffect(() => { void load().catch(() => setError('No se pudieron cargar gasolineras.')); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await modulesApi.createStation(form);
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
        <h1>Contratos de gasolineras</h1>
        <p className="module-lead">Cupo, precio por litro y vigencia del convenio.</p>
      </header>
      {msg && <div className="alert alert-info">{msg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      <form className="module-panel" onSubmit={(e) => void submit(e)} style={{ marginBottom: 16, display: 'grid', gap: 10 }}>
        <div className="filters-row">
          <input className="form-input" placeholder="Nombre comercial" value={form.commercial_name} onChange={(e) => setForm({ ...form, commercial_name: e.target.value })} required />
          <input className="form-input" placeholder="RUC" value={form.ruc} onChange={(e) => setForm({ ...form, ruc: e.target.value })} required />
          <input className="form-input" placeholder="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
        </div>
        <div className="filters-row">
          <input className="form-input" type="number" step="0.001" placeholder="Precio/L" value={form.price_per_liter} onChange={(e) => setForm({ ...form, price_per_liter: Number(e.target.value) })} />
          <input className="form-input" type="number" placeholder="Cupo litros" value={form.monthly_quota_liters} onChange={(e) => setForm({ ...form, monthly_quota_liters: Number(e.target.value) })} />
          <input className="form-input" type="date" value={form.contract_start} onChange={(e) => setForm({ ...form, contract_start: e.target.value })} />
          <input className="form-input" type="date" value={form.contract_end} onChange={(e) => setForm({ ...form, contract_end: e.target.value })} />
          <button className="btn btn-primary" type="submit">Registrar contrato</button>
        </div>
      </form>
      <div className="module-panel">
        <table className="ops-table">
          <thead><tr><th>Estación</th><th>RUC</th><th>Precio</th><th>Cupo</th><th>Activo</th></tr></thead>
          <tbody>
            {stations.map((s) => (
              <tr key={s.id}>
                <td>{s.commercial_name}</td>
                <td>{s.ruc}</td>
                <td>{s.price_per_liter ?? '—'}</td>
                <td>{s.monthly_quota_liters ?? '—'}</td>
                <td>{String(s.active_agreement)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
