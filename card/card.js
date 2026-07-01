function CreditCard({
  t
}) {
  const wrapperRef = React.useRef(null);
  const cardRef = React.useRef(null);
  const backRef = React.useRef(null);
  const shineRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const targetRef = React.useRef({
    rx: 0,
    ry: 0,
    scale: 1
  });
  const currentRef = React.useRef({
    rx: 0,
    ry: 0,
    scale: 1
  });
  const [vw, setVw] = React.useState(() => window.innerWidth);
  React.useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  React.useEffect(() => {
    const wrapper = wrapperRef.current;
    const card = cardRef.current;
    const back = backRef.current;
    const shine = shineRef.current;
    const lerp = (a, b, s) => a + (b - a) * s;
    const tick = () => {
      const cur = currentRef.current;
      const tgt = targetRef.current;
      const s = 0.1;
      cur.rx = lerp(cur.rx, tgt.rx, s);
      cur.ry = lerp(cur.ry, tgt.ry, s);
      cur.scale = lerp(cur.scale, tgt.scale, s);
      const EPS = 0.001;
      const done = Math.abs(cur.rx - tgt.rx) < EPS && Math.abs(cur.ry - tgt.ry) < EPS && Math.abs(cur.scale - tgt.scale) < EPS;
      if (done) {
        cur.rx = tgt.rx;
        cur.ry = tgt.ry;
        cur.scale = tgt.scale;
      }
      const shineTX = -(cur.ry / 22) * 180;
      const shineTY = cur.rx / 18 * 100;
      const shadowX = -cur.ry * 0.6;
      const shadowY = cur.rx * 0.4 + 24;
      const tform = `rotateX(${cur.rx}deg) rotateY(${cur.ry}deg) scale(${cur.scale})`;
      card.style.transform = tform;
      back.style.transform = tform + ' translateZ(-2px)';
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      card.style.boxShadow = dark ? `${shadowX}px ${shadowY}px 70px rgba(255,255,255,.12), 0 4px 16px rgba(255,255,255,.06)` : `${shadowX}px ${shadowY}px 70px rgba(0,0,0,.38), 0 4px 16px rgba(0,0,0,.18)`;
      shine.style.transform = `translate(${shineTX}px, ${shineTY}px)`;
      rafRef.current = done ? null : requestAnimationFrame(tick);
    };
    const resume = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const getPos = (clientX, clientY) => {
      const r = wrapper.getBoundingClientRect();
      const dx = (clientX - r.left - r.width / 2) / (r.width / 2);
      const dy = (clientY - r.top - r.height / 2) / (r.height / 2);
      return {
        dx,
        dy
      };
    };
    const onMove = e => {
      const {
        dx,
        dy
      } = getPos(e.clientX, e.clientY);
      targetRef.current = {
        rx: dy * -18,
        ry: dx * 22,
        scale: 1.04
      };
      resume();
    };
    const onLeave = () => {
      targetRef.current = {
        rx: 0,
        ry: 0,
        scale: 1
      };
      resume();
    };
    const onTouchMove = e => {
      e.preventDefault();
      const {
        dx,
        dy
      } = getPos(e.touches[0].clientX, e.touches[0].clientY);
      targetRef.current = {
        rx: dy * -18,
        ry: dx * 22,
        scale: 1.04
      };
      resume();
    };
    const onTouchEnd = () => {
      targetRef.current = {
        rx: 0,
        ry: 0,
        scale: 1
      };
      resume();
    };
    wrapper.addEventListener('mousemove', onMove);
    wrapper.addEventListener('mouseleave', onLeave);
    wrapper.addEventListener('touchmove', onTouchMove, {
      passive: false
    });
    wrapper.addEventListener('touchend', onTouchEnd);
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      wrapper.removeEventListener('mousemove', onMove);
      wrapper.removeEventListener('mouseleave', onLeave);
      wrapper.removeEventListener('touchmove', onTouchMove);
      wrapper.removeEventListener('touchend', onTouchEnd);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);
  const portrait = t.orientation === 'portrait';
  const baseW = portrait ? 240 : 380;
  const baseH = portrait ? 380 : 240;
  const fitScale = Math.min(1, (vw - 48) / baseW);
  const W = Math.round(baseW * fitScale);
  const H = Math.round(baseH * fitScale);
  const shineSize = Math.round(156 * fitScale);
  const colors = Array.from({
    length: t.colorCount
  }, (_, i) => t['color' + i]);
  const gradient = colors.length === 1 ? colors[0] : `linear-gradient(to bottom right, ${colors.join(', ')})`;
  return /*#__PURE__*/React.createElement("div", {
    ref: wrapperRef,
    style: {
      width: W,
      height: H,
      position: 'relative',
      perspective: '900px',
      cursor: 'default'
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: backRef,
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: t.radius,
      background: 'rgba(0,0,0,.6)',
      willChange: 'transform'
    }
  }), /*#__PURE__*/React.createElement("div", {
    ref: cardRef,
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: t.radius,
      overflow: 'hidden',
      background: 'var(--card-base)',
      willChange: 'transform'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: gradient
    }
  }), (t.title || t.subtitle) && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 1,
      pointerEvents: 'none',
      background: 'rgba(0,0,0,.1)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    ref: shineRef,
    style: {
      position: 'absolute',
      width: shineSize,
      height: shineSize,
      left: (W - shineSize) / 2,
      top: (H - shineSize) / 2,
      borderRadius: '50%',
      background: 'white',
      filter: 'blur(60px)',
      opacity: .5,
      zIndex: 3,
      pointerEvents: 'none',
      willChange: 'transform'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 2,
      padding: t.radius >= 32 ? 32 : 24,
      boxSizing: 'border-box'
    }
  }, t.title && /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'white',
      fontSize: 20,
      fontWeight: 500,
      lineHeight: 1.2,
      textShadow: '1px 1px 0 rgba(0,0,0,.15)',
      overflowWrap: 'break-word'
    }
  }, t.title), t.subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'rgba(255,255,255,.8)',
      fontSize: 14,
      fontWeight: 500,
      marginTop: 4,
      textShadow: '1px 1px 0 rgba(0,0,0,.15)',
      overflowWrap: 'break-word'
    }
  }, t.subtitle))));
}
