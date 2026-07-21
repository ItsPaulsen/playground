const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "yahtzee",
  "lang": "en",
  "count": 5,
  "size": 72,
  "faceColor": "#fafaf9"
} /*EDITMODE-END*/;
const TWEAK_DEFAULTS_JSON = JSON.stringify(TWEAK_DEFAULTS);
const FACE_PALETTE = ['#fafaf9', '#fca5a5', '#fdba74', '#fcd34d', '#86efac', '#7dd3fc', '#a5b4fc', '#d8b4fe', '#f9a8d4'];
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
const LANG_OPTIONS = [{
  value: 'en',
  label: 'English'
}, {
  value: 'no',
  label: 'Norsk'
}];

// Gameplay-facing copy per language (English default). Norwegian uses the
// Scandinavian Yatzy hand names. The tweak panel itself stays English.
const STRINGS = {
  en: {
    roll: 'Roll',
    rollAgain: 'Roll again',
    noRolls: 'No rolls left',
    newTurn: 'New turn',
    rollToStart: 'Roll to start',
    turnOver: 'Turn over',
    total: 'Total',
    hands: {
      yahtzee: 'Yahtzee!',
      largeStraight: 'Large straight',
      smallStraight: 'Small straight',
      fullHouse: 'Full house',
      fourKind: 'Four of a kind',
      threeKind: 'Three of a kind',
      twoPair: 'Two pair',
      pair: 'Pair',
      none: '—'
    }
  },
  no: {
    roll: 'Trill',
    rollAgain: 'Trill igjen',
    noRolls: 'Ingen kast igjen',
    newTurn: 'Ny omgang',
    rollToStart: 'Trill for å starte',
    turnOver: 'Ferdig',
    total: 'Sum',
    hands: {
      yahtzee: 'Yatzy!',
      largeStraight: 'Stor straight',
      smallStraight: 'Liten straight',
      fullHouse: 'Hus',
      fourKind: 'Fire like',
      threeKind: 'Tre like',
      twoPair: 'To par',
      pair: 'Par',
      none: '—'
    }
  }
};

// Per-die roll duration (ms); only this varies between dice so they land at
// slightly different moments. The turn commits once the slowest die has landed.
const ROLL_MIN_MS = 950;
const ROLL_MAX_MS = 1150;

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
const easeOutCubic = p => 1 - Math.pow(1 - p, 3);

// A resting die, already oriented so its value faces the viewer. Defaults to a
// random roll; pass a value for a deterministic face.
const makeDie = (value = d6()) => ({
  value,
  locked: false,
  rx: BASE[value].x,
  ry: BASE[value].y
});

// Target orientation: one full forward turn per axis, landing on the value's face.
const nextRot = (prevX, prevY, value) => {
  const b = BASE[value];
  const dx = ((b.x - prevX % 360) % 360 + 360) % 360;
  const dy = ((b.y - prevY % 360) % 360 + 360) % 360;
  return {
    rx: prevX + 360 + dx,
    ry: prevY + 360 + dy
  };
};

// Tween cubes from their current angles to targets, writing one complete
// transform per frame. Never a CSS transition: the compositor samples a
// preserve-3d cube's faces out of sync mid-animation and visibly unfolds it.
function tumble(entries, cubes, rafRef) {
  const start = performance.now();
  const step = now => {
    let live = false;
    for (const a of entries) {
      const el = cubes[a.i];
      if (!el) continue;
      const p = Math.min(1, (now - start) / a.dur);
      const e = easeOutCubic(p);
      el.style.transform = `rotateY(${a.fy + (a.ty - a.fy) * e}deg) rotateX(${a.fx + (a.tx - a.fx) * e}deg)`;
      if (p < 1) live = true;
    }
    if (live) rafRef.current = requestAnimationFrame(step);
  };
  cancelAnimationFrame(rafRef.current);
  rafRef.current = requestAnimationFrame(step);
}

// Best hand present in the faces (best-effort, informational). Returns a key
// into STRINGS[lang].hands so the label localizes.
function scoreHand(vals) {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  vals.forEach(v => {
    counts[v]++;
  });
  const tallies = counts.slice(1);
  const max = Math.max(...tallies);
  const has = n => tallies.includes(n);
  const run = faces => faces.every(f => counts[f] > 0);
  // Scandinavian Yatzy straights use all five dice: small = 1-2-3-4-5,
  // large = 2-3-4-5-6 (not the 4-/5-in-a-row of American Yahtzee).
  const smallStraight = run([1, 2, 3, 4, 5]);
  const largeStraight = run([2, 3, 4, 5, 6]);
  if (max === 5) return 'yahtzee';
  if (largeStraight) return 'largeStraight';
  if (smallStraight) return 'smallStraight';
  if (has(3) && has(2)) return 'fullHouse';
  if (max === 4) return 'fourKind';
  if (max === 3) return 'threeKind';
  if (tallies.filter(c => c === 2).length === 2) return 'twoPair';
  if (max === 2) return 'pair';
  return 'none';
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
const Die = React.memo(function Die({
  index,
  value,
  locked,
  lockable,
  size,
  rx,
  ry,
  onToggle,
  cubeRef
}) {
  const cls = 'die' + (locked ? ' locked' : '') + (lockable ? ' lockable' : '');
  // The tumble is driven by JS (rAF) writing this element's transform each
  // frame — compositor-driven CSS transitions on a preserve-3d cube make
  // Chrome render the faces out of sync, visibly unfolding the cube mid-roll.
  // The inline transform here is just the resting pose between rolls.
  return /*#__PURE__*/React.createElement("div", {
    className: cls,
    onClick: () => onToggle(index),
    style: {
      '--s': size + 'px'
    },
    role: "button",
    "aria-pressed": locked,
    "aria-label": `Die showing ${value}${locked ? ', held' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "cube",
    ref: el => cubeRef(index, el),
    style: {
      transform: `rotateY(${ry}deg) rotateX(${rx}deg)`
    }
  }, FACES.map(f => /*#__PURE__*/React.createElement("div", {
    key: f,
    className: `face f${f}`
  }))), /*#__PURE__*/React.createElement("span", {
    className: "lock-tag"
  }, LOCK_ICON));
});
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const isDirty = JSON.stringify(t) !== TWEAK_DEFAULTS_JSON;
  const isYahtzee = t.mode === 'yahtzee';

  // Always hold 6 dice (faces 1..6 on a fresh page); the count tweak only
  // controls how many are shown, so dialing count down and back up never
  // regenerates faces.
  const [dice, setDice] = React.useState(() => Array.from({
    length: 6
  }, (_, i) => makeDie(i + 1)));
  const [rolling, setRolling] = React.useState(false);
  const [rollsUsed, setRollsUsed] = React.useState(0);
  const [hasRolled, setHasRolled] = React.useState(false);
  const [revealKey, setRevealKey] = React.useState(0);
  const [isTouch, setIsTouch] = React.useState(() => window.matchMedia('(pointer: coarse)').matches);
  const settleTimer = React.useRef(0);
  const rafId = React.useRef(0);
  const cubes = React.useRef([]);
  const setCubeRef = React.useCallback((i, el) => {
    cubes.current[i] = el;
  }, []);
  // Mirror of dice for the roll handler, so it can read current angles without
  // re-creating itself (and re-rendering every Die) on each dice change.
  const diceRef = React.useRef(dice);
  diceRef.current = dice;

  // The dice shown for the current count (always a prefix of the 6 in state).
  const shown = React.useMemo(() => dice.slice(0, t.count), [dice, t.count]);

  // Yahtzee is always 5 dice; leaving it clears the turn state so Freeplay has
  // no roll cap / holds.
  React.useEffect(() => {
    if (isYahtzee) {
      if (t.count !== 5) setTweak('count', 5);
    } else {
      setRollsUsed(0);
      setDice(prev => prev.some(d => d.locked) ? prev.map(d => ({
        ...d,
        locked: false
      })) : prev);
    }
  }, [isYahtzee]);
  React.useEffect(() => () => {
    clearTimeout(settleTimer.current);
    cancelAnimationFrame(rafId.current);
  }, []);

  // Cap the die size lower on touch devices (phones/tablets), regardless of
  // orientation — width alone misfires in landscape.
  const SIZE_MAX = isTouch ? 88 : 120;
  React.useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const onChange = () => setIsTouch(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  React.useEffect(() => {
    if (t.size > SIZE_MAX) setTweak('size', SIZE_MAX);
  }, [SIZE_MAX]);
  const turnOver = isYahtzee && rollsUsed >= MAX_ROLLS;
  const canRoll = !rolling && !turnOver;
  const roll = React.useCallback(() => {
    setRolling(true);
    setHasRolled(true);

    // Draw each unlocked die's new value + target orientation, then tumble.
    // After the last roll of a turn holds are meaningless, so they release
    // as the dice settle.
    const isLastRoll = isYahtzee && rollsUsed + 1 >= MAX_ROLLS;
    const anims = [];
    const next = diceRef.current.map((d, i) => {
      if (i >= t.count) return d; // hidden die — leave it
      if (d.locked) return {
        ...d,
        locked: !isLastRoll
      };
      const value = d6();
      const {
        rx,
        ry
      } = nextRot(d.rx, d.ry, value);
      anims.push({
        i,
        fx: d.rx,
        fy: d.ry,
        tx: rx,
        ty: ry,
        dur: randInt(ROLL_MIN_MS, ROLL_MAX_MS)
      });
      return {
        ...d,
        value,
        rx,
        ry
      };
    });
    tumble(anims, cubes.current, rafId);

    // Commit exactly when the slowest die of THIS roll lands, so the disabled
    // window tracks the real motion instead of a fixed worst-case time (which
    // left the buttons greyed for up to ~200ms after the dice had stopped).
    const settleMs = anims.reduce((m, a) => Math.max(m, a.dur), 0) + 40;
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      // React re-renders each cube with exactly the transform the last tween
      // frame wrote, so nothing jumps. Count the roll only now, as the dice
      // land, so the counter (and the "Turn over" state it drives) never jumps
      // ahead of the animation.
      setDice(next);
      setRolling(false);
      setRevealKey(k => k + 1);
      if (isYahtzee) setRollsUsed(n => n + 1);
    }, settleMs);
  }, [isYahtzee, rollsUsed, t.count]);

  // Held between rolls (Yahtzee only, and only once you've rolled). Guards live
  // in a ref so the handler stays stable and dice can skip re-rendering.
  const guard = React.useRef({});
  guard.current = {
    rolling,
    isYahtzee,
    hasRolled,
    turnOver
  };
  const toggleLock = React.useCallback(i => {
    const g = guard.current;
    if (g.rolling || !g.isYahtzee || !g.hasRolled || g.turnOver) return;
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
  const S = STRINGS[t.lang] || STRINGS.en;
  const total = React.useMemo(() => shown.reduce((s, d) => s + d.value, 0), [shown]);
  const showTotal = t.count > 1;
  const handName = React.useMemo(() => isYahtzee && hasRolled ? S.hands[scoreHand(shown.map(d => d.value))] : null, [shown, isYahtzee, hasRolled, S]);
  const rollLabel = isYahtzee && turnOver ? S.noRolls : isYahtzee && hasRolled ? S.rollAgain : S.roll;

  // Readout: a small label on top, big text below — same layout in both modes.
  // Yahtzee labels the roll counter and shows the hand; Freeplay labels the
  // total and shows its number. A lone die (Freeplay) shows neither.
  const readoutLabel = isYahtzee ? turnOver ? S.turnOver : `${rollsUsed} / ${MAX_ROLLS}` : showTotal ? S.total : null;
  const readoutLabelAria = isYahtzee && !turnOver ? `${rollsUsed} of ${MAX_ROLLS} rolls used` : undefined;
  // Same "rolling…" indicator in both modes: the animated dots read better
  // than a static dash while the dice are in the air.
  const rollingBody = /*#__PURE__*/React.createElement("span", {
    className: "roll-dots"
  }, /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null));
  const restingBody = isYahtzee ? hasRolled ? handName : S.rollToStart : total;
  const showBody = isYahtzee || showTotal;
  const stageStyle = {
    '--face': t.faceColor,
    '--lock-ring': HOLD_COLOR,
    // Fixed Roll-button width, sized to the longest label in the active
    // language ("No rolls left" vs the longer "Ingen kast igjen").
    '--btn-w': t.lang === 'no' ? '184px' : '156px',
    // A tumbling cube's silhouette widens to ~1.41x at 45°, so the gap must
    // clear ~0.41x the die size or neighbours overlap mid-roll.
    '--die-gap': Math.round(t.size * 0.44) + 'px'
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "stage",
    style: stageStyle
  }, /*#__PURE__*/React.createElement("div", {
    className: "readout"
  }, readoutLabel && /*#__PURE__*/React.createElement("div", {
    className: `sub${turnOver ? ' pop' : ''}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "total",
    "aria-label": readoutLabelAria
  }, readoutLabel)), !showBody ? /*#__PURE__*/React.createElement("div", {
    className: "hand"
  }) : rolling ? /*#__PURE__*/React.createElement("div", {
    className: "hand"
  }, rollingBody) : /*#__PURE__*/React.createElement("div", {
    className: `hand ${turnOver ? 'final' : 'reveal'}`,
    key: revealKey
  }, restingBody)), /*#__PURE__*/React.createElement("div", {
    className: "tray"
  }, shown.map((d, i) => /*#__PURE__*/React.createElement(Die, {
    key: i,
    index: i,
    value: d.value,
    locked: d.locked,
    lockable: isYahtzee && hasRolled && !rolling && !turnOver,
    size: t.size,
    rx: d.rx,
    ry: d.ry,
    onToggle: toggleLock,
    cubeRef: setCubeRef
  }))), /*#__PURE__*/React.createElement("div", {
    className: "controls"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: roll,
    disabled: !canRoll
  }, rollLabel), isYahtzee && /*#__PURE__*/React.createElement("button", {
    className: "btn ghost",
    onClick: newTurn,
    disabled: rolling || !hasRolled && rollsUsed === 0
  }, S.newTurn)), /*#__PURE__*/React.createElement(TweaksPanel, {
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
    label: "Language"
  }, /*#__PURE__*/React.createElement(TweakRadio, {
    value: t.lang,
    options: LANG_OPTIONS,
    onChange: v => setTweak('lang', v)
  })), /*#__PURE__*/React.createElement(TweakSection, {
    label: "Dice"
  }, !isYahtzee && /*#__PURE__*/React.createElement(TweakSlider, {
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
    max: SIZE_MAX,
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
