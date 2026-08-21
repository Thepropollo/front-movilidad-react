import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { formatDateReadable, formatDateTimeReadable } from '@/lib/datetime';
import { MOBILIZATION_TYPE_LABEL, REQUEST_STATUS_LABEL, TRIP_STATUS_LABEL, DRIVER_RESPONSE_LABEL, INVITATION_STATUS_LABEL, labelOf } from '@/lib/labels';
import { modulesApi } from '../api';
import { useAuth } from '@/context/AuthContext';

type TimelineItem = {
  id: number;
  action: string;
  from_status: string | null;
  to_status: string;
  observation?: string;
  created_at?: string;
  user?: { first_name: string; last_name: string };
};

type RequestDetail = {
  id: number;
  status: string;
  mobilization_type: string;
  origin: string;
  destination: string;
  travel_reason?: string;
  departure_date?: string;
  return_date?: string;
  estimated_days?: number;
  projected_cost?: number | string;
  created_at?: string;
  confirmation_deadline?: string | null;
  requester?: {
    first_name: string;
    last_name: string;
    faculty_institution?: string;
  };
  secretaria_approver?: {
    first_name: string;
    last_name: string;
  } | null;
  rectorate_approver?: {
    first_name: string;
    last_name: string;
  } | null;
  route_sheet?: {
    id: number;
    trip_status?: string;
    driver_response?: string;
    driver?: {
      user?: {
        first_name: string;
        last_name: string;
      } | null;
    } | null;
    vehicle?: {
      plate?: string;
      brand?: string;
      model?: string;
    } | null;
  } | null;
  passengers?: Array<{
    id: number;
    invitation_status: string;
    user?: {
      first_name: string;
      last_name: string;
    };
  }>;
};

type StageState = 'done' | 'current' | 'pending' | 'blocked';

type Stage = {
  key: string;
  label: string;
  state: StageState;
  action?: string;
};

const STAGE_STATE_LABEL: Record<StageState, string> = {
  done: 'Completado',
  current: 'En curso',
  pending: 'Pendiente',
  blocked: 'Rechazado',
};

const STATUS_BADGE: Record<string, string> = {
  pendiente_secretaria: 'bg-amber-100 text-amber-900',
  pendiente_rectorado: 'bg-amber-100 text-amber-900',
  autorizada_secretaria: 'bg-blue-100 text-blue-800',
  aprobado_rectorado: 'bg-blue-100 text-blue-800',
  aprobada: 'bg-green-100 text-green-800',
  rechazada: 'bg-red-100 text-red-800',
};

export default function FlujoPage() {
  const { roleIds } = useAuth();
  const [solicitudes, setSolicitudes] = useState<
    Array<{ id: number; destination: string; status: string }>
  >([]);
  const [selected, setSelected] = useState<number | ''>('');
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void modulesApi
      .listSolicitudes()
      .then((res) => setSolicitudes(res.data))
      .catch(() => setError('No se pudieron cargar solicitudes.'));
  }, []);

  const loadFlujo = async (id: number) => {
    setError(null);
    try {
      const { data } = await modulesApi.flujo(id);
      setTimeline(data.timeline || []);
      setDetail(data.request);
    } catch {
      setError('No se pudo cargar la trazabilidad.');
    }
  };

  const mapPath = roleIds.includes('secretaria')
    ? '/app/secretaria/mapa'
    : roleIds.includes('vicerrector')
      ? '/app/vicerrector/mapa'
      : roleIds.includes('docente')
        ? '/app/docente/mapa'
        : roleIds.includes('estudiante')
          ? '/app/estudiante/mapa'
          : roleIds.includes('conductor')
            ? '/app/conductor/mapa'
            : '/app/secretaria/mapa';

  const participantsSummary = useMemo(() => {
    const rows = detail?.passengers ?? [];
    return {
      total: rows.length,
      aceptados: rows.filter((p) => p.invitation_status === 'aceptado').length,
      rechazados: rows.filter((p) => p.invitation_status === 'rechazado').length,
      pendientes: rows.filter((p) => p.invitation_status === 'invitado').length,
    };
  }, [detail?.passengers]);

  const projectedCost =
    detail?.projected_cost == null
      ? '—'
      : new Intl.NumberFormat('es-EC', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 2,
        }).format(Number(detail.projected_cost));

  const stages = useMemo<Stage[]>(() => {
    if (!detail) return [];
    const st = detail.status;
    const isExterna = detail.mobilization_type === 'externa';
    const rs = detail.route_sheet;
    const driverResponse = rs?.driver_response;
    const tripStatus = rs?.trip_status;
    const has = (a: string) => timeline.some((t) => t.action === a);

    const list: Stage[] = [
      {
        key: 'creada',
        label: 'Solicitud creada',
        state: 'done',
        action: 'SOLICITUD_CREADA',
      },
    ];

    let secState: StageState;
    if (has('SECRETARIA_RECHAZA')) secState = 'blocked';
    else if (has('SECRETARIA_AUTORIZA')) secState = 'done';
    else if (st === 'pendiente_secretaria') secState = 'current';
    else secState = 'pending';
    list.push({
      key: 'secretaria',
      label: 'Autorización de Secretaría',
      state: secState,
      action: secState === 'blocked' ? 'SECRETARIA_RECHAZA' : 'SECRETARIA_AUTORIZA',
    });

    if (isExterna) {
      let vicState: StageState;
      if (has('VICERRECTOR_RECHAZA')) vicState = 'blocked';
      else if (has('VICERRECTOR_APRUEBA')) vicState = 'done';
      else if (st === 'pendiente_rectorado') vicState = 'current';
      else vicState = 'pending';
      list.push({
        key: 'vicerrectorado',
        label: 'Aprobación de Vicerrectorado',
        state: vicState,
        action: vicState === 'blocked' ? 'VICERRECTOR_RECHAZA' : 'VICERRECTOR_APRUEBA',
      });
    }

    let asigState: StageState;
    if (rs) asigState = 'done';
    else if (
      (isExterna && st === 'aprobado_rectorado') ||
      (!isExterna && st === 'autorizada_secretaria')
    )
      asigState = 'current';
    else asigState = 'pending';
    list.push({
      key: 'asignacion',
      label: 'Asignación de recursos',
      state: asigState,
      action: 'ASIGNACION_RECURSOS',
    });

    let condState: StageState;
    if (driverResponse === 'aceptado') condState = 'done';
    else if (driverResponse === 'rechazado') condState = 'blocked';
    else if (driverResponse === 'pendiente') condState = 'current';
    else condState = 'pending';
    list.push({
      key: 'conductor',
      label: 'Aceptación del conductor',
      state: condState,
      action: condState === 'blocked' ? 'CONDUCTOR_RECHAZA' : 'CONDUCTOR_ACEPTA',
    });

    let salidaState: StageState;
    if (tripStatus === 'en_ruta' || tripStatus === 'finalizado') salidaState = 'done';
    else if (driverResponse === 'aceptado' && tripStatus === 'programado') salidaState = 'current';
    else salidaState = 'pending';
    list.push({ key: 'salida', label: 'Salida (inspección en patio)', state: salidaState });

    let llegadaState: StageState;
    if (tripStatus === 'finalizado') llegadaState = 'done';
    else if (tripStatus === 'en_ruta') llegadaState = 'current';
    else llegadaState = 'pending';
    list.push({ key: 'llegada', label: 'Llegada / cierre', state: llegadaState });

    return list;
  }, [detail, timeline]);

  const doneCount = stages.filter((s) => s.state === 'done').length;

  const rejectEvent = timeline.find(
    (t) => t.action === 'SECRETARIA_RECHAZA' || t.action === 'VICERRECTOR_RECHAZA'
  );

  const cleanReason = (reason?: string) =>
    reason ? reason.split(/\[RECHAZADO/i)[0].trim() : '—';

  return (
    <section className="module-page">
      <header className="module-header">
        <p className="module-kicker">Trazabilidad</p>
        <h1>Flujo completo de la solicitud</h1>
        <p className="module-lead">
          Registro de cambio de estados, fecha y observacion
        </p>
      </header>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="module-panel" style={{ marginBottom: 16 }}>
        <label className="form-label" htmlFor="solicitud">
          Solicitud
        </label>
        <select
          id="solicitud"
          className="form-select"
          value={selected}
          onChange={(e) => {
            const id = Number(e.target.value);
            setSelected(id);
            if (id) void loadFlujo(id);
          }}
        >
          <option value="">Seleccione…</option>
          {solicitudes.map((s) => (
            <option key={s.id} value={s.id}>
              #{s.id} · {s.destination} ·{' '}
              {labelOf(REQUEST_STATUS_LABEL, s.status)}
            </option>
          ))}
        </select>
      </div>

      {detail && (
        <>
          <div className="trace-head">
            <div>
              <p className="module-kicker">Estado actual</p>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${
                  STATUS_BADGE[detail.status] ?? 'bg-gray-100 text-gray-700'
                }`}
              >
                {labelOf(REQUEST_STATUS_LABEL, detail.status)}
              </span>
              <p style={{ marginTop: 6 }}>
                {detail.origin} → {detail.destination}
              </p>
            </div>
            {detail.route_sheet?.id && (
              <Link className="btn btn-primary" to={mapPath}>
                Ver en mapa
              </Link>
            )}
          </div>

          {detail.status === 'rechazada' && rejectEvent && (
            <div
              className="alert alert-danger"
              style={{ marginBottom: 16, display: 'block' }}
              role="alert"
            >
              <strong>Solicitud rechazada.</strong>
              {rejectEvent.observation ? ` ${rejectEvent.observation}` : ''}
            </div>
          )}

          <div className="trace-stats">
            <article className="stat-card">
              <span>Tipo</span>
              <strong>{labelOf(MOBILIZATION_TYPE_LABEL, detail.mobilization_type)}</strong>
            </article>
            <article className="stat-card">
              <span>Costo proyectado</span>
              <strong>{projectedCost}</strong>
            </article>
            <article className="stat-card">
              <span>Días estimados</span>
              <strong>{detail.estimated_days ?? '—'}</strong>
            </article>
            <article className="stat-card">
              <span>Participantes</span>
              <strong>{participantsSummary.total}</strong>
            </article>
            <article className="stat-card">
              <span>Respondidos</span>
              <strong>
                {participantsSummary.aceptados + participantsSummary.rechazados}
              </strong>
            </article>
          </div>

          {stages.length > 0 && (
            <div className="module-panel flow-panel">
              <div className="flow-head">
                <h3>Avance del proceso</h3>
                <span className="flow-progress">
                  {doneCount} de {stages.length} etapas completadas
                </span>
              </div>
              <ol className="flow-stepper">
                {stages.map((stage, i) => {
                  const ev = stage.action
                    ? timeline.find((t) => t.action === stage.action)
                    : undefined;
                  return (
                    <li key={stage.key} className={`flow-step is-${stage.state}`}>
                      <span className="flow-step-node" aria-hidden>
                        {stage.state === 'done' ? (
                          <Check size={16} />
                        ) : stage.state === 'blocked' ? (
                          <X size={16} />
                        ) : (
                          i + 1
                        )}
                      </span>
                      <div className="flow-step-body">
                        <div className="flow-step-title">
                          <strong>{stage.label}</strong>
                          <span className="flow-step-state">
                            {STAGE_STATE_LABEL[stage.state]}
                          </span>
                        </div>
                        {(stage.state === 'done' || stage.state === 'blocked') &&
                          ev && (
                            <span className="flow-step-meta">
                              {ev.user
                                ? `${ev.user.first_name} ${ev.user.last_name}`
                                : 'Sistema'}
                              {ev.created_at
                                ? ` · ${formatDateTimeReadable(ev.created_at)}`
                                : ''}
                            </span>
                          )}
                        {stage.state === 'blocked' && ev?.observation && (
                          <em>{ev.observation}</em>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          <div className="trace-grid">
            <section className="module-panel">
              <h3>Datos de la solicitud</h3>
              <dl className="trace-meta-grid">
                <div>
                  <dt>Solicitante</dt>
                  <dd>
                    {detail.requester
                      ? `${detail.requester.first_name} ${detail.requester.last_name}`
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt>Facultad</dt>
                  <dd>{detail.requester?.faculty_institution || '—'}</dd>
                </div>
                <div>
                  <dt>Salida</dt>
                  <dd>{formatDateReadable(detail.departure_date)}</dd>
                </div>
                <div>
                  <dt>Retorno</dt>
                  <dd>{formatDateReadable(detail.return_date)}</dd>
                </div>
                <div>
                  <dt>Creada</dt>
                  <dd>{formatDateTimeReadable(detail.created_at)}</dd>
                </div>
                <div>
                  <dt>Límite confirmación</dt>
                  <dd>{formatDateTimeReadable(detail.confirmation_deadline)}</dd>
                </div>
                <div>
                  <dt>Secretaría</dt>
                  <dd>
                    {detail.secretaria_approver
                      ? `${detail.secretaria_approver.first_name} ${detail.secretaria_approver.last_name}`
                      : 'Pendiente'}
                  </dd>
                </div>
                <div>
                  <dt>Vicerrectorado</dt>
                  <dd>
                    {detail.rectorate_approver
                      ? `${detail.rectorate_approver.first_name} ${detail.rectorate_approver.last_name}`
                      : 'Pendiente'}
                  </dd>
                </div>
              </dl>
              <p className="ops-muted" style={{ marginTop: 10 }}>
                Motivo: {cleanReason(detail.travel_reason)}
              </p>
            </section>

            <section className="module-panel">
              <h3>Asignación operativa</h3>
              <dl className="trace-meta-grid">
                <div>
                  <dt>Hoja de ruta</dt>
                  <dd>{detail.route_sheet?.id ? `#${detail.route_sheet.id}` : '—'}</dd>
                </div>
                <div>
                  <dt>Estado de viaje</dt>
                  <dd>{labelOf(TRIP_STATUS_LABEL, detail.route_sheet?.trip_status)}</dd>
                </div>
                <div>
                  <dt>Respuesta conductor</dt>
                  <dd>{labelOf(DRIVER_RESPONSE_LABEL, detail.route_sheet?.driver_response)}</dd>
                </div>
                <div>
                  <dt>Conductor</dt>
                  <dd>
                    {detail.route_sheet?.driver?.user
                      ? `${detail.route_sheet.driver.user.first_name} ${detail.route_sheet.driver.user.last_name}`
                      : 'No asignado'}
                  </dd>
                </div>
                <div>
                  <dt>Vehículo</dt>
                  <dd>
                    {detail.route_sheet?.vehicle?.plate
                      ? `${detail.route_sheet.vehicle.plate} · ${detail.route_sheet.vehicle.brand ?? ''} ${detail.route_sheet.vehicle.model ?? ''}`.trim()
                      : 'No asignado'}
                  </dd>
                </div>
              </dl>

              <div className="trace-participants">
                <p className="module-kicker">Participantes</p>
                <ul>
                  {(detail.passengers || []).slice(0, 6).map((p) => (
                    <li key={p.id}>
                      <span>
                        {p.user
                          ? `${p.user.first_name} ${p.user.last_name}`
                          : `Usuario #${p.id}`}
                      </span>
                      <small>{labelOf(INVITATION_STATUS_LABEL, p.invitation_status)}</small>
                    </li>
                  ))}
                  {(detail.passengers || []).length === 0 && (
                    <li>
                      <span className="ops-muted">Sin participantes registrados.</span>
                    </li>
                  )}
                </ul>
              </div>
            </section>
          </div>
        </>
      )}
    </section>
  );
}
