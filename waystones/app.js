const {
  useState,
  useRef
} = React;
const MODS = [{
  name: 'Item Rarity',
  param: 'iir',
  min: 5,
  max: 80,
  step: 5,
  defaultVal: 25
}, {
  name: 'Monster Rarity',
  param: 'rarity',
  min: 5,
  max: 80,
  step: 5,
  defaultVal: 25
}, {
  name: 'Waystone Drop Chance',
  param: 'dropchance',
  min: 10,
  max: 120,
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
const WORKER_URL = 'https://poe2-waystone-trade.itspaulsen.workers.dev';
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
    className: "poe-bar",
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
    className: "poe-bar-fill",
    style: {
      width: pct + '%'
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "poe-bar-val poe-bar-val--fill",
    style: {
      clipPath: `inset(0 ${100 - pct}% 0 0)`
    }
  }, value, "+"), /*#__PURE__*/React.createElement("span", {
    className: "poe-bar-val poe-bar-val--track",
    style: {
      clipPath: `inset(0 0 0 ${pct}%)`
    }
  }, value, "+")));
}
function useToast() {
  const ref = React.useRef(null);
  const timer = React.useRef(null);
  function show(text) {
    if (!ref.current) {
      const el = document.createElement('div');
      el.className = 'poe-toast';
      document.body.appendChild(el);
      ref.current = el;
    }
    ref.current.textContent = text;
    ref.current.classList.add('is-visible');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => ref.current?.classList.remove('is-visible'), 2000);
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
  activeMods
}) {
  const [copied, setCopied] = useState(false);
  const [trading, setTrading] = useState(false);
  const [tradeErr, setTradeErr] = useState(false);
  const showToast = useToast();
  const len = combined.length;
  const over = len > 250;
  const hasActive = activeMods.length > 0;
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
  async function handleTrade() {
    if (!hasActive || trading) return;
    setTrading(true);
    setTradeErr(false);
    try {
      const params = new URLSearchParams();
      activeMods.forEach(({
        param,
        value
      }) => params.set(param, value));
      const res = await fetch(`${WORKER_URL}?${params}`);
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank', 'noopener');
      } else {
        setTradeErr(true);
        setTimeout(() => setTradeErr(false), 2500);
      }
    } catch {
      setTradeErr(true);
      setTimeout(() => setTradeErr(false), 2500);
    } finally {
      setTrading(false);
    }
  }
  return /*#__PURE__*/React.createElement("div", {
    className: `poe-combined${over ? ' over' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "poe-combined-hd"
  }, /*#__PURE__*/React.createElement("div", {
    className: "poe-combined-val"
  }, combined ? highlightModNames(combined) : /*#__PURE__*/React.createElement("span", {
    className: "poe-combined-placeholder"
  }, "Toggle mods above to build your search string")), /*#__PURE__*/React.createElement("div", {
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
    disabled: !hasActive || trading
  }, tradeErr ? /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
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
  })) : trading ? /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: "poe-spin"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M21 12a9 9 0 1 1-6.22-8.56"
  })) : /*#__PURE__*/React.createElement("svg", {
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
  })), tradeErr ? 'Error' : trading ? 'Opening…' : 'Trade'))));
}
function App() {
  const [states, setStates] = useState(() => MODS.map(mod => ({
    value: mod.defaultVal,
    active: false
  })));
  const combined = states.map((s, i) => s.active ? buildRegex(MODS[i].name, s.value) : null).filter(Boolean).join(' ');
  const activeMods = states.map((s, i) => s.active ? {
    param: MODS[i].param,
    value: s.value
  } : null).filter(Boolean);
  const budgetCount = states.filter((s, i) => s.active && MODS[i].param !== 'dropchance').length;
  const demand = states.reduce((sum, s, i) => {
    if (!s.active || MODS[i].param === 'dropchance') return sum;
    const mod = MODS[i];
    return sum + Math.max(0, (s.value - mod.defaultVal) / (mod.max - mod.defaultVal));
  }, 0);
  const demandThreshold = budgetCount <= 1 ? Infinity : budgetCount === 2 ? 1.1 : 0.78;
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
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(CombinedBox, {
    combined: combined,
    activeMods: activeMods
  }), /*#__PURE__*/React.createElement("div", {
    className: "poe-panel"
  }, MODS.map((mod, i) => /*#__PURE__*/React.createElement(ModRow, {
    key: mod.name,
    mod: mod,
    value: states[i].value,
    active: states[i].active,
    onToggle: () => toggle(i),
    onValue: v => setValue(i, v),
    last: i === MODS.length - 1
  }))), demand > demandThreshold && /*#__PURE__*/React.createElement("p", {
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
  })), "Item Rarity, Monster Rarity, and Pack Size share a mod budget \u2014 this combo may return no results."));
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
