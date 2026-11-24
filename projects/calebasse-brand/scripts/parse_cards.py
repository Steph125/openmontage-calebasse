"""Parse product cards (li.gc) from the saved Calebasse Green Friday page."""
import html
import json
import re
import sys

src, out = sys.argv[1], sys.argv[2]
page = open(src, encoding="utf-8").read()

cards = []
seen = set()
for m in re.finditer(r'<li class="gc[ "][^>]*>(.*?)</li>', page, re.S):
    block = m.group(1)
    title = re.search(r'class="variant-title">(.*?)</div>', block, re.S)
    img = re.search(r'\ssrc="(https://res\.cloudinary\.com/[^"]+)"', block)
    if not title or not img:
        continue
    t = html.unescape(re.sub(r"<[^>]+>", "", title.group(1))).strip()
    if t in seen:
        continue
    seen.add(t)
    disc = re.search(r'variant-discount[^>]*>([^<]+)<', block)
    base = re.search(r'variant-price-base[^>]*>([^<]+)<', block)
    now = re.search(r'variant-price-discount[^>]*>([^<]+)<', block)
    href = re.search(r'href="(/produits/[^"]+)"', block)
    cards.append({
        "title": t,
        "discount": disc.group(1).strip() if disc else None,
        "price_before": base.group(1).strip() if base else None,
        "price_now": now.group(1).strip() if now else None,
        "image": html.unescape(img.group(1)),
        "href": html.unescape(href.group(1)) if href else None,
    })

# Second pass: every other product title on the page, paired with the closest
# preceding Cloudinary image (accordion "fa" cards use a different layout).
for m in re.finditer(r'class="[^"]*(?:variant-title|fa__name|fa-t)[^"]*">(.*?)</', page, re.S):
    t = html.unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip()
    if not t or t in seen:
        continue
    before = page[max(0, m.start() - 20000):m.start()]
    imgs = re.findall(r'\ssrc="(https://res\.cloudinary\.com/[^"]+)"', before)
    if not imgs:
        continue
    after = page[m.end():m.end() + 6000]
    disc = re.search(r'variant-discount[^>]*>([^<]+)<', before[-6000:])
    base = re.search(r'variant-price-base[^>]*>([^<]+)<', after)
    now = re.search(r'variant-price-discount[^>]*>([^<]+)<', after)
    seen.add(t)
    cards.append({
        "title": t,
        "discount": disc.group(1).strip() if disc else None,
        "price_before": base.group(1).strip() if base else None,
        "price_now": now.group(1).strip() if now else None,
        "image": html.unescape(imgs[-1]),
        "href": None,
    })

json.dump(cards, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(cards), "cards")
for i, c in enumerate(cards):
    print(i, "|", c["title"][:60], "|", c["discount"], "|", c["price_before"], "->", c["price_now"])
