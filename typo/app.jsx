const _seg = new Intl.Segmenter();

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "text": "Catch 🤽",
  "fontSize": 128,
  "fontWeight": 600,
  "letterSpacing": 4,
  "fontColor": "#a855f7",
  "fontStyle": "normal",
  "fontEffect": "flat",
  "amplitude": 32,
  "speed": 0.49,
  "spread": 0.32
}/*EDITMODE-END*/;

const TWEAK_DEFAULTS_JSON = JSON.stringify(TWEAK_DEFAULTS);

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [panelOpen, setPanelOpen] = React.useState(() => window.innerWidth > 639);
  const [isDesktop, setIsDesktop] = React.useState(() => window.innerWidth > 639);
  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const isDirty = JSON.stringify({ ...t, text: TWEAK_DEFAULTS.text }) !== TWEAK_DEFAULTS_JSON;

  return (
    <>
      <Typo t={t} panelOpen={panelOpen && isDesktop} />

      <TweaksPanel title="Typo" onOpenChange={setPanelOpen}
        renderMobileFooter={(close) => (
          <>
            <TweakButton label="Reset" secondary disabled={!isDirty} onClick={() => setTweak({ ...TWEAK_DEFAULTS, text: t.text })} />
            <TweakButton label="Show" onClick={close} />
          </>
        )}
      >
        <TweakSection>
          <div style={{ position: 'relative' }}>
            <input
              className="twk-field"
              type="text"
              value={t.text}
              placeholder="Type something…"
              style={{ paddingRight: 36 }}
              onChange={(e) => { const v = [..._seg.segment(e.target.value)].slice(0, 20).map(s => s.segment).join(''); setTweak('text', v); }}
            />
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              fontSize: 10, color: 'var(--val)', pointerEvents: 'none' }}>
              {[..._seg.segment(t.text || '')].length}/20
            </span>
          </div>
          <TweakColor
            value={t.fontColor}
            onChange={(v) => setTweak('fontColor', v)}
          />
          <TweakRadio
            value={t.fontEffect}
            options={[
              { value: 'flat',    label: 'Flat'    },
              { value: 'outline', label: 'Outline' },
            ]}
            onChange={(v) => setTweak('fontEffect', v)}
          />
        </TweakSection>

        <TweakSection label="Typography">
          <TweakSlider label="Size"    value={t.fontSize}      min={24}  max={200} step={2}   unit="px"
                       onChange={(v) => setTweak('fontSize', v)} />
          <TweakSlider label="Weight"  value={t.fontWeight}    min={300} max={700} step={100}
                       onChange={(v) => setTweak('fontWeight', v)} />
          <TweakSlider label="Spacing" value={t.letterSpacing} min={-4}  max={16}  step={1}   unit="px"
                       onChange={(v) => setTweak('letterSpacing', v)} />
        </TweakSection>

        <TweakSection label="Animation">
          <TweakSlider label="Amplitude" value={t.amplitude}         min={8}   max={48}  step={2}   unit="px"
                       onChange={(v) => setTweak('amplitude', v)} />
          <TweakSlider label="Speed"     value={Math.round((t.speed - 0.25) / 0.5 * 100)} min={10} max={100} step={1} unit="%"
                       onChange={(v) => setTweak('speed', v / 100 * 0.5 + 0.25)} />
          <TweakSlider label="Wave"      value={Math.round(t.spread * 100)} min={0} max={100} step={1} unit="%"
                       onChange={(v) => setTweak('spread', v / 100)} />
        </TweakSection>

        <div className="twk-desktop-only" style={{ display: 'flex', borderTop: '1px solid var(--bd)', marginTop: '8px', paddingTop: '16px' }}>
          <TweakButton label="Reset" secondary disabled={!isDirty} onClick={() => setTweak({ ...TWEAK_DEFAULTS, text: t.text })} />
        </div>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
