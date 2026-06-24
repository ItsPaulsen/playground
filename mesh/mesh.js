const COLOR_KEYS = ['color1', 'color2', 'color3', 'color4'];

// Blobs centered AT the corners — half outside the viewport like aidn.no
// r=120: each blob is 240% of the viewport in diameter, guaranteeing overlap at center
const POSITIONS = [[0, 0], [100, 100], [0, 100], [100, 0]];
function Mesh({
  t
}) {
  const count = t.count || 2;
  const dur = (45 / t.speed).toFixed(1);
  const colors = Array.from({
    length: count
  }, (_, i) => t[COLOR_KEYS[i]]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      overflow: 'visible'
    },
    viewBox: "0 0 100 100",
    preserveAspectRatio: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, /*#__PURE__*/React.createElement("defs", null, colors.map((color, i) => /*#__PURE__*/React.createElement("radialGradient", {
    key: i,
    id: `mg${i}`,
    gradientUnits: "objectBoundingBox",
    cx: "50%",
    cy: "50%",
    r: "50%"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0",
    stopColor: color
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "0.5",
    stopColor: color
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "1",
    stopColor: color,
    stopOpacity: "0"
  })))), /*#__PURE__*/React.createElement("g", {
    style: {
      transformBox: 'view-box',
      transformOrigin: '50% 50%',
      animation: `mesh-orbit ${dur}s linear infinite`
    }
  }, colors.map((_, i) => {
    const [cx, cy] = POSITIONS[i % 4];
    return /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: cx,
      cy: cy,
      r: 120,
      fill: `url(#mg${i})`
    });
  }))));
}
