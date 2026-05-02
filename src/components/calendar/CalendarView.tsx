import { useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { CalendarApi, EventInput, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

export interface CalendarBooking {
  id: string;
  fecha_inicio_utc: string;
  duracion_min: number | string;
  tipo: string;
  estado: string;
  cliente?: { id: string; nombres: string; apellidos: string; nick?: string } | null;
  entrenador?: { id: string; nombres: string; apellidos: string; nick?: string } | null;
  sede?: { id: string; nombre: string; ciudad?: string } | null;
}

type LabelMode = 'auto' | 'cliente' | 'entrenador' | 'tipo';
type DefaultView = 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth' | 'listWeek';

interface CalendarViewProps {
  bookings: CalendarBooking[];
  defaultView?: DefaultView;
  /** CSS height. 'auto' o pixels number o '100%'. */
  height?: string | number;
  showLabel?: LabelMode;
  /** Días de la semana ocultos. 0=domingo … 6=sábado. */
  hiddenDays?: number[];
  /** Slot mínimo en formato HH:mm:ss */
  slotMinTime?: string;
  slotMaxTime?: string;
  /** Header reducido (sin opciones de cambio de vista). */
  compact?: boolean;
  onBookingClick?: (id: string) => void;
}

const ESTADO_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  solicitado:           { bg: 'rgba(255,176,46,0.18)',  text: '#FFC97A', border: 'rgba(255,176,46,0.5)' },
  confirmado:           { bg: 'rgba(200,255,61,0.20)',  text: '#D8FF6E', border: 'rgba(200,255,61,0.55)' },
  pactado:              { bg: 'rgba(122,199,255,0.18)', text: '#A8D9FF', border: 'rgba(122,199,255,0.5)' },
  completado:           { bg: 'rgba(125,224,141,0.18)', text: '#A6EDB1', border: 'rgba(125,224,141,0.5)' },
  cancelado:            { bg: 'rgba(168,176,164,0.10)', text: '#B8C0B4', border: 'rgba(168,176,164,0.3)' },
  'no-asistido':        { bg: 'rgba(255,92,92,0.15)',   text: '#FF8E8E', border: 'rgba(255,92,92,0.5)' },
  rechazado:            { bg: 'rgba(255,92,92,0.15)',   text: '#FF8E8E', border: 'rgba(255,92,92,0.5)' },
  requiere_autorizacion:{ bg: 'rgba(255,176,46,0.18)',  text: '#FFC97A', border: 'rgba(255,176,46,0.5)' },
};

function buildTitle(b: CalendarBooking, mode: LabelMode): string {
  const nombre = (u?: { nombres: string; apellidos: string } | null) =>
    u ? `${u.nombres} ${u.apellidos}`.trim() : '';
  if (mode === 'cliente') return nombre(b.cliente) || b.tipo;
  if (mode === 'entrenador') return nombre(b.entrenador) || b.tipo;
  if (mode === 'tipo') return b.tipo;
  // auto: prefiere cliente; si no hay, entrenador; si no, tipo
  return nombre(b.cliente) || nombre(b.entrenador) || b.tipo;
}

export function CalendarView({
  bookings,
  defaultView = 'timeGridWeek',
  height = 'auto',
  showLabel = 'auto',
  hiddenDays,
  slotMinTime = '06:00:00',
  slotMaxTime = '22:00:00',
  compact = false,
  onBookingClick,
}: CalendarViewProps) {
  const ref = useRef<FullCalendar | null>(null);

  const events = useMemo<EventInput[]>(() => {
    return bookings.map((b) => {
      const start = new Date(b.fecha_inicio_utc);
      const dur = Number(b.duracion_min) || 60;
      const end = new Date(start.getTime() + dur * 60000);
      const colors = ESTADO_COLORS[b.estado] ?? ESTADO_COLORS.cancelado;
      return {
        id: b.id,
        title: buildTitle(b, showLabel),
        start: start.toISOString(),
        end: end.toISOString(),
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
        extendedProps: { booking: b },
      };
    });
  }, [bookings, showLabel]);

  function handleEventClick(info: EventClickArg) {
    if (onBookingClick) onBookingClick(info.event.id);
  }

  const headerToolbar = compact
    ? { left: 'prev,next today', center: 'title', right: '' }
    : {
        left: 'prev,next today',
        center: 'title',
        right: 'timeGridDay,timeGridWeek,dayGridMonth,listWeek',
      };

  void ref;

  return (
    <div className="alfallo-calendar">
      <FullCalendar
        ref={ref}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView={defaultView}
        headerToolbar={headerToolbar}
        buttonText={{ today: 'Hoy', day: 'Día', week: 'Semana', month: 'Mes', list: 'Lista' }}
        events={events}
        eventClick={handleEventClick}
        locale="es"
        firstDay={1}
        slotMinTime={slotMinTime}
        slotMaxTime={slotMaxTime}
        slotDuration="00:30:00"
        snapDuration="00:30:00"
        nowIndicator
        height={height}
        weekNumbers={false}
        dayMaxEvents={3}
        hiddenDays={hiddenDays}
        eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        allDaySlot={false}
        expandRows
      />
    </div>
  );
}

export type { CalendarApi };
