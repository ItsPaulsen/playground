const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "lineCount": 16,
  "thickness": 1,
  "spacing": 8,
  "amplitude": 0.25,
  "frequency": 4,
  "turbulence": 0.2,
  "speed": 0.8,
  "centerOffset": -0.18,
  "fray": 0.04,
  "direction": "vertical",
  "lineColor": "#818cf8",
  "pulseAmount": 2,
  "pulseRatio": 0.64,
  "pulseSpeed": 0.5,
  "seed": 19
} /*EDITMODE-END*/;
const TWEAK_DEFAULTS_JSON = JSON.stringify(TWEAK_DEFAULTS);
const COLORS = ['#f87171','#fb923c','#fbbf24','#facc15','#a3e635','#4ade80','#34d399','#2dd4bf','#22d3ee','#38bdf8','#60a5fa','#818cf8','#a78bfa','#c084fc','#e879f9','#f472b6','#fb7185'];
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const isDirty = JSON.stringify(t) !== TWEAK_DEFAULTS_JSON;
  const [panelOpen, setPanelOpen] = React.useState(true);
  const rand = (min, max, step = 0.01) => {
    const v = Math.random() * (max - min) + min;
    return Math.round(v / step) * step;
  };
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const randomize = () => setTweak({
    seed: rand(0, 50, 1),
    lineCount: rand(1, 100, 1),
    thickness: rand(0.5, 2, 0.5),
    spacing: rand(1, 24, 1),
    amplitude: rand(0, 1, 0.05),
    frequency: rand(0.5, 10, 0.1),
    turbulence: rand(0, 1, 0.01),
    fray: rand(0, 1, 0.01),
    pulseAmount: rand(0, 3, 0.25),
    pulseRatio: rand(0, 1, 0.01),
    pulseSpeed: rand(0.5, 2, 0.5),
    lineColor: pick(COLORS),
    direction: pick(['vertical', 'horizontal'])
  });
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Wave, {
    t: {
      lineCount: t.lineCount,
      thickness: t.thickness,
      spacing: t.spacing,
      amplitude: t.amplitude,
      frequency: t.frequency,
      complexity: 1,
      turbulence: t.turbulence,
      speed: t.speed,
      opacity: 1,
      centerOffset: panelOpen ? -0.18 : 0,
      softness: true,
      paused: false,
      direction: t.direction,
      colorMode: 'fade-edges',
      blendMode: 'source-over',
      lineColor: t.lineColor,
      spread: 0,
      fray: t.fray,
      pulseAmount: t.pulseAmount,
      pulseRatio: t.pulseRatio,
      pulseSpeed: t.pulseSpeed,
      seed: t.seed
    }
  }), /*#__PURE__*/React.createElement(TweaksPanel, {
    title: "Wave",
    onOpenChange: setPanelOpen
  }, /*#__PURE__*/React.createElement(TweakSection, null, /*#__PURE__*/React.createElement(TweakColor, {
    value: t.lineColor,
    onChange: v => setTweak('lineColor', v)
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    value: t.direction,
    options: [{
      value: 'vertical',
      label: 'Vertical'
    }, {
      value: 'horizontal',
      label: 'Horizontal'
    }],
    onChange: v => setTweak('direction', v)
  })), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Composition"
  }, /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Lines",
    value: t.lineCount,
    min: 1,
    max: 100,
    step: 1,
    onChange: v => setTweak('lineCount', v)
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Thickness",
    value: Number(t.thickness.toFixed(2)),
    min: 0.25,
    max: 2,
    step: 0.25,
    unit: "px",
    onChange: v => setTweak('thickness', v)
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Spacing",
    value: t.spacing,
    min: 1,
    max: 24,
    step: 1,
    unit: "px",
    onChange: v => setTweak('spacing', v)
  })), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Motion"
  }, /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Amplitude",
    value: t.amplitude.toFixed(2),
    min: 0.05,
    max: 1,
    step: 0.05,
    onChange: v => setTweak('amplitude', Number(v))
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Frequency",
    value: t.frequency.toFixed(1),
    min: 1,
    max: 10,
    step: 0.1,
    onChange: v => setTweak('frequency', Number(v))
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Turbulence",
    value: Math.round(t.turbulence * 100),
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    onChange: v => setTweak('turbulence', v / 100)
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Fray",
    value: Math.round(t.fray * 100),
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    onChange: v => setTweak('fray', v / 100)
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Speed",
    value: Math.round(t.speed * 50),
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    onChange: v => setTweak('speed', v / 50)
  })), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Pulse"
  }, /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Bulge size",
    value: t.pulseAmount.toFixed(2),
    min: 0,
    max: 3,
    step: 0.25,
    unit: "px",
    onChange: v => setTweak('pulseAmount', Number(v))
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Lines pulsing",
    value: Math.round(t.pulseRatio * 100),
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    onChange: v => setTweak('pulseRatio', v / 100)
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Bulge cadence",
    value: t.pulseSpeed.toFixed(1),
    min: 0.5,
    max: 2,
    step: 0.5,
    onChange: v => setTweak('pulseSpeed', Number(v))
  })), /*#__PURE__*/React.createElement("div", {
    style: {display:'flex',gap:8,borderTop:'1px solid var(--bd)',marginTop:'8px',paddingTop:'16px'}
  }, /*#__PURE__*/React.createElement(TweakButton, {
    label: "Randomize",
    secondary: true,
    onClick: randomize
  }), /*#__PURE__*/React.createElement(TweakButton, {
    label: "Reset",
    secondary: true,
    disabled: !isDirty,
    onClick: () => setTweak(TWEAK_DEFAULTS)
  }))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
