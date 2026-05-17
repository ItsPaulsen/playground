const SIM_SCALE = 4;
const LX = 0.0, LY = -0.7, LZ = 0.7;
const LLEN = Math.sqrt(LX * LX + LY * LY + LZ * LZ);

function WaterTrail({ t }) {
  const bgRef    = React.useRef(null);
  const glowRef  = React.useRef(null);
  const specRef  = React.useRef(null);
  const stateRef = React.useRef(null);
  const tRef     = React.useRef(t);
  const rafRef   = React.useRef(null);

  tRef.current = t;

  React.useEffect(() => {
    const W = Math.ceil(window.innerWidth  / SIM_SCALE);
    const H = Math.ceil(window.innerHeight / SIM_SCALE);

    const simCanvas = document.createElement('canvas');
    simCanvas.width = W; simCanvas.height = H;
    const simCtx  = simCanvas.getContext('2d');
    const simData = simCtx.createImageData(W, H);

    // Neutral displacement (128 = no offset in both channels)
    for (let i = 0; i < W * H * 4; i += 4) {
      simData.data[i] = 128; simData.data[i + 1] = 128;
      simData.data[i + 2] = 128; simData.data[i + 3] = 255;
    }
    simCtx.putImageData(simData, 0, 0);

    const glowEl  = glowRef.current;
    glowEl.width  = W; glowEl.height = H;
    const glowCtx = glowEl.getContext('2d');

    const specEl  = specRef.current;
    specEl.width  = W; specEl.height = H;
    const specCtx  = specEl.getContext('2d');
    const specData = specCtx.createImageData(W, H);

    stateRef.current = {
      simCanvas, simCtx, simData,
      glowCtx,
      specCtx, specData,
      W, H,
      buf1: new Float32Array(W * H),
      buf2: new Float32Array(W * H),
      lastX: -1, lastY: -1,
    };

    const applyBg = () => {
      if (bgRef.current && window._img) bgRef.current.src = window._img.src;
    };
    if (window._img && window._img.complete) applyBg();
    else if (window._img) window._img.addEventListener('load', applyBg);

    const onResize = () => {
      const s = stateRef.current;
      if (!s) return;
      const nW = Math.ceil(window.innerWidth  / SIM_SCALE);
      const nH = Math.ceil(window.innerHeight / SIM_SCALE);
      s.W = nW; s.H = nH;
      s.simCanvas.width = nW; s.simCanvas.height = nH;
      s.simData = s.simCtx.createImageData(nW, nH);
      glowEl.width = nW; glowEl.height = nH;
      specEl.width = nW; specEl.height = nH;
      s.specData = s.specCtx.createImageData(nW, nH);
      s.buf1 = new Float32Array(nW * nH);
      s.buf2 = new Float32Array(nW * nH);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (window._img) window._img.removeEventListener('load', applyBg);
    };
  }, []);

  React.useEffect(() => {
    const onMove = (e) => {
      const s = stateRef.current;
      if (!s) return;
      const { intensity, radius } = tRef.current;
      const x = Math.round(e.clientX / SIM_SCALE);
      const y = Math.round(e.clientY / SIM_SCALE);
      const ddx = x - s.lastX, ddy = y - s.lastY;
      if (s.lastX < 0 || ddx * ddx + ddy * ddy >= 1) {
        const r = Math.max(1, Math.round(radius * Math.min(s.W, s.H)));
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (dx * dx + dy * dy <= r * r) {
              const px = Math.max(0, Math.min(s.W - 1, x + dx));
              const py = Math.max(0, Math.min(s.H - 1, y + dy));
              s.buf1[py * s.W + px] = intensity * 300;
            }
          }
        }
        s.lastX = x; s.lastY = y;
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  React.useEffect(() => {
    const feImg = document.getElementById('water-map');
    const tick = () => {
      const s = stateRef.current;
      if (!s) { rafRef.current = requestAnimationFrame(tick); return; }

      const { W, H, simCanvas, simCtx, simData, glowCtx, specCtx, specData } = s;
      const { viscosity, specular } = tRef.current;
      const data   = simData.data;
      const specPx = specData.data;

      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const i = y * W + x;
          const v = (s.buf1[i - 1] + s.buf1[i + 1] + s.buf1[i - W] + s.buf1[i + W]) / 2 - s.buf2[i];
          s.buf2[i] = v * viscosity;
        }
      }
      const tmp = s.buf1; s.buf1 = s.buf2; s.buf2 = tmp;

      const h = s.buf1;
      specPx.fill(0);
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const i  = y * W + x;
          const di = i * 4;
          const gx = h[i + 1] - h[i - 1];
          const gy = h[i + W] - h[i - W];
          data[di]     = 128 + Math.round(Math.max(-127, Math.min(127, gx * 0.4)));
          data[di + 1] = 128 + Math.round(Math.max(-127, Math.min(127, gy * 0.4)));
          data[di + 2] = 128;
          data[di + 3] = 255;
          if (specular > 0) {
            const gxn = gx / 300, gyn = gy / 300;
            const gradMag2 = gxn * gxn + gyn * gyn;
            if (gradMag2 > 0.00001) {
              const activity = Math.min(1.0, gradMag2 * 200);
              const nx = -gxn, ny = -gyn;
              const nlen = Math.sqrt(nx * nx + ny * ny + 1.0);
              const dot  = Math.max(0, (nx * LX + ny * LY + LZ) / (nlen * LLEN));
              const b    = Math.min(255, Math.round(Math.pow(dot, 2) * activity * specular * 255));
              if (b > 0) {
                specPx[di] = specPx[di + 1] = specPx[di + 2] = 255;
                specPx[di + 3] = b;
              }
            }
          }
        }
      }

      simCtx.putImageData(simData, 0, 0);
      glowCtx.putImageData(specData, 0, 0);
      specCtx.putImageData(specData, 0, 0);
      if (feImg) feImg.setAttribute('href', simCanvas.toDataURL());

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <>
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <defs>
          <filter id="water-filter" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
            <feImage id="water-map" preserveAspectRatio="xMidYMid slice" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale="60" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <img
        ref={bgRef}
        crossOrigin="anonymous"
        style={{
          position: 'fixed', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          filter: 'url(#water-filter)',
        }}
      />
      <canvas
        ref={glowRef}
        style={{
          position: 'fixed', inset: 0,
          width: '100%', height: '100%',
          mixBlendMode: 'screen',
          filter: 'blur(24px)',
          pointerEvents: 'none',
        }}
      />
      <canvas
        ref={specRef}
        style={{
          position: 'fixed', inset: 0,
          width: '100%', height: '100%',
          mixBlendMode: 'screen',
          filter: 'blur(6px)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}
