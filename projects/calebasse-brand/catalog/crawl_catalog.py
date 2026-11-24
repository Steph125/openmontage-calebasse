"""Build a structured Calebasse product catalog from the public product pages.

For every /produits/ URL in the sitemap: JSON-LD Product (name, description, gallery images,
SKU, offers, rating), breadcrumb categories, and the page's `ingredients` data (title, latin
name, part used, ingredient image). Raw HTML is not stored. Polite: 3 workers + small delay.

Usage: python crawl_catalog.py <sitemap.xml> <out.json>
"""
import concurrent.futures as cf
import json
import re
import sys
import time
from pathlib import Path

import requests

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
LD_RE = re.compile(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', re.S)


def bracket_array(s: str, start: int) -> str | None:
    """Return the JSON array text starting at s[start] == '['."""
    depth, i, in_str, esc = 0, start, False, False
    while i < len(s):
        c = s[i]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
        else:
            if c == '"':
                in_str = True
            elif c == "[":
                depth += 1
            elif c == "]":
                depth -= 1
                if depth == 0:
                    return s[start : i + 1]
        i += 1
    return None


def flight_field(t: str, key: str):
    """Find `"key":[...]` inside the Next.js flight payload (escaped quotes) and parse it."""
    k = f'{key}\\":['
    i = t.find(k)
    if i < 0:
        return None
    raw = t[i + len(k) - 1 : i + len(k) - 1 + 200000].replace('\\\\"', "\u0001").replace('\\"', '"').replace("\u0001", '\\"')
    arr = bracket_array(raw, 0)
    if not arr:
        return None
    try:
        return json.loads(arr)
    except Exception:
        return None


def flight_str(t: str, key: str):
    m = re.search(rf'{key}\\":\\"(.*?)\\"', t)
    return m.group(1) if m else None


def parse(url: str, t: str) -> dict:
    prod, crumbs = None, []
    for m in LD_RE.finditer(t):
        try:
            d = json.loads(m.group(1))
        except Exception:
            continue
        for x in d if isinstance(d, list) else [d]:
            if not isinstance(x, dict):
                continue
            if x.get("@type") in ("Product", "ProductGroup") and prod is None:
                prod = x
            if x.get("@type") == "BreadcrumbList":
                crumbs = [e.get("name") for e in x.get("itemListElement", []) if isinstance(e, dict)]
    ing = flight_field(t, "ingredients") or []
    ingredients = [
        {"title": g.get("title"), "latin": g.get("subtitle"), "part": g.get("part"), "image": (g.get("image") or {}).get("url")}
        for g in ing if isinstance(g, dict)
    ]
    offers = []
    if prod:
        for o in prod.get("offers") or []:
            if isinstance(o, dict):
                offers.append({"sku": o.get("sku"), "price": o.get("price"), "availability": (o.get("availability") or "").split("/")[-1]})
    return {
        "url": url,
        "id": url.rsplit("-", 1)[-1],
        "name": prod.get("name") if prod else None,
        "description": prod.get("description") if prod else None,
        "images": prod.get("image") if prod else [],
        "sku": prod.get("sku") if prod else None,
        "offers": offers,
        "rating": (prod.get("aggregateRating") or {}) if prod else {},
        "breadcrumb": crumbs,
        "latin": flight_str(t, "latinTitle"),
        "ingredients": ingredients,
    }


def fetch(url: str, sess: requests.Session) -> dict:
    for attempt in range(3):
        try:
            r = sess.get(url, timeout=30)
            if r.status_code == 200:
                return parse(url, r.text)
            if r.status_code in (404, 410):
                return {"url": url, "error": r.status_code}
        except requests.RequestException as e:
            err = str(e)
        time.sleep(2 + attempt * 3)
    return {"url": url, "error": "failed"}


def main():
    sitemap, out = Path(sys.argv[1]), Path(sys.argv[2])
    urls = sorted(set(re.findall(r"<loc>(https://calebasse\.com/produits/[^<]+)</loc>", sitemap.read_text(encoding="utf-8"))))
    sess = requests.Session()
    sess.headers["User-Agent"] = UA
    results = []

    def job(u):
        time.sleep(0.25)
        return fetch(u, sess)

    with cf.ThreadPoolExecutor(max_workers=3) as ex:
        for i, res in enumerate(ex.map(job, urls), 1):
            results.append(res)
            if i % 100 == 0:
                print(i, "/", len(urls), flush=True)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"source": "https://calebasse.com/sitemap.xml", "count": len(results), "products": results}, ensure_ascii=False, indent=1), encoding="utf-8")
    ok = sum(1 for r in results if r.get("name"))
    print("done", len(results), "parsed", ok, "with ingredients", sum(1 for r in results if r.get("ingredients")))


if __name__ == "__main__":
    main()
