const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "label": "Agent",
  "color": "#818cf8",
  "speed": 2.5,
  "glow": 55,
  "thickness": 2,
  "hoverOnly": false
} /*EDITMODE-END*/;
const TWEAK_DEFAULTS_JSON = JSON.stringify(TWEAK_DEFAULTS);
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [panelOpen, setPanelOpen] = React.useState(() => window.innerWidth > 639);
  const isDirty = JSON.stringify(t) !== TWEAK_DEFAULTS_JSON;
  const outerStyle = {
    '--spark': t.color,
    '--dur': `${t.speed}s`,
    '--glow-op': (t.glow / 100).toFixed(2),
    '--thick': `${t.thickness}px`
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "stage",
    id: "main-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: `btn-outer${t.hoverOnly ? ' hover-only' : ''}`,
    style: outerStyle
  }, /*#__PURE__*/React.createElement("div", {
    className: "btn-shell"
  }, /*#__PURE__*/React.createElement("button", {
    className: "agent-btn"
  }, t.label || 'Agent')))), /*#__PURE__*/React.createElement(TweaksPanel, {
    title: "Button",
    onOpenChange: setPanelOpen,
    renderMobileFooter: close => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(TweakButton, {
      label: "Reset",
      secondary: true,
      disabled: !isDirty,
      onClick: () => setTweak(TWEAK_DEFAULTS)
    }), /*#__PURE__*/React.createElement(TweakButton, {
      label: "Show",
      onClick: close
    }))
  }, /*#__PURE__*/React.createElement(TweakSection, null, /*#__PURE__*/React.createElement(TweakText, {
    value: t.label,
    placeholder: "Button label\u2026",
    onChange: v => setTweak('label', v)
  }), /*#__PURE__*/React.createElement(TweakColor, {
    value: t.color,
    onChange: v => setTweak('color', v)
  })), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Border"
  }, /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Speed",
    value: t.speed,
    min: 0.4,
    max: 8,
    step: 0.1,
    unit: "s",
    onChange: v => setTweak('speed', v)
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Width",
    value: t.thickness,
    min: 1,
    max: 6,
    step: 1,
    unit: "px",
    onChange: v => setTweak('thickness', v)
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Glow",
    value: t.glow,
    min: 0,
    max: 100,
    step: 5,
    unit: "%",
    onChange: v => setTweak('glow', v)
  }), /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Hover only",
    value: t.hoverOnly,
    onChange: v => setTweak('hoverOnly', v)
  })), /*#__PURE__*/React.createElement("div", {
    className: "twk-desktop-only",
    style: {
      display: 'flex',
      borderTop: '1px solid var(--bd)',
      marginTop: 8,
      paddingTop: 16
    }
  }, /*#__PURE__*/React.createElement(TweakButton, {
    label: "Reset",
    secondary: true,
    disabled: !isDirty,
    onClick: () => setTweak(TWEAK_DEFAULTS)
  }))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
