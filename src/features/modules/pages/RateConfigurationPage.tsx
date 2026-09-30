import { useEffect, useMemo, useState } from 'react';
import {
  BedDouble,
  Clock3,
  Fuel,
  Save,
  Utensils,
  PlusCircle,
  FileCheck2,
  DollarSign,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { modulesApi } from '../api';
import { HeroMetricCard, StatCard, ResourceCard } from '@/components/Cards';

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
    let ignore = false;
    modulesApi
      .rates()
      .then(({ data }) => {
        if (!ignore) {
          setRates(data);
          setDrafts(
            Object.fromEntries(data.map((rate: Rate) => [rate.id, String(rate.rate_value)])),
          );
        }
      })
      .catch((err: unknown) => {
        const response = (err as { response?: { data?: { message?: string } } }).response;
        if (!ignore) setError(response?.data?.message || 'No se pudieron cargar las tarifas.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const rateByKey = useMemo(
    () => new Map(rates.map((rate) => [rate.rate_key, Number(rate.rate_value)])),
    [rates],
  );

  const dailyTotal = useMemo(() => {
    const lodging = rateByKey.get('alojamiento_diario') ?? 0;
    const food = rateByKey.get('alimentacion_diaria') ?? 0;
    const fallback = rateByKey.get('viatico_diario') ?? 0;
    return lodging + food > 0 ? lodging + food : fallback;
  }, [rateByKey]);

  const allowanceCount = rates.filter(
    (r) => (RATE_META[r.rate_key]?.group ?? r.rate_group ?? 'other') === 'allowance',
  ).length;
  const fuelCount = rates.filter(
    (r) => (RATE_META[r.rate_key]?.group ?? r.rate_group ?? 'other') === 'fuel',
  ).length;

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
    <div className="module-panel shadow-sm border border-zinc-200 rounded-xl p-5 mb-4" key={group}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-zinc-100 pb-3">
        <div>
          <p className="text-xs uppercase font-mono tracking-wider font-semibold text-zinc-500 m-0">
            {group === 'allowance' ? 'Comisión y Personal' : group === 'fuel' ? 'Abastecimiento' : 'Operación'}
          </p>
          <h2 className="text-lg font-bold font-mono text-zinc-900 m-0 mt-0.5">
            {group === 'allowance' ? 'Viáticos, Estipendios y Horas Extra' : group === 'fuel' ? 'Precios de Combustible por Galón' : 'Otros Costos Operativos'}
          </h2>
        </div>
        {group === 'allowance' && (
          <div className="rate-total flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200" aria-label="Costo diario fuera de sede">
            <span className="text-xs font-mono text-emerald-800">Costo diario fuera de sede:</span>
            <strong className="text-sm font-mono font-bold text-emerald-900">${dailyTotal.toFixed(2)}</strong>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <article className="border border-zinc-200 rounded-xl p-4 bg-white hover:border-zinc-300 transition-all flex flex-col justify-between" key={rate.id}>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 shrink-0" aria-hidden>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold font-mono text-zinc-900 m-0">{meta.label}</h3>
                      <code className="text-[11px] font-mono text-zinc-400">{rate.rate_key}</code>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 font-mono mb-4">{meta.description}</p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                  <label className="sr-only" htmlFor={`rate-${rate.id}`}>
                    Valor de {meta.label}
                  </label>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-zinc-500">$</span>
                    <input
                      id={`rate-${rate.id}`}
                      className="form-input text-xs font-mono w-full pl-6"
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
                    className="btn btn-primary text-xs font-mono uppercase tracking-wider px-3 py-2 flex items-center gap-1.5 shrink-0"
                    onClick={() => void save(rate)}
                    disabled={savingId === rate.id}
                  >
                    <Save size={14} aria-hidden />
                    <span>{savingId === rate.id ? '…' : 'Guardar'}</span>
                  </button>
                </div>
              </article>
            );
          })}
      </div>
    </div>
  );

  return (
    <section className="module-page rates-page flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-6">
      <HeroMetricCard
        badge="Parámetros Financieros"
        badgeVariant="amber"
        title="Configuración de Tarifas y Costos Operativos"
        description="Actualice los valores base utilizados por el motor de cálculo del sistema para proyectar viáticos diarios de choferes, horas suplementarias/extraordinarias y precios referenciales de combustibles institucionales."
        metricValue={`$${dailyTotal.toFixed(2)}`}
        metricLabel="COSTO DIARIO FUERA DE SEDE"
        actionLabel="Actualizar Tarifas"
        onAction={() => void load()}
        actionLoading={loading}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Costo Diario Comisión"
          value={`$${dailyTotal.toFixed(2)}`}
          tone="info"
          icon={<DollarSign size={18} />}
          hint="Alojamiento + Alimentación"
        />
        <StatCard
          label="Tarifas Registradas"
          value={rates.length}
          tone="neutral"
          icon={<Calculator size={18} />}
          hint="Parámetros en base de datos"
        />
        <StatCard
          label="Parámetros Viáticos"
          value={allowanceCount}
          tone="warn"
          icon={<BedDouble size={18} />}
          hint="Alojamiento, comida y horas extra"
        />
        <StatCard
          label="Parámetros Combustible"
          value={fuelCount}
          tone="ok"
          icon={<Fuel size={18} />}
          hint="Precios referenciales / galón"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ResourceCard
          title="Bandeja de Solicitudes"
          description="Consulte solicitudes autorizadas listas para asignar."
          icon={<Calculator size={20} />}
          href="/app/secretaria/solicitudes"
        />
        <ResourceCard
          title="Compensaciones"
          description="Revise los montos calculados y las aprobaciones pendientes."
          icon={<FileCheck2 size={20} />}
          href="/app/secretaria/economico"
        />
        <ResourceCard
          title="Reportes de Transporte"
          description="Consulte y exporte reportes operativos y financieros."
          icon={<ShieldCheck size={20} />}
          href="/app/secretaria/reportes"
        />
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-mono flex items-center gap-2" role="status">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-mono flex items-center gap-2" role="alert">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form className="module-panel shadow-sm border border-zinc-200 rounded-xl p-5" onSubmit={(event) => void create(event)}>
        <div className="mb-4">
          <p className="text-xs uppercase font-mono tracking-wider font-semibold text-zinc-500 m-0">Parámetro Personalizado</p>
          <h2 className="text-lg font-bold font-mono text-zinc-900 m-0 mt-0.5">Crear Nueva Tarifa Operativa</h2>
          <p className="ops-muted text-xs font-mono mt-1">
            Agregue cualquier costo que deba formar parte de una comisión o de la operación de flota vehicular.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="text-xs font-mono font-semibold text-zinc-700 block mb-1" htmlFor="new-rate-key">
              Clave técnica
            </label>
            <input
              id="new-rate-key"
              className="form-input text-xs font-mono w-full"
              placeholder="ej. parqueadero_diario"
              value={newRate.rate_key}
              onChange={(event) => setNewRate((current) => ({ ...current, rate_key: event.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-mono font-semibold text-zinc-700 block mb-1" htmlFor="new-rate-label">
              Nombre visible
            </label>
            <input
              id="new-rate-label"
              className="form-input text-xs font-mono w-full"
              placeholder="Parqueadero diario"
              value={newRate.rate_label}
              onChange={(event) => setNewRate((current) => ({ ...current, rate_label: event.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-mono font-semibold text-zinc-700 block mb-1" htmlFor="new-rate-group">
              Categoría
            </label>
            <select
              id="new-rate-group"
              className="form-select text-xs font-mono w-full"
              value={newRate.rate_group}
              onChange={(event) => setNewRate((current) => ({ ...current, rate_group: event.target.value as typeof current.rate_group }))}
            >
              <option value="allowance">Viáticos y tiempo</option>
              <option value="fuel">Combustible</option>
              <option value="other">Otros costos</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-mono font-semibold text-zinc-700 block mb-1" htmlFor="new-rate-value">
              Valor ($)
            </label>
            <input
              id="new-rate-value"
              className="form-input text-xs font-mono w-full"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={newRate.rate_value}
              onChange={(event) => setNewRate((current) => ({ ...current, rate_value: event.target.value }))}
            />
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-primary text-xs font-mono uppercase tracking-wider px-6 py-2.5 flex items-center gap-2"
          disabled={creating}
        >
          <PlusCircle size={16} />
          <span>{creating ? 'Creando…' : 'Crear Tarifa'}</span>
        </button>
      </form>

      {loading ? (
        <div className="module-panel flex flex-col items-center justify-center py-12" role="status">
          <span className="spinner w-8 h-8 mb-3" />
          <p className="ops-muted font-mono text-xs">Cargando tarifas del sistema…</p>
        </div>
      ) : rates.length === 0 ? (
        <div className="module-panel text-center py-12" role="status">
          <p className="ops-muted font-mono text-xs">No hay tarifas configuradas.</p>
        </div>
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
