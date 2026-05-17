const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "strength": 300,
  "radius": 3,
  "damping": 0.97,
  "rate": 6
}/*EDITMODE-END*/;
const TWEAK_DEFAULTS_JSON = JSON.stringify(TWEAK_DEFAULTS);

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const isDirty = JSON.stringify(t) !== TWEAK_DEFAULTS_JSON;

  return (
    <>
      <WaterTrail t={t} />

      <TweaksPanel title="Water">
        <TweakSection label="Ripple">
          <TweakSlider label="Strength" value={t.strength} min={50}   max={800}  step={50}
                       onChange={(v) => setTweak('strength', v)} />
          <TweakSlider label="Radius"   value={t.radius}   min={1}    max={8}    step={1}   unit="px"
                       onChange={(v) => setTweak('radius', v)} />
          <TweakSlider label="Damping"  value={t.damping}  min={0.90} max={0.99} step={0.01}
                       onChange={(v) => setTweak('damping', v)} />
        </TweakSection>

        <TweakSection label="Interaction">
          <TweakSlider label="Rate" value={t.rate} min={1} max={30} step={1} unit="px"
                       onChange={(v) => setTweak('rate', v)} />
        </TweakSection>

        <div style={{ display: 'flex', borderTop: '1px solid var(--bd)', marginTop: '8px', paddingTop: '16px' }}>
          <TweakButton label="Reset" secondary disabled={!isDirty}
                       onClick={() => setTweak({ ...TWEAK_DEFAULTS })} />
        </div>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
