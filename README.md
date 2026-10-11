# Focus video: "The Best Crypto Trading AI Might Just Be the Luckiest"

Video motion-graphics di ~2 minuti (1920×1080, 30 fps) che presenta la ricerca del Learn Article TKS Focus.
Fatto con Remotion (React + TypeScript). Ogni numero sullo schermo viene dall'articolo.

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
  Motion blur (`@remotion/motion-blur`) solo quando la camera si muove; i whip pan cadono sul beat (100 bpm = 18 frame).
- **Impatti**: hit-stop di 3-6 frame con recupero accelerato, screen shake e aberrazione cromatica (`IMPACTS` in `src/timing.ts`).
- **Simulazione vera**: `src/sim/curves.ts` rifà la simulazione dell'articolo (strategie di puro rumore, 730 giorni, √365).
  Con il seed scelto da `scripts/find-seed.ts`: migliore su 1.000 = 2.30, su 10 = 1.09, anno mai visto ≈ 0 (−0.02).
  Le 1.000 curve sono disegnate su Canvas2D.
- **Fisica**: corona e monete-commissione pre-simulate con matter-js (`src/sim/physics.ts`), deterministiche.
- **Morph**: `flubber` (Lucky che si sgonfia, monete che diventano lapidi), `@remotion/paths` per le annotazioni disegnate a mano,
  `@remotion/noise` per i movimenti organici, `@remotion/transitions` per la transizione custom nella moneta finale.
- **Moneta 3D**: in CSS 3D (dischi impilati per lo spessore), per restare nello stile piatto con contorni a inchiostro.
- **Audio**: tutto generato con numpy (`scripts/gen_sfx.py`): whoosh, impatti, riser, clink FM, scratch, sgonfiamento,
  leva e rulli, vapore e un beat a 100 bpm a −24 dB che si abbassa sotto la voce.

## QA

- `npm run stills -- 12.5 47 80.8` salva fotogrammi in `out/stills/`; `python3 scripts/sheet.py` li affianca in contact sheet.
- `npx tsx scripts/cues.ts` stampa il tempo di ogni anchor.

## Extra

- Versione verticale 1080×1920: `npm run render:vertical` → `out/focus-video-vertical.mp4`.
- Il render usa Google Chrome installato sul Mac (`remotion.config.ts`), senza scaricare altro.
