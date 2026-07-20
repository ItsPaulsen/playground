const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "yahtzee",
  "count": 5,
  "size": 72,
  "faceColor": "#fafaf9"
} /*EDITMODE-END*/;
const TWEAK_DEFAULTS_JSON = JSON.stringify(TWEAK_DEFAULTS);
const FACE_PALETTE = ['#fafaf9', '#fca5a5', '#fdba74', '#fcd34d', '#86efac', '#7dd3fc', '#a5b4fc', '#d8b4fe', '#f9a8d4'];
const PIP_COLOR = '#1c1917';
const HOLD_COLOR = '#4f46e5'; // shared "primary" — matches the Waystones Copy button
const MAX_ROLLS = 3;
const FACES = [1, 2, 3, 4, 5, 6];
const MODE_OPTIONS = [{
  value: 'freeplay',
  label: 'Freeplay'
}, {
  value: 'yahtzee',
  label: 'Yahtzee'
}];

// Pip layout — which of the nine 3×3 cells carry a dot for each value, flattened
// up front into the 9 span class names so render is a plain map with no lookups.
const PIP_CELLS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8]
};
const PIP_CLASSES = Object.fromEntries(FACES.map(v => [v, Array.from({
  length: 9
}, (_, i) => PIP_CELLS[v].includes(i) ? 'pip' : 'pip hidden')]));

// Cube rotation (deg, in [0,360)) that brings each face to the front.
const BASE = {
  1: {
    x: 0,
    y: 0
  },
  2: {
    x: 270,
    y: 0
  },
  3: {
    x: 0,
    y: 270
  },
  4: {
    x: 0,
    y: 90
  },
  5: {
    x: 90,
    y: 0
  },
  6: {
    x: 0,
    y: 180
  }
};
const d6 = () => 1 + Math.floor(Math.random() * 6);
const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

// A resting die, already oriented so the drawn value faces the viewer.
const makeDie = () => {
  const value = d6();
  return {
    value,
    locked: false,
    rx: BASE[value].x,
    ry: BASE[value].y,
    dur: 850
  };
};

// Next absolute rotation: spin forward whole turns, then land on the value's face.
const nextRot = (prevX, prevY, value, spinX, spinY) => {
  const b = BASE[value];
  const dx = ((b.x - prevX % 360) % 360 + 360) % 360;
  const dy = ((b.y - prevY % 360) % 360 + 360) % 360;
  return {
    rx: prevX + 360 * spinX + dx,
    ry: prevY + 360 * spinY + dy
  };
};

// Best Yahtzee-style hand present in the faces (best-effort, informational).
function scoreHand(vals) {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  vals.forEach(v => {
    counts[v]++;
  });
  const tallies = counts.slice(1);
  const max = Math.max(...tallies);
  const has = n => tallies.includes(n);
  const run = faces => faces.every(f => counts[f] > 0);
  const largeStraight = run([1, 2, 3, 4, 5]) || run([2, 3, 4, 5, 6]);
  const smallStraight = run([1, 2, 3, 4]) || run([2, 3, 4, 5]) || run([3, 4, 5, 6]);
  if (max === 5) return 'Yahtzee!';
  if (largeStraight && vals.length >= 5) return 'Large straight';
  if (has(3) && has(2)) return 'Full house';
  if (max === 4) return 'Four of a kind';
  if (smallStraight && vals.length >= 4) return 'Small straight';
  if (max === 3) return 'Three of a kind';
  if (tallies.filter(c => c === 2).length === 2) return 'Two pair';
  if (max === 2) return 'Pair';
  return '—';
}
const LOCK_ICON = /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "3",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("rect", {
  x: "4",
  y: "11",
  width: "16",
  height: "10",
  rx: "2"
}), /*#__PURE__*/React.createElement("path", {
  d: "M8 11V7a4 4 0 0 1 8 0v4"
}));

// One cube face. Pure and static per value, so memoized — the pip spans never
// re-render once mounted.
const Face = React.memo(function Face({
  value
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `face f${value}`
  }, PIP_CLASSES[value].map((cls, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: cls
  })));
});
const Die = React.memo(function Die({
  index,
  value,
  locked,
  rolling,
  size,
  rx,
  ry,
  dur,
  onToggle
}) {
  const cls = 'die' + (locked ? ' locked' : '') + (rolling ? ' rolling' : '');
  // Transforms are set inline (not via a CSS var) so the transition reliably
  // interpolates the angle — a var()-driven transform can jump/collapse.
  return /*#__PURE__*/React.createElement("div", {
    className: cls,
    onClick: () => onToggle(index),
    style: {
      '--s': size + 'px',
      '--roll-dur': dur + 'ms'
    },
    role: "button",
    "aria-pressed": locked,
    "aria-label": `Die showing ${value}${locked ? ', held' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "cube",
    style: {
      transform: `rotateY(${ry}deg)`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "cube-inner",
    style: {
      transform: `rotateX(${rx}deg)`
    }
  }, FACES.map(f => /*#__PURE__*/React.createElement("div", {
    key: `c${f}`,
    className: `cf f${f}`
  })), FACES.map(f => /*#__PURE__*/React.createElement(Face, {
    key: f,
    value: f
  })))), /*#__PURE__*/React.createElement("span", {
    className: "lock-tag"
  }, LOCK_ICON));
});
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const isDirty = JSON.stringify(t) !== TWEAK_DEFAULTS_JSON;
  const isYahtzee = t.mode === 'yahtzee';
  const [dice, setDice] = React.useState(() => Array.from({
    length: TWEAK_DEFAULTS.count
  }, makeDie));
  const [rolling, setRolling] = React.useState(false);
  const [rollsUsed, setRollsUsed] = React.useState(0);
  const [hasRolled, setHasRolled] = React.useState(false);
  const [revealKey, setRevealKey] = React.useState(0);
  const settleTimer = React.useRef(0);

  // Keep the tray length in sync with the count tweak, preserving existing dice.
  React.useEffect(() => {
    setDice(prev => {
      if (prev.length === t.count) return prev;
      return prev.length < t.count ? prev.concat(Array.from({
        length: t.count - prev.length
      }, makeDie)) : prev.slice(0, t.count);
    });
  }, [t.count]);

  // Leaving Yahtzee clears the turn state so Freeplay has no roll cap / holds.
  React.useEffect(() => {
    if (!isYahtzee) {
      setRollsUsed(0);
      setDice(prev => prev.some(d => d.locked) ? prev.map(d => ({
        ...d,
        locked: false
      })) : prev);
    }
  }, [isYahtzee]);
  React.useEffect(() => () => clearTimeout(settleTimer.current), []);
  const turnOver = isYahtzee && rollsUsed >= MAX_ROLLS;
  const canRoll = !rolling && !turnOver;
  const roll = React.useCallback(() => {
    setRolling(true);
    setHasRolled(true);
    // The roll has happened the moment you click — count it now, not on settle.
    if (isYahtzee) setRollsUsed(n => n + 1);

    // Each unlocked die tumbles in 3D — whole spins plus a landing turn onto its
    // drawn face. Varied spins + durations keep them from moving in lockstep.
    setDice(ds => ds.map(d => {
      if (d.locked) return d;
      const value = d6();
      const {
        rx,
        ry
      } = nextRot(d.rx, d.ry, value, randInt(1, 2), randInt(1, 2));
      return {
        ...d,
        value,
        rx,
        ry,
        dur: randInt(880, 1080)
      };
    }));
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      setRolling(false);
      setRevealKey(k => k + 1);
    }, 1140);
  }, [isYahtzee]);

  // Held between rolls (Yahtzee only, and only once you've rolled). Guards live
  // in a ref so the handler stays stable and dice can skip re-rendering.
  const guard = React.useRef({});
  guard.current = {
    rolling,
    isYahtzee,
    hasRolled
  };
  const toggleLock = React.useCallback(i => {
    const g = guard.current;
    if (g.rolling || !g.isYahtzee || !g.hasRolled) return;
    setDice(ds => ds.map((d, j) => j === i ? {
      ...d,
      locked: !d.locked
    } : d));
  }, []);

  // A new turn isn't a roll — just clear the counter and release holds, leaving
  // the previous faces in place. The first Roll of the turn is the real 1/3.
  const newTurn = React.useCallback(() => {
    setRollsUsed(0);
    setHasRolled(false);
    setDice(ds => ds.map(d => ({
      ...d,
      locked: false
    })));
  }, []);
  const total = React.useMemo(() => dice.reduce((s, d) => s + d.value, 0), [dice]);
  const handName = React.useMemo(() => isYahtzee && hasRolled ? scoreHand(dice.map(d => d.value)) : null, [dice, isYahtzee, hasRolled]);
  const rollLabel = isYahtzee && turnOver ? 'No rolls left' : isYahtzee && hasRolled ? 'Roll again' : 'Roll';
  const stageStyle = {
    '--face': t.faceColor,
    '--pip': PIP_COLOR,
    '--lock-ring': HOLD_COLOR,
    // A tumbling cube's silhouette widens to ~1.41x at 45°, so the gap must
    // clear ~0.41x the die size or neighbours overlap mid-roll.
    '--die-gap': Math.round(t.size * 0.44) + 'px'
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "stage",
    style: stageStyle
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, !isYahtzee ? /*#__PURE__*/React.createElement("div", {
    className: "hand"
  }) : rolling ? /*#__PURE__*/React.createElement("div", {
    className: "hand"
  }, /*#__PURE__*/React.createElement("span", {
    className: "roll-dots"
  }, /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null))) : /*#__PURE__*/React.createElement("div", {
    className: "hand reveal",
    key: revealKey
  }, hasRolled ? handName : 'Roll to start'), dice.length > 1 && /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, /*#__PURE__*/React.createElement("span", {
    className: "total"
  }, rolling ? '–' : total))), /*#__PURE__*/React.createElement("div", {
    className: "tray"
  }, dice.map((d, i) => /*#__PURE__*/React.createElement(Die, {
    key: i,
    index: i,
    value: d.value,
    locked: d.locked,
    rolling: rolling && !d.locked,
    size: t.size,
    rx: d.rx,
    ry: d.ry,
    dur: d.dur,
    onToggle: toggleLock
  }))), isYahtzee && /*#__PURE__*/React.createElement("div", {
    className: "roll-counter",
    "aria-label": `${rollsUsed} of ${MAX_ROLLS} rolls used`
  }, rollsUsed, " / ", MAX_ROLLS), /*#__PURE__*/React.createElement("div", {
    className: "controls"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: roll,
    disabled: !canRoll
  }, rollLabel), isYahtzee && /*#__PURE__*/React.createElement("button", {
    className: "btn ghost",
    onClick: newTurn,
    disabled: rolling || !hasRolled && rollsUsed === 0
  }, "New turn")), /*#__PURE__*/React.createElement(TweaksPanel, {
    title: "Dice",
    renderMobileFooter: close => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(TweakButton, {
      label: "Reset",
      secondary: true,
      disabled: !isDirty,
      onClick: () => setTweak(TWEAK_DEFAULTS)
    }), /*#__PURE__*/React.createElement(TweakButton, {
      label: "Show",
      onClick: close
    }))
  }, /*#__PURE__*/React.createElement(TweakSection, null, /*#__PURE__*/React.createElement(TweakRadio, {
    value: t.mode,
    options: MODE_OPTIONS,
    onChange: v => setTweak('mode', v)
  })), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Dice"
  }, /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Count",
    value: t.count,
    min: 1,
    max: 6,
    step: 1,
    onChange: v => setTweak('count', v)
  }), /*#__PURE__*/React.createElement(TweakSlider, {
    label: "Size",
    value: t.size,
    min: 48,
    max: 120,
    step: 2,
    unit: "px",
    onChange: v => setTweak('size', v)
  })), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Look"
  }, /*#__PURE__*/React.createElement(TweakColor, {
    label: "Face",
    value: t.faceColor,
    options: FACE_PALETTE,
    noAlpha: true,
    onChange: v => setTweak('faceColor', v)
  })), /*#__PURE__*/React.createElement("div", {
    className: "twk-desktop-only",
    style: {
      display: 'flex',
      gap: 8,
      borderTop: '1px solid var(--bd)',
      marginTop: '8px',
      paddingTop: '16px'
    }
  }, /*#__PURE__*/React.createElement(TweakButton, {
    label: "Reset",
    secondary: true,
    disabled: !isDirty,
    onClick: () => setTweak(TWEAK_DEFAULTS)
  }))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
