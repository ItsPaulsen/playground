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

const __TWEAKS_STYLE = `
  .twk-panel,.twk-reopen{
    --bg:rgba(253,253,251,.8);--text:rgb(28,25,23);--bd:rgba(28,25,23,.1);
    --label:rgba(28,25,23,.7);--val:rgba(28,25,23,.5);
    --sect:var(--val);
    --fld-bd:rgba(28,25,23,.15);--fld-bdf:rgba(28,25,23,.25);--fld-surf:rgba(28,25,23,.05);
    --scroll:var(--fld-bd);--scroll-h:var(--fld-bdf);
    --track:var(--fld-bd);--seg:var(--fld-bd);
    --tog-off:rgba(28,25,23,.3);--tog-handle:rgb(253,253,251);
    --btn:rgba(28,25,23,.85);--btn-t:rgb(253,253,251);--btn-h:rgba(28,25,23,.8);
    --sec:rgba(28,25,23,.15);--sec-h:rgba(28,25,23,.13);
    --bar-fill:rgba(28,25,23,.85);--bar-val:rgb(253,253,251);
  }
  html[data-theme="dark"] .twk-panel,
  html[data-theme="dark"] .twk-reopen{
    --bg:rgba(41,37,36,.8);--text:rgb(253,253,251);--bd:rgba(253,253,251,.1);
    --label:rgba(253,253,251,.7);--val:rgba(253,253,251,.5);
    --fld-bd:rgba(253,253,251,.15);--fld-bdf:rgba(253,253,251,.25);--fld-surf:rgba(253,253,251,.05);
    --tog-off:rgba(253,253,251,.3);
    --btn:rgba(253,253,251,.85);--btn-t:rgb(28,25,23);--btn-h:rgba(253,253,251,.8);
    --sec:rgba(253,253,251,.15);--sec-h:rgba(253,253,251,.13);
    --bar-fill:rgba(253,253,251,.85);--bar-val:rgb(28,25,23);
  }

  @keyframes twk-in  { from { opacity:0; translate:16px 0; } to { opacity:1; translate:0 0; } }
  @keyframes twk-out { from { opacity:1; translate:0 0; } to { opacity:0; translate:16px 0; } }

  .twk-panel{position:fixed;right:16px;top:calc(var(--header-h,0px) + 16px);
    animation:twk-in 1s cubic-bezier(.16,1,.3,1) both;z-index:9999;width:320px;
    max-height:calc(100vh - var(--header-h,0px) - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:top right;
    background:var(--bg);color:var(--text);
    backdrop-filter:blur(12px) saturate(180%);
    border:.5px solid var(--bd);border-radius:20px;
    box-shadow:0 8px 40px 0 rgba(0,0,0,0.12);
    font:12px/1.4 'Inter',ui-sans-serif,system-ui,sans-serif;overflow:hidden}
  .twk-panel.twk-closing{animation:twk-out .2s cubic-bezier(.4,0,1,1) both;pointer-events:none;}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:8px 8px 4px 16px}
  .twk-hd b{font-size:14px;font-weight:500;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(28,25,23,.8);
    width:36px;height:36px;border-radius:8px;cursor:pointer;font-size:13px;line-height:1;
    display:flex;align-items:center;justify-content:center}
  .twk-x:hover{color:var(--text)}
  html[data-theme="dark"] .twk-x{color:rgba(253,253,251,.8)}
  html[data-theme="dark"] .twk-x:hover{color:#fafaf9}
  .twk-body{padding:2px 16px 16px;display:flex;flex-direction:column;gap:8px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:var(--scroll) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:var(--scroll);border-radius:6px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:var(--scroll-h);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px;min-height:26px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:var(--label)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:var(--val);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:11px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;
    color:var(--sect);margin-top:-8px}
  .twk-sect:first-child{margin-top:0}
  .twk-sect::before{content:'';display:block;border-top:1px solid var(--bd);margin:16px 0}
  .twk-sect:first-child::before{display:none}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:1px solid var(--fld-bd);border-radius:8px;
    background:var(--fld-surf);color:inherit;font:inherit;outline:none}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-bar-row{display:flex;align-items:center;gap:8px}
  .twk-bar-lbl{font-weight:500;color:var(--label);white-space:nowrap;flex:1;min-width:0}
  .twk-bar{position:relative;width:172px;flex-shrink:0;height:26px;border-radius:8px;background:var(--track);
    cursor:pointer;overflow:hidden;user-select:none;touch-action:none}
  .twk-bar-fill{position:absolute;top:0;left:0;bottom:0;background:var(--bar-fill);
    border-radius:8px 0 0 8px;pointer-events:none;min-width:8px}
  .twk-bar-val{position:absolute;inset:0;display:flex;align-items:center;
    justify-content:center;font-size:11px;font-variant-numeric:tabular-nums;
    pointer-events:none;font-weight:500}
  .twk-bar-val--fill{color:var(--bar-val)}
  .twk-bar-val--track{color:var(--text)}

  .twk-seg{position:relative;display:flex;border-radius:10px;
    background:var(--seg);user-select:none;box-sizing:border-box;height:32px;padding:3px}
  .twk-seg-thumb{position:absolute;top:3px;bottom:3px;border-radius:8px;
    background:var(--bar-fill);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .4s cubic-bezier(.4,0,.2,1),width .4s cubic-bezier(.4,0,.2,1)}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:8px;cursor:pointer;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere;transition:color .2s ease}
  .twk-seg button[aria-checked="true"]{color:var(--bar-val);transition-delay:.1s}

  .twk-toggle{position:relative;width:36px;height:20px;border:0;border-radius:999px;
    background:var(--tog-off);transition:background .25s;cursor:pointer;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;
    background:var(--tog-handle);box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(16px)}

.twk-reopen{position:fixed;right:16px;top:calc(var(--header-h,0px) + 16px);z-index:9999;width:36px;height:36px;
    border:0;border-radius:12px;cursor:pointer;padding:0;
    background:var(--bg);
    backdrop-filter:blur(12px) saturate(180%);
    border:.5px solid var(--bd);
    box-shadow:0 8px 40px 0 rgba(0,0,0,0.12);
    display:flex;align-items:center;justify-content:center;color:rgba(28,25,23,.8)}
  .twk-reopen:hover{color:var(--text)}
  html[data-theme="dark"] .twk-reopen{color:rgba(253,253,251,.8)}
  html[data-theme="dark"] .twk-reopen:hover{color:rgba(253,253,251,1)}

  .twk-btn{appearance:none;flex:1;height:26px;padding:0 12px;border:0;border-radius:8px;
    background:var(--btn);color:var(--btn-t);font:inherit;font-weight:500;cursor:pointer}
  .twk-btn:hover{background:var(--btn-h)}
  .twk-btn:disabled{opacity:.35;cursor:default;pointer-events:none}
  html[data-theme="dark"] .twk-panel .twk-btn:disabled{opacity:.25}
  .twk-btn.secondary{background:var(--sec);color:inherit}
  .twk-btn.secondary:hover{background:var(--sec-h)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:36px;height:26px;
    border:.5px solid var(--fld-bd);border-radius:8px;padding:0;cursor:pointer;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:7.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:7.5px}

  .twk-color-row{display:flex;align-items:center;gap:6px}
  .twk-bar-row .twk-color-row{width:172px;flex-shrink:0}
  .twk-color-main{display:flex;align-items:center;flex:1;min-width:0;height:26px;
    border:1px solid var(--fld-bd);border-radius:8px;background:var(--fld-surf);box-sizing:border-box}
  .twk-color-preview{flex-shrink:0;cursor:pointer;
    width:26px;height:calc(100% + 2px);
    margin:-1px 0 -1px -1px;border-radius:7px 0 0 7px}
  .twk-color-hex{flex:1;min-width:0;border:0;background:transparent;color:inherit;
    font:inherit;font-size:12px;padding:0 6px;outline:none}
  .twk-color-main:focus-within{border-color:var(--fld-bdf)}
  .twk-color-opacity{height:26px;padding:0 6px;border:1px solid var(--fld-bd);border-radius:8px;box-sizing:border-box;
    background:var(--fld-surf);font-size:12px;display:flex;align-items:center;gap:1px;
    white-space:nowrap;flex-shrink:0}
  .twk-color-opacity:focus-within{border-color:var(--fld-bdf)}
  .twk-color-opacity-input{width:20px;border:0;background:transparent;color:inherit;
    font:inherit;font-size:12px;text-align:right;padding:0;outline:none;-moz-appearance:textfield}
  .twk-color-opacity-input::-webkit-inner-spin-button,.twk-color-opacity-input::-webkit-outer-spin-button{-webkit-appearance:none}
  .twk-color-opacity-pct{color:inherit;font-size:10px}
  .twk-color-pick{appearance:none;width:26px;height:26px;border:0;
    border-radius:8px;background:transparent;color:var(--label);cursor:pointer;
    display:flex;align-items:center;justify-content:center;padding:0;flex-shrink:0;box-sizing:border-box}
  .twk-color-pick:hover{color:var(--text)}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:8px;overflow:hidden;cursor:pointer;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{border-radius:8px;box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}

  .twk-cpick{position:fixed;z-index:10000;width:212px;
    background:var(--bg);backdrop-filter:blur(12px) saturate(180%);
    border:.5px solid var(--bd);border-radius:12px;padding:12px;
    box-shadow:0 8px 40px rgba(0,0,0,.2);
    display:flex;flex-direction:column;gap:8px}
  .twk-cpick-sv{position:relative;width:100%;height:140px;
    border-radius:8px;overflow:hidden;cursor:crosshair;flex-shrink:0}
  .twk-cpick-sv-white{position:absolute;inset:0;
    background:linear-gradient(to right,#fff,transparent)}
  .twk-cpick-sv-black{position:absolute;inset:0;
    background:linear-gradient(to top,#000,transparent)}
  .twk-cpick-sv-thumb{position:absolute;width:12px;height:12px;border-radius:50%;
    border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.35);
    transform:translate(-50%,-50%);pointer-events:none}
  .twk-cpick-hue{position:relative;height:10px;border-radius:5px;cursor:ew-resize;
    background:linear-gradient(to right,hsl(0,100%,50%),hsl(60,100%,50%),hsl(120,100%,50%),hsl(180,100%,50%),hsl(240,100%,50%),hsl(300,100%,50%),hsl(360,100%,50%))}
  .twk-cpick-hue-thumb{position:absolute;top:50%;width:14px;height:14px;border-radius:50%;
    background:#fff;border:1.5px solid rgba(0,0,0,.2);box-shadow:0 1px 3px rgba(0,0,0,.2);
    transform:translate(-50%,-50%);pointer-events:none}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
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
function TweaksPanel({
  title = 'Tweaks',
  noDeckControls = false,
  children,
  onOpenChange
}) {
  const [open, setOpen] = React.useState(() => window.parent === window);
  const [closing, setClosing] = React.useState(false);
  React.useEffect(() => {
    onOpenChange && onOpenChange(open);
  }, [open, onOpenChange]);
  // Auto-inject a rail toggle when a <deck-stage> is on the page. The
  // toggle drives the deck's per-viewer _railVisible via window message;
  // state is mirrored from the same localStorage key the deck reads so
  // the control reflects reality across reloads. The mechanism is the
  // message — authors who want custom placement can post it directly
  // and pass noDeckControls to suppress this one.
  const hasDeckStage = React.useMemo(() => typeof document !== 'undefined' && !!document.querySelector('deck-stage'), []);
  // Hide the toggle until the host has actually enabled the rail (the
  // __omelette_rail_enabled window message, posted only when the
  // omelette_deck_rail_enabled flag is on for this user). The initial read
  // covers TweaksPanel mounting after the message already arrived; the
  // listener covers the common case of mounting first.
  const [railEnabled, setRailEnabled] = React.useState(() => hasDeckStage && !!document.querySelector('deck-stage')?._railEnabled);
  React.useEffect(() => {
    if (!hasDeckStage || railEnabled) return undefined;
    const onMsg = e => {
      if (e.data && e.data.type === '__omelette_rail_enabled') setRailEnabled(true);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [hasDeckStage, railEnabled]);
  const [railVisible, setRailVisible] = React.useState(() => {
    try {
      return localStorage.getItem('deck-stage.railVisible') !== '0';
    } catch (e) {
      return true;
    }
  });
  const toggleRail = on => {
    setRailVisible(on);
    window.postMessage({
      type: '__deck_rail_visible',
      on
    }, '*');
  };
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setClosing(true);
    onOpenChange && onOpenChange(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const handleAnimEnd = e => {
    if (e.animationName === 'twk-out') { setClosing(false); setOpen(false); }
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), open ? /*#__PURE__*/React.createElement("div", {
    className: closing ? 'twk-panel twk-closing' : 'twk-panel',
    "data-noncommentable": "",
    onAnimationEnd: handleAnimEnd
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd"
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onClick: dismiss
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m6 6 12 12"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children, hasDeckStage && railEnabled && !noDeckControls && /*#__PURE__*/React.createElement(TweakSection, {
    label: "Deck"
  }, /*#__PURE__*/React.createElement(TweakToggle, {
    label: "Thumbnail rail",
    value: railVisible,
    onChange: toggleRail
  })))) : /*#__PURE__*/React.createElement("button", {
    className: "twk-reopen",
    "aria-label": "Open tweaks",
    onClick: () => setOpen(true)
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M10 5H3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 19H3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14 3v4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 17v4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 12h-9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 19h-5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 5h-7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 10v4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 12H3"
  }))));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, label && /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, label && /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  const pct = Math.max(0, Math.min(100, (value - min) / (max - min) * 100));
  const barRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const compute = clientX => {
    const rect = barRef.current.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = min + p * (max - min);
    const snapped = Math.round(raw / step) * step;
    const decimals = (String(step).split('.')[1] || '').length;
    return Number(snapped.toFixed(decimals));
  };
  const onPointerDown = e => {
    barRef.current.setPointerCapture(e.pointerId);
    setDragging(true);
    onChange(compute(e.clientX));
  };
  const onPointerMove = e => {
    if (e.buttons === 0) return;
    onChange(compute(e.clientX));
  };
  const onPointerUp = () => setDragging(false);
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-bar-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-bar-lbl"
  }, label, unit ? ` (${unit})` : ''), /*#__PURE__*/React.createElement("div", {
    ref: barRef,
    className: "twk-bar",
    style: {
      cursor: dragging ? 'grabbing' : 'pointer'
    },
    onPointerDown: onPointerDown,
    onPointerMove: onPointerMove,
    onPointerUp: onPointerUp
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-bar-fill",
    style: {
      width: pct + '%'
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "twk-bar-val twk-bar-val--fill",
    style: {
      clipPath: `inset(0 ${100 - pct}% 0 0)`
    }
  }, value), /*#__PURE__*/React.createElement("span", {
    className: "twk-bar-val twk-bar-val--track",
    style: {
      clipPath: `inset(0 0 0 ${pct}%)`
    }
  }, value)));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
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
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 6;
    const i = Math.floor((clientX - r.left - 3) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    trackRef.current.setPointerCapture(e.pointerId);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
  };
  const onPointerMove = e => {
    if (e.buttons === 0) return;
    setDragging(true);
    const v = segAt(e.clientX);
    if (v !== valueRef.current) onChange(v);
  };
  const onPointerUp = () => setDragging(false);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    onPointerMove: onPointerMove,
    onPointerUp: onPointerUp,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(3px + ${idx} * (100% - 6px) / ${n})`,
      width: `calc((100% - 6px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  strokeWidth: "2.5",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}, /*#__PURE__*/React.createElement("path", {
  d: "M20 6 9 17l-5-5"
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function __hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  };
}
function __hexToHsv(hex) {
  const {
    r: r255,
    g: g255,
    b: b255
  } = __hexToRgb(hex);
  const r = r255 / 255,
    g = g255 / 255,
    b = b255 / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min;
  let h = 0,
    s = max === 0 ? 0 : d / max,
    v = max;
  if (d) switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    case b:
      h = ((r - g) / d + 4) / 6;
      break;
  }
  return {
    h: h * 360,
    s: s * 100,
    v: v * 100
  };
}
function __hsvToHex(h, s, v) {
  h /= 360;
  s /= 100;
  v /= 100;
  const i = Math.floor(h * 6),
    f = h * 6 - i,
    p = v * (1 - s),
    q = v * (1 - f * s),
    t = v * (1 - (1 - f) * s);
  let r, g, b;
  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }
  return '#' + [r, g, b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}
function __ColorPickerDropdown({
  hex,
  onHexChange,
  anchorRef,
  onClose
}) {
  const [hsv, setHsv] = React.useState(() => __hexToHsv(hex));
  const svRef = React.useRef(null);
  const hueRef = React.useRef(null);
  const dropRef = React.useRef(null);
  const [pos, setPos] = React.useState(null);
  React.useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const H = 220,
      W = 212;
    const above = window.innerHeight - rect.bottom < H;
    const centeredLeft = rect.left + rect.width / 2 - W / 2;
    setPos({
      top: above ? rect.top - H - 6 : rect.bottom + 6,
      left: Math.max(8, Math.min(centeredLeft, window.innerWidth - W - 8))
    });
  }, []);
  React.useEffect(() => {
    const close = e => {
      if (dropRef.current && !dropRef.current.contains(e.target) && anchorRef.current && !anchorRef.current.contains(e.target)) onClose();
    };
    const closeScroll = () => onClose();
    document.addEventListener('pointerdown', close);
    window.addEventListener('scroll', closeScroll, true);
    return () => {
      document.removeEventListener('pointerdown', close);
      window.removeEventListener('scroll', closeScroll, true);
    };
  }, []);
  const emit = (h, s, v) => {
    setHsv({
      h,
      s,
      v
    });
    onHexChange(__hsvToHex(h, s, v));
  };
  const dragSV = (cx, cy) => {
    const r = svRef.current.getBoundingClientRect();
    emit(hsv.h, Math.max(0, Math.min(100, (cx - r.left) / r.width * 100)), Math.max(0, Math.min(100, 100 - (cy - r.top) / r.height * 100)));
  };
  const dragHue = cx => {
    const r = hueRef.current.getBoundingClientRect();
    emit(Math.max(0, Math.min(360, (cx - r.left) / r.width * 360)), hsv.s, hsv.v);
  };
  if (!pos) return null;
  return ReactDOM.createPortal(/*#__PURE__*/React.createElement("div", {
    ref: dropRef,
    className: "twk-cpick twk-panel",
    style: {
      top: pos.top,
      left: pos.left
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: svRef,
    className: "twk-cpick-sv",
    style: {
      background: `hsl(${hsv.h},100%,50%)`
    },
    onPointerDown: e => {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragSV(e.clientX, e.clientY);
    },
    onPointerMove: e => {
      if (e.buttons) dragSV(e.clientX, e.clientY);
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-cpick-sv-white"
  }), /*#__PURE__*/React.createElement("div", {
    className: "twk-cpick-sv-black"
  }), /*#__PURE__*/React.createElement("div", {
    className: "twk-cpick-sv-thumb",
    style: {
      left: `${hsv.s}%`,
      top: `${100 - hsv.v}%`
    }
  })), /*#__PURE__*/React.createElement("div", {
    ref: hueRef,
    className: "twk-cpick-hue",
    onPointerDown: e => {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragHue(e.clientX);
    },
    onPointerMove: e => {
      if (e.buttons) dragHue(e.clientX);
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-cpick-hue-thumb",
    style: {
      left: `${hsv.h / 360 * 100}%`
    }
  }))), document.body);
}
function __parseColor(value) {
  if (!value) return {
    hex: '#000000',
    opacity: 100
  };
  const m = String(value).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (m) {
    const hex = '#' + [m[1], m[2], m[3]].map(v => parseInt(v).toString(16).padStart(2, '0')).join('');
    const opacity = m[4] !== undefined ? Math.round(parseFloat(m[4]) * 100) : 100;
    return {
      hex,
      opacity
    };
  }
  return {
    hex: value,
    opacity: 100
  };
}
function __toColorString(hex, opacity) {
  if (opacity >= 100) return hex;
  const {
    r,
    g,
    b
  } = __hexToRgb(hex);
  return `rgba(${r},${g},${b},${(opacity / 100).toFixed(2)})`;
}
function __TweakColorInput({
  label,
  value,
  onChange,
  noAlpha
}) {
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
  const onHexChange = e => {
    const v = e.target.value;
    setHex(v);
    if (/^#[0-9a-fA-F]{6}$/.test(v)) commitColor(v, opacity);
  };
  const onOpacityChange = e => {
    setOpacityStr(e.target.value);
    const n = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
    setOpacity(n);
    if (/^\d+$/.test(e.target.value)) commitColor(hex, n);
  };
  const onOpacityBlur = () => setOpacityStr(String(opacity));
  const row = /*#__PURE__*/React.createElement("div", {
    className: "twk-color-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-color-main"
  }, /*#__PURE__*/React.createElement("div", {
    ref: swatchRef,
    className: "twk-color-preview",
    style: {
      background: hex
    },
    onClick: () => setShowPicker(v => !v)
  }), /*#__PURE__*/React.createElement("input", {
    className: "twk-color-hex",
    type: "text",
    value: hex,
    onChange: onHexChange,
    spellCheck: false
  })), !noAlpha && /*#__PURE__*/React.createElement("div", {
    className: "twk-color-opacity"
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-color-opacity-input",
    type: "text",
    value: opacityStr,
    onChange: onOpacityChange,
    onBlur: onOpacityBlur
  }), /*#__PURE__*/React.createElement("span", {
    className: "twk-color-opacity-pct"
  }, "%")), 'EyeDropper' in window && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-color-pick",
    onClick: () => {
      new window.EyeDropper().open().then(r => {
        setHex(r.sRGBHex);
        commitColor(r.sRGBHex, opacity);
      }).catch(() => {});
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.25",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "m12 9-8.414 8.414A2 2 0 0 0 3 18.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 3.828 21h1.344a2 2 0 0 0 1.414-.586L15 12"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m18 9 .4.4a1 1 0 1 1-3 3l-3.8-3.8a1 1 0 1 1 3-3l.4.4 3.4-3.4a1 1 0 1 1 3 3z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m2 22 .414-.414"
  }))), showPicker && /*#__PURE__*/React.createElement(__ColorPickerDropdown, {
    hex: hex,
    onHexChange: h => {
      setHex(h);
      commitColor(h, opacity);
    },
    anchorRef: swatchRef,
    onClose: () => setShowPicker(false)
  }));
  if (!label) return row;
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-bar-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-bar-lbl"
  }, label), row);
}
function TweakColor({
  label,
  value,
  options,
  onChange,
  noAlpha
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement(__TweakColorInput, {
      label: label,
      value: value,
      onChange: onChange,
      noAlpha: noAlpha
    });
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false,
  disabled = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick,
    disabled: disabled
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakColor,
  TweakButton
});
