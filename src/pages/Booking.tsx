import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';

import { AppShell } from '../components/layouts/AppShell';
import { Card } from '../components/Card';
import { Btn } from '../components/Btn';
import { Field } from '../components/Field';
import { Icon } from '../components/Icon';
import { useApiQuery, useApiMutation } from '../lib/useApiQuery';
import { api, ApiError } from '../lib/api';
import { useSession } from '../lib/store/session';
import { bookingFormSchema, type BookingFormInput } from '../lib/schemas/booking';

interface Trainer {
  id: string;
  nombres: string;
  apellidos: string;
  nick?: string;
  perfilProfesional?: string;
  habilidades?: string[];
  tiposEntrenamiento?: string[];
}
interface Sede {
  id: string;
  nombre: string;
  ciudad: string;
  direccion?: string;
  category?: string;
  categoryRank?: number;
  isBase?: boolean;
}
interface PlanInfo {
  id: string;
  nombre: string;
  sesionesRestantes: number;
  fechaVencimientoUtc: string;
}
interface BookingOptions {
  trainers: Trainer[];
  sedes: Sede[];
  planActivo: PlanInfo | null;
}

interface BusySlot {
  fechaInicioUtc: string;
  duracionMin: number;
}
interface BusySlotsResp {
  busy: BusySlot[];
}

interface SlotCapacity {
  cap: number;
  tomados: number;
  disponibles: number;
  estricto: boolean;
  lleno: boolean;
  tipo: string;
  trainerFueraHorario?: boolean;
  sedeBloqueada?: boolean;
}

// Slots cada 30 min entre 06:00 y 21:00
const SLOT_HOURS = Array.from({ length: 31 }, (_, i) => {
  const totalMin = 6 * 60 + i * 30;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}); // 06:00, 06:30, ..., 21:00

const SEDE_CATEGORY_LABELS: Record<string, string> = {
  basica: 'Basica',
  plus: 'Plus',
  premium: 'Premium',
  elite: 'Elite',
};

function sedeCategoryLabel(sede?: Pick<Sede, 'category' | 'categoryRank'> | null): string {
  if (!sede) return '';
  const key = String(sede.category || '');
  if (key && SEDE_CATEGORY_LABELS[key]) return SEDE_CATEGORY_LABELS[key];
  if (sede.categoryRank) return `Nivel ${sede.categoryRank}`;
  return '';
}

export default function Booking() {
  const navigate = useNavigate();
  const token = useSession((s) => s.token);

  const [bookingId, setBookingId] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: options, error: optionsError, loading: optionsLoading } =
    useApiQuery<BookingOptions>('getBookingOptions');

  const submit = useApiMutation<{ booking: { id: string; estado: string } }>('submitBooking');

  // 1. Crear borrador al entrar a la pantalla
  useEffect(() => {
    let cancelled = false;
    async function makeDraft() {
      try {
        const result = await api<{ bookingId: string }>(
          'createDraftBooking',
          {},
          { token, retry: false }
        );
        if (!cancelled) setBookingId(result.bookingId);
      } catch (e) {
        if (!cancelled) {
          setDraftError(
            e instanceof ApiError ? e.message : 'No pudimos preparar el agendamiento.'
          );
        }
      }
    }
    void makeDraft();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const todayISO = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const maxDateISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingFormInput>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      entrenadorId: '',
      fecha: '',
      hora: '',
      sedeId: '',
      duracionMin: 60,
      notas: '',
    },
  });

  // Auto-selecciona el único trainer si solo hay uno
  useEffect(() => {
    if (options?.trainers.length === 1) {
      setValue('entrenadorId', options.trainers[0].id);
    }
  }, [options, setValue]);

  const selectedTrainerId = watch('entrenadorId');
  const selectedDate = watch('fecha');
  const selectedHora = watch('hora');
  const selectedDuracion = watch('duracionMin');
  const selectedSedeId = watch('sedeId');

  const selectedSede = useMemo(
    () => options?.sedes.find((s) => s.id === selectedSedeId) ?? null,
    [options, selectedSedeId]
  );
  const baseSede = useMemo(
    () => options?.sedes.find((s) => s.isBase) ?? null,
    [options]
  );
  const isOutsideBaseSede = !!selectedSede && !!baseSede && selectedSede.id !== baseSede.id;
  const isHigherCategory = !!selectedSede && !!baseSede
    && Number(selectedSede.categoryRank || 0) > Number(baseSede.categoryRank || 0);

  // Cargar slots ocupados cuando cambian trainer o fecha
  const [busySlots, setBusySlots] = useState<BusySlot[]>([]);
  const [busyLoading, setBusyLoading] = useState(false);

  // Cargar capacidad cuando hay slot seleccionado completo
  const [slotCap, setSlotCap] = useState<SlotCapacity | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!selectedTrainerId || !selectedDate || !selectedHora) {
      setSlotCap(null);
      return;
    }
    const fechaInicioUtc = new Date(`${selectedDate}T${selectedHora}:00`).toISOString();
    api<SlotCapacity>(
      'getSlotCapacity',
      {
        trainerId: selectedTrainerId,
        fechaInicioUtc,
        tipo: 'personalizado', // por ahora hardcoded como en submit
        duracionMin: selectedDuracion || 60,
        sedeId: selectedSedeId || undefined,
      },
      { token, retry: false }
    )
      .then((res) => { if (!cancelled) setSlotCap(res); })
      .catch(() => { if (!cancelled) setSlotCap(null); });
    return () => { cancelled = true; };
  }, [selectedTrainerId, selectedDate, selectedHora, selectedDuracion, selectedSedeId, token]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedTrainerId || !selectedDate) {
      setBusySlots([]);
      return;
    }
    setBusyLoading(true);
    const fromUtc = new Date(`${selectedDate}T00:00:00`).toISOString();
    const toUtc = new Date(`${selectedDate}T23:59:59`).toISOString();
    api<BusySlotsResp>(
      'getTrainerBusySlots',
      { trainerId: selectedTrainerId, fromUtc, toUtc },
      { token, retry: false }
    )
      .then((res) => { if (!cancelled) setBusySlots(res.busy); })
      .catch(() => { if (!cancelled) setBusySlots([]); })
      .finally(() => { if (!cancelled) setBusyLoading(false); });
    return () => { cancelled = true; };
  }, [selectedTrainerId, selectedDate, token]);

  const busyHours = useMemo(() => {
    return new Set(
      busySlots.map((b) => {
        const d = new Date(b.fechaInicioUtc);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      })
    );
  }, [busySlots]);

  async function onSubmit(values: BookingFormInput) {
    setSubmitError(null);
    if (!bookingId) {
      setSubmitError('Borrador no inicializado. Recarga la página.');
      return;
    }
    // Combinar fecha + hora en ISO UTC (interpretando hora local del navegador)
    const fechaInicioUtc = new Date(`${values.fecha}T${values.hora}:00`).toISOString();

    try {
      await submit.mutate({
        bookingId,
        entrenadorId: values.entrenadorId,
        fechaInicioUtc,
        duracionMin: values.duracionMin,
        sedeId: values.sedeId || undefined,
        planUsuarioId: options?.planActivo?.id,
        tipo: 'personalizado',
        notas: values.notas || undefined,
      });
      navigate('/calendario?booked=1', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'SLOT_TAKEN') {
          setSubmitError('Ese horario acaba de ser tomado. Elige otro.');
        } else if (err.code === 'PLAN_INVALID') {
          setSubmitError('El plan asignado no es válido. Contacta al equipo.');
        } else if (err.code === 'TRAINER_NOT_AVAILABLE') {
          setSubmitError('El entrenador no está disponible.');
        } else if (err.code === 'TRAINER_OUTSIDE_WORK_HOURS') {
          setSubmitError('Ese horario está fuera de la franja de atención del profesional.');
        } else if (err.code === 'SEDE_BLOCKED') {
          setSubmitError('La sede está bloqueada en ese horario. Elige otra sede u otra franja.');
        } else {
          setSubmitError(err.message);
        }
      } else {
        setSubmitError('Algo salió mal. Vuelve a intentar.');
      }
    }
  }

  if (optionsError) {
    return (
      <AppShell>
        <div className="px-5 py-6 md:px-10 md:py-10 max-w-2xl mx-auto">
          <Card padding={20} className="border-err/25 bg-err/5">
            <p className="text-err-fg">{optionsError.message}</p>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (draftError) {
    return (
      <AppShell>
        <div className="px-5 py-6 md:px-10 md:py-10 max-w-2xl mx-auto">
          <Card padding={20} className="border-err/25 bg-err/5">
            <p className="text-err-fg">{draftError}</p>
          </Card>
        </div>
      </AppShell>
    );
  }

  const noTrainers = !!options && options.trainers.length === 0;
  const noPlan = !!options && !options.planActivo;

  return (
    <AppShell>
      <div className="px-5 py-6 md:px-10 md:py-10 max-w-2xl mx-auto">
        <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.02em] mb-2">
          Agendar entrenamiento
        </h1>
        <p className="text-fg-2 mb-6">
          Tu solicitud queda en estado <strong>solicitado</strong> hasta que tu entrenador la confirme.
        </p>

        {optionsLoading && (
          <div className="bg-surface border border-line rounded-2xl h-64 animate-pulse" />
        )}

        {options && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Trainer */}
            <Card padding={20}>
              <Eyebrow>Entrenador</Eyebrow>
              {noTrainers ? (
                <div className="mt-3 text-fg-2 text-sm">
                  No tienes un entrenador asignado. Pide al equipo que te asigne uno.
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {options.trainers.map((t) => (
                    <TrainerOption
                      key={t.id}
                      trainer={t}
                      checked={selectedTrainerId === t.id}
                      registerProps={register('entrenadorId')}
                    />
                  ))}
                  {errors.entrenadorId && (
                    <p className="text-err-fg text-[12px] mt-2">{errors.entrenadorId.message}</p>
                  )}
                </div>
              )}
            </Card>

            {/* Sede */}
            {options.sedes.length > 0 && (
              <Card padding={20}>
                <Eyebrow>Sede (opcional)</Eyebrow>
                <select
                  {...register('sedeId')}
                  className="mt-3 w-full h-11 px-3.5 rounded-xl bg-surface-2 border border-line-2 text-fg focus:outline-none focus:border-accent/60 transition-colors"
                >
                  <option value="">Sin sede específica</option>
                  {options.sedes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} · {s.ciudad}{sedeCategoryLabel(s) ? ` · ${sedeCategoryLabel(s)}` : ''}{s.isBase ? ' · Base' : ''}
                    </option>
                  ))}
                </select>
                {baseSede && (
                  <p className="text-[12px] text-fg-3 mt-2">
                    Tu sede base es {baseSede.nombre}
                    {sedeCategoryLabel(baseSede) ? ` (${sedeCategoryLabel(baseSede)})` : ''}.
                  </p>
                )}
              </Card>
            )}

            {/* Fecha y hora */}
            <Card padding={20}>
              <Eyebrow>Fecha y hora</Eyebrow>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field
                  label="Fecha"
                  type="date"
                  min={todayISO}
                  max={maxDateISO}
                  error={errors.fecha?.message}
                  className="[color-scheme:dark]"
                  {...register('fecha')}
                />

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-1.5">
                    Duración
                  </label>
                  <select
                    {...register('duracionMin', { valueAsNumber: true })}
                    className="w-full h-11 px-3.5 rounded-xl bg-surface-2 border border-line-2 text-fg focus:outline-none focus:border-accent/60 transition-colors"
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                  </select>
                </div>
              </div>

              {selectedDate && selectedTrainerId && (
                <div className="mt-4">
                  <label className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
                    Hora disponible
                    {busyLoading && <span className="ml-2 text-fg-3">cargando...</span>}
                  </label>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {SLOT_HOURS.map((slot) => {
                      const busy = busyHours.has(slot);
                      const selected = selectedHora === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => !busy && setValue('hora', slot, { shouldValidate: true })}
                          disabled={busy}
                          aria-pressed={selected}
                          className={[
                            'py-2 rounded-lg text-sm font-medium border transition-colors',
                            busy && 'bg-surface-2 border-line text-fg-3 line-through cursor-not-allowed',
                            !busy && selected && 'bg-accent border-accent text-accent-ink',
                            !busy && !selected && 'bg-surface-2 border-line-2 text-fg hover:border-accent/40 cursor-pointer',
                          ].filter(Boolean).join(' ')}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                  {errors.hora && (
                    <p className="text-err-fg text-[12px] mt-2">{errors.hora.message}</p>
                  )}
                </div>
              )}
            </Card>

            {/* Notas */}
            <Card padding={20}>
              <label htmlFor="notas" className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
                Notas para tu entrenador (opcional)
              </label>
              <textarea
                {...register('notas')}
                id="notas"
                rows={3}
                placeholder="Ej. Cuidado con la rodilla derecha esta semana"
                className="w-full px-3.5 py-3 rounded-xl bg-surface-2 border border-line-2 text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent/60 transition-colors resize-y"
              />
            </Card>

            {/* Aviso plan vencido */}
            {noPlan && (
              <WarningCard>
                No tienes plan activo. Tu solicitud quedará en{' '}
                <strong>requiere autorización</strong> y tu entrenador decide si la acepta.
              </WarningCard>
            )}

            {isOutsideBaseSede && selectedSede && baseSede && (
              <WarningCard>
                Estás eligiendo {selectedSede.nombre}, distinta a tu sede base {baseSede.nombre}.
                Tu entrenador puede revisar esta solicitud antes de confirmarla.
              </WarningCard>
            )}

            {isHigherCategory && selectedSede && baseSede && (
              <WarningCard>
                {selectedSede.nombre} es categoria {sedeCategoryLabel(selectedSede)}, superior a tu base{' '}
                {sedeCategoryLabel(baseSede)}. Si tu plan no cubre ese nivel, puede requerir autorización.
              </WarningCard>
            )}

            {/* Aviso de cupo */}
            {slotCap && slotCap.lleno && (
              <WarningCard>
                {slotCap.estricto ? (
                  <>
                    <strong>Cupo lleno y estricto.</strong> No se pueden agendar más
                    sesiones de tipo "{slotCap.tipo}" en esa franja ({slotCap.tomados}/{slotCap.cap}).
                    Elige otro horario.
                  </>
                ) : (
                  <>
                    <strong>Cupo lleno ({slotCap.tomados}/{slotCap.cap}).</strong>{' '}
                    Puedes solicitar agendar, pero tu entrenador decidirá si confirma o no.
                    Solo confirmadas son en firme.
                  </>
                )}
              </WarningCard>
            )}
            {slotCap && slotCap.sedeBloqueada && (
              <WarningCard>
                La sede seleccionada aparece bloqueada en esa franja. Elige otra sede u otro horario.
              </WarningCard>
            )}
            {slotCap && slotCap.trainerFueraHorario && (
              <WarningCard>
                Ese horario está fuera de la franja de atención del profesional. Elige otra hora disponible.
              </WarningCard>
            )}
            {slotCap && !slotCap.lleno && slotCap.cap > 1 && (
              <p className="text-[12px] text-fg-3">
                Cupo de "{slotCap.tipo}" en esa franja: {slotCap.tomados}/{slotCap.cap} tomados ·{' '}
                {slotCap.disponibles} {slotCap.disponibles === 1 ? 'disponible' : 'disponibles'}.
              </p>
            )}

            {options.planActivo && options.planActivo.sesionesRestantes <= 2 && (
              <WarningCard>
                Solo te quedan <strong>{options.planActivo.sesionesRestantes}</strong> sesion
                {options.planActivo.sesionesRestantes === 1 ? '' : 'es'} en tu plan activo.
              </WarningCard>
            )}

            {submitError && (
              <Card padding={16} className="border-err/25 bg-err/5">
                <div className="flex items-start gap-3 text-[13px]">
                  <Icon name="x" size={16} color="#FF8E8E" strokeWidth={2} className="mt-0.5 flex-none" />
                  <div className="text-err-fg">{submitError}</div>
                </div>
              </Card>
            )}

            <div className="flex gap-3 pt-2">
              <Btn
                type="submit"
                size="lg"
                full
                disabled={submit.loading || !bookingId || noTrainers || !!slotCap?.sedeBloqueada || !!slotCap?.trainerFueraHorario}
              >
                {submit.loading ? 'Agendando...' : 'Agendar'}
              </Btn>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3">
      {children}
    </div>
  );
}

function WarningCard({ children }: { children: React.ReactNode }) {
  return (
    <Card padding={16} className="border-warn/25 bg-warn/5">
      <div className="flex items-start gap-3 text-[13px]">
        <Icon name="bell" size={16} color="#FFC97A" strokeWidth={2} className="mt-0.5 flex-none" />
        <div className="text-fg-2">{children}</div>
      </div>
    </Card>
  );
}

function TrainerOption({
  trainer,
  checked,
  registerProps,
}: {
  trainer: Trainer;
  checked: boolean;
  registerProps: ReturnType<ReturnType<typeof useForm<BookingFormInput>>['register']>;
}) {
  const initials =
    (trainer.nombres?.charAt(0) ?? '').toUpperCase() +
    (trainer.apellidos?.charAt(0) ?? '').toUpperCase();
  const fullName = `${trainer.nombres} ${trainer.apellidos}`.trim();

  return (
    <label
      className={[
        'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
        checked
          ? 'bg-accent/5 border-accent/30'
          : 'bg-surface-2 border-line-2 hover:border-accent/20',
      ].join(' ')}
    >
      <input
        {...registerProps}
        type="radio"
        value={trainer.id}
        className="sr-only"
      />
      <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center flex-none">
        <span className="font-display text-sm font-bold" style={{ color: '#0B1208' }}>
          {initials || '·'}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-medium">{fullName}</div>
        {trainer.perfilProfesional && (
          <p className="text-fg-2 text-[12px] mt-0.5 line-clamp-2">{trainer.perfilProfesional}</p>
        )}
        {trainer.habilidades && trainer.habilidades.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {trainer.habilidades.map((h) => (
              <span
                key={h}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-line text-fg-3"
              >
                {h}
              </span>
            ))}
          </div>
        )}
      </div>
      <div
        className={[
          'w-5 h-5 rounded-full border-2 flex-none transition-colors mt-1',
          checked ? 'bg-accent border-accent' : 'bg-transparent border-line-2',
        ].join(' ')}
        aria-hidden="true"
      >
        {checked && (
          <div className="w-2 h-2 rounded-full bg-accent-ink m-auto translate-y-1" />
        )}
      </div>
    </label>
  );
}
