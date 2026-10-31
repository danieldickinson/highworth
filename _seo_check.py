import json, re, sys
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import xml.etree.ElementTree as ET

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
    "residents/broadband-and-mobile.html": DOMAIN + "/residents/broadband-and-mobile.html",
    "residents/online-safety.html": DOMAIN + "/residents/online-safety.html",
}
OG_REQUIRED = ["og:title", "og:description", "og:url", "og:type", "og:site_name",
               "og:locale", "og:image", "og:image:width", "og:image:height", "og:image:alt"]
TW_REQUIRED = ["twitter:card", "twitter:title", "twitter:description", "twitter:image"]

problems = []

class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.tags = []
        self.ids = set()
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if attrs.get('id'):
            if attrs['id'] in self.ids:
                problems.append(f"Duplicate HTML id: {attrs['id']}")
            self.ids.add(attrs['id'])

def structured_nodes(value):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from structured_nodes(child)
    elif isinstance(value, list):
        for child in value:
            yield from structured_nodes(child)

pages = {rel: Page((ROOT / rel).read_text(encoding='utf-8')) for rel in EXPECTED}
titles = set()
descriptions = set()
for rel, canon in EXPECTED.items():
    html = (ROOT / rel).read_text(encoding="utf-8")
    page = pages[rel]
    title = re.findall(r'<title>(.*?)</title>', html, re.S)
    if len(title) != 1 or not title[0].strip() or title[0] in titles:
        problems.append(f"{rel}: missing or duplicate title")
    titles.update(title)
    if sum(tag == 'h1' for tag, _ in page.tags) != 1:
        problems.append(f"{rel}: expected one H1")
    desc = [a.get('content', '') for tag, a in page.tags if tag == 'meta' and a.get('name') == 'description']
    if len(desc) != 1 or not desc[0].strip() or desc[0] in descriptions:
        problems.append(f"{rel}: missing or duplicate description")
    descriptions.update(desc)
    for tag, attrs in page.tags:
        if tag == 'meta' and attrs.get('name', '').lower() in ('robots', 'googlebot') and 'noindex' in attrs.get('content', '').lower():
            problems.append(f"{rel}: public page has noindex")
        if tag == 'img' and any(not attrs.get(key) for key in ('alt', 'width', 'height')):
            problems.append(f"{rel}: image missing alt text or dimensions")
        url = attrs.get('href') if tag in ('a', 'link', 'use') else attrs.get('src') if tag in ('img', 'script') else None
        if not url:
            continue
        parts = urlsplit(url)
        if parts.scheme or parts.netloc:
            continue
        target = (ROOT / unquote(parts.path).lstrip('/')) if parts.path.startswith('/') else (ROOT / rel).parent / unquote(parts.path) if parts.path else ROOT / rel
        if target.is_dir():
            target /= 'index.html'
        target = target.resolve()
        if not target.is_relative_to(ROOT.resolve()) or not target.is_file():
            problems.append(f"{rel}: broken local link {url}")
        elif parts.fragment and target.suffix == '.html':
            target_rel = str(target.relative_to(ROOT.resolve()))
            target_page = pages.get(target_rel)
            if target_page is None:
                target_page = Page(target.read_text(encoding='utf-8'))
            if unquote(parts.fragment) not in target_page.ids:
                problems.append(f"{rel}: missing fragment {url}")
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
            for node in structured_nodes(data):
                node_types = node.get('@type', [])
                if isinstance(node_types, str):
                    node_types = [node_types]
                if 'Event' in node_types:
                    for key in ('name', 'startDate', 'location'):
                        if not node.get(key):
                            problems.append(f"{rel}: Event missing required {key}")
                    if node.get('startDate'):
                        try:
                            date.fromisoformat(node['startDate'][:10])
                        except (ValueError, TypeError):
                            problems.append(f"{rel}: Event has invalid startDate")
            print(f"OK  {rel}: JSON-LD types {types}")
        except Exception as e:
            problems.append(f"{rel}: JSON-LD parse error: {e}")
    # commons imgs must carry width/height
    for tag in re.findall(r'<img [^>]*Special:FilePath[^>]*>', html):
        if 'width="' not in tag or 'height="' not in tag:
            problems.append(f"{rel}: commons img missing dims: {tag[:90]}")

sitemap = ET.parse(ROOT / 'sitemap.xml')
ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
locations = [n.text for n in sitemap.findall('s:url/s:loc', ns)]
if len(locations) != len(set(locations)) or set(locations) != set(EXPECTED.values()):
    problems.append('Sitemap must contain exactly the public canonical URLs')
for modified in sitemap.findall('s:url/s:lastmod', ns):
    try:
        date.fromisoformat(modified.text)
    except (ValueError, TypeError):
        problems.append(f'Invalid sitemap lastmod: {modified.text}')
if not (ROOT / 'favicon.ico').is_file():
    problems.append('Missing favicon.ico fallback')
print()
if problems:
    print("PROBLEMS:")
    [print(" -", p) for p in problems]
    sys.exit(1)
print("ALL CHECKS PASSED")
