# Trusted-by logos

## `dark/` and `light/` — for decks

Ready-to-paste client logos for Gamma, Slides, Notion and anything else.

Every file is the **same format and the same canvas**: PNG, 1200 x 400,
transparent background, grayscale. Drop any of them into a slide and they sit
at a consistent size without further cropping or scaling.

| Folder   | Artwork | Use on |
|----------|---------|--------|
| `dark/`  | Light / white | Dark slides |
| `light/` | Dark / black  | Light slides |

Also served over HTTP, so you can add by URL instead of downloading:

```
https://www.marscopywriting.co/images/trusted-by/dark/patched.png
https://www.marscopywriting.co/images/trusted-by/light/patched.png
```

The logo is centred with padding, and sized by a box rather than a fixed
height, so a wide wordmark and a square crest end up optically comparable
rather than one dwarfing the other.

## The loose files — for the website

The PNGs and SVGs sitting directly in this folder are the live assets for the
homepage strip, at page sizes and in whatever format each brand ships. The
site manifest only ever lists these; it does not look inside `dark/` or
`light/`.

## Regenerating

After adding a logo to this folder, rebuild both variants:

```bash
python3 generate-logo-kit.py
```
