import { useState } from 'react';
import { Modal } from './Modal';
import { Btn } from './Btn';
import { Icon } from './Icon';
import { Field } from './Field';
import { useApiMutation } from '../lib/useApiQuery';

interface Props {
  bookingId: string | null;
  onClose: () => void;
  onRegistered: () => void;
}

export function RegisterAttendanceModal({ bookingId, onClose, onRegistered }: Props) {
  const [presente, setPresente] = useState<boolean | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [peso, setPeso] = useState('');
  const [frecCardMax, setFrecCardMax] = useState('');
  const [frecCardProm, setFrecCardProm] = useState('');
  const [dolor, setDolor] = useState('');
  const [energia, setEnergia] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const register = useApiMutation<{ presente: boolean; estado: string }>('registerAttendance');

  function reset() {
    setPresente(null);
    setShowAdvanced(false);
    setPeso('');
    setFrecCardMax('');
    setFrecCardProm('');
    setDolor('');
    setEnergia('');
    setObservaciones('');
    register.reset();
  }

  function close() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!bookingId || presente === null) return;
    try {
      await register.mutate({
        bookingId,
        presente,
        peso: peso ? Number(peso) : undefined,
        frecCardMax: frecCardMax ? Number(frecCardMax) : undefined,
        frecCardProm: frecCardProm ? Number(frecCardProm) : undefined,
        dolor: dolor ? Number(dolor) : undefined,
        energia: energia ? Number(energia) : undefined,
        observaciones: observaciones || undefined,
      });
      reset();
      onRegistered();
    } catch {
      /* error queda en register.error */
    }
  }

  if (!bookingId) return null;

  return (
    <Modal open onClose={close} title="Registrar asistencia" size="lg">
      <div className="px-5 py-5 space-y-5">

        {/* Presente / Ausente */}
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2">
            ¿Asistió a la sesión?
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPresente(true)}
              aria-pressed={presente === true}
              className={[
                'p-4 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all',
                presente === true
                  ? 'bg-ok/10 border-ok text-ok-fg'
                  : 'bg-surface-2 border-line-2 text-fg-2 hover:border-line-2',
              ].join(' ')}
            >
              <Icon name="check" size={22} strokeWidth={2.5} />
              <span className="font-medium text-sm">Sí, asistió</span>
            </button>
            <button
              type="button"
              onClick={() => setPresente(false)}
              aria-pressed={presente === false}
              className={[
                'p-4 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all',
                presente === false
                  ? 'bg-err/10 border-err text-err-fg'
                  : 'bg-surface-2 border-line-2 text-fg-2 hover:border-line-2',
              ].join(' ')}
            >
              <Icon name="x" size={22} strokeWidth={2.5} />
              <span className="font-medium text-sm">No asistió</span>
            </button>
          </div>
        </div>

        {/* Solo mostrar indicadores si presente */}
        {presente === true && (
          <>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[12px] text-fg-2 hover:text-fg flex items-center gap-1 underline-offset-2 hover:underline"
            >
              {showAdvanced ? '− Ocultar' : '+ Agregar'} indicadores opcionales
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Field
                  label="Peso (kg)"
                  type="number"
                  step="0.1"
                  placeholder="72.5"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                />
                <Field
                  label="FC máx (bpm)"
                  type="number"
                  placeholder="170"
                  value={frecCardMax}
                  onChange={(e) => setFrecCardMax(e.target.value)}
                />
                <Field
                  label="FC promedio"
                  type="number"
                  placeholder="140"
                  value={frecCardProm}
                  onChange={(e) => setFrecCardProm(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3 col-span-1">
                  <Field
                    label="Dolor (1-10)"
                    type="number"
                    min={1}
                    max={10}
                    value={dolor}
                    onChange={(e) => setDolor(e.target.value)}
                  />
                  <Field
                    label="Energía (1-10)"
                    type="number"
                    min={1}
                    max={10}
                    value={energia}
                    onChange={(e) => setEnergia(e.target.value)}
                  />
                </div>
              </div>
            )}
          </>
        )}

        <div>
          <label
            htmlFor="obs"
            className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-2"
          >
            Observaciones (opcional)
          </label>
          <textarea
            id="obs"
            rows={2}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            maxLength={500}
            placeholder={presente === false ? 'Motivo de inasistencia...' : 'Cómo fue la sesión...'}
            className="w-full px-3.5 py-3 rounded-xl bg-surface-2 border border-line-2 text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent/60 resize-y"
          />
        </div>

        {register.error && (
          <div role="alert" className="text-err-fg text-[13px]">
            {register.error.message}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Btn variant="secondary" full onClick={close} disabled={register.loading}>
            Cancelar
          </Btn>
          <Btn
            full
            onClick={handleSubmit}
            disabled={presente === null || register.loading}
          >
            {register.loading ? 'Guardando...' : 'Registrar'}
          </Btn>
        </div>

        {presente === true && (
          <p className="text-[11px] text-fg-3 text-center">
            Esto consume una sesión del plan del cliente.
          </p>
        )}
      </div>
    </Modal>
  );
}
