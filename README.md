# Focus video: "The Best Crypto Trading AI Might Just Be the Luckiest"

Video motion-graphics di ~2:11 (1920×1080, 30 fps): ~2:04 di storia + 7 s di fonti. Presenta la ricerca del
Learn Article TKS Focus. Fatto con Remotion (React + TypeScript). Ogni numero sullo schermo viene dall'articolo,
e ogni affermazione porta la sua fonte.

## I 3 comandi

```bash
npm run preview    # anteprima interattiva nel browser (Remotion Studio)
npm run retime     # allinea scene e animazioni alla tua voce: public/voiceover.m4a (o .mp3 / .wav)
npm run render     # esporta out/focus-video.mp4 (con la tua voce, se hai fatto retime)
```

## Come aggiungere la tua voce

1. Registra il copione in inglese, parola per parola (è in `src/script.ts`, campo `voText` di ogni scena).
2. Mettilo in `public/voiceover.m4a`.
3. `npm run retime`: normalizza il volume, trascrive con faster-whisper (la prima volta crea `.venv` e scarica il modello),
   allinea ogni parola al copione e riscrive i tempi di scene, parole e anchor in `src/script.ts`.
   Ogni evento importante è agganciato a una parola (`{word: "about zero.", event: "collapse"}`), quindi resta a tempo.
4. `npm run render`.

Per tornare all'anteprima muta con i tempi stimati: `npm run retime -- --reset` (e togli `public/voiceover.*`).

## Come è fatto

- **Un solo canvas**: tutte le scene sono "pagine" di un quaderno enorme (`src/camera.ts`, `STATIONS`). Una camera virtuale
  fa whip pan, zoom dentro gli oggetti (la moneta che diventa la griglia di 1.024) e il pull-back finale sulla mappa.
  L'apertura (`src/stations/S1Hook.tsx`) fa il suo push-in e pull-back dentro la stazione.
  Motion blur (`@remotion/motion-blur`) solo quando la camera si muove; i whip pan cadono sul beat (100 bpm = 18 frame).
- **Impatti**: hit-stop di 3-6 frame con recupero accelerato e screen shake (`IMPACTS` in `src/timing.ts`).
- **Simulazione vera**: `src/sim/curves.ts` rifà la simulazione dell'articolo (strategie di puro rumore, 730 giorni, √365).
  Con il seed scelto da `scripts/find-seed.ts`: migliore su 1.000 = 2.30, su 10 = 1.09, anno mai visto ≈ 0 (−0.02).
  Le 1.000 curve sono disegnate su Canvas2D, nell'apertura e nella scena dell'esperimento.
- **Fisica**: corona e monete-commissione pre-simulate con matter-js (`src/sim/physics.ts`), deterministiche.
- **Morph**: `flubber` (Lucky che si sgonfia, monete che diventano lapidi), `@remotion/paths` per le annotazioni disegnate a mano,
  `@remotion/noise` per i movimenti organici, `@remotion/transitions` per la transizione custom nella moneta finale e per
  il foglio delle fonti che scorre sopra la end card.
- **Moneta 3D**: in CSS 3D (dischi impilati per lo spessore), per restare nello stile piatto con contorni a inchiostro;
  è la moneta lanciata da Lucky alla fine, ferma in aria.
- **Audio**: tutto generato con numpy (`scripts/gen_sfx.py`): whoosh, impatti, riser, clink FM, scratch, sgonfiamento,
  leva e rulli, vapore e un beat a 100 bpm a −24 dB che si abbassa sotto la voce.

## Identità visiva: "editorial pop"

Una rivista elegante con illustrazioni pop: carta avorio, inchiostro, tre accenti (blu, arancio, oro), la mascotte
Lucky e animazioni con molle, fisica e whip pan; sopra, una tipografia editoriale sobria.

- **Tipografia** (`src/theme.ts`, font in `public/fonts`, tutti OFL): `SERIF` (Instrument Serif, tondo e corsivo) per
  titoli e frasi chiave; `HEAD` (Bricolage Grotesque) per etichette, schede e didascalie; `MONO` (JetBrains Mono) per
  numeri, codice e fonti. Il corsivo colorato evidenzia la parola che conta (*AI*, *human?*, *Luckiest*, *risk*).
- **Apertura**: una copertina con cornice a filetto doppio. La domanda arriva in serif; la curva dorata (il vincitore
  vero della simulazione) sale mentre Lucky la cavalca, "Yes." diventa "Yes?", e su "changed my mind" c'è un fermo
  immagine. La camera si allarga sulle 1.000 curve di puro rumore: il migliore era solo il più fortunato.
- **Capitoli**: in alto a sinistra numero romano + titolo del capitolo, con un filetto che si riempie d'oro
  lungo la storia; nella vista a mappa ogni stazione mostra il suo capitolo (`src/world/World.tsx`).
- **Fonti**: sempre nello stesso punto, in basso a sinistra sotto le didascalie, con etichetta `SOURCE`, `METHOD` o `MATH`;
  il video chiude con lo slate `SOURCES` con le otto fonti dell'articolo e a cosa sono servite. Tutto in
  `src/overlay/Sources.tsx` (`NOTES` per le note, `REFERENCES` per lo slate). La durata dello slate è `OUTRO_SECONDS`
  in `src/script.ts` e non viene toccata da `npm run retime`.
- **Niente rumore**: nessun dato finto (via il ticker con percentuali inventate), niente decorazioni che non c'entrano;
  tra le stazioni resta solo il tratteggio del percorso della storia.
- **Didascalie**: divise per frase e per inciso, righe bilanciate, mai una parola da sola se non è una pausa voluta.

## QA

- `npm run stills -- 12.5 47 80.8` salva fotogrammi in `out/stills/`; `python3 scripts/sheet.py` li affianca in contact sheet.
- `npx tsx scripts/cues.ts` stampa il tempo di ogni anchor.

## Extra

- Versione verticale 1080×1920: `npm run render:vertical` → `out/focus-video-vertical.mp4`.
- Il render usa Google Chrome installato sul Mac oppure, in un container Linux/cloud, la headless shell di Playwright
  (`remotion.config.ts`, `scripts/browser.mjs`); `REMOTION_CHROME=/percorso/chrome` per sceglierne un altro.
- Render veloce di controllo: `npx remotion render FocusVideo out/qa-half.mp4 --scale=0.5` e poi
  `./scripts/qa-sheets.sh out/qa-half.mp4`.
