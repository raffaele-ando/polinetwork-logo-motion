# PoliNetwork — animazione del logo (intro/outro)

1920×1080 a 60 fps, con suono. I video pronti sono in `video/`.

**La versione attuale è `ident`**: segue il brand system del file Figma (pagina "style guidelines").
Fondo chiaro `#f1f5f9`, forme sfumate e looper presi dal Figma, logo esteso originale.
`rete` e `orbita` sono le prime prove, scure, tenute come riferimento.

| Versione | File | Durata | Idea |
|---|---|---|---|
| **Ident** | `video/polinetwork-ident.mp4` | 5 s | Un nodo blu, poi la rete si costruisce da sola mentre la camera si allarga. Il disco blu si apre e la rete diventa bianca, esce il bordo; il logo rotola a sinistra e il nome esce da dietro. |
| **Rete** | `video/polinetwork-rete.mp4` | 8 s | Buio. Si accende un punto, poi i collegamenti si propagano a centinaia di nodi mentre la camera arretra e ruota nello spazio. Sei di quei nodi, visti dall'angolo giusto, sono il logo: l'anello si chiude, impatto, nome. |
| **Orbita** | `video/polinetwork-orbita.mp4` | 8,5 s | Cielo blu. I pallini arrivano da lontano uno dopo l'altro, passano vicino alla camera e vanno a disporsi in cerchio; il cerchio di pallini si fonde nell'anello, sei pallini più grandi diventano i nodi. |

In tutte il logo finale usa i tracciati originali di `Logo.svg`. Le forme, il looper e il logo esteso
dell'ident stanno in `ident/assets/brand-assets.js`.

## Modificare

Ogni cartella (`ident/`, `rete/`, `orbita/`) è un progetto [HyperFrames](https://hyperframes.heygen.com):
tutto sta in `index.html`. I tempi sono le costanti in cima allo script (`T_LOCK`, `H_ON`, …),
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
