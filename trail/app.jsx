const DEFAULT_COLORS = ['#dc2626','#ea580c','#ca8a04','#16a34a','#2563eb','#7c3aed'];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "rainbow": true,
  "colorSpeed": 0.5,
  "numColors": 3,
  "colors": ["#dc2626","#ea580c","#ca8a04","#16a34a","#2563eb","#7c3aed"],
  "glow": true,
  "dotDistance": 3,
  "maxDots": 300,
  "lifetime": 0.35,
  "dotSize": 50,
  "alpha": 100
}/*EDITMODE-END*/;
const TWEAK_DEFAULTS_JSON = JSON.stringify(TWEAK_DEFAULTS);

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const isDirty = JSON.stringify({ ...t, rainbow: TWEAK_DEFAULTS.rainbow }) !== TWEAK_DEFAULTS_JSON;

  const setColor = (i, v) => {
    const c = [...t.colors];
    c[i] = v;
    setTweak('colors', c);
  };

  return (
    <>
      <CursorTrail t={t} />

      <TweaksPanel title="Cursor Trail">
        <TweakSection label="Color">
          <TweakToggle label="Rainbow" value={t.rainbow}
                       onChange={(v) => setTweak('rainbow', v)} />
          {t.rainbow && (
            <TweakSlider label="Color speed" value={t.colorSpeed}
                         min={0.1} max={10} step={0.1}
                         onChange={(v) => setTweak('colorSpeed', v)} />
          )}
          {!t.rainbow && (
            <TweakSlider label="Colors" value={t.numColors} min={1} max={6} step={1}
                         onChange={(v) => setTweak('numColors', v)} />
          )}
          {Array.from({ length: t.rainbow ? t.colors.length : t.numColors }, (_, i) => (
            <TweakColor key={i} label={`Color ${i + 1}`} value={t.colors[i]}
                        onChange={(v) => setColor(i, v)} noAlpha />
          ))}
        </TweakSection>

        <TweakSection label="Shape">
          <TweakToggle label="Glow" value={t.glow} onChange={(v) => setTweak('glow', v)} />
          <TweakSlider label="Size" value={t.dotSize} min={1} max={256} step={1} unit="px"
                       onChange={(v) => setTweak('dotSize', v)} />
          <TweakSlider label="Alpha" value={t.alpha} min={0} max={100} step={1} unit="%"
                       onChange={(v) => setTweak('alpha', v)} />
        </TweakSection>

        <TweakSection label="Trail">
          <TweakSlider label="Dot distance" value={t.dotDistance} min={1}   max={10}  step={1}
                       onChange={(v) => setTweak('dotDistance', v)} />
          <TweakSlider label="Max dots"     value={t.maxDots}    min={1}   max={800} step={1}
                       onChange={(v) => setTweak('maxDots', v)} />
          <TweakSlider label="Lifetime"     value={t.lifetime}   min={0.1} max={5}   step={0.1} unit="s"
                       onChange={(v) => setTweak('lifetime', v)} />
        </TweakSection>

        <div style={{ display: 'flex', borderTop: '1px solid var(--bd)', marginTop: '8px', paddingTop: '16px' }}>
          <TweakButton label="Reset" secondary disabled={!isDirty} onClick={() => setTweak({ ...TWEAK_DEFAULTS, colors: [...DEFAULT_COLORS], rainbow: t.rainbow })} />
        </div>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
