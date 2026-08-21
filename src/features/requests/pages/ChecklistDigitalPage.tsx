import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Car,
  Gauge,
  Fuel,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { CONTRACT_TYPE_LABEL, labelOf } from '@/lib/labels';
import {
  fetchPendingRouteSheets,
  fetchChecklistComponents,
  submitChecklist,
  type PendingRouteSheet,
  type ChecklistComponent,
} from '../api/inspection';

const ChecklistDigitalPage: React.FC = () => {
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
    } catch (err: any) {
      console.error('Error al cargar datos:', err);
      setErrorMsg('Error al conectar con el servidor. Por favor, recarga.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadData();
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

      // Reload route sheets list
      const sheetsData = await fetchPendingRouteSheets();
      setRouteSheets(sheetsData);

      // Reset checklist states to BUENO
      const resetStates: Record<number, 'BUENO' | 'REGULAR' | 'MALO'> = {};
      components.forEach((comp) => {
        resetStates[comp.id] = 'BUENO';
      });
      setChecklistStates(resetStates);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.message || 'Error al guardar la inspección.'
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
          <CheckCircle
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
            <div className="glass-panel p-6 bg-white/50">
              <h2 className="section-title flex items-center gap-2 mb-4">
                <Car size={18} className="text-primary-brand" />
                Selección de Unidad
              </h2>

              <div className="form-group">
                <label className="form-label" htmlFor="route-sheet-select">
                  Hoja de Ruta Activa
                </label>
                <select
                  id="route-sheet-select"
                  className="form-input"
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
                  <p className="text-muted text-xs mt-2">
                    No hay vehículos pendientes de salida o llegada en este
                    momento.
                  </p>
                )}
              </div>

              {selectedSheet && (
                <div className="mt-6 border-t border-gray-100 pt-6 flex flex-col gap-4">
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedSheet.trip_status === 'programado'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      Inspección de{' '}
                      {selectedSheet.trip_status === 'programado'
                        ? 'Salida (Despacho)'
                        : 'Llegada (Recepción)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                    <div>
                      <p className="text-muted text-xs">Vehículo</p>
                      <p className="font-semibold text-primary">
                        {selectedSheet.vehicle.brand}{' '}
                        {selectedSheet.vehicle.model}
                      </p>
                      <p className="text-secondary-brand font-mono font-bold text-xs">
                        {selectedSheet.vehicle.plate}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted text-xs">Conductor</p>
                      <p className="font-semibold text-primary">
                        {selectedSheet.driver.user.first_name}{' '}
                        {selectedSheet.driver.user.last_name}
                      </p>
                      <p className="text-muted text-xs">
                        Licencia: {labelOf(CONTRACT_TYPE_LABEL, selectedSheet.driver.contract_type)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted text-xs">Destino & Motivo</p>
                      <p className="font-semibold text-primary">
                        {selectedSheet.request.destination}
                      </p>
                      <p className="text-muted text-xs italic">
                        "{selectedSheet.request.travel_reason}"
                      </p>
                    </div>
                    <div>
                      <p className="text-muted text-xs">Kilometraje Inicial</p>
                      <p className="font-semibold text-primary">
                        {selectedSheet.vehicle.current_mileage} km
                      </p>
                    </div>
                    {selectedSheet.trip_status === 'en_ruta' && (
                      <div>
                        <p className="text-muted text-xs">
                          Registrado al Salir
                        </p>
                        <p className="font-semibold text-primary">
                          {selectedSheet.initial_mileage} km
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedSheet && (
              <div className="glass-panel p-6 bg-white/50">
                <h2 className="section-title flex items-center gap-2 mb-4">
                  <Gauge size={18} className="text-primary-brand" />
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
                          className={`py-2 px-1 text-xs font-semibold rounded-lg border text-center transition-all ${
                            fuelLevel === level
                              ? 'bg-primary-brand text-white border-primary-brand shadow-sm'
                              : 'bg-white text-primary border-gray-200 hover:bg-gray-50'
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
                <div className="glass-panel p-6 bg-white/50">
                  <h2 className="section-title flex items-center gap-2 mb-6">
                    <ClipboardList size={18} className="text-primary-brand" />
                    Inspección Detallada de Componentes
                  </h2>

                  <div className="flex flex-col gap-8">
                    {categories.map((category) => (
                      <div
                        key={category}
                        className="border-b border-gray-100 pb-6 last:border-0 last:pb-0"
                      >
                        <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-secondary-brand"></span>
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
                                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-gray-100 bg-white shadow-sm hover:border-gray-200 transition-all gap-4"
                                >
                                  <span className="font-medium text-primary text-sm sm:text-base">
                                    {comp.component_name}
                                  </span>

                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleConditionChange(comp.id, 'BUENO')
                                      }
                                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                                        currentCondition === 'BUENO'
                                          ? 'bg-success text-white border-success shadow-xs'
                                          : 'bg-white text-gray-500 border-gray-200 hover:bg-success/5 hover:text-success'
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
                                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                                        currentCondition === 'REGULAR'
                                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                                          : 'bg-white text-gray-500 border-gray-200 hover:bg-amber-50'
                                      }`}
                                    >
                                      REGULAR
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleConditionChange(comp.id, 'MALO')
                                      }
                                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                                        currentCondition === 'MALO'
                                          ? 'bg-danger text-white border-danger shadow-xs'
                                          : 'bg-white text-gray-500 border-gray-200 hover:bg-danger/5 hover:text-danger'
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
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-green-50 border-green-200 text-green-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-start gap-3">
                      {hasMaloComponent ? (
                        <>
                          <AlertTriangle
                            className="text-danger flex-shrink-0 mt-1"
                            size={24}
                          />
                          <div>
                            <p className="font-bold text-danger">
                              Excepción del Taller Detectada
                            </p>
                            <p className="text-xs text-red-700 mt-1">
                              Al marcar elementos defectuosos (MALO), el sistema
                              derivará automáticamente la unidad a estado "En
                              Taller" en el libro de novedades, bloqueando su
                              salida.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <CheckCircle
                            className="text-success flex-shrink-0 mt-1"
                            size={24}
                          />
                          <div>
                            <p className="font-bold text-success">
                              Todo se encuentra en orden
                            </p>
                            <p className="text-xs text-green-700 mt-1">
                              El checklist está limpio. El vehículo será
                              autorizado para salir a ruta e iniciar la comisión
                              asignada.
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    <Button
                      type="submit"
                      isLoading={loading}
                      fullWidth={false}
                      variant={hasMaloComponent ? 'danger' : 'success'}
                      icon={
                        hasMaloComponent ? (
                          <AlertTriangle size={18} />
                        ) : (
                          <CheckCircle size={18} />
                        )
                      }
                      className="whitespace-nowrap px-6 py-3"
                    >
                      {hasMaloComponent
                        ? 'Reportar Novedad y Derivar a Taller'
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
