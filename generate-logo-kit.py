#!/usr/bin/env python3
"""
Build the client logo kit from the live site assets.

Reads public/images/trusted-by/ (mixed PNG and SVG, sized for the page) and
writes public/images/trusted-by/{dark,light}/ as a uniform export set: PNG,
1200x400, transparent, grayscale.

  dark/   light artwork, for dark slides
  light/  dark artwork, for light slides

Sizing is by box rather than fixed height. At a uniform height a 5.9:1
wordmark renders many times wider than a square crest; capping both axes
leaves them optically comparable. Marks that are intrinsically tall get a
taller, narrower box.

Run after adding a logo to trusted-by/:

    python3 generate-logo-kit.py

Requires Pillow and cairosvg.
"""
import io
import os
import re
import sys

try:
    import cairosvg
    from PIL import Image, ImageOps
except ImportError as exc:  # pragma: no cover
    sys.exit(f"missing dependency: {exc}. Install with: pip install pillow cairosvg")

SRC = os.path.join("public", "images", "trusted-by")
OUT = SRC  # dark/ and light/ live alongside the live assets
CANVAS = (1200, 400)
BOX_WIDE = (1000, 260)   # wordmarks
BOX_TALL = (500, 340)    # square-ish crests and stacked marks
TALL = re.compile(r"cerberus|newthingslab", re.I)


def _display_p3_to_hex(match: "re.Match[str]") -> str:
    """cairosvg does not parse CSS Color 4 color(display-p3 r g b)."""
    values = [float(x) for x in match.group(1).split()]
    return "#%02x%02x%02x" % tuple(
        min(255, max(0, round(c * 255))) for c in values[:3]
    )


def load(name: str) -> Image.Image:
    path = os.path.join(SRC, name)
    if name.lower().endswith(".svg"):
        svg = open(path, encoding="utf-8").read()
        svg = re.sub(r"color\(display-p3\s+([\d.\s]+)\)", _display_p3_to_hex, svg)
        png = cairosvg.svg2png(bytestring=svg.encode(), output_width=1600)
        return Image.open(io.BytesIO(png)).convert("RGBA")
    return Image.open(path).convert("RGBA")


def main() -> None:
    if not os.path.isdir(SRC):
        sys.exit(f"no source folder at {SRC}; run from the project root")

    names = sorted(
        f
        for f in os.listdir(SRC)
        if f.lower().endswith((".png", ".svg"))
        and os.path.isfile(os.path.join(SRC, f))
    )
    for variant in ("dark", "light"):
        os.makedirs(os.path.join(OUT, variant), exist_ok=True)

    for name in names:
        image = load(name)
        bbox = image.split()[-1].getbbox()
        if bbox:
            image = image.crop(bbox)
        red, green, blue, alpha = image.split()
        luminance = Image.merge("RGB", (red, green, blue)).convert("L")
        stem = name.rsplit(".", 1)[0]

        for variant in ("dark", "light"):
            layer = luminance if variant == "dark" else ImageOps.invert(luminance)
            art = Image.merge("RGBA", (layer, layer, layer, alpha))

            max_w, max_h = BOX_TALL if TALL.search(name) else BOX_WIDE
            scale = min(max_w / art.width, max_h / art.height)
            art = art.resize(
                (max(1, round(art.width * scale)), max(1, round(art.height * scale))),
                Image.LANCZOS,
            )

            canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
            canvas.paste(
                art,
                ((CANVAS[0] - art.width) // 2, (CANVAS[1] - art.height) // 2),
                art,
            )
            canvas.save(os.path.join(OUT, variant, f"{stem}.png"), optimize=True)

        print(f"  {stem:22} -> {CANVAS[0]}x{CANVAS[1]} dark + light")

    print(f"\n{len(names)} logos x 2 variants written to {OUT}/")


if __name__ == "__main__":
    main()
