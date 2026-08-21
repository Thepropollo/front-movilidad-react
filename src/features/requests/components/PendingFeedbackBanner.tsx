import React, { useState, useEffect } from 'react';
import {
  Star,
  ShieldAlert,
  CheckCircle,
  Send,
  MessageSquare,
} from 'lucide-react';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import {
  fetchPendingEvaluations,
  submitEvaluation,
  type RouteSheetSummary,
} from '../api/postTrip';

const PendingFeedbackBanner: React.FC = () => {
  const { user } = useAuth();
  const [currentTrip, setCurrentTrip] = useState<RouteSheetSummary | null>(
    null
  );

  // Form states
  const [driverRating, setDriverRating] = useState<number>(0);
  const [vehicleRating, setVehicleRating] = useState<number>(0);
  const [comments, setComments] = useState<string>('');

  // Hover ratings states for animations
  const [driverHover, setDriverHover] = useState<number>(0);
  const [vehicleHover, setVehicleHover] = useState<number>(0);

  // UI states
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const checkPending = async () => {
    if (!user) return;
    try {
      const data = await fetchPendingEvaluations();
      if (data.length > 0) {
        setCurrentTrip(data[0]);
      } else {
        setCurrentTrip(null);
      }
    } catch (err) {
      console.error('Error checking pending evaluations:', err);
    }
  };

  useEffect(() => {
    checkPending();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTrip || !user || driverRating === 0 || vehicleRating === 0)
      return;

    setSubmitting(true);
    try {
      await submitEvaluation({
        hoja_ruta_id: currentTrip.id,
        pasajero_id: user.id,
        calificacion_conductor: driverRating,
        calificacion_vehiculo: vehicleRating,
        comments,
      });
      setSuccess(true);
      setTimeout(() => {
        // Reset form and check for next pending trip
        setDriverRating(0);
        setVehicleRating(0);
        setComments('');
        setSuccess(false);
        checkPending();
      }, 2000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentTrip) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-gray-150 animate-fade-in relative text-left">
        {/* Banner Alert Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="p-2.5 bg-gold/15 text-gold-dark rounded-2xl">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-primary">
              Co-Evaluación Obligatoria
            </h3>
            <p className="text-xs text-muted">
              Tu opinión nos ayuda a regular la seguridad y calidad del
              transporte institucional.
            </p>
          </div>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-success animate-bounce">
              <CheckCircle size={36} />
            </div>
            <div>
              <h4 className="text-xl font-bold text-green-800">
                Feedback Registrado
              </h4>
              <p className="text-muted text-sm mt-1">
                ¡Muchas gracias por completar la encuesta!
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Trip details */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm">
              <p className="text-xs font-semibold text-gold-dark uppercase tracking-wider mb-2">
                Detalles del Viaje Finalizado
              </p>
              <p className="font-bold text-primary">
                Ruta: Manta → {currentTrip.request.destination}
              </p>
              <p className="text-muted text-xs mt-1">
                Conductor: {currentTrip.driver.user.first_name}{' '}
                {currentTrip.driver.user.last_name}
              </p>
              <p className="text-muted text-xs">
                Vehículo: {currentTrip.vehicle.brand}{' '}
                {currentTrip.vehicle.model} ({currentTrip.vehicle.plate})
              </p>
            </div>

            {/* Driver Star rating */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-primary">
                Calificación del Conductor
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="focus:outline-none transition-transform hover:scale-125"
                    onClick={() => setDriverRating(star)}
                    onMouseEnter={() => setDriverHover(star)}
                    onMouseLeave={() => setDriverHover(0)}
                  >
                    <Star
                      size={28}
                      className={
                        star <= (driverHover || driverRating)
                          ? 'fill-gold text-gold'
                          : 'text-gray-300'
                      }
                    />
                  </button>
                ))}
                {driverRating > 0 && (
                  <span className="text-xs font-bold text-gold-dark ml-2">
                    ({driverRating} de 5)
                  </span>
                )}
              </div>
            </div>

            {/* Vehicle Star rating */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-primary">
                Calificación del Vehículo (Confort y Estado)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="focus:outline-none transition-transform hover:scale-125"
                    onClick={() => setVehicleRating(star)}
                    onMouseEnter={() => setVehicleHover(star)}
                    onMouseLeave={() => setVehicleHover(0)}
                  >
                    <Star
                      size={28}
                      className={
                        star <= (vehicleHover || vehicleRating)
                          ? 'fill-gold text-gold'
                          : 'text-gray-300'
                      }
                    />
                  </button>
                ))}
                {vehicleRating > 0 && (
                  <span className="text-xs font-bold text-gold-dark ml-2">
                    ({vehicleRating} de 5)
                  </span>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="form-group">
              <label className="form-label" htmlFor="comments-input">
                Comentarios / Sugerencias (Opcional)
              </label>
              <div className="relative">
                <textarea
                  id="comments-input"
                  rows={3}
                  className="form-input py-2.5 px-3 block w-full text-sm border-gray-200 rounded-xl"
                  placeholder="Describe si hubo algún desperfecto, retraso o excelente servicio..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
                <MessageSquare
                  className="absolute right-3 bottom-3 text-gray-300"
                  size={16}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="gold"
              isLoading={submitting}
              disabled={driverRating === 0 || vehicleRating === 0}
              icon={<Send size={16} />}
            >
              Enviar Co-Evaluación Obligatoria
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PendingFeedbackBanner;
