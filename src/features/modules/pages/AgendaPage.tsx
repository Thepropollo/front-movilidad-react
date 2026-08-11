import { useEffect, useState } from 'react';
import { modulesApi } from '../api';

type Event = {
  id: number;
  date: string;
  destination: string;
  trip_status: string;
  driver_response: string;
  driver: string;
  vehicle: string;
};

export default function AgendaPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [range, setRange] = useState({ from: '', to: '' });
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const { data } = await modulesApi.agenda(range.from || undefined, range.to || undefined);
      setRange({ from: data.from, to: data.to });
      setEvents(data.events || []);
    } catch {
      setError('No se pudo cargar la agenda.');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Agenda</p>
        <h1>Agenda semanal</h1>
        <p className="module-lead">Viajes por conductor/vehículo en el rango seleccionado.</p>
      </header>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="module-panel filters-row">
        <label>
          Desde
          <input type="date" className="form-input" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
        </label>
        <label>
          Hasta
          <input type="date" className="form-input" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
        </label>
        <button type="button" className="btn btn-primary" onClick={() => void load()}>Actualizar</button>
      </div>
      <div className="module-panel">
        <table className="ops-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Destino</th>
              <th>Conductor</th>
              <th>Vehículo</th>
              <th>Estado viaje</th>
              <th>Respuesta</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td>{e.date}</td>
                <td>{e.destination}</td>
                <td>{e.driver}</td>
                <td>{e.vehicle}</td>
                <td>{e.trip_status}</td>
                <td>{e.driver_response}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && <p>Sin viajes en este rango.</p>}
      </div>
    </section>
  );
}
