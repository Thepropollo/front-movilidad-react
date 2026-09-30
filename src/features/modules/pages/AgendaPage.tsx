import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  Compass,
  CheckCircle2,
  Car,
  Navigation,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import CalendarAgenda, {
  type CalendarEvent,
  type CalendarViewMode,
  type CalendarFilterGroup,
} from '@/components/CalendarAgenda';
import type { PaginationMeta } from '@/components/Pagination';
import { DRIVER_RESPONSE_LABEL } from '@/lib/labels';
import { modulesApi } from '../api';
import { HeroMetricCard, StatCard, ResourceCard } from '@/components/Cards';

type Event = {
  id: number;
  date: string;
  return_date: string;
  destination: string;
  trip_status: string;
  driver_response: string;
  driver: string;
  vehicle: string;
};

const STATUS_LABEL: Record<string, string> = {
  programado: 'Programado',
  en_ruta: 'En ruta',
  pendiente_feedback: 'Pend. evaluación',
  finalizado: 'Finalizado',
};

const toISODate = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const getDateRangeForView = (date: Date, viewMode: CalendarViewMode, firstDayOfWeek = 0) => {
  if (viewMode === 'month') {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const firstDayIndex = firstDay.getDay(); // 0 = Sun
    const offset = (firstDayIndex - firstDayOfWeek + 7) % 7;
    const startDate = new Date(year, month, 1 - offset);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 41);
    return { from: toISODate(startDate), to: toISODate(endDate) };
  }
  if (viewMode === 'week') {
    const dayOfWeek = date.getDay();
    const offset = (dayOfWeek - firstDayOfWeek + 7) % 7;
    const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - offset);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6);
    return { from: toISODate(startDate), to: toISODate(endDate) };
  }
  if (viewMode === 'day') {
    const iso = toISODate(date);
    return { from: iso, to: iso };
  }
  // list view: full month
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { from: toISODate(start), to: toISODate(end) };
};

export default function AgendaPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calendar State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<CalendarViewMode>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [tripStatus, setTripStatus] = useState<string>('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');

  // Dynamic page fetcher
  const handlePageChange = (page: number) => {
    const { from, to } = getDateRangeForView(currentDate, view, 0);
    setLoading(true);
    modulesApi
      .agenda({
        from,
        to,
        trip_status: tripStatus || undefined,
        q: searchQuery.trim() || undefined,
        page,
        per_page: view === 'list' ? 15 : 100,
      })
      .then(({ data }) => {
        setEvents(data.events?.data ?? []);
        setMeta(data.events ?? null);
      })
      .catch(() => setError('No se pudo cargar la agenda de viajes.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let ignore = false;
    const { from, to } = getDateRangeForView(currentDate, view, 0);

    modulesApi
      .agenda({
        from,
        to,
        trip_status: tripStatus || undefined,
        q: searchQuery.trim() || undefined,
        page: 1,
        per_page: view === 'list' ? 15 : 100,
      })
      .then(({ data }) => {
        if (!ignore) {
          setEvents(data.events?.data ?? []);
          setMeta(data.events ?? null);
          setError(null);
        }
      })
      .catch(() => {
        if (!ignore) setError('No se pudo cargar la agenda de viajes.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [currentDate, view, tripStatus, searchQuery]);

  // Unique options for filters
  const driverOptions = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.driver) set.add(e.driver);
    });
    return [
      { label: 'All Categories', value: '' },
      ...Array.from(set).sort().map((d) => ({ label: d, value: d })),
    ];
  }, [events]);

  const vehicleOptions = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.vehicle) set.add(e.vehicle);
    });
    return [
      { label: 'Todos los vehículos', value: '' },
      ...Array.from(set).sort().map((v) => ({ label: v, value: v })),
    ];
  }, [events]);

  // Filter groups for CalendarAgenda header
  const filterGroups: CalendarFilterGroup[] = useMemo(() => [
    {
      id: 'trip_status',
      label: 'Estado de Viaje',
      options: [
        { label: 'Todos los estados', value: '' },
        { label: 'Programado', value: 'programado' },
        { label: 'En ruta', value: 'en_ruta' },
        { label: 'Pend. evaluación', value: 'pendiente_feedback' },
        { label: 'Finalizado', value: 'finalizado' },
      ],
      selectedValue: tripStatus,
      onSelect: (val) => setTripStatus(val),
    },
    {
      id: 'vehicles',
      label: 'Vehículo',
      options: vehicleOptions,
      selectedValue: selectedVehicle,
      onSelect: (val) => setSelectedVehicle(val),
    },
    {
      id: 'categories',
      label: 'Categories',
      options: driverOptions,
      selectedValue: selectedDriver,
      onSelect: (val) => setSelectedDriver(val),
    },
  ], [tripStatus, vehicleOptions, selectedVehicle, driverOptions, selectedDriver]);

  // Map to CalendarEvent interface and apply local driver/vehicle filter
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return events
      .filter((e) => {
        if (selectedDriver && e.driver !== selectedDriver) return false;
        if (selectedVehicle && e.vehicle !== selectedVehicle) return false;
        return true;
      })
      .map((e) => ({
        id: e.id,
        date: e.date,
        return_date: e.return_date,
        title: e.destination || 'Viaje sin destino',
        destination: e.destination,
        status: e.trip_status,
        statusLabel: STATUS_LABEL[e.trip_status] ?? e.trip_status,
        driver: e.driver,
        driver_response: DRIVER_RESPONSE_LABEL[e.driver_response] ?? e.driver_response,
        vehicle: e.vehicle,
        raw: e,
      }));
  }, [events, selectedDriver, selectedVehicle]);

  const enRutaCount = events.filter((e) => e.trip_status === 'en_ruta').length;
  const programadosCount = events.filter((e) => e.trip_status === 'programado').length;
  const finalizadosCount = events.filter((e) => e.trip_status === 'finalizado').length;

  return (
    <section className="module-page flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto">
      <HeroMetricCard
        badge="Operación y Planificación"
        badgeVariant="indigo"
        title="Agenda Institucional y Programación de Flota"
        description="Monitoreo interactivo del calendario de salidas institucionales. Visualice la programación mensual, semanal o diaria de unidades vehiculares, choferes designados y el avance de ruta."
        metricValue={String(events.length)}
        metricLabel="SALIDAS EN EL PERÍODO"
        actionLabel="Solicitudes por asignar"
        onAction={() => navigate('/app/secretaria/asignar')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Salidas"
          value={events.length}
          tone="info"
          icon={<CalendarDays size={18} />}
          hint="En el rango de fechas visible"
        />
        <StatCard
          label="En Circulación"
          value={enRutaCount}
          tone={enRutaCount > 0 ? 'warn' : 'neutral'}
          icon={<Activity size={18} />}
          hint={enRutaCount > 0 ? 'Comisiones activas en vía' : 'Sin viajes en curso'}
        />
        <StatCard
          label="Programados"
          value={programadosCount}
          tone="ok"
          icon={<Clock size={18} />}
          hint="Listos para despacho"
        />
        <StatCard
          label="Finalizados"
          value={finalizadosCount}
          tone="neutral"
          icon={<CheckCircle2 size={18} />}
          hint="Comisiones concluidas"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ResourceCard
          title="Mapa de Rutas en Vivo"
          description="Visualice paradas GPS en tiempo real y trayectorias vehiculares."
          icon={<Compass size={20} />}
          href="/app/secretaria/mapa"
        />
        <ResourceCard
          title="Disponibilidad de Flota"
          description="Consulte unidades vehiculares y choferes con estatus libre."
          icon={<Car size={20} />}
          href="/app/secretaria/disponibilidad"
        />
        <ResourceCard
          title="Asignación y Despacho"
          description="Asigne chofer y vehículo a las solicitudes autorizadas."
          icon={<Navigation size={20} />}
          href="/app/secretaria/asignar"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-mono flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Modern Aceternity-style Calendar Component */}
      <CalendarAgenda
        events={calendarEvents}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        view={view}
        onViewChange={setView}
        onNewEvent={() => navigate('/app/secretaria/asignar')}
        newEventLabel="Solicitudes por asignar"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar por destino, chofer o vehículo..."
        filterGroups={filterGroups}
        isLoading={loading}
        locale="en"
        firstDayOfWeek={0}
        paginationMeta={meta}
        onPageChange={handlePageChange}
      />
    </section>
  );
}
