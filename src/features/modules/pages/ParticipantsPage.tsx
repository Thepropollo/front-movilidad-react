import { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import Button from '@/components/Button';
import { formatDateTimeReadable } from '@/lib/datetime';
import { modulesApi } from '../api';
import { HeroMetricCard, StatCard } from '@/components/Cards';

interface SolicitudOption {
  id: number;
  destination: string;
}

interface ParticipantSummary {
  total: number;
  aceptados: number;
  rechazados: number;
  pendientes: number;
}

interface ParticipantRow {
  id: number;
  invitation_status: string;
  responded_at?: string | null;
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    national_id?: string;
  } | null;
}

interface StudentResult {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  national_id: string;
  faculty_institution: string;
}

interface StudentPagination {
  current_page: number;
  per_page: number;
  path?: string;
  from: number | null;
  to: number | null;
  next_page_url: string | null;
  prev_page_url: string | null;
  data: StudentResult[];
}

export default function ParticipantsPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudOption[]>([]);
  const [selected, setSelected] = useState<number | ''>('');
  const [summary, setSummary] = useState<ParticipantSummary | null>(null);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [participantsPage, setParticipantsPage] = useState(1);
  const participantsPerPage = 10;
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<StudentResult[]>([]);
  const [studentsPagination, setStudentsPagination] =
    useState<StudentPagination | null>(null);
  const [studentsPerPage, setStudentsPerPage] = useState(10);
  const [searching, setSearching] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void modulesApi.listSolicitudes().then((r) => setSolicitudes(r.data || []));
  }, []);

  const load = async (id: number) => {
    const { data } = await modulesApi.participants(id);
    setParticipants(data.participants || []);
    setSummary(data.summary);
    setParticipantsPage(1);
  };

  const search = async (page = 1) => {
    if (query.trim().length < 2) {
      setStudents([]);
      setStudentsPagination(null);
      return;
    }

    setSearching(true);
    setError(null);
    try {
      const { data } = await modulesApi.searchStudents(
        query,
        page,
        studentsPerPage
      );
      if (Array.isArray(data)) {
        setStudents(data);
        setStudentsPagination(null);
      } else {
        setStudents(data.data || []);
        setStudentsPagination(data);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'No se pudo buscar estudiantes.');
    } finally {
      setSearching(false);
    }
  };

  const invite = async (userId: number) => {
    if (!selected) return;
    setMsg(null);
    setError(null);
    try {
      const { data } = await modulesApi.addParticipant(Number(selected), {
        user_id: userId,
      });
      setMsg(data.message);
      await load(Number(selected));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'No se pudo invitar.');
    }
  };

  const participantsTotalPages = Math.max(
    1,
    Math.ceil(participants.length / participantsPerPage)
  );
  const participantsStart = (participantsPage - 1) * participantsPerPage;
  const visibleParticipants = participants.slice(
    participantsStart,
    participantsStart + participantsPerPage
  );

  return (
    <section className="module-page flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-6">
      <HeroMetricCard
        badge="Participantes"
        badgeVariant="indigo"
        title="Gestión de Participantes del Viaje"
        description="Convoque estudiantes, valide cupos y revise confirmaciones de asistencia para comisiones académicas institucionales."
        metricValue={summary ? `${summary.total}` : `${solicitudes.length}`}
        metricLabel={summary ? 'ESTUDIANTES CONVOCADOS' : 'SOLICITUDES DISPONIBLES'}
      />
      {msg && <div className="alert alert-info" role="status">{msg}</div>}
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <div className="module-panel" style={{ marginBottom: 16 }}>
        <label className="form-label" htmlFor="sol">
          Solicitud
        </label>
        <select
          id="sol"
          className="form-select"
          value={selected}
          onChange={(e) => {
            const id = Number(e.target.value);
            setSelected(id);
            setStudents([]);
            setStudentsPagination(null);
            setQuery('');
            setSummary(null);
            setParticipants([]);
            if (id) void load(id);
          }}
        >
          <option value="">Seleccione…</option>
          {solicitudes.map((s) => (
            <option key={s.id} value={s.id}>
              #{s.id} · {s.destination}
            </option>
          ))}
        </select>
      </div>
      {summary && (
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Convocados"
              value={summary.total}
              hint="Total registrados"
              icon={<Users size={16} />}
              tone="neutral"
            />
            <StatCard
              label="Aceptados"
              value={summary.aceptados}
              hint="Confirmaron cupo"
              icon={<UserCheck size={16} />}
              tone="ok"
            />
            <StatCard
              label="Rechazados"
              value={summary.rechazados}
              hint="Declinaron viaje"
              icon={<UserX size={16} />}
              tone="danger"
            />
            <StatCard
              label="Pendientes"
              value={summary.pendientes}
              hint="En espera de respuesta"
              icon={<Clock size={16} />}
              tone="warn"
            />
          </div>
        </div>
      )}
      {selected && (
        <div className="participants-layout" style={{ marginBottom: 16 }}>
            <div className="module-panel">
              <div className="filters-row">
                <label>
                  Buscar estudiante
                  <input
                    id="participant-search"
                    className="form-input"
                    placeholder="Nombre, cédula o correo"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void search(1);
                    }}
                  />
                </label>
              <label>
                Por página
                <select
                  className="form-select"
                  value={studentsPerPage}
                  onChange={(e) => setStudentsPerPage(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
              <Button
                type="button"
                isLoading={searching}
                fullWidth={false}
                onClick={() => void search(1)}
              >
                Buscar
              </Button>
            </div>

            <div className="participants-table-wrap">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Cédula</th>
                    <th>Correo</th>
                    <th style={{ width: 120 }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td>
                        {s.first_name} {s.last_name}
                      </td>
                      <td>{s.national_id}</td>
                      <td>{s.email}</td>
                      <td>
                        <Button
                          type="button"
                          fullWidth={false}
                          onClick={() => void invite(s.id)}
                        >
                          Invitar
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={4} className="ops-muted">
                        {query.trim().length < 2
                          ? 'Escriba al menos 2 caracteres para buscar.'
                          : 'Sin resultados para la búsqueda actual.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {studentsPagination && (
              <div className="participants-pagination">
                <p className="ops-muted">
                  Mostrando {studentsPagination.from ?? 0}–
                  {studentsPagination.to ?? 0} ({studentsPagination.per_page} por
                  página)
                </p>
                <div className="participants-pagination-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth={false}
                    disabled={!studentsPagination.prev_page_url || searching}
                    onClick={() => void search(studentsPagination.current_page - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="ops-muted">
                    Página {studentsPagination.current_page}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth={false}
                    disabled={!studentsPagination.next_page_url || searching}
                    onClick={() => void search(studentsPagination.current_page + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="module-panel">
            <div className="participants-header">
              <h2>Invitados de la solicitud</h2>
              <p className="ops-muted">
                Mostrando {visibleParticipants.length} de {participants.length}
              </p>
            </div>

            <div className="participants-table-wrap">
              <table className="ops-table">
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Correo</th>
                    <th>Estado</th>
                    <th>Respondió</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleParticipants.map((p) => (
                    <tr key={p.id}>
                      <td>
                        {p.user?.first_name} {p.user?.last_name}
                      </td>
                      <td>{p.user?.email || '—'}</td>
                      <td>{p.invitation_status}</td>
                      <td>{formatDateTimeReadable(p.responded_at)}</td>
                    </tr>
                  ))}
                  {visibleParticipants.length === 0 && (
                    <tr>
                      <td colSpan={4} className="ops-muted">
                        No hay participantes en esta solicitud.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {participants.length > participantsPerPage && (
              <div className="participants-pagination">
                <p className="ops-muted">
                  Página {participantsPage} de {participantsTotalPages}
                </p>
                <div className="participants-pagination-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth={false}
                    disabled={participantsPage === 1}
                    onClick={() =>
                      setParticipantsPage((page) => Math.max(1, page - 1))
                    }
                  >
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth={false}
                    disabled={participantsPage === participantsTotalPages}
                    onClick={() =>
                      setParticipantsPage((page) =>
                        Math.min(participantsTotalPages, page + 1)
                      )
                    }
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
