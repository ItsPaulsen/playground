const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "strength": 300,
  "radius": 3,
  "damping": 0.97,
  "rate": 6,
  "resolution": 3
}/*EDITMODE-END*/;
const TWEAK_DEFAULTS_JSON = JSON.stringify(TWEAK_DEFAULTS);

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const isDirty = JSON.stringify(t) !== TWEAK_DEFAULTS_JSON;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(WaterTrail, {
    t: t
  }), /*#__PURE__*/React.createElement(TweaksPanel, {
    title: "Water"
  }, /*#__PURE__*/React.createElement(TweakSection, {
    label: "Ripple"
  }, /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Strength",
    value: t.strength,
    min: 50,
    max: 800,
    step: 50,
    onChange: v => setTweak('strength', v)
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Radius",
    value: t.radius,
    min: 1,
    max: 8,
    step: 1,
    unit: "px",
    onChange: v => setTweak('radius', v)
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Damping",
    value: t.damping,
    min: 0.90,
    max: 0.99,
    step: 0.01,
    onChange: v => setTweak('damping', v)
  })), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Interaction"
  }, /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Rate",
    value: t.rate,
    min: 1,
    max: 30,
    step: 1,
    unit: "px",
    onChange: v => setTweak('rate', v)
  })), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Quality"
  }, /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Resolution",
    value: t.resolution,
    min: 2,
    max: 5,
    step: 1,
    onChange: v => setTweak('resolution', v)
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
      ...TWEAK_DEFAULTS
    })
  }))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
