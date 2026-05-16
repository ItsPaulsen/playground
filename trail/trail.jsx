
function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function colorToRgb(color) {
  if (color.startsWith('hsl')) {
    const [h, s, l] = color.match(/[\d.]+/g).map(Number);
    return hslToRgb(h, s, l);
  }
  if (color.startsWith('rgb')) return color.match(/\d+/g).map(Number).slice(0, 3);
  return [parseInt(color.slice(1,3),16), parseInt(color.slice(3,5),16), parseInt(color.slice(5,7),16)];
}

// Port of Frogskis WorldLockedRainbowColor —
// hue cycles based on cumulative trail distance, not array position,
// so the rainbow scrolls as the cursor moves.
function worldLockedRainbowColor(worldDist, rgbColors, numColors, dotDistance, maxDots, colorSpeed) {
  const phases = Math.max(1, numColors);
  if (phases === 1) return rgbColors[0];
  const baseBandLen = dotDistance * (maxDots / phases);
  const bandLen = Math.max(1e-3, baseBandLen / colorSpeed);
  const u = (worldDist / bandLen) % phases;
  const i1 = Math.floor(u);
  const frac = u - i1;
  const i2 = (i1 + 1) % phases;
  const c1 = rgbColors[i1], c2 = rgbColors[i2];
  return [
    (c1[0] + (c2[0] - c1[0]) * frac + .5) | 0,
    (c1[1] + (c2[1] - c1[1]) * frac + .5) | 0,
    (c1[2] + (c2[2] - c1[2]) * frac + .5) | 0,
  ];
}

// Port of Frogskis ColorByVisibleRank —
// rank 1 = newest (head) → colors[0], rank total = oldest (tail) → colors[numColors-1]
function colorByVisibleRank(rank, total, rgbColors, numColors) {
  const phases = Math.max(1, numColors);
  if (phases === 1 || total <= 1) return rgbColors[0];
  const t = rank / (total - 1);
  const fp = Math.min(t * (phases - 1), phases - 1);
  const i1 = Math.floor(fp);
  const i2 = Math.min(i1 + 1, phases - 1);
  const frac = fp - i1;
  const c1 = rgbColors[i1], c2 = rgbColors[i2];
  return [
    (c1[0] + (c2[0] - c1[0]) * frac + .5) | 0,
    (c1[1] + (c2[1] - c1[1]) * frac + .5) | 0,
    (c1[2] + (c2[2] - c1[2]) * frac + .5) | 0,
  ];
}

const GLOW_SIZE = 64;
let glowSrcData = null;

(function () {
  const SIZE = GLOW_SIZE, H = SIZE / 2;
  const c = Object.assign(document.createElement('canvas'), { width: SIZE, height: SIZE });
  const cx = c.getContext('2d');
  const g = cx.createRadialGradient(H, H, 0, H, H, H);
  g.addColorStop(0,    'rgba(255,255,255,1)');
  g.addColorStop(0.12, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.3,  'rgba(255,255,255,0.4)');
  g.addColorStop(0.6,  'rgba(255,255,255,0.08)');
  g.addColorStop(1,    'rgba(255,255,255,0)');
  cx.fillStyle = g;
  cx.fillRect(0, 0, SIZE, SIZE);
  const raw = cx.getImageData(0, 0, SIZE, SIZE).data;
  glowSrcData = new Float32Array(SIZE * SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) glowSrcData[i] = raw[i*4+3] / 255;
})();

const glowTextureCache = new Map();
function getGlowTexture(cr, cg, cb) {
  const key = `${cr},${cg},${cb}`;
  if (glowTextureCache.has(key)) return glowTextureCache.get(key);
  const SIZE = GLOW_SIZE, H = SIZE / 2;
  const c = Object.assign(document.createElement('canvas'), { width: SIZE, height: SIZE });
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(SIZE, SIZE);
  const d = img.data;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const idx = y * SIZE + x;
      const a = glowSrcData[idx];
      const pi = idx * 4;
      d[pi] = cr; d[pi+1] = cg; d[pi+2] = cb; d[pi+3] = (a * 255 + .5) | 0;
    }
  }
  ctx.putImageData(img, 0, 0);
  glowTextureCache.set(key, c);
  return c;
}

function CursorTrail({ t }) {
  const canvasRef    = React.useRef(null);
  const trailRef     = React.useRef([]);
  const lastPosRef   = React.useRef(null);
  const trailDistRef = React.useRef(0);
  const tRef         = React.useRef(t);
  tRef.current = t;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  React.useEffect(() => {
    const onMove = (e) => {
      const tc = tRef.current;
      const x = e.clientX, y = e.clientY;
      const last = lastPosRef.current;
      if (!last) { lastPosRef.current = { x, y }; return; }

      const step = tc.dotDistance;
      const dx = x - last.x, dy = y - last.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < step) return;

      const n = Math.min(Math.floor(dist / step), 200);
      const ux = dx / dist, uy = dy / dist;
      const now = Date.now();
      for (let s = 1; s <= n; s++) {
        trailRef.current.push({
          x: last.x + ux * step * s,
          y: last.y + uy * step * s,
          t: now,
          d: trailDistRef.current,
        });
        trailDistRef.current += step;
      }
      lastPosRef.current = { x: last.x + ux * step * n, y: last.y + uy * step * n };
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;

    const animate = () => {
      const W = canvas.width, H = canvas.height;
      if (!W || !H) { raf = requestAnimationFrame(animate); return; }

      const tc = tRef.current;
      const now = Date.now();
      const trail = trailRef.current;

      let cutoff = 0;
      const maxAge = tc.lifetime * 1000;
      while (cutoff < trail.length && now - trail[cutoff].t >= maxAge) cutoff++;
      if (cutoff > 0) trail.splice(0, cutoff);
      if (trail.length > tc.maxDots) trail.splice(0, trail.length - tc.maxDots);

      ctx.clearRect(0, 0, W, H);

      const len = trail.length;
      if (!len) { raf = requestAnimationFrame(animate); return; }

      const numColors = tc.numColors;
      const dotR      = tc.dotSize;
      const denom     = Math.max(1, tc.maxDots - 1);
      const alphaMul  = tc.alpha / 100;
      const rgbColors = tc.colors.slice(0, numColors).map(colorToRgb);

      // Glow uses additive (lighter) dot accumulation; normal uses standard alpha blend.
      // The CSS mix-blend-mode on the canvas element handles background interaction.
      ctx.globalCompositeOperation = tc.glow ? 'lighter' : 'source-over';

      for (let i = 0; i < len; i++) {
        const rank     = len - i;
        const age      = (now - trail[i].t) / 1000;
        const timeFade = Math.max(0, 1 - age / tc.lifetime);
        const pos      = Math.max(0, 1 - (rank - 1) / denom);
        const scale    = Math.sqrt(timeFade) * Math.sqrt(pos);
        if (scale < 0.01) continue;
        const r = dotR * scale;
        if (r < 0.5) continue;

        let cr, cg, cb;
        if (tc.rainbow) {
          [cr, cg, cb] = worldLockedRainbowColor(trail[i].d, rgbColors, numColors, tc.dotDistance, tc.maxDots, tc.colorSpeed);
        } else {
          [cr, cg, cb] = colorByVisibleRank(rank, len, rgbColors, numColors);
        }

        ctx.globalAlpha = alphaMul * scale;
        ctx.drawImage(getGlowTexture(cr, cg, cb), trail[i].x - r, trail[i].y - r, r * 2, r * 2);
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, display: 'block', mixBlendMode: 'screen' }} />;
}
