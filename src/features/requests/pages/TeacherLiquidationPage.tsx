import React, { useState, useEffect } from 'react';
import {
  FileText,
  ClipboardList,
  AlertTriangle,
  Calculator,
  FileCheck,
  Landmark,
  DollarSign,
  Calendar,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { HeroMetricCard, StatCard, ResourceCard } from '@/components/Cards';
import { useAuth } from '@/context/AuthContext';
import {
  fetchTeacherPendingLiquidations,
  calculateCompensation,
  type RouteSheetSummary,
  type CompensationCalculation,
} from '../api/postTrip';

const TeacherLiquidationPage: React.FC = () => {
  const { roleIds } = useAuth();
  const canCalculate = roleIds.includes('secretaria');
  const [sheets, setSheets] = useState<RouteSheetSummary[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<RouteSheetSummary | null>(
    null
  );
  const [calc, setCalc] = useState<CompensationCalculation | null>(null);

  // UI states
  const [loading, setLoading] = useState<boolean>(true);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadSheets = async () => {
    try {
      setLoading(true);
      const data = await fetchTeacherPendingLiquidations();
      setSheets(data);
      setSelectedSheet(null);
      setCalc(null);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Error al cargar comisiones de viaje pendientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetchTeacherPendingLiquidations()
      .then((data) => {
        if (!ignore) {
          setSheets(data);
          setSelectedSheet(null);
          setCalc(null);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          console.error(err);
          setErrorMsg('Error al cargar comisiones de viaje pendientes.');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleSelectSheet = async (sheet: RouteSheetSummary) => {
    setSelectedSheet(sheet);
    setCalc(null);
    setErrorMsg(null);

    if (!canCalculate) {
      setErrorMsg(
        'El API permite calcular compensaciones únicamente a Secretaría. Esta cuenta puede consultar las comisiones, pero no liquidarlas.'
      );
      return;
    }

    setCalculating(true);
    try {
      const calculation = await calculateCompensation(sheet.id);
      setCalc(calculation);
    } catch (err: unknown) {
      console.error(err);
      const er = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        er.response?.data?.message ||
          'Error al calcular los haberes de la comisión.'
      );
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div
      className="glass-panel wide-container mx-auto"
      style={{ textAlign: 'left' }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="title-primary flex items-center gap-3">
            <Landmark className="text-secondary-brand" size={28} />
            Liquidación Financiera de Comisión
          </h1>
          <p className="text-muted mt-1">
            Consulta las comisiones pendientes. El cálculo está habilitado para
            Secretaría; el API no ofrece carga de comprobantes desde esta pantalla.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => void loadSheets()}
          disabled={loading}
        >
          <RefreshCw size={16} aria-hidden /> Actualizar
        </button>
      </div>

      {errorMsg && (
        <div className="error-banner mb-6 flex items-start gap-3">
          <AlertTriangle
            className="text-danger flex-shrink-0 mt-0.5"
            size={18}
          />
          <p className="text-danger-text text-sm">{errorMsg}</p>
        </div>
      )}

      {/* Hero Metric Banner Card */}
      <div className="mb-6">
        <HeroMetricCard
          headline="Liquidación Financiera de Comisión"
          author="Rendición de Cuentas, Viáticos, Facturas y Cierre de Hoja de Ruta"
          tag={{
            icon: <Landmark size={13} />,
            label: `${sheets.length} Comisiones de Viaje Pendientes de Cierre`,
          }}
          metricValue={sheets.length}
          metricLabel="Por Liquidar"
          gradientClass="from-slate-900 via-zinc-900 to-zinc-800"
        />
      </div>

      {/* Modern Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Comisiones Pendientes"
          value={sheets.length}
          hint="Pendientes según el API"
          icon={<ClipboardList size={16} />}
          tone={sheets.length > 0 ? 'warn' : 'neutral'}
        />
        <StatCard
          label="Comisión Seleccionada"
          value={selectedSheet ? `#${selectedSheet.id}` : 'Ninguna'}
          hint={selectedSheet ? selectedSheet.request.destination : 'Seleccione una'}
          icon={<FileText size={16} />}
          tone="info"
        />
        <StatCard
          label="Haberes Chofer"
          value={calc ? `$${calc.total_payout.toFixed(2)}` : '$0.00'}
          hint="Cálculo automático"
          icon={<DollarSign size={16} />}
          tone={calc ? 'ok' : 'neutral'}
        />
        <StatCard
          label="Comprobante"
          value="No disponible"
          hint="El API no ofrece carga de archivos para compensaciones"
          icon={<FileCheck size={16} />}
          tone="warn"
        />
      </div>

      {/* Quick Resource Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
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
        {canCalculate && (
          <ResourceCard
            title="Auditoría de Transporte"
            subtitle="Bandeja de revisión económica"
            icon={<Landmark size={18} />}
            href="/app/secretaria/economico"
          />
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div
            className="spinner mb-4"
            style={{ width: '40px', height: '40px' }}
          ></div>
          <p className="text-muted">
            Cargando tus comisiones pendientes de cierre...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Listado de viajes retornados */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="sgv-dark-form-card p-6">
              <h2 className="sgv-dark-form-title text-lg flex items-center gap-2 mb-2">
                <ClipboardList size={18} className="text-secondary" />
                Viajes Pendientes de Cierre
              </h2>
              <p className="font-mono text-slate-500 text-xs mb-4">
                {canCalculate
                  ? 'Selecciona una comisión finalizada para calcular los haberes del conductor.'
                  : 'Esta cuenta puede consultar las comisiones. El cálculo corresponde a Secretaría.'}
              </p>

              {sheets.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50/50">
                  <FileCheck className="text-slate-400 mb-2 mx-auto" size={32} />
                  <p className="font-mono font-semibold text-slate-600 text-xs">
                    Sin viajes por liquidar
                  </p>
                  <p className="font-mono text-slate-400 text-[10px] mt-1">
                    No hay comisiones pendientes disponibles para consulta.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
                  {sheets.map((sheet) => (
                    <button
                      key={sheet.id}
                      onClick={() => handleSelectSheet(sheet)}
                      disabled={!canCalculate}
                      aria-label={`${canCalculate ? 'Calcular' : 'Consultar'} comisión ${sheet.id}: ${sheet.request.destination}`}
                      className={`p-4 rounded-xl border text-left transition-all ${canCalculate ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'} ${
                        selectedSheet?.id === sheet.id
                          ? 'border-slate-900 bg-slate-50 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="sgv-pill-capsule is-warn text-[10px]">
                          RETORNADO
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          ID #{sheet.id}
                        </span>
                      </div>
                      <p className="font-mono font-bold text-slate-900 text-sm">
                        Destino: {sheet.request.destination}
                      </p>
                      <p className="font-mono text-slate-500 text-xs mt-1">
                        Chofer: {sheet.driver.user.first_name}{' '}
                        {sheet.driver.user.last_name}
                      </p>
                      <p className="font-mono text-slate-500 text-xs">
                        Vehículo: {sheet.vehicle.brand} ({sheet.vehicle.plate})
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Detalle de liquidación y carga de archivo */}
          <div className="lg:col-span-2">
            {!selectedSheet ? (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center bg-slate-50/50">
                <Calculator className="text-slate-400 mb-4" size={48} />
                <p className="font-mono font-semibold text-slate-700">
                  Cálculo de Haberes Automático
                </p>
                <p className="font-mono text-slate-500 text-xs max-w-sm mt-1">
                  {canCalculate
                    ? 'Selecciona una comisión del listado para calcular viáticos y horas extras del conductor.'
                    : 'El cálculo de compensaciones está restringido a Secretaría según el API.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* Desglose de Haberes del Conductor */}
                <div className="sgv-dark-form-card p-6 sm:p-8 relative">
                  <div className="sgv-dark-form-header">
                    <h2 className="sgv-dark-form-title flex items-center gap-2">
                      <Calculator size={22} className="text-secondary" />
                      Cálculo Analítico de Haberes (Conductor)
                    </h2>
                    <p className="sgv-dark-form-subtitle">
                      Cálculo automatizado de viáticos, subsistencias y recargos extraordinarios
                    </p>
                  </div>

                  {calculating ? (
                    <div className="flex flex-col items-center justify-center py-6">
                      <div
                        className="spinner mb-2"
                        style={{ width: '30px', height: '30px' }}
                      ></div>
                      <p className="font-mono text-slate-500 text-xs">
                        Computando viáticos y horas extras...
                      </p>
                    </div>
                  ) : calc ? (
                    <div className="flex flex-col gap-6">
                      {/* Tiempos de Viaje Reales */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50/80 border border-slate-200 p-4 rounded-xl font-mono">
                        <div>
                          <p className="text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                            <Calendar
                              size={14}
                              className="text-secondary"
                            />
                            Salida Registrada
                          </p>
                          <p className="font-bold text-slate-900 text-sm">
                            {calc.departure_real}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-medium flex items-center gap-1.5 mb-1">
                            <Clock size={14} className="text-secondary" />
                            Llegada Registrada
                          </p>
                          <p className="font-bold text-slate-900 text-sm">
                            {calc.arrival_real}
                          </p>
                        </div>
                      </div>

                      {/* Items breakdown */}
                      <div className="flex flex-col gap-3">
                        {/* Alojamiento */}
                        <div className="flex justify-between items-center p-3.5 bg-slate-50/60 border border-slate-200 rounded-xl">
                          <div>
                            <p className="font-mono font-bold text-slate-900 text-sm">
                              Alojamiento fuera de sede
                            </p>
                            <p className="font-mono text-slate-500 text-xs mt-0.5">
                              {calc.nights_outside} noches · ${calc.lodging_rate.toFixed(2)}/noche
                            </p>
                          </div>
                          <span className="font-mono font-bold text-emerald-600 text-base">
                            ${calc.lodging_amount.toFixed(2)}
                          </span>
                        </div>

                        {/* Alimentación */}
                        <div className="flex justify-between items-center p-3.5 bg-slate-50/60 border border-slate-200 rounded-xl">
                          <div>
                            <p className="font-mono font-bold text-slate-900 text-sm">
                              Alimentación
                            </p>
                            <p className="font-mono text-slate-500 text-xs mt-0.5">
                              {calc.nights_outside} días · ${calc.food_rate.toFixed(2)}/día
                            </p>
                          </div>
                          <span className="font-mono font-bold text-emerald-600 text-base">
                            ${calc.food_amount.toFixed(2)}
                          </span>
                        </div>

                        {/* Horas Suplementarias 50% */}
                        <div className="flex justify-between items-center p-3.5 bg-slate-50/60 border border-slate-200 rounded-xl">
                          <div>
                            <p className="font-mono font-bold text-slate-900 text-sm">
                              Horas Suplementarias (50%)
                            </p>
                            <p className="font-mono text-slate-500 text-xs mt-0.5">
                              {calc.overtime_50_hours} horas laboradas
                              post-jornada laboral (${calc.overtime_50_rate.toFixed(2)}/hr)
                            </p>
                          </div>
                          <span className="font-mono font-bold text-emerald-600 text-base">
                            ${calc.overtime_50_amount.toFixed(2)}
                          </span>
                        </div>

                        {/* Horas Extraordinarias 100% */}
                        <div className="flex justify-between items-center p-3.5 bg-slate-50/60 border border-slate-200 rounded-xl">
                          <div>
                            <p className="font-mono font-bold text-slate-900 text-sm">
                              Horas Extraordinarias (100%)
                            </p>
                            <p className="font-mono text-slate-500 text-xs mt-0.5">
                              {calc.overtime_100_hours} horas laboradas fin de
                              semana o feriado (${calc.overtime_100_rate.toFixed(2)}/hr)
                            </p>
                          </div>
                          <span className="font-mono font-bold text-emerald-600 text-base">
                            ${calc.overtime_100_amount.toFixed(2)}
                          </span>
                        </div>

                        {/* Total Pay */}
                        <div className="flex justify-between items-center p-4 bg-slate-100 border border-slate-200 rounded-xl mt-2">
                          <span className="font-mono font-bold text-slate-800 text-sm flex items-center gap-2">
                            <DollarSign size={18} className="text-secondary" />
                            Total Liquidación Conductor
                          </span>
                          <span className="font-mono font-bold text-slate-950 text-xl">
                            ${calc.total_payout.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                {calc && (
                  <div className="error-banner" role="note">
                    <p className="text-danger-text text-sm">
                      El backend no ofrece una ruta para cargar el comprobante de
                      esta compensación. No es posible enviarla a revisión desde
                      esta pantalla.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherLiquidationPage;
