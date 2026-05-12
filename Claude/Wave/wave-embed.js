/*!
 * WaveAnimation — zero-dependency canvas wave.
 * Usage:
 *   const wave = new WaveAnimation(containerElement, options);
 *   wave.update({ lineCount: 24 });
 *   wave.stop(); / wave.start(); / wave.destroy();
 *
 * UMD: works as a plain <script>, CommonJS require(), or ES import.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else if (typeof define === 'function' && define.amd) define(factory);
  else root.WaveAnimation = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ─── defaults ──────────────────────────────────────────────────────────────
  const DEFAULTS = {
    lineCount:    16,
    thickness:    1,
    spacing:      12,
    amplitude:    0.24,
    frequency:    4,
    complexity:   1,
    turbulence:   0.2,
    speed:        1,
    opacity:      1,
    centerOffset: -0.14,
    spread:       0,
    fray:         0.04,
    softness:     true,
    paused:       false,
    direction:    'vertical',
    colorMode:    'fade-edges',
    blendMode:    'source-over',
    lineColor:    '#bcc3fb',
    bgColor:      '#f1e7d2',
    accentColor:  '#7a5ae0',
    pulseAmount:  2,
    pulseRatio:   0.5,
    pulseSpeed:   0.5,
    seed:         19,
  };

  // Logical render size — scaling is handled by CSS transform, not by
  // changing these. Keeps the wave's proportions identical on every screen.
  const W = 1600, H = 1000;

  // ─── math helpers ──────────────────────────────────────────────────────────
  function meander(s, t, freq, speed, complexity, turbulence, seed) {
    let v = Math.sin(s * freq + t * speed + seed);
    if (complexity >= 2) v += Math.sin(s * freq * 1.73 + t * speed * 1.31 + seed * 1.7 + 1.3) * 0.55;
    if (complexity >= 3) v += Math.sin(s * freq * 2.97 + t * speed * 1.62 + seed * 0.9 + 2.7) * 0.28;
    if (complexity >= 4) v += Math.sin(s * freq * 5.31 + t * speed * 2.1  + seed * 1.3 + 4.1) * 0.14;
    if (turbulence > 0) {
      v += Math.sin(s * freq *  9.7 + t * speed * 3.1 + seed)       * turbulence * 0.4;
      v += Math.sin(s * freq * 14.3 + t * speed * 4.2 + seed * 2.1) * turbulence * 0.2;
    }
    return v;
  }

  function withAlpha(hex, a) {
    const c = hex.replace('#', '');
    const x = c.length === 3 ? c.replace(/./g, k => k + k) : c;
    return `rgba(${parseInt(x.slice(0,2),16)},${parseInt(x.slice(2,4),16)},${parseInt(x.slice(4,6),16)},${a})`;
  }

  function mixHex(a, b, t) {
    const A = a.replace('#','').padEnd(6,'0'), B = b.replace('#','').padEnd(6,'0');
    const lerp = (ca, cb) => Math.round(parseInt(ca,16) + (parseInt(cb,16) - parseInt(ca,16)) * t);
    const r = lerp(A.slice(0,2), B.slice(0,2));
    const g = lerp(A.slice(2,4), B.slice(2,4));
    const bl= lerp(A.slice(4,6), B.slice(4,6));
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${bl.toString(16).padStart(2,'0')}`;
  }

  function lineColor(mode, i, n, base, accent, opacity) {
    const u = i / Math.max(1, n - 1);
    if (mode === 'mono')       return withAlpha(base, opacity);
    if (mode === 'fade-edges') return withAlpha(base, opacity * (0.15 + (1 - Math.abs(u - 0.5) * 2) * 0.85));
    if (mode === 'duotone')    return withAlpha(i % 2 ? accent : base, opacity);
    if (mode === 'gradient')   return withAlpha(mixHex(base, accent, u), opacity);
    if (mode === 'spectrum')   return `hsla(${(u * 280 + 200) % 360},70%,55%,${opacity})`;
    return withAlpha(base, opacity);
  }

  // ─── draw ──────────────────────────────────────────────────────────────────
  function draw(ctx, time, o) {
    const vertical = o.direction === 'vertical';
    const L = vertical ? H : W;
    const T = vertical ? W : H;

    ctx.clearRect(0, 0, W, H);

    const ampPx  = T * 0.42 * o.amplitude;
    const freq   = (o.frequency * Math.PI) / L;
    const ds     = 3;
    const os     = 80;
    const sStart = -os, sEnd = L + os;
    const n      = Math.ceil((sEnd - sStart) / ds) + 1;

    const master = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      master[k] = meander(sStart + k * ds, time * 0.15, freq, o.speed * 0.25, o.complexity, 0, o.seed * 13.7);
    }

    const cross0  = T * 0.5 + (o.centerOffset ?? 0) * T * 0.5;
    const bellK   = Math.max(0.001, o.spread ?? 0.55) * 5 + 0.4;
    const fray    = o.fray ?? 0.35;
    const pAmt    = o.pulseAmount ?? 0;
    const pRatio  = o.pulseRatio  ?? 0;
    const pSpeed  = o.pulseSpeed  ?? 1;
    const pFreq   = (Math.PI * 2) / Math.max(40, 220 / Math.max(0.3, pSpeed));

    const hasPulse = (i) => {
      if (pAmt <= 0 || pRatio <= 0) return false;
      const h = Math.sin(i * 12.9898 + o.seed * 4.7) * 43758.5453;
      return (h - Math.floor(h)) < pRatio;
    };

    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = o.blendMode || 'source-over';

    const layers = o.softness ? 2 : 1;

    for (let layer = 0; layer < layers; layer++) {
      const wMul = layer === 0 ? 1 : 2.2;
      const aMul = layer === 0 ? 1 : 0.18;

      for (let i = 0; i < o.lineCount; i++) {
        const u    = o.lineCount === 1 ? 0 : (i - (o.lineCount-1)/2) / ((o.lineCount-1)/2);
        const bell = Math.exp(-u * u * bellK);
        const col  = (i - (o.lineCount-1)/2) * o.spacing;
        const iSeed= o.seed * 13.7 + i * 7.31 + 100;
        const iFreq= freq * 1.4;
        const iAmp = (1 - bell) * fray + 0.08;
        const flow = time * o.speed * 60;
        const pulse= hasPulse(i);
        const baseW= o.thickness * wMul;
        const color= lineColor(o.colorMode, i, o.lineCount, o.lineColor, o.accentColor, Math.min(1, o.opacity * aMul));

        const xs = new Float32Array(n);
        const ys = new Float32Array(n);
        const ws = pulse ? new Float32Array(n) : null;

        for (let k = 0; k < n; k++) {
          const s    = sStart + k * ds;
          const m    = master[k] * bell;
          const ind  = meander(s - flow, 0, iFreq, 0, Math.min(2, o.complexity), o.turbulence * 0.7, iSeed) * iAmp * 0.6;
          const disp = (m + ind) * ampPx;
          const ac   = cross0 + col + disp;
          xs[k] = vertical ? ac : s;
          ys[k] = vertical ? s  : ac;
          if (pulse) {
            const b = Math.pow(0.5 + 0.5 * Math.sin((s - flow) * pFreq + i * 1.7), 1.4);
            ws[k] = baseW + b * pAmt;
          }
        }

        if (!pulse) {
          ctx.strokeStyle = color;
          ctx.lineWidth   = baseW;
          ctx.beginPath();
          for (let k = 0; k < n; k++) k === 0 ? ctx.moveTo(xs[k], ys[k]) : ctx.lineTo(xs[k], ys[k]);
          ctx.stroke();
        } else {
          const ux = new Float32Array(n), uy = new Float32Array(n);
          const dx = new Float32Array(n), dy = new Float32Array(n);
          for (let k = 0; k < n; k++) {
            const kp = Math.max(0, k-1), kn = Math.min(n-1, k+1);
            let tx = xs[kn]-xs[kp], ty = ys[kn]-ys[kp];
            const len = Math.hypot(tx, ty) || 1;
            tx /= len; ty /= len;
            const nx = -ty, ny = tx, h = ws[k] * 0.5;
            ux[k] = xs[k] + nx*h; uy[k] = ys[k] + ny*h;
            dx[k] = xs[k] - nx*h; dy[k] = ys[k] - ny*h;
          }
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(ux[0], uy[0]);
          for (let k = 1; k < n; k++)     ctx.lineTo(ux[k], uy[k]);
          for (let k = n-1; k >= 0; k--)  ctx.lineTo(dx[k], dy[k]);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  // ─── class ─────────────────────────────────────────────────────────────────
  function WaveAnimation(container, options) {
    if (!(this instanceof WaveAnimation)) return new WaveAnimation(container, options);

    this._opts = Object.assign({}, DEFAULTS, options);
    this._time = 0;
    this._last = performance.now();
    this._raf  = null;
    this._running = false;

    var canvas = document.createElement('canvas');
    var cs = canvas.style;
    cs.position      = 'absolute';
    cs.top = cs.left = '0';
    cs.width         = W + 'px';
    cs.height        = H + 'px';
    cs.transformOrigin = 'top left';

    var cStyle = window.getComputedStyle(container);
    if (cStyle.position === 'static') container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.appendChild(canvas);

    this._canvas    = canvas;
    this._ctx       = canvas.getContext('2d');
    this._container = container;

    this._resize = this._resize.bind(this);
    this._frame  = this._frame.bind(this);

    this._resize();
    window.addEventListener('resize', this._resize);
    this.start();
  }

  WaveAnimation.prototype._resize = function () {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    this._canvas.width  = Math.round(W * dpr);
    this._canvas.height = Math.round(H * dpr);
    this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var r     = this._container.getBoundingClientRect();
    var scale = Math.max(r.width / W, r.height / H);
    var x     = Math.round((r.width  - W * scale) / 2);
    var y     = Math.round((r.height - H * scale) / 2);
    this._canvas.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + scale + ')';
  };

  WaveAnimation.prototype._frame = function (now) {
    if (!this._running) return;
    var dt = Math.min(0.1, (now - this._last) / 1000);
    this._last = now;
    if (!this._opts.paused) this._time += dt;
    draw(this._ctx, this._time, this._opts);
    this._raf = requestAnimationFrame(this._frame);
  };

  WaveAnimation.prototype.start = function () {
    if (this._running) return this;
    this._running = true;
    this._last = performance.now();
    this._raf  = requestAnimationFrame(this._frame);
    return this;
  };

  WaveAnimation.prototype.stop = function () {
    this._running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    return this;
  };

  WaveAnimation.prototype.update = function (options) {
    Object.assign(this._opts, options);
    return this;
  };

  WaveAnimation.prototype.destroy = function () {
    this.stop();
    window.removeEventListener('resize', this._resize);
    this._canvas.remove();
  };

  WaveAnimation.defaults = Object.assign({}, DEFAULTS);

  return WaveAnimation;
}));
