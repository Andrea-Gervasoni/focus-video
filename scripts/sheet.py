"""Tile PNG/JPG frames into contact sheets: python3 scripts/sheet.py <out-prefix> <cols> <rows> files..."""
import os
import sys
from PIL import Image, ImageDraw

prefix, cols, rows = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
files = sys.argv[4:]
W, H = 480, 270
per = cols * rows
for p in range(0, len(files), per):
    sheet = Image.new("RGB", (cols * W, rows * H), "black")
    d = ImageDraw.Draw(sheet)
    for i, fn in enumerate(files[p:p + per]):
        im = Image.open(fn).convert("RGB").resize((W, H))
        x, y = (i % cols) * W, (i // cols) * H
        sheet.paste(im, (x, y))
        label = fn.split("/")[-1].rsplit(".", 1)[0]
        if os.environ.get("QA_FPS") and label[1:].isdigit():
            label = f"{(int(label[1:]) - 1) / float(os.environ['QA_FPS']):.2f}s"
        d.rectangle([x, y, x + 8 + 7 * len(label), y + 16], fill="black")
        d.text((x + 4, y + 2), label, fill="white")
    sheet.save(f"{prefix}{p // per + 1:02d}.png")
    print(f"{prefix}{p // per + 1:02d}.png")
