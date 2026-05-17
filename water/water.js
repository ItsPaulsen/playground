function makeBg(W, H) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  if (dark) {
    grad.addColorStop(0, '#060e1a');
    grad.addColorStop(0.5, '#0d1f35');
    grad.addColorStop(1, '#040b14');
  } else {
    grad.addColorStop(0, '#3a7ab8');
    grad.addColorStop(0.5, '#5aa0d8');
    grad.addColorStop(1, '#2a6098');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = dark ? 0.1 : 0.18;
  for (let i = 0; i < 18; i++) {
    const y = H / 18 * (i + 0.2 + Math.random() * 0.6);
    const h = 1 + Math.random() * 2;
    const s = ctx.createLinearGradient(0, y - h, 0, y + h);
    s.addColorStop(0, 'transparent');
    s.addColorStop(0.5, dark ? '#7ac8ff' : '#ffffff');
    s.addColorStop(1, 'transparent');
    ctx.fillStyle = s;
    ctx.fillRect(0, y - h, W, h * 2);
  }
  ctx.globalAlpha = 1;
  return ctx.getImageData(0, 0, W, H);
}

function WaterTrail({
  t
}) {
  const canvasRef = React.useRef(null);
  const stateRef = React.useRef(null);
  const tRef = React.useRef(t);
  const rafRef = React.useRef(null);
  tRef.current = t;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = Math.ceil(window.innerWidth / t.resolution);
    const H = Math.ceil(window.innerHeight / t.resolution);
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    const ctx = canvas.getContext('2d');
    const bgData = makeBg(W, H);
    const outData = ctx.createImageData(W, H);
    stateRef.current = {
      ctx,
      W,
      H,
      bgData,
      outData,
      buf1: new Float32Array(W * H),
      buf2: new Float32Array(W * H),
      lastX: -1,
      lastY: -1
    };
    const onResize = () => {
      const s = stateRef.current;
      if (!s) return;
      const nW = Math.ceil(window.innerWidth / tRef.current.resolution);
      const nH = Math.ceil(window.innerHeight / tRef.current.resolution);
      canvas.width = nW;
      canvas.height = nH;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      s.W = nW;
      s.H = nH;
      s.buf1 = new Float32Array(nW * nH);
      s.buf2 = new Float32Array(nW * nH);
      s.bgData = makeBg(nW, nH);
      s.outData = s.ctx.createImageData(nW, nH);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [t.resolution]);

  React.useEffect(() => {
    const onMove = e => {
      const s = stateRef.current;
      if (!s) return;
      const {
        strength,
        radius,
        rate,
        resolution
      } = tRef.current;
      const x = Math.round(e.clientX / resolution);
      const y = Math.round(e.clientY / resolution);
      const dx = x - s.lastX,
        dy = y - s.lastY;
      const minDist = rate / resolution;
      if (s.lastX < 0 || dx * dx + dy * dy >= minDist * minDist) {
        const r = Math.round(radius);
        for (let dy2 = -r; dy2 <= r; dy2++) {
          for (let dx2 = -r; dx2 <= r; dx2++) {
            if (dx2 * dx2 + dy2 * dy2 <= r * r) {
              const px = Math.max(0, Math.min(s.W - 1, x + dx2));
              const py = Math.max(0, Math.min(s.H - 1, y + dy2));
              s.buf1[py * s.W + px] = strength;
            }
          }
        }
        s.lastX = x;
        s.lastY = y;
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  React.useEffect(() => {
    const tick = () => {
      const s = stateRef.current;
      if (!s) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const {
        W,
        H,
        ctx,
        bgData,
        outData
      } = s;
      const damping = tRef.current.damping;
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const i = y * W + x;
          const v = (s.buf1[i - 1] + s.buf1[i + 1] + s.buf1[i - W] + s.buf1[i + W]) / 2 - s.buf2[i];
          s.buf2[i] = v * damping;
        }
      }
      const tmp = s.buf1;
      s.buf1 = s.buf2;
      s.buf2 = tmp;
      const h = s.buf1;
      const src = bgData.data;
      const dst = outData.data;
      dst.set(src);
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const i = y * W + x;
          const dx = Math.round((h[i + 1] - h[i - 1]) * 0.08);
          const dy = Math.round((h[i + W] - h[i - W]) * 0.08);
          const sx = Math.max(0, Math.min(W - 1, x + dx));
          const sy = Math.max(0, Math.min(H - 1, y + dy));
          const si = (sy * W + sx) * 4;
          const di = i * 4;
          dst[di] = src[si];
          dst[di + 1] = src[si + 1];
          dst[di + 2] = src[si + 2];
          dst[di + 3] = 255;
        }
      }
      ctx.putImageData(outData, 0, 0);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return /*#__PURE__*/React.createElement("canvas", {
    ref: canvasRef,
    style: {
      position: 'fixed',
      inset: 0,
      display: 'block'
    }
  });
}
