function ChipSVG() {
  return (
    <svg width="44" height="34" viewBox="0 0 44 34" fill="none">
      <rect x=".5" y=".5" width="43" height="33" rx="5.5" fill="#D4AF37" stroke="#B8960C" strokeWidth="1"/>
      <line x1="15" y1="0" x2="15" y2="34" stroke="#B8960C" strokeWidth="1"/>
      <line x1="29" y1="0" x2="29" y2="34" stroke="#B8960C" strokeWidth="1"/>
      <line x1="0" y1="11" x2="44" y2="11" stroke="#B8960C" strokeWidth="1"/>
      <line x1="0" y1="23" x2="44" y2="23" stroke="#B8960C" strokeWidth="1"/>
      <rect x="15" y="11" width="14" height="12" rx="1" fill="#C8A020"/>
    </svg>
  );
}

function MastercardSVG() {
  return (
    <svg width="44" height="28" viewBox="0 0 44 28">
      <circle cx="15" cy="14" r="14" fill="white" fillOpacity="0.9"/>
      <circle cx="29" cy="14" r="14" fill="white" fillOpacity="0.7"/>
    </svg>
  );
}

function CreditCard() {
  const wrapperRef = React.useRef(null);
  const cardRef    = React.useRef(null);
  const backRef    = React.useRef(null);
  const shineRef   = React.useRef(null);
  const rafRef     = React.useRef(null);
  const target     = React.useRef({ rx: 0, ry: 0, scale: 1 });
  const current    = React.useRef({ rx: 0, ry: 0, scale: 1 });

  React.useEffect(() => {
    const wrapper = wrapperRef.current;
    const card    = cardRef.current;
    const back    = backRef.current;
    const shine   = shineRef.current;
    const lerp    = (a, b, t) => a + (b - a) * t;

    const tick = () => {
      const c = current.current;
      const t = target.current;
      const s = 0.1;

      c.rx    = lerp(c.rx,    t.rx,    s);
      c.ry    = lerp(c.ry,    t.ry,    s);
      c.scale = lerp(c.scale, t.scale, s);

      // Shine moves OPPOSITE to cursor — mouse right → shine left (inverted both axes)
      // Matches Webflow IX2: ±90% of shine width on X, ±50% of shine height on Y
      const shineTX = -(c.ry / 22) * 180;
      const shineTY =  (c.rx / 18) * 100;

      const shadowX = -c.ry * 0.6;
      const shadowY =  c.rx * 0.4 + 24;

      const tform = `rotateX(${c.rx}deg) rotateY(${c.ry}deg) scale(${c.scale})`;
      card.style.transform  = tform;
      back.style.transform  = tform + ' translateZ(-2px)';
      card.style.boxShadow  = `${shadowX}px ${shadowY}px 70px rgba(0,0,0,.38), 0 4px 16px rgba(0,0,0,.18)`;
      shine.style.transform = `translate(${shineTX}px, ${shineTY}px)`;

      rafRef.current = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      const r  = wrapper.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
      const dy = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
      target.current = { rx: dy * -18, ry: dx * 22, scale: 1.04 };
    };

    const onLeave = () => {
      target.current = { rx: 0, ry: 0, scale: 1 };
    };

    wrapper.addEventListener('mousemove', onMove);
    wrapper.addEventListener('mouseleave', onLeave);
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      wrapper.removeEventListener('mousemove', onMove);
      wrapper.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={wrapperRef} style={{
      width: 380, height: 240,
      position: 'relative',
      perspective: '900px',
      cursor: 'default',
    }}>

      {/* Back face — same border-radius so the edge appears curved, not square */}
      <div ref={backRef} style={{
        position: 'absolute', inset: 0, borderRadius: 20,
        background: 'rgba(0,0,0,.6)',
        willChange: 'transform',
      }}/>

      {/* Card face */}
      <div ref={cardRef} style={{
        position: 'absolute', inset: 0, borderRadius: 20,
        overflow: 'hidden',
        willChange: 'transform',
      }}>

        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
             viewBox="0 0 380 240" preserveAspectRatio="xMidYMid slice">
          <defs>
            <filter id="cd-blur" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="26"/>
            </filter>
          </defs>
          <rect width="380" height="240" fill="#F97316"/>
          <ellipse cx="265" cy="75"  rx="195" ry="120" fill="#2DD4BF" filter="url(#cd-blur)" opacity=".88"/>
          <ellipse cx="305" cy="125" rx="130" ry="95"  fill="#86EFAC" filter="url(#cd-blur)" opacity=".70"/>
          <ellipse cx="368" cy="18"  rx="85"  ry="70"  fill="#60A5FA" filter="url(#cd-blur)" opacity=".90"/>
          <ellipse cx="338" cy="205" rx="95"  ry="65"  fill="#F87171" filter="url(#cd-blur)" opacity=".85"/>
          <ellipse cx="305" cy="215" rx="105" ry="60"  fill="#F472B6" filter="url(#cd-blur)" opacity=".80"/>
          <ellipse cx="188" cy="218" rx="105" ry="58"  fill="#A855F7" filter="url(#cd-blur)" opacity=".80"/>
          <ellipse cx="75"  cy="202" rx="110" ry="78"  fill="#EF4444" filter="url(#cd-blur)" opacity=".65"/>
        </svg>

        {/* Shine — physically translated white circle, inverted relative to cursor */}
        <div ref={shineRef} style={{
          position: 'absolute', width: 200, height: 200,
          left: 90, top: 20,
          borderRadius: '50%', background: 'white',
          filter: 'blur(60px)', opacity: 0.6,
          zIndex: 3, pointerEvents: 'none', willChange: 'transform',
        }}/>

        <div style={{
          position: 'absolute', inset: 0,
          padding: '20px 24px', boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <ChipSVG />
            <MastercardSVG />
          </div>

          <div style={{ flex: 1 }}/>

          <div style={{
            color: 'white', fontSize: 17, letterSpacing: '.18em',
            fontFamily: "'Courier New', Courier, monospace", marginBottom: 14,
          }}>
            **** &nbsp;**** &nbsp;**** &nbsp;2345
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ color: 'rgba(255,255,255,.65)', fontSize: 10, marginBottom: 3, letterSpacing: '.05em' }}>Card Holder name</div>
              <div style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>Web Bae</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'rgba(255,255,255,.65)', fontSize: 10, marginBottom: 3, letterSpacing: '.05em' }}>Expiry Date</div>
              <div style={{ color: 'white', fontSize: 14, letterSpacing: '.08em' }}>02/30</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
