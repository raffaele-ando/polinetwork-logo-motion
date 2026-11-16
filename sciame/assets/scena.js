// SCIAME — centinaia di punti (gli studenti) riempiono lo schermo, poi un vortice li porta al centro:
// insieme diventano il disco del logo. Dentro si accende la rete.
(function () {
  const { clamp, lerp, prog, smooth, outCubic, outQuart, inOutCubic, spring, LOGO } = PN;
  const W = 1920,
    H = 1080;
  const ctx = document.getElementById("stage").getContext("2d");

  // ---- tempi (secondi) ----
  const T_END = 5.5;
  const N = 760; // quanti punti
  const T_POP = 0.1, // i punti compaiono, sparsi
    POP_SPREAD = 0.75;
  const T_PULL = 1.1; // comincia il vortice
  const T_HIT = 2.82; // l'ultimo punto arriva: colpo
  const NET = {
    on: [2.99, 3.03, 2.95, 3.15, 3.11, 3.07],
    solid: [
      [2, 0, 2.96, 0.22],
      [2, 1, 2.98, 0.22],
      [1, 5, 3.05, 0.24],
      [5, 4, 3.1, 0.22],
      [5, 3, 3.12, 0.22],
    ],
    dots: [3.16, 3.2, 3.24, 3.28],
    dotGap: 0.01,
  };
  const T_RING = 3.3;
  const T_REAL = 3.62;
  const T_UP = 3.7,
    UP_DUR = 0.8; // il logo sale, il nome entra sotto

  // ---- misure ----
  const C = [960, 540];
  const S1 = 520 / (LOGO.outline * 2);
  const RF = LOGO.disc * S1; // raggio finale del disco
  const C_END = [960, 440],
    S_END = 0.82 * S1;
  const WORD_Y = 820,
    WORD_W = 660;

  // ---- i punti ----
  const rnd = PN.rng(90210);
  const pts = [];
  while (pts.length < N) {
    const x = -160 + rnd() * (W + 320),
      y = -160 + rnd() * (H + 320);
    const dx = x - C[0],
      dy = y - C[1];
    const r0 = Math.hypot(dx, dy);
    if (r0 < 70) continue;
    const u = rnd();
    const big = rnd() < 0.07;
    const dur = 0.72 + 0.3 * rnd();
    // partono prima i più vicini; l'ultimo arriva esattamente a T_HIT
    const ts = T_PULL + 0.42 * rnd() + 0.3 * Math.min(1, r0 / 1150);
    pts.push({
      r0,
      a0: Math.atan2(dy, dx),
      size: big ? 11 + rnd() * 7 : 3 + rnd() * 6,
      color: u < 0.36 ? PN.PALETTE[0] : u < 0.66 ? PN.PALETTE[1] : u < 0.86 ? PN.PALETTE[2] : PN.PALETTE[3],
      pop: T_POP + rnd() * POP_SPREAD,
      ts,
      dur,
      swirl: 1.7 + rnd() * 1.1,
      wob: rnd() * 6.2832,
    });
  }
  const last = Math.max(...pts.map((p) => p.ts + p.dur));
  const stretch = (T_HIT - T_PULL) / (last - T_PULL);
  pts.forEach((p) => {
    p.ts = T_PULL + (p.ts - T_PULL) * stretch;
    p.dur *= stretch;
  });
  const arrivals = pts.map((p) => p.ts + p.dur * 0.96).sort((a, b) => a - b);

  const where = (p, t, out) => {
    const e = Math.pow(prog(t, p.ts, p.dur), 2.7); // accelera verso il centro
    const r = p.r0 * (1 - e) + 8 * Math.sin(t * 1.3 + p.wob) * (1 - e);
    const a = p.a0 + 0.045 * t + p.swirl * Math.pow(e, 1.25) + 0.25 * smooth(prog(t, T_PULL - 0.3, 1.2));
    out.x = C[0] + Math.cos(a) * r;
    out.y = C[1] + Math.sin(a) * r;
    out.r = r;
    out.e = e;
    return out;
  };
  const A = { x: 0, y: 0, r: 0, e: 0 },
    B = { x: 0, y: 0, r: 0, e: 0 };

  function render(t) {
    t = clamp(t, 0, T_END);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    const hit = t - T_HIT;
    const bump = hit > 0 ? Math.exp(-hit * 5.5) * Math.cos(hit * 12) : 0;
    const up = inOutCubic(prog(t, T_UP, UP_DUR));
    // leggera spinta di camera mentre lo sciame collassa, poi rimbalzo al colpo
    const zoom = 1 + 0.07 * smooth(prog(t, T_PULL, T_HIT - T_PULL)) - 0.07 * outCubic(prog(hit, 0, 0.5)) + 0.02 * bump;

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(1 + (zoom - 1) * 0.4, 1 + (zoom - 1) * 0.4);
    ctx.translate(-W / 2, -H / 2);
    PN.lightBg(ctx, t, { life: t / T_END, bump: hit > 0 ? bump * 1.6 : 0, looperT0: T_HIT - 0.5 });
    ctx.restore();

    ctx.translate(W / 2, H / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-W / 2, -H / 2);

    // quanti sono arrivati → quanto è grande il disco
    let n = 0;
    while (n < N && arrivals[n] <= t) n++;
    const frac = n / N;
    const rd = RF * Math.sqrt(frac) * (1 + 0.16 * (hit > 0 ? bump : 0));

    // ---- onde al colpo ----
    if (hit > 0 && hit < 1.2) {
      for (let k = 0; k < 2; k++) {
        const g = prog(hit, k * 0.14, 0.95);
        if (g <= 0 || g >= 1) continue;
        ctx.strokeStyle = `rgba(16,85,173,${0.5 * (1 - g) * (1 - g)})`;
        ctx.lineWidth = lerp(14, 1.5, g);
        ctx.beginPath();
        ctx.arc(C[0], C[1], lerp(RF, RF + 520 + 160 * k, outQuart(g)), 0, 6.2832);
        ctx.stroke();
      }
    }

    // ---- i punti ----
    if (t < T_HIT + 0.05) {
      ctx.lineCap = "round";
      for (const p of pts) {
        const g = spring(t - p.pop, 11, 15);
        if (g <= 0) continue;
        where(p, t, A);
        if (A.r < rd - 2 || A.e >= 1) continue; // assorbito dal disco
        const size = p.size * g * (1 - 0.35 * A.e);
        if (A.e > 0.002) {
          // scia: da dov'era un attimo fa
          where(p, t - 0.028, B);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = size * 2;
          ctx.beginPath();
          ctx.moveTo(B.x, B.y);
          ctx.lineTo(A.x, A.y);
          ctx.stroke();
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(A.x, A.y, size, 0, 6.2832);
          ctx.fill();
        }
      }
    }

    // ---- il disco, poi la rete ----
    const real = prog(t, T_REAL, 0.1);
    const cx = lerp(C[0], C_END[0], up),
      cy = lerp(C[1], C_END[1], up),
      sc = lerp(S1, S_END, up);
    if (real < 1 && rd > 0.5) {
      ctx.save();
      ctx.globalAlpha = 1 - real;
      ctx.translate(C[0], C[1]);
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
      ctx.fillStyle = PN.BLUE;
      ctx.beginPath();
      ctx.arc(0, 0, rd, 0, 6.2832);
      ctx.fill();
      PN.drawNet(ctx, t, S1, NET, LOGO.white);
      ctx.restore();
    }
    if (real > 0) {
      ctx.save();
      ctx.globalAlpha = real;
      PN.drawLogo(ctx, cx, cy, sc, 1);
      ctx.restore();
    }

    // ---- il nome: sale da sotto, dentro una maschera ----
    const wq = outCubic(prog(t, T_UP + 0.18, 0.75));
    if (wq > 0) {
      const h = (WORD_W / PN.WORD.w) * PN.WORD.h;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, WORD_Y - h / 2 - 12, W, h + 24);
      ctx.clip();
      PN.drawWord(ctx, 960, WORD_Y + (1 - wq) * (h + 30), WORD_W, null, 1);
      ctx.restore();
    }
  }
  window.PN_RENDER = render;
})();
