// screens.jsx — Al Fallo screens
// Mobile: Login, Usuario Dashboard, Agendar (stepper), Calendario,
//         Entrenador Dashboard.
// Desktop: Admin Dashboard.
// All components are rendered inside DCArtboard or device frames.

const sl = window.sectionLabel;

// ──────────────────────────────────────────────────────────
// Mobile shell: phone-shaped scaffold (status bar + nav)
// ──────────────────────────────────────────────────────────
function PhoneShell({ children, time = '6:24', tab = 'home', onTab, hideNav, dark = true }) {
  return (
    <div style={{
      width: 360, height: 760, background: theme.bg, color: theme.fg,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: theme.font, position: 'relative',
    }}>
      <StatusBarMini time={time} dark={dark}/>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>{children}</div>
      {!hideNav && <BottomNav active={tab} onTab={onTab}/>}
    </div>
  );
}

function StatusBarMini({ time = '6:24', dark = true }) {
  const c = dark ? theme.fg : theme.bg;
  return (
    <div style={{ height: 44, padding: '0 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontFamily: theme.display, fontWeight: 600, fontSize: 14, color: c }}>{time}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <svg width="16" height="10" viewBox="0 0 16 10"><path d="M1 9 H2 V7 H1z M4 9 H5 V5 H4z M7 9 H8 V3 H7z M10 9 H11 V1 H10z M13 9 H14 V5 H13z" fill={c}/></svg>
        <svg width="22" height="11" viewBox="0 0 22 11"><rect x="0.5" y="0.5" width="18" height="10" rx="2.5" fill="none" stroke={c} strokeOpacity="0.5"/><rect x="2" y="2" width="14" height="7" rx="1" fill={c}/><rect x="19.5" y="3.5" width="1.5" height="4" rx="0.5" fill={c} fillOpacity="0.5"/></svg>
      </div>
    </div>
  );
}

function BottomNav({ active = 'home', onTab }) {
  const tabs = [
    { id: 'home',  label: 'Inicio',     icon: 'home' },
    { id: 'cal',   label: 'Agenda',     icon: 'cal' },
    { id: 'book',  label: 'Agendar',    icon: 'plus', primary: true },
    { id: 'plan',  label: 'Mi plan',    icon: 'bolt' },
    { id: 'me',    label: 'Perfil',     icon: 'user' },
  ];
  return (
    <div style={{
      height: 78, paddingBottom: 18, paddingTop: 6,
      borderTop: `1px solid ${theme.line}`, background: 'rgba(15,20,16,0.85)',
      backdropFilter: 'blur(12px)',
      display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', alignItems: 'center',
    }}>
      {tabs.map(t => {
        const isActive = active === t.id;
        if (t.primary) {
          return (
            <div key={t.id} onClick={() => onTab && onTab(t.id)} style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 16, background: theme.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 6px 20px rgba(200,255,61,0.35)`,
              }}>
                <Icon name="plus" size={22} color={theme.accentInk} strokeWidth={2.5}/>
              </div>
            </div>
          );
        }
        return (
          <div key={t.id} onClick={() => onTab && onTab(t.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer',
            color: isActive ? theme.fg : theme.fg3,
          }}>
            <Icon name={t.icon} size={22} color="currentColor" strokeWidth={isActive ? 2 : 1.5}/>
            <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.01em' }}>{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// 1. Login
// ──────────────────────────────────────────────────────────
function ScreenLogin() {
  return (
    <PhoneShell hideNav>
      <div style={{
        position: 'absolute', inset: 0, padding: 28, display: 'flex', flexDirection: 'column',
        background: `radial-gradient(120% 60% at 80% 0%, rgba(200,255,61,0.12), transparent 60%), ${theme.bg}`,
      }}>
        <div style={{ marginTop: 8 }}><Logo size={22}/></div>

        <div style={{ marginTop: 64, marginBottom: 36 }}>
          <div style={{ fontFamily: theme.mono, fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', color: theme.accent, textTransform: 'uppercase' }}>Bienvenida de nuevo</div>
          <div style={{ fontFamily: theme.display, fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em', color: theme.fg, lineHeight: 1.05, marginTop: 10 }}>
            Hoy toca<br/>empujar<br/>un poco.
          </div>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <FakeInput label="Correo o nick" value="ana.morales"/>
          <FakeInput label="Contraseña" value="••••••••" />
          <div style={{ textAlign: 'right', marginTop: -2 }}>
            <span style={{ fontSize: 12, color: theme.fg2, fontWeight: 500 }}>¿Olvidaste tu contraseña?</span>
          </div>
        </div>

        <div style={{ marginTop: 'auto', display: 'grid', gap: 10 }}>
          <Btn size="lg" full>Entrar</Btn>
          <Btn size="lg" variant="outline" full>Activar cuenta</Btn>
          <div style={{ textAlign: 'center', fontSize: 11, color: theme.fg3, marginTop: 4, fontFamily: theme.mono, letterSpacing: '0.08em' }}>
            CONSTANCIA HASTA EL PROGRESO
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}

// ──────────────────────────────────────────────────────────
// 2. Usuario · Dashboard
// ──────────────────────────────────────────────────────────
function ScreenUserDashboard({ accent = theme.accent }) {
  return (
    <PhoneShell tab="home">
      <div style={{ height: '100%', overflow: 'auto', padding: '8px 18px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 13, color: theme.fg2 }}>Lun · 4 Mayo</div>
            <div style={{ fontFamily: theme.display, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Hola, Ana</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: theme.surface, border: `1px solid ${theme.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <Icon name="bell" size={18} color={theme.fg2}/>
              <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, background: accent, borderRadius: 99, border: `2px solid ${theme.surface}` }}/>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 99, background: '#3a4538', border: `1px solid ${theme.line2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: theme.display, fontWeight: 600, fontSize: 14 }}>AM</div>
          </div>
        </div>

        {/* Hero next session */}
        <div style={{
          background: `linear-gradient(160deg, ${accent} 0%, oklch(85% 0.18 130) 100%)`,
          color: theme.accentInk, borderRadius: 20, padding: 18, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -30, top: -30, opacity: 0.18 }}>
            <Repmark size={170} color={theme.accentInk} ink="transparent"/>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: theme.mono, fontSize: 10, fontWeight: 600, letterSpacing: '0.14em' }}>PRÓXIMO ENTRENAMIENTO</span>
            <StatusBadge kind="confirmado" style={{ background: 'rgba(11,18,8,0.12)', color: theme.accentInk }}/>
          </div>
          <div style={{ fontFamily: theme.display, fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 6 }}>
            Mañana · 6:30
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, marginTop: 8, opacity: 0.85 }}>Personalizado · Andrea G. · Sede Norte</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <Btn size="sm" style={{ background: theme.accentInk, color: accent }}>Ver detalle</Btn>
            <Btn size="sm" variant="ghost" style={{ color: theme.accentInk }}>Reagendar</Btn>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14 }}>
          <KpiTile label="Plan" value="Activo" sub="vence 22 May" tone="ok"/>
          <KpiTile label="Sesiones" value="6/12" sub="restantes"/>
          <KpiTile label="Racha" value="14" sub="días" icon="flame"/>
        </div>

        {/* Section: Esta semana */}
        <SectionHeader title="Esta semana" trailing="Ver todo"/>
        <div style={{ display: 'grid', gap: 8 }}>
          <SessionCard time="06:30" duration="60 min" trainer="Andrea G." kind="Personalizado" sede="Sede Norte" status="confirmado"/>
          <SessionCard time="06:30" duration="60 min" trainer="Andrea G." kind="Personalizado" sede="Sede Norte" status="pactado"/>
          <SessionCard time="07:00" duration="45 min" trainer="Carlos R." kind="Grupal · Funcional" sede="Sede Norte" status="pendiente"/>
        </div>

        {/* Logros */}
        <SectionHeader title="Logros recientes"/>
        <div style={{ display: 'flex', gap: 8, overflow: 'hidden' }}>
          <AchievementChip icon="flame" title="Racha 14d" sub="2 mayo"/>
          <AchievementChip icon="check" title="Plan completado" sub="abril"/>
          <AchievementChip icon="trophy" title="Puntual" sub="10 sesiones"/>
        </div>
      </div>
    </PhoneShell>
  );
}

function KpiTile({ label, value, sub, tone, icon }) {
  const valColor = tone === 'ok' ? theme.ok : theme.fg;
  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.line}`, borderRadius: 14, padding: 12 }}>
      <div style={{ ...sl, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        {icon && <Icon name={icon} size={14} color={theme.accent} fill={theme.accent}/>}
        <div style={{ fontFamily: theme.display, fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: valColor }}>{value}</div>
      </div>
      <div style={{ fontSize: 11, color: theme.fg3, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function SectionHeader({ title, trailing }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 }}>
      <div style={{ fontFamily: theme.display, fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</div>
      {trailing && <span style={{ fontSize: 12, color: theme.fg2, fontWeight: 500 }}>{trailing}</span>}
    </div>
  );
}

function AchievementChip({ icon, title, sub }) {
  return (
    <div style={{ flex: '0 0 auto', background: theme.surface, border: `1px solid ${theme.line}`, borderRadius: 14, padding: 12, minWidth: 130 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(200,255,61,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <Icon name={icon} size={14} color={theme.accent} fill={theme.accent}/>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 11, color: theme.fg3, marginTop: 2 }}>{sub}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// 3. Usuario · Agendar (stepper)
// ──────────────────────────────────────────────────────────
function ScreenAgendar() {
  return (
    <PhoneShell tab="book" hideNav>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '8px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: theme.surface, border: `1px solid ${theme.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={18} color={theme.fg2}/>
          </div>
          <div style={{ fontFamily: theme.display, fontSize: 16, fontWeight: 600 }}>Agendar</div>
          <div style={{ width: 36 }}/>
        </div>

        {/* Stepper */}
        <div style={{ padding: '20px 18px 8px' }}>
          <Stepper steps={['Tipo', 'Día', 'Hora', 'Confirmar']} active={2}/>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '8px 18px 18px', overflow: 'auto' }}>
          <div style={{ ...sl }}>Mié 6 Mayo · Andrea G.</div>
          <div style={{ fontFamily: theme.display, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 6, marginBottom: 4 }}>
            Elige una hora
          </div>
          <div style={{ fontSize: 13, color: theme.fg2, marginBottom: 18 }}>Disponibilidad real del entrenador. Las sesiones de 60 min.</div>

          {/* Time slots */}
          {[
            { label: 'Mañana', slots: [['05:30', 'ok'], ['06:30', 'sel'], ['07:30', 'ok'], ['08:30', 'full']] },
            { label: 'Tarde',  slots: [['16:00', 'ok'], ['17:00', 'ok'], ['18:00', 'ok'], ['19:00', 'full']] },
          ].map(g => (
            <div key={g.label} style={{ marginBottom: 16 }}>
              <div style={{ ...sl, marginBottom: 8 }}>{g.label}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {g.slots.map(([t, st]) => <Slot key={t} time={t} state={st}/>)}
              </div>
            </div>
          ))}

          {/* Plan warning */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: 12, borderRadius: 12,
            background: 'rgba(255,176,46,0.08)', border: '1px solid rgba(255,176,46,0.22)',
          }}>
            <div style={{ width: 28, height: 28, borderRadius: 99, background: 'rgba(255,176,46,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              <Icon name="bell" size={14} color={theme.warn}/>
            </div>
            <div style={{ fontSize: 12.5, color: '#FFD79A', lineHeight: 1.45 }}>
              Tu plan vence el 22 de mayo. Aún tienes 6 sesiones disponibles.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 18px 24px', borderTop: `1px solid ${theme.line}`,
          background: 'rgba(15,20,16,0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        }}>
          <div>
            <div style={{ fontSize: 11, color: theme.fg3, fontFamily: theme.mono, letterSpacing: '0.1em' }}>SELECCIONADO</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Mié 6 May · 06:30</div>
          </div>
          <Btn size="lg" icon="check">Confirmar</Btn>
        </div>
      </div>
    </PhoneShell>
  );
}

function Stepper({ steps, active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {steps.map((s, i) => {
        const done = i < active, cur = i === active;
        return (
          <React.Fragment key={s}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 99,
                background: done ? theme.accent : cur ? 'transparent' : theme.surface2,
                border: cur ? `1.5px solid ${theme.accent}` : `1px solid ${theme.line2}`,
                color: done ? theme.accentInk : cur ? theme.accent : theme.fg3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, fontFamily: theme.display,
              }}>{done ? '✓' : i + 1}</div>
              <span style={{ fontSize: 11, fontWeight: 600, color: cur ? theme.fg : theme.fg3, display: i === active ? 'inline' : 'none' }}>{s}</span>
            </div>
            {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: i < active ? theme.accent : theme.line2, borderRadius: 99 }}/>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Slot({ time, state }) {
  const styles = {
    ok:   { bg: theme.surface, fg: theme.fg, bd: theme.line },
    sel:  { bg: theme.accent, fg: theme.accentInk, bd: theme.accent },
    full: { bg: 'transparent', fg: theme.fg3, bd: theme.line },
  }[state];
  return (
    <div style={{
      height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: styles.bg, color: styles.fg, border: `1px solid ${styles.bd}`,
      borderRadius: 12, fontFamily: theme.display, fontSize: 14, fontWeight: 600,
      letterSpacing: '-0.01em', position: 'relative',
      textDecoration: state === 'full' ? 'line-through' : 'none', opacity: state === 'full' ? 0.5 : 1,
    }}>{time}</div>
  );
}

// ──────────────────────────────────────────────────────────
// 4. Usuario · Calendario
// ──────────────────────────────────────────────────────────
function ScreenCalendar() {
  return (
    <PhoneShell tab="cal">
      <div style={{ height: '100%', overflow: 'auto', padding: '8px 18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ ...sl }}>MAYO 2026</div>
            <div style={{ fontFamily: theme.display, fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4 }}>Mi calendario</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Pill active>Semana</Pill>
            <Pill>Mes</Pill>
          </div>
        </div>

        {/* Mini week strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 18 }}>
          {[
            ['L', 4, false, true],
            ['M', 5, false, false],
            ['M', 6, true, true],
            ['J', 7, false, false],
            ['V', 8, false, true],
            ['S', 9, false, false],
            ['D', 10, false, false],
          ].map(([d, n, sel, dot], i) => (
            <div key={i} style={{
              padding: '10px 0', textAlign: 'center', borderRadius: 12,
              background: sel ? theme.accent : 'transparent',
              color: sel ? theme.accentInk : theme.fg,
              border: !sel ? `1px solid ${theme.line}` : 'none',
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, opacity: sel ? 0.7 : 0.6, fontFamily: theme.mono, letterSpacing: '0.1em' }}>{d}</div>
              <div style={{ fontFamily: theme.display, fontSize: 17, fontWeight: 700, marginTop: 4 }}>{n}</div>
              {dot && <div style={{ width: 5, height: 5, background: sel ? theme.accentInk : theme.accent, borderRadius: 99, margin: '4px auto 0' }}/>}
            </div>
          ))}
        </div>

        {/* Day timeline */}
        <div style={{ ...sl, marginBottom: 10 }}>MIÉ 6 · 2 sesiones</div>
        <div style={{ position: 'relative', paddingLeft: 56 }}>
          {[
            { time: '06:30', kind: 'Personalizado', who: 'Andrea G.', status: 'confirmado' },
            { time: '12:00', kind: 'Almuerzo · bloque libre', who: '', status: null, ghost: true },
            { time: '17:30', kind: 'Grupal · Funcional', who: 'Carlos R.', status: 'pendiente' },
          ].map((e, i) => (
            <div key={i} style={{ position: 'relative', paddingBottom: 16 }}>
              <div style={{ position: 'absolute', left: -56, top: 6, fontFamily: theme.mono, fontSize: 11, color: theme.fg3, width: 44 }}>{e.time}</div>
              <div style={{ position: 'absolute', left: -10, top: 8, width: 8, height: 8, borderRadius: 99,
                background: e.ghost ? 'transparent' : theme.accent, border: e.ghost ? `1.5px dashed ${theme.fg3}` : 'none' }}/>
              <div style={{ position: 'absolute', left: -7, top: 18, bottom: 0, width: 1, background: theme.line }}/>
              {!e.ghost ? (
                <div style={{ background: theme.surface, border: `1px solid ${theme.line}`, borderRadius: 14, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{e.kind}</div>
                      <div style={{ fontSize: 12, color: theme.fg2, marginTop: 3 }}>{e.who} · 60 min</div>
                    </div>
                    <StatusBadge kind={e.status}/>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: theme.fg3, fontStyle: 'italic', paddingTop: 4 }}>{e.kind}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </PhoneShell>
  );
}

function Pill({ children, active }) {
  return (
    <span style={{
      padding: '6px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
      background: active ? theme.surface2 : 'transparent',
      border: `1px solid ${active ? theme.line2 : theme.line}`,
      color: active ? theme.fg : theme.fg2,
    }}>{children}</span>
  );
}

// ──────────────────────────────────────────────────────────
// 5. Entrenador · Dashboard
// ──────────────────────────────────────────────────────────
function ScreenTrainer() {
  return (
    <PhoneShell tab="home">
      <div style={{ height: '100%', overflow: 'auto', padding: '8px 18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: theme.fg2 }}>Lun · 4 Mayo · 06:12</div>
            <div style={{ fontFamily: theme.display, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Buen día, Andrea</div>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: 99, background: '#5b4a36', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: theme.display, fontWeight: 600, fontSize: 13 }}>AG</div>
        </div>

        {/* Today summary */}
        <div style={{ background: theme.surface, border: `1px solid ${theme.line}`, borderRadius: 18, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ ...sl }}>HOY · 4 MAY</div>
            <span style={{ fontSize: 11, color: theme.fg3 }}>06:00 — 19:00</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 10 }}>
            <div style={{ fontFamily: theme.display, fontSize: 38, fontWeight: 700, letterSpacing: '-0.03em' }}>7</div>
            <div style={{ fontSize: 13, color: theme.fg2 }}>sesiones</div>
            <div style={{ marginLeft: 'auto', fontSize: 12, color: theme.fg2 }}>· 2 grupales</div>
          </div>
          {/* Hour bar */}
          <div style={{ marginTop: 14, height: 28, position: 'relative', background: theme.surface2, borderRadius: 8, overflow: 'hidden' }}>
            {[
              { l: 6, w: 6, t: 'P' }, { l: 16, w: 6, t: 'P' }, { l: 28, w: 12, t: 'G' },
              { l: 50, w: 6, t: 'P' }, { l: 62, w: 6, t: 'P' }, { l: 76, w: 12, t: 'G' },
            ].map((b, i) => (
              <div key={i} style={{
                position: 'absolute', left: `${b.l}%`, width: `${b.w}%`, top: 4, bottom: 4,
                background: b.t === 'G' ? theme.info : theme.accent, borderRadius: 5, opacity: 0.85,
              }}/>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: theme.fg3, marginTop: 6, fontFamily: theme.mono }}>
            <span>06</span><span>09</span><span>12</span><span>15</span><span>18</span>
          </div>
        </div>

        {/* Action grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
          <ActionTile icon="bell" label="Solicitudes" value="3" tone="warn"/>
          <ActionTile icon="bolt" label="Por vencer" value="5" tone="warn"/>
          <ActionTile icon="x"    label="Plan vencido" value="2" tone="err"/>
          <ActionTile icon="chart" label="Baja asist." value="4" tone="muted"/>
        </div>

        {/* Pending requests */}
        <SectionHeader title="Solicitudes pendientes" trailing="3"/>
        <div style={{ display: 'grid', gap: 8 }}>
          <RequestCard who="Lucía Pérez" when="Mié 06:30 · Personalizado" warn={false}/>
          <RequestCard who="Mario Henao"  when="Jue 18:00 · Grupal Funcional" warn={true}/>
        </div>

        {/* Goal */}
        <SectionHeader title="Mes en curso"/>
        <div style={{ background: theme.surface, border: `1px solid ${theme.line}`, borderRadius: 14, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div style={{ ...sl }}>META USUARIOS</div>
              <div style={{ fontFamily: theme.display, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 2 }}>32 / 40</div>
            </div>
            <span style={{ fontSize: 12, color: theme.accent, fontWeight: 600 }}>80%</span>
          </div>
          <div style={{ height: 6, background: theme.surface2, borderRadius: 99, marginTop: 10, overflow: 'hidden' }}>
            <div style={{ width: '80%', height: '100%', background: theme.accent }}/>
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}

function ActionTile({ icon, label, value, tone }) {
  const colorMap = { warn: theme.warn, err: theme.err, muted: theme.fg2 };
  const c = colorMap[tone] || theme.fg;
  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.line}`, borderRadius: 14, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={16} color={c}/>
      </div>
      <div>
        <div style={{ fontFamily: theme.display, fontSize: 18, fontWeight: 700, color: c }}>{value}</div>
        <div style={{ fontSize: 11, color: theme.fg2 }}>{label}</div>
      </div>
    </div>
  );
}

function RequestCard({ who, when, warn }) {
  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.line}`, borderRadius: 14, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 99, background: '#3a4538', flex: 'none' }}/>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{who}</div>
            <div style={{ fontSize: 11, color: theme.fg2, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{when}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
          <Btn size="sm" variant="secondary" icon="x">{}</Btn>
          <Btn size="sm" icon="check">{}</Btn>
        </div>
      </div>
      {warn && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 11, color: '#FFD79A' }}>
          <Icon name="bell" size={12} color={theme.warn}/>
          Plan vencido — requiere autorización
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// 6. Admin · Dashboard (desktop, 1280×800)
// ──────────────────────────────────────────────────────────
function ScreenAdmin() {
  return (
    <div style={{ width: 1280, height: 800, background: theme.bg, color: theme.fg, fontFamily: theme.font, display: 'grid', gridTemplateColumns: '232px 1fr' }}>
      {/* Sidebar */}
      <div style={{ borderRight: `1px solid ${theme.line}`, padding: '20px 14px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 8px 18px' }}><Logo size={20}/></div>
        <div style={{ ...sl, padding: '0 10px', marginBottom: 8 }}>OPERACIÓN</div>
        {[
          ['home', 'Dashboard', true],
          ['user', 'Usuarios', false],
          ['rep', 'Entrenadores', false],
          ['building', 'Sedes', false],
          ['group', 'Grupos', false],
          ['cal', 'Calendarios', false],
        ].map(([i, l, a]) => <NavItem key={l} icon={i} label={l} active={a}/>)}

        <div style={{ ...sl, padding: '0 10px', margin: '16px 0 8px' }}>NEGOCIO</div>
        {[
          ['bolt', 'Planes y precios'],
          ['chart', 'Facturación'],
          ['list', 'Reportes'],
        ].map(([i, l]) => <NavItem key={l} icon={i} label={l}/>)}

        <div style={{ ...sl, padding: '0 10px', margin: '16px 0 8px' }}>SISTEMA</div>
        {[
          ['shield', 'Permisos'],
          ['settings', 'Configuración'],
          ['list', 'Auditoría'],
        ].map(([i, l]) => <NavItem key={l} icon={i} label={l}/>)}

        <div style={{ marginTop: 'auto', padding: 10, background: theme.surface, border: `1px solid ${theme.line}`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 99, background: '#5b4a36', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12 }}>RM</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Ricardo Mora</div>
            <div style={{ fontSize: 10, color: theme.fg3 }}>Super Admin</div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ overflow: 'auto' }}>
        {/* Topbar */}
        <div style={{ height: 64, padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: theme.fg2 }}>
            <span>Operación</span><Icon name="arrow" size={12} color={theme.fg3} style={{ transform: 'rotate(0deg)' }}/>
            <span style={{ color: theme.fg }}>Dashboard global</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FakeInput label="" value="" placeholder="Buscar usuario, entrenador, sede…" icon="search"/>
            <Btn variant="outline" size="sm" icon="filter">Hoy</Btn>
            <Btn size="sm" icon="plus">Nuevo</Btn>
          </div>
        </div>

        <div style={{ padding: 28 }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22 }}>
            <div>
              <div style={{ ...sl }}>LUN 4 MAY · TODAS LAS SEDES</div>
              <div style={{ fontFamily: theme.display, fontSize: 32, fontWeight: 700, letterSpacing: '-0.025em', marginTop: 6 }}>Dashboard global</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Pill active>Hoy</Pill><Pill>Semana</Pill><Pill>Mes</Pill>
            </div>
          </div>

          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 18 }}>
            <BigKpi label="Usuarios activos" value="1.284" delta="+24" tone="ok"/>
            <BigKpi label="Entrenadores" value="38" delta="+1"/>
            <BigKpi label="Planes vendidos" value="186" delta="+12" tone="ok" sub="mes"/>
            <BigKpi label="Sesiones hoy" value="412" delta="−6" tone="muted"/>
            <BigKpi label="Plan vencido" value="47" delta="+9" tone="err"/>
          </div>

          {/* Two columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
            {/* Occupancy */}
            <div style={{ background: theme.surface, border: `1px solid ${theme.line}`, borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ ...sl }}>OCUPACIÓN POR SEDE</div>
                  <div style={{ fontFamily: theme.display, fontSize: 18, fontWeight: 600, marginTop: 4 }}>Hoy · franja completa</div>
                </div>
                <Btn size="sm" variant="ghost" icon="more">{}</Btn>
              </div>
              {[
                { name: 'Sede Norte · Cra 11', cap: 88, n: '174 / 198' },
                { name: 'Sede Centro · Cl 26', cap: 64, n: '128 / 200' },
                { name: 'Sede Sur · Cra 30',   cap: 42, n: '63 / 150' },
                { name: 'Sede Poniente',        cap: 71, n: '85 / 120' },
              ].map(s => (
                <div key={s.name} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ fontWeight: 500 }}>{s.name}</span>
                    <span style={{ color: theme.fg2, fontFamily: theme.mono, fontSize: 11 }}>{s.n} · {s.cap}%</span>
                  </div>
                  <div style={{ height: 8, background: theme.surface2, borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${s.cap}%`, height: '100%',
                      background: s.cap > 80 ? theme.warn : theme.accent }}/>
                  </div>
                </div>
              ))}
            </div>

            {/* Critical alerts */}
            <div style={{ background: theme.surface, border: `1px solid ${theme.line}`, borderRadius: 16, padding: 20 }}>
              <div style={{ ...sl, marginBottom: 4 }}>ALERTAS CRÍTICAS</div>
              <div style={{ fontFamily: theme.display, fontSize: 18, fontWeight: 600, marginBottom: 14 }}>Requieren atención</div>
              {[
                { tone: 'err',  t: '47 planes vencidos sin renovar', s: '12 con sesiones agendadas a futuro' },
                { tone: 'warn', t: 'Sede Centro al 96% de capacidad', s: 'Mar 5 May · franja tarde' },
                { tone: 'warn', t: '6 solicitudes esperan autorización', s: 'Promedio de espera: 11h' },
                { tone: 'info', t: '3 entrenadores con baja calificación', s: '≤ 4.0 últimos 30 días' },
              ].map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: i ? `1px solid ${theme.line}` : 'none' }}>
                  <div style={{
                    width: 8, alignSelf: 'stretch', borderRadius: 99,
                    background: a.tone === 'err' ? theme.err : a.tone === 'warn' ? theme.warn : theme.info,
                  }}/>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{a.t}</div>
                    <div style={{ fontSize: 11, color: theme.fg2, marginTop: 3 }}>{a.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active }) {
  return (
    <div style={{
      height: 38, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 10,
      borderRadius: 10, fontSize: 13, fontWeight: 500,
      background: active ? theme.surface : 'transparent',
      color: active ? theme.fg : theme.fg2, cursor: 'pointer', position: 'relative',
    }}>
      {active && <div style={{ position: 'absolute', left: -14, top: 9, bottom: 9, width: 3, background: theme.accent, borderRadius: 99 }}/>}
      <Icon name={icon} size={16} color={active ? theme.accent : 'currentColor'}/>
      {label}
    </div>
  );
}

function BigKpi({ label, value, delta, sub, tone }) {
  const dColor = tone === 'err' ? theme.err : tone === 'ok' ? theme.ok : theme.fg3;
  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.line}`, borderRadius: 14, padding: 16 }}>
      <div style={{ ...sl }}>{label.toUpperCase()}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
        <div style={{ fontFamily: theme.display, fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em' }}>{value}</div>
        <span style={{ fontSize: 11, color: dColor, fontFamily: theme.mono, fontWeight: 600 }}>{delta}</span>
      </div>
      {sub && <div style={{ fontSize: 11, color: theme.fg3, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

Object.assign(window, {
  PhoneShell, ScreenLogin, ScreenUserDashboard, ScreenAgendar, ScreenCalendar,
  ScreenTrainer, ScreenAdmin,
});
