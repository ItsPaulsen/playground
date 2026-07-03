// Returns {x, y} at distance pos along a rounded-rect perimeter.
// Segments: top-edge, tr-arc, right-edge, br-arc, bottom-edge, bl-arc, left-edge, tl-arc.
function pointAtPerim(pos, w, h, ins, pr) {
  const segH = w - 2*ins - 2*pr;
  const segV = h - 2*ins - 2*pr;
  const arcL = Math.PI * pr / 2;
  const PI2  = Math.PI / 2;
  const segs = [segH, arcL, segV, arcL, segH, arcL, segV, arcL];
  let i = 0;
  for (const len of segs) {
    if (pos < len || (len <= 0 && i < 7)) {
      if (len <= 0) { i++; continue; }
      const t = pos / len;
      switch (i) {
        case 0: return { x: ins+pr + t*segH,         y: ins };
        case 1: { const a = -PI2 + t*PI2; return { x: (w-ins-pr) + pr*Math.cos(a), y: (ins+pr)   + pr*Math.sin(a) }; }
        case 2: return { x: w-ins,                    y: ins+pr + t*segV };
        case 3: { const a =      t*PI2; return { x: (w-ins-pr) + pr*Math.cos(a), y: (h-ins-pr)   + pr*Math.sin(a) }; }
        case 4: return { x: (w-ins-pr) - t*segH,     y: h-ins };
        case 5: { const a =  PI2 + t*PI2; return { x: (ins+pr)   + pr*Math.cos(a), y: (h-ins-pr) + pr*Math.sin(a) }; }
        case 6: return { x: ins,                      y: (h-ins-pr) - t*segV };
        case 7: { const a = Math.PI + t*PI2; return { x: (ins+pr) + pr*Math.cos(a), y: (ins+pr)  + pr*Math.sin(a) }; }
      }
    }
    pos -= Math.max(len, 0);
    i++;
  }
  return { x: ins+pr, y: ins };
}

const SW = 2;

function SVGButton({ label, color, dur, onHoverChange }) {
  const btnRef   = React.useRef(null);
  const pathRef  = React.useRef(null);
  const gradRef  = React.useRef(null);
  const posRef   = React.useRef(0);
  const durRef   = React.useRef(dur);
  const lastTimeRef = React.useRef(null);
  const [size, setSize] = React.useState({ w: 0, h: 0 });

  React.useEffect(() => { durRef.current = dur; }, [dur]);

  const measureSize = React.useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    el.style.width = '';
    const { width, height } = el.getBoundingClientRect();
    const w = Math.ceil(width);
    const h = Math.ceil(height);
    el.style.width = w + 'px';
    setSize({ w, h });
  }, []);

  React.useEffect(() => {
    const el = btnRef.current;
    if (!el) return;
    const ro = new ResizeObserver(measureSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measureSize]);

  React.useEffect(() => { measureSize(); }, [label, measureSize]);

  const { w, h } = size;
  const ins  = SW / 2;
  const r    = h > 0 ? h / 2 : 20;
  const pr   = r - ins;
  const perim  = w > 0 ? 2 * (w - 2*r) + 2 * (h - 2*r) + 2 * Math.PI * pr : 0;
  const arcLen = perim * 0.28;
  const brightColor = `color-mix(in oklch, ${color} 55%, white)`;

  const pathD = w > 0
    ? `M ${ins+pr} ${ins} H ${w-ins-pr} A ${pr} ${pr} 0 0 1 ${w-ins} ${ins+pr} V ${h-ins-pr} A ${pr} ${pr} 0 0 1 ${w-ins-pr} ${h-ins} H ${ins+pr} A ${pr} ${pr} 0 0 1 ${ins} ${h-ins-pr} V ${ins+pr} A ${pr} ${pr} 0 0 1 ${ins+pr} ${ins} Z`
    : '';

  React.useEffect(() => {
    const path = pathRef.current;
    const grad = gradRef.current;
    if (!path || !grad || perim === 0) return;
    let rafId;
    function tick(now) {
      if (lastTimeRef.current !== null) {
        const delta = now - lastTimeRef.current;
        posRef.current = (posRef.current + delta * perim / (durRef.current * 1000)) % perim;
      }
      lastTimeRef.current = now;
      const arcPos = posRef.current;
      path.style.strokeDashoffset = -arcPos;
      const p1 = pointAtPerim(arcPos, w, h, ins, pr);
      const p2 = pointAtPerim((arcPos + arcLen) % perim, w, h, ins, pr);
      grad.setAttribute('x1', p1.x);
      grad.setAttribute('y1', p1.y);
      grad.setAttribute('x2', p2.x);
      grad.setAttribute('y2', p2.y);
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [perim, arcLen]);

  return (
    <div className="btn-svg-wrap" style={{ display: 'inline-block' }}
      onMouseEnter={() => onHoverChange && onHoverChange(true)}
      onMouseLeave={() => onHoverChange && onHoverChange(false)}
    >
      <button ref={btnRef} className="agent-btn">
        <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
        {w > 0 && (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible', clipPath: 'inset(0 round 9999px)' }}>
            <defs>
              <linearGradient ref={gradRef} id="arc-grad" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={color} stopOpacity={0} />
                <stop offset="50%" stopColor={brightColor} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={pathD} fill="none" style={{ stroke: 'var(--btn-ring)' }} strokeWidth={SW} />
            <path ref={pathRef} d={pathD} fill="none"
              stroke="url(#arc-grad)" strokeWidth={SW}
              strokeDasharray={`${arcLen} ${perim - arcLen}`} />
          </svg>
        )}
      </button>
    </div>
  );
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "label": "Button",
  "color": "#1d4ed8",
  "speed": 4,
  "bgOn": false,
  "bgColor": "#ffffff"
}/*EDITMODE-END*/;

const TWEAK_DEFAULTS_JSON = JSON.stringify(TWEAK_DEFAULTS);

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [hovered, setHovered] = React.useState(false);
  const isDirty = JSON.stringify(t) !== TWEAK_DEFAULTS_JSON;

  React.useEffect(() => {
    if (t.bgOn) {
      document.body.style.background = t.bgColor;
      document.body.classList.remove('pg-dot-grid');
    } else {
      document.body.style.background = '';
      document.body.classList.add('pg-dot-grid');
    }
  }, [t.bgOn, t.bgColor]);
  const baseDur = 6 - t.speed * 0.5;
  const dur = hovered ? baseDur * 2 : baseDur;

  return (
    <>
      <div className="stage" id="main-content">
        <SVGButton
          label={t.label || 'Button'}
          color={t.color}
          dur={dur}
          onHoverChange={setHovered}
        />
      </div>

      <TweaksPanel title="Button"
        renderMobileFooter={(close) => (
          <>
            <TweakButton label="Reset" secondary disabled={!isDirty}
                         onClick={() => setTweak(TWEAK_DEFAULTS)} />
            <TweakButton label="Show" onClick={close} />
          </>
        )}
      >
        <TweakSection>
          <TweakText
            value={t.label}
            placeholder="Button label…"
            onChange={(v) => setTweak('label', v)}
          />
          <TweakColor value={t.color} onChange={(v) => setTweak('color', v)} noAlpha />
        </TweakSection>

        <TweakSection label="Background">
          <TweakToggle label="Custom" value={t.bgOn} onChange={(v) => setTweak('bgOn', v)} />
          {t.bgOn && <TweakColor label="Color" value={t.bgColor} onChange={(v) => setTweak('bgColor', v)} noAlpha />}
        </TweakSection>

        <TweakSection label="Spark">
          <TweakSlider label="Speed" value={t.speed} min={1} max={8} step={1}
                       onChange={(v) => setTweak('speed', v)} />
        </TweakSection>

        <div className="twk-desktop-only"
             style={{ display: 'flex', borderTop: '1px solid var(--bd)', marginTop: 8, paddingTop: 16 }}>
          <TweakButton label="Reset" secondary disabled={!isDirty}
                       onClick={() => setTweak(TWEAK_DEFAULTS)} />
        </div>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
