import React, { useState, useEffect } from 'react';
import { FileText, MapPin, Calendar, FileCheck2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import api from '@/services/api';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';

interface RequestData {
  id: number;
  mobilization_type: string;
  origin: string;
  destination: string;
  travel_reason: string;
  departure_date: string;
  return_date: string;
  estimated_days: number;
  projected_cost: number;
  status: string;
}

const RequestForm: React.FC = () => {
  // Form fields
  const [mobilizationType, setMobilizationType] = useState<string>('interna');
  const [origin, setOrigin] = useState<string>('MANTA');
  const [destination, setDestination] = useState<string>('');
  const [travelReason, setTravelReason] = useState<string>('');
  const [departureDate, setDepartureDate] = useState<string>('');
  const [returnDate, setReturnDate] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<any>(null);

  // Modal / pre-calculation state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [preCalcData, setPreCalcData] = useState<any>(null);

  // Past requests
  const [pastRequests, setPastRequests] = useState<RequestData[]>([]);

  // Fetch ULEAM requests list
  const fetchRequests = async () => {
    try {
      const response = await api.get('/solicitudes');
      setPastRequests(response.data);
    } catch (err) {
      console.error('Error al obtener solicitudes:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors(null);
    setSuccessMsg(null);

    try {
      const response = await api.post('/solicitudes', {
        mobilization_type: mobilizationType,
        origin,
        destination,
        travel_reason: travelReason,
        departure_date: departureDate,
        return_date: returnDate,
        declaracion_fondos_aceptada: false
      });

      if (response.data.requires_confirmation) {
        setPreCalcData(response.data);
        setShowModal(true);
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({ general: [err.response?.data?.message || 'Error al procesar la solicitud'] });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    setShowModal(false);
    setErrors(null);

    try {
      const response = await api.post('/solicitudes', {
        mobilization_type: mobilizationType,
        origin,
        destination,
        travel_reason: travelReason,
        departure_date: departureDate,
        return_date: returnDate,
        declaracion_fondos_aceptada: true
      });

      setSuccessMsg(response.data.message);
      // Reset form
      setDestination('');
      setTravelReason('');
      setDepartureDate('');
      setReturnDate('');
      setOrigin('MANTA');
      
      // Refresh requests list
      fetchRequests();
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({ general: [err.response?.data?.message || 'Error al procesar la solicitud'] });
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendiente':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 uppercase whitespace-nowrap">Pendiente (Jefe)</span>;
      case 'pendiente_rectorado':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 uppercase whitespace-nowrap">Pendiente (Rector)</span>;
      case 'aprobado_rectorado':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/60 uppercase whitespace-nowrap">Aprobado Rector</span>;
      case 'aprobada':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase whitespace-nowrap">Aprobada (Ruta)</span>;
      case 'rechazada':
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60 uppercase whitespace-nowrap">Rechazada</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200/60 uppercase whitespace-nowrap">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/40 py-6">
      <div className="wide-container mx-auto" style={{ textAlign: 'left' }}>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-primary flex items-center gap-3">
              <FileText className="text-secondary" size={28} />
              Solicitud de Movilización
            </h1>
            <p className="text-muted mt-1">Registra tu comisión de servicio y simula los viáticos proyectados.</p>
          </div>
        </div>

        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-800 flex items-center gap-3 shadow-sm">
            <CheckCircle className="shrink-0 text-green-600" size={22} />
            <div>
              <p className="font-semibold text-sm">¡Operación exitosa!</p>
              <p className="text-xs text-green-700">{successMsg}</p>
            </div>
          </div>
        )}

        {errors && errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 flex items-center gap-3 shadow-sm">
            <AlertTriangle className="shrink-0 text-red-600" size={22} />
            <p className="font-semibold text-sm">{errors.general[0]}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Form panel */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm p-8 self-start text-left">
            <div className="flex items-center gap-2.5 pb-4 mb-6 border-b border-slate-100">
              <MapPin className="text-slate-400" size={20} />
              <h2 className="text-xl font-bold text-primary">Datos del Viaje</h2>
            </div>
            
            <form onSubmit={handleSimulate} className="space-y-4">
              
              <div className="form-group">
                <label className="form-label">Tipo de Movilización</label>
                <select
                  value={mobilizationType}
                  onChange={(e) => setMobilizationType(e.target.value)}
                  className="form-select transition-all duration-200 focus:ring-2 focus:ring-blue-900/20 focus:border-blue-950"
                >
                  <option value="interna">Interna (Provincial)</option>
                  <option value="externa">Externa (Fuera de la provincia)</option>
                </select>
              </div>

              <Input
                label="Origen"
                icon={<MapPin size={16} />}
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-900/20 focus:border-blue-950"
                required
              />

              <Input
                label="Destino"
                icon={<MapPin size={16} />}
                placeholder="Ej. Guayaquil, Quito, etc."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                error={errors?.destination ? errors.destination[0] : undefined}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-900/20 focus:border-blue-950"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Fecha Salida"
                  icon={<Calendar size={16} />}
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  error={errors?.departure_date ? errors.departure_date[0] : undefined}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-900/20 focus:border-blue-950"
                  required
                />

                <Input
                  type="date"
                  label="Fecha Retorno"
                  icon={<Calendar size={16} />}
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  error={errors?.return_date ? errors.return_date[0] : undefined}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-900/20 focus:border-blue-950"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Motivo del Viaje</label>
                <textarea
                  rows={3}
                  placeholder="Describa el propósito académico o administrativo de la comisión..."
                  value={travelReason}
                  onChange={(e) => setTravelReason(e.target.value)}
                  className={`form-input transition-all duration-200 focus:ring-2 focus:ring-blue-900/20 focus:border-blue-950 ${errors?.travel_reason ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                  style={{ paddingLeft: '16px', resize: 'vertical' }}
                  required
                />
                {errors?.travel_reason && (
                  <span style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px', display: 'block', fontWeight: 500 }}>
                    {errors.travel_reason[0]}
                  </span>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                icon={<FileCheck2 size={16} />}
                style={{ width: '100%', marginTop: '12px' }}
              >
                Registrar y Simular
              </Button>
            </form>
          </div>

          {/* List panel */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm p-8 text-left">
            <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <FileText className="text-slate-400" size={20} />
                <h2 className="text-xl font-bold text-primary">Historial de Solicitudes</h2>
              </div>
              <button 
                onClick={fetchRequests} 
                className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-secondary rounded-xl transition"
                title="Actualizar listado"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            {pastRequests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-slate-500 font-medium text-sm">Aún no has registrado solicitudes de movilización.</p>
                <p className="text-gray-400 text-xs mt-1">Completa el formulario de la izquierda para ingresar tu primera solicitud.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left text-sm text-gray-500">
                  <thead className="text-xs uppercase bg-slate-50/75 text-slate-700 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 font-bold">Destino</th>
                      <th className="px-4 py-3 font-bold">Tipo</th>
                      <th className="px-4 py-3 font-bold">Salida/Retorno</th>
                      <th className="px-4 py-3 text-right font-bold">Costo Proyectado</th>
                      <th className="px-4 py-3 font-bold">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {pastRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors cursor-pointer">
                        <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                          {req.origin} &rarr; {req.destination}
                        </td>
                        <td className="px-4 py-3.5 capitalize text-slate-600 text-xs">
                          {req.mobilization_type}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                          <div className="font-mono text-xs font-bold text-primary">{formatDate(req.departure_date)}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">al {formatDate(req.return_date)} ({req.estimated_days} d)</div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-primary whitespace-nowrap font-mono">
                          ${Number(req.projected_cost).toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5">
                          {getStatusBadge(req.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal - Fund Declaration */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Declaración de Fondos Institucionales"
          footer={
            <div className="flex justify-end gap-3 w-full">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition font-semibold text-xs uppercase tracking-wider"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="bg-blue-950 text-white hover:bg-blue-900 px-6 py-2.5 rounded-xl font-bold transition-all shadow-md text-xs uppercase tracking-wider"
              >
                Declarar Fondos y Confirmar Viaje
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-6 p-2 text-left">
            {/* Banner de advertencia */}
            <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-900 p-4 rounded-r-lg text-sm flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5 animate-bounce" size={18} />
              <div>
                <p className="font-bold mb-1 text-xs">Políticas de Co-Financiamiento de Movilidad</p>
                <p className="leading-relaxed text-xs">
                  La ULEAM cubrirá exclusivamente el combustible para el tramo de ida. Al confirmar, usted declara bajo responsabilidad de su facultad/dirección disponer de los fondos necesarios para cubrir el combustible de retorno, estadías (viáticos) y horas extras proyectadas del conductor asignado.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100/80">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Días Estimados</span>
                <span className="text-base font-extrabold text-primary">{preCalcData?.estimated_days} día(s)</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Costo Proyectado</span>
                <span className="text-lg font-black text-secondary-brand font-mono">${Number(preCalcData?.projected_cost).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Modal>

      </div>
    </div>
  );
};

export default RequestForm;
