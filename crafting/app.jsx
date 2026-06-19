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
        currency: [{ label: 'Greater Essence of Seeking', ninja: 'Greater Essence of Seeking', desc: 'Upgrades a Magic item to a Rare item, adding a guaranteed Critical Hit Chance modifier.' }],
        goal: 'Guarantees T3 Critical Hit Chance',
        note: 'This is your one guaranteed craft — use it here.',
      },
      {
        title: 'Unveil a Prefix',
        currency: [
          { label: 'Omen of Sinistral Necromancy', ninja: 'Omen of Sinistral Necromancy', desc: 'While active in your inventory, your next Desecration attempt will add only prefix modifiers.' },
          { label: 'Ancient Jawbone', ninja: 'Ancient Jawbone', desc: 'Desecrates a Rare Weapon or Quiver, adding a new random modifier.' },
        ],
        goal: 'High flat physical damage — high tier elemental flat also works',
        note: 'Ancient Jawbone is cheaper early league. Consider Abyssal Echoes depending on prices.',
      },
      {
        title: 'Fill remaining affixes',
        currency: [
          { label: 'Greater Exalted Orb', ninja: 'Greater Exalted Orb', desc: 'Augments a Rare item with a new random modifier.' },
          { label: 'Omen of Greater Exaltation', ninja: 'Omen of Greater Exaltation', desc: 'While active in your inventory, your next Exalted Orb will add two random modifiers.' },
        ],
        goal: 'Fill out the last 2 affixes',
        note: 'Pick Exalt tier based on how good your bow is and current prices. Pure RNG from here.',
      },
    ],
  },
];

async function fetchPrices() {
  const res = await fetch('/crafting/prices.json');
  if (!res.ok) return {};
  return res.json();
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
  let total = 0, found = 0;
  for (const c of step.currency) {
    const divs = prices[c.ninja];
    if (divs != null) { total += divs; found++; }
  }
  if (!found) return null;
  if (total >= 1) return `~${+total.toFixed(1)} div`;
  const chaosPerDiv = prices['Chaos Orb'] ? 1 / prices['Chaos Orb'] : null;
  if (chaosPerDiv) {
    const chaos = Math.round(total * chaosPerDiv);
    return chaos < 1 ? `<1c` : `~${chaos}c`;
  }
  return `~${+total.toFixed(2)} div`;
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

function CurrencyChip({ c, prices }) {
  const [open, setOpen] = React.useState(false);
  const divs = prices ? prices[c.ninja] : null;
  let price = null;
  if (divs != null) {
    if (divs >= 1) {
      price = `~${+divs.toFixed(1)} div`;
    } else {
      const chaosPerDiv = prices['Chaos Orb'] ? 1 / prices['Chaos Orb'] : null;
      if (chaosPerDiv) {
        const chaos = Math.round(divs * chaosPerDiv);
        price = chaos < 1 ? '<1c' : `~${chaos}c`;
      }
    }
  }
  if (!c.desc && !price) return React.createElement('span', { className: 'craft-currency' }, c.label);
  return (
    <span className="craft-chip-wrap">
      <span
        className="craft-currency craft-currency--tip"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {c.label}
        {price && <span className="craft-chip-price">{price}</span>}
      </span>
      {open && (c.desc) && (
        <span className="craft-chip-tooltip">{c.desc}</span>
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
              <CurrencyChip key={c.label} c={c} prices={prices} />
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
