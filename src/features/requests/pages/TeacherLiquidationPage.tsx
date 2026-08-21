import React, { useState, useEffect } from 'react';
import {
  FileText,
  ClipboardList,
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  Calculator,
  FileCheck,
  Landmark,
  DollarSign,
  Calendar,
  Clock,
} from 'lucide-react';
import Button from '@/components/Button';
import {
  fetchTeacherPendingLiquidations,
  calculateCompensation,
  submitLiquidation,
  type RouteSheetSummary,
  type CompensationCalculation,
} from '../api/postTrip';

const TeacherLiquidationPage: React.FC = () => {
  const [sheets, setSheets] = useState<RouteSheetSummary[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<RouteSheetSummary | null>(
    null
  );
  const [calc, setCalc] = useState<CompensationCalculation | null>(null);

  // Drag and drop / file states
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);

  // UI states
  const [loading, setLoading] = useState<boolean>(true);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadSheets = async () => {
    try {
      setLoading(true);
      const data = await fetchTeacherPendingLiquidations();
      setSheets(data);
      setSelectedSheet(null);
      setCalc(null);
      setUploadedFileName(null);
      setUploadedFileUrl(null);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al cargar comisiones de viaje pendientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSheets();
  }, []);

  const handleSelectSheet = async (sheet: RouteSheetSummary) => {
    setSelectedSheet(sheet);
    setCalc(null);
    setUploadedFileName(null);
    setUploadedFileUrl(null);
    setErrorMsg(null);
    setSuccessMsg(null);

    setCalculating(true);
    try {
      const calculation = await calculateCompensation(sheet.id);
      setCalc(calculation);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.message ||
          'Error al calcular los haberes de la comisión.'
      );
    } finally {
      setCalculating(false);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const simulateFileUpload = (fileName: string) => {
    setUploadingFile(true);
    setTimeout(() => {
      setUploadingFile(false);
      setUploadedFileName(fileName);
      // Simulated receipt path
      setUploadedFileUrl(`/receipts/factura_${Date.now()}_combustible.pdf`);
    }, 1500);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      simulateFileUpload(file.name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      simulateFileUpload(file.name);
    }
  };

  const handleSubmitLiquidation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSheet || !uploadedFileUrl) return;

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await submitLiquidation(selectedSheet.id, {
        comprobante_pago_url: uploadedFileUrl,
      });
      setSuccessMsg(
        'Factura de respaldo y liquidación enviadas correctamente a auditoría.'
      );
      setSelectedSheet(null);
      setCalc(null);
      setUploadedFileName(null);
      setUploadedFileUrl(null);
      // Reload list
      const data = await fetchTeacherPendingLiquidations();
      setSheets(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.message || 'Error al liquidar la comisión.'
      );
    } finally {
      setSubmitting(false);
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
            Carga comprobantes de viáticos y combustibles para auditar y cerrar
            la hoja de ruta de la comisión.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="success-banner mb-6 flex items-start gap-3">
          <CheckCircle
            className="text-success flex-shrink-0 mt-0.5"
            size={18}
          />
          <p className="text-success-text text-sm font-medium">{successMsg}</p>
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
                Selecciona una comisión finalizada para iniciar la liquidación y
                previsualizar haberes.
              </p>

              {sheets.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50/50">
                  <FileCheck className="text-gray-300 mb-2 mx-auto" size={32} />
                  <p className="font-semibold text-gray-500 text-xs">
                    Sin viajes por liquidar
                  </p>
                  <p className="text-muted text-[10px] mt-1">
                    No tienes solicitudes pendientes de carga de comprobantes
                    post-viaje.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
                  {sheets.map((sheet) => (
                    <button
                      key={sheet.id}
                      onClick={() => handleSelectSheet(sheet)}
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
                  Selecciona una comisión del listado de la izquierda para
                  computar viáticos y horas extras del conductor.
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
                        {/* Viáticos */}
                        <div className="flex justify-between items-center p-3.5 bg-white border border-gray-100 rounded-2xl shadow-xs">
                          <div>
                            <p className="font-bold text-primary text-sm">
                              Viáticos por Comisión Exterior
                            </p>
                            <p className="text-muted text-xs mt-0.5">
                              {calc.nights_outside} noches transcurridas afuera
                              ($80.00/día)
                            </p>
                          </div>
                          <span className="font-mono font-bold text-primary text-base">
                            ${calc.allowances_amount.toFixed(2)}
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
                              post-jornada laboral ($5.00/hr)
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
                              semana o feriado ($7.50/hr)
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

                {/* Formulario de Carga Drag and Drop */}
                {calc && (
                  <form
                    onSubmit={handleSubmitLiquidation}
                    className="flex flex-col gap-6"
                  >
                    <div className="glass-panel p-6 bg-white/50">
                      <h2 className="section-title flex items-center gap-2 mb-4">
                        <UploadCloud size={18} className="text-primary-brand" />
                        Carga de Comprobante Físico (PDF/Factura)
                      </h2>
                      <p className="text-muted text-xs mb-4">
                        Arrastra y suelta el comprobante de liquidación del
                        viaje para la auditoría de movilidad.
                      </p>

                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-3 transition-all ${
                          dragActive
                            ? 'border-gold bg-gold/5'
                            : uploadedFileName
                              ? 'border-green-200 bg-green-50/20'
                              : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="file"
                          id="file-upload-input"
                          accept=".pdf,image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />

                        {uploadingFile ? (
                          <div className="flex flex-col items-center gap-2">
                            <div
                              className="spinner"
                              style={{ width: '24px', height: '24px' }}
                            ></div>
                            <p className="text-xs text-muted">
                              Subiendo archivo de respaldo...
                            </p>
                          </div>
                        ) : uploadedFileName ? (
                          <div className="flex flex-col items-center gap-2 text-center">
                            <FileText className="text-success" size={40} />
                            <p className="text-xs font-bold text-success-text">
                              {uploadedFileName}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono">
                              Respaldo cargado correctamente.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setUploadedFileName(null);
                                setUploadedFileUrl(null);
                              }}
                              className="text-xs text-danger font-semibold mt-2 hover:underline"
                            >
                              Eliminar y cargar otro
                            </button>
                          </div>
                        ) : (
                          <label
                            htmlFor="file-upload-input"
                            className="cursor-pointer flex flex-col items-center gap-2"
                          >
                            <UploadCloud
                              className="text-gray-400 hover:text-gold transition-colors"
                              size={44}
                            />
                            <p className="text-xs text-gray-500 font-medium">
                              Arrastra tu archivo aquí o{' '}
                              <span className="text-gold-dark font-bold hover:underline">
                                selecciona desde tu equipo
                              </span>
                            </p>
                            <p className="text-[10px] text-gray-400">
                              Archivos permitidos: PDF, imágenes JPG/PNG (Max.
                              5MB)
                            </p>
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Enviar */}
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={!uploadedFileUrl || submitting}
                      isLoading={submitting}
                      icon={<FileCheck size={18} />}
                      className="bg-blue-600 hover:bg-blue-700 font-bold"
                    >
                      Enviar Evidencias a Revisión
                    </Button>
                  </form>
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
