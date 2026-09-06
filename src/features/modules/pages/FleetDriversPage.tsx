import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import Input from '@/components/Input';
import { yesNo } from '@/lib/labels';
import { modulesApi } from '../api';

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

const actionBtn: React.CSSProperties = {
  width: 'auto',
  padding: '8px 16px',
  fontSize: 14,
};

export default function FleetDriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
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
    void load().catch(() => setError('No se pudieron cargar conductores.'));
  }, []);

  const reset = () => {
    setForm(empty);
    setEditingId(null);
  };

  const startEdit = (d: any) => {
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

  const toggleAvailability = async (d: any) => {
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

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Flota</p>
        <h1>Conductores</h1>
        <p className="module-lead">
          Registrar, editar y desactivar conductores con licencia.
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
          {editingId ? 'Editar conductor' : 'Registrar nuevo conductor'}
        </h2>
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
        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            type="submit"
            style={{ width: 'auto', padding: '14px 28px' }}
          >
            {editingId ? 'Guardar cambios' : 'Registrar conductor'}
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
        <h2>Conductores registrados</h2>
        <Input
          id="driver-search"
          label="Buscar conductor"
          placeholder="Buscar por nombre, cédula, correo o licencia"
          value={driverSearch}
          onChange={(e) => setDriverSearch(e.target.value)}
          icon={<Search size={18} aria-hidden="true" />}
          containerStyle={{ marginBottom: 16 }}
        />
        <div style={{ overflowX: 'auto' }}>
          <table className="ops-table" style={{ minWidth: 680 }}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Disponible</th>
                <th>Licencia</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.length > 0 ? (
                filteredDrivers.map((d) => (
                  <tr key={d.id}>
                    <td>
                      {d.user?.first_name || d.name} {d.user?.last_name}
                    </td>
                    <td>{yesNo(d.is_available ?? d.is_selectable)}</td>
                    <td>
                      {d.license_type || d.licenses?.[0]?.license_type || '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-secondary"
                          style={actionBtn}
                          onClick={() => startEdit(d)}
                        >
                          Editar
                        </button>
                        <button
                          className={d.is_available ? 'btn btn-outline' : 'btn btn-success'}
                          style={actionBtn}
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
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
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
