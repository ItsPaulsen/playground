const {
  useState,
  useRef
} = React;
const MODS = [{
  name: 'Item Rarity',
  param: 'iir',
  min: 5,
  max: 100,
  step: 5,
  defaultVal: 25
}, {
  name: 'Monster Rarity',
  param: 'rarity',
  min: 5,
  max: 100,
  step: 5,
  defaultVal: 25
}, {
  name: 'Monster Effectiveness',
  param: 'effectiveness',
  min: 10,
  max: 70,
  step: 5,
  defaultVal: 25
}, {
  name: 'Waystone Drop Chance',
  param: 'dropchance',
  min: 10,
  max: 160,
  step: 10,
  defaultVal: 40
}, {
  name: 'Pack Size',
  param: 'packsize',
  min: 5,
  max: 60,
  step: 5,
  defaultVal: 20
}];
const LEAGUE = 'Runes of Aldur';
const TRADE_BASE = 'https://www.pathofexile.com/trade2/search/poe2';
const FILTER_MAP = {
  iir: 'map_iir',
  rarity: 'map_rare_monsters',
  effectiveness: 'map_magic_monsters',
  dropchance: 'map_bonus',
  packsize: 'map_packsize'
};
function buildTradeUrl(activeMods, modCountActive) {
  const filters = {
    map_tier: {
      min: 15
    }
  };
  activeMods.forEach(({
    param,
    value
  }) => {
    if (FILTER_MAP[param]) filters[FILTER_MAP[param]] = {
      min: value
    };
  });
  const queryFilters = {
    map_filters: {
      filters
    },
    type_filters: {
      filters: {
        category: {
          option: 'map.waystone'
        }
      }
    }
  };
  const stats = modCountActive ? [{
    type: 'and',
    filters: [{
      id: 'pseudo.pseudo_number_of_affix_mods',
      value: {
        min: 8
      }
    }]
  }] : [];
  const query = {
    query: {
      status: {
        option: 'securable'
      },
      filters: queryFilters,
      stats
    },
    sort: {
      price: 'asc'
    }
  };
  return `${TRADE_BASE}/${encodeURIComponent(LEAGUE)}?q=${encodeURIComponent(JSON.stringify(query))}`;
}
function buildRegex(modName, v) {
  const parts = [];
  if (v < 10) {
    if (v < 9) parts.push(`[${v}-9]`);else parts.push('9');
    parts.push('[1-9].');
    parts.push('\\d..');
  } else if (v < 100) {
    const t = Math.floor(v / 10),
      u = v % 10;
    if (u === 0) {
      parts.push(t < 9 ? `[${t}-9].` : '9.');
    } else {
      parts.push(`${t}[${u}-9]`);
      if (t < 9) parts.push(`[${t + 1}-9].`);
    }
    parts.push('\\d..');
  } else {
    const h = Math.floor(v / 100),
      rem = v % 100;
    const t = Math.floor(rem / 10),
      u = rem % 10;
    if (rem === 0) {
      parts.push(h < 9 ? `[${h}-9]..` : '9..');
    } else if (u === 0) {
      parts.push(`${h}[${t}-9].`);
      if (h < 9) parts.push(`[${h + 1}-9]..`);
    } else {
      parts.push(`${h}${t}[${u}-9]`);
      if (t < 9) parts.push(`${h}[${t + 1}-9].`);
      if (h < 9) parts.push(`[${h + 1}-9]..`);
    }
  }
  const inner = parts.length === 1 ? parts[0] : `(${parts.join('|')})`;
  return `"${modName}.*${inner}%"`;
}
function ModRow({
  mod,
  value,
  active,
  onToggle,
  onValue,
  last
}) {
  const barRef = useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const pct = (value - mod.min) / (mod.max - mod.min) * 100;
  function compute(clientX) {
    const rect = barRef.current.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = mod.min + p * (mod.max - mod.min);
    return Math.max(mod.min, Math.min(mod.max, Math.round(raw / mod.step) * mod.step));
  }
  function onPointerDown(e) {
    e.stopPropagation();
    barRef.current.setPointerCapture(e.pointerId);
    setDragging(true);
    onValue(compute(e.clientX));
    if (!active) onToggle();
  }
  function onPointerMove(e) {
    if (e.buttons === 0) return;
    onValue(compute(e.clientX));
  }
  function onPointerUp() {
    setDragging(false);
  }
  const onKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onToggle();
      return;
    }
    const dir = {
      ArrowRight: 1,
      ArrowUp: 1,
      ArrowLeft: -1,
      ArrowDown: -1
    }[e.key];
    if (!dir) return;
    e.preventDefault();
    onValue(Math.max(mod.min, Math.min(mod.max, value + dir * mod.step)));
    if (!active) onToggle();
  };
  return /*#__PURE__*/React.createElement("div", {
    className: `poe-row${active ? ' active' : ''}${last ? ' last' : ''}`,
    onClick: onToggle
  }, /*#__PURE__*/React.createElement("button", {
    className: "poe-toggle",
    onClick: e => {
      e.stopPropagation();
      onToggle();
    },
    "aria-pressed": active,
    "aria-label": `Toggle ${mod.name}`,
    tabIndex: -1
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16",
    fill: "none"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "3,8 6.5,12 13,4",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), /*#__PURE__*/React.createElement("span", {
    className: "poe-label"
  }, mod.name), /*#__PURE__*/React.createElement("div", {
    ref: barRef,
    className: "pg-bar",
    tabIndex: 0,
    role: "slider",
    "aria-label": mod.name,
    "aria-valuemin": mod.min,
    "aria-valuemax": mod.max,
    "aria-valuenow": value,
    style: {
      cursor: dragging ? 'grabbing' : 'pointer'
    },
    onPointerDown: onPointerDown,
    onPointerMove: onPointerMove,
    onPointerUp: onPointerUp,
    onClick: e => e.stopPropagation(),
    onKeyDown: onKeyDown
  }, /*#__PURE__*/React.createElement("div", {
    className: "pg-bar-fill",
    style: {
      width: pct + '%'
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "pg-bar-val pg-bar-val--fill",
    style: {
      clipPath: `inset(0 ${100 - pct}% 0 0)`
    }
  }, value, "+"), /*#__PURE__*/React.createElement("span", {
    className: "pg-bar-val pg-bar-val--track",
    style: {
      clipPath: `inset(0 0 0 ${pct}%)`
    }
  }, value, "+")));
}
function ToggleRow({
  label,
  active,
  onToggle
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `poe-row last${active ? ' active' : ''}`,
    onClick: onToggle
  }, /*#__PURE__*/React.createElement("button", {
    className: "poe-toggle",
    onClick: e => {
      e.stopPropagation();
      onToggle();
    },
    "aria-pressed": active,
    "aria-label": `Toggle ${label}`,
    tabIndex: -1
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16",
    fill: "none"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "3,8 6.5,12 13,4",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), /*#__PURE__*/React.createElement("span", {
    className: "poe-label"
  }, label), /*#__PURE__*/React.createElement("button", {
    className: "pg-switch",
    "data-on": active ? '1' : '0',
    role: "switch",
    "aria-checked": active,
    "aria-label": label,
    onClick: e => {
      e.stopPropagation();
      onToggle();
    }
  }, /*#__PURE__*/React.createElement("i", null)));
}
function useToast(className = 'poe-toast') {
  const ref = React.useRef(null);
  const timer = React.useRef(null);
  function show(text, duration = 2000) {
    if (!ref.current) {
      const el = document.createElement('div');
      el.className = className;
      document.body.appendChild(el);
      ref.current = el;
    }
    ref.current.textContent = text;
    ref.current.classList.add('is-visible');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => ref.current?.classList.remove('is-visible'), duration);
  }
  return show;
}
function highlightModNames(str) {
  const names = MODS.map(m => m.name);
  const pattern = new RegExp('(' + names.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'g');
  const parts = str.split(pattern);
  return parts.map((part, i) => names.includes(part) ? React.createElement('strong', {
    key: i
  }, part) : part);
}
function CombinedBox({
  combined,
  activeMods,
  modCountActive,
  onReset
}) {
  const [copied, setCopied] = useState(false);
  const showToast = useToast();
  const len = combined.length;
  const over = len > 250;
  const hasActive = activeMods.length > 0 || modCountActive;
  function handleCopy() {
    if (!combined) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    showToast('Copied search string');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(combined);
    } else {
      const el = document.createElement('textarea');
      el.value = combined;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  }
  function handleTrade() {
    if (!hasActive) return;
    window.open(buildTradeUrl(activeMods, modCountActive), '_blank', 'noopener');
  }
  return /*#__PURE__*/React.createElement("div", {
    className: `poe-combined${over ? ' over' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "poe-combined-hd"
  }, /*#__PURE__*/React.createElement("div", {
    className: "poe-combined-val"
  }, combined ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    className: "poe-reset-btn",
    onClick: onReset,
    "aria-label": "Reset"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "18",
    y1: "6",
    x2: "6",
    y2: "18"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "6",
    y1: "6",
    x2: "18",
    y2: "18"
  }))), /*#__PURE__*/React.createElement("span", {
    className: "poe-combined-text"
  }, highlightModNames(combined))) : /*#__PURE__*/React.createElement("span", {
    className: "poe-combined-placeholder"
  }, "Toggle mods above")), /*#__PURE__*/React.createElement("div", {
    className: "poe-combined-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "poe-copy-btn",
    onClick: handleCopy,
    disabled: !combined
  }, copied ? /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "20 6 9 17 4 12"
  })) : /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("rect", {
    width: "14",
    height: "14",
    x: "8",
    y: "8",
    rx: "2",
    ry: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
  })), copied ? 'Copied' : 'Copy'), /*#__PURE__*/React.createElement("button", {
    className: "poe-trade-btn",
    onClick: handleTrade,
    disabled: !hasActive
  }, /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "15 3 21 3 21 9"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "10",
    y1: "14",
    x2: "21",
    y2: "3"
  })), "Trade"))));
}
function App() {
  const [states, setStates] = useState(() => MODS.map(mod => ({
    value: mod.defaultVal,
    active: false
  })));
  const [modCountActive, setModCountActive] = useState(false);
  const combined = states.map((s, i) => s.active ? buildRegex(MODS[i].name, s.value) : null).filter(Boolean).join(' ');
  const activeMods = states.map((s, i) => s.active ? {
    param: MODS[i].param,
    value: s.value
  } : null).filter(Boolean);
  const iirState = states[MODS.findIndex(m => m.param === 'iir')];
  const rarityState = states[MODS.findIndex(m => m.param === 'rarity')];
  const effectivenessState = states[MODS.findIndex(m => m.param === 'effectiveness')];
  const packState = states[MODS.findIndex(m => m.param === 'packsize')];
  const budgetTotal = (iirState.active ? iirState.value : 0) + (rarityState.active ? rarityState.value : 0) + (effectivenessState.active ? effectivenessState.value : 0) + (packState.active ? packState.value : 0);
  const allThreeActive = iirState.active && rarityState.active && packState.active;
  const anyRarityActive = iirState.active || rarityState.active;
  const rarityCapExceeded = packState.active && packState.value >= 60 && anyRarityActive || packState.active && iirState.active && !rarityState.active && iirState.value + packState.value >= 95 || packState.active && rarityState.active && !iirState.active && rarityState.value + packState.value >= 95 || allThreeActive && iirState.value + rarityState.value >= 100 && packState.value >= 15 || allThreeActive && packState.value >= 30 || budgetTotal > 135 || iirState.active && rarityState.active && iirState.value >= 100 || iirState.active && rarityState.active && rarityState.value >= 70 && iirState.value >= 60 || effectivenessState.active && iirState.active && effectivenessState.value + iirState.value >= 115 || effectivenessState.active && rarityState.active && effectivenessState.value + rarityState.value >= 115;
  function toggle(i) {
    setStates(prev => prev.map((s, idx) => idx === i ? {
      ...s,
      active: !s.active
    } : s));
  }
  function setValue(i, v) {
    setStates(prev => prev.map((s, idx) => idx === i ? {
      ...s,
      value: v
    } : s));
  }
  function reset() {
    setStates(MODS.map(mod => ({
      value: mod.defaultVal,
      active: false
    })));
    setModCountActive(false);
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "poe-panel"
  }, MODS.map((mod, i) => /*#__PURE__*/React.createElement(ModRow, {
    key: mod.name,
    mod: mod,
    value: states[i].value,
    active: states[i].active,
    onToggle: () => toggle(i),
    onValue: v => setValue(i, v),
    last: false
  })), /*#__PURE__*/React.createElement(ToggleRow, {
    label: "8 Modifiers",
    active: modCountActive,
    onToggle: () => setModCountActive(v => !v)
  })), rarityCapExceeded && /*#__PURE__*/React.createElement("p", {
    className: "poe-demand-warning"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "9",
    x2: "12",
    y2: "13"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "17",
    x2: "12.01",
    y2: "17"
  })), "This combination of mods may return no results."), /*#__PURE__*/React.createElement("div", {
    className: "poe-spacer"
  }), /*#__PURE__*/React.createElement(CombinedBox, {
    combined: combined,
    activeMods: activeMods,
    modCountActive: modCountActive,
    onReset: reset
  }));
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
