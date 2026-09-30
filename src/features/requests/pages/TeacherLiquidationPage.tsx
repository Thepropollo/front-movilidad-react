import React, { useState, useEffect } from 'react';
import {
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
            <div className="glass-panel p-6 bg-white/50">
              <h2 className="section-title flex items-center gap-2 mb-4">
                <ClipboardList size={18} className="text-primary-brand" />
                Viajes Pendientes de Cierre
              </h2>
              <p className="text-muted text-xs mb-4">
                La lista permite consultar las comisiones pendientes. El cálculo está
                habilitado únicamente para Secretaría.
              </p>

              {sheets.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50/50">
                  <FileCheck className="text-gray-300 mb-2 mx-auto" size={32} />
                  <p className="font-semibold text-gray-500 text-xs">
                    Sin viajes por liquidar
                  </p>
                  <p className="text-muted text-[10px] mt-1">
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
                      aria-label={canCalculate
                        ? 'Calcular comisión ' + sheet.id + ': ' + sheet.request.destination
                        : 'Cálculo no disponible para esta cuenta. Comisión ' + sheet.id}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        selectedSheet?.id === sheet.id
                          ? 'border-gold bg-gold/5 ring-1 ring-gold/20 shadow-xs'
                          : 'border-gray-150 hover:border-gray-250 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="text-[10px] bg-gold/15 text-gold-dark border border-gold/10 px-2 py-0.5 rounded-full font-bold">
                          RETORNADO
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          ID #{sheet.id}
                        </span>
                      </div>
                      <p className="font-bold text-primary text-sm">
                        Destino: {sheet.request.destination}
                      </p>
                      <p className="text-muted text-[11px] mt-1">
                        Chofer: {sheet.driver.user.first_name}{' '}
                        {sheet.driver.user.last_name}
                      </p>
                      <p className="text-muted text-[11px]">
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
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center bg-gray-50/50">
                <Calculator className="text-gray-300 mb-4" size={48} />
                <p className="font-semibold text-gray-500">
                  Cálculo de Haberes Automático
                </p>
                <p className="text-muted text-sm max-w-sm mt-1">
                  {canCalculate
                    ? 'Selecciona una comisión para calcular los haberes del conductor.'
                    : 'El cálculo de compensaciones está restringido a Secretaría según el API.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {/* Desglose de Haberes del Conductor */}
                <div className="glass-panel p-6 bg-white/50 relative">
                  <h2 className="section-title flex items-center gap-2 mb-6">
                    <Calculator size={18} className="text-primary-brand" />
                    Cálculo Analítico de Haberes (Conductor)
                  </h2>

                  {calculating ? (
                    <div className="flex flex-col items-center justify-center py-6">
                      <div
                        className="spinner mb-2"
                        style={{ width: '30px', height: '30px' }}
                      ></div>
                      <p className="text-muted text-xs">
                        Computando viáticos y horas extras...
                      </p>
                    </div>
                  ) : calc ? (
                    <div className="flex flex-col gap-6">
                      {/* Tiempos de Viaje Reales */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-white border border-gray-100 p-4 rounded-xl shadow-xs">
                        <div>
                          <p className="text-gray-400 font-medium flex items-center gap-1.5 mb-1">
                            <Calendar
                              size={14}
                              className="text-primary-brand"
                            />
                            Salida Registrada
                          </p>
                          <p className="font-bold text-primary">
                            {calc.departure_real}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-medium flex items-center gap-1.5 mb-1">
                            <Clock size={14} className="text-primary-brand" />
                            Llegada Registrada
                          </p>
                          <p className="font-bold text-primary">
                            {calc.arrival_real}
                          </p>
                        </div>
                      </div>

                      {/* Items breakdown */}
                      <div className="flex flex-col gap-3">
                        {/* Alojamiento */}
                        <div className="flex justify-between items-center p-3.5 bg-white border border-gray-100 rounded-2xl shadow-xs">
                          <div>
                            <p className="font-bold text-primary text-sm">
                              Alojamiento fuera de sede
                            </p>
                            <p className="text-muted text-xs mt-0.5">
                              {calc.nights_outside} noches · ${calc.lodging_rate.toFixed(2)}/noche
                            </p>
                          </div>
                          <span className="font-mono font-bold text-primary text-base">
                            ${calc.lodging_amount.toFixed(2)}
                          </span>
                        </div>

                        {/* Alimentación */}
                        <div className="flex justify-between items-center p-3.5 bg-white border border-gray-100 rounded-2xl shadow-xs">
                          <div>
                            <p className="font-bold text-primary text-sm">
                              Alimentación
                            </p>
                            <p className="text-muted text-xs mt-0.5">
                              {calc.nights_outside} días · ${calc.food_rate.toFixed(2)}/día
                            </p>
                          </div>
                          <span className="font-mono font-bold text-primary text-base">
                            ${calc.food_amount.toFixed(2)}
                          </span>
                        </div>

                        {/* Horas Suplementarias 50% */}
                        <div className="flex justify-between items-center p-3.5 bg-white border border-gray-100 rounded-2xl shadow-xs">
                          <div>
                            <p className="font-bold text-primary text-sm">
                              Horas Suplementarias (50%)
                            </p>
                            <p className="text-muted text-xs mt-0.5">
                              {calc.overtime_50_hours} horas laboradas
                              post-jornada laboral (${calc.overtime_50_rate.toFixed(2)}/hr)
                            </p>
                          </div>
                          <span className="font-mono font-bold text-primary text-base">
                            ${calc.overtime_50_amount.toFixed(2)}
                          </span>
                        </div>

                        {/* Horas Extraordinarias 100% */}
                        <div className="flex justify-between items-center p-3.5 bg-white border border-gray-100 rounded-2xl shadow-xs">
                          <div>
                            <p className="font-bold text-primary text-sm">
                              Horas Extraordinarias (100%)
                            </p>
                            <p className="text-muted text-xs mt-0.5">
                              {calc.overtime_100_hours} horas laboradas fin de
                              semana o feriado (${calc.overtime_100_rate.toFixed(2)}/hr)
                            </p>
                          </div>
                          <span className="font-mono font-bold text-primary text-base">
                            ${calc.overtime_100_amount.toFixed(2)}
                          </span>
                        </div>

                        {/* Total Pay */}
                        <div className="flex justify-between items-center p-4 bg-gold/10 border border-gold/25 rounded-2xl mt-2">
                          <span className="font-black text-primary text-sm flex items-center gap-2">
                            <DollarSign size={18} className="text-gold-dark" />
                            Total Liquidación Conductor
                          </span>
                          <span className="font-mono font-black text-gold-dark text-lg">
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
