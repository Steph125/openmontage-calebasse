"""OneDrive turns synced files into reparse points that Remotion's public-dir server does not list (404).
Copy the project's public/ into a plain local temp folder before rendering."""
import os
import shutil
from pathlib import Path


def local_public(src: Path, name: str) -> Path:
    dst = Path(os.environ.get("TEMP", "/tmp")) / f"{name}_public"
    if dst.exists():
        shutil.rmtree(dst)
    for f in src.rglob("*"):
        if f.is_file():
            out = dst / f.relative_to(src)
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_bytes(f.read_bytes())
    return dst
