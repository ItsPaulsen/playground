const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "specular": 0.5,
  "intensity": 1,
  "radius": 0.05,
  "viscosity": 0.92
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
          <TweakSlider label="Specular"  value={t.specular}  min={0}    max={3}     step={0.1}
                       onChange={(v) => setTweak('specular', v)} />
          <TweakSlider label="Intensity" value={t.intensity} min={0.1}  max={3}     step={0.1}
                       onChange={(v) => setTweak('intensity', v)} />
          <TweakSlider label="Radius"    value={t.radius}    min={0.01} max={0.2}   step={0.01}
                       onChange={(v) => setTweak('radius', v)} />
          <TweakSlider label="Viscosity" value={t.viscosity} min={0.9}  max={0.999} step={0.001}
                       onChange={(v) => setTweak('viscosity', v)} />
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
