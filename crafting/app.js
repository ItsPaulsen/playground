const {
  useState,
  useEffect
} = React;
const LEAGUE = 'Runes of Aldur';
const GUIDES = [{
  id: 'crit-bow',
  name: 'Crit Bow',
  ilvl: 75,
  bases: ['Obliterator Bow', 'Warmonger Bow'],
  baseInfo: [{
    name: 'Obliterator Bow',
    stats: [{
      label: 'Damage',
      value: '62–115'
    }, {
      label: 'APS',
      value: '1.10'
    }, {
      label: 'Proj. Range',
      value: '−50%'
    }],
    desc: 'Higher base damage, slower attack speed. −50% projectile range — best for close-range builds (e.g. Snipe) or skills that clear off-screen.'
  }, {
    name: 'Warmonger Bow',
    stats: [{
      label: 'Damage',
      value: '56–84'
    }, {
      label: 'APS',
      value: '1.20'
    }, {
      label: 'Proj. Range',
      value: '—'
    }],
    desc: 'Faster attack speed, slightly lower base damage. Better for rapid-attack playstyles.'
  }],
  intro: null,
  steps: [{
    title: 'Start with a high %phys base',
    currency: [],
    goal: 'Higher is better but any works. Buy or pick up bases and Trans/Aug until you find one.',
    note: null
  }, {
    title: 'Use Greater Essence of Seeking',
    currency: [{
      label: 'Greater Essence of Seeking',
      ninja: 'Greater Essence of Seeking'
    }],
    goal: 'Guarantees T3 Critical Hit Chance',
    note: 'This is your one guaranteed craft — use it here.'
  }, {
    title: 'Unveil a Prefix',
    currency: [{
      label: 'Sinistral Necromancy',
      ninja: 'Sinistral Necromancy'
    }, {
      label: 'Jawbone',
      ninja: 'Jawbone'
    }],
    goal: 'High flat physical damage — high tier elemental flat also works',
    note: 'Ancient Jawbone is cheaper early league. Consider Abyssal Echoes depending on prices.'
  }, {
    title: 'Fill remaining affixes',
    currency: [{
      label: 'Greater Exalt',
      ninja: 'Greater Exalted Orb'
    }, {
      label: 'Omen of Greater Exaltation',
      ninja: 'Omen of Greater Exaltation'
    }],
    goal: 'Fill out the last 2 affixes',
    note: 'Pick Exalt tier based on how good your bow is and current prices. Pure RNG from here.'
  }]
}];
async function fetchPrices() {
  const base = `https://poe.ninja/api/data`;
  const league = encodeURIComponent(LEAGUE);
  const endpoints = [`${base}/currencyoverview?league=${league}&type=Currency`, `${base}/itemoverview?league=${league}&type=Essence`, `${base}/itemoverview?league=${league}&type=Omen`, `${base}/itemoverview?league=${league}&type=Scarab`];
  const map = {};
  await Promise.allSettled(endpoints.map(async url => {
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    (data.lines || []).forEach(item => {
      const name = item.currencyTypeName || item.name;
      const chaos = item.chaosEquivalent ?? item.chaosValue;
      if (name && chaos != null) map[name] = chaos;
    });
  }));
  return map;
}
function usePrices() {
  const [prices, setPrices] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    fetchPrices().then(setPrices).catch(() => setError(true));
  }, []);
  return {
    prices,
    error
  };
}
function stepCost(step, prices) {
  if (!prices || !step.currency.length) return null;
  const divine = prices['Divine Orb'];
  if (!divine) return null;
  let total = 0;
  let found = 0;
  for (const c of step.currency) {
    const chaos = prices[c.ninja];
    if (chaos != null) {
      total += chaos;
      found++;
    }
  }
  if (!found) return null;
  const divs = total / divine;
  return divs < .1 ? `<0.1 div` : `~${+divs.toFixed(1)} div`;
}
function BaseTooltip({
  baseInfo
}) {
  const [open, setOpen] = React.useState(false);
  return /*#__PURE__*/React.createElement("span", {
    className: "craft-tooltip-wrap"
  }, /*#__PURE__*/React.createElement("button", {
    className: "craft-info-btn",
    "aria-label": "Base info",
    onClick: e => {
      e.stopPropagation();
      setOpen(v => !v);
    },
    onBlur: () => setOpen(false)
  }, /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "16",
    x2: "12",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "8",
    x2: "12.01",
    y2: "8"
  }))), open && /*#__PURE__*/React.createElement("div", {
    className: "craft-tooltip"
  }, baseInfo.map(b => /*#__PURE__*/React.createElement("div", {
    key: b.name,
    className: "craft-tooltip-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "craft-tooltip-name"
  }, b.name), b.stats && /*#__PURE__*/React.createElement("div", {
    className: "craft-tooltip-stats"
  }, b.stats.map(s => /*#__PURE__*/React.createElement("span", {
    key: s.label,
    className: "craft-tooltip-stat"
  }, /*#__PURE__*/React.createElement("span", {
    className: "craft-tooltip-stat-label"
  }, s.label), /*#__PURE__*/React.createElement("span", {
    className: "craft-tooltip-stat-value"
  }, s.value)))), /*#__PURE__*/React.createElement("span", {
    className: "craft-tooltip-desc"
  }, b.desc)))));
}
function Step({
  step,
  index,
  checked,
  onToggle,
  prices
}) {
  const cost = stepCost(step, prices);
  return /*#__PURE__*/React.createElement("div", {
    className: `craft-step${checked ? ' checked' : ''}`,
    onClick: onToggle
  }, /*#__PURE__*/React.createElement("button", {
    className: "craft-check",
    onClick: e => {
      e.stopPropagation();
      onToggle();
    },
    "aria-pressed": checked,
    "aria-label": `Mark step ${index + 1} complete`
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 16 16",
    fill: "none"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "3,8 6.5,12 13,4",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "craft-step-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "craft-step-header"
  }, /*#__PURE__*/React.createElement("span", {
    className: "craft-step-num"
  }, "Step ", index + 1), /*#__PURE__*/React.createElement("span", {
    className: "craft-step-title"
  }, step.title), cost && /*#__PURE__*/React.createElement("span", {
    className: "craft-step-cost"
  }, cost)), step.currency.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "craft-currencies"
  }, step.currency.map(c => /*#__PURE__*/React.createElement("span", {
    key: c.label,
    className: "craft-currency"
  }, c.label))), /*#__PURE__*/React.createElement("p", {
    className: "craft-goal"
  }, step.goal), step.note && /*#__PURE__*/React.createElement("p", {
    className: "craft-note"
  }, step.note)));
}
function Guide({
  guide,
  prices
}) {
  const [checked, setChecked] = useState(() => guide.steps.map(() => false));
  function toggle(i) {
    setChecked(prev => prev.map((v, idx) => idx === i ? !v : v));
  }
  function reset() {
    setChecked(guide.steps.map(() => false));
  }
  const done = checked.filter(Boolean).length;
  const total = guide.steps.length;
  return /*#__PURE__*/React.createElement("div", {
    className: "craft-guide"
  }, /*#__PURE__*/React.createElement("div", {
    className: "craft-guide-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "craft-guide-name"
  }, guide.name), /*#__PURE__*/React.createElement("div", {
    className: "craft-guide-meta"
  }, /*#__PURE__*/React.createElement("span", null, "ilvl ", guide.ilvl, "+"), /*#__PURE__*/React.createElement("span", {
    className: "craft-meta-sep"
  }, "\xB7"), /*#__PURE__*/React.createElement("span", null, guide.bases.join(' or ')), guide.baseInfo && /*#__PURE__*/React.createElement(BaseTooltip, {
    baseInfo: guide.baseInfo
  }))), /*#__PURE__*/React.createElement("div", {
    className: "craft-guide-progress"
  }, /*#__PURE__*/React.createElement("span", {
    className: "craft-progress-label"
  }, done, "/", total), done > 0 && /*#__PURE__*/React.createElement("button", {
    className: "craft-reset-btn",
    onClick: reset,
    "aria-label": "Reset steps"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "11",
    height: "11",
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
  }))))), guide.intro && /*#__PURE__*/React.createElement("p", {
    className: "craft-intro"
  }, guide.intro), /*#__PURE__*/React.createElement("div", {
    className: "craft-steps"
  }, guide.steps.map((step, i) => /*#__PURE__*/React.createElement(Step, {
    key: i,
    step: step,
    index: i,
    checked: checked[i],
    onToggle: () => toggle(i),
    prices: prices
  }))));
}
function App() {
  const {
    prices
  } = usePrices();
  return /*#__PURE__*/React.createElement(React.Fragment, null, GUIDES.map(guide => /*#__PURE__*/React.createElement(Guide, {
    key: guide.id,
    guide: guide,
    prices: prices
  })));
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
