"""Scout Pexels photos/videos for decor elements; writes a contact sheet per query (thumbnails only)."""
import json
import os
import sys
import urllib.request
import urllib.parse
from pathlib import Path
from PIL import Image, ImageDraw

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
from dotenv import load_dotenv  # noqa: E402
load_dotenv(ROOT / ".env")
KEY = os.environ.get("PEXELS_API_KEY")
OUT = Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
QUERIES = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8")) if Path(sys.argv[2]).exists() else json.loads(sys.argv[2])


def get(url):
    req = urllib.request.Request(url, headers={"Authorization": KEY, "User-Agent": "Mozilla/5.0"})
    return json.loads(urllib.request.urlopen(req, timeout=30).read())


results = {}
for q in QUERIES:
    kind, term, orient = q["kind"], q["q"], q.get("orientation", "")
    if kind == "photo":
        d = get(f"https://api.pexels.com/v1/search?query={urllib.parse.quote(term)}&per_page=12{'&orientation=' + orient if orient else ''}")
        items = [{"id": p["id"], "thumb": p["src"]["medium"], "full": p["src"]["original"], "w": p["width"], "h": p["height"], "by": p["photographer"], "url": p["url"]} for p in d.get("photos", [])]
    else:
        d = get(f"https://api.pexels.com/videos/search?query={urllib.parse.quote(term)}&per_page=12{'&orientation=' + orient if orient else ''}")
        items = []
        for v in d.get("videos", []):
            files = sorted([f for f in v["video_files"] if f.get("width")], key=lambda f: f["width"])
            best = next((f for f in files if f["width"] >= 1080), files[-1] if files else None)
            items.append({"id": v["id"], "thumb": v["image"], "full": best["link"] if best else None, "w": v["width"], "h": v["height"], "dur": v["duration"], "by": v["user"]["name"], "url": v["url"]})
    results[term] = items
    T = 220; cols = 6; rows = (len(items) + cols - 1) // cols
    sh = Image.new("RGB", (cols * T, max(1, rows) * (T + 16)), "white"); dr = ImageDraw.Draw(sh)
    for n, it in enumerate(items):
        try:
            req = urllib.request.Request(it["thumb"], headers={"User-Agent": "Mozilla/5.0"})
            from io import BytesIO
            im = Image.open(BytesIO(urllib.request.urlopen(req, timeout=30).read())).convert("RGB"); im.thumbnail((T, T))
        except Exception:
            continue
        x, y = (n % cols) * T, (n // cols) * (T + 16)
        sh.paste(im, (x + (T - im.width) // 2, y + 16)); dr.text((x + 3, y + 2), f"{n}:{it['id']}" + (f" {it.get('dur')}s" if kind == "video" else ""), fill="black")
    safe = "".join(c if c.isalnum() else "_" for c in term)[:40]
    sh.save(OUT / f"{kind}_{safe}.jpg", quality=80)
    print(kind, term, len(items))
(OUT / "results.json").write_text(json.dumps(results, ensure_ascii=False, indent=1), encoding="utf-8")
