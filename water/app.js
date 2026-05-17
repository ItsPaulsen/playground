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
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(WaterTrail, {
    t: t
  }), /*#__PURE__*/React.createElement(TweaksPanel, {
    title: "Water"
  }, /*#__PURE__*/React.createElement(TweakSection, {
    label: "Ripple"
  }, /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Specular",
    value: t.specular,
    min: 0,
    max: 3,
    step: 0.1,
    onChange: v => setTweak('specular', v)
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Intensity",
    value: t.intensity,
    min: 0.1,
    max: 3,
    step: 0.1,
    onChange: v => setTweak('intensity', v)
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Radius",
    value: t.radius,
    min: 0.01,
    max: 0.2,
    step: 0.01,
    onChange: v => setTweak('radius', v)
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Viscosity",
    value: t.viscosity,
    min: 0.9,
    max: 0.999,
    step: 0.001,
    onChange: v => setTweak('viscosity', v)
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
