// NASTRO — il looper è il protagonista: su un fondo tutto blu un nastro di curve bianche attraversa lo
// schermo, si avvolge su sé stesso e diventa l'anello del logo. Poi il blu si richiude nel disco e
// intorno resta il fondo chiaro.
(function () {
  const { clamp, lerp, prog, smooth, outCubic, outQuart, inOutCubic, spring, outExpo, LOGO } = PN;
  const W = 1920,
    H = 1080;
  const ctx = document.getElementById("stage").getContext("2d");

  // ---- tempi (secondi) ----
  const T_END = 5.5;
  const T_IN = 0.12; // il nastro entra da sinistra
  const T_WRAP = 1.55,
    WRAP_DUR = 1.3; // si avvolge nell'anello
  const T_IRIS = 2.85,
    IRIS_DUR = 0.6; // il blu si richiude nel disco
  const NET = {
    on: [3.1, 3.14, 3.06, 3.26, 3.22, 3.18],
    solid: [
      [2, 0, 3.08, 0.22],
      [2, 1, 3.1, 0.22],
      [1, 5, 3.16, 0.24],
      [5, 4, 3.22, 0.22],
      [5, 3, 3.24, 0.22],
    ],
    dots: [3.28, 3.32, 3.36, 3.4],
    dotGap: 0.01,
  };
  const T_REAL = 3.72;
  const T_ROLL = 3.86,
    ROLL_DUR = 0.9; // il logo rotola a sinistra, il nome esce da dietro

  // ---- misure ----
  const C1 = [960, 540];
  const S1 = 540 / (LOGO.outline * 2);
  const RING_R = ((LOGO.ringIn + LOGO.ringOut) / 2) * S1,
    RING_W = (LOGO.ringOut - LOGO.ringIn) * S1;
  const WM = window.PN_BRAND.wordmark;
  const K = 9;
  const LOCK_X = (W - WM.w * K) / 2,
    LOCK_Y = (H - WM.h * K) / 2;
  const C2 = [LOCK_X + 12 * K, LOCK_Y + 15 * K];
  const S2 = (24 * K) / LOGO.size;

  // ---- il mondo blu ----
  const sprLight = PN.shapeSprite("big-teal", "#51A2FF", 0.4);
  const sprDeep = PN.shapeSprite("big-blue", "#0A3F86", 0.6);
  const sprSmall = PN.shapeSprite("small-blue", "#74D4FF", 0.3);

  // ---- il nastro ----
  const LINES = 30,
    SEG = 150;

  function strand(i, t, m, spin, out) {
    const v = i / (LINES - 1) - 0.5; // da -0.5 a 0.5 attraverso il nastro
    const grow = outCubic(prog(t, T_IN + i * 0.014, 0.95)); // quanto è già entrato
    const band = lerp(430, RING_W, Math.pow(m, 0.8)); // larghezza del fascio quando è cerchio
    let n = 0;
    for (let k = 0; k <= SEG; k++) {
      const s = k / SEG;
      if (s > grow && m < 0.02) break;
      // onda: le curve si incrociano come nel looper
      const wx = -260 + 2440 * s;
      const twist = Math.cos(Math.PI * (1.7 * s - 0.35) + 0.55 * t);
      const wy =
        540 +
        560 * v * twist +
        150 * Math.sin(6.2832 * 0.75 * s + 1.25 * t + v * 1.8) +
        60 * Math.sin(6.2832 * 1.9 * s - 0.8 * t + v * 5);
      // cerchio
      const a = -Math.PI + 6.2832 * s + spin + v * 1.4 * (1 - m);
      const r = RING_R + v * band;
      const cx = C1[0] + Math.cos(a) * r,
        cy = C1[1] + Math.sin(a) * r;
      out[n++] = lerp(wx, cx, m);
      out[n++] = lerp(wy, cy, m);
    }
    return n;
  }
  const buf = new Float32Array((SEG + 1) * 2);

  function blueWorld(t) {
    ctx.fillStyle = PN.BLUE;
    ctx.fillRect(-100, -100, W + 200, H + 200);
    const life = t / T_END;
    PN.drawSprite(ctx, sprDeep, 1560 - 60 * life, 170 + 40 * life, 1350, 0.3 * life, 1);
    PN.drawSprite(ctx, sprLight, 300 + 70 * life, 930 - 40 * life, 1250, 0.2 * life, 1);
    PN.drawSprite(ctx, sprSmall, 1600 - 40 * life, 930 - 30 * life, 640, 0.3, 1);
  }

  function render(t) {
    t = clamp(t, 0, T_END);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    const m = inOutCubic(prog(t, T_WRAP, WRAP_DUR));
    const spin = 4.2 * (1 - outCubic(prog(t, T_WRAP, WRAP_DUR + 0.05)));
    const iris = outExpo(prog(t, T_IRIS, IRIS_DUR));
    const hit = t - T_IRIS;
    const bump = hit > 0 ? Math.exp(-hit * 5.5) * Math.sin(hit * 12) : 0;
    const roll = inOutCubic(prog(t, T_ROLL, ROLL_DUR));
    const real = prog(t, T_REAL, 0.1);

    // ---- fondo chiaro: si scopre quando il blu si richiude ----
    if (hit > 0) {
      PN.lightBg(ctx, t, { instant: false, t0: T_IRIS - 0.25, life: t / T_END, bump: bump * 1.4, shift: 70 * roll, looperT0: T_IRIS });
    }

    // ---- il mondo blu, dentro un cerchio che si stringe fino al disco ----
    const logoPulse = 1 + 0.05 * bump;
    if (real < 1) {
      ctx.save();
      ctx.globalAlpha = 1 - real;
      ctx.translate(C1[0], C1[1]);
      ctx.scale(logoPulse, logoPulse);
      ctx.translate(-C1[0], -C1[1]);

      const rClip = lerp(1250, LOGO.disc * S1, iris);
      // bordo scuro e anello bianco pieni, quando il nastro è diventato anello
      if (hit > -0.06) {
        const ra = prog(t, T_IRIS - 0.06, 0.1);
        ctx.globalAlpha = (1 - real) * ra;
        if (hit > 0) {
          ctx.fillStyle = LOGO.dark;
          ctx.beginPath();
          ctx.arc(C1[0], C1[1], LOGO.outline * S1, 0, 6.2832);
          ctx.fill();
          ctx.fillStyle = LOGO.white;
          ctx.beginPath();
          ctx.arc(C1[0], C1[1], LOGO.ringOut * S1, 0, 6.2832);
          ctx.fill();
        }
        ctx.globalAlpha = 1 - real;
      }
      ctx.save();
      ctx.beginPath();
      ctx.arc(C1[0], C1[1], rClip, 0, 6.2832);
      ctx.clip();
      blueWorld(t);
      ctx.restore();

      // il nastro
      if (hit < 0.05) {
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        const fade = 1 - prog(t, T_IRIS - 0.02, 0.07);
        for (let i = 0; i < LINES; i++) {
          const n = strand(i, t, m, spin, buf);
          if (n < 4) continue;
          const edge = 1 - Math.abs(i / (LINES - 1) - 0.5) * 2; // le curve al centro sono più piene
          ctx.strokeStyle = `rgba(248,250,252,${lerp(0.3 + 0.6 * edge, 1, m) * fade})`;
          ctx.lineWidth = lerp(2.2, 2.6, m);
          ctx.beginPath();
          ctx.moveTo(buf[0], buf[1]);
          for (let k = 2; k < n; k += 2) ctx.lineTo(buf[k], buf[k + 1]);
          ctx.stroke();
        }
      }
      // anello bianco pieno sopra il blu (prima che il blu si richiuda)
      if (hit > -0.06 && hit <= 0) {
        ctx.globalAlpha = (1 - real) * prog(t, T_IRIS - 0.06, 0.06);
        ctx.strokeStyle = LOGO.white;
        ctx.lineWidth = RING_W;
        ctx.beginPath();
        ctx.arc(C1[0], C1[1], RING_R, 0, 6.2832);
        ctx.stroke();
        ctx.globalAlpha = 1 - real;
      }

      // la rete
      ctx.translate(C1[0], C1[1]);
      PN.drawNet(ctx, t, S1, NET, LOGO.white);
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
      ctx.scale(logoPulse, logoPulse);
      PN.drawLogo(ctx, 0, 0, sc, 1);
      ctx.restore();
    }
  }
  window.PN_RENDER = render;
})();
