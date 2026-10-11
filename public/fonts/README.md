# Fonts

Self-hosted so that renders never depend on fonts.googleapis.com (offline, proxies, cloud containers).
All under the SIL Open Font License 1.1.

- Anton (DISPLAY): giant condensed capitals, the words that hit
- Playfair Display Italic 500/700 (SCRIPT): the italic serif voice around them
- Inter 500/700/800 (SANS): labels, captions, sources
- JetBrains Mono 700/800 (MONO): code and small data

Loaded in `src/theme.ts` with the FontFace API and `delayRender`.
