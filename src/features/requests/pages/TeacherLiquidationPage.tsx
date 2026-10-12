import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  ClipboardList,
  FileText,
  Info,
  Landmark,
  RefreshCw,
} from 'lucide-react';
import { HeroMetricCard, ResourceCard, StatCard } from '@/components/Cards';
import {
  fetchTeacherPendingLiquidations,
  type RouteSheetSummary,
} from '../api/postTrip';

/**
 * Comisiones finalizadas del docente (solo consulta).
 *
 * El backend expone GET /mis-comisiones-pendientes-liquidar para el docente,
 * pero NO tiene ningún endpoint para que el docente liquide viáticos ni cargue
 * comprobantes (calcular/liquidar compensaciones es exclusivo de Secretaría y
 * corresponde a los haberes del conductor). Por eso esta pantalla solo lista
 * las comisiones y muestra claramente que la liquidación no está disponible.
 */
const TeacherLiquidationPage: React.FC = () => {
  const [sheets, setSheets] = useState<RouteSheetSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const applyResult = useCallback(
    (promise: Promise<RouteSheetSummary[]>, isActive: () => boolean) =>
      promise
        .then((data) => {
          if (isActive()) setSheets(Array.isArray(data) ? data : []);
        })
        .catch((err: unknown) => {
          console.error(err);
          if (isActive()) {
            setErrorMsg('No se pudieron cargar las comisiones finalizadas.');
          }
        })
        .finally(() => {
          if (isActive()) setLoading(false);
        }),
    []
  );

  const reload = () => {
    setLoading(true);
    setErrorMsg(null);
    void applyResult(fetchTeacherPendingLiquidations(), () => true);
  };

  useEffect(() => {
    let active = true;
    void applyResult(fetchTeacherPendingLiquidations(), () => active);
    return () => {
      active = false;
    };
  }, [applyResult]);

  return (
    <div
      className="glass-panel wide-container mx-auto"
      style={{ textAlign: 'left' }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="title-primary flex items-center gap-3">
            <Landmark className="text-secondary-brand" size={28} />
            Comisiones finalizadas
          </h1>
          <p className="text-muted mt-1">
            Consulta de los viajes que ya regresaron y esperan cierre.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline"
          onClick={reload}
          disabled={loading}
        >
          <RefreshCw size={16} aria-hidden /> Actualizar
        </button>
      </div>

      <div
        className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
        role="note"
        aria-label="Liquidación de viáticos no disponible"
      >
        <Info className="mt-0.5 flex-shrink-0 text-amber-700" size={18} aria-hidden />
        <div className="text-sm text-amber-900">
          <p className="font-semibold">
            La liquidación de viáticos no está disponible todavía.
          </p>
          <p className="mt-1">
            El sistema aún no permite que el docente liquide viáticos ni cargue
            comprobantes. Por ahora puede consultar sus comisiones finalizadas;
            el cálculo de haberes del conductor lo realiza Secretaría.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="error-banner mb-6 flex items-start gap-3" role="alert">
          <AlertTriangle className="text-danger flex-shrink-0 mt-0.5" size={18} />
          <p className="text-danger-text text-sm">{errorMsg}</p>
        </div>
      )}

      <div className="mb-6">
        <HeroMetricCard
          headline="Comisiones finalizadas"
          author="Viajes retornados pendientes de cierre"
          tag={{
            icon: <Landmark size={13} />,
            label: `${sheets.length} comisiones pendientes de cierre`,
          }}
          metricValue={sheets.length}
          metricLabel="Pendientes"
          gradientClass="from-slate-900 via-slate-900 to-slate-800"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard
          label="Comisiones pendientes"
          value={sheets.length}
          hint="Según el sistema"
          icon={<ClipboardList size={16} />}
          tone={sheets.length > 0 ? 'warn' : 'neutral'}
        />
        <StatCard
          label="Liquidación de viáticos"
          value="No disponible"
          hint="Aún no implementada en el sistema"
          icon={<Info size={16} />}
          tone="warn"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <ResourceCard
          title="Historial de solicitudes"
          subtitle="Consultar estado y autorizaciones de viaje"
          icon={<FileText size={18} />}
          href="/app/docente/historial"
        />
        <ResourceCard
          title="Nueva solicitud"
          subtitle="Registrar una movilización institucional"
          icon={<Calendar size={18} />}
          href="/app/docente/solicitar"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12" role="status">
          <div className="spinner mb-4" style={{ width: '40px', height: '40px' }}></div>
          <p className="text-muted">Cargando comisiones finalizadas…</p>
        </div>
      ) : sheets.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50/50">
          <ClipboardList className="text-slate-500 mb-2 mx-auto" size={32} />
          <p className="font-semibold text-slate-600 text-sm">
            No tiene comisiones pendientes de cierre.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sheets.map((sheet) => (
            <li
              key={sheet.id}
              className="p-4 rounded-xl border border-slate-200 bg-white"
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <span className="sgv-pill-capsule is-warn text-[10px]">RETORNADO</span>
                <span className="text-[10px] text-slate-500">Hoja de ruta #{sheet.id}</span>
              </div>
              <p className="font-bold text-slate-900 text-sm">
                Destino: {sheet.request?.destination ?? '—'}
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Conductor: {sheet.driver?.user?.first_name ?? ''}{' '}
                {sheet.driver?.user?.last_name ?? ''}
              </p>
              <p className="text-slate-500 text-xs">
                Vehículo: {sheet.vehicle?.brand ?? '—'} ({sheet.vehicle?.plate ?? '—'})
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TeacherLiquidationPage;
