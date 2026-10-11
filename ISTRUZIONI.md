# Focus video: come continuare su git / nel cloud

Questo repository contiene tutto il progetto senza le parti che si rigenerano da sole:
`node_modules/` (npm install), `.venv/` (si crea con `npm run retime`), `out/` (render).

## 1. GitHub

Fatto: il progetto (prima era `focus-video-progetto.zip`) è estratto nella radice di questo repository.
Si lavora su un branch e si apre una pull request verso `main`.

## 2. Prima di lavorare (locale o cloud)

```bash
npm install
npx tsc --noEmit -p .
```

Node 20+ e Python 3 con numpy. Il render usa Google Chrome se c'è, oppure la headless shell di Playwright nei
container Linux (`remotion.config.ts`); altrimenti Remotion scarica il suo browser (serve accesso a remotion.media).
I font sono già in `public/fonts`, quindi non serve accesso a Google Fonts.

## 3. Stato

Fatto (sessione cloud dell'11 ottobre 2026):
- progetto estratto dallo zip nella radice del repository; font self-hosted; render funzionante anche su Linux;
- due giri di render completo + contact sheet a 4 fps, con correzioni di testi tagliati, zone vuote e momenti piatti;
- identità sartoriale con gli stessi colori: collage tipografico (Anton + Playfair Display Italic + Inter), filetti
  sottili al posto dei contorni spessi, Lucky più elegante; nuova apertura a copertina di rivista; tolti ticker con
  numeri finti e decorazioni superflue;
- fonti sullo schermo per ogni affermazione e slate finale `SOURCES`; capitoli con numeri romani in alto e sulla mappa;
- didascalie senza parole orfane; render finale in `out/focus-video.mp4` (copia compressa in `video/`).

Resta da fare solo la voce (sezione 4). Dopo `npm run retime` conviene rifare un controllo:
`npm run render` e `./scripts/qa-sheets.sh` (4 fotogrammi al secondo in `out/qa/`). Mai inventare numeri: ogni cifra
deve venire dall'articolo.

## 4. La voce

Registra il copione inglese (campo `voText` di ogni scena in `src/script.ts`), salvalo come
`public/voiceover.m4a`, poi:

```bash
npm run retime
npm run render
```

`npm run retime -- --reset` torna ai tempi stimati (anteprima muta).
