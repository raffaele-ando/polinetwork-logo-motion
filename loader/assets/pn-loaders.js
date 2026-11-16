// Icone di caricamento di PoliNetwork: 24 variazioni in loop costruite solo con i pezzi del logo
// (nodi, linee piene, linee a pallini, anello, disco).
//
// Questo file contiene i disegni. Per usarle in una pagina serve anche pn-loaders-start.js:
//   PNLoaders.start(canvas, "impulso", { fg: "#1055AD", bg: "#f1f5f9", period: 2.4 });
// (bg serve solo dove il disegno si inverte). Vedi anteprima.html per un esempio completo.
//
// Ogni icona è una funzione draw(ctx, u, c): u va da 0 a 1 e poi ricomincia, c = { fg, bg }.
// Il disegno è in unità del logo, centrato in (0, 0), da -480 a 480.
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
  const step = (u, t0, d) => sm((u - t0) / d); // sale da 0 a 1 a partire da t0, in d
  // gobba morbida centrata in c, larga w, che gira su sé stessa (per i loop)
  const bump = (u, c, w) => {
    const d = Math.abs(((((u - c + 0.5) % 1) + 1) % 1) - 0.5);
    return d < w ? sm(1 - d / w) : 0;
  };

  // ---- il logo (misurato sul file originale, centro in 0,0) ----
  const N = [
    [-206.97, -183.95, 51.85], // 0 A  in alto a sinistra
    [92.01, -247.05, 42.43], // 1 B  in alto
    [-21.34, -107.23, 31.39], // 2 C  piccolo, al centro
    [246.72, -8.09, 58.36], // 3 D  a destra
    [-228.73, 147.27, 41.62], // 4 E  in basso a sinistra
    [19.53, 233.96, 51.89], // 5 F  in basso
  ];
  const SOLID = [
    [2, 0],
    [2, 1],
    [1, 5],
    [5, 4],
    [5, 3],
  ];
  const DOTTED = [
    [4, 0, 47.5, 13],
    [4, 2, 47, 14],
    [4, 3, 54, 21],
    [1, 3, 49.6, 10],
  ];
  const ORDER = [2, 0, 1, 5, 4, 3]; // l'ordine in cui la rete si percorre: C, A, B, F, E, D
  const RANK = [1, 2, 0, 5, 4, 3]; // posizione di ogni nodo in quell'ordine
  const LW = 28, // spessore delle linee (un po' più del logo: le icone sono piccole)
    DOT_R = 11, // pallini più grandi e più radi del logo, per restare leggibili in piccolo
    RING_R = 453.6,
    RING_W = 40,
    DISC_R = 433.6;
  // posizione (0..1 lungo la linea) dei pallini di ogni linea tratteggiata: uno sì e uno no
  const DOTS = DOTTED.map(([a, b, first, n]) => {
    const L = Math.hypot(N[b][0] - N[a][0], N[b][1] - N[a][1]);
    const out = [];
    for (let k = 0; k < n; k += 2) out.push((first + k * 18.68) / L);
    return out;
  });

  // ---- mattoni ----
  const dot = (ctx, x, y, r) => {
    if (r <= 0.2) return;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  };
  const seg = (ctx, A, B, g0, g1, w) => {
    if (g1 - g0 <= 0.001 || w <= 0.2) return;
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(lerp(A[0], B[0], g0), lerp(A[1], B[1], g0));
    ctx.lineTo(lerp(A[0], B[0], g1), lerp(A[1], B[1], g1));
    ctx.stroke();
  };
  // la rete. o può cambiare: pos(i) → [x, y, r]; solid(j) → [da, a]; width(j); dotScale(linea, k, n); node(i) → scala
  const net = (ctx, color, o = {}) => {
    const pos = o.pos || ((i) => N[i]);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    SOLID.forEach(([a, b], j) => {
      const g = o.solid ? o.solid(j) : [0, 1];
      seg(ctx, pos(a), pos(b), g[0], g[1], o.width ? o.width(j) : LW);
    });
    if (o.dots !== false) {
      DOTTED.forEach(([a, b], li) => {
        const A = pos(a),
          B = pos(b);
        DOTS[li].forEach((s, k) => {
          const sc = o.dotScale ? o.dotScale(li, k, DOTS[li].length) : 1;
          dot(ctx, lerp(A[0], B[0], s), lerp(A[1], B[1], s), DOT_R * sc);
        });
      });
    }
    for (let i = 0; i < 6; i++) {
      const p = pos(i);
      dot(ctx, p[0], p[1], p[2] * (o.node ? o.node(i) : 1));
    }
  };
  const ringArc = (ctx, color, a0, a1, w = RING_W) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 0, RING_R, a0, a1);
    ctx.stroke();
  };
  const disc = (ctx, color, r = DISC_R) => {
    ctx.fillStyle = color;
    dot(ctx, 0, 0, r);
  };
  // il logo pieno: disco, rete in negativo, bordo
  const logo = (ctx, c) => {
    ctx.strokeStyle = c.fg;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(0, 0, 473, 0, TAU);
    ctx.stroke();
    disc(ctx, c.fg);
    net(ctx, c.bg);
  };
  const inner = (ctx, k, fn) => {
    ctx.save();
    ctx.scale(k, k);
    fn();
    ctx.restore();
  };

  const L = [];
  // le icone fatte della sola rete si ingrandiscono, così occupano lo stesso spazio di quelle con l'anello
  const WIDE = ["costruzione", "tratteggio", "scrivendo", "spazio", "salto", "peso", "contorno", "scambio", "collasso", "taglie", "flusso", "turno", "pillole", "quadrati", "staffetta", "elastico", "sguardo", "sbarre", "perle", "ordine"];
  const add = (id, name, draw) => L.push({ id, name, draw, zoom: WIDE.includes(id) ? 1.45 : 1 });

  // 1 — la rete si costruisce linea per linea, poi si ritira
  add("costruzione", "Costruzione", (ctx, u, c) => {
    const tOn = [0.13, 0.19, 0, 0.4, 0.4, 0.31],
      eOn = [0.02, 0.08, 0.2, 0.31, 0.31];
    const OFF = 0.55;
    net(ctx, c.fg, {
      solid: (j) => [eio((u - OFF - eOn[j]) / 0.12), eio((u - eOn[j]) / 0.12)],
      node: (i) => step(u, tOn[i], 0.07) * (1 - step(u, OFF + tOn[i] + 0.06, 0.07)),
      dotScale: (li, k, n) => step(u, 0.36 + li * 0.02 + (k / n) * 0.1, 0.04) * (1 - step(u, OFF + 0.3 + li * 0.02 + (k / n) * 0.08, 0.04)),
    });
  });

  // 2 — i pallini scorrono lungo le linee tratteggiate
  add("tratteggio", "Tratteggio", (ctx, u, c) => {
    net(ctx, c.fg, { dots: false });
    ctx.fillStyle = c.fg;
    DOTTED.forEach(([a, b, first], li) => {
      const A = N[a],
        B = N[b];
      const Lg = Math.hypot(B[0] - A[0], B[1] - A[1]);
      const s0 = (A[2] + 12) / Lg,
        s1 = 1 - (B[2] + 12) / Lg;
      const n = DOTS[li].length;
      for (let k = 0; k < n; k++) {
        const f = (((k + u * 2) / n) % 1 + 1) % 1; // ogni pallino avanza di due posti a giro
        const s = lerp(s0, s1, f);
        dot(ctx, lerp(A[0], B[0], s), lerp(A[1], B[1], s), DOT_R * Math.pow(Math.sin(Math.PI * f), 0.6));
      }
    });
  });

  // 3 — "sta scrivendo…": tre puntini che diventano tre nodi, e tornano
  add("scrivendo", "Sta scrivendo", (ctx, u, c) => {
    const m = step(u, 0.5, 0.12) - step(u, 0.86, 0.12);
    const who = [4, 2, 3]; // E, C, D
    ctx.fillStyle = c.fg;
    ctx.strokeStyle = c.fg;
    const P = who.map((i, j) => {
      const lift = u < 0.5 ? Math.sin(Math.PI * clamp((((u * 2) % 0.5) - j * 0.07) / 0.26)) : 0;
      return [lerp((j - 1) * 200, N[i][0], m), lerp(-70 * lift, N[i][1], m), lerp(62, N[i][2], m)];
    });
    [1, 2].forEach((li) => {
      const A = P[0],
        B = li === 1 ? P[1] : P[2];
      DOTS[li].forEach((s) => dot(ctx, lerp(A[0], B[0], s), lerp(A[1], B[1], s), DOT_R * m));
    });
    P.forEach((p) => dot(ctx, p[0], p[1], p[2]));
  });

  // 4 — la rete gira nello spazio
  add("spazio", "Nello spazio", (ctx, u, c) => {
    const Z = [-230, 190, 80, -150, 170, -80];
    const a = TAU * u,
      ca = Math.cos(a),
      sa = Math.sin(a);
    const P = N.map((p, i) => {
      const z = -p[0] * sa + Z[i] * ca;
      const k = 1 + z / 1500;
      return [(p[0] * ca + Z[i] * sa) * k, p[1] * k, p[2] * k];
    });
    net(ctx, c.fg, { pos: (i) => P[i] });
  });

  // 5 — il disco si apre e la rete si inverte; poi si riapre il fondo
  add("inversione", "Inversione", (ctx, u, c) => {
    net(ctx, c.fg);
    const clipTo = (r, fill, ink) => {
      if (r <= 0.5) return;
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.clip();
      ctx.fillStyle = fill;
      ctx.fillRect(-500, -500, 1000, 1000);
      net(ctx, ink);
      ctx.restore();
    };
    clipTo(DISC_R * eio(u / 0.36), c.fg, c.bg);
    clipTo(DISC_R * eio((u - 0.5) / 0.36), c.bg, c.fg);
  });

  // 6 — i nodi saltano uno dopo l'altro, le linee li seguono
  add("salto", "Salto", (ctx, u, c) => {
    const P = N.map((p, i) => [p[0], p[1] - 95 * bump(u, RANK[i] / 6, 0.2), p[2]]);
    net(ctx, c.fg, { pos: (i) => P[i] });
  });

  // 7 — le linee si ingrossano a turno
  add("peso", "Peso", (ctx, u, c) => {
    net(ctx, c.fg, { width: (j) => 11 + 40 * bump(u, j / 5, 0.24) });
  });

  // 8 — solo contorni; i nodi si riempiono a turno
  add("contorno", "Contorno", (ctx, u, c) => {
    ctx.strokeStyle = c.fg;
    SOLID.forEach(([a, b]) => seg(ctx, N[a], N[b], 0, 1, 12));
    N.forEach((p, i) => {
      ctx.fillStyle = c.bg;
      dot(ctx, p[0], p[1], p[2]);
      ctx.strokeStyle = c.fg;
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(p[0], p[1], p[2] - 6, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = c.fg;
      dot(ctx, p[0], p[1], (p[2] - 4) * bump(u, RANK[i] / 6, 0.3));
    });
  });

  // 9 — le linee piene si spezzano in pallini mentre i pallini si fondono in linee
  add("scambio", "Scambio", (ctx, u, c) => {
    const m = 0.5 - 0.5 * Math.cos(TAU * u);
    ctx.strokeStyle = c.fg;
    ctx.lineCap = "round";
    const dashed = (A, B, k) => {
      ctx.lineWidth = lerp(LW, 19, k);
      ctx.setLineDash([lerp(38, 0.1, k), lerp(0.001, 38, k)]);
      ctx.beginPath();
      ctx.moveTo(A[0], A[1]);
      ctx.lineTo(B[0], B[1]);
      ctx.stroke();
    };
    SOLID.forEach(([a, b]) => dashed(N[a], N[b], sm(m)));
    DOTTED.forEach(([a, b]) => dashed(N[a], N[b], sm(1 - m)));
    ctx.setLineDash([]);
    ctx.fillStyle = c.fg;
    N.forEach((p) => dot(ctx, p[0], p[1], p[2]));
  });

  // 10 — la rete si chiude in un punto e si riapre
  add("collasso", "Collasso", (ctx, u, c) => {
    const k = 1 - 0.94 * eio(u < 0.5 ? u * 2 : 2 - u * 2);
    const P = N.map((p) => [p[0] * k, p[1] * k, p[2] * (0.7 + 0.3 * k)]);
    net(ctx, c.fg, { pos: (i) => P[i], dotScale: () => sm(k * 1.4 - 0.4), width: () => LW * (0.5 + 0.5 * k) });
  });

  // 11 — i nodi si scambiano la grandezza: i grandi diventano piccoli e viceversa
  add("taglie", "Taglie", (ctx, u, c) => {
    const swap = [2, 5, 0, 4, 3, 1];
    const m = eio(0.5 - 0.5 * Math.cos(TAU * u));
    const P = N.map((p, i) => [p[0], p[1], lerp(p[2], N[swap[i]][2] * (N[swap[i]][2] > p[2] ? 1.25 : 0.7), m)]);
    net(ctx, c.fg, { pos: (i) => P[i] });
  });

  // 12 — le linee scorrono come un flusso
  add("flusso", "Flusso", (ctx, u, c) => {
    ctx.strokeStyle = c.fg;
    ctx.lineCap = "round";
    ctx.lineWidth = LW;
    ctx.setLineDash([52, 48]);
    ctx.lineDashOffset = -200 * u;
    SOLID.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(N[a][0], N[a][1]);
      ctx.lineTo(N[b][0], N[b][1]);
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
    ctx.fillStyle = c.fg;
    N.forEach((p) => dot(ctx, p[0], p[1], p[2]));
  });

  // 13 — un nodo alla volta prende la scena, con le sue linee
  add("turno", "A turno", (ctx, u, c) => {
    const w = N.map((_, i) => bump(u, RANK[i] / 6, 0.26));
    net(ctx, c.fg, {
      dots: false,
      node: (i) => 0.5 + 0.75 * w[i],
      width: (j) => 7 + 22 * Math.max(w[SOLID[j][0]], w[SOLID[j][1]]),
    });
  });

  // 14 — il nodo centrale cresce fino a diventare il disco, poi torna nodo
  add("nodo", "Dal nodo al disco", (ctx, u, c) => {
    net(ctx, c.fg);
    const m = eio((u - 0.08) / 0.3) - eio((u - 0.62) / 0.3);
    if (m > 0.001) {
      const C = N[2];
      ctx.save();
      ctx.beginPath();
      ctx.arc(lerp(C[0], 0, m), lerp(C[1], 0, m), lerp(C[2], DISC_R, m), 0, TAU);
      ctx.clip();
      ctx.fillStyle = c.fg;
      ctx.fillRect(-500, -500, 1000, 1000);
      net(ctx, c.bg);
      ctx.restore();
    }
  });

  // 15 — le linee si gonfiano fino a diventare pillole che inglobano i nodi
  add("pillole", "Pillole", (ctx, u, c) => {
    net(ctx, c.fg, {
      width: (j) => lerp(LW, 2 * Math.min(N[SOLID[j][0]][2], N[SOLID[j][1]][2]), sm(bump(u, j / 5, 0.34))),
    });
  });

  // 16 — i nodi crescono fino a sovrapporsi: dove si incrociano, si bucano
  add("incroci", "Incroci", (ctx, u, c) => {
    const m = eio(u < 0.5 ? u * 2 : 2 - u * 2);
    ctx.strokeStyle = c.fg;
    SOLID.forEach(([a, b]) => seg(ctx, N[a], N[b], 0, 1, LW * (1 - m)));
    ctx.fillStyle = c.fg;
    ctx.beginPath();
    N.forEach((p, i) => {
      const r = lerp(p[2], 128 + 30 * Math.sin(i * 2.1), m);
      ctx.moveTo(p[0] + r, p[1]);
      ctx.arc(p[0], p[1], r, 0, TAU);
    });
    ctx.fill("evenodd");
  });

  // 17 — i nodi diventano quadrati, a turno, facendo un quarto di giro
  add("quadrati", "Quadrati", (ctx, u, c) => {
    net(ctx, c.fg, { node: () => 0 });
    ctx.fillStyle = c.fg;
    N.forEach((p, i) => {
      const q = sm(bump(u, RANK[i] / 6, 0.3));
      const h = p[2] * (1 + 0.08 * q),
        r = lerp(h, h * 0.16, q);
      ctx.save();
      ctx.translate(p[0], p[1]);
      ctx.rotate((Math.PI / 2) * q);
      ctx.beginPath();
      ctx.moveTo(-h + r, -h);
      ctx.arcTo(h, -h, h, h, r);
      ctx.arcTo(h, h, -h, h, r);
      ctx.arcTo(-h, h, -h, -h, r);
      ctx.arcTo(-h, -h, h, -h, r);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  });

  // 18 — i nodi scorrono lungo le linee e si danno il cambio: ognuno prende il posto del vicino
  add("staffetta", "Staffetta", (ctx, u, c) => {
    const chain = [0, 2, 1, 5, 4]; // A → C → B → F → E → (lungo il tratteggio) → A
    const e = eio((u - 0.08) / 0.62);
    net(ctx, c.fg, { node: () => 0 });
    ctx.fillStyle = c.fg;
    chain.forEach((i, k) => {
      const A = N[i],
        B = N[chain[(k + 1) % chain.length]];
      dot(ctx, lerp(A[0], B[0], e), lerp(A[1], B[1], e), lerp(A[2], B[2], e) * (1 - 0.22 * Math.sin(Math.PI * e)));
    });
    dot(ctx, N[3][0], N[3][1], N[3][2] * (1 + 0.16 * Math.sin(Math.PI * e)));
  });

  // 19 — un nodo viene tirato e poi mollato: la rete vibra come un elastico
  add("elastico", "Elastico", (ctx, u, c) => {
    const pull = (h) => (h < 0.22 ? eio(h / 0.22) : Math.exp(-(h - 0.22) * 8.5) * Math.cos((h - 0.22) * 24));
    const who = u < 0.5 ? 3 : 0,
      k = pull((u * 2) % 1);
    const P = N.map((p, i) => {
      if (i !== who) return p;
      const d = Math.hypot(p[0], p[1]);
      return [p[0] + (p[0] / d) * 78 * k, p[1] + (p[1] / d) * 78 * k, p[2] * (1 + 0.1 * k)];
    });
    net(ctx, c.fg, { pos: (i) => P[i] });
  });

  // 20 — ogni nodo ha un foro che gira: la rete si guarda intorno
  add("sguardo", "Sguardo", (ctx, u, c) => {
    net(ctx, c.fg);
    ctx.fillStyle = c.bg;
    N.forEach((p, i) => {
      const a = TAU * u + RANK[i] * 0.55;
      dot(ctx, p[0] + Math.cos(a) * p[2] * 0.36, p[1] + Math.sin(a) * p[2] * 0.36, p[2] * 0.44);
    });
  });

  // 21 — le linee si staccano, fanno mezzo giro su sé stesse e si riattaccano
  add("sbarre", "Sbarre", (ctx, u, c) => {
    ctx.strokeStyle = c.fg;
    SOLID.forEach(([a, b], j) => {
      const A = N[a],
        B = N[b];
      const r = Math.PI * eio((u - 0.04 - j * 0.13) / 0.32);
      const mx = (A[0] + B[0]) / 2,
        my = (A[1] + B[1]) / 2;
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(r);
      seg(ctx, [A[0] - mx, A[1] - my], [B[0] - mx, B[1] - my], 0, 1, LW + 8 * Math.sin(r));
      ctx.restore();
    });
    net(ctx, c.fg, { solid: () => [0, 0] });
  });

  // 22 — il disco si taglia lungo la linea più lunga e le due metà scorrono una sull'altra
  add("taglio", "Taglio", (ctx, u, c) => {
    const d = [-0.149, 0.989]; // direzione della linea lunga
    const s = 118 * Math.pow(Math.sin(TAU * u), 3);
    const cut = [6.5, -6.5]; // un punto della linea
    for (const side of [1, -1]) {
      ctx.save();
      ctx.scale(0.8, 0.8);
      ctx.translate(d[0] * s * side, d[1] * s * side);
      ctx.beginPath();
      const nx = -d[1] * side,
        ny = d[0] * side; // verso della metà da tenere
      ctx.moveTo(cut[0] - d[0] * 700, cut[1] - d[1] * 700);
      ctx.lineTo(cut[0] + d[0] * 700, cut[1] + d[1] * 700);
      ctx.lineTo(cut[0] + d[0] * 700 + nx * 700, cut[1] + d[1] * 700 + ny * 700);
      ctx.lineTo(cut[0] - d[0] * 700 + nx * 700, cut[1] - d[1] * 700 + ny * 700);
      ctx.closePath();
      ctx.clip();
      disc(ctx, c.fg);
      net(ctx, c.bg);
      ctx.restore();
    }
  });

  // 23 — lungo i tratteggi passa un'onda che gonfia i pallini come perle
  add("perle", "Perle", (ctx, u, c) => {
    net(ctx, c.fg, { dotScale: (li, k, n) => 1 + 2.4 * bump(u, (k / n) * 0.5 + li * 0.11, 0.2) });
  });

  // 24 — la rete si mette in ordine su una griglia, senza perdere i collegamenti, e torna com'era
  add("ordine", "Ordine", (ctx, u, c) => {
    const G = [
      [-250, -140],
      [250, -140],
      [0, -140],
      [250, 140],
      [-250, 140],
      [0, 140],
    ];
    const m = eio((u - 0.05) / 0.26) - eio((u - 0.6) / 0.26);
    const P = N.map((p, i) => [lerp(p[0], G[i][0], m), lerp(p[1], G[i][1], m), lerp(p[2], 46, m)]);
    net(ctx, c.fg, { pos: (i) => P[i] });
  });

  // ---- API ----
  const byId = {};
  L.forEach((l) => (byId[l.id] = l));
  const DEFAULTS = { fg: "#1055AD", bg: "#f1f5f9", period: 2.4 };
  // disegna un fotogramma: u da 0 a 1; il canvas viene ripulito e l'icona centrata
  const drawOn = (ctx, id, u, size, o = {}) => {
    const c = { fg: o.fg || DEFAULTS.fg, bg: o.bg || DEFAULTS.bg };
    const l = byId[id];
    ctx.save();
    ctx.scale((size / 1000) * l.zoom, (size / 1000) * l.zoom);
    l.draw(ctx, ((u % 1) + 1) % 1, c);
    ctx.restore();
    ctx.globalAlpha = 1;
  };
  window.PNLoaders = {
    list: L.map((l) => ({ id: l.id, name: l.name })),
    draw: drawOn,
    defaults: DEFAULTS,
  };
})();
