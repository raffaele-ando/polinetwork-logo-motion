// FILO — il logo arriva secco; la camera entra in una delle sue linee e da vicino quella linea è un fascio
// di fili: il looper. Il blu del disco si scioglie nelle forme sfumate. Lo sfondo del brand è il logo
// visto da dentro. Alla fine resta il logo esteso.
(function () {
  const { clamp, lerp, prog, smooth, outCubic, inOutCubic, outExpo, spring, LOGO } = PN;
  const BRAND = window.PN_BRAND;
  const W = 1920,
    H = 1080;
  const ctx = document.getElementById("stage").getContext("2d");

  // ---- tempi (secondi) ----
  const T_END = 4.8;
  const T_LOGO = 0.18; // il logo arriva
  const T_DIVE = 1.15,
    DIVE_DUR = 1.25; // la camera entra nella linea
  const Z_MAX = 190; // quanto si ingrandisce: la linea diventa larga quanto lo schermo
  const T_OPEN = 2.2,
    OPEN_DUR = 0.95; // i fili si piegano nel looper, il blu si scioglie nelle forme
  const T_LOCK = 3.15; // torna il logo, con il nome

  // ---- misure ----
  const C = [960, 540];
  const S0 = 520 / (LOGO.outline * 2);
  // la linea in cui si entra: quella lunga, dal nodo in alto al nodo in basso
  const nB = LOGO.nodes[1],
    nF = LOGO.nodes[5];
  // (nel file originale la linea passa 1,15 unità a lato dei centri dei nodi: misurato sul logo)
  const MID = [((nB[0] + nF[0]) / 2 + 1.137 - LOGO.c) * S0, ((nB[1] + nF[1]) / 2 + 0.171 - LOGO.c) * S0];
  const TILT = Math.PI / 2 - Math.atan2(nF[1] - nB[1], nF[0] - nB[0]); // rotazione che la mette in verticale
  const LINE_W = LOGO.solidW * S0;
  const WMB = BRAND.wordmark;
  const K = 9;

  // ---- il looper nella sua posizione di sempre (in basso a sinistra), campionato punto per punto ----
  const SEG = 110;
  const LP = { x: -330, y: 250, rot: -0.12, sc: 0.92 };
  const svgNS = "http://www.w3.org/2000/svg";
  const fili = BRAND.looper.lines.map((l, i) => {
    const p = document.createElementNS(svgNS, "path");
    p.setAttribute("d", l.d);
    const len = p.getTotalLength();
    const pts = new Float32Array((SEG + 1) * 2);
    const cr = Math.cos(LP.rot),
      sr = Math.sin(LP.rot);
    for (let k = 0; k <= SEG; k++) {
      const q = p.getPointAtLength((len * k) / SEG);
      const x = q.x * LP.sc,
        y = q.y * LP.sc;
      pts[k * 2] = LP.x + x * cr - y * sr;
      pts[k * 2 + 1] = LP.y + x * sr + y * cr;
    }
    // i fili dritti vanno dall'alto in basso: il looper si percorre nel verso che torna meglio
    if (pts[1] > pts[SEG * 2 + 1]) {
      for (let a = 0, b = SEG; a < b; a++, b--) {
        for (let c = 0; c < 2; c++) {
          const tmp = pts[a * 2 + c];
          pts[a * 2 + c] = pts[b * 2 + c];
          pts[b * 2 + c] = tmp;
        }
      }
    }
    return { pts, o: Math.min(1, l.o * 1.7 + 0.15), i };
  });
  const N = fili.length;

  // ---- forme sfumate ----
  const SHAPES = [
    { spr: PN.shapeSprite("big-teal"), x: 250, y: 760, size: 1250, dx: 46, dy: -30, rot: 0.22 },
    { spr: PN.shapeSprite("big-blue"), x: 1760, y: 110, size: 1050, dx: -50, dy: 34, rot: -0.2 },
    { spr: PN.shapeSprite("small-blue"), x: 1560, y: 980, size: 560, dx: -30, dy: -44, rot: 0.3 },
  ];

  function render(t) {
    t = clamp(t, 0, T_END);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = PN.BG;
    ctx.fillRect(0, 0, W, H);

    // ---- camera ----
    const du = prog(t, T_DIVE, DIVE_DUR);
    const de = smooth(du);
    const pre = 1 + 0.07 * smooth(prog(t, 0.5, T_DIVE - 0.5)); // lenta spinta prima di entrare
    const Z = pre * Math.pow(Z_MAX / pre, de);
    const fk = smooth(prog(du, 0, 0.42)); // il punto verso cui si va: dal centro del logo al centro della linea
    const rot = TILT * smooth(prog(du, 0, 0.6));
    const open = prog(t, T_OPEN, OPEN_DUR);
    const life = prog(t, T_OPEN, T_END - T_OPEN);

    // ---- sfondo del brand: nasce quando il blu si scioglie ----
    if (open > 0) {
      const g = outExpo(open);
      for (const s of SHAPES) {
        PN.drawSprite(
          ctx,
          s.spr,
          lerp(960, s.x, g) + s.dx * life,
          lerp(540, s.y, g) + s.dy * life,
          s.size * lerp(3.4, 1, g),
          s.rot * life + (1 - g) * 0.6,
          Math.min(1, open * 3),
        );
      }
    }

    // ---- il logo, dentro la camera ----
    const blueOut = smooth(prog(t, T_OPEN + 0.05, 0.42));
    if (blueOut < 1) {
      const inA = prog(t, T_LOGO, 0.1);
      const inS = lerp(1.14, 1, outExpo(prog(t, T_LOGO, 0.45)));
      ctx.save();
      ctx.globalAlpha = inA * (1 - blueOut);
      ctx.translate(C[0], C[1]);
      ctx.rotate(rot);
      ctx.scale(Z * inS, Z * inS);
      ctx.translate(-MID[0] * fk, -MID[1] * fk);
      PN.drawLogo(ctx, 0, 0, S0, 1);
      ctx.restore();
    }

    // ---- i fili ----
    // la linea bianca, da vicino, si apre in tanti fili; poi i fili si piegano e diventano il looper
    const split = smooth(prog(Math.log(Z), Math.log(9), Math.log(70) - Math.log(9)));
    if (Z >= 9) {
      const bundle = LINE_W * Z; // larghezza della linea sullo schermo
      const morph = inOutCubic(open);
      // sotto i fili, la linea piena viene coperta dal blu del disco
      if (blueOut < 1) {
        ctx.save();
        ctx.globalAlpha = (1 - blueOut) * split;
        ctx.fillStyle = PN.BLUE;
        ctx.fillRect(960 - bundle / 2 - 2, 0, bundle + 4, H);
        ctx.restore();
      }
      const wave = smooth(prog(t, T_DIVE + DIVE_DUR * 0.55, 0.5)) * (1 - smooth(prog(t, T_OPEN + 0.25, 0.7)));
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const f of fili) {
        const v = f.i / (N - 1) - 0.5;
        const mi = inOutCubic(prog(open, 0.02 * f.i * 0.6, 0.78)); // ogni filo parte un attimo dopo il precedente
        const x0 = 960 + v * bundle * (1 - 1 / N);
        const wLine = lerp(lerp((bundle / N) * 1.04, 2.8, split), BRAND.looper.width * LP.sc, morph);
        const alpha = lerp(1, f.o, morph);
        ctx.strokeStyle = `rgba(248,250,252,${alpha})`;
        ctx.lineWidth = wLine;
        ctx.beginPath();
        for (let k = 0; k <= SEG; k++) {
          const s = k / SEG;
          const sx =
            x0 + wave * (34 * Math.sin(6.2832 * 1.3 * s - 8 * t + f.i * 0.55) + 14 * Math.sin(6.2832 * 3.1 * s + 5 * t + f.i));
          const sy = -260 + (H + 520) * s;
          const x = lerp(sx, f.pts[k * 2], mi),
            y = lerp(sy, f.pts[k * 2 + 1], mi);
          if (k === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    // ---- il logo esteso ----
    const lq = t - T_LOCK;
    if (lq > 0) {
      const a = prog(lq, 0, 0.18);
      const s = lerp(0.9, 1, outExpo(prog(lq, 0, 0.6))) * (1 + 0.02 * prog(lq, 0.6, T_END - T_LOCK - 0.6));
      const lx = (-WMB.w * K) / 2,
        ly = (-WMB.h * K) / 2;
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(s, s);
      // il nome esce da dietro al logo
      const wq = outCubic(prog(lq, 0.12, 0.7));
      ctx.save();
      ctx.beginPath();
      ctx.rect(lx + 12 * K, -H, W, 2 * H);
      ctx.clip();
      ctx.globalAlpha = Math.min(1, wq * 2.5);
      ctx.translate(lx - (1 - wq) * 260, ly);
      ctx.scale(K, K);
      ctx.fillStyle = WMB.fill;
      ctx.fill(PN.WORD.path);
      ctx.restore();
      ctx.globalAlpha = a;
      PN.drawLogo(ctx, lx + 12 * K, ly + 15 * K, ((24 * K) / LOGO.size) * (0.6 + 0.4 * spring(lq, 10, 13)), 1);
      ctx.restore();
    }
  }
  window.PN_RENDER = render;
})();
