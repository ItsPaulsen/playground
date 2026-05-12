function Typo({ t, panelOpen }) {
  const containerRef = React.useRef(null);
  const timeRef     = React.useRef(0);
  const rafRef      = React.useRef(null);

  React.useEffect(() => {
    let last = null;

    const tick = (now) => {
      if (last === null) last = now;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      timeRef.current += dt * t.speed;

      const el = containerRef.current;
      if (el) {
        const spans = el.querySelectorAll('.ty-char');
        const n = spans.length;
        spans.forEach((span, i) => {
          const phase = n > 1 ? (i / (n - 1)) * Math.PI * 2 * t.spread : 0;
          const y = Math.sin(timeRef.current * Math.PI * 2 - phase) * t.amplitude;
          span.style.transform = `translateY(${y}px)`;
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [t.speed, t.amplitude, t.spread]);

  const segmenter = React.useMemo(() => new Intl.Segmenter(), []);
  const chars = React.useMemo(() => {
    const segs = [...segmenter.segment(t.text || '')].map(s => s.segment).slice(0, 20);
    return segs.length ? segs : [' '];
  }, [t.text, segmenter]);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      paddingRight: panelOpen ? '312px' : '0px',
      transition: 'padding-right .3s cubic-bezier(.25,.46,.45,.94)',
    }}>
      <div
        ref={containerRef}
        style={{
          display: 'flex', alignItems: 'center',
          fontSize:   t.fontSize   + 'px',
          fontWeight: t.fontWeight,
          fontStyle:  t.fontStyle,
          fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
          color:      t.fontColor,
          userSelect: 'none',
          lineHeight: 1,
        }}
      >
        {chars.map((char, i) => (
          <span
            key={i}
            className="ty-char"
            style={{
              display:     'inline-block',
              whiteSpace:  'pre',
              marginRight: i < chars.length - 1 ? `${t.letterSpacing}px` : 0,
            }}
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  );
}
