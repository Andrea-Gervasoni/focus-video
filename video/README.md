# Render finali

- `focus-video.mp4` — 1920×1080, 30 fps, 2:11, H.264 CRF 22 (copia compressa del render `npm run render`).
- `focus-video-vertical.mp4` — 1080×1920 per Instagram (`npm run render:vertical`), quando presente.

Anteprima muta: le didascalie seguono i tempi stimati. Dopo aver registrato `public/voiceover.m4a`:
`npm run retime`, `npm run render`, poi sostituire questi file con le nuove copie compresse
(`ffmpeg -i out/focus-video.mp4 -c:v libx264 -crf 22 -maxrate 2.6M -bufsize 5.2M -c:a aac -b:a 128k -movflags +faststart video/focus-video.mp4`).
