import { useEffect, useMemo, useState } from 'react';
import { BedDouble, Clock3, Fuel, Save, Utensils } from 'lucide-react';
import { modulesApi } from '../api';

type Rate = {
  id: number;
  rate_key: string;
  rate_label?: string | null;
  rate_group?: 'allowance' | 'fuel' | 'other';
  rate_value: string | number;
};

const RATE_META: Record<
  string,
  { label: string; description: string; group: 'allowance' | 'fuel' | 'other'; icon: typeof BedDouble }
> = {
  alojamiento_diario: {
    label: 'Alojamiento fuera de sede',
    description: 'Costo por noche cuando el conductor permanece fuera.',
    group: 'allowance',
    icon: BedDouble,
  },
  alimentacion_diaria: {
    label: 'Alimentación diaria',
    description: 'Comida y alimentación por día de comisión.',
    group: 'allowance',
    icon: Utensils,
  },
  viatico_diario: {
    label: 'Viático diario general',
    description: 'Valor de respaldo para registros antiguos.',
    group: 'allowance',
    icon: Clock3,
  },
  extra_50: {
    label: 'Hora suplementaria (50%)',
    description: 'Hora adicional en jornada ordinaria.',
    group: 'allowance',
    icon: Clock3,
  },
  extra_100: {
    label: 'Hora extraordinaria (100%)',
    description: 'Hora adicional en fines de semana o feriados.',
    group: 'allowance',
    icon: Clock3,
  },
  precio_diesel: {
    label: 'Combustible diésel',
    description: 'Precio de referencia por galón.',
    group: 'fuel',
    icon: Fuel,
  },
  precio_extra: {
    label: 'Combustible extra',
    description: 'Precio de referencia por galón.',
    group: 'fuel',
    icon: Fuel,
  },
  precio_super: {
    label: 'Combustible súper',
    description: 'Precio de referencia por galón.',
    group: 'fuel',
    icon: Fuel,
  },
};

export default function RateConfigurationPage() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [newRate, setNewRate] = useState({
    rate_key: '',
    rate_label: '',
    rate_group: 'other' as 'allowance' | 'fuel' | 'other',
    rate_value: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await modulesApi.rates();
      setRates(data);
      setDrafts(
        Object.fromEntries(data.map((rate: Rate) => [rate.id, String(rate.rate_value)])),
      );
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { message?: string } } }).response;
      setError(response?.data?.message || 'No se pudieron cargar las tarifas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const dailyTotal = useMemo(() => {
    const lodging = rates.find((rate) => rate.rate_key === 'alojamiento_diario');
    const food = rates.find((rate) => rate.rate_key === 'alimentacion_diaria');
    return Number(drafts[lodging?.id ?? -1] || 0) + Number(drafts[food?.id ?? -1] || 0);
  }, [drafts, rates]);

  const save = async (rate: Rate) => {
    const value = Number(drafts[rate.id]);
    if (!Number.isFinite(value) || value <= 0) {
      setError('Ingrese un valor mayor que cero.');
      return;
    }

    setSavingId(rate.id);
    setMessage(null);
    setError(null);
    try {
      const { data } = await modulesApi.updateRate(rate.id, value);
      setRates((current) => current.map((item) => (item.id === rate.id ? data.rate : item)));
      setDrafts((current) => ({ ...current, [rate.id]: String(data.rate.rate_value) }));
      setMessage(data.message);
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { message?: string } } }).response;
      setError(response?.data?.message || 'No se pudo actualizar la tarifa.');
    } finally {
      setSavingId(null);
    }
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(newRate.rate_value);
    if (!newRate.rate_key || !newRate.rate_label || !Number.isFinite(value) || value <= 0) {
      setError('Complete la clave, el nombre y un valor mayor que cero.');
      return;
    }

    setCreating(true);
    setMessage(null);
    setError(null);
    try {
      const { data } = await modulesApi.createRate({ ...newRate, rate_value: value });
      setRates((current) => [...current, data.rate]);
      setDrafts((current) => ({ ...current, [data.rate.id]: String(data.rate.rate_value) }));
      setNewRate({ rate_key: '', rate_label: '', rate_group: 'other', rate_value: '' });
      setMessage(data.message);
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { message?: string } } }).response;
      setError(response?.data?.message || 'No se pudo crear la tarifa.');
    } finally {
      setCreating(false);
    }
  };

  const renderGroup = (group: 'allowance' | 'fuel' | 'other') => (
    <div className="module-panel" key={group}>
      <div className="module-header-actions" style={{ marginBottom: 20 }}>
        <div>
          <p className="module-kicker">{group === 'allowance' ? 'Comisión' : 'Operación'}</p>
          <h2>{group === 'allowance' ? 'Viáticos y tiempo' : group === 'fuel' ? 'Combustible' : 'Otros costos'}</h2>
        </div>
        {group === 'allowance' && (
          <div className="rate-total" aria-label="Costo diario fuera de sede">
            <span>Costo diario fuera de sede</span>
            <strong>${dailyTotal.toFixed(2)}</strong>
          </div>
        )}
      </div>
      <div className="rate-grid">
        {rates
          .filter((rate) => (RATE_META[rate.rate_key]?.group ?? rate.rate_group ?? 'other') === group)
          .map((rate) => {
            const meta = RATE_META[rate.rate_key] ?? {
              label: rate.rate_label || rate.rate_key,
              description: 'Tarifa operativa configurable.',
              group: rate.rate_group || group,
              icon: Clock3,
            };
            const Icon = meta.icon;
            return (
              <article className="rate-card" key={rate.id}>
                <div className="rate-card-icon" aria-hidden>
                  <Icon size={19} />
                </div>
                <div className="rate-card-copy">
                  <h3>{meta.label}</h3>
                  <p>{meta.description}</p>
                  <code>{rate.rate_key}</code>
                </div>
                <div className="rate-card-control">
                  <label className="sr-only" htmlFor={`rate-${rate.id}`}>
                    Valor de {meta.label}
                  </label>
                  <div className="rate-input-wrap">
                    <span>$</span>
                    <input
                      id={`rate-${rate.id}`}
                      className="form-input"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={drafts[rate.id] ?? ''}
                      onChange={(event) =>
                        setDrafts((current) => ({ ...current, [rate.id]: event.target.value }))
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary rate-save"
                    onClick={() => void save(rate)}
                    disabled={savingId === rate.id}
                  >
                    <Save size={15} aria-hidden />
                    {savingId === rate.id ? 'Guardando…' : 'Guardar'}
                  </button>
                </div>
              </article>
            );
          })}
      </div>
    </div>
  );

  return (
    <section className="module-page rates-page">
      <header className="module-header">
        <p className="module-kicker">Economía</p>
        <div className="module-header-actions">
          <div>
            <h1>Tarifas y costos</h1>
            <p className="module-lead">
              Actualice los valores que usa el sistema para calcular viáticos,
              horas extra y combustible.
            </p>
          </div>
          <button type="button" className="btn btn-outline" onClick={() => void load()} disabled={loading}>
            Actualizar
          </button>
        </div>
      </header>

      {message && <div className="alert alert-success" role="status">{message}</div>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <form className="module-panel rate-create-panel" onSubmit={(event) => void create(event)}>
        <div>
          <p className="module-kicker">Nueva configuración</p>
          <h2>Crear tarifa</h2>
          <p className="module-lead">
            Agregue cualquier costo que deba formar parte de una comisión o de la operación de flota.
          </p>
        </div>
        <div className="rate-create-grid">
          <div>
            <label className="form-label" htmlFor="new-rate-key">Clave técnica</label>
            <input
              id="new-rate-key"
              className="form-input"
              placeholder="ej. parqueadero_diario"
              value={newRate.rate_key}
              onChange={(event) => setNewRate((current) => ({ ...current, rate_key: event.target.value }))}
            />
          </div>
          <div>
            <label className="form-label" htmlFor="new-rate-label">Nombre visible</label>
            <input
              id="new-rate-label"
              className="form-input"
              placeholder="Parqueadero diario"
              value={newRate.rate_label}
              onChange={(event) => setNewRate((current) => ({ ...current, rate_label: event.target.value }))}
            />
          </div>
          <div>
            <label className="form-label" htmlFor="new-rate-group">Categoría</label>
            <select
              id="new-rate-group"
              className="form-select"
              value={newRate.rate_group}
              onChange={(event) => setNewRate((current) => ({ ...current, rate_group: event.target.value as typeof current.rate_group }))}
            >
              <option value="allowance">Viáticos y tiempo</option>
              <option value="fuel">Combustible</option>
              <option value="other">Otros costos</option>
            </select>
          </div>
          <div>
            <label className="form-label" htmlFor="new-rate-value">Valor</label>
            <input
              id="new-rate-value"
              className="form-input"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={newRate.rate_value}
              onChange={(event) => setNewRate((current) => ({ ...current, rate_value: event.target.value }))}
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary rate-create-submit" disabled={creating}>
          {creating ? 'Creando…' : 'Crear tarifa'}
        </button>
      </form>
      {loading ? (
        <div className="module-panel module-state" role="status">Cargando tarifas…</div>
      ) : rates.length === 0 ? (
        <div className="module-panel module-state" role="status">No hay tarifas configuradas.</div>
      ) : (
        <div className="rates-stack">
          {renderGroup('allowance')}
          {renderGroup('fuel')}
          {renderGroup('other')}
        </div>
      )}
    </section>
  );
}
