// Frogskis default palette (0–1 RGB converted to hex)
const FROGSKIS_COLORS = ['#ff0000', '#c25900', '#14ba00', '#008aff', '#0000ff', '#9400ff'];
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "rainbow": true,
  "colorSpeed": 0.5,
  "numColors": 3,
  "colors": ["#ff0000", "#c25900", "#14ba00", "#008aff", "#0000ff", "#9400ff"],
  "glow": true,
  "dotDistance": 3,
  "maxDots": 300,
  "lifetime": 0.35,
  "dotSize": 50,
  "alpha": 100
} /*EDITMODE-END*/;
const TWEAK_DEFAULTS_JSON = JSON.stringify(TWEAK_DEFAULTS);
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const isDirty = JSON.stringify(t) !== TWEAK_DEFAULTS_JSON;
  const setColor = (i, v) => {
    const c = [...t.colors];
    c[i] = v;
    setTweak('colors', c);
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(CursorTrail, {
    t: t
  }), /*#__PURE__*/React.createElement(TweaksPanel, {
    title: "Cursor Trail"
  }, /*#__PURE__*/React.createElement(TweakSection, {
    label: "Color"
  }, /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Rainbow",
    value: t.rainbow,
    onChange: v => setTweak('rainbow', v)
  }), t.rainbow && /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Color speed",
    value: t.colorSpeed,
    min: 0.1,
    max: 10,
    step: 0.1,
    onChange: v => setTweak('colorSpeed', v)
  }), !t.rainbow && /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Colors",
    value: t.numColors,
    min: 1,
    max: 6,
    step: 1,
    onChange: v => setTweak('numColors', v)
  }), Array.from({
    length: t.rainbow ? t.colors.length : t.numColors
  }, (_, i) => /*#__PURE__*/React.createElement(TweakColor, {
    key: i,
    label: `Color ${i + 1}`,
    value: t.colors[i],
    onChange: v => setColor(i, v),
    noAlpha: true
  }))), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Shape"
  }, /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Glow",
    value: t.glow,
    onChange: v => setTweak('glow', v)
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Size",
    value: t.dotSize,
    min: 1,
    max: 256,
    step: 1,
    unit: "px",
    onChange: v => setTweak('dotSize', v)
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Alpha",
    value: t.alpha,
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    onChange: v => setTweak('alpha', v)
  })), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Trail"
  }, /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Dot distance",
    value: t.dotDistance,
    min: 1,
    max: 10,
    step: 1,
    onChange: v => setTweak('dotDistance', v)
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Max dots",
    value: t.maxDots,
    min: 1,
    max: 800,
    step: 1,
    onChange: v => setTweak('maxDots', v)
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Lifetime",
    value: t.lifetime,
    min: 0.1,
    max: 5,
    step: 0.1,
    unit: "s",
    onChange: v => setTweak('lifetime', v)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      borderTop: '1px solid var(--bd)',
      marginTop: '8px',
      paddingTop: '16px'
    }
  }, /*#__PURE__*/React.createElement(TweakButton, {
    label: "Reset",
    secondary: true,
    disabled: !isDirty,
    onClick: () => setTweak({
      ...TWEAK_DEFAULTS,
      colors: [...FROGSKIS_COLORS],
      rainbow: t.rainbow
    })
  }))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
