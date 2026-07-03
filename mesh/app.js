const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "color1": "#a5f3fc",
  "color2": "#e9d5ff",
  "count": 2,
  "speed": 1
} /*EDITMODE-END*/;
const PALETTES = [{
  light: ['#a5f3fc', '#e9d5ff'],
  dark: ['#0891b2', '#9333ea']
}, {
  light: ['#fed7aa', '#ddd6fe'],
  dark: ['#ea580c', '#7c3aed']
}, {
  light: ['#fde68a', '#99f6e4'],
  dark: ['#d97706', '#0d9488']
}, {
  light: ['#fef08a', '#c7d2fe'],
  dark: ['#ca8a04', '#4f46e5']
}, {
  light: ['#d9f99d', '#f5d0fe'],
  dark: ['#65a30d', '#c026d3']
}, {
  light: ['#bbf7d0', '#bfdbfe'],
  dark: ['#16a34a', '#2563eb']
}, {
  light: ['#a7f3d0', '#fecdd3'],
  dark: ['#059669', '#e11d48']
}, {
  light: ['#a5f3fc', '#e9d5ff'],
  dark: ['#0891b2', '#9333ea']
}, {
  light: ['#bae6fd', '#fbcfe8'],
  dark: ['#0284c7', '#db2777']
}, {
  light: ['#bfdbfe', '#fde68a'],
  dark: ['#2563eb', '#d97706']
}, {
  light: ['#c7d2fe', '#d9f99d'],
  dark: ['#4f46e5', '#65a30d']
}, {
  light: ['#ddd6fe', '#bbf7d0'],
  dark: ['#7c3aed', '#16a34a']
}, {
  light: ['#f5d0fe', '#fef08a'],
  dark: ['#c026d3', '#ca8a04']
}, {
  light: ['#fbcfe8', '#a5f3fc'],
  dark: ['#db2777', '#0891b2']
}, {
  light: ['#fecdd3', '#ddd6fe'],
  dark: ['#e11d48', '#7c3aed']
}, {
  light: ['#fecaca', '#a7f3d0'],
  dark: ['#dc2626', '#059669']
}, {
  light: ['#fed7aa', '#bae6fd'],
  dark: ['#ea580c', '#0284c7']
}];
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
    const fromKey = isDark ? 'light' : 'dark';
    const toKey = isDark ? 'dark' : 'light';
    const idx = PALETTES.findIndex(p => p[fromKey][0].toLowerCase() === t.color1.toLowerCase() && p[fromKey][1].toLowerCase() === t.color2.toLowerCase());
    if (idx !== -1) {
      paletteIdx.current = idx;
      const [c1, c2] = PALETTES[idx][toKey];
      setTweak({
        color1: c1,
        color2: c2
      });
    }
  }, [isDark]);
  const theme = isDark ? 'dark' : 'light';
  const defaultColors = PALETTES[0][theme];
  const isDirty = t.color1 !== defaultColors[0] || t.color2 !== defaultColors[1] || t.speed !== TWEAK_DEFAULTS.speed || t.count !== TWEAK_DEFAULTS.count;
  const resetTweaks = () => setTweak({
    ...TWEAK_DEFAULTS,
    color1: defaultColors[0],
    color2: defaultColors[1]
  });
  const nextPalette = () => {
    paletteIdx.current = paletteIdx.current % (PALETTES.length - 1) + 1;
    const [c1, c2] = PALETTES[paletteIdx.current][theme];
    setTweak({
      color1: c1,
      color2: c2
    });
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Mesh, {
    t: t
  }), /*#__PURE__*/React.createElement(TweaksPanel, {
    title: "Mesh",
    renderMobileFooter: close => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(TweakButton, {
      label: "Reset",
      secondary: true,
      disabled: !isDirty,
      onClick: resetTweaks
    }), /*#__PURE__*/React.createElement(TweakButton, {
      label: "Show",
      onClick: close
    }))
  }, /*#__PURE__*/React.createElement(TweakSection, {
    label: "Colors"
  }, /*#__PURE__*/React.createElement(TweakColor, {
    label: "Color 1",
    value: t.color1,
    onChange: v => setTweak('color1', v)
  }), /*#__PURE__*/React.createElement(TweakColor, {
    label: "Color 2",
    value: t.color2,
    onChange: v => setTweak('color2', v)
  })), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Animation"
  }, /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Speed",
    value: t.speed,
    min: 0.1,
    max: 1.5,
    step: 0.1,
    onChange: v => setTweak('speed', v)
  })), /*#__PURE__*/React.createElement("div", {
    className: "twk-desktop-only",
    style: {
      display: 'flex',
      gap: 8,
      borderTop: '1px solid var(--bd)',
      marginTop: '8px',
      paddingTop: '16px'
    }
  }, /*#__PURE__*/React.createElement(TweakButton, {
    label: "Randomize",
    secondary: true,
    onClick: nextPalette
  }), /*#__PURE__*/React.createElement(TweakButton, {
    label: "Reset",
    secondary: true,
    disabled: !isDirty,
    onClick: resetTweaks
  })), /*#__PURE__*/React.createElement("div", {
    className: "twk-mobile-only",
    style: {
      borderTop: '1px solid var(--bd)',
      marginTop: '8px',
      paddingTop: '16px'
    }
  }, /*#__PURE__*/React.createElement(TweakButton, {
    label: "Randomize",
    secondary: true,
    onClick: nextPalette
  }))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
