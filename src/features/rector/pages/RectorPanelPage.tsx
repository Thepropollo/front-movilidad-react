import React, { useState, useEffect } from 'react';
import { ShieldAlert, Check, X, RefreshCw, AlertTriangle, Clock, CheckCircle2, FileCheck } from 'lucide-react';
import api from '@/services/api';
import HeroMetricCard from '@/components/HeroMetricCard';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import ProcessPhaseLine, {
  type ProcessPhase,
} from '@/features/shared/ProcessPhaseLine';
import { useAlerts } from '@/context/AlertsContext';

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
  phases?: ProcessPhase[];
  requester?: {
    first_name: string;
    last_name: string;
    faculty_institution: string;
  };
}

const RectorPanel: React.FC = () => {
  const { refresh } = useAlerts();
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<string | null>(null);

  // Approval modal state
  const [confirmApproveId, setConfirmApproveId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Rejection state
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [justification, setJustification] = useState<string>('');

  const fetchRequests = async () => {
    setLoading(true);
    setErrors(null);
    try {
      const response = await api.get('/solicitudes');
      setRequests(response.data);
      refresh();
    } catch (err: unknown) {
      const er = err as { response?: { data?: { message?: string } } };
      setErrors(
        er.response?.data?.message ||
          'Error al obtener solicitudes para rectorado.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    api.get('/solicitudes')
      .then((res) => {
        if (!ignore) {
          setRequests(res.data);
          refresh();
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const er = err as { response?: { data?: { message?: string } } };
          setErrors(er.response?.data?.message || 'Error al obtener solicitudes para rectorado.');
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [refresh]);

  const handleApproveClick = (id: number) => {
    setActionError(null);
    setConfirmApproveId(id);
  };

  const executeApprove = async () => {
    if (!confirmApproveId) return;
    setLoading(true);
    setActionError(null);
    try {
      await api.patch(`/solicitudes/${confirmApproveId}/aprobar-rectorado`, {
        action: 'approve',
      });
      setConfirmApproveId(null);
      await fetchRequests();
    } catch (err: unknown) {
      const er = err as { response?: { data?: { message?: string } } };
      setActionError(er.response?.data?.message || 'Error al aprobar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent, id: number) => {
    e.preventDefault();
    if (!justification.trim()) {
      setActionError('Debe ingresar una justificación para rechazar la solicitud.');
      return;
    }
    setLoading(true);
    setActionError(null);
    try {
      await api.patch(`/solicitudes/${id}/aprobar-rectorado`, {
        action: 'reject',
        justification,
      });
      setRejectingId(null);
      setJustification('');
      await fetchRequests();
    } catch (err: unknown) {
      const er = err as { response?: { data?: { message?: string } } };
      setActionError(er.response?.data?.message || 'Error al rechazar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const pendingRequests = requests.filter(
    (r: RequestData) => r.status === 'pendiente_rectorado'
  );
  const processedRequests = requests.filter(
    (r: RequestData) => r.status === 'aprobado_rectorado' || r.status === 'rechazada'
  );

  return (
    <div className="operational-page approval-page max-w-6xl w-full mx-auto px-4 py-8">
      {/* Hero Metric Banner Card (Image 2 format) */}
      <div className="mb-6">
        <HeroMetricCard
          headline="Aprobaciones del Rectorado"
          author="Autorización Jerárquica de Movilización Externa y Viáticos Institucionales"
          tag={{
            icon: <ShieldAlert size={13} />,
            label: `${pendingRequests.length} Solicitudes Pendientes de Firma`,
          }}
          metricValue={pendingRequests.length}
          metricLabel="Por Autorizar"
          gradientClass="from-slate-900 via-zinc-900 to-zinc-800"
        />
      </div>

      {/* Modern Statistics Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="group p-4 bg-white border border-zinc-200 rounded-xl shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-amber-600 uppercase tracking-wider">
              Pendientes
            </span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <strong className="font-mono font-bold text-2xl text-zinc-900 leading-none">
              {pendingRequests.length}
            </strong>
            <span className="font-mono text-[11px] text-amber-600 font-semibold">Requieren firma</span>
          </div>
        </div>

        <div className="group p-4 bg-white border border-zinc-200 rounded-xl shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Procesadas
            </span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <strong className="font-mono font-bold text-2xl text-zinc-900 leading-none">
              {processedRequests.length}
            </strong>
            <span className="font-mono text-[11px] text-emerald-600 font-semibold">Aprobadas / Resueltas</span>
          </div>
        </div>

        <div className="group p-4 bg-white border border-zinc-200 rounded-xl shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Total Solicitudes
            </span>
            <FileCheck size={16} className="text-zinc-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <strong className="font-mono font-bold text-2xl text-zinc-900 leading-none">
              {requests.length}
            </strong>
            <span className="font-mono text-[11px] text-zinc-400">Total registradas</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition cursor-pointer font-mono"
        >
          <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
          <span>Actualizar</span>
        </button>
      </div>

      {errors && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center gap-3">
          <AlertTriangle className="shrink-0 text-red-600" size={22} />
          <p className="font-semibold text-sm">{errors}</p>
        </div>
      )}

      {/* Tabs / Sections */}
      <div className="space-y-10">
        {/* Section 1: Pendientes */}
        <div>
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Solicitudes Pendientes ({pendingRequests.length})
          </h2>

          {pendingRequests.length === 0 ? (
            <div className="bg-white border rounded-xl p-8 text-center shadow-sm">
              <Check
                className="mx-auto text-green-500 mb-3 bg-green-100 p-2.5 rounded-full"
                size={48}
              />
              <p className="text-gray-600 font-bold">¡Todo al día!</p>
              <p className="text-gray-400 text-sm mt-1">
                No hay solicitudes de movilización externa pendientes de su
                aprobación.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col justify-between hover:shadow-lg transition"
                >
                  <div>
                    {/* Header Card */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                          Externa
                        </span>
                        <h3 className="text-lg font-bold text-primary mt-1.5">
                          {req.origin} &rarr; {req.destination}
                        </h3>
                        {req.phases && req.phases.length > 0 && (
                          <div className="mt-2">
                            <ProcessPhaseLine phases={req.phases} compact />
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-400 block uppercase font-bold">
                          Costo Proyectado
                        </span>
                        <span className="font-extrabold text-primary text-lg">
                          ${Number(req.projected_cost).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2.5 text-sm text-gray-600 mb-6 bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400 block">
                            Solicitado por:
                          </span>
                          <span className="font-semibold text-gray-900">
                            {req.requester?.first_name}{' '}
                            {req.requester?.last_name}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">
                            Facultad/Unidad:
                          </span>
                          <span className="font-semibold text-gray-900">
                            {req.requester?.faculty_institution}
                          </span>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 pt-2 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400 block">
                            Fecha Salida:
                          </span>
                          <span className="font-semibold text-gray-900">
                            {req.departure_date}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">
                            Fecha Retorno:
                          </span>
                          <span className="font-semibold text-gray-900">
                            {req.return_date} ({req.estimated_days} días)
                          </span>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 pt-2">
                        <span className="text-gray-400 text-xs block">
                          Motivo:
                        </span>
                        <p className="text-gray-800 italic mt-0.5 text-xs line-clamp-3">
                          {req.travel_reason}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {rejectingId === req.id ? (
                    <form
                      onSubmit={(e) => handleRejectSubmit(e, req.id)}
                      className="space-y-3 pt-3 border-t"
                    >
                      <textarea
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                        placeholder="Ingrese la justificación técnica del rechazo..."
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-gray-800"
                        rows={2}
                        required
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingId(null);
                            setJustification('');
                          }}
                          className="px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold text-gray-600 bg-white hover:bg-gray-100 transition cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition cursor-pointer"
                        >
                          Enviar Rechazo
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex gap-3 border-t pt-4">
                      <button
                        onClick={() => setRejectingId(req.id)}
                        className="flex-1 py-2 px-3 border border-red-300 text-red-700 hover:bg-red-50 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <X size={14} />
                        Rechazar
                      </button>
                      <button
                        onClick={() => handleApproveClick(req.id)}
                        className="flex-1 py-2 px-3 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
                      >
                        <Check size={14} />
                        Aprobar Comisión
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Historial */}
        <div>
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
            Historial de Decisiones ({processedRequests.length})
          </h2>

          {processedRequests.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed text-gray-400 text-sm">
              No se han procesado solicitudes anteriormente.
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500">
                  <thead className="text-xs uppercase bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-4 py-3">Solicitante / Facultad</th>
                      <th className="px-4 py-3">Ruta</th>
                      <th className="px-4 py-3 text-right">Costo</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {processedRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900">
                            {req.requester?.first_name}{' '}
                            {req.requester?.last_name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {req.requester?.faculty_institution}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-slate-800">
                            {req.origin} &rarr; {req.destination}
                          </div>
                          <div className="text-xs text-slate-400">
                            {req.departure_date} al {req.return_date}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-primary font-mono">
                          ${Number(req.projected_cost).toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 text-xs">
                          {req.estimated_days} día(s)
                        </td>
                        <td className="px-4 py-3.5">
                          {req.status === 'aprobado_rectorado' ? (
                            <span className="sgv-badge is-ok">
                              Aprobado
                            </span>
                          ) : (
                            <span
                              className="sgv-badge is-danger cursor-help"
                              title={
                                req.travel_reason
                                  .split('[RECHAZADO POR RECTORADO: ')[1]
                                  ?.replace(']', '') || 'Rechazado'
                              }
                            >
                              Rechazado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación para aprobación */}
      <Modal
        isOpen={confirmApproveId !== null}
        onClose={() => setConfirmApproveId(null)}
        title="Autorizar Comisión de Movilización Externa"
        footer={
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => setConfirmApproveId(null)}
              style={{ width: 'auto' }}
            >
              Cancelar
            </Button>
            <Button
              variant="gold"
              onClick={executeApprove}
              isLoading={loading}
              style={{ width: 'auto' }}
            >
              Confirmar y Autorizar
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-600 leading-relaxed m-0">
            Está por emitir la aprobación jerárquica de Vicerrectorado para la movilización fuera de la provincia.
            Esta acción registrará la conformidad institucional y notificará automáticamente a la Dirección de Transporte
            para la emisión de la Hoja de Ruta y asignación de recursos.
          </p>
          {actionError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold">
              {actionError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default RectorPanel;
