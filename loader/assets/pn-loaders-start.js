// Avvia un'icona di caricamento PoliNetwork su un canvas. Va caricato dopo pn-loaders.js.
//   const stop = PNLoaders.start(canvas, "impulso", { fg: "#1055AD", bg: "#f1f5f9", period: 2.4 });
//   stop(); // per fermarla
(function () {
  window.PNLoaders.start = function (canvas, id, o = {}) {
    const ctx = canvas.getContext("2d");
    const period = o.period || window.PNLoaders.defaults.period;
    let raf = 0;
    const frame = (ms) => {
      const w = canvas.width,
        h = canvas.height;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.translate(w / 2, h / 2);
      window.PNLoaders.draw(ctx, id, ms / 1000 / period, Math.min(w, h), o);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  };
})();
