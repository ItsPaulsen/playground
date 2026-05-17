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
} /*EDITMODE-END*/;
const TWEAK_DEFAULTS_JSON = JSON.stringify(TWEAK_DEFAULTS);
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [panelOpen, setPanelOpen] = React.useState(true);
  const isDirty = JSON.stringify(t) !== TWEAK_DEFAULTS_JSON;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Typo, {
    t: t,
    panelOpen: panelOpen
  }), /*#__PURE__*/React.createElement(TweaksPanel, {
    title: "Typo",
    onOpenChange: setPanelOpen
  }, /*#__PURE__*/React.createElement(TweakSection, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: t.text,
    placeholder: "Type something\u2026",
    style: {
      paddingRight: 36
    },
    onChange: e => {
      const v = [..._seg.segment(e.target.value)].slice(0, 20).map(s => s.segment).join('');
      setTweak('text', v);
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: 8,
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: 10,
      color: 'var(--muted)',
      pointerEvents: 'none'
    }
  }, [..._seg.segment(t.text || '')].length, "/20")), /*#__PURE__*/React.createElement(TweakColor, {
    value: t.fontColor,
    onChange: v => setTweak('fontColor', v)
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    value: t.fontEffect,
    options: [{
      value: 'flat',
      label: 'Flat'
    }, {
      value: 'outline',
      label: 'Outline'
    }],
    onChange: v => setTweak('fontEffect', v)
  })), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Typography"
  }, /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Size",
    value: t.fontSize,
    min: 24,
    max: 200,
    step: 2,
    unit: "px",
    onChange: v => setTweak('fontSize', v)
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Weight",
    value: t.fontWeight,
    min: 300,
    max: 700,
    step: 100,
    onChange: v => setTweak('fontWeight', v)
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Spacing",
    value: t.letterSpacing,
    min: -4,
    max: 16,
    step: 1,
    unit: "px",
    onChange: v => setTweak('letterSpacing', v)
  })), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Animation"
  }, /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Amplitude",
    value: t.amplitude,
    min: 8,
    max: 48,
    step: 2,
    unit: "px",
    onChange: v => setTweak('amplitude', v)
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Speed",
    value: Math.round((t.speed - 0.25) / 0.5 * 100),
    min: 10,
    max: 100,
    step: 1,
    unit: "%",
    onChange: v => setTweak('speed', v / 100 * 0.5 + 0.25)
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Wave",
    value: Math.round(t.spread * 100),
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
    onChange: v => setTweak('spread', v / 100)
  })), /*#__PURE__*/React.createElement("div", {
    style: {display:'flex',borderTop:'1px solid var(--bd)',marginTop:'8px',paddingTop:'16px'}
  }, /*#__PURE__*/React.createElement(TweakButton, {
    label: "Reset",
    secondary: true,
    disabled: !isDirty,
    onClick: () => setTweak(TWEAK_DEFAULTS)
  }))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
