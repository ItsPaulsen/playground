const { useState, useEffect } = React;

const LEAGUE = 'Runes of Aldur';

const GUIDES = [
  {
    id: 'crit-bow',
    name: 'Crit Bow',
    ilvl: 75,
    bases: ['Obliterator Bow', 'Warmonger Bow'],
    baseInfo: [
      {
        name: 'Obliterator Bow',
        stats: [{ label: 'Damage', value: '62–115' }, { label: 'APS', value: '1.10' }, { label: 'Proj. Range', value: '−50%' }],
        desc: 'Higher base damage, slower attack speed. −50% projectile range — best for close-range builds (e.g. Snipe) or skills that clear off-screen.',
      },
      {
        name: 'Warmonger Bow',
        stats: [{ label: 'Damage', value: '56–84' }, { label: 'APS', value: '1.20' }, { label: 'Proj. Range', value: '—' }],
        desc: 'Faster attack speed, slightly lower base damage. Better for rapid-attack playstyles.',
      },
    ],
    intro: null,
    steps: [
      {
        title: 'Start with a high %phys base',
        currency: [],
        goal: 'Higher is better but any works. Buy or pick up bases and Trans/Aug until you find one.',
        note: null,
      },
      {
        title: 'Use Greater Essence of Seeking',
        currency: [{ label: 'Greater Essence of Seeking', ninja: 'Greater Essence of Seeking' }],
        goal: 'Guarantees T3 Critical Hit Chance',
        note: 'This is your one guaranteed craft — use it here.',
      },
      {
        title: 'Unveil a Prefix',
        currency: [
          { label: 'Sinistral Necromancy', ninja: 'Sinistral Necromancy' },
          { label: 'Jawbone', ninja: 'Jawbone' },
        ],
        goal: 'High flat physical damage — high tier elemental flat also works',
        note: 'Ancient Jawbone is cheaper early league. Consider Abyssal Echoes depending on prices.',
      },
      {
        title: 'Fill remaining affixes',
        currency: [
          { label: 'Greater Exalt', ninja: 'Greater Exalted Orb' },
          { label: 'Omen of Greater Exaltation', ninja: 'Omen of Greater Exaltation' },
        ],
        goal: 'Fill out the last 2 affixes',
        note: 'Pick Exalt tier based on how good your bow is and current prices. Pure RNG from here.',
      },
    ],
  },
];

async function fetchPrices() {
  const base = `https://poe.ninja/api/data`;
  const league = encodeURIComponent(LEAGUE);
  const endpoints = [
    `${base}/currencyoverview?league=${league}&type=Currency`,
    `${base}/itemoverview?league=${league}&type=Essence`,
    `${base}/itemoverview?league=${league}&type=Omen`,
    `${base}/itemoverview?league=${league}&type=Scarab`,
  ];

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
    fetchPrices()
      .then(setPrices)
      .catch(() => setError(true));
  }, []);

  return { prices, error };
}

function stepCost(step, prices) {
  if (!prices || !step.currency.length) return null;
  const divine = prices['Divine Orb'];
  if (!divine) return null;

  let total = 0;
  let found = 0;
  for (const c of step.currency) {
    const chaos = prices[c.ninja];
    if (chaos != null) { total += chaos; found++; }
  }
  if (!found) return null;
  const divs = total / divine;
  return divs < .1 ? `<0.1 div` : `~${+divs.toFixed(1)} div`;
}

function BaseTooltip({ baseInfo }) {
  const [open, setOpen] = React.useState(false);
  return (
    <span className="craft-tooltip-wrap">
      <button
        className="craft-info-btn"
        aria-label="Base info"
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        onBlur={() => setOpen(false)}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      </button>
      {open && (
        <div className="craft-tooltip">
          {baseInfo.map(b => (
            <div key={b.name} className="craft-tooltip-row">
              <span className="craft-tooltip-name">{b.name}</span>
              {b.stats && (
                <div className="craft-tooltip-stats">
                  {b.stats.map(s => (
                    <span key={s.label} className="craft-tooltip-stat">
                      <span className="craft-tooltip-stat-label">{s.label}</span>
                      <span className="craft-tooltip-stat-value">{s.value}</span>
                    </span>
                  ))}
                </div>
              )}
              <span className="craft-tooltip-desc">{b.desc}</span>
            </div>
          ))}
        </div>
      )}
    </span>
  );
}

function Step({ step, index, checked, onToggle, prices }) {
  const cost = stepCost(step, prices);
  return (
    <div className={`craft-step${checked ? ' checked' : ''}`} onClick={onToggle}>
      <button
        className="craft-check"
        onClick={e => { e.stopPropagation(); onToggle(); }}
        aria-pressed={checked}
        aria-label={`Mark step ${index + 1} complete`}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <polyline points="3,8 6.5,12 13,4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div className="craft-step-body">
        <div className="craft-step-header">
          <span className="craft-step-num">Step {index + 1}</span>
          <span className="craft-step-title">{step.title}</span>
          {cost && <span className="craft-step-cost">{cost}</span>}
        </div>
        {step.currency.length > 0 && (
          <div className="craft-currencies">
            {step.currency.map(c => (
              <span key={c.label} className="craft-currency">{c.label}</span>
            ))}
          </div>
        )}
        <p className="craft-goal">{step.goal}</p>
        {step.note && <p className="craft-note">{step.note}</p>}
      </div>
    </div>
  );
}

function Guide({ guide, prices }) {
  const [checked, setChecked] = useState(() => guide.steps.map(() => false));

  function toggle(i) {
    setChecked(prev => prev.map((v, idx) => idx === i ? !v : v));
  }

  function reset() {
    setChecked(guide.steps.map(() => false));
  }

  const done = checked.filter(Boolean).length;
  const total = guide.steps.length;

  return (
    <div className="craft-guide">
      <div className="craft-guide-header">
        <div>
          <h2 className="craft-guide-name">{guide.name}</h2>
          <div className="craft-guide-meta">
            <span>ilvl {guide.ilvl}+</span>
            <span className="craft-meta-sep">·</span>
            <span>{guide.bases.join(' or ')}</span>
            {guide.baseInfo && <BaseTooltip baseInfo={guide.baseInfo} />}
          </div>
        </div>
        <div className="craft-guide-progress">
          <span className="craft-progress-label">{done}/{total}</span>
          {done > 0 && (
            <button className="craft-reset-btn" onClick={reset} aria-label="Reset steps">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>
      {guide.intro && <p className="craft-intro">{guide.intro}</p>}
      <div className="craft-steps">
        {guide.steps.map((step, i) => (
          <Step key={i} step={step} index={i} checked={checked[i]} onToggle={() => toggle(i)} prices={prices} />
        ))}
      </div>
    </div>
  );
}

function App() {
  const { prices } = usePrices();

  return (
    <>
      {GUIDES.map(guide => <Guide key={guide.id} guide={guide} prices={prices} />)}
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
