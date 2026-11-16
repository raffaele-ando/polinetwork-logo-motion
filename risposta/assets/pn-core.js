// Base comune alle due animazioni del logo PoliNetwork: misure del logo e funzioni di disegno.
// Tutto è funzione del tempo: nessun Math.random() senza seme, nessun timer.
(function () {
  const PN = (window.PN = {});

  // ---- utilità ----
  PN.clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  PN.lerp = (a, b, u) => a + (b - a) * u;
  PN.prog = (t, t0, d) => PN.clamp((t - t0) / d);
  PN.smooth = (u) => u * u * (3 - 2 * u);
  PN.outCubic = (u) => 1 - Math.pow(1 - u, 3);
  PN.outQuart = (u) => 1 - Math.pow(1 - u, 4);
  PN.outExpo = (u) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u));
  PN.inCubic = (u) => u * u * u;
  PN.inOutCubic = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  PN.outBack = (u, s = 1.70158) => 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2);
  PN.rng = (seed) => () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };

  // ---- misure del logo, in unità del file SVG (960 × 960) ----
  PN.LOGO = {
    size: 960,
    c: 480,
    disc: 433.6, // raggio del disco blu
    ringIn: 433.6,
    ringOut: 473.6, // anello bianco
    outline: 477, // filo blu scuro esterno
    blue: "#1055AD",
    dark: "#20478F",
    white: "#FEFEFE",
    // i sei nodi: x, y, raggio
    nodes: [
      [273.03, 296.05, 51.85], // 0 A  in alto a sinistra
      [572.01, 232.95, 42.43], // 1 B  in alto
      [458.66, 372.77, 31.39], // 2 C  piccolo, al centro
      [726.72, 471.91, 58.36], // 3 D  a destra
      [251.27, 627.27, 41.62], // 4 E  in basso a sinistra
      [499.53, 713.96, 51.89], // 5 F  in basso
    ],
    solid: [
      [2, 0],
      [2, 1],
      [1, 5],
      [5, 4],
      [5, 3],
    ],
    solidW: 20,
    // linee a pallini: da, a, distanza del primo pallino dal centro di partenza, numero di pallini
    dotted: [
      [4, 0, 47.5, 13],
      [4, 2, 47, 14],
      [4, 3, 54, 21],
      [1, 3, 49.6, 10],
    ],
    dotStep: 18.68,
    dotR: 4.1,
  };
  // posizione di ogni pallino delle linee tratteggiate
  PN.LOGO.dots = [];
  PN.LOGO.dotted.forEach(([a, b, first, n], li) => {
    const A = PN.LOGO.nodes[a],
      B = PN.LOGO.nodes[b];
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
    for (let k = 0; k < n; k++) {
      const s = (first + k * PN.LOGO.dotStep) / L;
      PN.LOGO.dots.push({ line: li, k, n, a, b, s });
    }
  });

  // ---- tracciati originali del logo, per il fotogramma finale esatto ----
  let paths = null;
  PN.drawLogo = (ctx, cx, cy, scale, alpha) => {
    if (alpha <= 0) return;
    if (!paths) paths = window.PN_LOGO.map((p) => ({ fill: p.fill, path: new Path2D(p.d) }));
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(cx - PN.LOGO.c * scale, cy - PN.LOGO.c * scale);
    ctx.scale(scale, scale);
    // il disco blu originale ha i fori della rete: sotto ci va un disco pieno, così non traspare lo sfondo
    ctx.fillStyle = PN.LOGO.blue;
    ctx.beginPath();
    ctx.arc(PN.LOGO.c, PN.LOGO.c, PN.LOGO.disc + 1, 0, 6.2832);
    ctx.fill();
    for (const p of paths) {
      ctx.fillStyle = p.fill;
      ctx.fill(p.path);
    }
    ctx.restore();
  };

  // ---- disegni di base ----
  // disco con bordo sfumato (sfocatura da profondità di campo)
  PN.disc = (ctx, x, y, r, blur, alpha, rgb = "255,255,255") => {
    if (alpha <= 0.003 || r <= 0) return;
    if (blur < 0.7) {
      ctx.fillStyle = `rgba(${rgb},${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 6.2832);
      ctx.fill();
      return;
    }
    const a = alpha * Math.min(1, (r * r) / ((r + blur * 0.5) * (r + blur * 0.5)) + 0.08);
    const g = ctx.createRadialGradient(x, y, Math.max(0, r - blur), x, y, r + blur);
    g.addColorStop(0, `rgba(${rgb},${a})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r + blur, 0, 6.2832);
    ctx.fill();
  };
  // alone luminoso
  PN.glow = (ctx, x, y, r, alpha, rgb = "70,140,255") => {
    if (alpha <= 0.003 || r <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${alpha})`);
    g.addColorStop(0.4, `rgba(${rgb},${alpha * 0.32})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.2832);
    ctx.fill();
  };
  // vignettatura
  PN.vignette = (ctx, w, h, strength) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, w * 0.72);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(0,0,0,${strength})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  };
  // ventaglio di curve sottili, come negli sfondi del sito
  PN.fan = (ctx, pts, n, alpha, rgb = "255,255,255", width = 1.2) => {
    if (alpha <= 0.002) return;
    ctx.lineWidth = width;
    for (let k = 0; k < n; k++) {
      const u = k / (n - 1);
      const a = 0.35 + 0.65 * Math.sin(Math.PI * u);
      ctx.strokeStyle = `rgba(${rgb},${alpha * a})`;
      ctx.beginPath();
      ctx.moveTo(PN.lerp(pts.a0[0], pts.a1[0], u), PN.lerp(pts.a0[1], pts.a1[1], u));
      ctx.quadraticCurveTo(
        PN.lerp(pts.c0[0], pts.c1[0], u),
        PN.lerp(pts.c0[1], pts.c1[1], u),
        PN.lerp(pts.b0[0], pts.b1[0], u),
        PN.lerp(pts.b0[1], pts.b1[1], u),
      );
      ctx.stroke();
    }
  };
})();
