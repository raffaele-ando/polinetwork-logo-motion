// TUFFO — il logo si compone in un colpo, la camera prende la rincorsa e ci si tuffa dentro:
// un tunnel di reti nel blu, fino al logo esteso in bianco.
(function () {
  const { clamp, lerp, prog, smooth, outCubic, outQuart, inCubic, inOutCubic, spring, LOGO } = PN;
  const W = 1920,
    H = 1080;
  const ctx = document.getElementById("stage").getContext("2d");

  // ---- tempi (secondi) ----
  const T_END = 5.5;
  const T_DISC = 0.42; // "ta": il disco arriva
  const NET = {
    on: [0.6, 0.65, 0.55, 0.8, 0.75, 0.7],
    solid: [
      [2, 0, 0.58, 0.2],
      [2, 1, 0.6, 0.2],
      [1, 5, 0.68, 0.22],
      [5, 4, 0.74, 0.2],
      [5, 3, 0.76, 0.2],
    ],
    dots: [0.8, 0.83, 0.86, 0.9],
    dotGap: 0.008,
  };
  const T_RING = 0.86;
  const T_BACK = 1.5, // rincorsa: la camera arretra un attimo
    T_DIVE = 1.82, // tuffo
    DIVE_DUR = 0.72;
  const T_TUNNEL = 2.3,
    TUNNEL_DUR = 1.65; // volo tra le reti, fino a fermarsi sul logo esteso
  const Z_END = 9;

  // ---- misure ----
  const C = [960, 540];
  const S1 = 460 / (LOGO.outline * 2);
  const TARGET = [(640 - LOGO.c) * S1, (640 - LOGO.c) * S1]; // punto del disco in cui ci si tuffa: blu, senza linee
  const K = 9; // logo esteso finale
  const WMB = window.PN_BRAND.wordmark;

  // ---- il mondo blu: forme sfumate nei toni del blu ----
  const sprLight = PN.shapeSprite("big-teal", "#51A2FF", 0.42);
  const sprDeep = PN.shapeSprite("big-blue", "#0A3F86", 0.6);
  const sprSmall = PN.shapeSprite("small-blue", "#74D4FF", 0.32);

  // ---- le reti che si attraversano ----
  const rnd = PN.rng(4217);
  const FULL = { on: [-9, -9, -9, -9, -9, -9], solid: NET.solid.map(([a, b]) => [a, b, -9, 1]), dots: [-9, -9, -9, -9] };
  const planes = [];
  for (let i = 0; i < 17; i++) {
    const a = rnd() * 6.2832 + i * 2.4;
    const r = 300 + rnd() * 380;
    planes.push({
      z: 0.7 + i * 0.5 + rnd() * 0.25,
      ox: Math.cos(a) * r * 1.25,
      oy: Math.sin(a) * r * 0.8,
      rot: rnd() * 6.2832,
      size: 0.62 + rnd() * 0.5,
      color: ["#FEFEFE", "#74D4FF", "#FEFEFE", "#9CC9FF"][i % 4],
      alpha: [0.95, 0.75, 0.9, 0.8][i % 4],
    });
  }

  function lightScene(t) {
    // sfondo chiaro e logo che si compone
    const life = t / T_END;
    PN.lightBg(ctx, t, { life, bump: t > T_DISC ? Math.exp(-(t - T_DISC) * 5) * Math.sin((t - T_DISC) * 11) : 0 });
  }

  function logoBuild(t) {
    // coordinate relative al centro del logo
    const ring = spring(t - T_RING, 10, 13);
    if (ring > 0) {
      ctx.fillStyle = LOGO.dark;
      ctx.beginPath();
      ctx.arc(0, 0, lerp(LOGO.disc, LOGO.outline, ring) * S1, 0, 6.2832);
      ctx.fill();
      ctx.fillStyle = LOGO.white;
      ctx.beginPath();
      ctx.arc(0, 0, lerp(LOGO.disc, LOGO.ringOut, ring) * S1, 0, 6.2832);
      ctx.fill();
    }
    const d = spring(t - T_DISC, 9, 12);
    if (d > 0) {
      ctx.fillStyle = PN.BLUE;
      ctx.beginPath();
      ctx.arc(0, 0, LOGO.disc * S1 * d, 0, 6.2832);
      ctx.fill();
      PN.drawNet(ctx, t, S1, NET, LOGO.white);
    }
  }

  function render(t) {
    t = clamp(t, 0, T_END);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    // ---- camera della prima parte ----
    const du = prog(t, T_DIVE, DIVE_DUR);
    let Z = 1 + 0.06 * smooth(prog(t, 0.9, 0.7)); // lenta spinta in avanti
    Z = lerp(Z, 0.86, inOutCubic(prog(t, T_BACK, T_DIVE - T_BACK))); // rincorsa
    Z *= Math.pow(80, inCubic(du)); // tuffo
    const fb = smooth(prog(t, T_BACK, 0.75));
    const rot = 0.55 * inCubic(du);

    if (Z < 16) {
      // fondo: si muove meno del logo
      const bz = 1 + (Math.min(Z, 16) - 1) * 0.22;
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(bz, bz);
      ctx.translate(-W / 2, -H / 2);
      lightScene(t);
      ctx.restore();

      ctx.save();
      ctx.translate(C[0], C[1]);
      ctx.rotate(rot);
      ctx.scale(Z, Z);
      ctx.translate(-TARGET[0] * fb, -TARGET[1] * fb);
      logoBuild(t);
      ctx.restore();
    }

    // ---- il mondo blu ----
    const inBlue = smooth(prog(Z, 9, 7)); // quando il disco riempie l'inquadratura
    if (inBlue > 0) {
      const tu = prog(t, T_TUNNEL, TUNNEL_DUR);
      const cam = Z_END * outCubic(tu);
      const settle = t - (T_TUNNEL + TUNNEL_DUR * 0.62);
      const push = 1 + 0.03 * prog(t, T_TUNNEL + TUNNEL_DUR, T_END - T_TUNNEL - TUNNEL_DUR);

      ctx.save();
      ctx.globalAlpha = inBlue;
      ctx.fillStyle = PN.BLUE;
      ctx.fillRect(0, 0, W, H);

      // forme sfumate: lontane, si avvicinano piano
      const far = 1 + 0.35 * outCubic(tu);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(far * push, far * push);
      ctx.rotate(0.25 * (1 - outCubic(tu)));
      ctx.translate(-W / 2, -H / 2);
      PN.drawSprite(ctx, sprDeep, 1500, 180, 1300, 0.3, 1);
      PN.drawSprite(ctx, sprLight, 300, 900, 1200, 0, 1);
      PN.drawSprite(ctx, sprSmall, 1560, 900, 620, 0.2, 1);
      // looper: sul blu le curve bianche si vedono bene
      ctx.save();
      ctx.translate(-150, 160);
      ctx.rotate(-0.12);
      ctx.scale(0.9, 0.9);
      PN.drawLooper(ctx, t, T_TUNNEL + 0.7, 0.04, 1.3, 1);
      ctx.restore();
      ctx.restore();

      // le reti attraversate
      for (const p of planes) {
        const dz = p.z - cam;
        if (dz <= 0.07) continue;
        const s = 1 / dz;
        const a = smooth(prog(s, 0.07, 0.16)) * (1 - smooth(prog(s, 3, 5))) * p.alpha;
        if (a <= 0.004) continue;
        ctx.save();
        ctx.globalAlpha = inBlue * a;
        ctx.translate(W / 2 + p.ox * s, H / 2 + p.oy * s);
        ctx.rotate(p.rot + 0.5 * (1 - outCubic(tu)));
        PN.drawNet(ctx, 0, p.size * s, FULL, p.color);
        ctx.restore();
      }

      // logo esteso in bianco: arriva da lontano e si ferma
      const s = (1 / (Z_END + 1 - cam)) * (1 + 0.035 * (settle > 0 ? Math.exp(-settle * 6) * Math.sin(settle * 10) : 0)) * push;
      const la = smooth(prog(s, 0.2, 0.35));
      if (la > 0) {
        ctx.save();
        ctx.globalAlpha = inBlue * la;
        ctx.translate(W / 2, H / 2);
        ctx.scale(s, s);
        const lx = (-WMB.w * K) / 2,
          ly = (-WMB.h * K) / 2;
        PN.drawLogoWhite(ctx, lx + 12 * K, ly + 15 * K, (24 * K) / LOGO.size, 1);
        ctx.translate(lx, ly);
        ctx.scale(K, K);
        ctx.fillStyle = LOGO.white;
        ctx.fill(PN.WORD.path);
        ctx.restore();
      }
      ctx.restore();
    }
  }
  window.PN_RENDER = render;
})();
