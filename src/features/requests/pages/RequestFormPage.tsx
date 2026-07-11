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

  // Fetch past requests
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendiente':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Pendiente (Jefe)</span>;
      case 'pendiente_rectorado':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">Pendiente (Rectorado)</span>;
      case 'aprobado_rectorado':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Aprobado por Rector</span>;
      case 'aprobada':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Aprobada con Hoja de Ruta</span>;
      case 'rechazada':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Rechazada</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="glass-panel wide-container mx-auto" style={{ textAlign: 'left' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-primary flex items-center gap-2">
            <FileText className="text-secondary" size={28} />
            Solicitud de Movilización
          </h1>
          <p className="text-gray-500 mt-1">Registra tu comisión de servicio y simula los viáticos proyectados.</p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center gap-3">
          <CheckCircle className="shrink-0 text-green-600" size={22} />
          <div>
            <p className="font-semibold">¡Operación exitosa!</p>
            <p className="text-sm">{successMsg}</p>
          </div>
        </div>
      )}

      {errors && errors.general && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center gap-3">
          <AlertTriangle className="shrink-0 text-red-600" size={22} />
          <p className="font-semibold text-sm">{errors.general[0]}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form panel */}
        <div className="lg:col-span-5 glass-panel p-8 self-start bg-white">
          <h2 className="text-xl font-bold text-primary mb-6 border-b pb-2">Datos del Viaje</h2>
          
          <form onSubmit={handleSimulate} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Tipo de Movilización</label>
              <select
                value={mobilizationType}
                onChange={(e) => setMobilizationType(e.target.value)}
                className="form-select"
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
              required
            />

            <Input
              label="Destino"
              icon={<MapPin size={16} />}
              placeholder="Ej. Guayaquil, Quito, etc."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              error={errors?.destination ? errors.destination[0] : undefined}
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
                required
              />

              <Input
                type="date"
                label="Fecha Retorno"
                icon={<Calendar size={16} />}
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                error={errors?.return_date ? errors.return_date[0] : undefined}
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
                className={`form-input ${errors?.travel_reason ? 'border-red-500 focus:ring-red-500/20' : ''}`}
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
        <div className="lg:col-span-7 glass-panel p-8 bg-white">
          <div className="flex justify-between items-center mb-6 border-b pb-2">
            <h2 className="text-xl font-bold text-primary">Historial de Solicitudes</h2>
            <button 
              onClick={fetchRequests} 
              className="text-gray-400 hover:text-secondary transition"
              title="Actualizar listado"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          {pastRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 font-medium">Aún no has registrado solicitudes de movilización.</p>
              <p className="text-gray-400 text-sm mt-1">Completa el formulario de la izquierda para ingresar tu primera solicitud.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="text-xs uppercase bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-4 py-3">Destino</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Salida/Retorno</th>
                    <th className="px-4 py-3 text-right">Costo Proyectado</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pastRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3.5 font-semibold text-gray-900">
                        {req.origin} &rarr; {req.destination}
                      </td>
                      <td className="px-4 py-3.5 capitalize text-gray-600">
                        {req.mobilization_type}
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">
                        <div>{req.departure_date}</div>
                        <div className="text-xs text-gray-400">al {req.return_date} ({req.estimated_days} d)</div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-primary">
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
          <>
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              style={{ width: 'auto' }}
            >
              Cancelar y Editar
            </Button>
            <Button
              variant="gold"
              onClick={handleConfirm}
              style={{ width: 'auto' }}
            >
              Confirmar y Declarar
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', padding: '12px', borderRadius: '8px' }}>
            <AlertTriangle className="text-amber-600 shrink-0" size={24} />
            <div>
              <p style={{ fontSize: '13px', color: '#92400e', margin: 0, fontWeight: 700 }}>
                Revisión de costos estimados de viáticos
              </p>
            </div>
          </div>

          <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.5', whiteSpace: 'pre-line', margin: 0 }}>
            {preCalcData?.message}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', padding: '16px', borderRadius: '8px' }}>
            <div>
              <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase', display: 'block' }}>Días Estimados</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>{preCalcData?.estimated_days} día(s)</span>
            </div>
            <div>
              <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 'bold', textTransform: 'uppercase', display: 'block' }}>Costo Proyectado</span>
              <span style={{ fontSize: '18px', fontWeight: 'extrabold', color: 'var(--color-primary)' }}>${Number(preCalcData?.projected_cost).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RequestForm;
