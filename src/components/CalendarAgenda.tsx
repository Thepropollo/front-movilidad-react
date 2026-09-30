import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calendar,
  LayoutGrid,
  Clock,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  X,
  Car,
  User,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';

export type CalendarViewMode = 'month' | 'week' | 'day' | 'list';

export interface CalendarEvent {
  id: string | number;
  date: string; // YYYY-MM-DD
  return_date?: string;
  title: string;
  destination?: string;
  status?: string;
  statusLabel?: string;
  driver?: string;
  driver_response?: string;
  vehicle?: string;
  color?: string;
  raw?: unknown;
}

export interface CalendarFilterOption {
  value: string;
  label: string;
}

export interface CalendarFilterGroup {
  id: string;
  label: string;
  options: CalendarFilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

export interface CalendarAgendaProps {
  events: CalendarEvent[];
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  view?: CalendarViewMode;
  onViewChange?: (view: CalendarViewMode) => void;
  onNewEvent?: () => void;
  newEventLabel?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  filterGroups?: CalendarFilterGroup[];
  onEventClick?: (event: CalendarEvent) => void;
  isLoading?: boolean;
  locale?: 'es' | 'en';
  firstDayOfWeek?: 0 | 1; // 0 = Sunday (default as in image), 1 = Monday
  // List pagination
  paginationMeta?: {
    current_page: number;
    last_page: number;
    total: number;
    from?: number | null;
    to?: number | null;
  } | null;
  onPageChange?: (page: number) => void;
  className?: string;
}

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const WEEKDAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_NAMES_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function toISODate(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function getStatusBadgeStyle(status?: string) {
  const s = (status || '').toLowerCase();
  if (s.includes('programado')) {
    return 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100';
  }
  if (s.includes('ruta') || s.includes('en_ruta')) {
    return 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100';
  }
  if (s.includes('pendiente') || s.includes('feedback')) {
    return 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100';
  }
  if (s.includes('finalizado') || s.includes('completado')) {
    return 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100';
  }
  return 'bg-zinc-100 text-zinc-800 border-zinc-200 hover:bg-zinc-200';
}

function getStatusDotColor(status?: string) {
  const s = (status || '').toLowerCase();
  if (s.includes('programado')) return 'bg-sky-500';
  if (s.includes('ruta') || s.includes('en_ruta')) return 'bg-amber-500';
  if (s.includes('pendiente') || s.includes('feedback')) return 'bg-purple-500';
  if (s.includes('finalizado') || s.includes('completado')) return 'bg-emerald-500';
  return 'bg-zinc-500';
}

export default function CalendarAgenda({
  events,
  currentDate: controlledDate,
  onDateChange,
  view: controlledView,
  onViewChange,
  onNewEvent,
  newEventLabel = 'New Event',
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search events...',
  filterGroups = [],
  onEventClick,
  isLoading = false,
  locale = 'en',
  firstDayOfWeek = 0,
  paginationMeta,
  onPageChange,
  className = '',
}: CalendarAgendaProps) {
  // Controlled or uncontrolled internal date
  const [internalDate, setInternalDate] = useState<Date>(() => new Date());
  const activeDate = controlledDate ?? internalDate;

  // Controlled or uncontrolled internal view mode
  const [internalView, setInternalView] = useState<CalendarViewMode>('month');
  const activeView = controlledView ?? internalView;

  // Filter dropdown state
  const [openFilterId, setOpenFilterId] = useState<string | null>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Selected event for detail modal
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setOpenFilterId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeDate = (newDate: Date) => {
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      setInternalDate(newDate);
    }
  };

  const changeView = (newView: CalendarViewMode) => {
    if (onViewChange) {
      onViewChange(newView);
    } else {
      setInternalView(newView);
    }
  };

  // Navigations
  const handlePrev = () => {
    const d = new Date(activeDate);
    if (activeView === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (activeView === 'week') {
      d.setDate(d.getDate() - 7);
    } else if (activeView === 'day') {
      d.setDate(d.getDate() - 1);
    }
    changeDate(d);
  };

  const handleNext = () => {
    const d = new Date(activeDate);
    if (activeView === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else if (activeView === 'week') {
      d.setDate(d.getDate() + 7);
    } else if (activeView === 'day') {
      d.setDate(d.getDate() + 1);
    }
    changeDate(d);
  };

  const handleToday = () => {
    changeDate(new Date());
  };

  const year = activeDate.getFullYear();
  const month = activeDate.getMonth();
  const monthNames = locale === 'es' ? MONTH_NAMES_ES : MONTH_NAMES_EN;
  const weekdayNames = locale === 'es' ? WEEKDAY_NAMES_ES : WEEKDAY_NAMES_EN;
  const monthTitle = `${monthNames[month]} ${year}`;

  const todayStr = toISODate(new Date());

  // Organize events by date string
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of events) {
      if (!e.date) continue;
      const key = e.date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(e);
    }
    return map;
  }, [events]);

  // Compute 42 cells matrix for Month View (6 rows x 7 cols)
  const monthCells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const firstDayIndex = firstDay.getDay(); // 0 = Sun
    const offset = (firstDayIndex - firstDayOfWeek + 7) % 7;
    const startDate = new Date(year, month, 1 - offset);

    const cells = [];
    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
      const iso = toISODate(cellDate);
      cells.push({
        date: cellDate,
        iso,
        dayNumber: cellDate.getDate(),
        isCurrentMonth: cellDate.getMonth() === month,
        isToday: iso === todayStr,
        events: eventsByDate[iso] || [],
      });
    }
    return cells;
  }, [year, month, firstDayOfWeek, todayStr, eventsByDate]);

  // Compute 7 days for Week View
  const weekDays = useMemo(() => {
    const dayOfWeek = activeDate.getDay();
    const offset = (dayOfWeek - firstDayOfWeek + 7) % 7;
    const startDate = new Date(activeDate.getFullYear(), activeDate.getMonth(), activeDate.getDate() - offset);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
      const iso = toISODate(dayDate);
      days.push({
        date: dayDate,
        iso,
        dayNumber: dayDate.getDate(),
        weekdayIndex: dayDate.getDay(),
        isToday: iso === todayStr,
        events: eventsByDate[iso] || [],
      });
    }
    return days;
  }, [activeDate, firstDayOfWeek, todayStr, eventsByDate]);

  const handleCardClick = (event: CalendarEvent) => {
    if (onEventClick) {
      onEventClick(event);
    } else {
      setSelectedEvent(event);
    }
  };

  return (
    <div className={`w-full flex flex-col gap-4 font-mono text-zinc-900 ${className}`}>
      {/* 1. Header Bar: Month Year, Navigation, View Selector, Action Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Left: Month Year + Arrows + Today */}
        <div className="flex items-center gap-3">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 capitalize font-mono select-none">
            {monthTitle}
          </h2>

          <div className="flex items-center gap-1.5 ml-1">
            <button
              type="button"
              onClick={handlePrev}
              className="w-8 h-8 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 flex items-center justify-center text-zinc-700 transition-colors shadow-2xs cursor-pointer active:scale-95"
              aria-label="Previous"
              title="Anterior"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={handleToday}
              className="h-8 px-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-xs font-semibold text-zinc-800 transition-colors shadow-2xs cursor-pointer active:scale-95 flex items-center justify-center"
            >
              {locale === 'es' ? 'Hoy' : 'Today'}
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="w-8 h-8 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 flex items-center justify-center text-zinc-700 transition-colors shadow-2xs cursor-pointer active:scale-95"
              aria-label="Next"
              title="Siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Right: View switcher + New Event button */}
        <div className="flex items-center gap-2.5 ml-auto">
          {/* Segmented view switcher */}
          <div className="flex items-center p-1 bg-zinc-100/90 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-600 gap-0.5">
            <button
              type="button"
              onClick={() => changeView('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeView === 'month'
                  ? 'bg-white text-zinc-950 font-semibold shadow-xs'
                  : 'hover:text-zinc-950 hover:bg-zinc-200/50'
              }`}
            >
              <Calendar size={13} />
              <span>Month</span>
            </button>

            <button
              type="button"
              onClick={() => changeView('week')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeView === 'week'
                  ? 'bg-white text-zinc-950 font-semibold shadow-xs'
                  : 'hover:text-zinc-950 hover:bg-zinc-200/50'
              }`}
            >
              <LayoutGrid size={13} />
              <span>Week</span>
            </button>

            <button
              type="button"
              onClick={() => changeView('day')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeView === 'day'
                  ? 'bg-white text-zinc-950 font-semibold shadow-xs'
                  : 'hover:text-zinc-950 hover:bg-zinc-200/50'
              }`}
            >
              <Clock size={13} />
              <span>Day</span>
            </button>

            <button
              type="button"
              onClick={() => changeView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeView === 'list'
                  ? 'bg-white text-zinc-950 font-semibold shadow-xs'
                  : 'hover:text-zinc-950 hover:bg-zinc-200/50'
              }`}
            >
              <ListIcon size={13} />
              <span>List</span>
            </button>
          </div>

          {/* New Event Action button */}
          {onNewEvent && (
            <button
              type="button"
              onClick={onNewEvent}
              className="flex items-center gap-1.5 px-3.5 h-8.5 bg-black hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>{newEventLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="relative w-full">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-lg bg-white text-zinc-900 placeholder:text-zinc-400 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition-all shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange?.('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-0.5 rounded cursor-pointer"
            title="Borrar búsqueda"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 3. Filter Chips Row (Colors / Tags / Categories) */}
      {filterGroups.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap relative" ref={filterDropdownRef}>
          {filterGroups.map((group) => {
            const isOpen = openFilterId === group.id;
            const activeOption = group.options.find((o) => o.value === group.selectedValue);
            const hasActiveFilter = group.selectedValue !== '';

            return (
              <div key={group.id} className="relative">
                <button
                  type="button"
                  onClick={() => setOpenFilterId(isOpen ? null : group.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer shadow-2xs ${
                    hasActiveFilter
                      ? 'border-zinc-900 bg-zinc-900 text-white font-semibold'
                      : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                  }`}
                >
                  <Filter size={12} className={hasActiveFilter ? 'text-zinc-300' : 'text-zinc-500'} />
                  <span>
                    {hasActiveFilter && activeOption ? `${group.label}: ${activeOption.label}` : group.label}
                  </span>
                  {hasActiveFilter && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        group.onSelect('');
                      }}
                      className="ml-1 hover:text-red-300 p-0.5 rounded cursor-pointer"
                      title="Quitar filtro"
                    >
                      <X size={11} />
                    </span>
                  )}
                </button>

                {/* Popover dropdown */}
                {isOpen && (
                  <div className="absolute left-0 mt-1.5 w-52 bg-white border border-zinc-200 rounded-lg shadow-lg z-40 py-1 font-mono text-xs">
                    <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-zinc-400 border-b border-zinc-100">
                      Filtrar por {group.label}
                    </div>
                    <div className="max-h-56 overflow-y-auto py-1">
                      {group.options.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            group.onSelect(opt.value);
                            setOpenFilterId(null);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between cursor-pointer hover:bg-zinc-100 transition-colors ${
                            group.selectedValue === opt.value
                              ? 'bg-zinc-100 font-semibold text-zinc-900'
                              : 'text-zinc-700'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {group.selectedValue === opt.value && (
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Main Calendar Content: Month, Week, Day, List Views */}
      {isLoading ? (
        <div className="border border-zinc-200 rounded-xl p-12 bg-white flex flex-col items-center justify-center gap-2 text-zinc-400 shadow-xs">
          <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
          <span className="text-xs font-mono">Cargando eventos de agenda…</span>
        </div>
      ) : (
        <>
          {/* MONTH VIEW (Exact replica of the uploaded image) */}
          {activeView === 'month' && (
            <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-xs">
              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 border-b border-zinc-200 bg-white">
                {weekdayNames.map((name, i) => (
                  <div
                    key={name}
                    className={`py-3 text-center text-xs font-semibold text-zinc-700 ${
                      i < 6 ? 'border-r border-zinc-200' : ''
                    }`}
                  >
                    {name}
                  </div>
                ))}
              </div>

              {/* 42 Grid Cells */}
              <div className="grid grid-cols-7">
                {monthCells.map((cell, idx) => {
                  const isRightBorder = (idx + 1) % 7 !== 0;
                  const isBottomBorder = idx < 35;

                  return (
                    <div
                      key={cell.iso + '-' + idx}
                      onClick={() => {
                        changeDate(cell.date);
                      }}
                      className={`min-h-[110px] md:min-h-[125px] p-2 flex flex-col gap-1 transition-colors select-none ${
                        isRightBorder ? 'border-r border-zinc-200' : ''
                      } ${isBottomBorder ? 'border-b border-zinc-200' : ''} ${
                        cell.isCurrentMonth ? 'bg-white hover:bg-zinc-50/70' : 'bg-zinc-50/40 hover:bg-zinc-100/60'
                      }`}
                    >
                      {/* Cell Day Header */}
                      <div className="flex items-center justify-between mb-1">
                        {cell.isToday ? (
                          <div
                            className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shadow-xs"
                            title="Hoy"
                          >
                            {cell.dayNumber}
                          </div>
                        ) : (
                          <span
                            className={`text-xs ${
                              cell.isCurrentMonth
                                ? 'font-medium text-zinc-800'
                                : 'text-zinc-400 font-normal'
                            }`}
                          >
                            {cell.dayNumber}
                          </span>
                        )}
                        {cell.events.length > 0 && (
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {cell.events.length}
                          </span>
                        )}
                      </div>

                      {/* Event chips */}
                      <div className="flex flex-col gap-1 overflow-hidden">
                        {cell.events.slice(0, 3).map((event) => (
                          <button
                            key={event.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCardClick(event);
                            }}
                            className={`text-left px-2 py-1 rounded-md text-[11px] font-mono leading-tight border transition-all cursor-pointer truncate flex items-center gap-1.5 ${getStatusBadgeStyle(
                              event.status
                            )}`}
                            title={`${event.title}${event.driver ? ` · ${event.driver}` : ''}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusDotColor(
                                event.status
                              )}`}
                            />
                            <span className="truncate font-medium">{event.title}</span>
                          </button>
                        ))}

                        {cell.events.length > 3 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              changeDate(cell.date);
                              changeView('day');
                            }}
                            className="text-[10px] text-zinc-500 hover:text-zinc-950 font-semibold px-1 text-left cursor-pointer"
                          >
                            +{cell.events.length - 3} más...
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WEEK VIEW */}
          {activeView === 'week' && (
            <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50/50">
                {weekDays.map((day, idx) => (
                  <div
                    key={day.iso}
                    className={`p-3 text-center flex flex-col items-center gap-1.5 ${
                      idx < 6 ? 'border-r border-zinc-200' : ''
                    }`}
                  >
                    <span className="text-xs font-semibold text-zinc-600">
                      {weekdayNames[day.weekdayIndex]}
                    </span>
                    {day.isToday ? (
                      <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        {day.dayNumber}
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-zinc-800">
                        {day.dayNumber}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 divide-x divide-zinc-200 min-h-[380px]">
                {weekDays.map((day) => (
                  <div
                    key={day.iso}
                    className="p-2 flex flex-col gap-2 bg-white hover:bg-zinc-50/30 transition-colors"
                  >
                    {day.events.length === 0 ? (
                      <div className="text-[11px] text-zinc-400 italic text-center py-6">
                        Sin viajes
                      </div>
                    ) : (
                      day.events.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => handleCardClick(event)}
                          className="p-2.5 rounded-lg border border-zinc-200 bg-white hover:border-zinc-400 hover:shadow-xs transition-all cursor-pointer flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeStyle(
                                event.status
                              )}`}
                            >
                              {event.statusLabel || event.status || 'Viaje'}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              #{event.id}
                            </span>
                          </div>

                          <div className="font-semibold text-xs text-zinc-900 leading-snug line-clamp-2">
                            {event.title}
                          </div>

                          {event.driver && (
                            <div className="flex items-center gap-1 text-[11px] text-zinc-600 truncate">
                              <User size={11} className="text-zinc-400 flex-shrink-0" />
                              <span className="truncate">{event.driver}</span>
                            </div>
                          )}

                          {event.vehicle && (
                            <div className="flex items-center gap-1 text-[11px] text-zinc-600 truncate">
                              <Car size={11} className="text-zinc-400 flex-shrink-0" />
                              <span className="truncate">{event.vehicle}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DAY VIEW */}
          {activeView === 'day' && (
            <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-xs p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <CalendarDays size={18} className="text-zinc-500" />
                  <h3 className="text-base font-bold text-zinc-900 capitalize font-mono">
                    {activeDate.toLocaleDateString(locale === 'es' ? 'es-EC' : 'en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                </div>
                <span className="text-xs text-zinc-500 font-mono">
                  {(eventsByDate[toISODate(activeDate)] || []).length} evento(s) programados
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {(eventsByDate[toISODate(activeDate)] || []).length === 0 ? (
                  <div className="py-12 text-center text-zinc-400 text-xs font-mono">
                    No hay viajes ni eventos programados para esta fecha.
                  </div>
                ) : (
                  (eventsByDate[toISODate(activeDate)] || []).map((event) => (
                    <div
                      key={event.id}
                      onClick={() => handleCardClick(event)}
                      className="p-4 rounded-xl border border-zinc-200 hover:border-zinc-950 transition-all bg-white hover:shadow-xs cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeStyle(
                              event.status
                            )}`}
                          >
                            {event.statusLabel || event.status}
                          </span>
                          <span className="text-xs text-zinc-400">Viaje #{event.id}</span>
                        </div>
                        <h4 className="text-sm font-bold text-zinc-900 truncate">
                          {event.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600">
                          {event.driver && (
                            <span className="flex items-center gap-1">
                              <User size={13} className="text-zinc-400" />
                              {event.driver}
                            </span>
                          )}
                          {event.vehicle && (
                            <span className="flex items-center gap-1">
                              <Car size={13} className="text-zinc-400" />
                              {event.vehicle}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100">
                          Ver detalles
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* LIST VIEW */}
          {activeView === 'list' && (
            <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-zinc-700 font-semibold">
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">Destino</th>
                      <th className="py-3 px-4">Conductor</th>
                      <th className="py-3 px-4">Vehículo</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4">Respuesta</th>
                      <th className="py-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {events.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-400">
                          No se encontraron eventos en este período.
                        </td>
                      </tr>
                    ) : (
                      events.map((event) => (
                        <tr
                          key={event.id}
                          onClick={() => handleCardClick(event)}
                          className="hover:bg-zinc-50/80 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 text-zinc-800 whitespace-nowrap font-medium">
                            {event.date}
                          </td>
                          <td className="py-3 px-4 font-semibold text-zinc-900 max-w-xs truncate">
                            {event.title}
                          </td>
                          <td className="py-3 px-4 text-zinc-700 whitespace-nowrap">
                            {event.driver || '—'}
                          </td>
                          <td className="py-3 px-4 text-zinc-700 whitespace-nowrap">
                            {event.vehicle || '—'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeStyle(
                                event.status
                              )}`}
                            >
                              {event.statusLabel || event.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-zinc-600 whitespace-nowrap">
                            {event.driver_response || '—'}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCardClick(event);
                              }}
                              className="px-2 py-1 rounded text-zinc-700 hover:text-black hover:bg-zinc-100 font-semibold"
                            >
                              Ver
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination if provided */}
              {paginationMeta && paginationMeta.last_page > 1 && (
                <div className="flex items-center justify-between p-3 border-t border-zinc-200 bg-zinc-50 text-xs">
                  <span className="text-zinc-500">
                    Mostrando página {paginationMeta.current_page} de {paginationMeta.last_page} ({paginationMeta.total} registros)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={paginationMeta.current_page <= 1}
                      onClick={() => onPageChange?.(paginationMeta.current_page - 1)}
                      className="px-2.5 py-1 rounded border border-zinc-200 bg-white text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100"
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      disabled={paginationMeta.current_page >= paginationMeta.last_page}
                      onClick={() => onPageChange?.(paginationMeta.current_page + 1)}
                      className="px-2.5 py-1 rounded border border-zinc-200 bg-white text-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* 5. Event Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xl font-mono flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-3">
              <div>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1.5 ${getStatusBadgeStyle(
                    selectedEvent.status
                  )}`}
                >
                  {selectedEvent.statusLabel || selectedEvent.status}
                </span>
                <h3 className="text-base font-bold text-zinc-950 leading-snug">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="w-8 h-8 rounded-lg border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Details Grid */}
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-zinc-700">
                <Calendar size={15} className="text-zinc-400 flex-shrink-0" />
                <div>
                  <span className="text-zinc-400">Salida: </span>
                  <strong className="text-zinc-900">{selectedEvent.date}</strong>
                  {selectedEvent.return_date && (
                    <>
                      <span className="text-zinc-400 ml-2">Retorno: </span>
                      <strong className="text-zinc-900">{selectedEvent.return_date}</strong>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-zinc-700">
                <User size={15} className="text-zinc-400 flex-shrink-0" />
                <div>
                  <span className="text-zinc-400">Conductor: </span>
                  <strong className="text-zinc-900">{selectedEvent.driver || 'No asignado'}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-zinc-700">
                <Car size={15} className="text-zinc-400 flex-shrink-0" />
                <div>
                  <span className="text-zinc-400">Vehículo: </span>
                  <strong className="text-zinc-900">{selectedEvent.vehicle || 'No asignado'}</strong>
                </div>
              </div>

              {selectedEvent.driver_response && (
                <div className="flex items-center gap-2.5 text-zinc-700">
                  <CheckCircle2 size={15} className="text-zinc-400 flex-shrink-0" />
                  <div>
                    <span className="text-zinc-400">Respuesta conductor: </span>
                    <strong className="text-zinc-900">{selectedEvent.driver_response}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
