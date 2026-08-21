import { useEffect, useState } from 'react';
import Input from '@/components/Input';
import { modulesApi } from '../api';

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

const actionBtn: React.CSSProperties = {
  width: 'auto',
  padding: '8px 16px',
  fontSize: 14,
};

export default function GasStationsPage() {
  const [stations, setStations] = useState<any[]>([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data } = await modulesApi.stations();
    setStations(data || []);
  };

  useEffect(() => {
    void load().catch(() => setError('No se pudieron cargar gasolineras.'));
  }, []);

  const reset = () => {
    setForm(empty);
    setEditingId(null);
  };

  const startEdit = (s: any) => {
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

  const toggle = async (s: any) => {
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

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Flota</p>
        <h1>Contratos de gasolineras</h1>
        <p className="module-lead">
          Cupo, precio por litro y vigencia del convenio.
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
          {editingId ? 'Editar contrato' : 'Registrar nuevo contrato'}
        </h2>
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
        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            type="submit"
            style={{ width: 'auto', padding: '14px 28px' }}
          >
            {editingId ? 'Guardar cambios' : 'Registrar contrato'}
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
        <h2>Estaciones de servicio registradas</h2>
        <table className="ops-table">
          <thead>
            <tr>
              <th>Estación</th>
              <th>RUC</th>
              <th>Precio</th>
              <th>Cupo</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {stations.map((s) => (
              <tr key={s.id}>
                <td>{s.commercial_name}</td>
                <td>{s.ruc}</td>
                <td>{s.price_per_liter ?? '—'}</td>
                <td>{s.monthly_quota_liters ?? '—'}</td>
                <td>{s.active_agreement ? 'Activo' : 'Inactivo'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-secondary"
                      style={actionBtn}
                      onClick={() => startEdit(s)}
                    >
                      Editar
                    </button>
                    <button
                      className={
                        s.active_agreement ? 'btn btn-outline' : 'btn btn-success'
                      }
                      style={actionBtn}
                      onClick={() => void toggle(s)}
                    >
                      {s.active_agreement ? 'Desactivar' : 'Activar'}
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
