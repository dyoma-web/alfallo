// app.jsx — Al Fallo design canvas + clickable mini-prototype + tweaks

const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accentHex": "#C8FF3D",
  "role": "usuario",
  "density": "comfortable"
}/*EDITMODE-END*/;

// Apply accent live by overriding theme.accent + CSS var
function applyAccent(hex) {
  if (!hex) return;
  window.theme.accent = hex;
  document.documentElement.style.setProperty('--af-accent', hex);
}

function App() {
  const [tweaks, setTweak] = window.useTweaks
    ? window.useTweaks(TWEAK_DEFAULTS)
    : [TWEAK_DEFAULTS, () => {}];

  useEffect(() => { applyAccent(tweaks.accentHex); }, [tweaks.accentHex]);

  return (
    <>
      <style>{`
        :root { --af-accent: ${tweaks.accentHex}; }
        body { background: ${theme.bg}; }
        ::selection { background: ${tweaks.accentHex}; color: ${theme.accentInk}; }
      `}</style>

      <DesignCanvas>
        {/* SECTION 1 — BRAND FOUNDATIONS */}
        <DCSection id="brand" title="Identidad" subtitle="Logo, paleta, tipografía y voz de marca">
          <DCArtboard id="logo" label="Logotipo · Lockups" width={620} height={420}>
            <BrandFrame title="Logotipo" eyebrow="01 · MARCA" subtitle="Wordmark + repmark (chevrón ascendente)">
              <LogoLockups/>
            </BrandFrame>
          </DCArtboard>

          <DCArtboard id="palette" label="Paleta" width={620} height={520}>
            <BrandFrame title="Paleta" eyebrow="02 · COLOR" subtitle="Núcleo oscuro · acento lima · semántica clara">
              <Palette/>
            </BrandFrame>
          </DCArtboard>

          <DCArtboard id="type" label="Tipografía" width={520} height={520}>
            <BrandFrame title="Tipografía" eyebrow="03 · TIPO" subtitle="Geist (display) · Inter (UI) · Geist Mono (data)">
              <TypeSpec/>
            </BrandFrame>
          </DCArtboard>

          <DCArtboard id="voice" label="Voz & tono" width={520} height={520}>
            <BrandFrame title="Voz" eyebrow="04 · COPY" subtitle="Cercana, deportiva, no agresiva">
              <VoiceCard/>
            </BrandFrame>
          </DCArtboard>

          <DCArtboard id="components" label="Componentes" width={620} height={620}>
            <BrandFrame title="Componentes" eyebrow="05 · UI KIT" subtitle="Botones, estados, inputs, tarjetas">
              <Components/>
            </BrandFrame>
          </DCArtboard>
        </DCSection>

        {/* SECTION 2 — USUARIO MOBILE */}
        <DCSection id="usuario" title="Usuario · Mobile" subtitle="Mobile-first. Audiencia principal del MVP.">
          <DCArtboard id="login" label="01 · Login" width={360} height={760}>
            <ScreenLogin/>
          </DCArtboard>
          <DCArtboard id="u-dash" label="02 · Dashboard" width={360} height={760}>
            <ScreenUserDashboard accent={tweaks.accentHex}/>
          </DCArtboard>
          <DCArtboard id="u-agendar" label="03 · Agendar" width={360} height={760}>
            <ScreenAgendar/>
          </DCArtboard>
          <DCArtboard id="u-cal" label="04 · Calendario" width={360} height={760}>
            <ScreenCalendar/>
          </DCArtboard>
          <DCArtboard id="u-flow" label="05 · Flujo clickable" width={360} height={760}>
            <ClickableFlow/>
          </DCArtboard>
        </DCSection>

        {/* SECTION 3 — ENTRENADOR */}
        <DCSection id="entrenador" title="Entrenador · Mobile" subtitle="El día del entrenador en una pantalla.">
          <DCArtboard id="t-dash" label="06 · Dashboard entrenador" width={360} height={760}>
            <ScreenTrainer/>
          </DCArtboard>
        </DCSection>

        {/* SECTION 4 — ADMIN */}
        <DCSection id="admin" title="Admin · Desktop" subtitle="Control global de operación.">
          <DCArtboard id="a-dash" label="07 · Dashboard global" width={1280} height={800}>
            <ScreenAdmin/>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      {window.TweaksPanel && (
        <TweaksPanel title="Tweaks · al/fallo">
          <TweakSection title="Marca">
            <TweakColor label="Acento" value={tweaks.accentHex}
              onChange={v => setTweak('accentHex', v)}/>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {['#C8FF3D','#FF5A1F','#3DD9C9','#7C5BFF','#F2F4EF','#FFD23F'].map(c => (
                <button key={c} onClick={() => setTweak('accentHex', c)} style={{
                  width: 26, height: 26, borderRadius: 8, background: c, cursor: 'pointer',
                  border: tweaks.accentHex === c ? '2px solid #fff' : '1px solid rgba(0,0,0,0.15)',
                }}/>
              ))}
            </div>
          </TweakSection>
          <TweakSection title="Prototipo">
            <TweakRadio label="Rol activo en flujo"
              options={[{value:'usuario',label:'Usuario'},{value:'entrenador',label:'Entrenador'}]}
              value={tweaks.role} onChange={v => setTweak('role', v)}/>
            <TweakRadio label="Densidad"
              options={[{value:'compact',label:'Compact'},{value:'comfortable',label:'Comfort'}]}
              value={tweaks.density} onChange={v => setTweak('density', v)}/>
          </TweakSection>
        </TweaksPanel>
      )}
    </>
  );
}

// Frame wrapper for brand artboards
function BrandFrame({ title, eyebrow, subtitle, children }) {
  return (
    <div style={{
      width: '100%', height: '100%', background: theme.bg, color: theme.fg,
      fontFamily: theme.font, padding: 28, boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ ...sectionLabel, color: theme.accent }}>{eyebrow}</div>
        <div style={{ fontFamily: theme.display, fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', marginTop: 8 }}>{title}</div>
        <div style={{ fontSize: 13, color: theme.fg2, marginTop: 6 }}>{subtitle}</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>{children}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Clickable flow: dash → agendar → confirm toast
// ──────────────────────────────────────────────────────────
function ClickableFlow() {
  const [step, setStep] = useState(0);
  const [toast, setToast] = useState(false);

  function go(s) { setStep(s); }

  return (
    <div style={{ width: 360, height: 760, position: 'relative', overflow: 'hidden', background: theme.bg }}>
      {step === 0 && (
        <div onClick={() => go(1)} style={{ position: 'absolute', inset: 0 }}>
          <ScreenUserDashboard/>
          <ClickHint top={158} text="Toca el banner para agendar"/>
        </div>
      )}
      {step === 1 && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <ScreenAgendar/>
          <div onClick={() => { setToast(true); setTimeout(() => { setToast(false); go(0); }, 1600); }}
            style={{ position: 'absolute', bottom: 18, left: 18, right: 18, height: 60, borderRadius: 999, cursor: 'pointer' }}/>
          <div onClick={() => go(0)} style={{ position: 'absolute', top: 8, left: 8, width: 56, height: 56, cursor: 'pointer' }}/>
        </div>
      )}
      {toast && (
        <div style={{
          position: 'absolute', left: 18, right: 18, bottom: 100, zIndex: 50,
          background: theme.surface2, border: `1px solid ${theme.line2}`, borderRadius: 14,
          padding: 14, display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
        }}>
          <div style={{ width: 28, height: 28, borderRadius: 99, background: 'rgba(125,224,141,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={16} color={theme.ok} strokeWidth={2.5}/>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Sesión confirmada</div>
            <div style={{ fontSize: 11, color: theme.fg2, marginTop: 2 }}>Mié 6 May · 06:30 con Andrea</div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClickHint({ top, text }) {
  return (
    <div style={{
      position: 'absolute', top, left: 18, right: 18, height: 168,
      border: `1.5px dashed ${theme.accent}`, borderRadius: 22,
      pointerEvents: 'none', display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      paddingBottom: 12,
    }}>
      <div style={{
        background: theme.accent, color: theme.accentInk, fontSize: 11, fontWeight: 700,
        padding: '5px 10px', borderRadius: 99, fontFamily: theme.mono, letterSpacing: '0.06em',
      }}>{text}</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
