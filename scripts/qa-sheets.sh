#!/bin/sh
# QA: 4 frames per second from the render, tiled into contact sheets (out/qa/sheet-NN.png)
set -e
cd "$(dirname "$0")/.."
VIDEO="${1:-out/focus-video.mp4}"
mkdir -p out/qa && rm -f out/qa/*.jpg out/qa/sheet-*.png
npx remotion ffmpeg -hide_banner -loglevel error -i "$VIDEO" -r 4 -s 480x270 -q:v 4 out/qa/f%04d.jpg
QA_FPS=4 python3 scripts/sheet.py out/qa/sheet- 8 6 out/qa/f*.jpg
