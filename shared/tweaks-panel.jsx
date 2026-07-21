
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// ─────────────────────────────────────────────────────────────────────────────

// Fallback for pages that omit the <link data-twk-css> tag in <head>.
// Consumer pages should include it statically to avoid a flash on first paint.
(function () {
  if (document.querySelector('link[data-twk-css]')) return;
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/shared/tweaks-panel.css';
  link.setAttribute('data-twk-css', '1');
  document.head.appendChild(link);
})();

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
const MOBILE = 639;
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits : { [keyOrEdits]: val };
    setValues((prev) => ({ ...prev, ...edits }));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', { detail: edits }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
const FILTER_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 5H3" /><path d="M12 19H3" /><path d="M14 3v4" />
    <path d="M16 17v4" /><path d="M21 12h-9" /><path d="M21 19h-5" />
    <path d="M21 5h-7" /><path d="M8 10v4" /><path d="M8 12H3" />
  </svg>
);
function TweaksPanel({ title = 'Tweaks', noDeckControls = false, children, onOpenChange, renderMobileFooter }) {
  const [open, setOpen] = React.useState(() => window.parent === window && window.innerWidth > MOBILE);
  const [closing, setClosing] = React.useState(false);
  const [openGuard, setOpenGuard] = React.useState(false);
  const panelRef = React.useRef(null);
  const backdropRef = React.useRef(null);
  const dragInfo = React.useRef({ active: false, startY: 0, points: [] });
  const closeTimerRef = React.useRef(null);
  const fabGuardRef = React.useRef(false);
  React.useEffect(() => { onOpenChange && onOpenChange(open); }, [open, onOpenChange]);
  // Auto-inject a rail toggle when a <deck-stage> is on the page. The
  // toggle drives the deck's per-viewer _railVisible via window message;
  // state is mirrored from the same localStorage key the deck reads so
  // the control reflects reality across reloads. The mechanism is the
  // message — authors who want custom placement can post it directly
  // and pass noDeckControls to suppress this one.
  const hasDeckStage = React.useMemo(
    () => typeof document !== 'undefined' && !!document.querySelector('deck-stage'),
    [],
  );
  // Hide the toggle until the host has actually enabled the rail (the
  // __omelette_rail_enabled window message, posted only when the
  // omelette_deck_rail_enabled flag is on for this user). The initial read
  // covers TweaksPanel mounting after the message already arrived; the
  // listener covers the common case of mounting first.
  const [railEnabled, setRailEnabled] = React.useState(
    () => hasDeckStage && !!document.querySelector('deck-stage')?._railEnabled,
  );
  React.useEffect(() => {
    if (!hasDeckStage || railEnabled) return undefined;
    const onMsg = (e) => {
      if (e.data && e.data.type === '__omelette_rail_enabled') setRailEnabled(true);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [hasDeckStage, railEnabled]);
  const [railVisible, setRailVisible] = React.useState(() => {
    try { return localStorage.getItem('deck-stage.railVisible') !== '0'; } catch (e) { return true; }
  });
  const toggleRail = (on) => {
    setRailVisible(on);
    window.postMessage({ type: '__deck_rail_visible', on }, '*');
  };
  React.useEffect(() => {
    const onMsg = (e) => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);
      else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  React.useEffect(() => {
    let wasMobile = window.innerWidth <= MOBILE;
    const onResize = () => {
      const isMobile = window.innerWidth <= MOBILE;
      if (!wasMobile && isMobile) setOpen(false);
      wasMobile = isMobile;
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const dismiss = () => {
    setClosing(true);
    // Fade the backdrop out during the close so its last painted frame is
    // transparent before it unmounts. iOS Safari tints the area behind the
    // address bar by sampling the page's top pixels, and it keeps a stale
    // sample when a still-opaque overlay disappears in one frame — the tint
    // would stick after the sheet closed. !important because the drag path
    // sets inline opacity the same way.
    // The fade MUST finish before the unmount: the panel's close animation is
    // .2s and handleAnimEnd unmounts on it, so keep this shorter (.15s) or the
    // backdrop gets yanked mid-fade — still opaque — and the tint sticks.
    if (backdropRef.current) {
      backdropRef.current.style.transition = 'opacity .15s ease';
      backdropRef.current.style.setProperty('opacity', '0', 'important');
    }
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setClosing(false);
      setOpen(false);
    }, 350);
    window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
  };
  const onDragStart = (e) => {
    if (window.innerWidth > MOBILE) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    const now = performance.now();
    const sheetH = panelRef.current ? panelRef.current.offsetHeight : window.innerHeight;
    dragInfo.current = { active: true, startY: e.clientY, sheetH, points: [{ y: e.clientY, t: now }] };
    document.documentElement.classList.add('twk-dragging');
    if (panelRef.current) {
      panelRef.current.style.willChange = 'transform';
      panelRef.current.style.setProperty('transition', 'none', 'important');
    }
    if (backdropRef.current) backdropRef.current.style.transition = 'none';
  };
  const onDragMove = (e) => {
    if (!dragInfo.current.active) return;
    const now = performance.now();
    const dy = e.clientY - dragInfo.current.startY;
    const pts = dragInfo.current.points;
    pts.push({ y: e.clientY, t: now });
    while (pts.length > 1 && now - pts[0].t > 200) pts.shift();
    if (panelRef.current) {
      const raw = dy >= 0 ? dy : dy * 0.25;
      panelRef.current.style.setProperty('transform', `translateX(-50%) translateY(${raw}px)`, 'important');
    }
    if (backdropRef.current) {
      backdropRef.current.style.setProperty('opacity', String(Math.max(0, 1 - Math.max(0, dy) / dragInfo.current.sheetH)), 'important');
    }
  };
  const onDragEnd = (e) => {
    if (!dragInfo.current.active) return;
    dragInfo.current.active = false;
    document.documentElement.classList.remove('twk-dragging');
    if (panelRef.current) panelRef.current.style.willChange = '';
    const snapBack = () => {
      if (panelRef.current) {
        panelRef.current.style.setProperty('transition', 'transform 0.4s cubic-bezier(.16,1,.3,1)', 'important');
        panelRef.current.style.setProperty('transform', 'translateX(-50%) translateY(0px)', 'important');
      }
      if (backdropRef.current) {
        backdropRef.current.style.transition = 'opacity 0.4s cubic-bezier(.16,1,.3,1)';
        backdropRef.current.style.setProperty('opacity', '1', 'important');
      }
    };
    if (e.type === 'pointercancel') { snapBack(); return; }
    const raw = Math.max(0, e.clientY - dragInfo.current.startY);
    const pts = dragInfo.current.points;
    const cutoff = performance.now() - 100;
    const recent = pts.filter(p => p.t >= cutoff);
    let vel = 0;
    if (recent.length >= 2) {
      const first = recent[0], last = recent[recent.length - 1];
      const dt = last.t - first.t;
      if (dt > 0) vel = (last.y - first.y) / dt;
    }
    if (vel > 0.5 || raw > 120) {
      fabGuardRef.current = true;
      setTimeout(() => { fabGuardRef.current = false; }, 500);
      dismiss();
    } else {
      snapBack();
    }
  };
  const handleAnimEnd = (e) => {
    if (e.animationName === 'twk-out' || e.animationName === 'twk-out-mob') {
      clearTimeout(closeTimerRef.current);
      setClosing(false);
      setOpen(false);
    }
  };

  const openPanel = () => {
    if (fabGuardRef.current) return;
    setOpen(true);
    setOpenGuard(true);
    setTimeout(() => setOpenGuard(false), 350);
  };
  // touchend fires before iOS ghost-click synthesis; preventDefault() suppresses the click.
  const openPanelTouch = (e) => { e.preventDefault(); openPanel(); };

  return ReactDOM.createPortal(
    <>
      {open && (
        <div ref={backdropRef} className="twk-backdrop" onPointerDown={dismiss} style={closing || openGuard ? {pointerEvents:'none'} : undefined} />
      )}
      {open && (
        <div ref={panelRef} className={`twk-panel twk-opening${closing ? ' twk-closing' : ''}`} data-noncommentable="" onAnimationEnd={handleAnimEnd}>
          <div className="twk-hd" onPointerDown={onDragStart} onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerCancel={onDragEnd}>
            <b>{title}</b>
            <span className="twk-hd-spacer" aria-hidden="true" />
          </div>
          <div className="twk-body">
            {children}
            {hasDeckStage && railEnabled && !noDeckControls && (
              <TweakSection label="Deck">
                <TweakToggle label="Thumbnail rail" value={railVisible} onChange={toggleRail} />
              </TweakSection>
            )}
          </div>
          {renderMobileFooter && (
            <div className="twk-footer">
              {renderMobileFooter(dismiss)}
            </div>
          )}
          <button className="twk-x" aria-label="Close tweaks" onClick={dismiss}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
      )}
      {/* Always in DOM; hidden (data-hidden) while the panel is open — and it
          stays open through the close animation, so the button only reappears
          once the panel is gone. CSS makes hiding instant and showing a fade,
          so it never flashes over the opening panel but eases back in on close. */}
      <button className="twk-reopen" aria-label="Open tweaks"
        onTouchEnd={openPanelTouch} onClick={openPanel}
        data-hidden={open ? '1' : undefined}>
        {FILTER_ICON}
      </button>
      <button className="twk-fab" aria-label="Open tweaks"
        onTouchEnd={openPanelTouch} onClick={openPanel}
        data-hidden={open ? '1' : undefined}>
        {FILTER_ICON}
        Filter
      </button>
    </>,
    document.body
  );
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({ label, children }) {
  return (
    <>
      {label && <div className="twk-sect">{label}</div>}
      {children}
    </>
  );
}

function TweakRow({ label, value, children, inline = false }) {
  return (
    <div className={inline ? 'twk-row twk-row-h' : 'twk-row'}>
      {label && (
        <div className="twk-lbl">
          <span>{label}</span>
          {value != null && <span className="twk-val">{value}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Controls ────────────────────────────────────────────────────────────────

const SLIDER_KEY_DIRS = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 };

function TweakSlider({ label, value: rawValue, min = 0, max = 100, step = 1, unit = '', onChange }) {
  const value = Number(rawValue);
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const barRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);

  const compute = (clientX) => {
    const rect = barRef.current.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = min + p * (max - min);
    const snapped = Math.round(raw / step) * step;
    const decimals = (String(step).split('.')[1] || '').length;
    return Number(snapped.toFixed(decimals));
  };

  const onPointerDown = (e) => {
    barRef.current.setPointerCapture(e.pointerId);
    setDragging(true);
    onChange(compute(e.clientX));
  };
  const onPointerMove = (e) => {
    if (e.buttons === 0) return;
    onChange(compute(e.clientX));
  };
  const onPointerUp = () => setDragging(false);

  const onKeyDown = (e) => {
    if (!(e.key in SLIDER_KEY_DIRS)) return;
    e.preventDefault();
    const decimals = (String(step).split('.')[1] || '').length;
    const next = Math.max(min, Math.min(max, Number((value + SLIDER_KEY_DIRS[e.key] * step).toFixed(decimals))));
    onChange(next);
  };

  return (
    <div className="twk-bar-row">
      <span className="twk-bar-lbl">{label}{unit ? ` (${unit})` : ''}</span>
      <div ref={barRef} className="twk-bar"
           tabIndex={0} role="slider"
           aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value}
           style={{ cursor: dragging ? 'grabbing' : 'grab' }}
           onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
           onKeyDown={onKeyDown}>
        <div className="twk-bar-fill" style={{ width: pct + '%' }} />
        <span className="twk-bar-val twk-bar-val--fill" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}>{value}</span>
        <span className="twk-bar-val twk-bar-val--track" style={{ clipPath: `inset(0 0 0 ${pct}%)` }}>{value}</span>
      </div>
    </div>
  );
}

function TweakToggle({ label, value, onChange }) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl"><span>{label}</span></div>
      <button type="button" className="twk-toggle" data-on={value ? '1' : '0'}
              role="switch" aria-checked={!!value}
              onClick={() => onChange(!value)}><i /></button>
    </div>
  );
}

function TweakRadio({ label, value, options, onChange }) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = (o) => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({ 2: 16, 3: 10 }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = (s) => {
      const m = options.find((o) => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return <TweakSelect label={label} value={value} options={options}
                        onChange={(s) => onChange(resolve(s))} />;
  }
  const opts = options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));
  const idx = Math.max(0, opts.findIndex((o) => o.value === value));
  const n = opts.length;

  const segAt = (clientX) => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 6;
    const i = Math.floor(((clientX - r.left - 3) / inner) * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };

  const onPointerDown = (e) => {
    trackRef.current.setPointerCapture(e.pointerId);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
  };
  const onPointerMove = (e) => {
    if (e.buttons === 0) return;
    setDragging(true);
    const v = segAt(e.clientX);
    if (v !== valueRef.current) onChange(v);
  };
  const onPointerUp = () => setDragging(false);

  return (
    <TweakRow label={label}>
      <div ref={trackRef} role="radiogroup"
           onPointerDown={onPointerDown}
           onPointerMove={onPointerMove}
           onPointerUp={onPointerUp}
           className={dragging ? 'twk-seg dragging' : 'twk-seg'}>
        <div className="twk-seg-thumb"
             style={{ left: `calc(3px + ${idx} * (100% - 6px) / ${n})`,
                      width: `calc((100% - 6px) / ${n})` }} />
        {opts.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={o.value === value}>
            {o.label}
          </button>
        ))}
      </div>
    </TweakRow>
  );
}

function TweakSelect({ label, value, options, onChange }) {
  return (
    <TweakRow label={label}>
      <select className="pg-input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => {
          const v = typeof o === 'object' ? o.value : o;
          const l = typeof o === 'object' ? o.label : o;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </TweakRow>
  );
}

function TweakText({ label, value, placeholder, onChange }) {
  return (
    <TweakRow label={label}>
      <input className="pg-input" type="text" value={value} placeholder={placeholder}
             onChange={(e) => onChange(e.target.value)} />
    </TweakRow>
  );
}


// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}

const __TwkCheck = ({ light }) => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
       stroke={light ? 'rgba(0,0,0,.78)' : '#fff'}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function __hexToRgb(hex) {
  return { r: parseInt(hex.slice(1,3),16), g: parseInt(hex.slice(3,5),16), b: parseInt(hex.slice(5,7),16) };
}
function __hexToHsl(hex) {
  const {r,g,b}=__hexToRgb(hex);
  const r1=r/255,g1=g/255,b1=b/255;
  const max=Math.max(r1,g1,b1),min=Math.min(r1,g1,b1);
  const l=(max+min)/2;
  if(max===min) return {h:0,s:0,l:+(l*100).toFixed(1)};
  const d=max-min,s=l>.5?d/(2-max-min):d/(max+min);
  let h=max===r1?((g1-b1)/d+(g1<b1?6:0))/6:max===g1?((b1-r1)/d+2)/6:((r1-g1)/d+4)/6;
  return {h:Math.round(h*360),s:+(s*100).toFixed(1),l:+(l*100).toFixed(1)};
}
function __hexToOklch(hex) {
  const {r,g,b}=__hexToRgb(hex);
  const lin=c=>{c/=255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4};
  const rl=lin(r),gl=lin(g),bl=lin(b);
  const l_=Math.cbrt(.4122214708*rl+.5363325363*gl+.0514459929*bl);
  const m_=Math.cbrt(.2119034982*rl+.6806995451*gl+.1073969566*bl);
  const s_=Math.cbrt(.0883024619*rl+.2817188376*gl+.6299787005*bl);
  const L=.2104542553*l_+.7936177850*m_-.0040720468*s_;
  const a=1.9779984951*l_-2.4285922050*m_+.4505937099*s_;
  const b2=.0259040371*l_+.7827717662*m_-.8086757660*s_;
  const C=Math.sqrt(a*a+b2*b2);
  let H=Math.atan2(b2,a)*180/Math.PI;
  if(H<0)H+=360;
  return {L,C,H};
}
function __fmtColor(hex,fmt) {
  if(fmt==='hex') return hex;
  const {r,g,b}=__hexToRgb(hex);
  if(fmt==='rgb') return `rgb(${r} ${g} ${b})`;
  if(fmt==='hsl'){const{h,s,l}=__hexToHsl(hex);return `hsl(${h} ${s}% ${l}%)`;}
  if(fmt==='oklch'){const{L,C,H}=__hexToOklch(hex);return `oklch(${+L.toFixed(2)} ${+C.toFixed(3)} ${+H.toFixed(1)})`;}
  return hex;
}

function __hexToHsv(hex) {
  const {r:r255,g:g255,b:b255} = __hexToRgb(hex);
  const r=r255/255, g=g255/255, b=b255/255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min;
  let h=0, s=max===0?0:d/max, v=max;
  if (d) switch(max){case r:h=((g-b)/d+(g<b?6:0))/6;break;case g:h=((b-r)/d+2)/6;break;case b:h=((r-g)/d+4)/6;break;}
  return {h:h*360, s:s*100, v:v*100};
}

function __hsvToHex(h,s,v) {
  h/=360; s/=100; v/=100;
  const i=Math.floor(h*6), f=h*6-i, p=v*(1-s), q=v*(1-f*s), t=v*(1-(1-f)*s);
  let r,g,b;
  switch(i%6){case 0:r=v;g=t;b=p;break;case 1:r=q;g=v;b=p;break;case 2:r=p;g=v;b=t;break;case 3:r=p;g=q;b=v;break;case 4:r=t;g=p;b=v;break;case 5:r=v;g=p;b=q;break;}
  return '#'+[r,g,b].map(x=>Math.round(x*255).toString(16).padStart(2,'0')).join('');
}

const FMT_CYCLE = ['oklch','hex','rgb','hsl'];
function __ColorPickerDropdown({ hex, onHexChange, anchorRef, onClose }) {
  const isMobile = window.innerWidth <= MOBILE;
  const [hsv, setHsv] = React.useState(() => __hexToHsv(hex));
  const [localHex, setLocalHex] = React.useState(hex);
  const svRef = React.useRef(null);
  const hueRef = React.useRef(null);
  const dropRef = React.useRef(null);
  const [pos, setPos] = React.useState(null);

  React.useEffect(() => {
    if (isMobile) { setPos({}); return; }
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const H = 220, W = 212;
    const above = window.innerHeight - rect.bottom < H;
    const centeredLeft = rect.left + rect.width / 2 - W / 2;
    setPos({
      top: above ? rect.top - H - 6 : rect.bottom + 6,
      left: Math.max(8, Math.min(centeredLeft, window.innerWidth - W - 8)),
    });
  }, []);

  React.useEffect(() => {
    if (isMobile) return;
    const close = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target) && anchorRef.current && !anchorRef.current.contains(e.target))
        onClose();
    };
    const closeScroll = () => onClose();
    document.addEventListener('pointerdown', close);
    window.addEventListener('scroll', closeScroll, true);
    return () => { document.removeEventListener('pointerdown', close); window.removeEventListener('scroll', closeScroll, true); };
  }, []);

  const emit = (h, s, v) => {
    setHsv({h, s, v});
    const newHex = __hsvToHex(h, s, v);
    setLocalHex(newHex);
    if (!isMobile) onHexChange(newHex);
  };
  const dragSV = (cx, cy) => {
    const r = svRef.current.getBoundingClientRect();
    emit(hsv.h, Math.max(0,Math.min(100,((cx-r.left)/r.width)*100)), Math.max(0,Math.min(100,100-((cy-r.top)/r.height)*100)));
  };
  const dragHue = (cx) => {
    const r = hueRef.current.getBoundingClientRect();
    emit(Math.max(0,Math.min(360,((cx-r.left)/r.width)*360)), hsv.s, hsv.v);
  };

  if (!pos) return null;

  const picker = (
    <div ref={dropRef} className="twk-cpick twk-panel" style={isMobile ? {} : {top:pos.top, left:pos.left}}>
      <div ref={svRef} className="twk-cpick-sv" style={{background:`hsl(${hsv.h},100%,50%)`}}
           onPointerDown={(e)=>{e.currentTarget.setPointerCapture(e.pointerId);dragSV(e.clientX,e.clientY);}}
           onPointerMove={(e)=>{if(e.buttons)dragSV(e.clientX,e.clientY);}}>
        <div className="twk-cpick-sv-white"/>
        <div className="twk-cpick-sv-black"/>
        <div className="twk-cpick-sv-thumb" style={{left:`${hsv.s}%`,top:`${100-hsv.v}%`}}/>
      </div>
      <div ref={hueRef} className="twk-cpick-hue"
           onPointerDown={(e)=>{e.currentTarget.setPointerCapture(e.pointerId);dragHue(e.clientX);}}
           onPointerMove={(e)=>{if(e.buttons)dragHue(e.clientX);}}>
        <div className="twk-cpick-hue-thumb" style={{left:`${hsv.h/360*100}%`}}/>
      </div>
      {isMobile && (
        <div style={{display:'flex',gap:'8px',marginTop:'8px'}}>
          <button className="twk-btn secondary" onClick={onClose}>Cancel</button>
          <button className="twk-btn" onClick={() => { onHexChange(localHex); onClose(); }}>Save</button>
        </div>
      )}
    </div>
  );

  return ReactDOM.createPortal(
    isMobile ? <>{<div className="twk-backdrop twk-cpick-overlay" onClick={onClose} />}{picker}</> : picker,
    document.body
  );
}

function __parseColor(value) {
  if (!value) return { hex: '#000000', opacity: 100 };
  const m = String(value).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (m) {
    const hex = '#' + [m[1], m[2], m[3]].map((v) => parseInt(v).toString(16).padStart(2, '0')).join('');
    const opacity = m[4] !== undefined ? Math.round(parseFloat(m[4]) * 100) : 100;
    return { hex, opacity };
  }
  return { hex: value, opacity: 100 };
}

function __toColorString(hex, opacity) {
  if (opacity >= 100) return hex;
  const {r,g,b} = __hexToRgb(hex);
  return `rgba(${r},${g},${b},${(opacity / 100).toFixed(2)})`;
}

function __TweakColorInput({ label, value, onChange, noAlpha }) {
  const parsed = __parseColor(value);
  const [hex, setHex] = React.useState(parsed.hex);
  const [opacity, setOpacity] = React.useState(parsed.opacity);
  const [opacityStr, setOpacityStr] = React.useState(String(parsed.opacity));
  const [showPicker, setShowPicker] = React.useState(false);
  const swatchRef = React.useRef(null);

  const committedRef = React.useRef(value);

  React.useEffect(() => {
    if (value === committedRef.current) return;
    committedRef.current = value;
    const p = __parseColor(value);
    setHex(p.hex);
    setOpacity(p.opacity);
    setOpacityStr(String(p.opacity));
  }, [value]);

  const commitColor = (h, o) => {
    const str = __toColorString(h, o);
    committedRef.current = str;
    onChange(str);
  };

  const onHexChange = (e) => {
    // input shows digits only; strip a pasted "#" and cap at 6
    const digits = e.target.value.replace(/#/g, '').slice(0, 6);
    const full = '#' + digits;
    setHex(full);
    if (/^#[0-9a-fA-F]{6}$/.test(full)) commitColor(full, opacity);
  };

  const onOpacityChange = (e) => {
    setOpacityStr(e.target.value);
    const n = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
    setOpacity(n);
    if (/^\d+$/.test(e.target.value)) commitColor(hex, n);
  };

  const onOpacityBlur = () => setOpacityStr(String(opacity));

  // Scrubby slider on the "%" label: drag left/right to change opacity. The number
  // field itself stays a plain text input for typing.
  const opacityRef = React.useRef(null);
  const pctRef = React.useRef(null);
  const scrub = React.useRef(null);
  const onPctPointerDown = (e) => {
    if (e.button !== 0) return;
    scrub.current = { startX: e.clientX, startVal: opacity, id: e.pointerId };
    if (opacityRef.current) opacityRef.current.blur();
    try { pctRef.current.setPointerCapture(e.pointerId); } catch (_) {}
    document.body.style.cursor = 'ew-resize';
  };
  const onPctPointerMove = (e) => {
    const s = scrub.current;
    if (!s) return;
    const n = Math.max(0, Math.min(100, Math.round(s.startVal + (e.clientX - s.startX))));
    setOpacity(n);
    setOpacityStr(String(n));
    commitColor(hex, n);
  };
  const onPctPointerUp = () => {
    if (scrub.current) document.body.style.cursor = '';
    scrub.current = null;
  };

  const row = (
    <div className="twk-color-row">
      <div ref={swatchRef} className="twk-color-preview" style={{ background: hex }}
           onClick={() => setShowPicker(v => !v)} />
      <div className="twk-color-main">
        <input className="twk-color-hex" type="text" value={hex.replace(/^#/, '')}
               onChange={onHexChange} spellCheck={false} />
      </div>
      {!noAlpha && (
        <div className="twk-color-opacity">
          <input ref={opacityRef} className="twk-color-opacity-input" type="text" value={opacityStr}
                 onChange={onOpacityChange} onBlur={onOpacityBlur} />
          <span ref={pctRef} className="twk-color-opacity-pct"
                style={{ cursor: 'ew-resize', touchAction: 'none', userSelect: 'none' }}
                onPointerDown={onPctPointerDown} onPointerMove={onPctPointerMove} onPointerUp={onPctPointerUp}>%</span>
        </div>
      )}
      {'EyeDropper' in window && (
        <button type="button" className="twk-color-pick" onClick={() => {
          new window.EyeDropper().open().then((r) => {
            setHex(r.sRGBHex);
            commitColor(r.sRGBHex, opacity);
          }).catch(() => {});
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 9-8.414 8.414A2 2 0 0 0 3 18.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 3.828 21h1.344a2 2 0 0 0 1.414-.586L15 12"/>
            <path d="m18 9 .4.4a1 1 0 1 1-3 3l-3.8-3.8a1 1 0 1 1 3-3l.4.4 3.4-3.4a1 1 0 1 1 3 3z"/>
            <path d="m2 22 .414-.414"/>
          </svg>
        </button>
      )}
      {showPicker && (
        <__ColorPickerDropdown
          hex={hex}
          onHexChange={(h) => { setHex(h); commitColor(h, opacity); }}
          anchorRef={swatchRef}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );

  if (!label) return row;
  return (
    <div className="twk-bar-row">
      <span className="twk-bar-lbl">{label}</span>
      {row}
    </div>
  );
}

function TweakColor({ label, value, options, onChange, noAlpha }) {
  if (!options || !options.length) {
    return <__TweakColorInput label={label} value={value} onChange={onChange} noAlpha={noAlpha} />;
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = (o) => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return (
    <TweakRow label={label}>
      <div className="twk-chips" role="radiogroup">
        {options.map((o, i) => {
          const colors = Array.isArray(o) ? o : [o];
          const [hero, ...rest] = colors;
          const sup = rest.slice(0, 4);
          const on = key(o) === cur;
          return (
            <button key={i} type="button" className="twk-chip" role="radio"
                    aria-checked={on} data-on={on ? '1' : '0'}
                    aria-label={colors.join(', ')} title={colors.join(' · ')}
                    style={{ background: hero }}
                    onClick={() => onChange(o)}>
              {sup.length > 0 && (
                <span>
                  {sup.map((c, j) => <i key={j} style={{ background: c }} />)}
                </span>
              )}
              {on && <__TwkCheck light={__twkIsLight(hero)} />}
            </button>
          );
        })}
      </div>
    </TweakRow>
  );
}

function TweakButton({ label, onClick, secondary = false, disabled = false }) {
  return (
    <button type="button" className={secondary ? 'twk-btn secondary' : 'twk-btn'}
            onClick={onClick} disabled={disabled}>{label}</button>
  );
}

Object.assign(window, {
  useTweaks, TweaksPanel, TweakSection, TweakRow,
  TweakSlider, TweakToggle, TweakRadio, TweakSelect,
  TweakText, TweakColor, TweakButton,
});
