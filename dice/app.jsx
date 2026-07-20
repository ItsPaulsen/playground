const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "yahtzee",
  "count": 5,
  "size": 72,
  "faceColor": "#fafaf9"
}/*EDITMODE-END*/;
const TWEAK_DEFAULTS_JSON = JSON.stringify(TWEAK_DEFAULTS);

const FACE_PALETTE = ['#fafaf9', '#fca5a5', '#fdba74', '#fcd34d', '#86efac', '#7dd3fc', '#a5b4fc', '#d8b4fe', '#f9a8d4'];
const HOLD_COLOR = '#4f46e5'; // shared "primary" — matches the Waystones Copy button
const MAX_ROLLS = 3;
const FACES = [1, 2, 3, 4, 5, 6];
const MODE_OPTIONS = [{ value: 'freeplay', label: 'Freeplay' }, { value: 'yahtzee', label: 'Yahtzee' }];

// Per-die roll duration (ms); only this varies between dice so they land at
// slightly different moments. The turn commits once the slowest die has landed.
const ROLL_MIN_MS = 950;
const ROLL_MAX_MS = 1150;

// Cube rotation (deg, in [0,360)) that brings each face to the front.
const BASE = {
  1: { x: 0, y: 0 },
  2: { x: 270, y: 0 },
  3: { x: 0, y: 270 },
  4: { x: 0, y: 90 },
  5: { x: 90, y: 0 },
  6: { x: 0, y: 180 },
};

const d6 = () => 1 + Math.floor(Math.random() * 6);
const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);

// A resting die, already oriented so its value faces the viewer. Defaults to a
// random roll; pass a value for a deterministic face.
const makeDie = (value = d6()) => ({ value, locked: false, rx: BASE[value].x, ry: BASE[value].y });

// Target orientation: one full forward turn per axis, landing on the value's face.
const nextRot = (prevX, prevY, value) => {
  const b = BASE[value];
  const dx = (((b.x - (prevX % 360)) % 360) + 360) % 360;
  const dy = (((b.y - (prevY % 360)) % 360) + 360) % 360;
  return { rx: prevX + 360 + dx, ry: prevY + 360 + dy };
};

// Tween cubes from their current angles to targets, writing one complete
// transform per frame. Never a CSS transition: the compositor samples a
// preserve-3d cube's faces out of sync mid-animation and visibly unfolds it.
function tumble(entries, cubes, rafRef) {
  const start = performance.now();
  const step = (now) => {
    let live = false;
    for (const a of entries) {
      const el = cubes[a.i];
      if (!el) continue;
      const p = Math.min(1, (now - start) / a.dur);
      const e = easeOutCubic(p);
      el.style.transform =
        `rotateY(${a.fy + (a.ty - a.fy) * e}deg) rotateX(${a.fx + (a.tx - a.fx) * e}deg)`;
      if (p < 1) live = true;
    }
    if (live) rafRef.current = requestAnimationFrame(step);
  };
  cancelAnimationFrame(rafRef.current);
  rafRef.current = requestAnimationFrame(step);
}

// Best Yahtzee-style hand present in the faces (best-effort, informational).
function scoreHand(vals) {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  vals.forEach((v) => { counts[v]++; });
  const tallies = counts.slice(1);
  const max = Math.max(...tallies);
  const has = (n) => tallies.includes(n);
  const run = (faces) => faces.every((f) => counts[f] > 0);
  // Scandinavian Yatzy straights use all five dice: small = 1-2-3-4-5,
  // large = 2-3-4-5-6 (not the 4-/5-in-a-row of American Yahtzee).
  const smallStraight = run([1, 2, 3, 4, 5]);
  const largeStraight = run([2, 3, 4, 5, 6]);

  if (max === 5) return 'Yahtzee!';
  if (largeStraight) return 'Large straight';
  if (smallStraight) return 'Small straight';
  if (has(3) && has(2)) return 'Full house';
  if (max === 4) return 'Four of a kind';
  if (max === 3) return 'Three of a kind';
  if (tallies.filter((c) => c === 2).length === 2) return 'Two pair';
  if (max === 2) return 'Pair';
  return '—';
}

const LOCK_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const Die = React.memo(function Die({ index, value, locked, lockable, size, rx, ry, onToggle, cubeRef }) {
  const cls = 'die' + (locked ? ' locked' : '') + (lockable ? ' lockable' : '');
  // The tumble is driven by JS (rAF) writing this element's transform each
  // frame — compositor-driven CSS transitions on a preserve-3d cube make
  // Chrome render the faces out of sync, visibly unfolding the cube mid-roll.
  // The inline transform here is just the resting pose between rolls.
  return (
    <div className={cls} onClick={() => onToggle(index)}
         style={{ '--s': size + 'px' }}
         role="button" aria-pressed={locked} aria-label={`Die showing ${value}${locked ? ', held' : ''}`}>
      <div className="cube" ref={(el) => cubeRef(index, el)}
           style={{ transform: `rotateY(${ry}deg) rotateX(${rx}deg)` }}>
        {/* Faces carry their pips as baked-in SVG backgrounds (see CSS). */}
        {FACES.map((f) => <div key={f} className={`face f${f}`} />)}
      </div>
      <span className="lock-tag">{LOCK_ICON}</span>
    </div>
  );
});

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const isDirty = JSON.stringify(t) !== TWEAK_DEFAULTS_JSON;
  const isYahtzee = t.mode === 'yahtzee';

  // Always hold 6 dice (faces 1..6 on a fresh page); the count tweak only
  // controls how many are shown, so dialing count down and back up never
  // regenerates faces.
  const [dice, setDice] = React.useState(() => Array.from({ length: 6 }, (_, i) => makeDie(i + 1)));
  const [rolling, setRolling] = React.useState(false);
  const [rollsUsed, setRollsUsed] = React.useState(0);
  const [hasRolled, setHasRolled] = React.useState(false);
  const [revealKey, setRevealKey] = React.useState(0);
  const [isTouch, setIsTouch] = React.useState(() => window.matchMedia('(pointer: coarse)').matches);
  const settleTimer = React.useRef(0);
  const rafId = React.useRef(0);
  const cubes = React.useRef([]);
  const setCubeRef = React.useCallback((i, el) => { cubes.current[i] = el; }, []);
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
      setDice((prev) => (prev.some((d) => d.locked) ? prev.map((d) => ({ ...d, locked: false })) : prev));
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
      if (i >= t.count) return d;                        // hidden die — leave it
      if (d.locked) return { ...d, locked: !isLastRoll };
      const value = d6();
      const { rx, ry } = nextRot(d.rx, d.ry, value);
      anims.push({ i, fx: d.rx, fy: d.ry, tx: rx, ty: ry, dur: randInt(ROLL_MIN_MS, ROLL_MAX_MS) });
      return { ...d, value, rx, ry };
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
      setRevealKey((k) => k + 1);
      if (isYahtzee) setRollsUsed((n) => n + 1);
    }, settleMs);
  }, [isYahtzee, rollsUsed, t.count]);

  // Held between rolls (Yahtzee only, and only once you've rolled). Guards live
  // in a ref so the handler stays stable and dice can skip re-rendering.
  const guard = React.useRef({});
  guard.current = { rolling, isYahtzee, hasRolled, turnOver };
  const toggleLock = React.useCallback((i) => {
    const g = guard.current;
    if (g.rolling || !g.isYahtzee || !g.hasRolled || g.turnOver) return;
    setDice((ds) => ds.map((d, j) => (j === i ? { ...d, locked: !d.locked } : d)));
  }, []);

  // A new turn isn't a roll — just clear the counter and release holds, leaving
  // the previous faces in place. The first Roll of the turn is the real 1/3.
  const newTurn = React.useCallback(() => {
    setRollsUsed(0);
    setHasRolled(false);
    setDice((ds) => ds.map((d) => ({ ...d, locked: false })));
  }, []);

  const total = React.useMemo(() => shown.reduce((s, d) => s + d.value, 0), [shown]);
  const showTotal = t.count > 1;
  const handName = React.useMemo(
    () => (isYahtzee && hasRolled ? scoreHand(shown.map((d) => d.value)) : null),
    [shown, isYahtzee, hasRolled],
  );

  const rollLabel = isYahtzee && turnOver ? 'No rolls left'
    : isYahtzee && hasRolled ? 'Roll again'
    : 'Roll';

  // Readout: a small label on top, big text below — same layout in both modes.
  // Yahtzee labels the roll counter and shows the hand; Freeplay labels the
  // total and shows its number. A lone die (Freeplay) shows neither.
  const readoutLabel = isYahtzee ? (turnOver ? 'Turn over' : `${rollsUsed} / ${MAX_ROLLS}`)
    : showTotal ? 'Total' : null;
  const readoutLabelAria = isYahtzee && !turnOver ? `${rollsUsed} of ${MAX_ROLLS} rolls used` : undefined;
  // Same "rolling…" indicator in both modes: the animated dots read better
  // than a static dash while the dice are in the air.
  const rollingBody = <span className="roll-dots"><i /><i /><i /></span>;
  const restingBody = isYahtzee ? (hasRolled ? handName : 'Roll to start') : total;
  const showBody = isYahtzee || showTotal;

  const stageStyle = {
    '--face': t.faceColor,
    '--lock-ring': HOLD_COLOR,
    // A tumbling cube's silhouette widens to ~1.41x at 45°, so the gap must
    // clear ~0.41x the die size or neighbours overlap mid-roll.
    '--die-gap': Math.round(t.size * 0.44) + 'px',
  };

  return (
    <div className="stage" style={stageStyle}>
      <div className="readout">
        {readoutLabel && (
          <div className={`sub${turnOver ? ' pop' : ''}`}>
            <span className="total" aria-label={readoutLabelAria}>{readoutLabel}</span>
          </div>
        )}
        {!showBody ? <div className="hand" />
          : rolling ? <div className="hand">{rollingBody}</div>
          : <div className={`hand ${turnOver ? 'final' : 'reveal'}`} key={revealKey}>{restingBody}</div>}
      </div>

      <div className="tray">
        {shown.map((d, i) => (
          <Die key={i} index={i} value={d.value} locked={d.locked}
               lockable={isYahtzee && hasRolled && !rolling && !turnOver}
               size={t.size} rx={d.rx} ry={d.ry} onToggle={toggleLock} cubeRef={setCubeRef} />
        ))}
      </div>

      <div className="controls">
        <button className="btn" onClick={roll} disabled={!canRoll}>{rollLabel}</button>
        {isYahtzee && (
          <button className="btn ghost" onClick={newTurn} disabled={rolling || (!hasRolled && rollsUsed === 0)}>
            New turn
          </button>
        )}
      </div>

      <TweaksPanel title="Dice"
        renderMobileFooter={(close) => (
          <>
            <TweakButton label="Reset" secondary disabled={!isDirty} onClick={() => setTweak(TWEAK_DEFAULTS)} />
            <TweakButton label="Show" onClick={close} />
          </>
        )}
      >
        <TweakSection>
          <TweakRadio value={t.mode} options={MODE_OPTIONS} onChange={(v) => setTweak('mode', v)} />
        </TweakSection>

        <TweakSection label="Dice">
          {/* Yahtzee is fixed at 5 dice — count is Freeplay-only. */}
          {!isYahtzee && (
            <TweakSlider label="Count" value={t.count} min={1} max={6} step={1}
                         onChange={(v) => setTweak('count', v)} />
          )}
          <TweakSlider label="Size" value={t.size} min={48} max={SIZE_MAX} step={2} unit="px"
                       onChange={(v) => setTweak('size', v)} />
        </TweakSection>

        <TweakSection label="Look">
          <TweakColor label="Face" value={t.faceColor} options={FACE_PALETTE} noAlpha
                      onChange={(v) => setTweak('faceColor', v)} />
        </TweakSection>

        <div className="twk-desktop-only" style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--bd)', marginTop: '8px', paddingTop: '16px' }}>
          <TweakButton label="Reset" secondary disabled={!isDirty} onClick={() => setTweak(TWEAK_DEFAULTS)} />
        </div>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
