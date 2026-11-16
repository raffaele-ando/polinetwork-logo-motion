// RISPOSTA — PoliNetwork è questo: scrivi in un gruppo e qualcuno ti risponde.
// Si parte dentro un fumetto di chat: tre puntini, "sta scrivendo…" (l'attesa). Poi la risposta arriva:
// la camera si allarga, il fumetto diventa il disco del logo, i tre puntini diventano nodi e si collegano.
// I puntini del "sta scrivendo" sono gli stessi delle linee tratteggiate del logo.
(function () {
  const { clamp, lerp, prog, smooth, outCubic, inOutCubic, outExpo, spring, LOGO } = PN;
  const BRAND = window.PN_BRAND;
  const W = 1920,
    H = 1080;
  const ctx = document.getElementById("stage").getContext("2d");

  // ---- tempi (secondi) ----
  const T_END = 4.8;
  const T_DOTS = 0.12; // compaiono i tre puntini
  const TYPE_T0 = 0.3,
    TYPE_CYCLE = 0.54,
    TYPE_GAP = 0.13; // l'onda del "sta scrivendo": due giri
  const T_SEND = 1.38; // la risposta arriva: la camera si allarga
  const CAM_DUR = 0.7;
  const T_MORPH = 1.68,
    MORPH_DUR = 0.62; // il fumetto diventa il disco, i puntini vanno al loro posto
  const NET = {
    on: [2.2, 2.25, -9, -9, -9, 2.36],
    skip: [2, 3, 4], // i tre puntini: C, D, E
    solid: [
      [2, 0, 2.08, 0.2],
      [2, 1, 2.12, 0.2],
      [1, 5, 2.2, 0.22],
      [5, 4, 2.3, 0.2],
      [5, 3, 2.32, 0.2],
    ],
    dots: [2.38, 2.42, 2.46, 2.5],
    dotGap: 0.009,
  };
  const T_RING = 2.56;
  const T_REAL = 2.86;
  const T_ROLL = 3.0,
    ROLL_DUR = 0.9;

  // ---- misure ----
  const C1 = [960, 540];
  const S1 = 520 / (LOGO.outline * 2);
  const RD = LOGO.disc * S1;
  const BUB = { w: 800, h: 440, r: 150 }; // il fumetto
  const Z0 = 4.3; // quanto si è vicini all'inizio: il fumetto riempie lo schermo
  const DOT_R = 30,
    DOT_DX = 112;
  const WM = BRAND.wordmark;
  const K = 9;
  const LOCK_X = (W - WM.w * K) / 2,
    LOCK_Y = (H - WM.h * K) / 2;
  const C2 = [LOCK_X + 12 * K, LOCK_Y + 15 * K];
  const S2 = (24 * K) / LOGO.size;
  // i tre puntini e il nodo che diventano: sinistra → E, centro → C, destra → D
  const TARGET = [4, 2, 3];
  const npos = (i) => [(LOGO.nodes[i][0] - LOGO.c) * S1, (LOGO.nodes[i][1] - LOGO.c) * S1, LOGO.nodes[i][2] * S1];

  function roundRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function render(t) {
    t = clamp(t, 0, T_END);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    const cam = outExpo(prog(t, T_SEND, CAM_DUR));
    const Z = lerp(Z0 - 0.25 * prog(t, 0, T_SEND), 1, cam); // lenta spinta durante l'attesa, poi si allarga
    const m = inOutCubic(prog(t, T_MORPH, MORPH_DUR));
    const hit = t - T_SEND;
    const roll = inOutCubic(prog(t, T_ROLL, ROLL_DUR));
    const real = prog(t, T_REAL, 0.1);

    // ---- fondo chiaro del brand ----
    const bz = 1 + (Z - 1) * 0.25;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(bz, bz);
    ctx.translate(-W / 2, -H / 2);
    PN.lightBg(ctx, t, {
      t0: T_SEND - 0.15,
      life: prog(t, T_SEND, T_END - T_SEND),
      bump: hit > 0 ? Math.exp(-hit * 5) * Math.sin(hit * 11) : 0,
      shift: 70 * roll,
      looperT0: T_SEND + 0.2,
    });
    ctx.restore();

    if (real < 1) {
      ctx.save();
      ctx.globalAlpha = 1 - real;
      ctx.translate(C1[0], C1[1]);
      ctx.scale(Z, Z);

      // bordo del logo
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

      // ---- il fumetto, che diventa il disco ----
      const squash = 1 + 0.05 * (m > 0 && m < 1 ? Math.sin(Math.PI * m) : 0);
      const bw = lerp(BUB.w, RD * 2, m) * squash,
        bh = lerp(BUB.h, RD * 2, m) / squash,
        br = lerp(BUB.r, RD, m);
      ctx.fillStyle = PN.BLUE;
      // la codina del fumetto, in basso a sinistra: rientra mentre diventa disco
      const tail = 1 - smooth(prog(t, T_MORPH - 0.05, 0.3));
      if (tail > 0) {
        const tx = -bw / 2 + 70,
          ty = bh / 2 - 6;
        ctx.beginPath();
        ctx.moveTo(tx, ty - 40);
        ctx.quadraticCurveTo(tx - 6, ty + 46 * tail, tx - 78 * tail, ty + 74 * tail);
        ctx.quadraticCurveTo(tx + 50, ty + 62 * tail, tx + 118, ty - 10);
        ctx.closePath();
        ctx.fill();
      }
      roundRect(-bw / 2, -bh / 2, bw, bh, br);
      ctx.fill();

      // ---- la rete ----
      PN.drawNet(ctx, t, S1, NET, LOGO.white);

      // ---- i tre puntini: "sta scrivendo…", poi vanno a fare i nodi ----
      for (let j = 0; j < 3; j++) {
        const pop = spring(t - (T_DOTS + j * 0.07), 11, 14);
        if (pop <= 0) continue;
        // onda dell'attesa
        let lift = 0;
        if (t < T_SEND) {
          const local = t - TYPE_T0 - j * TYPE_GAP;
          if (local > 0) {
            const ph = (local % TYPE_CYCLE) / (TYPE_CYCLE * 0.62);
            if (ph < 1) lift = Math.sin(Math.PI * ph);
          }
        }
        // alla risposta: un piccolo scatto, poi il viaggio verso il nodo
        const go = inOutCubic(prog(t, T_MORPH - 0.02 + j * 0.03, MORPH_DUR - 0.04));
        const tg = npos(TARGET[j]);
        const x = lerp((j - 1) * DOT_DX, tg[0], go),
          y = lerp(-lift * 34, tg[1], go);
        const r = lerp(DOT_R * (1 + 0.14 * lift), tg[2], go) * pop;
        ctx.globalAlpha = (1 - real) * lerp(0.62 + 0.38 * lift, 1, Math.max(go, prog(t, T_SEND - 0.05, 0.1)));
        ctx.fillStyle = LOGO.white;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 6.2832);
        ctx.fill();
      }
      ctx.restore();
    }

    // ---- logo originale: rotola a sinistra, il nome esce da dietro ----
    if (real > 0) {
      const cx = lerp(C1[0], C2[0], roll),
        cy = lerp(C1[1], C2[1], roll);
      const sc = lerp(S1, S2, roll);
      const wq = outCubic(prog(t, T_ROLL + 0.12, ROLL_DUR - 0.02));
      if (wq > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(cx, 0, W, H);
        ctx.clip();
        ctx.globalAlpha = Math.min(1, wq * 2.5);
        ctx.translate(LOCK_X - (1 - wq) * 320, LOCK_Y);
        ctx.scale(K, K);
        ctx.fillStyle = WM.fill;
        ctx.fill(PN.WORD.path);
        ctx.restore();
      }
      ctx.save();
      ctx.globalAlpha = real;
      ctx.translate(cx, cy);
      ctx.rotate(-2 * Math.PI * roll);
      PN.drawLogo(ctx, 0, 0, sc, 1);
      ctx.restore();
    }
  }
  window.PN_RENDER = render;
})();
