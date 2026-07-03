const TWEAK_DEFAULTS = {
  radius: 24,
  orientation: 'landscape',
  title: 'Lorem Ipsum',
  subtitle: 'Dolor sit amet consectetur adipiscing elit',
  gradient: true,
  color0: '#6366f1',
  color1: '#d946ef',
  bgOn: false,
  bgColor: '#ffffff'
};
const TWEAK_DEFAULTS_JSON = JSON.stringify(TWEAK_DEFAULTS);
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const isDirty = JSON.stringify(t) !== TWEAK_DEFAULTS_JSON;
  const [panelOpen, setPanelOpen] = React.useState(() => window.innerWidth > 639);
  const [isDesktop, setIsDesktop] = React.useState(() => window.innerWidth > 639);
  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const handler = e => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  React.useEffect(() => {
    if (t.bgOn) {
      document.body.style.background = t.bgColor;
      document.body.classList.remove('pg-dot-grid');
    } else {
      document.body.style.background = '';
      document.body.classList.add('pg-dot-grid');
    }
  }, [t.bgOn, t.bgColor]);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      paddingRight: panelOpen && isDesktop ? 300 : 0,
      transition: 'padding-right .35s cubic-bezier(.22,1,.36,1)'
    }
  }, /*#__PURE__*/React.createElement(CreditCard, {
    t: t
  })), /*#__PURE__*/React.createElement(TweaksPanel, {
    title: "Card",
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
  }, /*#__PURE__*/React.createElement(TweakSection, null, /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Radius",
    value: t.radius,
    min: 0,
    max: 48,
    step: 8,
    onChange: v => setTweak('radius', v)
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    value: t.orientation,
    options: [{
      value: 'landscape',
      label: 'Landscape'
    }, {
      value: 'portrait',
      label: 'Portrait'
    }],
    onChange: v => setTweak('orientation', v)
  })), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Content"
  }, /*#__PURE__*/React.createElement(TweakText, {
    label: "Title",
    value: t.title,
    onChange: v => setTweak('title', v)
  }), /*#__PURE__*/React.createElement(TweakText, {
    label: "Subtitle",
    value: t.subtitle,
    onChange: v => setTweak('subtitle', v)
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
  })), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Color"
  }, /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Gradient",
    value: t.gradient,
    onChange: v => setTweak('gradient', v)
  }), Array.from({
    length: t.gradient ? 2 : 1
  }, (_, i) => /*#__PURE__*/React.createElement(TweakColor, {
    key: i,
    label: `Color ${i + 1}`,
    value: t['color' + i],
    onChange: v => setTweak('color' + i, v),
    noAlpha: true
  }))), /*#__PURE__*/React.createElement("div", {
    className: "twk-desktop-only",
    style: {
      display: 'flex',
      gap: 8,
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
