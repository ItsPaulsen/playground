const SEGMENTER = new Intl.Segmenter();

function hexToRgb(hex) {
  const h = (hex || '#ffffff').replace('#', '');
  const full = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(full.slice(0, 6), 16);
  if (isNaN(n)) return [128, 128, 128];
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}
function getEffectStyle(effect, color) {
  const [r, g, b] = hexToRgb(color);
  switch (effect) {
    case 'outline':
      return {
        WebkitTextStroke: `0.08em rgba(${r},${g},${b},.9)`,
        WebkitTextFillColor: 'var(--pg-bg)',
        paintOrder: 'stroke fill'
      };
    default:
      return {};
  }
}
function Typo({
  t,
  panelOpen
}) {
  const containerRef = React.useRef(null);
  const spansRef = React.useRef([]);
  const timeRef = React.useRef(0);
  const rafRef = React.useRef(null);
  const chars = React.useMemo(() => {
    const segs = [...SEGMENTER.segment(t.text || '')].map(s => s.segment).slice(0, 20);
    return segs.length ? segs : [' '];
  }, [t.text]);
  React.useLayoutEffect(() => {
    if (containerRef.current) {
      spansRef.current = Array.from(containerRef.current.querySelectorAll('.ty-char'));
    }
  }, [chars]);
  React.useEffect(() => {
    let last = null;
    const tick = now => {
      if (last === null) last = now;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      timeRef.current += dt * t.speed;
      const spans = spansRef.current;
      const n = spans.length;
      spans.forEach((span, i) => {
        const phase = n > 1 ? i / (n - 1) * Math.PI * 2 * t.spread : 0;
        const y = Math.sin(timeRef.current * Math.PI * 2 - phase) * t.amplitude;
        span.style.transform = `translateY(${y}px)`;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [t.speed, t.amplitude, t.spread]);
  const effectStyle = React.useMemo(() => getEffectStyle(t.fontEffect || 'flat', t.fontColor), [t.fontEffect, t.fontColor]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingRight: panelOpen ? '312px' : 0,
      transition: 'padding-right .3s cubic-bezier(.25,.46,.45,.94)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: containerRef,
    style: {
      display: 'flex',
      alignItems: 'center',
      fontSize: t.fontSize + 'px',
      fontWeight: t.fontWeight,
      fontStyle: t.fontStyle,
      fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
      color: t.fontColor,
      userSelect: 'none',
      lineHeight: 1
    }
  }, chars.map((char, i) => /*#__PURE__*/React.createElement("span", {
    key: i + '-' + char,
    className: "ty-char",
    style: {
      display: 'inline-block',
      whiteSpace: 'pre',
      marginRight: i < chars.length - 1 ? `${t.letterSpacing}px` : 0,
      ...effectStyle
    }
  }, char))));
}
