import { useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { CalendarApi, EventInput, EventClickArg, EventContentArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

interface UserGroup {
  id: string;
  nombre: string;
  color: string;
}

export interface CalendarBooking {
  id: string;
  fecha_inicio_utc: string;
  duracion_min: number | string;
  tipo: string;
  estado: string;
  cliente?: { id: string; nombres: string; apellidos: string; nick?: string } | null;
  entrenador?: { id: string; nombres: string; apellidos: string; nick?: string } | null;
  sede?: { id: string; nombre: string; ciudad?: string } | null;
  userGroups?: UserGroup[];
}

export interface UnavailabilityEvent {
  ruleId: string;
  titulo: string;
  descripcion?: string;
  entityType: 'trainer' | 'global';
  entityId: string;
  start: string;
  end: string;
  /** Nombre del entrenador (admin lo ve) */
  trainerName?: string;
}

type LabelMode = 'auto' | 'cliente' | 'entrenador' | 'tipo';
type DefaultView = 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth' | 'listWeek';

interface CalendarViewProps {
  bookings: CalendarBooking[];
  unavailability?: UnavailabilityEvent[];
  defaultView?: DefaultView;
  height?: string | number;
  showLabel?: LabelMode;
  hiddenDays?: number[];
  slotMinTime?: string;
  slotMaxTime?: string;
  compact?: boolean;
  /** Si true, los eventos del calendario muestran nombre del entrenador en eventos
   *  de no-disponibilidad. Para vista admin. */
  showTrainerInUnavailability?: boolean;
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

const UNAVAILABILITY_COLOR = {
  bg: 'rgba(255,92,92,0.18)',
  border: 'rgba(255,92,92,0.5)',
  text: '#FF8E8E',
  // Pattern para distinguir como "bloqueado" — usamos rojizo apagado + diagonal stripes via background-image
};

function buildTitle(b: CalendarBooking, mode: LabelMode): string {
  const nombre = (u?: { nombres: string; apellidos: string } | null) =>
    u ? `${u.nombres} ${u.apellidos}`.trim() : '';
  if (mode === 'cliente') return nombre(b.cliente) || b.tipo;
  if (mode === 'entrenador') return nombre(b.entrenador) || b.tipo;
  if (mode === 'tipo') return b.tipo;
  return nombre(b.cliente) || nombre(b.entrenador) || b.tipo;
}

export function CalendarView({
  bookings,
  unavailability,
  defaultView = 'timeGridWeek',
  height = 'auto',
  showLabel = 'auto',
  hiddenDays,
  slotMinTime = '06:00:00',
  slotMaxTime = '22:00:00',
  compact = false,
  showTrainerInUnavailability = false,
  onBookingClick,
}: CalendarViewProps) {
  const ref = useRef<FullCalendar | null>(null);

  const events = useMemo<EventInput[]>(() => {
    const arr: EventInput[] = [];

    // Bookings
    for (const b of bookings) {
      const start = new Date(b.fecha_inicio_utc);
      const dur = Number(b.duracion_min) || 60;
      const end = new Date(start.getTime() + dur * 60000);

      const groups = b.userGroups ?? [];
      const stateColors = ESTADO_COLORS[b.estado] ?? ESTADO_COLORS.cancelado;

      let bg = stateColors.bg;
      let border = stateColors.border;
      let text = stateColors.text;

      // Si pertenece a 1 solo grupo Y la sesión NO está en estado cancelado/rechazado/no-asistido
      // → usa el color del grupo. Si pertenece a varios → mantiene color de estado y muestra
      // los puntos de grupo en el contenido.
      const aliveStates = ['solicitado', 'confirmado', 'pactado', 'completado', 'requiere_autorizacion'];
      if (groups.length === 1 && aliveStates.indexOf(b.estado) !== -1) {
        const c = groups[0].color;
        bg = hexWithAlpha(c, 0.20);
        border = hexWithAlpha(c, 0.55);
        text = lightenForText(c);
      }

      arr.push({
        id: b.id,
        title: buildTitle(b, showLabel),
        start: start.toISOString(),
        end: end.toISOString(),
        backgroundColor: bg,
        borderColor: border,
        textColor: text,
        extendedProps: { booking: b, kind: 'booking' },
      });
    }

    // Unavailability como background events (no clickeables, no movibles)
    if (unavailability) {
      for (const u of unavailability) {
        let title = u.titulo;
        if (showTrainerInUnavailability && u.trainerName) {
          title = `${u.trainerName} — ${u.titulo}`;
        } else if (u.entityType === 'global') {
          title = `🌐 ${u.titulo}`;
        }
        arr.push({
          id: 'unavail-' + u.ruleId + '-' + u.start,
          title: title,
          start: u.start,
          end: u.end,
          display: 'background',
          backgroundColor: UNAVAILABILITY_COLOR.bg,
          extendedProps: { unavailability: u, kind: 'unavailability' },
        });
      }
    }

    return arr;
  }, [bookings, unavailability, showLabel, showTrainerInUnavailability]);

  function handleEventClick(info: EventClickArg) {
    const kind = info.event.extendedProps.kind;
    if (kind === 'booking' && onBookingClick) onBookingClick(info.event.id);
  }

  function renderEvent(arg: EventContentArg) {
    const kind = arg.event.extendedProps.kind;

    if (kind === 'unavailability') {
      // Para events con display='background', FC ya pinta el fondo.
      // Renderizamos un label sobrepuesto en la esquina sup. izquierda.
      return (
        <div
          className="absolute top-0.5 left-1 right-1 text-[10px] font-medium truncate pointer-events-none"
          style={{ color: UNAVAILABILITY_COLOR.text }}
        >
          {arg.event.title}
        </div>
      );
    }

    // Booking — render con dots de grupo si aplica
    const booking = arg.event.extendedProps.booking as CalendarBooking;
    const groups = booking?.userGroups ?? [];
    const showDots = groups.length > 1;

    return (
      <div className="px-1 py-0.5 leading-tight overflow-hidden">
        <div className="text-[10px] font-medium opacity-90">{arg.timeText}</div>
        <div className="text-[11px] truncate">{arg.event.title}</div>
        {showDots && (
          <div className="flex gap-0.5 mt-0.5 flex-wrap">
            {groups.slice(0, 5).map((g) => (
              <span
                key={g.id}
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ background: g.color }}
                title={g.nombre}
              />
            ))}
          </div>
        )}
      </div>
    );
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
        eventContent={renderEvent}
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

// ──────────────────────────────────────────────────────────────────────────
// Color helpers
// ──────────────────────────────────────────────────────────────────────────

function hexWithAlpha(hex: string, alpha: number): string {
  const h = String(hex || '#C8FF3D').replace('#', '');
  if (h.length !== 6) return `rgba(200,255,61,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Para un color hex, devuelve una versión clarita usable como text color
 * (ajusta hacia luminosidad alta sobre fondo oscuro).
 */
function lightenForText(hex: string): string {
  const h = String(hex || '#C8FF3D').replace('#', '');
  if (h.length !== 6) return '#D8FF6E';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // mezcla hacia blanco
  const mix = (c: number) => Math.round(c + (255 - c) * 0.35);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

export type { CalendarApi };
