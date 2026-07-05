const DEFAULT_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "rainbow": true,
  "colorSpeed": 0.5,
  "numColors": 3,
  "colors": ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"],
  "glow": true,
  "dotDistance": 3,
  "maxDots": 300,
  "lifetime": 0.35,
  "dotSize": 50,
  "alpha": 100,
  "bgOn": false,
  "bgColor": "#ffffff"
} /*EDITMODE-END*/;
const TWEAK_DEFAULTS_JSON = JSON.stringify(TWEAK_DEFAULTS);
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const isDirty = JSON.stringify({
    ...t,
    rainbow: TWEAK_DEFAULTS.rainbow
  }) !== TWEAK_DEFAULTS_JSON;

  // Background: custom solid color, else the randomly-loaded photo (window.__trailBg)
  React.useEffect(() => {
    const b = document.body;
    if (t.bgOn) {
      b.classList.add('custom-bg');
      b.style.backgroundColor = t.bgColor;
      b.style.backgroundImage = 'none';
    } else {
      b.classList.remove('custom-bg');
      b.style.backgroundColor = '';
      b.style.backgroundImage = window.__trailBg || '';
    }
  }, [t.bgOn, t.bgColor]);
  const setColor = (i, v) => {
    const c = [...t.colors];
    c[i] = v;
    setTweak('colors', c);
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(CursorTrail, {
    t: t
  }), /*#__PURE__*/React.createElement(TweaksPanel, {
    title: "Trail",
    renderMobileFooter: close => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(TweakButton, {
      label: "Reset",
      secondary: true,
      disabled: !isDirty,
      onClick: () => setTweak({
        ...TWEAK_DEFAULTS,
        colors: [...DEFAULT_COLORS],
        rainbow: t.rainbow
      })
    }), /*#__PURE__*/React.createElement(TweakButton, {
      label: "Show",
      onClick: close
    }))
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
  })), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Background"
  }, /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Custom",
    value: t.bgOn,
    onChange: v => setTweak('bgOn', v)
  }), t.bgOn && /*#__PURE__*/React.createElement(TweakColor, {
    label: "Color",
    value: t.bgColor,
    onChange: v => setTweak('bgColor', v),
    noAlpha: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "twk-desktop-only",
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
      colors: [...DEFAULT_COLORS],
      rainbow: t.rainbow
    })
  }))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
