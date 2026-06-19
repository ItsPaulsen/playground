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
        title: 'T2 Phys Base',
        currency: [],
        goal: '155–169% increased Physical Damage (ilvl 75+)',
        note: 'If the base only has one mod, augment it before using an essence.',
        tradeLinks: [
          { label: 'Obliterator Bow', url: 'https://www.pathofexile.com/trade2/search/poe2/Runes%20of%20Aldur?q=%7B%22query%22%3A%7B%22status%22%3A%7B%22option%22%3A%22securable%22%7D%2C%22type%22%3A%22Obliterator%20Bow%22%2C%22stats%22%3A%5B%7B%22type%22%3A%22and%22%2C%22filters%22%3A%5B%7B%22id%22%3A%22explicit.stat_1509134228%22%2C%22value%22%3A%7B%22min%22%3A155%7D%2C%22disabled%22%3Afalse%7D%5D%7D%5D%2C%22filters%22%3A%7B%22type_filters%22%3A%7B%22filters%22%3A%7B%22rarity%22%3A%7B%22option%22%3A%22magic%22%7D%7D%7D%2C%22misc_filters%22%3A%7B%22filters%22%3A%7B%22ilvl%22%3A%7B%22min%22%3A75%7D%7D%7D%7D%7D%2C%22sort%22%3A%7B%22price%22%3A%22asc%22%7D%7D' },
          { label: 'Warmonger Bow', url: 'https://www.pathofexile.com/trade2/search/poe2/Runes%20of%20Aldur?q=%7B%22query%22%3A%7B%22status%22%3A%7B%22option%22%3A%22securable%22%7D%2C%22type%22%3A%22Warmonger%20Bow%22%2C%22stats%22%3A%5B%7B%22type%22%3A%22and%22%2C%22filters%22%3A%5B%7B%22id%22%3A%22explicit.stat_1509134228%22%2C%22value%22%3A%7B%22min%22%3A155%7D%2C%22disabled%22%3Afalse%7D%5D%7D%5D%2C%22filters%22%3A%7B%22type_filters%22%3A%7B%22filters%22%3A%7B%22rarity%22%3A%7B%22option%22%3A%22magic%22%7D%7D%7D%2C%22misc_filters%22%3A%7B%22filters%22%3A%7B%22ilvl%22%3A%7B%22min%22%3A75%7D%7D%7D%7D%7D%2C%22sort%22%3A%7B%22price%22%3A%22asc%22%7D%7D' },
        ],
      },
      {
        title: 'Use Greater Essence of Seeking',
        currency: [{ label: 'Greater Essence of Seeking', ninja: 'Greater Essence of Seeking', desc: 'Upgrades a Magic item to a Rare item, adding a guaranteed Critical Hit Chance modifier.' }],
        goal: 'Guarantees T3 Critical Hit Chance',
        note: 'This is your one guaranteed craft.',
      },
      {
        title: 'Unveil a Prefix',
        currency: [
          { label: 'Omen of Sinistral Necromancy', ninja: 'Omen of Sinistral Necromancy', desc: 'While active in your inventory, your next Desecration attempt will add only prefix modifiers.' },
          { label: 'Ancient Jawbone', ninja: 'Ancient Jawbone', desc: 'Desecrates a Rare Weapon or Quiver, adding a new random modifier.' },
        ],
        goal: 'High flat physical damage',
        note: 'High tier elemental flat also works.',
      },
      {
        title: 'Fill remaining affixes',
        currency: [
          { label: 'Greater Exalted Orb', ninja: 'Greater Exalted Orb', desc: 'Augments a Rare item with a new random modifier.' },
          { label: 'Omen of Greater Exaltation', ninja: 'Omen of Greater Exaltation', desc: 'While active in your inventory, your next Exalted Orb will add two random modifiers.' },
        ],
        goal: 'Fill out the last 2 affixes',
        note: 'Can also use Perfect Exalted Orb if you prefer.',
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

function Step({ step, index, prices }) {
  const cost = stepCost(step, prices);
  const hasCurrency = step.currency.length > 0;
  const hasLinks = step.tradeLinks && step.tradeLinks.length > 0;
  return (
    <div className="craft-step">
      <span className="craft-step-num">{index + 1}.</span>
      <div className="craft-step-body">
        <div className="craft-step-header">
          <div className="craft-header-items">
            {hasCurrency && step.currency.map((c, i) => (
              <React.Fragment key={c.label}>
                {i > 0 && <span className="craft-sep">+</span>}
                <CurrencyChip c={c} prices={prices} />
              </React.Fragment>
            ))}
            {hasLinks && step.tradeLinks.map((t, i) => (
              <React.Fragment key={t.label}>
                {i > 0 && <span className="craft-sep">or</span>}
                <a className="craft-trade-link" href={t.url} target="_blank" rel="noopener">
                  {t.label}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              </React.Fragment>
            ))}
          </div>
          {cost && <span className="craft-step-cost">{cost}</span>}
        </div>
        <p className="craft-goal">{step.goal}</p>
        {step.note && <p className="craft-note">{step.note}</p>}
      </div>
    </div>
  );
}

function Guide({ guide, prices }) {
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
      </div>
      {guide.intro && <p className="craft-intro">{guide.intro}</p>}
      <div className="craft-steps">
        {guide.steps.map((step, i) => (
          <Step key={i} step={step} index={i} prices={prices} />
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
