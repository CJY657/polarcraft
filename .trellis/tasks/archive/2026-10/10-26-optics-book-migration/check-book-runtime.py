"""Run the preview's full interaction checks against the shipped book runtime.

Run from the repository root with the built app preview listening on port 4178.
"""
import os
from pathlib import Path

source_path = Path("design-previews/calcite-book/check-preview.py")
output_dir = Path(__file__).resolve().parent / "evidence/runtime"
(output_dir / "screenshots").mkdir(parents=True, exist_ok=True)
os.environ.setdefault("PREVIEW_URL", "http://127.0.0.1:4178/optics-book/index.html")
source = source_path.read_text().replace(
    "ROOT = Path(__file__).resolve().parent",
    f"ROOT = Path({str(output_dir)!r})",
    1,
)
exec(compile(source, str(source_path), "exec"), {"__file__": str(source_path)})
