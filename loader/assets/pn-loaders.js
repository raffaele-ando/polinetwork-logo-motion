// Icone di caricamento di PoliNetwork: i tre puntini di "sta scrivendo…".
//
// PoliNetwork è scrivere in un gruppo e trovare qualcuno che risponde: l'attesa di quella risposta
// sono tre puntini. Qui i tre puntini sono sempre gli stessi (uguali, in fila, alla stessa distanza)
// e cambia solo come si comportano: ondeggiano, si collegano con una linea, diventano una piccola
// rete, si riempiono di tratteggio. Dieci icone, leggibili anche a 24 px.
//
// Questo file contiene i disegni. Per usarle in una pagina serve anche pn-loaders-start.js:
//   PNLoaders.start(canvas, "onda", { fg: "#1055AD", bg: "#f1f5f9", period: 1.8 });
// (bg serve dove il disegno ha dei vuoti). Vedi anteprima.html per un esempio completo.
//
// Ogni icona è una funzione draw(ctx, u, c): u va da 0 a 1 e poi ricomincia, c = { fg, bg }.
// Il disegno sta in un quadrato di 1000 unità, centrato in (0, 0).
(function () {
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const sm = (u) => {
    u = clamp(u);
    return u * u * (3 - 2 * u);
  };
  const eio = (u) => {
    u = clamp(u);
    return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  };
  const step = (u, t0, d) => sm((u - t0) / d);

  // ---- i tre puntini ----
  const R = 92, // raggio
    GAP = 290, // distanza tra i centri
    LW = 54; // spessore della linea che li collega
  const X = [-GAP, 0, GAP];
  // l'onda di "sta scrivendo": ogni puntino sale e scende, uno dopo l'altro, poi una pausa
  const WAVE = 0.44, // quanto dura la salita e discesa di un puntino, sul giro
    LAG = 0.13; // ritardo tra un puntino e il successivo
  const wave = (u, i) => {
    const x = (u - i * LAG) / WAVE;
    return x <= 0 || x >= 1 ? 0 : sm(x < 0.5 ? x * 2 : (1 - x) * 2);
  };

  const dot = (ctx, x, y, r) => {
    if (r <= 0.2) return;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  };
  const line = (ctx, x0, y0, x1, y1, w) => {
    if (w <= 0.2 || Math.hypot(x1 - x0, y1 - y0) < 0.5) return;
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  };

  const L = [];
  const add = (id, name, draw) => L.push({ id, name, draw });

  // 1 — l'onda: il "sta scrivendo" di sempre
  add("onda", "Onda", (ctx, u, c) => {
    ctx.fillStyle = c.fg;
    X.forEach((x, i) => {
      const h = wave(u, i);
      dot(ctx, x, -150 * h, R * (1 + 0.08 * h));
    });
  });

  // 2 — una linea parte dal primo puntino, raggiunge gli altri due, poi si ritira: si collegano
  add("collegamento", "Collegamento", (ctx, u, c) => {
    const head = lerp(X[0], X[2], eio(u / 0.4)),
      tail = lerp(X[0], X[2], eio((u - 0.5) / 0.4));
    ctx.strokeStyle = c.fg;
    line(ctx, tail, 0, head, 0, LW);
    ctx.fillStyle = c.fg;
    const moving = (u > 0.02 && u < 0.4) || (u > 0.5 && u < 0.9);
    X.forEach((x) => {
      // ogni puntino si gonfia un attimo quando la linea lo tocca e quando lo lascia
      const near = Math.max(clamp(1 - Math.abs(head - x) / 130), clamp(1 - Math.abs(tail - x) / 130));
      dot(ctx, x, 0, R * (1 + (moving ? 0.2 * sm(near) : 0)));
    });
  });

  // 3 — i tre puntini diventano una piccola rete: quello al centro scende, due linee li uniscono
  add("rete", "Rete", (ctx, u, c) => {
    const m = eio((u - 0.08) / 0.26) - eio((u - 0.62) / 0.26);
    const P = [
      [X[0] + 40 * m, -120 * m],
      [X[1], 170 * m],
      [X[2] - 40 * m, -120 * m],
    ];
    ctx.strokeStyle = c.fg;
    const g = sm(m * 1.5);
    line(ctx, P[1][0], P[1][1], lerp(P[1][0], P[0][0], g), lerp(P[1][1], P[0][1], g), LW * sm(m * 4));
    line(ctx, P[1][0], P[1][1], lerp(P[1][0], P[2][0], g), lerp(P[1][1], P[2][1], g), LW * sm(m * 4));
    ctx.fillStyle = c.fg;
    P.forEach((p) => dot(ctx, p[0], p[1], R));
  });

  // 4 — tra un puntino e l'altro compare il tratteggio, pallino dopo pallino: il messaggio in viaggio
  add("tratteggio", "Tratteggio", (ctx, u, c) => {
    ctx.fillStyle = c.fg;
    const small = [-GAP * 0.62, -GAP * 0.38, GAP * 0.38, GAP * 0.62];
    small.forEach((x, k) => {
      const on = step(u, 0.08 + k * 0.09, 0.07) * (1 - step(u, 0.58 + k * 0.09, 0.07));
      dot(ctx, x, 0, 27 * on);
    });
    X.forEach((x) => dot(ctx, x, 0, R));
  });

  // 5 — l'onda passa nella grandezza invece che nell'altezza: piccolo, medio, grande, come i nodi del logo
  add("taglie", "Taglie", (ctx, u, c) => {
    ctx.fillStyle = c.fg;
    X.forEach((x, i) => dot(ctx, x, 0, R * (0.66 + 0.74 * wave(u, i))));
  });

  // 6 — i tre puntini si avvicinano, si fondono in uno solo, e si separano di nuovo
  add("fusione", "Fusione", (ctx, u, c) => {
    const k = 1 - (eio((u - 0.06) / 0.3) - eio((u - 0.58) / 0.3)); // 1 = separati, 0 = uniti
    ctx.strokeStyle = c.fg;
    ctx.fillStyle = c.fg;
    const fat = sm((0.62 - k) / 0.3); // quando sono abbastanza vicini diventano una pillola
    line(ctx, X[0] * k, 0, X[2] * k, 0, 2 * R * fat);
    const r = R * (1 + 0.22 * sm((0.2 - k) / 0.2));
    X.forEach((x) => dot(ctx, x * k, 0, r));
  });

  // 7 — il primo salta sopra gli altri e va in fondo; gli altri scalano di un posto
  add("staffetta", "Staffetta", (ctx, u, c) => {
    const e = eio(u / 0.62);
    ctx.fillStyle = c.fg;
    dot(ctx, lerp(X[0], X[2], e), -230 * Math.sin(Math.PI * e), R * (1 + 0.08 * Math.sin(Math.PI * e)));
    dot(ctx, lerp(X[1], X[0], e), 0, R);
    dot(ctx, lerp(X[2], X[1], e), 0, R);
  });

  // 8 — tre anelli vuoti che si riempiono a onda
  add("anelli", "Anelli", (ctx, u, c) => {
    const ring = 34;
    X.forEach((x, i) => {
      ctx.strokeStyle = c.fg;
      ctx.lineWidth = ring;
      ctx.beginPath();
      ctx.arc(x, 0, R - ring / 2, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = c.fg;
      dot(ctx, x, 0, (R - 4) * wave(u, i));
    });
  });

  // 9 — il fumetto: i puntini dentro la nuvoletta del messaggio
  add("fumetto", "Fumetto", (ctx, u, c) => {
    const w = 800,
      h = 440,
      r = 200;
    ctx.fillStyle = c.fg;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + r, -h / 2 - 30);
    ctx.arcTo(w / 2, -h / 2 - 30, w / 2, h / 2 - 30, r);
    ctx.arcTo(w / 2, h / 2 - 30, -w / 2, h / 2 - 30, r);
    ctx.arcTo(-w / 2, h / 2 - 30, -w / 2, -h / 2 - 30, r);
    ctx.arcTo(-w / 2, -h / 2 - 30, w / 2, -h / 2 - 30, r);
    ctx.closePath();
    ctx.fill();
    // la codina
    ctx.beginPath();
    ctx.moveTo(-250, 120);
    ctx.quadraticCurveTo(-250, 250, -350, 290);
    ctx.quadraticCurveTo(-180, 290, -110, 170);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = c.bg;
    [-200, 0, 200].forEach((x, i) => {
      const hh = wave(u, i);
      dot(ctx, x, -30 - 80 * hh, 58 * (1 + 0.08 * hh));
    });
  });

  // 10 — il disco del logo: dentro, i tre puntini diventano una rete e tornano puntini
  add("logo", "Logo", (ctx, u, c) => {
    ctx.fillStyle = c.fg;
    dot(ctx, 0, 0, 480);
    const m = eio((u - 0.08) / 0.26) - eio((u - 0.62) / 0.26);
    const s = 200;
    const P = [
      [-s + 20 * m, -100 * m],
      [0, 140 * m],
      [s - 20 * m, -100 * m],
    ];
    ctx.strokeStyle = c.bg;
    const g = sm(m * 1.5);
    line(ctx, P[1][0], P[1][1], lerp(P[1][0], P[0][0], g), lerp(P[1][1], P[0][1], g), 36 * sm(m * 4));
    line(ctx, P[1][0], P[1][1], lerp(P[1][0], P[2][0], g), lerp(P[1][1], P[2][1], g), 36 * sm(m * 4));
    ctx.fillStyle = c.bg;
    P.forEach((p) => dot(ctx, p[0], p[1], 60));
  });

  // ---- API ----
  const byId = {};
  L.forEach((l) => (byId[l.id] = l));
  const DEFAULTS = { fg: "#1055AD", bg: "#f1f5f9", period: 1.8 };
  // disegna un fotogramma: u da 0 a 1; il contesto va già centrato dove deve stare l'icona
  const drawOn = (ctx, id, u, size, o = {}) => {
    const c = { fg: o.fg || DEFAULTS.fg, bg: o.bg || DEFAULTS.bg };
    ctx.save();
    ctx.scale(size / 1000, size / 1000);
    byId[id].draw(ctx, ((u % 1) + 1) % 1, c);
    ctx.restore();
    ctx.globalAlpha = 1;
  };
  window.PNLoaders = {
    list: L.map((l) => ({ id: l.id, name: l.name })),
    draw: drawOn,
    defaults: DEFAULTS,
  };
})();
