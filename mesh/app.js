const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "color1": "#fca5a5",
  "color2": "#c4b5fd",
  "count": 2,
  "speed": 1
} /*EDITMODE-END*/;
const PALETTES_LIGHT = [['#fca5a5', '#c4b5fd'], ['#7dd3fc', '#f9a8d4'], ['#6ee7b7', '#a5b4fc'], ['#fcd34d', '#f0abfc'], ['#67e8f9', '#fda4af'], ['#bef264', '#93c5fd']];
const PALETTES_DARK = [['#dc2626', '#7c3aed'], ['#0284c7', '#db2777'], ['#059669', '#4f46e5'], ['#d97706', '#c026d3'], ['#0891b2', '#e11d48'], ['#65a30d', '#2563eb']];
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const paletteIdx = React.useRef(0);
  const [isDark, setIsDark] = React.useState(() => document.documentElement.getAttribute('data-theme') === 'dark');
  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
    return () => observer.disconnect();
  }, []);
  React.useEffect(() => {
    const from = isDark ? PALETTES_LIGHT : PALETTES_DARK;
    const to = isDark ? PALETTES_DARK : PALETTES_LIGHT;
    const idx = from.findIndex(([c1, c2]) => c1.toLowerCase() === t.color1.toLowerCase() && c2.toLowerCase() === t.color2.toLowerCase());
    if (idx !== -1) {
      paletteIdx.current = idx;
      const [c1, c2] = to[idx];
      setTweak({
        color1: c1,
        color2: c2
      });
    }
  }, [isDark]);
  const palettes = isDark ? PALETTES_DARK : PALETTES_LIGHT;
  const nextPalette = () => {
    paletteIdx.current = (paletteIdx.current + 1) % palettes.length;
    const [c1, c2] = palettes[paletteIdx.current];
    setTweak({
      color1: c1,
      color2: c2
    });
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Mesh, {
    t: t
  }), /*#__PURE__*/React.createElement(TweaksPanel, {
    title: "Mesh"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(TweakButton, {
    label: "Randomize",
    secondary: true,
    onClick: nextPalette
  }), /*#__PURE__*/React.createElement(TweakButton, {
    label: "Default",
    secondary: true,
    onClick: () => setTweak({
      ...TWEAK_DEFAULTS,
      color1: palettes[0][0],
      color2: palettes[0][1]
    })
  })), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Colors"
  }, ['color1', 'color2'].map((key, i) => /*#__PURE__*/React.createElement(TweakColor, {
    key: key,
    label: `Color ${i + 1}`,
    value: t[key],
    onChange: v => setTweak(key, v)
  }))), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Animation"
  }, /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Speed",
    value: t.speed,
    min: 0.5,
    max: 3,
    step: 0.1,
    onChange: v => setTweak('speed', v)
  }))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
