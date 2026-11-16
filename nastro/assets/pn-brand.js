// Elementi del brand system PoliNetwork (dal Figma, pagina "style guidelines") pronti da animare:
// forme sfumate, looper, logo esteso, rete del logo. Serve pn-core.js e brand-assets.js.
(function () {
  const PN = window.PN,
    BRAND = window.PN_BRAND,
    LOGO = PN.LOGO;
  const { lerp, prog, outQuart } = PN;

  PN.BG = "#f1f5f9"; // neutrals/background
  PN.BLUE = LOGO.blue; // blu del logo
  PN.PALETTE = ["#1055AD", "#51A2FF", "#74D4FF", "#0069A8"]; // logo, blue-primary, blue-tertiary, blue-secondary

  // molla: parte da 0, supera 1 e si assesta
  PN.spring = (t, damp = 9, freq = 14) => (t <= 0 ? 0 : 1 - Math.exp(-damp * t) * Math.cos(freq * t));
  PN.outExpo = (u) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u));
  PN.inExpo = (u) => (u <= 0 ? 0 : Math.pow(2, 10 * u - 10));
  PN.inOutQuart = (u) => (u < 0.5 ? 8 * u * u * u * u : 1 - Math.pow(-2 * u + 2, 4) / 2);

  // ---- forme sfumate: disegnate una volta, già sfocate. fill/opacity si possono cambiare (tema scuro) ----
  PN.shapeSprite = (name, fill, opacity) => {
    const def = BRAND.shapes[name];
    const c = document.createElement("canvas");
    c.width = c.height = def.size;
    const g = c.getContext("2d");
    g.filter = `blur(${def.blur}px)`;
    g.globalAlpha = opacity == null ? def.opacity : opacity;
    g.fillStyle = fill || def.fill;
    g.fill(new Path2D(def.d));
    return c;
  };
  PN.drawSprite = (ctx, spr, x, y, size, rot, alpha) => {
    if (alpha <= 0.003) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    const s = size / spr.width;
    ctx.scale(s, s);
    ctx.globalAlpha *= alpha;
    ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
    ctx.restore();
  };

  // ---- looper ----
  const svgNS = "http://www.w3.org/2000/svg";
  PN.LOOPER = BRAND.looper.lines.map((l) => {
    const p = document.createElementNS(svgNS, "path");
    p.setAttribute("d", l.d);
    return { path: new Path2D(l.d), len: p.getTotalLength(), o: l.o };
  });
  // si traccia una curva dopo l'altra a partire da t0; il contesto va già posizionato
  PN.drawLooper = (ctx, t, t0, gap = 0.045, dur = 1.5, alpha = 1) => {
    ctx.lineWidth = BRAND.looper.width;
    ctx.lineCap = "round";
    PN.LOOPER.forEach((l, i) => {
      const g = PN.inOutCubic(prog(t, t0 + i * gap, dur));
      if (g <= 0) return;
      ctx.strokeStyle = `rgba(248,250,252,${Math.min(1, l.o * 1.7 + 0.15) * alpha})`;
      ctx.setLineDash([l.len * g, l.len]);
      ctx.stroke(l.path);
    });
    ctx.setLineDash([]);
  };

  // ---- scritta "PoliNetwork" del logo esteso ----
  const WM = BRAND.wordmark;
  PN.WORD = { path: new Path2D(WM.d), x: 34.5, y: 6.6, w: 115.77, h: 15.58, fill: WM.fill, box: WM };
  // scritta centrata in (cx, cy), larga `width` pixel
  PN.drawWord = (ctx, cx, cy, width, color, alpha = 1) => {
    if (alpha <= 0.003) return;
    const k = width / PN.WORD.w;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(cx - (PN.WORD.x + PN.WORD.w / 2) * k, cy - (PN.WORD.y + PN.WORD.h / 2) * k);
    ctx.scale(k, k);
    ctx.fillStyle = color || PN.WORD.fill;
    ctx.fill(PN.WORD.path);
    ctx.restore();
  };

  // ---- logo in bianco (anello e rete), per i fondi blu ----
  let whitePath = null;
  PN.drawLogoWhite = (ctx, cx, cy, scale, alpha = 1) => {
    if (alpha <= 0.003) return;
    if (!whitePath) whitePath = new Path2D(window.PN_LOGO[0].d);
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(cx - LOGO.c * scale, cy - LOGO.c * scale);
    ctx.scale(scale, scale);
    ctx.fillStyle = LOGO.white;
    ctx.fill(whitePath);
    ctx.restore();
  };

  // ---- la rete del logo che si costruisce ----
  // cfg: { on: [6 tempi dei nodi], solid: [[da, a, inizio, durata]...], dots: [4 tempi], dotGap }
  // coordinate relative al centro del logo, scala S
  PN.drawNet = (ctx, t, S, cfg, color) => {
    const pos = (i) => [(LOGO.nodes[i][0] - LOGO.c) * S, (LOGO.nodes[i][1] - LOGO.c) * S];
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineCap = "round";
    ctx.lineWidth = LOGO.solidW * S;
    for (const [a, b, t0, dur] of cfg.solid) {
      const g = outQuart(prog(t, t0, dur));
      if (g <= 0) continue;
      const A = pos(a),
        B = pos(b);
      ctx.beginPath();
      ctx.moveTo(A[0], A[1]);
      ctx.lineTo(lerp(A[0], B[0], g), lerp(A[1], B[1], g));
      ctx.stroke();
    }
    for (const d of LOGO.dots) {
      const g = PN.spring(t - (cfg.dots[d.line] + d.k * (cfg.dotGap || 0.02)), 14, 16);
      if (g <= 0) continue;
      const A = pos(d.a),
        B = pos(d.b);
      ctx.beginPath();
      ctx.arc(lerp(A[0], B[0], d.s), lerp(A[1], B[1], d.s), LOGO.dotR * S * g, 0, 6.2832);
      ctx.fill();
    }
    LOGO.nodes.forEach((n, i) => {
      const g = PN.spring(t - cfg.on[i]);
      if (g <= 0) return;
      const p = pos(i);
      ctx.beginPath();
      ctx.arc(p[0], p[1], n[2] * S * g, 0, 6.2832);
      ctx.fill();
    });
  };
})();

// ---- fondo chiaro del brand: forme sfumate che entrano e si muovono piano, più il looper ----
(function () {
  const PN = window.PN;
  const { prog, outCubic } = PN;
  let spr = null;
  const SHAPES = [
    { k: "big-teal", x: 250, y: 760, size: 1250, t0: 0.0, dx: 46, dy: -30, rot: 0.22 },
    { k: "big-blue", x: 1760, y: 110, size: 1050, t0: 0.12, dx: -50, dy: 34, rot: -0.2 },
    { k: "small-blue", x: 1560, y: 980, size: 560, t0: 0.26, dx: -30, dy: -44, rot: 0.3 },
  ];
  // o: { t0: quando entra, life: 0..1 avanzamento lento, bump: respiro, shift: spostamento laterale, looperT0 }
  PN.lightBg = (ctx, t, o = {}) => {
    if (!spr) {
      spr = {};
      for (const s of SHAPES) spr[s.k] = spr[s.k] || PN.shapeSprite(s.k);
    }
    const t0 = o.t0 || 0,
      life = o.life || 0,
      bump = o.bump || 0,
      shift = o.shift || 0;
    ctx.fillStyle = PN.BG;
    ctx.fillRect(-200, -200, 2320, 1480);
    for (const s of SHAPES) {
      const g = o.instant ? 1 : outCubic(prog(t, t0 + s.t0, 1.1));
      if (g <= 0) continue;
      PN.drawSprite(
        ctx,
        spr[s.k],
        s.x + s.dx * life - shift * (s.x < 960 ? 1 : 0.5),
        s.y + s.dy * life,
        s.size * (0.78 + 0.22 * g) * (1 + 0.06 * bump),
        s.rot * life,
        g,
      );
    }
    ctx.save();
    ctx.translate(-330 + 30 * life - shift * 0.7, 250 - 20 * life);
    ctx.rotate(-0.12);
    ctx.scale(0.92, 0.92);
    PN.drawLooper(ctx, t, o.looperT0 == null ? t0 + 0.15 : o.looperT0);
    ctx.restore();
  };
})();
