import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../Modal';
import { Btn } from '../Btn';
import { Icon } from '../Icon';
import { useApiQuery, useApiMutation } from '../../lib/useApiQuery';
import { useToast } from '../Toast';

const AREA_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'entrenamiento', label: 'Área de entrenamiento' },
  { value: 'medica', label: 'Área médica' },
  { value: 'otra', label: 'Otra área' },
];

const CATEGORIA_OPTIONS: Array<{ value: string; label: string; area: string }> = [
  { value: 'entrenador_personalizado', label: 'Entrenador personalizado', area: 'entrenamiento' },
  { value: 'profesor_grupal', label: 'Profesor grupal', area: 'entrenamiento' },
  { value: 'nutricionista', label: 'Nutricionista', area: 'medica' },
  { value: 'fisio', label: 'Fisioterapeuta', area: 'medica' },
  { value: 'evaluador', label: 'Evaluador médico', area: 'medica' },
  { value: 'otro', label: 'Otro', area: 'otra' },
];

interface TrainerOption {
  id: string;
  nombres: string;
  apellidos: string;
  nick?: string;
  email?: string;
}

interface ProfesionalRef {
  id: string;
  nombres: string;
  apellidos: string;
  nick?: string;
  foto_url?: string;
  estado?: string;
  categoriaProfesional?: string;
  tipoProfesional?: string;
}

interface ProfesionalAssignment {
  id: string;
  profesionalId: string;
  areaProfesional: string;
  categoriaProfesional: string;
  tipoRelacion: string;
  principal: boolean;
  profesional: ProfesionalRef | null;
}

interface ProfesionalesResponse {
  userId: string;
  assignments: ProfesionalAssignment[];
}

interface DraftAssignment {
  profesionalId: string;
  areaProfesional: string;
  categoriaProfesional: string;
  tipoRelacion: string;
  principal: boolean;
}

interface Props {
  user: { id: string; nombres: string; apellidos: string } | null;
  onClose: () => void;
  onSaved: () => void;
}

export function UserProfesionalesModal({ user, onClose, onSaved }: Props) {
  const toast = useToast();
  const setProfesionales = useApiMutation<ProfesionalesResponse>('adminSetUserProfesionales');

  const { data: trainers, loading: loadingTrainers, error: trainersError } =
    useApiQuery<TrainerOption[]>('adminListTrainers', {}, { enabled: !!user });

  const { data: assignments, loading: loadingAssignments, error: assignmentsError } =
    useApiQuery<ProfesionalesResponse>(
      'adminGetUserProfesionales',
      { userId: user?.id ?? '' },
      { enabled: !!user, deps: [user?.id] }
    );

  const [drafts, setDrafts] = useState<DraftAssignment[]>([]);

  useEffect(() => {
    if (!user || !assignments) return;
    setDrafts(
      assignments.assignments.map((a) => ({
        profesionalId: a.profesionalId,
        areaProfesional: a.areaProfesional || 'entrenamiento',
        categoriaProfesional: a.categoriaProfesional || 'otro',
        tipoRelacion: a.tipoRelacion || '',
        principal: a.principal,
      }))
    );
  }, [assignments, user]);

  const trainersById = useMemo(() => {
    const map = new Map<string, TrainerOption>();
    for (const t of trainers ?? []) map.set(t.id, t);
    return map;
  }, [trainers]);

  const availableTrainers = useMemo(() => {
    const used = new Set(drafts.map((d) => d.profesionalId));
    return (trainers ?? []).filter((t) => !used.has(t.id));
  }, [trainers, drafts]);

  if (!user) return null;

  const busy = loadingTrainers || loadingAssignments || setProfesionales.loading;
  const error = trainersError ?? assignmentsError ?? setProfesionales.error;

  function addProfesional(trainerId: string) {
    setDrafts((current) => {
      if (current.some((d) => d.profesionalId === trainerId)) return current;
      const isFirst = current.length === 0;
      return [
        ...current,
        {
          profesionalId: trainerId,
          areaProfesional: 'entrenamiento',
          categoriaProfesional: 'entrenador_personalizado',
          tipoRelacion: '',
          principal: isFirst,
        },
      ];
    });
  }

  function removeProfesional(trainerId: string) {
    setDrafts((current) => {
      const next = current.filter((d) => d.profesionalId !== trainerId);
      const removedWasPrincipal = current.find((d) => d.profesionalId === trainerId)?.principal;
      if (removedWasPrincipal && next.length > 0) {
        next[0] = { ...next[0], principal: true };
      }
      return next;
    });
  }

  function updateDraft(profesionalId: string, patch: Partial<DraftAssignment>) {
    setDrafts((current) =>
      current.map((d) => (d.profesionalId === profesionalId ? { ...d, ...patch } : d))
    );
  }

  function setAsPrincipal(profesionalId: string) {
    setDrafts((current) =>
      current.map((d) => ({ ...d, principal: d.profesionalId === profesionalId }))
    );
  }

  async function handleSave() {
    try {
      await setProfesionales.mutate({
        userId: user!.id,
        assignments: drafts.map((d) => ({
          profesionalId: d.profesionalId,
          areaProfesional: d.areaProfesional,
          categoriaProfesional: d.categoriaProfesional,
          tipoRelacion: d.tipoRelacion,
          principal: d.principal,
        })),
      });
      toast({ title: 'Profesionales actualizados', tone: 'success' });
      onSaved();
    } catch (e) {
      toast({
        title: 'No se pudieron guardar los profesionales',
        message: e instanceof Error ? e.message : undefined,
        tone: 'error',
      });
    }
  }

  return (
    <Modal open onClose={onClose} title="Profesionales del cliente" size="lg">
      <div className="px-5 py-5 space-y-4">
        <div className="text-[12px] text-fg-3">
          {`${user.nombres} ${user.apellidos}`.trim()}
        </div>

        {busy && drafts.length === 0 && (
          <div className="h-32 rounded-xl border border-line bg-surface-2 animate-pulse" />
        )}

        {error && (
          <div role="alert" className="text-err-fg text-[13px]">
            {error.message}
          </div>
        )}

        {drafts.length === 0 && !busy && (
          <p className="text-fg-3 text-[13px]">
            Sin profesionales asignados. Agrega entrenadores, nutricionistas, fisios u otros desde el selector.
          </p>
        )}

        {drafts.length > 0 && (
          <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
            {drafts.map((d) => {
              const trainer = trainersById.get(d.profesionalId);
              const name = trainer
                ? `${trainer.nombres} ${trainer.apellidos}`.trim()
                : d.profesionalId.slice(0, 8);
              return (
                <div
                  key={d.profesionalId}
                  className="rounded-xl border border-line bg-surface-2 p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{name}</div>
                      {trainer?.email && (
                        <div className="text-[11px] text-fg-3 truncate">{trainer.email}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProfesional(d.profesionalId)}
                      className="flex-none text-[12px] text-err-fg hover:underline"
                    >
                      Quitar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <select
                      value={d.areaProfesional}
                      onChange={(e) =>
                        updateDraft(d.profesionalId, {
                          areaProfesional: e.target.value,
                          categoriaProfesional:
                            CATEGORIA_OPTIONS.find((c) => c.area === e.target.value)?.value
                            ?? 'otro',
                        })
                      }
                      className="h-9 px-2 rounded-lg bg-surface border border-line-2 text-fg text-[12px] focus:outline-none focus:border-accent/60"
                    >
                      {AREA_OPTIONS.map((a) => (
                        <option key={a.value} value={a.value}>{a.label}</option>
                      ))}
                    </select>
                    <select
                      value={d.categoriaProfesional}
                      onChange={(e) =>
                        updateDraft(d.profesionalId, { categoriaProfesional: e.target.value })
                      }
                      className="h-9 px-2 rounded-lg bg-surface border border-line-2 text-fg text-[12px] focus:outline-none focus:border-accent/60"
                    >
                      {CATEGORIA_OPTIONS
                        .filter((c) => c.area === d.areaProfesional)
                        .map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                  </div>

                  <input
                    type="text"
                    placeholder="Tipo de relación (titular, apoyo, eventual...)"
                    value={d.tipoRelacion}
                    onChange={(e) =>
                      updateDraft(d.profesionalId, { tipoRelacion: e.target.value })
                    }
                    maxLength={60}
                    className="w-full h-9 px-2 rounded-lg bg-surface border border-line-2 text-fg text-[12px] focus:outline-none focus:border-accent/60"
                  />

                  <label className="flex items-center gap-1.5 text-[12px] text-fg-2 cursor-pointer">
                    <input
                      type="radio"
                      name="principalProfesional"
                      checked={d.principal}
                      onChange={() => setAsPrincipal(d.profesionalId)}
                      className="w-4 h-4 accent-accent"
                    />
                    Principal
                  </label>
                </div>
              );
            })}
          </div>
        )}

        <AddProfesionalSelector
          available={availableTrainers}
          disabled={busy}
          onAdd={addProfesional}
        />

        <div className="flex items-center justify-between gap-3 flex-wrap border-t border-line pt-4">
          <div className="text-[12px] text-fg-3">
            {drafts.length === 0
              ? 'Sin profesionales asignados'
              : `${drafts.length} profesional${drafts.length === 1 ? '' : 'es'}`}
          </div>
          <div className="flex gap-2">
            <Btn variant="secondary" onClick={onClose} disabled={setProfesionales.loading}>
              Cancelar
            </Btn>
            <Btn onClick={handleSave} disabled={setProfesionales.loading || loadingAssignments}>
              {setProfesionales.loading ? 'Guardando...' : 'Guardar profesionales'}
            </Btn>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function AddProfesionalSelector({
  available,
  disabled,
  onAdd,
}: {
  available: TrainerOption[];
  disabled: boolean;
  onAdd: (id: string) => void;
}) {
  const [pendingId, setPendingId] = useState('');

  if (available.length === 0) {
    return (
      <p className="text-[12px] text-fg-3 border-t border-line pt-3">
        Todos los profesionales activos ya están asignados.
      </p>
    );
  }

  return (
    <div className="border-t border-line pt-3 flex items-center gap-2 flex-wrap">
      <Icon name="plus" size={14} color="#6B746A" />
      <select
        value={pendingId}
        onChange={(e) => setPendingId(e.target.value)}
        disabled={disabled}
        className="flex-1 min-w-[180px] h-9 px-2 rounded-lg bg-surface-2 border border-line-2 text-fg text-[12px] focus:outline-none focus:border-accent/60"
      >
        <option value="">Selecciona un profesional...</option>
        {available.map((t) => (
          <option key={t.id} value={t.id}>
            {`${t.nombres} ${t.apellidos}`.trim()}
          </option>
        ))}
      </select>
      <Btn
        variant="outline"
        size="sm"
        disabled={!pendingId || disabled}
        onClick={() => {
          if (pendingId) {
            onAdd(pendingId);
            setPendingId('');
          }
        }}
      >
        Agregar
      </Btn>
    </div>
  );
}
