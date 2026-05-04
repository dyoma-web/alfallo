import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/layouts/AppShell';
import { Card } from '../components/Card';
import { Btn } from '../components/Btn';
import { Field as Input } from '../components/Field';
import { Icon } from '../components/Icon';
import { useApiQuery, useApiMutation } from '../lib/useApiQuery';
import { useToast } from '../components/Toast';
import { useConfirmDialog } from '../components/ConfirmDialog';
import { useSession, type SessionUser } from '../lib/store/session';
import { config } from '../lib/config';

interface ProfileForm {
  nombres: string;
  apellidos: string;
  nick: string;
  celular: string;
}

const PRIVACY_LABELS: Record<string, string> = {
  solo_yo: 'Solo yo',
  mi_entrenador: 'Mi entrenador',
  mi_grupo: 'Mi grupo',
  publico: 'Público en la plataforma',
};

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  trainer: 'Entrenador',
  client: 'Cliente',
};

export default function Profile() {
  const updateUserStore = useSession((s) => s.updateUser);
  const { data: profile, loading, error, refetch } = useApiQuery<SessionUser>('getProfile');
  const update = useApiMutation<SessionUser>('updateProfile');

  const [savedAt, setSavedAt] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    defaultValues: { nombres: '', apellidos: '', nick: '', celular: '' },
  });

  useEffect(() => {
    if (profile) {
      reset({
        nombres: profile.nombres ?? '',
        apellidos: profile.apellidos ?? '',
        nick: profile.nick ?? '',
        celular: '',
      });
    }
  }, [profile, reset]);

  async function onSubmit(values: ProfileForm) {
    try {
      const updated = await update.mutate({
        nombres: values.nombres,
        apellidos: values.apellidos,
        nick: values.nick,
        celular: values.celular,
      });
      updateUserStore(updated);
      setSavedAt(Date.now());
      void refetch();
    } catch {
      /* error capturado por el hook */
    }
  }

  return (
    <AppShell>
      <div className="px-5 py-6 md:px-10 md:py-10 max-w-2xl mx-auto">
        <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.02em] mb-6">
          Perfil
        </h1>

        {loading && (
          <div className="bg-surface border border-line rounded-2xl h-64 animate-pulse" />
        )}

        {error && !loading && (
          <Card padding={20} className="border-err/25 bg-err/5">
            <p className="text-err-fg">{error.message}</p>
          </Card>
        )}

        {profile && (
          <>
            <Card padding={24}>
              <div className="flex items-center gap-4 mb-6">
                <Avatar nombres={profile.nombres} apellidos={profile.apellidos} />
                <div>
                  <div className="font-display text-lg font-semibold">
                    {profile.nombres} {profile.apellidos}
                  </div>
                  <div className="text-fg-2 text-sm">{profile.email}</div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-fg-3 mt-1">
                    {ROLE_LABEL[profile.rol] ?? profile.rol}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nombres"
                    placeholder="Tu nombre"
                    error={errors.nombres?.message}
                    {...register('nombres', { required: 'Tus nombres son requeridos' })}
                  />
                  <Input
                    label="Apellidos"
                    placeholder="Tus apellidos"
                    error={errors.apellidos?.message}
                    {...register('apellidos', { required: 'Tus apellidos son requeridos' })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nick"
                    placeholder="Cómo te llaman"
                    hint="Visible para otros usuarios."
                    error={errors.nick?.message}
                    {...register('nick', { required: 'Tu nick es requerido' })}
                  />
                  <Input
                    label="Celular"
                    type="tel"
                    placeholder="3001234567"
                    hint="Privado. Solo lo ve el equipo."
                    error={errors.celular?.message}
                    {...register('celular')}
                  />
                </div>

                {update.error && (
                  <div role="alert" className="text-err-fg text-sm">
                    {update.error.message}
                  </div>
                )}

                {savedAt && Date.now() - savedAt < 4000 && (
                  <div className="text-ok-fg text-sm flex items-center gap-1.5">
                    <Icon name="check" size={14} strokeWidth={2.5} />
                    Cambios guardados.
                  </div>
                )}

                <Btn
                  type="submit"
                  size="md"
                  disabled={!isDirty || update.loading}
                >
                  {update.loading ? 'Guardando...' : 'Guardar cambios'}
                </Btn>
              </form>
            </Card>

            {(profile.rol === 'trainer' || profile.rol === 'admin' || profile.rol === 'super_admin') && (
              <TrainerMetasSection />
            )}

            <Card padding={20} className="mt-4">
              <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-3">
                Privacidad
              </div>
              <Row label="Privacidad de fotos">
                {PRIVACY_LABELS[profile.privacidad_fotos ?? 'solo_yo'] ?? 'Solo yo'}
              </Row>
              <Row label="Cédula">No visible para otros usuarios</Row>
              <Row label="Datos de salud">Solo tú y tu entrenador</Row>

              <p className="text-[12px] text-fg-3 mt-3">
                Edición avanzada de privacidad en próxima iteración.
              </p>
            </Card>

            <Card padding={20} className="mt-4">
              <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-3">
                Cuenta
              </div>
              <Link
                to="/logout"
                className="text-err-fg hover:text-err underline-offset-2 hover:underline text-sm flex items-center gap-2"
              >
                <Icon name="x" size={14} strokeWidth={2.5} />
                Cerrar sesión
              </Link>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-line last:border-0">
      <span className="text-fg-3 text-sm">{label}</span>
      <span className="text-fg-2 text-sm text-right">{children}</span>
    </div>
  );
}

type MetaTipo = 'economica' | 'usuarios' | 'otra';

interface MetaItem {
  id: string;
  profesionalId: string;
  periodo: string;
  nombre: string;
  tipo: MetaTipo;
  valor: number;
  createdAt: string;
  updatedAt: string;
}

interface MetasResponse {
  period: string;
  items: MetaItem[];
}

const TIPO_LABEL: Record<MetaTipo, string> = {
  economica: 'Económica',
  usuarios: 'Usuarios',
  otra: 'Otra',
};

function currentPeriod(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

function formatPeriodSpanish(period: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (!m) return period;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, 1);
  try {
    return new Intl.DateTimeFormat(config.locale, {
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return period;
  }
}

function TrainerMetasSection() {
  const toast = useToast();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const period = currentPeriod();
  const { data, loading, error, refetch } = useApiQuery<MetasResponse>(
    'listMyMetas',
    { period }
  );
  const create = useApiMutation('createMyMeta');
  const update = useApiMutation('updateMyMeta');
  const remove = useApiMutation('deleteMyMeta');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // DEBUG — log estado de la query a consola
  useEffect(() => {
    console.log('[DEBUG TrainerMetasSection] period=', period, 'loading=', loading, 'error=', error, 'data=', data); // DEBUG
  }, [period, loading, error, data]);

  async function handleDelete(id: string, nombre: string) {
    const ok = await confirm({
      title: 'Eliminar meta',
      message: `Se eliminará la meta "${nombre}". Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      console.log('[DEBUG deleteMyMeta] enviando id=', id); // DEBUG
      const res = await remove.mutate({ id });
      console.log('[DEBUG deleteMyMeta] respuesta=', res); // DEBUG
      toast({ title: 'Meta eliminada', tone: 'success' });
      void refetch();
    } catch (e) {
      console.error('[DEBUG deleteMyMeta] error=', e); // DEBUG
      toast({
        title: 'No se pudo eliminar',
        message: e instanceof Error ? e.message : undefined,
        tone: 'error',
      });
    }
  }

  return (
    <Card padding={20} className="mt-4">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3">
            Metas — {formatPeriodSpanish(period)}
          </div>
          <p className="text-fg-3 text-[11px] mt-0.5">
            El tier se calcula sumando todas las metas de tipo Económica.
          </p>
        </div>
        <Icon name="trophy" size={14} color="#A8B0A4" />
      </div>

      {loading && <div className="text-fg-3 text-[12px]">Cargando...</div>}

      {error && !loading && (
        <div className="bg-err/10 border border-err/30 rounded-lg p-3 mb-3">
          <p className="text-err-fg text-[12px] font-mono">
            <strong>Error al cargar metas:</strong> {error.message}
          </p>
          <p className="text-err-fg text-[11px] mt-1">
            Código: {error.code ?? '(sin código)'}. Revisa la consola del navegador y los logs de Apps Script.
          </p>
        </div>
      )}

      {data && data.items.length === 0 && !showAdd && (
        <p className="text-fg-3 text-[12px] mb-3">
          Aún no tienes metas para este mes.
        </p>
      )}

      {data && data.items.length > 0 && (
        <ul className="space-y-2 mb-3">
          {data.items.map((m) =>
            editingId === m.id ? (
              <MetaEditRow
                key={m.id}
                meta={m}
                busy={update.loading}
                onCancel={() => setEditingId(null)}
                onSave={async (patch) => {
                  try {
                    await update.mutate({ id: m.id, ...patch });
                    toast({ title: 'Meta actualizada', tone: 'success' });
                    setEditingId(null);
                    void refetch();
                  } catch (e) {
                    toast({
                      title: 'No se pudo guardar',
                      message: e instanceof Error ? e.message : undefined,
                      tone: 'error',
                    });
                  }
                }}
              />
            ) : (
              <MetaDisplayRow
                key={m.id}
                meta={m}
                busy={remove.loading}
                onEdit={() => setEditingId(m.id)}
                onDelete={() => handleDelete(m.id, m.nombre)}
              />
            )
          )}
        </ul>
      )}

      {showAdd ? (
        <MetaAddForm
          busy={create.loading}
          onCancel={() => setShowAdd(false)}
          onSave={async (values) => {
            try {
              console.log('[DEBUG createMyMeta] enviando=', { ...values, period }); // DEBUG
              const res = await create.mutate({ ...values, period });
              console.log('[DEBUG createMyMeta] respuesta=', res); // DEBUG
              toast({ title: 'Meta creada', tone: 'success' });
              setShowAdd(false);
              void refetch();
            } catch (e) {
              console.error('[DEBUG createMyMeta] error=', e); // DEBUG
              toast({
                title: 'No se pudo crear',
                message: e instanceof Error ? e.message : undefined,
                tone: 'error',
              });
            }
          }}
        />
      ) : (
        <Btn
          variant="secondary"
          size="sm"
          icon="plus"
          onClick={() => setShowAdd(true)}
        >
          Agregar meta
        </Btn>
      )}
      {confirmDialog}
    </Card>
  );
}

function MetaDisplayRow({
  meta,
  busy,
  onEdit,
  onDelete,
}: {
  meta: MetaItem;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-center gap-3 bg-surface-2 border border-line rounded-xl p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{meta.nombre}</span>
          <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface border border-line text-fg-3">
            {TIPO_LABEL[meta.tipo]}
          </span>
        </div>
        <div className="text-fg-2 text-[12px] mt-0.5">
          {meta.tipo === 'economica'
            ? formatMetaMoney(meta.valor)
            : meta.valor.toLocaleString(config.locale)}
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        disabled={busy}
        className="text-[12px] text-fg-2 hover:text-fg disabled:opacity-50"
      >
        Editar
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={busy}
        className="text-[12px] text-fg-3 hover:text-err-fg disabled:opacity-50"
      >
        Eliminar
      </button>
    </li>
  );
}

function MetaEditRow({
  meta,
  busy,
  onCancel,
  onSave,
}: {
  meta: MetaItem;
  busy: boolean;
  onCancel: () => void;
  onSave: (patch: { nombre: string; valor: number }) => Promise<void>;
}) {
  const [nombre, setNombre] = useState(meta.nombre);
  const [valor, setValor] = useState(String(meta.valor));

  const dirty = nombre.trim() !== meta.nombre || Number(valor) !== meta.valor;

  return (
    <li className="bg-surface-2 border border-accent/30 rounded-xl p-3 space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Input
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <Input
          label="Valor"
          type="number"
          min={0}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Btn variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
          Cancelar
        </Btn>
        <Btn
          size="sm"
          disabled={busy || !dirty || nombre.trim().length < 2}
          onClick={() =>
            void onSave({ nombre: nombre.trim(), valor: Number(valor) || 0 })
          }
        >
          {busy ? 'Guardando...' : 'Guardar'}
        </Btn>
      </div>
    </li>
  );
}

function MetaAddForm({
  busy,
  onCancel,
  onSave,
}: {
  busy: boolean;
  onCancel: () => void;
  onSave: (values: { nombre: string; tipo: MetaTipo; valor: number }) => Promise<void>;
}) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<MetaTipo>('economica');
  const [valor, setValor] = useState('');

  const valid = nombre.trim().length >= 2 && Number(valor) >= 0;

  return (
    <div className="bg-surface-2 border border-line rounded-xl p-3 space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Input
          label="Nombre"
          placeholder="Ej. Meta personalizado"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-[0.14em] text-fg-3 mb-1.5">
            Tipo
          </label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as MetaTipo)}
            className="w-full h-10 px-3 rounded-lg bg-surface border border-line-2 text-fg text-sm focus:outline-none focus:border-accent/60"
          >
            <option value="economica">Económica</option>
            <option value="usuarios">Usuarios</option>
            <option value="otra">Otra</option>
          </select>
        </div>
        <Input
          label="Valor"
          type="number"
          min={0}
          placeholder={tipo === 'economica' ? '5000000' : '20'}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Btn variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
          Cancelar
        </Btn>
        <Btn
          size="sm"
          disabled={busy || !valid}
          onClick={() =>
            void onSave({
              nombre: nombre.trim(),
              tipo,
              valor: Number(valor) || 0,
            })
          }
        >
          {busy ? 'Guardando...' : 'Crear meta'}
        </Btn>
      </div>
    </div>
  );
}

function formatMetaMoney(amount: number): string {
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${config.currency}`;
  }
}

function Avatar({ nombres, apellidos }: { nombres: string; apellidos: string }) {
  const initials =
    (nombres?.charAt(0) ?? '').toUpperCase() +
    (apellidos?.charAt(0) ?? '').toUpperCase();
  return (
    <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center flex-none">
      <span
        className="font-display text-lg font-bold tracking-[-0.02em]"
        style={{ color: '#0B1208' }}
      >
        {initials || '·'}
      </span>
    </div>
  );
}
