import json, re, sys, io
from pathlib import Path

ROOT = Path(__file__).parent
DOMAIN = "https://discoverhighworth.com"
EXPECTED = {
    "index.html": DOMAIN + "/",
    "visit/attractions.html": DOMAIN + "/visit/attractions.html",
    "visit/eat-and-drink.html": DOMAIN + "/visit/eat-and-drink.html",
    "visit/pub-guide.html": DOMAIN + "/visit/pub-guide.html",
    "visit/shopping.html": DOMAIN + "/visit/shopping.html",
    "visit/market.html": DOMAIN + "/visit/market.html",
    "visit/parking-and-toilets.html": DOMAIN + "/visit/parking-and-toilets.html",
    "do/things-to-do.html": DOMAIN + "/do/things-to-do.html",
    "do/sport-and-recreation.html": DOMAIN + "/do/sport-and-recreation.html",
    "do/walks.html": DOMAIN + "/do/walks.html",
    "do/dog-walks.html": DOMAIN + "/do/dog-walks.html",
    "town/history.html": DOMAIN + "/town/history.html",
    "town/railway.html": DOMAIN + "/town/railway.html",
    "town/charities.html": DOMAIN + "/town/charities.html",
    "council/index.html": DOMAIN + "/council/",
}
OG_REQUIRED = ["og:title", "og:description", "og:url", "og:type", "og:site_name",
               "og:locale", "og:image", "og:image:width", "og:image:height", "og:image:alt"]
TW_REQUIRED = ["twitter:card", "twitter:title", "twitter:description", "twitter:image"]

problems = []
for rel, canon in EXPECTED.items():
    html = (ROOT / rel).read_text(encoding="utf-8")
    canons = re.findall(r'<link rel="canonical" href="([^"]+)"', html)
    if canons != [canon]:
        problems.append(f"{rel}: canonical {canons} != {canon}")
    for p in OG_REQUIRED:
        n = len(re.findall(f'property="{re.escape(p)}"', html))
        if n != 1:
            problems.append(f"{rel}: {p} count {n}")
    for p in TW_REQUIRED:
        n = len(re.findall(f'name="{re.escape(p)}"', html))
        if n != 1:
            problems.append(f"{rel}: {p} count {n}")
    m = re.search(r'property="og:url" content="([^"]+)"', html)
    if m and m.group(1) != canon:
        problems.append(f"{rel}: og:url {m.group(1)} != canonical")
    m = re.search(r'property="og:image" content="([^"]+)"', html)
    if m and not m.group(1).startswith("https://upload.wikimedia.org/"):
        problems.append(f"{rel}: og:image not a direct upload URL: {m.group(1)}")
    lds = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
    if len(lds) != 1:
        problems.append(f"{rel}: {len(lds)} JSON-LD blocks")
    for ld in lds:
        try:
            data = json.loads(ld)
            types = [n.get("@type") for n in data.get("@graph", [])]
            print(f"OK  {rel}: JSON-LD types {types}")
        except Exception as e:
            problems.append(f"{rel}: JSON-LD parse error: {e}")
    # commons imgs must carry width/height
    for tag in re.findall(r'<img [^>]*Special:FilePath[^>]*>', html):
        if 'width="' not in tag or 'height="' not in tag:
            problems.append(f"{rel}: commons img missing dims: {tag[:90]}")

print()
if problems:
    print("PROBLEMS:")
    [print(" -", p) for p in problems]
    sys.exit(1)
print("ALL CHECKS PASSED")
