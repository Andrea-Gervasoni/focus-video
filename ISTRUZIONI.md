# Focus video: come continuare su git / nel cloud

Questo zip contiene tutto il progetto senza le parti che si rigenerano da sole:
`node_modules/` (npm install), `.venv/` (si crea con `npm run retime`), `out/` (render).

## 1. Mettere il progetto su GitHub (repository privato)

```bash
cd focus-video
git init
git add .
git commit -m "Focus video v2"
gh repo create focus-video --private --source=. --push
```

Senza `gh`: crea un repository privato vuoto su github.com e poi
`git remote add origin https://github.com/<tuo-utente>/focus-video.git` e `git push -u origin main`.

## 2. Prima di lavorare (locale o cloud)

```bash
npm install
npx tsc --noEmit -p .
```

Node 20+ e Python 3 con numpy. Il render usa Google Chrome se c'è (`remotion.config.ts`),
altrimenti Remotion scarica il suo browser (serve accesso a remotion.media).

## 3. Cosa resta da fare (da dare alla sessione cloud)

Copia questo nella sessione:

> Progetto Remotion in questa repo (leggi README.md e ISTRUZIONI.md). Il brief completo è nella conversazione precedente.
> Stato: il secondo render completo è stato rivisto; dopo ho già applicato nel codice altre correzioni (contenuti presenti
> quando arriva la camera, folla di case prima della gara a barre, camera che entra nella moneta congelata, etichette che
> non si sovrappongono). Da fare:
> 1. `npm install`, poi `npm run render`, poi `./scripts/qa-sheets.sh` (4 fotogrammi al secondo in out/qa/).
> 2. Rivedere i contact sheet contro il brief (zone vuote, testo illeggibile, momenti piatti), correggere, rifare il render.
> 3. Se c'è `public/voiceover.m4a`: `npm run retime` e poi `npm run render`.
> 4. Facoltativo: `npm run render:vertical`.
> Mai inventare numeri: ogni cifra deve venire dall'articolo.

## 4. La voce

Registra il copione inglese (campo `voText` di ogni scena in `src/script.ts`), salvalo come
`public/voiceover.m4a`, poi:

```bash
npm run retime
npm run render
```

`npm run retime -- --reset` torna ai tempi stimati (anteprima muta).
