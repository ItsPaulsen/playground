function SVGButton({
  label,
  color,
  sw,
  dur,
  onHoverChange
}) {
  const btnRef = React.useRef(null);
  const pathRef = React.useRef(null);
  const path2Ref = React.useRef(null);
  const gradRef = React.useRef(null);
  const posRef = React.useRef(0);
  const durRef = React.useRef(dur);
  const lastTimeRef = React.useRef(null);
  const [size, setSize] = React.useState({
    w: 0,
    h: 0
  });
  React.useEffect(() => {
    durRef.current = dur;
  }, [dur]);
  React.useEffect(() => {
    const el = btnRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const {
        width,
        height
      } = el.getBoundingClientRect();
      setSize({
        w: Math.round(width),
        h: Math.round(height)
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const {
    w,
    h
  } = size;
  const r = h > 0 ? h / 2 : 20;
  const ins = sw / 2;
  const pr = r - ins;
  const perim = w > 0 ? 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * pr : 0;
  const arcLen = perim * 0.28;
  const brightColor = `color-mix(in oklch, ${color} 55%, white)`;
  const pathD = w > 0 ? `M ${ins + pr} ${ins} H ${w - ins - pr} A ${pr} ${pr} 0 0 1 ${w - ins} ${ins + pr} V ${h - ins - pr} A ${pr} ${pr} 0 0 1 ${w - ins - pr} ${h - ins} H ${ins + pr} A ${pr} ${pr} 0 0 1 ${ins} ${h - ins - pr} V ${ins + pr} A ${pr} ${pr} 0 0 1 ${ins + pr} ${ins} Z` : '';
  React.useEffect(() => {
    const path = pathRef.current;
    const grad = gradRef.current;
    if (!path || !grad || perim === 0) return;
    let rafId;
    function tick(now) {
      if (lastTimeRef.current !== null) {
        const delta = now - lastTimeRef.current;
        const pxPerMs = perim / (durRef.current * 1000);
        posRef.current = (posRef.current + delta * pxPerMs) % perim;
      }
      lastTimeRef.current = now;
      const arcPos = posRef.current;
      path.style.strokeDashoffset = -arcPos;
      if (path2Ref.current) path2Ref.current.style.strokeDashoffset = -arcPos;
      const p1 = path.getPointAtLength(arcPos);
      const p2 = path.getPointAtLength((arcPos + arcLen) % perim);
      grad.setAttribute('x1', p1.x);
      grad.setAttribute('y1', p1.y);
      grad.setAttribute('x2', p2.x);
      grad.setAttribute('y2', p2.y);
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [perim, arcLen]);
  return /*#__PURE__*/React.createElement("div", {
    className: "btn-svg-wrap",
    style: {
      display: 'inline-block'
    },
    onMouseEnter: () => onHoverChange && onHoverChange(true),
    onMouseLeave: () => onHoverChange && onHoverChange(false)
  }, /*#__PURE__*/React.createElement("button", {
    ref: btnRef,
    className: "agent-btn"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      zIndex: 1
    }
  }, label), w > 0 && /*#__PURE__*/React.createElement("svg", {
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      overflow: 'visible'
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    ref: gradRef,
    id: "arc-grad",
    gradientUnits: "userSpaceOnUse"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: color,
    stopOpacity: 0
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "50%",
    stopColor: brightColor
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: color,
    stopOpacity: 0
  })), /*#__PURE__*/React.createElement("filter", {
    id: "svg-glow",
    x: "-50%",
    y: "-50%",
    width: "200%",
    height: "200%"
  }, /*#__PURE__*/React.createElement("feGaussianBlur", {
    stdDeviation: "5",
    result: "blur"
  }), /*#__PURE__*/React.createElement("feMerge", null, /*#__PURE__*/React.createElement("feMergeNode", {
    in: "blur"
  }), /*#__PURE__*/React.createElement("feMergeNode", {
    in: "SourceGraphic"
  })))), /*#__PURE__*/React.createElement("path", {
    d: pathD,
    fill: "none",
    style: {
      stroke: 'var(--btn-ring)'
    },
    strokeWidth: sw
  }), /*#__PURE__*/React.createElement("path", {
    ref: pathRef,
    d: pathD,
    fill: "none",
    stroke: "url(#arc-grad)",
    strokeWidth: sw,
    strokeDasharray: `${arcLen} ${perim - arcLen}`
  }), /*#__PURE__*/React.createElement("path", {
    ref: path2Ref,
    d: pathD,
    fill: "none",
    stroke: "url(#arc-grad)",
    strokeWidth: sw,
    strokeDasharray: `${arcLen} ${perim - arcLen}`
  }))));
}
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "label": "Button",
  "color": "#1d4ed8",
  "speed": 3,
  "thickness": 2
} /*EDITMODE-END*/;
const TWEAK_DEFAULTS_JSON = JSON.stringify(TWEAK_DEFAULTS);
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [panelOpen, setPanelOpen] = React.useState(() => window.innerWidth > 639);
  const [hovered, setHovered] = React.useState(false);
  const isDirty = JSON.stringify(t) !== TWEAK_DEFAULTS_JSON;
  const baseDur = 6 - t.speed;
  const dur = hovered ? baseDur * 2 : baseDur;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "stage",
    id: "main-content"
  }, /*#__PURE__*/React.createElement(SVGButton, {
    label: t.label || 'Button',
    color: t.color,
    sw: t.thickness,
    dur: dur,
    onHoverChange: setHovered
  })), /*#__PURE__*/React.createElement(TweaksPanel, {
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
    onChange: v => setTweak('color', v),
    noAlpha: true
  })), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Border"
  }, /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Speed",
    value: t.speed,
    min: 1,
    max: 4,
    step: 1,
    onChange: v => setTweak('speed', v)
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Width",
    value: t.thickness,
    min: 1,
    max: 3,
    step: 1,
    unit: "px",
    onChange: v => setTweak('thickness', v)
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
