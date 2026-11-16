# PoliNetwork — animazione del logo (intro/outro)

Due versioni, 1920×1080 a 60 fps, con suono. I video pronti sono in `video/`.

| Versione | File | Durata | Idea |
|---|---|---|---|
| **Rete** | `video/polinetwork-rete.mp4` | 8 s | Buio. Si accende un punto, poi i collegamenti si propagano a centinaia di nodi mentre la camera arretra e ruota nello spazio. Sei di quei nodi, visti dall'angolo giusto, sono il logo: l'anello si chiude, impatto, nome. |
| **Orbita** | `video/polinetwork-orbita.mp4` | 8,5 s | Cielo blu. I pallini arrivano da lontano uno dopo l'altro, passano vicino alla camera e vanno a disporsi in cerchio; il cerchio di pallini si fonde nell'anello, sei pallini più grandi diventano i nodi. |

Colori, sfondi sfumati con le curve sottili e carattere (Red Hat Text) vengono dal sito; il
fotogramma finale usa i tracciati originali di `Logo.svg`.

## Modificare

Ogni cartella (`rete/`, `orbita/`) è un progetto [HyperFrames](https://hyperframes.heygen.com):
tutto sta in `index.html`. I tempi sono le costanti in cima allo script (`T_LOCK`, `H_ON`, …),
il nome sotto al logo è la variabile `nome`.

```bash
cd rete
npx hyperframes preview
```

```bash
npx hyperframes render --fps 60 --quality high -o ../video/polinetwork-rete.mp4
```

Il suono è sintetizzato da `strumenti/suono.py` (serve numpy); se cambi i tempi nell'animazione,
cambiali anche lì e rigeneralo:

```bash
python3 strumenti/suono.py
```
