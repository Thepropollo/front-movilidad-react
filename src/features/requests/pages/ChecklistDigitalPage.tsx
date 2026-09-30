import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Car,
  Gauge,
  Fuel,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useAuth } from '@/context/AuthContext';
import { HeroMetricCard, StatCard, ResourceCard } from '@/components/Cards';
import { CONTRACT_TYPE_LABEL, labelOf } from '@/lib/labels';
import {
  fetchPendingRouteSheets,
  fetchChecklistComponents,
  submitChecklist,
  type PendingRouteSheet,
  type ChecklistComponent,
} from '../api/inspection';

const ChecklistDigitalPage: React.FC = () => {
  const { roleIds } = useAuth();
  const [routeSheets, setRouteSheets] = useState<PendingRouteSheet[]>([]);
  const [components, setComponents] = useState<ChecklistComponent[]>([]);

  // Selection states
  const [selectedSheetId, setSelectedSheetId] = useState<number | ''>('');
  const [selectedSheet, setSelectedSheet] = useState<PendingRouteSheet | null>(
    null
  );

  // Form states
  const [mileage, setMileage] = useState<string>('');
  const [fuelLevel, setFuelLevel] = useState<'1/4' | '1/2' | '3/4' | 'full'>(
    'full'
  );
  const [checklistStates, setChecklistStates] = useState<
    Record<number, 'BUENO' | 'REGULAR' | 'MALO'>
  >({});

  // UI states
  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch initial data
  const loadData = async () => {
    try {
      setFetching(true);
      const [sheetsData, componentsData] = await Promise.all([
        fetchPendingRouteSheets(),
        fetchChecklistComponents(),
      ]);
      setRouteSheets(sheetsData);
      setComponents(componentsData);

      // Initialize checklist components state to BUENO
      const initialStates: Record<number, 'BUENO' | 'REGULAR' | 'MALO'> = {};
      componentsData.forEach((comp) => {
        initialStates[comp.id] = 'BUENO';
      });
      setChecklistStates(initialStates);
    } catch (err: unknown) {
      console.error('Error al cargar datos:', err);
      setErrorMsg('Error al conectar con el servidor. Por favor, recarga.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    Promise.all([
      fetchPendingRouteSheets(),
      fetchChecklistComponents(),
    ])
      .then(([sheetsData, componentsData]) => {
        if (!ignore) {
          setRouteSheets(sheetsData);
          setComponents(componentsData);
          const initialStates: Record<number, 'BUENO' | 'REGULAR' | 'MALO'> = {};
          componentsData.forEach((comp) => {
            initialStates[comp.id] = 'BUENO';
          });
          setChecklistStates(initialStates);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          console.error('Error al cargar datos:', err);
          setErrorMsg('Error al conectar con el servidor. Por favor, recarga.');
        }
      })
      .finally(() => {
        if (!ignore) {
          setFetching(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  // Update selected route sheet data
  const handleSheetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value ? Number(e.target.value) : '';
    setSelectedSheetId(id);
    setSuccessMsg(null);
    setErrorMsg(null);

    if (id) {
      const sheet = routeSheets.find((s) => s.id === id) || null;
      setSelectedSheet(sheet);
      if (sheet) {
        setMileage(sheet.vehicle.current_mileage.toString());
      }
    } else {
      setSelectedSheet(null);
      setMileage('');
    }
  };

  const handleConditionChange = (
    componentId: number,
    condition: 'BUENO' | 'REGULAR' | 'MALO'
  ) => {
    setChecklistStates((prev) => ({
      ...prev,
      [componentId]: condition,
    }));
  };

  // Determine if any component is marked MALO
  const hasMaloComponent = Object.values(checklistStates).includes('MALO');
  const isArrivalInspection = selectedSheet?.trip_status !== 'programado';

  // Group components by category
  const categories = Array.from(new Set(components.map((c) => c.category)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSheet) return;

    const numMileage = Number(mileage);
    if (isNaN(numMileage) || numMileage <= 0) {
      setErrorMsg('Por favor, ingresa un kilometraje válido.');
      return;
    }

    const regType: 'salida' | 'llegada' =
      selectedSheet.trip_status === 'programado' ? 'salida' : 'llegada';

    // Mileage validations
    if (
      regType === 'salida' &&
      numMileage < selectedSheet.vehicle.current_mileage
    ) {
      setErrorMsg(
        `El kilometraje de salida no puede ser menor al kilometraje actual del vehículo (${selectedSheet.vehicle.current_mileage} km).`
      );
      return;
    }

    if (
      regType === 'llegada' &&
      selectedSheet.initial_mileage &&
      numMileage < selectedSheet.initial_mileage
    ) {
      setErrorMsg(
        `El kilometraje de llegada no puede ser menor al de salida (${selectedSheet.initial_mileage} km).`
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        route_sheet_id: selectedSheet.id,
        registration_type: regType,
        fuel_level: fuelLevel,
        checkpoint_mileage: numMileage,
        components: Object.entries(checklistStates).map(([id, condition]) => ({
          id: Number(id),
          physical_condition: condition,
        })),
      };

      await submitChecklist(payload);

      setSuccessMsg(
        hasMaloComponent
          ? 'Novedad reportada. El vehículo ha sido derivado al taller para su revisión técnica.'
          : `Inspección de ${regType} procesada con éxito. Unidad liberada.`
      );

      // Reset form states
      setSelectedSheetId('');
      setSelectedSheet(null);
      setMileage('');
      setFuelLevel('full');

      // Reload data
      await loadData();
    } catch (err: unknown) {
      console.error(err);
      const er = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        er.response?.data?.message || 'Error al guardar la inspección.'
      );
    } finally {
      setLoading(false);
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
            <ClipboardList className="text-secondary-brand" size={28} />
            Inspección en Patio y Checklist Digital
          </h1>
          <p className="text-muted mt-1">
            Control técnico de vehículos al despacho (salida) e ingreso
            (llegada) de comisiones.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="success-banner mb-6 flex items-start gap-3">
          <CheckCircle2
            className="text-success flex-shrink-0 mt-0.5"
            size={18}
          />
          <div>
            <p className="font-semibold text-success-text">
              ¡Registro Exitoso!
            </p>
            <p className="text-success-text text-sm mt-0.5">{successMsg}</p>
          </div>
        </div>
      )}

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
          headline="Inspección en Patio y Checklist Digital"
          author="Evaluación Técnica de Seguridad y Estado Pre/Post Movilización"
          tag={{
            icon: <ClipboardList size={13} />,
            label: `${routeSheets.length} Hojas de Ruta Pendientes de Control`,
          }}
          metricValue={routeSheets.length}
          metricLabel="Por Inspeccionar"
          gradientClass="from-slate-900 via-zinc-900 to-zinc-800"
        />
      </div>

      {/* Modern Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Por Inspeccionar"
          value={routeSheets.length}
          hint="Patio de maniobras"
          icon={<ClipboardList size={16} />}
          tone={routeSheets.length > 0 ? 'warn' : 'neutral'}
        />
        <StatCard
          label="Puntos de Chequeo"
          value={components.length}
          hint="Ítems evaluados"
          icon={<Gauge size={16} />}
          tone="info"
        />
        <StatCard
          label="Nivel de Alerta"
          value={routeSheets.length > 3 ? 'Alta' : 'Normal'}
          hint="Flujo vehicular"
          icon={<AlertTriangle size={16} />}
          tone={routeSheets.length > 3 ? 'warn' : 'ok'}
        />
        <StatCard
          label="Estado Protocolo"
          value={routeSheets.length > 0 ? `${routeSheets.length} En Cola` : 'Al Día'}
          hint={routeSheets.length > 0 ? 'Inspecciones pendientes' : 'Todas inspeccionadas'}
          icon={<ShieldCheck size={16} />}
          tone={routeSheets.length > 0 ? 'warn' : 'ok'}
        />
      </div>

      {/* Quick Resource Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {roleIds.includes('secretaria') ? (
          <>
            <ResourceCard
              title="Asignación de Transporte"
              subtitle="Revise solicitudes listas para asignar conductor y vehículo."
              icon={<Car size={18} />}
              href="/app/secretaria/asignar"
            />
            <ResourceCard
              title="Taller Mecánico"
              subtitle="Consulte novedades y órdenes de mantenimiento."
              icon={<ClipboardList size={18} />}
              href="/app/secretaria/taller"
            />
            <ResourceCard
              title="Despacho de Combustible"
              subtitle="Consulte y despache órdenes de combustible."
              icon={<Fuel size={18} />}
              href="/app/secretaria/combustible/despacho"
            />
          </>
        ) : (
          <>
            <ResourceCard
              title="Órdenes de taller"
              subtitle="Consulte las órdenes de mantenimiento asignadas."
              icon={<Car size={18} />}
              href="/app/mecanico/ordenes"
            />
            <ResourceCard
              title="Insumos y lubricantes"
              subtitle="Consulte los insumos registrados para mantenimiento."
              icon={<ClipboardList size={18} />}
              href="/app/mecanico/lubricantes"
            />
            <ResourceCard
              title="Historial de taller"
              subtitle="Revise el historial de novedades y trabajos."
              icon={<Fuel size={18} />}
              href="/app/mecanico/historial"
            />
          </>
        )}
      </div>

      {fetching ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div
            className="spinner mb-4"
            style={{ width: '40px', height: '40px' }}
          ></div>
          <p className="text-muted">
            Cargando hojas de ruta e ítems del checklist...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda: Selección de Vehículo / Hoja de Ruta */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="sgv-dark-form-card p-6">
              <h2 className="sgv-dark-form-title text-lg flex items-center gap-2 mb-4">
                <Car size={18} className="text-secondary" />
                Selección de Unidad
              </h2>

              <div className="form-group">
                <label className="form-label" htmlFor="route-sheet-select">
                  Hoja de Ruta Activa
                </label>
                <select
                  id="route-sheet-select"
                  className="form-select"
                  value={selectedSheetId}
                  onChange={handleSheetChange}
                >
                  <option value="">-- Seleccionar Hoja de Ruta --</option>
                  {routeSheets.map((sheet) => (
                    <option key={sheet.id} value={sheet.id}>
                      [{sheet.vehicle.plate}] {sheet.vehicle.brand}{' '}
                      {sheet.vehicle.model} - {sheet.request.destination} (
                      {sheet.trip_status === 'programado'
                        ? 'Salida'
                        : 'Llegada'}
                      )
                    </option>
                  ))}
                </select>
                {routeSheets.length === 0 && (
                  <p className="font-mono text-slate-400 text-xs mt-2">
                    No hay vehículos pendientes de salida o llegada en este momento.
                  </p>
                )}
              </div>

              {selectedSheet && (
                <div className="mt-6 border-t border-slate-200 pt-6 flex flex-col gap-4">
                  <div>
                    <span className="sgv-pill-capsule is-invited">
                      Inspección de{' '}
                      {selectedSheet.trip_status === 'programado'
                        ? 'Salida (Despacho)'
                        : 'Llegada (Recepción)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                    <div>
                      <p className="font-mono text-slate-500 text-xs">Vehículo</p>
                      <p className="font-mono font-semibold text-slate-900">
                        {selectedSheet.vehicle.brand}{' '}
                        {selectedSheet.vehicle.model}
                      </p>
                      <p className="text-secondary font-mono font-bold text-xs">
                        {selectedSheet.vehicle.plate}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-slate-500 text-xs">Conductor</p>
                      <p className="font-mono font-semibold text-slate-900">
                        {selectedSheet.driver.user.first_name}{' '}
                        {selectedSheet.driver.user.last_name}
                      </p>
                      <p className="font-mono text-slate-500 text-xs">
                        Licencia: {labelOf(CONTRACT_TYPE_LABEL, selectedSheet.driver.contract_type)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="font-mono text-slate-500 text-xs">Destino & Motivo</p>
                      <p className="font-mono font-semibold text-slate-900">
                        {selectedSheet.request.destination}
                      </p>
                      <p className="font-mono text-slate-500 text-xs italic">
                        "{selectedSheet.request.travel_reason}"
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-slate-500 text-xs">Kilometraje Inicial</p>
                      <p className="font-mono font-semibold text-emerald-600">
                        {selectedSheet.vehicle.current_mileage} km
                      </p>
                    </div>
                    {selectedSheet.trip_status === 'en_ruta' && (
                      <div>
                        <p className="font-mono text-slate-500 text-xs">
                          Registrado al Salir
                        </p>
                        <p className="font-mono font-semibold text-slate-900">
                          {selectedSheet.initial_mileage} km
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedSheet && (
              <div className="sgv-dark-form-card p-6">
                <h2 className="sgv-dark-form-title text-lg flex items-center gap-2 mb-4">
                  <Gauge size={18} className="text-secondary" />
                  Datos de Garita
                </h2>

                <div className="flex flex-col gap-4">
                  <Input
                    label="Kilometraje Actual en Garita"
                    type="number"
                    icon={<Gauge size={16} />}
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    required
                  />

                  <div className="form-group">
                    <label className="form-label flex items-center gap-1">
                      <Fuel size={16} /> Nivel de Combustible
                    </label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {(['1/4', '1/2', '3/4', 'full'] as const).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setFuelLevel(level)}
                          className={`py-2 px-1 text-xs font-mono font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                            fuelLevel === level
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-bold'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {level.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha: Checklist del Conductor / Guardia (Categorías e Ítems) */}
          <div className="lg:col-span-2">
            {!selectedSheet ? (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center bg-gray-50/50">
                <ClipboardList className="text-gray-300 mb-4" size={48} />
                <p className="font-semibold text-gray-500">
                  No se ha seleccionado ninguna unidad
                </p>
                <p className="text-muted text-sm max-w-sm mt-1">
                  Selecciona una hoja de ruta en el panel izquierdo para cargar
                  el checklist correspondiente de este vehículo.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="sgv-dark-form-card p-6 sm:p-8">
                  <div className="sgv-dark-form-header">
                    <h2 className="sgv-dark-form-title flex items-center gap-2">
                      <ClipboardList size={22} className="text-secondary" />
                      Inspección Detallada de Componentes
                    </h2>
                    <p className="sgv-dark-form-subtitle">
                      Verificación física de seguridad, motor y carrocería según protocolo ULEAM
                    </p>
                  </div>

                  <div className="flex flex-col gap-8">
                    {categories.map((category) => (
                      <div
                        key={category}
                        className="border-b border-slate-200 pb-6 last:border-0 last:pb-0"
                      >
                        <h3 className="font-mono font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-secondary"></span>
                          {category}
                        </h3>

                        <div className="flex flex-col gap-4">
                          {components
                            .filter((c) => c.category === category)
                            .map((comp) => {
                              const currentCondition =
                                checklistStates[comp.id] || 'BUENO';
                              return (
                                <div
                                  key={comp.id}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-slate-300 transition-all gap-4"
                                >
                                  <span className="font-mono font-medium text-slate-900 text-sm sm:text-base">
                                    {comp.component_name}
                                  </span>

                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleConditionChange(comp.id, 'BUENO')
                                      }
                                      className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                                        currentCondition === 'BUENO'
                                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                      }`}
                                    >
                                      BUENO
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleConditionChange(
                                          comp.id,
                                          'REGULAR'
                                        )
                                      }
                                      className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                                        currentCondition === 'REGULAR'
                                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                      }`}
                                    >
                                      REGULAR
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleConditionChange(comp.id, 'MALO')
                                      }
                                      className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                                        currentCondition === 'MALO'
                                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                      }`}
                                    >
                                      MALO
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Action Box */}
                <div
                  className={`p-6 rounded-2xl border transition-all ${
                    hasMaloComponent
                      ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                      : 'bg-[#0f1d1b] border-emerald-800/60 text-emerald-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-start gap-3">
                      {hasMaloComponent ? (
                        <>
                          <AlertTriangle
                            className="text-rose-400 flex-shrink-0 mt-1"
                            size={24}
                          />
                          <div>
                            <p className="font-mono font-bold text-rose-300">
                              Excepción del Taller Detectada
                            </p>
                            <p className="font-mono text-xs text-rose-400/90 mt-1">
                              Al marcar elementos defectuosos (MALO), el sistema
                              derivará automáticamente la unidad a estado "En
                              Taller" en el libro de novedades, bloqueando su
                              salida.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <CheckCircle2
                            className="text-emerald-400 flex-shrink-0 mt-1"
                            size={24}
                          />
                          <div>
                            <p className="font-mono font-bold text-emerald-300">
                              Todo se encuentra en orden
                            </p>
                            <p className="font-mono text-xs text-emerald-400/90 mt-1">
                              {isArrivalInspection
                                ? 'El checklist está limpio. Se registrará la llegada y se cerrará la hoja de ruta.'
                                : 'El checklist está limpio. El vehículo será autorizado para salir a ruta e iniciar la comisión asignada.'}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    <Button
                      type="submit"
                      isLoading={loading}
                      fullWidth={false}
                      variant={hasMaloComponent ? 'danger' : 'dark-submit'}
                      icon={
                        hasMaloComponent ? (
                          <AlertTriangle size={18} />
                        ) : (
                          <CheckCircle2 size={18} />
                        )
                      }
                      className="whitespace-nowrap px-6 py-3 cursor-pointer"
                    >
                      {hasMaloComponent
                        ? isArrivalInspection
                          ? 'Reportar Novedad de Llegada'
                          : 'Reportar Novedad y Derivar a Taller'
                        : isArrivalInspection
                          ? 'Registrar Llegada y Cerrar Viaje'
                          : 'Aprobar Despacho y Salida'}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChecklistDigitalPage;
