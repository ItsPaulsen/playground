const TWEAK_DEFAULTS = {
  radius:      24,
  orientation: 'landscape',
  title:       'Lorem Ipsum',
  subtitle:    'Dolor sit amet consectetur adipiscing elit',
  gradient:    true,
  color0:      '#6366f1',
  color1:      '#d946ef',
  bgOn:        false,
  bgColor:     '#ffffff',
};
const TWEAK_DEFAULTS_JSON = JSON.stringify(TWEAK_DEFAULTS);

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const isDirty = JSON.stringify(t) !== TWEAK_DEFAULTS_JSON;
  const [panelOpen, setPanelOpen] = React.useState(() => window.innerWidth > 639);
  const [isDesktop, setIsDesktop] = React.useState(() => window.innerWidth > 639);

  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  React.useEffect(() => {
    if (t.bgOn) {
      document.body.style.background = t.bgColor;
      document.body.classList.remove('pg-dot-grid');
    } else {
      document.body.style.background = '';
      document.body.classList.add('pg-dot-grid');
    }
  }, [t.bgOn, t.bgColor]);

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent',
        paddingRight: panelOpen && isDesktop ? 300 : 0,
        transition: 'padding-right .35s cubic-bezier(.22,1,.36,1)',
      }}>
        <CreditCard t={t} />
      </div>

      <TweaksPanel title="Card" onOpenChange={setPanelOpen}
        renderMobileFooter={(close) => (
          <>
            <TweakButton label="Reset" secondary disabled={!isDirty} onClick={() => setTweak(TWEAK_DEFAULTS)} />
            <TweakButton label="Show" onClick={close} />
          </>
        )}
      >
        <TweakSection>
          <TweakSlider label="Radius" value={t.radius} min={0} max={48} step={8}
                       onChange={(v) => setTweak('radius', v)} />
          <TweakRadio value={t.orientation}
                      options={[{value:'landscape',label:'Landscape'},{value:'portrait',label:'Portrait'}]}
                      onChange={(v) => setTweak('orientation', v)} />
        </TweakSection>

        <TweakSection label="Content">
          <TweakText label="Title"    value={t.title}    onChange={(v) => setTweak('title', v)} />
          <TweakText label="Subtitle" value={t.subtitle} onChange={(v) => setTweak('subtitle', v)} />
        </TweakSection>

        <TweakSection label="Background">
          <TweakToggle label="Custom" value={t.bgOn} onChange={(v) => setTweak('bgOn', v)} />
          {t.bgOn && <TweakColor label="Color" value={t.bgColor} onChange={(v) => setTweak('bgColor', v)} noAlpha />}
        </TweakSection>

        <TweakSection label="Color">
          <TweakToggle label="Gradient" value={t.gradient} onChange={(v) => setTweak('gradient', v)} />
          {Array.from({ length: t.gradient ? 2 : 1 }, (_, i) => (
            <TweakColor key={i} label={`Color ${i + 1}`} value={t['color' + i]}
                        onChange={(v) => setTweak('color' + i, v)} noAlpha />
          ))}
        </TweakSection>

        <div className="twk-desktop-only" style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--bd)', marginTop: 8, paddingTop: 16 }}>
          <TweakButton label="Reset" secondary disabled={!isDirty} onClick={() => setTweak(TWEAK_DEFAULTS)} />
        </div>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
