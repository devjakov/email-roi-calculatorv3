# Client logo kit

Ready-to-paste client logos for decks and docs (Gamma, Slides, Notion).

Every file is the **same format and the same canvas**: PNG, 1200 x 400,
transparent background, grayscale. Drop any of them into a slide and they will
sit at a consistent size without further cropping or scaling.

| Folder   | Artwork | Use on |
|----------|---------|--------|
| `dark/`  | Light / white | Dark slides |
| `light/` | Dark / black  | Light slides |

The logo is centred with padding, and sized by a box rather than a fixed
height, so a wide wordmark and a square crest end up optically comparable
rather than one dwarfing the other.

## Regenerating

Sources live one level up in `../trusted-by/`. That folder holds the live site
assets (mixed PNG and SVG, sized for the page); this folder holds the export
set. After adding a logo to `../trusted-by/`, re-run the kit generator so both
variants pick it up.
