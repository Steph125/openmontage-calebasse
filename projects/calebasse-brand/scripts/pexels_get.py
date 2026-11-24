"""Download chosen Pexels photos/videos by id into project asset folders, with attribution."""
import json
import os
import sys
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[3]
from dotenv import load_dotenv  # noqa: E402
load_dotenv(ROOT / ".env")
KEY = os.environ["PEXELS_API_KEY"]
PICKS = {
    "calebasse-fleurs-gamme": [("photo", 14381807, "rose_buds"), ("photo", 8330047, "osmanthus_dried"), ("photo", 33909368, "osmanthus_fresh"), ("photo", 40481390, "jasmine_sambac")],
    "calebasse-ginseng-allee": [("video", 9694808, "smoke_wisps"), ("video", 4320605, "smoke_curls")],
    "calebasse-goji-socle": [("photo", 36721049, "sky"), ("photo", 5861702, "leaf_shadow_stucco"), ("photo", 255527, "hand_palm"), ("photo", 4183756, "goji_scatter")],
    "calebasse-perle-source": [("photo", 31130550, "moss_rock_sea"), ("video", 9667670, "splash_stream"), ("video", 9667674, "splash_arc"), ("video", 33261730, "water_ripples")],
}


def api(url):
    req = urllib.request.Request(url, headers={"Authorization": KEY, "User-Agent": "Mozilla/5.0"})
    return json.loads(urllib.request.urlopen(req, timeout=30).read())


for pid, items in PICKS.items():
    out = ROOT / "projects" / pid / "assets" / "source"
    out.mkdir(parents=True, exist_ok=True)
    credits = []
    for kind, i, name in items:
        if kind == "photo":
            d = api(f"https://api.pexels.com/v1/photos/{i}")
            url, ext = d["src"]["large2x"], "jpg"
            credit = {"file": f"px_{name}.{ext}", "pexels_id": i, "page": d["url"], "author": d["photographer"], "license": "Pexels License (free commercial use)"}
        else:
            d = api(f"https://api.pexels.com/videos/videos/{i}")
            files = sorted([f for f in d["video_files"] if f.get("width") and f.get("file_type") == "video/mp4"], key=lambda f: f["width"] * f["height"])
            best = next((f for f in files if min(f["width"], f["height"]) >= 1080), files[-1])
            url, ext = best["link"], "mp4"
            credit = {"file": f"px_{name}.{ext}", "pexels_id": i, "page": d["url"], "author": d["user"]["name"], "license": "Pexels License (free commercial use)", "size": f"{best['width']}x{best['height']}", "duration": d["duration"]}
        fn = out / credit["file"]
        if not fn.exists():
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            fn.write_bytes(urllib.request.urlopen(req, timeout=120).read())
        credits.append(credit)
        print(pid, credit["file"], fn.stat().st_size // 1024, "KB", credit.get("size", ""))
    (out / "pexels_credits.json").write_text(json.dumps(credits, ensure_ascii=False, indent=1), encoding="utf-8")
