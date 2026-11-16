# PoliNetwork — animazione del logo (intro/outro)

1920×1080 a 60 fps, con suono. I video pronti sono in `video/`.

**La più recente è `risposta`; poi `filo`, poi `tuffo`, `sciame`, `nastro` e `ident`**: seguono il brand system del file Figma (pagina "style guidelines").
Fondo chiaro `#f1f5f9`, forme sfumate e looper presi dal Figma, logo esteso originale.
`rete` e `orbita` sono le prime prove, scure, tenute come riferimento.

| Versione | File | Durata | Idea |
|---|---|---|---|
| **Risposta** | `video/polinetwork-risposta.mp4` | 4,8 s | Si parte dentro un fumetto di chat: tre puntini, «sta scrivendo…». Poi la risposta arriva: la camera si allarga, il fumetto diventa il disco del logo, i puntini diventano nodi e si collegano. |
| **Filo** | `video/polinetwork-filo.mp4` | 4,8 s | Il logo arriva secco; la camera entra nella sua linea lunga, che da vicino si apre in un fascio di fili: il looper. Il blu del disco si scioglie nelle forme sfumate e resta il logo esteso. Lo sfondo del brand è il logo visto da dentro. |
| **Tuffo** | `video/polinetwork-tuffo.mp4` | 5,5 s | Il logo si compone in un colpo, la camera prende la rincorsa e ci si tuffa dentro: un tunnel di reti nel blu, fino al logo esteso bianco su fondo blu. |
| **Sciame** | `video/polinetwork-sciame.mp4` | 5,5 s | Centinaia di punti riempiono lo schermo, un vortice li porta al centro e insieme diventano il disco del logo; dentro si accende la rete. |
| **Nastro** | `video/polinetwork-nastro.mp4` | 5,5 s | Su fondo blu un nastro di curve del looper attraversa lo schermo e si avvolge nell'anello; il blu si richiude nel disco e resta il fondo chiaro. |
| **Ident** | `video/polinetwork-ident.mp4` | 5 s | Un nodo blu, poi la rete si costruisce da sola mentre la camera si allarga. Il disco blu si apre e la rete diventa bianca, esce il bordo; il logo rotola a sinistra e il nome esce da dietro. |
| **Rete** | `video/polinetwork-rete.mp4` | 8 s | Buio. Si accende un punto, poi i collegamenti si propagano a centinaia di nodi mentre la camera arretra e ruota nello spazio. Sei di quei nodi, visti dall'angolo giusto, sono il logo: l'anello si chiude, impatto, nome. |
| **Orbita** | `video/polinetwork-orbita.mp4` | 8,5 s | Cielo blu. I pallini arrivano da lontano uno dopo l'altro, passano vicino alla camera e vanno a disporsi in cerchio; il cerchio di pallini si fonde nell'anello, sei pallini più grandi diventano i nodi. |

In tutte il logo finale usa i tracciati originali di `Logo.svg`. Le forme, il looper e il logo esteso
dell'ident stanno in `ident/assets/brand-assets.js`.

## Modificare

Ogni cartella (`risposta/`, `filo/`, `tuffo/`, `sciame/`, `nastro/`, `ident/`, `rete/`, `orbita/`) è un progetto [HyperFrames](https://hyperframes.heygen.com):
l'animazione sta in `assets/scena.js` (in `index.html` per le versioni più vecchie). I tempi sono le costanti in cima allo script (`T_LOCK`, `H_ON`, …),
il nome sotto al logo è la variabile `nome`.

```bash
cd ident
npx hyperframes preview
```

```bash
npx hyperframes render --fps 60 --quality high -o ../video/polinetwork-ident.mp4
```

Il suono è sintetizzato da `strumenti/suono.py` (serve numpy); se cambi i tempi nell'animazione,
cambiali anche lì e rigeneralo:

```bash
python3 strumenti/suono.py
```

## Icone di caricamento

In `loader/`: dieci icone in loop, tutte variazioni sui tre puntini di «sta scrivendo…». I puntini sono
sempre gli stessi; cambia come si comportano: ondeggiano, si collegano con una linea, diventano una
piccola rete, si riempiono di tratteggio.

| File | Cosa contiene |
|---|---|
| `loader/anteprima.html` | la pagina con tutte le icone dal vivo a 96, 48 e 24 px, in tre combinazioni di colore; si apre da sola nel browser |
| `loader/assets/pn-loaders.js` | i disegni delle icone |
| `loader/assets/pn-loaders-start.js` | la funzione che ne avvia una su un `<canvas>` |
| `video/polinetwork-loader.mp4` | la griglia delle 10 icone, ognuna anche a 28 px, tre giri completi |

Per usarne una in una pagina:

```html
<canvas id="c" width="96" height="96"></canvas>
<script src="pn-loaders.js"></script>
<script src="pn-loaders-start.js"></script>
<script>
  PNLoaders.start(document.getElementById("c"), "onda", { fg: "#1055AD", bg: "#f1f5f9" });
</script>
```

Se cambi `pn-loaders.js`, la copia dentro `anteprima.html` va aggiornata a mano: la pagina contiene il codice al suo interno, per poterla aprire da sola.
