const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "color1": "#f87171",
  "color2": "#38bdf8",
  "count": 2,
  "speed": 1
}/*EDITMODE-END*/;

const PALETTES = [
  { light: ['#f87171', '#38bdf8'], dark: ['#dc2626', '#0284c7'] },
  { light: ['#fb923c', '#a78bfa'], dark: ['#ea580c', '#7c3aed'] },
  { light: ['#fbbf24', '#2dd4bf'], dark: ['#d97706', '#0d9488'] },
  { light: ['#facc15', '#818cf8'], dark: ['#ca8a04', '#4f46e5'] },
  { light: ['#a3e635', '#e879f9'], dark: ['#65a30d', '#c026d3'] },
  { light: ['#4ade80', '#60a5fa'], dark: ['#16a34a', '#2563eb'] },
  { light: ['#34d399', '#fb7185'], dark: ['#059669', '#e11d48'] },
  { light: ['#22d3ee', '#c084fc'], dark: ['#0891b2', '#9333ea'] },
  { light: ['#38bdf8', '#f472b6'], dark: ['#0284c7', '#db2777'] },
  { light: ['#60a5fa', '#fbbf24'], dark: ['#2563eb', '#d97706'] },
  { light: ['#818cf8', '#a3e635'], dark: ['#4f46e5', '#65a30d'] },
  { light: ['#a78bfa', '#4ade80'], dark: ['#7c3aed', '#16a34a'] },
  { light: ['#c084fc', '#facc15'], dark: ['#9333ea', '#ca8a04'] },
  { light: ['#e879f9', '#2dd4bf'], dark: ['#c026d3', '#0d9488'] },
  { light: ['#f472b6', '#22d3ee'], dark: ['#db2777', '#0891b2'] },
  { light: ['#fb7185', '#a78bfa'], dark: ['#e11d48', '#7c3aed'] },
  { light: ['#f87171', '#34d399'], dark: ['#dc2626', '#059669'] },
  { light: ['#fb923c', '#38bdf8'], dark: ['#ea580c', '#0284c7'] },
];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const paletteIdx = React.useRef(0);
  const [isDark, setIsDark] = React.useState(() => document.documentElement.getAttribute('data-theme') === 'dark');

  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const fromKey = isDark ? 'light' : 'dark';
    const toKey   = isDark ? 'dark'  : 'light';
    const idx = PALETTES.findIndex(p =>
      p[fromKey][0].toLowerCase() === t.color1.toLowerCase() &&
      p[fromKey][1].toLowerCase() === t.color2.toLowerCase()
    );
    if (idx !== -1) {
      paletteIdx.current = idx;
      const [c1, c2] = PALETTES[idx][toKey];
      setTweak({ color1: c1, color2: c2 });
    }
  }, [isDark]);

  const theme = isDark ? 'dark' : 'light';
  const isDirty = t.count !== TWEAK_DEFAULTS.count ||
                  t.speed !== TWEAK_DEFAULTS.speed ||
                  t.color1.toLowerCase() !== PALETTES[0][theme][0] ||
                  t.color2.toLowerCase() !== PALETTES[0][theme][1];

  const nextPalette = () => {
    paletteIdx.current = (paletteIdx.current % (PALETTES.length - 1)) + 1;
    const [c1, c2] = PALETTES[paletteIdx.current][theme];
    setTweak({ color1: c1, color2: c2 });
  };

  return (
    <>
      <Mesh t={t} />

      <TweaksPanel title="Mesh">
        <div style={{ display: 'flex', gap: 8 }}>
          <TweakButton label="Randomize" secondary onClick={nextPalette} />
          <TweakButton label="Default" secondary disabled={!isDirty}
            onClick={() => setTweak({ ...TWEAK_DEFAULTS, color1: PALETTES[0][theme][0], color2: PALETTES[0][theme][1] })} />
        </div>
        <TweakSection label="Colors">
          {['color1', 'color2'].map((key, i) => (
            <TweakColor key={key} label={`Color ${i + 1}`} value={t[key]} onChange={v => setTweak(key, v)} />
          ))}
        </TweakSection>

        <TweakSection label="Animation">
          <TweakSlider label="Speed" value={t.speed} min={0.5} max={3} step={0.1}
                       onChange={v => setTweak('speed', v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
