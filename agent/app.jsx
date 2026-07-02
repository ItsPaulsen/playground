const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "label": "Agent",
  "color": "#818cf8",
  "speed": 2.5,
  "glow": 55,
  "thickness": 2,
  "hoverOnly": false
}/*EDITMODE-END*/;

const TWEAK_DEFAULTS_JSON = JSON.stringify(TWEAK_DEFAULTS);

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [panelOpen, setPanelOpen] = React.useState(() => window.innerWidth > 639);
  const isDirty = JSON.stringify(t) !== TWEAK_DEFAULTS_JSON;

  const outerStyle = {
    '--spark': t.color,
    '--dur': `${t.speed}s`,
    '--glow-op': (t.glow / 100).toFixed(2),
    '--thick': `${t.thickness}px`,
  };

  return (
    <>
      <div className="stage" id="main-content">
        <div className={`btn-outer${t.hoverOnly ? ' hover-only' : ''}`} style={outerStyle}>
          <button className="agent-btn">{t.label || 'Agent'}</button>
          <div className="btn-border" />
        </div>
      </div>

      <TweaksPanel title="Button" onOpenChange={setPanelOpen}
        renderMobileFooter={(close) => (
          <>
            <TweakButton label="Reset" secondary disabled={!isDirty}
                         onClick={() => setTweak(TWEAK_DEFAULTS)} />
            <TweakButton label="Show" onClick={close} />
          </>
        )}
      >
        <TweakSection>
          <TweakText
            value={t.label}
            placeholder="Button label…"
            onChange={(v) => setTweak('label', v)}
          />
          <TweakColor
            value={t.color}
            onChange={(v) => setTweak('color', v)}
          />
        </TweakSection>

        <TweakSection label="Border">
          <TweakSlider label="Speed" value={t.speed} min={0.4} max={8} step={0.1} unit="s"
                       onChange={(v) => setTweak('speed', v)} />
          <TweakSlider label="Width" value={t.thickness} min={1} max={6} step={1} unit="px"
                       onChange={(v) => setTweak('thickness', v)} />
          <TweakSlider label="Glow"  value={t.glow}  min={0} max={100} step={5} unit="%"
                       onChange={(v) => setTweak('glow', v)} />
          <TweakToggle label="Hover only" value={t.hoverOnly}
                       onChange={(v) => setTweak('hoverOnly', v)} />
        </TweakSection>

        <div className="twk-desktop-only"
             style={{ display: 'flex', borderTop: '1px solid var(--bd)', marginTop: 8, paddingTop: 16 }}>
          <TweakButton label="Reset" secondary disabled={!isDirty}
                       onClick={() => setTweak(TWEAK_DEFAULTS)} />
        </div>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
