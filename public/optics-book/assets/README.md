# Local asset provenance

- This production runtime and its local assets were copied from `design-previews/calcite-book/`. The source preview remains a standalone reference. Production additions are the gallery return link and bounded initial chapter selection; the seven lessons, artwork, physics, and interactions are preserved.
- `three.min.js` and `LICENSE`: copied from this workspace's installed `three` package, version 0.160.1. MIT license; no edits.
- `book-serif.woff2`: subset of local `/home/cjy/.local/share/fonts/NotoSerifCJK-Regular.ttc`, Simplified Chinese face (index 2). Subset generated using fonttools from the preview's HTML and JavaScript text. Noto Serif CJK, SIL Open Font License 1.1; original license in `FONT-LICENSE.txt`, obtained from https://github.com/notofonts/noto-cjk/blob/main/Serif/LICENSE.
- Paper, cloth, cover, wood, and all diagrams are generated in `book.js`. No third-party raster images are shipped. Screenshots are local browser captures of this preview.
- `../cover.webp`: cropped from `design-previews/calcite-book/screenshots/cover.png`, a 1440 x 1000 local browser capture. Crop rectangle: left 210, top 130, right 1170, bottom 850; resized from 960 x 720 to 800 x 600. The gallery uses this static image without starting WebGL.
- Visual reference: https://iamtechartist.github.io/every-joule-lesson1/. Its brand, course text, bundled application code, and images are not included.
