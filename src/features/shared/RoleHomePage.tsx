import { useMemo } from 'react';
import {
  BarChart3,
  BookOpen,
  Calendar,
  CalendarDays,
  Car,
  FileText,
  Layers,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_EXPERIENCE } from '../../config/roleExperience';
import {
  ROLE_LABELS,
  isDualConductorMechanic,
  isDualDocenteFacultad,
  type RoleId,
} from '../../config/roles';
import OperationalDashboard from './OperationalDashboard';
import ResourceCard from '@/components/ResourceCard';

type Props = {
  focusRoles: RoleId[];
  title: string;
  subtitle: string;
};

function getPillarIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes('particip') || t.includes('invitac')) return <Users size={20} />;
  if (t.includes('solicit') || t.includes('trámite') || t.includes('docum') || t.includes('pendiente'))
    return <FileText size={20} />;
  if (t.includes('vehícul') || t.includes('flota') || t.includes('viaje') || t.includes('hoja'))
    return <Car size={20} />;
  if (t.includes('manten') || t.includes('taller') || t.includes('orden') || t.includes('lubric') || t.includes('novedad'))
    return <Wrench size={20} />;
  if (t.includes('autoriz') || t.includes('inspec') || t.includes('evaluar')) return <ShieldCheck size={20} />;
  if (t.includes('agenda') || t.includes('horario') || t.includes('calendario')) return <Calendar size={20} />;
  if (t.includes('reporte') || t.includes('indicador') || t.includes('historial') || t.includes('seguim') || t.includes('trazab'))
    return <BarChart3 size={20} />;
  return <Layers size={20} />;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function RoleHomePage({ focusRoles, title, subtitle }: Props) {
  const { user, roleIds } = useAuth();
  const active = focusRoles.filter((r) => roleIds.includes(r));
  const focusRole = (active[0] || roleIds[0]) as RoleId | undefined;
  const experience = focusRole ? ROLE_EXPERIENCE[focusRole] : undefined;
  const roleLabel = active.map((r) => ROLE_LABELS[r]).join(' · ');

  const today = useMemo(
    () =>
      new Intl.DateTimeFormat('es-EC', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
    []
  );

  return (
    <section className="role-home" aria-labelledby="role-home-title">
      <header className="sg-page-head">
        <div>
          <p className="sg-kicker">
            {greeting()}, {user?.first_name || 'bienvenido/a'}
          </p>
          <h1 id="role-home-title">{title}</h1>
          <p className="sg-lead">{experience?.promise ?? subtitle}</p>
        </div>
        <div className="sg-page-head-aside">
          <span className="sg-chip">
            <CalendarDays size={15} aria-hidden="true" />
            <span style={{ textTransform: 'capitalize' }}>{today}</span>
          </span>
          {roleLabel && (
            <span className="sg-chip">
              <ShieldCheck size={15} aria-hidden="true" />
              {roleLabel}
            </span>
          )}
        </div>
      </header>

      {(isDualConductorMechanic(roleIds) || isDualDocenteFacultad(roleIds)) && (
        <p className="sg-note is-gold" role="note">
          Doble rol activo: el menú lateral agrupa las funciones de cada perfil.
        </p>
      )}

      {experience && experience.pillars.length > 0 && (
        <section className="sg-section" aria-label="Procesos de este panel">
          <div className="sg-section-head">
            <h2>Procesos principales</h2>
            <span>Acceso directo a los flujos de su rol</span>
          </div>
          <div className="sg-stat-grid">
            {experience.pillars.map((pillar) => (
              <ResourceCard
                key={pillar.href}
                title={pillar.title}
                subtitle={pillar.text}
                href={pillar.href}
                icon={getPillarIcon(pillar.title)}
              />
            ))}
          </div>
        </section>
      )}

      <OperationalDashboard focusRole={focusRole} />

      {experience && (
        <details className="sg-details">
          <summary>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <BookOpen size={17} aria-hidden="true" />
              Guía operativa del panel
            </span>
          </summary>
          <ol>
            {experience.guide.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
