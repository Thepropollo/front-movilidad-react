import React, { useState, useEffect } from 'react';
import { DollarSign, Lock, Unlock, CheckCircle, AlertTriangle, Save, Edit3 } from 'lucide-react';
import { fetchAdminRates, updateAdminRate, type RateConfiguration } from '../api/admin_crud';

const AdminTarifasPage: React.FC = () => {
  const [rates, setRates] = useState<RateConfiguration[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Edit mode tracking: map of rate.id -> boolean
  const [editModes, setEditModes] = useState<Record<number, boolean>>({});
  // Form input values tracking: map of rate.id -> string representation of value
  const [inputValues, setInputValues] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminRates();
      setRates(data);
      
      // Initialize states
      const modes: Record<number, boolean> = {};
      const vals: Record<number, string> = {};
      data.forEach(r => {
        modes[r.id] = false;
        vals[r.id] = Number(r.rate_value).toFixed(2);
      });
      setEditModes(modes);
      setInputValues(vals);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al cargar las tarifas institucionales.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartModify = (id: number) => {
    setEditModes(prev => ({ ...prev, [id]: true }));
    setErrorMsg(null);
    setSuccessMsg(null);
    
    // Focus the input element
    setTimeout(() => {
      const el = document.getElementById(`rate-input-${id}`);
      if (el) el.focus();
    }, 50);
  };

  const handleSaveRate = async (rate: RateConfiguration) => {
    const valString = inputValues[rate.id];
    const val = Number(valString);

    if (isNaN(val) || val <= 0) {
      setErrorMsg('El valor ingresado debe ser un número decimal positivo mayor a cero.');
      return;
    }

    setSavingId(rate.id);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await updateAdminRate(rate.id, val);
      setSuccessMsg(res.message);
      
      // Turn off edit mode
      setEditModes(prev => ({ ...prev, [rate.id]: false }));
      
      // Update value with returned server value
      setRates(prev => prev.map(r => r.id === rate.id ? { ...r, rate_value: res.rate.rate_value } : r));
      setInputValues(prev => ({ ...prev, [rate.id]: Number(res.rate.rate_value).toFixed(2) }));
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Error al actualizar la tarifa.');
      // Revert input field value
      setInputValues(prev => ({ ...prev, [rate.id]: Number(rate.rate_value).toFixed(2) }));
      setEditModes(prev => ({ ...prev, [rate.id]: false }));
    } finally {
      setSavingId(null);
    }
  };

  const getRateDetails = (key: string) => {
    switch (key) {
      case 'viatico_diario':
        return {
          title: 'Viático Diario LOSEP',
          description: 'Establece el valor diario del viático por comisión de servicios fuera del domicilio habitual del conductor según normativa vigente.',
          iconColor: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30'
        };
      case 'extra_50':
        return {
          title: 'Hora Extra Suplementaria (50%)',
          description: 'Recargo aplicable a las horas laboradas en exceso de la jornada ordinaria durante días hábiles, hasta un límite máximo legal.',
          iconColor: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'
        };
      case 'extra_100':
        return {
          title: 'Hora Extra Extraordinaria (100%)',
          description: 'Recargo aplicable a las horas trabajadas en días feriados, fines de semana (sábado/domingo) o en jornada nocturna especial.',
          iconColor: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30'
        };
      case 'precio_diesel':
        return {
          title: 'Precio Galón Diésel',
          description: 'Establece el precio referencial por galón de Diésel utilizado para el cálculo y proyección de presupuesto en los vales de vehículos pesados.',
          iconColor: 'text-sky-500 bg-sky-50 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/30'
        };
      case 'precio_extra':
        return {
          title: 'Precio Galón Gasolina Extra',
          description: 'Establece el precio referencial por galón de Gasolina Extra utilizado para el cálculo y proyección de presupuesto en los vales de vehículos livianos.',
          iconColor: 'text-violet-500 bg-violet-50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900/30'
        };
      case 'precio_super':
        return {
          title: 'Precio Galón Gasolina Súper',
          description: 'Establece el precio referencial por galón de Gasolina Súper utilizado para el cálculo y proyección de presupuesto en los vales de vehículos de gama alta.',
          iconColor: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30'
        };
      default:
        return {
          title: key.replace('_', ' ').toUpperCase(),
          description: 'Tarifa general de cálculo para haberes y comisiones del personal de conducción.',
          iconColor: 'text-slate-500 bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'
        };
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-primary dark:text-white flex items-center gap-2">
            <DollarSign className="text-secondary" size={24} />
            Gestión de Tarifas Institucionales
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Administra los parámetros de cobro de viáticos y recargos por horas extras de choferes.
          </p>
        </div>
      </div>

      {/* Message banners */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-sm animate-fade-in">
          <CheckCircle size={18} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl border border-rose-100 dark:border-rose-900/30 text-sm animate-fade-in">
          <AlertTriangle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rates.map((rate) => {
            const info = getRateDetails(rate.rate_key);
            const isEditing = editModes[rate.id] || false;
            
            return (
              <div
                key={rate.id}
                className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 border border-slate-100 dark:border-slate-700/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-colors duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header Icon & Security Status Indicator */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-xl border ${info.iconColor}`}>
                      <DollarSign size={20} />
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-slate-50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800">
                      {isEditing ? (
                        <>
                          <Unlock size={12} className="text-emerald-500 animate-pulse" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Edición Abierta</span>
                        </>
                      ) : (
                        <>
                          <Lock size={12} className="text-slate-400" />
                          <span>Solo Lectura</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2 mb-6">
                    <h3 className="font-bold text-base text-primary dark:text-white line-clamp-1 leading-snug">
                      {info.title}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed min-h-[48px]">
                      {info.description}
                    </p>
                  </div>

                  {/* Input container */}
                  <div className="form-group mb-6">
                    <label className="form-label text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 block uppercase tracking-wider">
                      Valor Unitario ($)
                    </label>
                    <div className="input-container relative flex items-center">
                      <span className="absolute left-4 text-slate-400 dark:text-slate-500 font-bold" style={{ pointerEvents: 'none' }}>$</span>
                      <input
                        id={`rate-input-${rate.id}`}
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={inputValues[rate.id] || ''}
                        onChange={(e) => setInputValues(prev => ({ ...prev, [rate.id]: e.target.value }))}
                        readOnly={!isEditing}
                        disabled={savingId === rate.id}
                        required
                        className={`form-input pr-4 py-3 rounded-xl border w-full text-lg font-bold font-mono transition-all outline-none ${
                          isEditing
                            ? 'bg-white dark:bg-slate-900/50 border-blue-500 text-primary dark:text-white ring-4 ring-blue-900/10 focus:border-blue-900'
                            : 'bg-slate-50 dark:bg-slate-900/10 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed select-none'
                        }`}
                        style={{ paddingLeft: '28px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Controls */}
                <div className="border-t border-slate-100 dark:border-slate-700/60 pt-4">
                  {isEditing ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditModes(prev => ({ ...prev, [rate.id]: false }));
                          setInputValues(prev => ({ ...prev, [rate.id]: Number(rate.rate_value).toFixed(2) }));
                          setErrorMsg(null);
                        }}
                        disabled={savingId === rate.id}
                        className="flex-1 py-2 px-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/30 rounded-xl text-xs font-bold text-slate-650 dark:text-slate-300 transition"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleSaveRate(rate)}
                        disabled={savingId === rate.id}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Save size={13} />
                        {savingId === rate.id ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartModify(rate.id)}
                      className="w-full py-2 bg-gold/10 text-gold-dark hover:bg-gold/20 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-gold/25"
                    >
                      <Edit3 size={13} />
                      Modificar Tarifa
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminTarifasPage;
