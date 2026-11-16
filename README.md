# PoliNetwork — animazione del logo (intro/outro)

1920×1080 a 60 fps, con suono. I video pronti sono in `video/`.

**Le versioni attuali sono `tuffo`, `sciame`, `nastro` e `ident`**: seguono il brand system del file Figma (pagina "style guidelines").
Fondo chiaro `#f1f5f9`, forme sfumate e looper presi dal Figma, logo esteso originale.
`rete` e `orbita` sono le prime prove, scure, tenute come riferimento.

| Versione | File | Durata | Idea |
|---|---|---|---|
| **Tuffo** | `video/polinetwork-tuffo.mp4` | 5,5 s | Il logo si compone in un colpo, la camera prende la rincorsa e ci si tuffa dentro: un tunnel di reti nel blu, fino al logo esteso bianco su fondo blu. |
| **Sciame** | `video/polinetwork-sciame.mp4` | 5,5 s | Centinaia di punti riempiono lo schermo, un vortice li porta al centro e insieme diventano il disco del logo; dentro si accende la rete. |
| **Nastro** | `video/polinetwork-nastro.mp4` | 5,5 s | Su fondo blu un nastro di curve del looper attraversa lo schermo e si avvolge nell'anello; il blu si richiude nel disco e resta il fondo chiaro. |
| **Ident** | `video/polinetwork-ident.mp4` | 5 s | Un nodo blu, poi la rete si costruisce da sola mentre la camera si allarga. Il disco blu si apre e la rete diventa bianca, esce il bordo; il logo rotola a sinistra e il nome esce da dietro. |
| **Rete** | `video/polinetwork-rete.mp4` | 8 s | Buio. Si accende un punto, poi i collegamenti si propagano a centinaia di nodi mentre la camera arretra e ruota nello spazio. Sei di quei nodi, visti dall'angolo giusto, sono il logo: l'anello si chiude, impatto, nome. |
| **Orbita** | `video/polinetwork-orbita.mp4` | 8,5 s | Cielo blu. I pallini arrivano da lontano uno dopo l'altro, passano vicino alla camera e vanno a disporsi in cerchio; il cerchio di pallini si fonde nell'anello, sei pallini più grandi diventano i nodi. |

In tutte il logo finale usa i tracciati originali di `Logo.svg`. Le forme, il looper e il logo esteso
dell'ident stanno in `ident/assets/brand-assets.js`.

## Modificare

Ogni cartella (`tuffo/`, `sciame/`, `nastro/`, `ident/`, `rete/`, `orbita/`) è un progetto [HyperFrames](https://hyperframes.heygen.com):
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
