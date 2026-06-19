const { useState, useRef } = React;

const MODS = [
  { name: 'Item Rarity',          param: 'iir',        min: 5,  max: 100, step: 5,  defaultVal: 25  },
  { name: 'Monster Rarity',       param: 'rarity',     min: 5,  max: 100, step: 5,  defaultVal: 25  },
  { name: 'Waystone Drop Chance', param: 'dropchance', min: 10, max: 160, step: 10, defaultVal: 40  },
  { name: 'Pack Size',            param: 'packsize',   min: 5,  max: 60,  step: 5,  defaultVal: 20  },
];

const LEAGUE = 'Runes of Aldur';
const TRADE_BASE = 'https://www.pathofexile.com/trade2/search/poe2';

const FILTER_MAP = {
  iir:        'map_iir',
  rarity:     'map_rare_monsters',
  dropchance: 'map_bonus',
  packsize:   'map_packsize',
};

function buildTradeUrl(activeMods) {
  const filters = { map_tier: { min: 15 } };
  activeMods.forEach(({ param, value }) => {
    if (FILTER_MAP[param]) filters[FILTER_MAP[param]] = { min: value };
  });
  const query = {
    query: {
      status: { option: 'securable' },
      filters: {
        map_filters: { filters },
        type_filters: { filters: { category: { option: 'map.waystone' } } },
      },
    },
    sort: { price: 'asc' },
  };
  return `${TRADE_BASE}/${encodeURIComponent(LEAGUE)}?q=${encodeURIComponent(JSON.stringify(query))}`;
}

function buildRegex(modName, v) {
  const parts = [];
  if (v < 10) {
    if (v < 9) parts.push(`[${v}-9]`); else parts.push('9');
    parts.push('[1-9].');
    parts.push('\\d..');
  } else if (v < 100) {
    const t = Math.floor(v / 10), u = v % 10;
    if (u === 0) {
      parts.push(t < 9 ? `[${t}-9].` : '9.');
    } else {
      parts.push(`${t}[${u}-9]`);
      if (t < 9) parts.push(`[${t + 1}-9].`);
    }
    parts.push('\\d..');
  } else {
    const h = Math.floor(v / 100), rem = v % 100;
    const t = Math.floor(rem / 10), u = rem % 10;
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

function ModRow({ mod, value, active, onToggle, onValue, last }) {
  const barRef = useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const pct = ((value - mod.min) / (mod.max - mod.min)) * 100;

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

  function onPointerUp() { setDragging(false); }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); onToggle(); return; }
    const dir = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (!dir) return;
    e.preventDefault();
    onValue(Math.max(mod.min, Math.min(mod.max, value + dir * mod.step)));
    if (!active) onToggle();
  };

  return (
    <div className={`poe-row${active ? ' active' : ''}${last ? ' last' : ''}`} onClick={onToggle}>
      <button className="poe-toggle" onClick={e => { e.stopPropagation(); onToggle(); }} aria-pressed={active} aria-label={`Toggle ${mod.name}`} tabIndex={-1}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polyline points="3,8 6.5,12 13,4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <span className="poe-label">{mod.name}</span>
      <div
        ref={barRef}
        className="poe-bar"
        tabIndex={0}
        role="slider"
        aria-label={mod.name}
        aria-valuemin={mod.min}
        aria-valuemax={mod.max}
        aria-valuenow={value}
        style={{ cursor: dragging ? 'grabbing' : 'pointer' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={e => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="poe-bar-fill" style={{ width: pct + '%' }} />
        <span className="poe-bar-val poe-bar-val--fill" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}>{value}+</span>
        <span className="poe-bar-val poe-bar-val--track" style={{ clipPath: `inset(0 0 0 ${pct}%)` }}>{value}+</span>
      </div>
    </div>
  );
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
  return parts.map((part, i) =>
    names.includes(part) ? React.createElement('strong', { key: i }, part) : part
  );
}

function CombinedBox({ combined, activeMods, onReset }) {
  const [copied, setCopied] = useState(false);
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

  function handleTrade() {
    if (!hasActive) return;
    window.open(buildTradeUrl(activeMods), '_blank', 'noopener');
  }

  return (
    <div className={`poe-combined${over ? ' over' : ''}`}>
      <div className="poe-combined-hd">
        <div className="poe-combined-val">
          {combined
            ? <>
                <button className="poe-reset-btn" onClick={onReset} aria-label="Reset">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <span className="poe-combined-text">{highlightModNames(combined)}</span>
              </>
            : <span className="poe-combined-placeholder">Toggle mods above to build your search string</span>}
        </div>
        <div className="poe-combined-actions">
          <button className="poe-copy-btn" onClick={handleCopy} disabled={!combined}>
            {copied
              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            }
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button className="poe-trade-btn" onClick={handleTrade} disabled={!hasActive}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            Trade
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [states, setStates] = useState(() =>
    MODS.map(mod => ({ value: mod.defaultVal, active: false }))
  );

  const combined = states
    .map((s, i) => s.active ? buildRegex(MODS[i].name, s.value) : null)
    .filter(Boolean)
    .join(' ');

  const activeMods = states
    .map((s, i) => s.active ? { param: MODS[i].param, value: s.value } : null)
    .filter(Boolean);


  const iirState   = states[MODS.findIndex(m => m.param === 'iir')];
  const rarityState = states[MODS.findIndex(m => m.param === 'rarity')];
  const packState  = states[MODS.findIndex(m => m.param === 'packsize')];
  const budgetTotal = (iirState.active ? iirState.value : 0)
                    + (rarityState.active ? rarityState.value : 0)
                    + (packState.active ? packState.value : 0);
  const allThreeActive = iirState.active && rarityState.active && packState.active;
  const anyRarityActive = iirState.active || rarityState.active;
  const rarityCapExceeded =
    (packState.active && packState.value >= 60 && anyRarityActive)
    || (packState.active && iirState.active && !rarityState.active && iirState.value + packState.value >= 95)
    || (packState.active && rarityState.active && !iirState.active && rarityState.value + packState.value >= 95)
    || (allThreeActive && iirState.value + rarityState.value >= 100 && packState.value >= 15)
    || (allThreeActive && packState.value >= 30)
    || budgetTotal > 130
    || (iirState.active && iirState.value >= 100);

  function toggle(i) {
    setStates(prev => prev.map((s, idx) => idx === i ? { ...s, active: !s.active } : s));
  }

  function setValue(i, v) {
    setStates(prev => prev.map((s, idx) => idx === i ? { ...s, value: v } : s));
  }

  function reset() {
    setStates(MODS.map(mod => ({ value: mod.defaultVal, active: false })));
  }

  return (
    <>
      <div className="poe-panel">
        {MODS.map((mod, i) => (
          <ModRow
            key={mod.name}
            mod={mod}
            value={states[i].value}
            active={states[i].active}
            onToggle={() => toggle(i)}
            onValue={v => setValue(i, v)}
            last={i === MODS.length - 1}
          />
        ))}
      </div>

      {rarityCapExceeded && (
        <p className="poe-demand-warning">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          This combination of mods may return no results.
        </p>
      )}

      <CombinedBox combined={combined} activeMods={activeMods} onReset={reset} />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
