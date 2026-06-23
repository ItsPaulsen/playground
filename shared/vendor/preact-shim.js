// Wire Preact compat up as window.React and window.ReactDOM
window.React = window.preactCompat;
window.ReactDOM = Object.assign({}, window.preactCompat, {
  createRoot: function(el) {
    return {
      render: function(vnode) {
        window.preact.render(vnode, el);
      }
    };
  }
});
