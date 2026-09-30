import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_EXPERIENCE } from '../../config/roleExperience';
import {
  ROLE_LABELS,
  isDualConductorMechanic,
  isDualDocenteFacultad,
  type RoleId,
} from '../../config/roles';
import api from '@/services/api';
import OperationalDashboard from './OperationalDashboard';
import ResourceCard from '@/components/ResourceCard';
import HeroMetricCard from '@/components/HeroMetricCard';
import {
  Car,
  FileText,
  Layers,
  ShieldCheck,
  Sparkles,
  Wrench,
  BarChart3,
  Calendar,
} from 'lucide-react';

type Props = {
  focusRoles: RoleId[];
  title: string;
  subtitle: string;
};

function getPillarIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes('solicitud') || t.includes('trámite') || t.includes('docum')) {
    return <FileText size={18} />;
  }
  if (t.includes('vehícul') || t.includes('flota') || t.includes('auto')) {
    return <Car size={18} />;
  }
  if (t.includes('manten') || t.includes('taller') || t.includes('orden')) {
    return <Wrench size={18} />;
  }
  if (t.includes('seguridad') || t.includes('garita') || t.includes('control')) {
    return <ShieldCheck size={18} />;
  }
  if (t.includes('agenda') || t.includes('horario') || t.includes('calendario')) {
    return <Calendar size={18} />;
  }
  if (t.includes('reporte') || t.includes('indicador') || t.includes('métrica')) {
    return <BarChart3 size={18} />;
  }
  return <Layers size={18} />;
}

export default function RoleHomePage({ focusRoles, title, subtitle }: Props) {
  const { user, roleIds } = useAuth();
  const active = focusRoles.filter((r) => roleIds.includes(r));
  const focusRole = (active[0] || roleIds[0]) as RoleId | undefined;
  const experience = focusRole ? ROLE_EXPERIENCE[focusRole] : undefined;

  const [kpiData, setKpiData] = useState<{ value: string | number; label: string } | null>(null);

  useEffect(() => {
    let ignore = false;
    api
      .get('/dashboard/metrics', {
        params: focusRole ? { focus: focusRole } : undefined,
      })
      .then(({ data }) => {
        if (!ignore && data?.kpis && data.kpis.length > 0) {
          const top = data.kpis[0];
          setKpiData({
            value: top.value,
            label: top.label.toUpperCase(),
          });
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [focusRole]);

  return (
    <section className="role-home flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto" aria-labelledby="role-home-title">
      {/* 1. Hero Metric Card (Image 2 format) */}
      <HeroMetricCard
        headline={`Bienvenido/a, ${user?.first_name || ''} ${user?.last_name || ''}`}
        author={title || active.map((r) => ROLE_LABELS[r]).join(' · ') || 'Universidad Laica Eloy Alfaro de Manabí'}
        tag={{
          icon: <Sparkles size={13} />,
          label: experience?.promise ?? subtitle,
        }}
        metricValue={kpiData ? String(kpiData.value) : '—'}
        metricLabel={kpiData ? kpiData.label : 'OPERATIVIDAD'}
        gradientClass="from-zinc-950 via-zinc-900 to-zinc-800"
      />

      {(isDualConductorMechanic(roleIds) || isDualDocenteFacultad(roleIds)) && (
        <div className="p-3 bg-zinc-100 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-700" role="note">
          Doble rol activo: el menú lateral organiza las funciones de cada perfil.
        </div>
      )}

      {/* 2. Process / Resource Cards Grid (Image 1 format) */}
      {experience && experience.pillars.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-mono text-zinc-900 uppercase tracking-wider">
              Procesos Principales
            </h2>
            <span className="text-xs font-mono text-zinc-400">
              Acceso rápido a flujos clave
            </span>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            aria-label="Procesos de este panel"
          >
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
        </div>
      )}

      {/* 3. Operational Dashboard (Includes MetricProgressCard & Stats) */}
      <OperationalDashboard focusRole={focusRole} />

      {/* 4. Operational Guide Accordion */}
      {experience && (
        <details className="p-4 bg-white border border-zinc-200 rounded-xl font-mono text-xs text-zinc-700 cursor-pointer shadow-xs">
          <summary className="font-bold text-zinc-900 select-none">
            Guía operativa del panel
          </summary>
          <ol className="list-decimal pl-5 mt-3 space-y-2 text-zinc-600">
            {experience.guide.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
