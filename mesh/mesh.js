const BLUR = 100;
const EXP = BLUR * 2;
const ORBIT_CONFIGS = {
  2: [{
    x: '35vmin',
    y: '-35vmin'
  }, {
    x: '-35vmin',
    y: '35vmin'
  }],
  3: [{
    x: '0',
    y: '-40vmin'
  }, {
    x: '35vmin',
    y: '20vmin'
  }, {
    x: '-35vmin',
    y: '20vmin'
  }],
  4: [{
    x: '32vmin',
    y: '-32vmin'
  }, {
    x: '32vmin',
    y: '32vmin'
  }, {
    x: '-32vmin',
    y: '32vmin'
  }, {
    x: '-32vmin',
    y: '-32vmin'
  }]
};
const COLOR_KEYS = ['color1', 'color2', 'color3', 'color4'];
function Mesh({
  t
}) {
  const getDiag = () => `${Math.ceil(Math.hypot(window.innerWidth, window.innerHeight) * 2)}px`;
  const [blobSize, setBlobSize] = React.useState(getDiag);
  React.useEffect(() => {
    const onResize = () => setBlobSize(getDiag());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const blobs = ORBIT_CONFIGS[t.count] || ORBIT_CONFIGS[4];
  const dur = (45 / t.speed).toFixed(1);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: -EXP,
      filter: `blur(${BLUR}px) saturate(120%)`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: `calc(50vw + ${EXP}px)`,
      top: `calc(50vh + ${EXP}px)`,
      animation: `mesh-orbit ${dur}s linear infinite`,
      willChange: 'transform'
    }
  }, blobs.map((b, i) => /*#__PURE__*/React.createElement("div", {
    key: COLOR_KEYS[i],
    style: {
      position: 'absolute',
      left: b.x,
      top: b.y,
      transform: 'translate(-50%, -50%)',
      mixBlendMode: 'lighten'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: blobSize,
      height: blobSize,
      borderRadius: '50%',
      background: `radial-gradient(ellipse at center, ${t[COLOR_KEYS[i]]} 0%, transparent 80%)`
    }
  }))))));
}
