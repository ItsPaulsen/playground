// wave.jsx — meandering line bundle.
//
// REVISION: lines no longer share a single normal-offset of one centerline
// (that approach crossed itself on tight bends). Instead each line owns a
// fixed column on the cross axis; its displacement is a blend of:
//   • a SHARED master meander, weighted by a bell-curve falloff so center
//     lines follow it strongly and outer lines barely feel it,
//   • a small INDEPENDENT per-line meander with its own phase so the bundle
//     never looks locked-step.
// Because every line's cross-coordinate is monotonic in its index, adjacent
// lines never swap — no overlap regardless of how tight the meander gets.
// The visible result: a core bundle that surges and bends, with outer lines
// that flatten out and occasionally fray off on their own — same vibe as
// the reference.

const { useEffect, useRef } = React;

// Multi-harmonic meander. Sum of 1-4 sines plus optional turbulence. Output
// is roughly in [-1.5, 1.5] depending on complexity; the caller multiplies
// by a pixel amplitude.
function meander(s, t, freq, speed, complexity, turbulence, seed) {
  let v = Math.sin(s * freq + t * speed + seed) * 1.0;
  if (complexity >= 2) v += Math.sin(s * freq * 1.73 + t * speed * 1.31 + seed * 1.7 + 1.3) * 0.55;
  if (complexity >= 3) v += Math.sin(s * freq * 2.97 + t * speed * 1.62 + seed * 0.9 + 2.7) * 0.28;
  if (complexity >= 4) v += Math.sin(s * freq * 5.31 + t * speed * 2.1  + seed * 1.3 + 4.1) * 0.14;
  if (turbulence > 0) {
    v += Math.sin(s * freq *  9.7 + t * speed * 3.1 + seed)       * turbulence * 0.4;
    v += Math.sin(s * freq * 14.3 + t * speed * 4.2 + seed * 2.1) * turbulence * 0.2;
  }
  return v;
}

function lineColor(mode, i, n, baseColor, accent, opacity) {
  const u = i / Math.max(1, n - 1);
  if (mode === 'mono') return withAlpha(baseColor, opacity);
  if (mode === 'fade-edges') {
    const e = 1 - Math.abs(u - 0.5) * 2;
    return withAlpha(baseColor, opacity * (0.15 + e * 0.85));
  }
  if (mode === 'duotone') return withAlpha(i % 2 ? accent : baseColor, opacity);
  if (mode === 'gradient') return withAlpha(mixHex(baseColor, accent, u), opacity);
  if (mode === 'spectrum') {
    const h = (u * 280 + 200) % 360;
    return `hsla(${h}, 70%, 55%, ${opacity})`;
  }
  return withAlpha(baseColor, opacity);
}

function withAlpha(hex, a) {
  const c = hex.replace('#', '');
  const x = c.length === 3 ? c.replace(/./g, (k) => k + k) : c;
  const r = parseInt(x.slice(0, 2), 16);
  const g = parseInt(x.slice(2, 4), 16);
  const b = parseInt(x.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
function mixHex(a, b, t) {
  const A = a.replace('#','').padEnd(6,'0'), B = b.replace('#','').padEnd(6,'0');
  const ar=parseInt(A.slice(0,2),16), ag=parseInt(A.slice(2,4),16), ab=parseInt(A.slice(4,6),16);
  const br=parseInt(B.slice(0,2),16), bg=parseInt(B.slice(2,4),16), bb=parseInt(B.slice(4,6),16);
  const r=Math.round(ar+(br-ar)*t), g=Math.round(ag+(bg-ag)*t), bl=Math.round(ab+(bb-ab)*t);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${bl.toString(16).padStart(2,'0')}`;
}

function Wave({ t }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const tRef = useRef(0);
  const lastRef = useRef(performance.now());
  const tweaksRef = useRef(t);
  tweaksRef.current = t;
  const centerOffsetAnimRef = useRef(t.centerOffset);
  const directionRef = useRef(t.direction);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let running = true;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const stageW = canvas.parentElement ? canvas.parentElement.clientWidth  : window.innerWidth;
      const stageH = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;
      canvas.width  = Math.round(stageW * dpr);
      canvas.height = Math.round(stageH * dpr);
      canvas.style.width  = stageW + 'px';
      canvas.style.height = stageH + 'px';
      canvas.style.transform = '';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    let resizeTimer;
    const onResize = () => {
      const stageW = canvas.parentElement ? canvas.parentElement.clientWidth  : window.innerWidth;
      const stageH = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;
      canvas.style.width  = stageW + 'px';
      canvas.style.height = stageH + 'px';
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    };
    resize();
    window.addEventListener('resize', onResize);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fpsInterval = 1000 / 30;

    const frame = (now) => {
      if (!running) return;
      if (reducedMotion.matches || document.hidden) { rafRef.current = requestAnimationFrame(frame); return; }
      const elapsed = now - lastRef.current;
      if (elapsed < fpsInterval - 1) { rafRef.current = requestAnimationFrame(frame); return; }
      const dt = Math.min(0.1, elapsed / 1000);
      lastRef.current = now;
      const tw = tweaksRef.current;
      if (!tw.paused) tRef.current += dt;
      if (tw.direction !== directionRef.current) {
        directionRef.current = tw.direction;
        centerOffsetAnimRef.current = tw.centerOffset;
      }
      const coDiff = tw.centerOffset - centerOffsetAnimRef.current;
      centerOffsetAnimRef.current += coDiff * Math.min(1, dt * (coDiff > 0 ? 8 : 5));
      draw(ctx, canvas, tRef.current, { ...tw, centerOffset: centerOffsetAnimRef.current });
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ display: 'block', position: 'absolute' }} />;
}

function draw(ctx, canvas, time, t) {
  const m = ctx.getTransform();
  const W = canvas.width / (m.a || 1);
  const H = canvas.height / (m.d || 1);
  const vertical = t.direction === 'vertical';

  ctx.clearRect(0, 0, W, H);

  // Cover-scale a fixed 16:9 virtual canvas so the wave looks identical
  // on any screen — portrait phone, desktop, etc. Like background-size: cover.
  const ASPECT = 16 / 9;
  const vW = W / H > ASPECT ? W : H * ASPECT;
  const vH = W / H > ASPECT ? W / ASPECT : H;
  ctx.save();
  ctx.translate((W - vW) / 2, (H - vH) / 2);

  const L = vertical ? vH : vW;
  const T = vertical ? vW : vH;

  const ampPx = T * 0.21 * t.amplitude;
  const freq = (t.frequency * Math.PI) / L;

  const ds = Math.max(3, Math.round(L / 600)); // scale with canvas width to keep path ops constant
  const overscan = 80;
  const sStart = -overscan;
  const sEnd = L + overscan;
  const samples = Math.ceil((sEnd - sStart) / ds) + 1;

  // Master meander: shared SPATIAL shape — fixed in time so the bundle's
  // overall meander stays locked to the frame. The "water flowing" sensation
  // comes from the per-line phase term (below), not from translating the
  // bundle. We do allow a very slow breathe so it isn't dead-still.
  const master = new Float32Array(samples);
  const breathe = 0.15; // tiny time-dependent shape drift, in master units
  for (let k = 0; k < samples; k++) {
    const s = sStart + k * ds;
    master[k] = meander(s, time * breathe, freq, t.speed * 0.25, t.complexity, 0, t.seed * 13.7);
  }

  const REF = 800; // reference dimension — all absolute params scale relative to this
  const N = t.lineCount;
  const spacingPx = t.spacing * T / REF;

  // Cross-axis center for the bundle. centerOffset shifts it.
  const cross0 = T * 0.5 + (t.centerOffset ?? 0) * T * 0.5;

  // SPREAD controls the bell width: at 1.0 only the center few lines feel the
  // master strongly; at 0.0 every line follows it (parallel-ribbon mode).
  // Mapped so the default (~0.55) gives the SVG-reference vibe: a tight core
  // with fraying outer lines.
  const spread = Math.max(0.001, t.spread ?? 0.55);
  // Decay constant for exp(-u^2 * k). Higher k = narrower core.
  const bellK = spread * 5 + 0.4;

  // Per-line independent amplitude — tiny meander on top of the bell-weighted
  // master so the bundle never looks robotic. "Fray" boosts edge-line motion.
  const fray = t.fray ?? 0.35;

  // Variable-thickness pulse: a moving bulge of extra width that travels
  // downstream. Only a percentage of lines get it (deterministic by index).
  const pulseAmt = t.pulseAmount ?? 0;
  const pulseRatio = t.pulseRatio ?? 0;
  const pulseSpeed = t.pulseSpeed ?? 1;
  // Hash i → [0,1) so the same lines pulse across frames.
  const lineHasPulse = (i) => {
    if (pulseAmt <= 0 || pulseRatio <= 0) return false;
    const h = Math.sin(i * 12.9898 + t.seed * 4.7) * 43758.5453;
    const r = h - Math.floor(h);
    return r < pulseRatio;
  };

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = t.blendMode || 'source-over';

  // Soft-pen: optional second pass with wider, fainter stroke for ink bleed.
  const layers = t.softness ? 2 : 1;

  for (let layer = 0; layer < layers; layer++) {
    const widthMul = layer === 0 ? 1 : 2.2;
    const alphaMul = layer === 0 ? 1 : 0.18;

    for (let i = 0; i < N; i++) {
      // u in [-1, 1] across the bundle. Use centered coordinate.
      const u = N === 1 ? 0 : (i - (N - 1) / 2) / ((N - 1) / 2);
      const bell = Math.exp(-u * u * bellK);

      // Each line's base column position (fixed — never crosses neighbors).
      const colOffset = (i - (N - 1) / 2) * spacingPx;

      // Individual meander phase — keeps lines from locking to the master.
      // CRUCIAL: time enters here as a flow-axis shift (s − flow), not as a
      // time term inside the sin. That makes the wiggles APPEAR to translate
      // downstream — like water moving through a fixed-shape channel — while
      // the master meander itself stays anchored to the frame.
      const indivSeed = t.seed * 13.7 + i * 7.31 + 100;
      const indivFreq = freq * 1.4;
      const indivAmpScale = (1 - bell) * fray + 0.08; // 0..fray+0.08
      const flow = time * t.speed * 60 * L / REF; // normalized to L so speed feels consistent

      const pulses = lineHasPulse(i);
      const baseW = t.thickness * widthMul;
      const strokeStyle = lineColor(t.colorMode, i, N, t.lineColor, t.accentColor, Math.min(1, t.opacity * alphaMul));

      // Collect points (and widths if pulsing). Widths travel downstream like
      // the flow itself — a bulge moves with the water.
      const xs = new Float32Array(samples);
      const ys = new Float32Array(samples);
      const ws = pulses ? new Float32Array(samples) : null;
      const pulseFreq = (Math.PI * 2) * REF / (L * Math.max(40, 220 / Math.max(0.3, pulseSpeed)));
      const phase = i * 1.7;
      for (let k = 0; k < samples; k++) {
        const s = sStart + k * ds;
        const m = master[k] * bell;
        const ind = meander(s - flow, 0, indivFreq, 0, Math.min(2, t.complexity), t.turbulence * 0.7, indivSeed) * indivAmpScale * 0.6;
        const disp = (m + ind) * ampPx;
        const across = cross0 + colOffset + disp;
        const along  = s;
        xs[k] = vertical ? across : along;
        ys[k] = vertical ? along  : across;
        if (pulses) {
          // 0..1 cosine bulge translating along s at flow rate
          const b = 0.5 + 0.5 * Math.sin((s - flow) * pulseFreq + phase);
          // Shape the bulge: lift the floor and emphasize peaks
          const shaped = Math.pow(b, 1.4);
          ws[k] = baseW + shaped * pulseAmt;
        }
      }

      ctx.strokeStyle = strokeStyle;
      if (!pulses) {
        ctx.lineWidth = baseW;
        ctx.beginPath();
        for (let k = 0; k < samples; k++) {
          if (k === 0) ctx.moveTo(xs[k], ys[k]);
          else ctx.lineTo(xs[k], ys[k]);
        }
        ctx.stroke();
      } else {
        // Variable-width stroke as a FILLED polygon: walk up one side of the
        // path offsetting by +w/2 along the normal, then walk back down the
        // other side at −w/2. No round-cap dots, no width-step seams — the
        // outline is continuous because we're filling a single shape.
        const upX = new Float32Array(samples);
        const upY = new Float32Array(samples);
        const dnX = new Float32Array(samples);
        const dnY = new Float32Array(samples);
        for (let k = 0; k < samples; k++) {
          const kp = Math.max(0, k - 1);
          const kn = Math.min(samples - 1, k + 1);
          let tx = xs[kn] - xs[kp];
          let ty = ys[kn] - ys[kp];
          const len = Math.hypot(tx, ty) || 1;
          tx /= len; ty /= len;
          const nx = -ty, ny = tx;
          const h = ws[k] * 0.5;
          upX[k] = xs[k] + nx * h; upY[k] = ys[k] + ny * h;
          dnX[k] = xs[k] - nx * h; dnY[k] = ys[k] - ny * h;
        }
        ctx.fillStyle = strokeStyle;
        ctx.beginPath();
        ctx.moveTo(upX[0], upY[0]);
        for (let k = 1; k < samples; k++) ctx.lineTo(upX[k], upY[k]);
        for (let k = samples - 1; k >= 0; k--) ctx.lineTo(dnX[k], dnY[k]);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

window.Wave = Wave;
