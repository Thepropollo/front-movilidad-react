import { useEffect, useState } from 'react';
import { modulesApi } from '../api';

export default function ParticipantsPage() {
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [selected, setSelected] = useState<number | ''>('');
  const [summary, setSummary] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void modulesApi.listSolicitudes().then((r) => setSolicitudes(r.data || []));
  }, []);

  const load = async (id: number) => {
    const { data } = await modulesApi.participants(id);
    setParticipants(data.participants || []);
    setSummary(data.summary);
  };

  const search = async () => {
    const { data } = await modulesApi.searchStudents(query);
    setStudents(data || []);
  };

  const invite = async (userId: number) => {
    if (!selected) return;
    setMsg(null);
    setError(null);
    try {
      const { data } = await modulesApi.addParticipant(Number(selected), { user_id: userId });
      setMsg(data.message);
      await load(Number(selected));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'No se pudo invitar.');
    }
  };

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Participantes</p>
        <h1>Participantes del viaje</h1>
        <p className="module-lead">Invite estudiantes y revise confirmaciones.</p>
      </header>
      {msg && <div className="alert alert-info">{msg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="module-panel" style={{ marginBottom: 16 }}>
        <label className="form-label" htmlFor="sol">Solicitud</label>
        <select
          id="sol"
          className="form-select"
          value={selected}
          onChange={(e) => {
            const id = Number(e.target.value);
            setSelected(id);
            if (id) void load(id);
          }}
        >
          <option value="">Seleccione…</option>
          {solicitudes.map((s) => (
            <option key={s.id} value={s.id}>#{s.id} · {s.destination}</option>
          ))}
        </select>
      </div>
      {summary && (
        <div className="module-panel" style={{ marginBottom: 16 }}>
          <p>Total {summary.total} · Aceptados {summary.aceptados} · Rechazados {summary.rechazados} · Pendientes {summary.pendientes}</p>
        </div>
      )}
      {selected && (
        <div className="module-panel" style={{ marginBottom: 16 }}>
          <div className="filters-row">
            <input className="form-input" placeholder="Buscar estudiante por nombre/cédula/correo" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button type="button" className="btn btn-primary" onClick={() => void search()}>Buscar</button>
          </div>
          <ul className="ops-list">
            {students.map((s) => (
              <li key={s.id} className="ops-item">
                <div>
                  <strong>{s.first_name} {s.last_name}</strong>
                  <p className="ops-muted">{s.national_id} · {s.email}</p>
                </div>
                <button type="button" className="btn btn-primary" onClick={() => void invite(s.id)}>Invitar</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="module-panel">
        <table className="ops-table">
          <thead>
            <tr><th>Estudiante</th><th>Estado</th><th>Respondió</th></tr>
          </thead>
          <tbody>
            {participants.map((p) => (
              <tr key={p.id}>
                <td>{p.user?.first_name} {p.user?.last_name}</td>
                <td>{p.invitation_status}</td>
                <td>{p.responded_at ? String(p.responded_at).slice(0, 16) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
