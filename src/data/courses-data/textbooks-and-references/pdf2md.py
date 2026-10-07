#!/usr/bin/env python3
"""
pdf2md — convert the NaCCA JHS textbook PDFs (English / Maths, B7-B9,
Learner's Book "Print Ready", Workbook, Workbook Answer Book, chapter draft)
into high-fidelity Markdown.

House style discovered in the PDFs:
  * Body text is Carlito; bold = Carlito-Bold, italic = Carlito-Italic.
  * Headings are identifiable by point size + weight + colour.
  * Callout boxes (Worked example, Practice, Dialogue, Exam tip, ...) are
    coloured fills  -> rendered as Markdown blockquotes.
  * Real tables are ruled grids (find_tables, "lines" strategy) -> pipe tables.
  * Ruled write-in areas (workbook) are horizontal lines outside tables
    -> "_[answer space — N lines]_".
  * Empty answer frames -> "_[answer space — box]_".
  * Figures are placed raster images -> extracted as PNG into images/ and
    embedded with the printed caption as the alt text.
  * Every original page gets an invisible "<!-- page N -->" marker; where a
    paragraph runs across a page break the marker is inserted inline so the
    prose stays joined.

Usage:  python3 pdf2md.py [substring of filename ...]
Output: one .md per PDF in /home/user/md/ (+ images/ and conversion-report.json)
"""

import glob
import json
import os
import re
import sys

import pymupdf

SRC_DIR = "/home/user/uploads"
OUT_DIR = "/home/user/md"
IMG_DIR = os.path.join(OUT_DIR, "images")
DPI = 200

SECTION_LABELS = re.compile(
    r"^(Recall|Key words|Core practice|Challenge|Writing task|Speaking and listening"
    r"|Exam-style questions|Review|Before you start|Guided practice|Apply it)\b")
PAPER_LABEL = re.compile(r"^Paper \d|^Practice paper")
TOC_DOTS = re.compile(r"\.{3,}\s*(\d{1,3})\s*$")
LIST_NUM = re.compile(r"^\d{1,2}\.\s")
KEYTERM = re.compile(r"^\*\*[^*]{1,60}\*\*\s+[—–-]\s")
CAPTION = re.compile(r"^(Table|Figure)\s+\d")


# --------------------------------------------------------------- text utils --

DOTS_TAIL = re.compile(r"[.\u00b7\u2024\u2025\u2026\u22ef\u2e3a\u2e3b\u30fb]{8,}\s*$")


def trim_leaders(t):
    return DOTS_TAIL.sub("", t)


def clean_span(t):
    t = (t.replace("\u00ad", "").replace("\u00a0", " ")
         .replace("\u2009", " ").replace("\u200a", " ")
         .replace("\u2002", " ").replace("\u202f", " "))
    return re.sub(r"[ \t]+", " ", t)


def spans_to_md(spans):
    runs = []
    for s in spans:
        t = clean_span(s["text"])
        if not t or s["font"] == "OpenSymbol":
            continue
        t = t.replace("*", "\\*")            # literal asterisks are content
        key = ("Bold" in s["font"], "Italic" in s["font"])
        if runs and runs[-1][0] == key:
            runs[-1][1] += t
        else:
            runs.append([key, t])
    runs = [[k, trim_leaders(v)] for k, v in runs]
    runs = [r for r in runs if r[1].strip() or r[1]]
    out = ""
    for (b, i), t in runs:
        if not t.strip():
            out += t
            continue
        lead = t[: len(t) - len(t.lstrip())]
        trail = t[len(t.rstrip()):]
        core = t.strip()
        if b and i:
            out += f"{lead}***{core}***{trail}"
        elif b:
            out += f"{lead}**{core}**{trail}"
        elif i:
            out += f"{lead}*{core}*{trail}"
        else:
            out += t
    out = re.sub(r"[ ]{2,}", " ", out)
    # binary set operators want a space either side ("A ∪ B", not "A ∪B")
    out = re.sub(r"(?<=[A-Za-z0-9])\s*([∪∩])(?=\s*[A-Za-z0-9])", r" \1 ", out)
    return out.strip()


def merge_emphasis(t):
    for _ in range(3):
        t = re.sub(r"\*\*\*([^*]+)\*\*\*\s+\*\*\*", r"***\1 ", t)
        t = re.sub(r"\*\*([^*]+)\*\*\s+\*\*", r"**\1 ", t)
        t = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)\s+\*(?!\*)", r"*\1 ", t)
    return t


def esc_text(t):
    t = re.sub(r"_{25,}", "_" * 20, t)
    if re.match(r"^[-+]\s+\d", t):          # would become a bullet item
        t = "\\" + t
    return t


# ---------------------------------------------------------------- analysis ---

class Line:
    __slots__ = ("page", "bbox", "spans", "text", "md", "size", "bold", "ital",
                 "color", "bullet", "container", "indent")

    def __init__(self, page, bbox, spans, text, md, size, bold, ital, color,
                 bullet):
        self.page = page
        self.bbox = pymupdf.Rect(bbox)
        self.spans = spans
        self.text = text
        self.md = md
        self.size = size
        self.bold = bold
        self.ital = ital
        self.color = color
        self.bullet = bullet
        self.indent = 0
        self.container = None


def page_lines(page, pno, exclude=()):
    raw = []
    for bl in page.get_text("dict")["blocks"]:
        if bl["type"] != 0:
            continue
        for l in bl["lines"]:
            md_spans = [s for s in l["spans"] if s["text"]]
            spans = [s for s in l["spans"] if s["text"].strip()]
            if not spans:
                continue
            raw.append({"bbox": pymupdf.Rect(l["bbox"]), "spans": md_spans,
                        "text": "".join(s["text"] for s in spans).strip()})

    if exclude:
        keep = [r for r in raw
                if not any(centre_inside(r["bbox"], b) for b in exclude)]
        held = [r for r in raw if r not in keep]
    else:
        keep, held = raw, []
    raw = keep

    # 1) join fragments of one printed line that the PDF split at a gap
    #    ("Union (" + ") — ..."), so a glyph can then be inserted inside it
    def overlap(a, b):
        return (min(a.y1, b.y1) - max(a.y0, b.y0))

    changed = True
    while changed:
        changed = False
        raw.sort(key=lambda r: (round(r["bbox"].y0, 1), r["bbox"].x0))
        for i in range(len(raw) - 1):
            a, b = raw[i], raw[i + 1]
            if abs(a["bbox"].y0 - b["bbox"].y0) > 1.6:
                continue
            h = min(a["bbox"].height, b["bbox"].height)
            if h <= 0 or overlap(a["bbox"], b["bbox"]) / h < 0.75:
                continue
            gap = b["bbox"].x0 - a["bbox"].x1
            if not (0 <= gap <= 14.0):
                continue
            a["spans"] = a["spans"] + b["spans"]
            a["bbox"] = a["bbox"] | b["bbox"]
            a["text"] = "".join(sp["text"] for sp in a["spans"]).strip()
            raw.pop(i + 1)
            changed = True
            break

    # 2) Symbols such as ∪, ∩, ′ and √ are sometimes emitted as their own
    #    "line" while the sentence that contains them keeps a gap.  Put each
    #    glyph back into its host line at its own x position.
    hosts = [r for r in raw if len(r["text"]) > 3]
    consumed = set()
    for i, r in enumerate(raw):
        if i in consumed or len(r["text"]) > 3 or re.search(r"\w", r["text"]):
            continue
        best, best_ov = None, 0.0
        for h in hosts:
            if h is r:
                continue
            ov = min(r["bbox"].y1, h["bbox"].y1) - max(r["bbox"].y0, h["bbox"].y0)
            if ov <= 0 or r["bbox"].height <= 0 or ov / r["bbox"].height < 0.6:
                continue
            if not (h["bbox"].x0 - 2 <= r["bbox"].x0
                    and r["bbox"].x1 <= h["bbox"].x1 + 2):
                continue
            if ov > best_ov:
                best, best_ov = h, ov
        if best is None:
            continue
        glyphs = r["spans"]
        for g in glyphs:
            gx = (g["bbox"][0] + g["bbox"][2]) / 2
            placed = False
            for si, sp in enumerate(best["spans"]):
                x0, x1 = sp["bbox"][0], sp["bbox"][2]
                if not (sp["text"].strip() and x0 <= gx <= x1 and x1 > x0):
                    continue
                frac = (gx - x0) / (x1 - x0)
                idx = min(len(sp["text"]) - 1,
                          max(0, int(round(len(sp["text"]) * frac))))
                left, right = sp["text"][:idx], sp["text"][idx:]
                y0s, y1s = sp["bbox"][1], sp["bbox"][3]
                best["spans"][si:si + 1] = [
                    dict(sp, text=left, bbox=(x0, y0s, gx, y1s)),
                    g,
                    dict(sp, text=right, bbox=(gx, y0s, x1, y1s)),
                ]
                placed = True
                break
            if placed:
                continue
            # glyph sits in the gap between two spans: insert there
            prev_x1 = best["bbox"].x0
            for si, sp in enumerate(best["spans"] + [None]):
                if sp is None or sp["bbox"][0] > gx:
                    if 0 <= gx - prev_x1 <= 12:
                        best["spans"].insert(si if sp is not None else len(best["spans"]), g)
                        placed = True
                    break
                prev_x1 = max(prev_x1, sp["bbox"][2])
        best["text"] = "".join(sp["text"] for sp in best["spans"]).strip()
        consumed.add(i)
    raw = [r for i, r in enumerate(raw) if i not in consumed]
    raw += held

    recs = []
    for r in raw:
        md_spans, spans = r["spans"], [s for s in r["spans"] if s["text"].strip()]
        bullet = bool(spans[0]["font"] == "OpenSymbol"
                      or spans[0]["text"].strip() in ("•", "·", "○", "▪"))
        md = spans_to_md(md_spans)
        if not bullet and re.match(r"^[•·○▪]\s", md):
            bullet = True
        if bullet:
            md = re.sub(r"^[•·○▪]\s*", "", md).strip()
        plain = re.sub(r"\*+", "", md).strip()
        size = max(round(sp["size"], 1) for sp in spans)
        bold = all("Bold" in sp["font"] for sp in spans)
        ital = all("Italic" in sp["font"] for sp in spans)
        lead = spans[0]["text"][: len(spans[0]["text"]) -
                                len(spans[0]["text"].lstrip())]
        rec = Line(pno, r["bbox"], spans, plain, md, size, bold, ital,
                   spans[0]["color"], bullet)
        rec.indent = len(lead.replace("\t", "    "))
        recs.append(rec)
    # a bullet glyph printed on its own line belongs to the line after it
    out, pending = [], False
    for rec in recs:
        if rec.bullet and not rec.md.strip():
            pending = True
            continue
        if pending:
            rec.bullet = True
            pending = False
        out.append(rec)
    return out


def centre_inside(r, box, pad=1.0):
    cx, cy = (r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2
    return (box.x0 - pad <= cx <= box.x1 + pad
            and box.y0 - pad <= cy <= box.y1 + pad)


def get_tables(page):
    out = []
    for t in page.find_tables(strategy="lines").tables:
        if t.row_count < 2 or t.col_count < 2:
            continue
        grid = [list(r.cells) for r in t.rows]
        if t.header is not None and t.header.cells:
            hb = t.header.cells[0]
            if not grid or not hb or tuple(round(v) for v in hb) != tuple(round(v) for v in grid[0][0]):
                grid.insert(0, list(t.header.cells))
        out.append({"bbox": pymupdf.Rect(t.bbox), "grid": grid, "rows": None})
    return out


def fill_table_text(table, lines):
    """Compose cell text from our own line extraction (find_tables' own
    extract() mangles words: 'Section' -> 'Sectoi n')."""
    rows = []
    for crow in table["grid"]:
        cells = []
        for cbox in crow:
            if cbox is None:
                cells.append("")
                continue
            r = pymupdf.Rect(cbox)
            inside = [l for l in lines if centre_inside(l.bbox, r, pad=-0.5)
                      and l.bbox.x1 > r.x0 and l.bbox.x0 < r.x1]
            inside.sort(key=lambda l: (round(l.bbox.y0, 1), l.bbox.x0))
            txt = " ".join(l.md for l in inside)
            txt = re.sub(r"\s+", " ", txt).strip()
            cells.append(txt)
        rows.append(cells)
    table["rows"] = rows
    return table


def get_callouts(page, table_boxes):
    raw = []
    for g in page.get_drawings():
        r = g["rect"]
        if g["fill"] is None or r.width < 200 or r.height < 14:
            continue
        col = tuple(round(c, 3) for c in g["fill"])
        if col == (1.0, 1.0, 1.0) or r.get_area() < 6500:
            continue
        if any(centre_inside(pymupdf.Rect(r), tb, pad=-1) for tb in table_boxes):
            continue
        raw.append({"bbox": pymupdf.Rect(r), "color": col})
    raw.sort(key=lambda f: -f["bbox"].get_area())
    kept = []
    for f in raw:
        if any(f["bbox"] in k["bbox"] for k in kept):
            continue
        kept.append(f)
    # unfilled framed boxes that hold text also act as callouts
    for g in page.get_drawings():
        if g["fill"] is not None or g["color"] is None:
            continue
        r = pymupdf.Rect(g["rect"])
        if r.width < 240 or r.height < 30:
            continue
        if any(centre_inside(r, c["bbox"], pad=-1) for c in kept):
            continue
        if any(centre_inside(r, tb, pad=-1) for tb in table_boxes):
            continue
        kept.append({"bbox": r, "color": None})
    kept.sort(key=lambda c: c["bbox"].y0)
    return kept


def get_line_boxes(page, blockers):
    """Boxes drawn as separate line segments (no rect item)."""
    hs, vs = [], []
    for g in page.get_drawings():
        for it in g["items"]:
            if it[0] == "l":
                a, b = it[1], it[2]
                if abs(a.y - b.y) < 1.0 and abs(b.x - a.x) >= 40:
                    hs.append((min(a.x, b.x), max(a.x, b.x), a.y))
                elif abs(a.x - b.x) < 1.0 and abs(b.y - a.y) >= 40:
                    vs.append((a.x, min(a.y, b.y), max(a.y, b.y)))
            elif it[0] == "re":
                r = it[1]
                hs.append((r.x0, r.x1, r.y0))
                hs.append((r.x0, r.x1, r.y1))
                vs.append((r.x0, r.y0, r.y1))
                vs.append((r.x1, r.y0, r.y1))
    boxes = []
    for i, h1 in enumerate(hs):
        for h2 in hs[i + 1:]:
            if abs(h1[0] - h2[0]) > 4 or abs(h1[1] - h2[1]) > 4:
                continue
            y0, y1 = sorted((h1[2], h2[2]))
            if not (40 <= y1 - y0 <= 740) or h1[1] - h1[0] < 200:
                continue
            left = any(abs(v[0] - h1[0]) <= 5 and v[1] <= y0 + 5 and v[2] >= y1 - 5
                       for v in vs)
            right = any(abs(v[0] - h1[1]) <= 5 and v[1] <= y0 + 5 and v[2] >= y1 - 5
                        for v in vs)
            if left and right:
                boxes.append(pymupdf.Rect(h1[0], y0, h1[1], y1))
    # keep outermost, drop ones inside tables/callouts
    boxes.sort(key=lambda r: -r.get_area())
    kept = []
    for r in boxes:
        if any(r in k for k in kept):
            continue
        if any(centre_inside(r, b, pad=-1) for b in blockers):
            continue
        kept.append(r)
    return kept


def get_answer_spaces(page, blockers, lines):
    hls = []
    for g in page.get_drawings():
        items = g["items"]
        box_like = any(
            (it[0] == "l" and abs(it[1].x - it[2].x) < 1.2
             and abs(it[2].y - it[1].y) > 12)
            or (it[0] == "re" and it[1].height > 12 and it[1].width > 12)
            for it in items)
        if box_like:
            continue
        for it in items:
            if it[0] == "l":
                a, b = it[1], it[2]
                if abs(a.y - b.y) < 1.0 and abs(b.x - a.x) > 50:
                    hls.append(pymupdf.Rect(min(a.x, b.x), a.y - .5,
                                            max(a.x, b.x), a.y + .5))
            elif it[0] == "re":
                r = it[1]
                if r.height < 1.2 and r.width > 50:
                    hls.append(pymupdf.Rect(r.x0, r.y0 - .5, r.x1, r.y0 + .5))
    hls = [h for h in hls if not any(centre_inside(h, b) for b in blockers)]
    hls.sort(key=lambda r: r.y0)
    clusters = []
    for h in hls:
        if (clusters and abs(clusters[-1]["x0"] - h.x0) < 6
                and abs(clusters[-1]["x1"] - h.x1) < 6
                and 0 < h.y0 - clusters[-1]["last"] < 40):
            c = clusters[-1]
            c["n"] += 1
            c["last"] = h.y0
            c["bbox"] = pymupdf.Rect(c["bbox"].x0, c["bbox"].y0,
                                     c["bbox"].x1, h.y1)
        else:
            clusters.append({"x0": h.x0, "x1": h.x1, "n": 1, "last": h.y0,
                             "bbox": pymupdf.Rect(h)})
    spaces = []
    for c in clusters:
        if c["n"] >= 2:
            spaces.append({"kind": "lines", "bbox": c["bbox"], "n": c["n"]})
        else:
            y = c["bbox"].y0
            above = [l.bbox.y1 for l in lines if l.bbox.y1 < y]
            below = [l.bbox.y0 for l in lines if l.bbox.y0 > y]
            gap_above = y - (max(above) if above else 0)
            gap_below = (min(below) if below else 999) - y
            if gap_above >= 6 and gap_below >= 22:
                spaces.append({"kind": "lines", "bbox": c["bbox"], "n": 1})
    # empty answer frames
    for g in page.get_drawings():
        if g["fill"] is not None or g["color"] is None:
            continue
        r = pymupdf.Rect(g["rect"])
        if r.width > 200 and r.height > 50:
            if any(centre_inside(r, b) for b in blockers):
                continue
            if any(r.intersects(s["bbox"]) for s in spaces):
                continue
            spaces.append({"kind": "frame", "bbox": r, "n": None})
    return spaces


# ------------------------------------------------------------------- render --

def md_table(rows):
    width = max(len(r) for r in rows)
    rows = [r + [""] * (width - len(r)) for r in rows]

    def cell(c):
        return re.sub(r"\s+", " ", str(c)).strip().replace("|", "\\|")

    head, body = rows[0], rows[1:]
    if not any(c.strip() for c in head) and body:
        head, body = body[0], body[1:]
    out = ["| " + " | ".join(cell(c) for c in head) + " |",
           "|" + "|".join([" --- "] * width) + "|"]
    for r in body:
        out.append("| " + " | ".join(cell(c) for c in r) + " |")
    return out


def heading_level(line, page_is_cover):
    if page_is_cover:
        return None
    if line.bbox.x0 > 74:          # centred display lines are never headings
        return None
    s, b, i, t = line.size, line.bold, line.ital, line.text
    if s >= 20:
        return 1
    if s >= 13.5:
        return 2
    if s >= 12.0 and b:
        return 3
    if PAPER_LABEL.match(t) and b:
        return 3
    if SECTION_LABELS.match(t) and b and s <= 11.6:
        return 4
    if 11.0 <= s < 12.0 and b:
        return 5 if i else 4
    return None


def bold_label_start(line):
    if not line.spans:
        return False
    s = line.spans[0]
    if "Bold" not in s["font"]:
        return False
    head = clean_span(s["text"]).strip()
    return head.endswith(":") and len(head) <= 32


# --------------------------------------------------------------------- flow --

class Chunk:
    """para / heading / listitem / table / figure / space / callout"""

    def __init__(self, kind, page, y0, y1):
        self.kind = kind
        self.page = page
        self.page_end = page
        self.y0, self.y1 = y0, y1
        self.pieces = []      # [(page, md)] for paragraphs
        self.text = ""
        self.level = None
        self.rows = None
        self.image = None
        self.caption = None
        self.space = None
        self.children = None
        self.queued = False


def build_chunks(units, cover=False, in_callout=False):
    chunks = []
    para = None

    def flush():
        nonlocal para
        if para is not None and para.pieces and not para.queued:
            chunks.append(para)
        para = None

    for u in units:
        kind = u["type"]
        if kind == "line":
            l = u["line"]
            # captions / toc / headings always break a paragraph
            toc = bool(TOC_DOTS.search(l.text)) and not cover
            lvl = heading_level(l, cover)
            if toc:
                lvl = None
            bullet = l.bullet or bool(KEYTERM.match(l.md))
            # try to extend the open paragraph
            if (para is not None and not toc and lvl is None and not bullet
                    and para.lines and joinable(para, l, in_callout)):
                if l.page != para.page_end:
                    para.pieces.append((l.page, None))
                para.pieces.append((l.page, l.md))
                para.lines.append(l)
                para.page_end = l.page
                continue
            flush()
            if toc:
                indent = "  " if l.bbox.x0 > 76 else ""
                txt = TOC_DOTS.sub(lambda m: " — " + m.group(1), l.md)
                c = Chunk("listitem", l.page, l.bbox.y0, l.bbox.y1)
                c.pieces = [(l.page, f"{indent}- {txt}")]
                chunks.append(c)
            elif lvl is not None:
                c = Chunk("heading", l.page, l.bbox.y0, l.bbox.y1)
                c.level = lvl
                c.text = l.text
                chunks.append(c)
            elif bullet:
                c = Chunk("listitem", l.page, l.bbox.y0, l.bbox.y1)
                c.pieces = [(l.page, "- " + l.md)]
                c.lines = [l]
                c.queued = True
                chunks.append(c)
                para = c
            else:
                para = Chunk("para", l.page, l.bbox.y0, l.bbox.y1)
                para.pieces = [(l.page, l.md)]
                para.lines = [l]
        elif kind == "table":
            flush()
            c = Chunk("table", u["page"], u["bbox"].y0, u["bbox"].y1)
            c.rows = u["rows"]
            chunks.append(c)
        elif kind == "figure":
            flush()
            c = Chunk("figure", u["page"], u["bbox"].y0, u["bbox"].y1)
            c.image = u["image"]
            c.caption = u["caption"]
            chunks.append(c)
        elif kind == "space":
            flush()
            c = Chunk("space", u["page"], u["bbox"].y0, u["bbox"].y1)
            c.space = (u["n"], u["kind"])
            chunks.append(c)
        elif kind == "callout":
            flush()
            inner = build_chunks(u["children"], in_callout=True)
            c = Chunk("callout", u["page"], u["bbox"].y0, u["bbox"].y1)
            c.children = inner
            chunks.append(c)
    flush()
    return chunks


SENT_END = re.compile(r"[.!?\u2026:;][\"\'\u201d\u2019)\]]*\s*$")
CURR_LABEL = re.compile(r"^(Strand|Sub-?Strand|Content standard|Core competences"
                        r"|Indicators?)\b")
INDICATOR = re.compile(r"^(B\d+/JHS|B\d+\.\d+\.|\d+\.\d+\.\d+)")
KEYTERM_PLAIN = re.compile(r"^[A-Z][A-Za-z0-9 ,\'\u2019()/.-]{1,45}\s[\u2014\u2013]\s")


def joinable(para, l, in_callout=False):
    """Can text line l continue the open paragraph para?"""
    if l.bullet or LIST_NUM.match(l.text) or KEYTERM.match(l.md):
        return False
    if KEYTERM_PLAIN.match(l.text) and (not para.lines or KEYTERM_PLAIN.match(para.lines[-1].text)):
        return False                      # glossary-style "Term — definition"
    if bold_label_start(l) or CAPTION.match(l.text):
        return False
    if CURR_LABEL.match(l.text) or INDICATOR.match(l.text):
        return False
    if l.indent >= 3:                     # hanging indent = new item
        return False
    prev = para.lines[-1]
    if in_callout:
        # inside a box, a line that ends a sentence (or a bold title line)
        # starts a new paragraph, exactly as printed
        if SENT_END.search(prev.text) or (prev.bold and not SENT_END.search(prev.text)
                                          and len(prev.text) < 90):
            return False
        # short, punctuation-free lines are separate list entries
        # (Core competences, curriculum fields ...) rather than one sentence
        if (len(prev.text) <= 72 and not SENT_END.search(prev.text)
                and re.match(r"[A-Z0-9]", l.text)
                and not l.text.startswith(("And ", "Or "))):
            return False
    if l.page != prev.page:
        return True
    if not (0 <= l.bbox.x0 - prev.bbox.x0 <= 26):
        return False
    gap = l.bbox.y0 - prev.bbox.y1
    return -3 <= gap <= 7


def render_paratext(pieces):
    text = ""
    prev_page = None
    for p, piece in pieces:
        if piece is None:
            prev_page = p
            continue
        if text and prev_page is not None and prev_page != p:
            text += f" <!-- page {p + 1} --> "
        if text and not text.endswith((" ", "(")) and not piece.startswith((" ", ")", ",", ".", "!", "?", ";", ":")):
            text += " "
        text += piece
        prev_page = p
    text = merge_emphasis(text)
    return esc_text(text).strip()


def render_chunks(chunks, md, last_page, for_quote=False):
    """Append rendered chunk lines (already prefixed with '> ' if for_quote)."""
    def emit(line=""):
        if line == "" and md and md[-1].strip() in (">", ""):
            return
        if for_quote and line.strip() == "-":
            md.append("> -")
            return
        md.append(("> " + line).rstrip() if for_quote else line)

    for c in chunks:
        if c.kind == "heading":
            emit()
            if for_quote:
                emit("**" + c.text + "**")
            else:
                emit("#" * c.level + " " + c.text)
            emit()
        elif c.kind in ("para", "listitem"):
            emit()
            emit(render_paratext(c.pieces))
            emit()
        elif c.kind == "table":
            emit()
            for line in md_table(c.rows):
                emit(line)
            emit()
        elif c.kind == "figure":
            emit()
            alt = (c.caption or f"Figure on page {c.page + 1}").replace("]", "）")
            emit(f"![{alt}]({c.image})")
            emit()
        elif c.kind == "space":
            n, kind = c.space
            emit()
            if kind == "frame":
                emit("_[answer space — box]_")
            else:
                word = "line" if n == 1 else "lines"
                emit(f"_[answer space — {n} {word}]_")
            emit()
        elif c.kind == "callout":
            emit()
            for line in render_chunks(c.children, [], None, for_quote=True):
                emit(line) if line else emit()
            emit()


# ------------------------------------------------------------------ convert --

def convert(path):
    name = os.path.basename(path)
    slug = re.sub(r"[^a-z0-9]+", "-", name[:-4].lower()).strip("-")
    doc = pymupdf.open(path)

    units_all = []       # top-level units, in document order
    figure_no = 0

    for pno in range(doc.page_count):
        page = doc[pno]
        all_lines = page_lines(page, pno)
        # only a real title page is treated as a cover: no tables, no boxes,
        # few lines, and a very large display title
        cover = (pno == 0
                 and not page.find_tables(strategy="lines").tables
                 and len(page.get_drawings()) == 0
                 and len(all_lines) <= 22
                 and any(l.size >= 18 for l in all_lines))
        tables = get_tables(page)
        for t in tables:
            fill_table_text(t, all_lines)
        table_boxes = [t["bbox"] for t in tables]
        callouts = get_callouts(page, table_boxes)
        callout_boxes = [c["bbox"] for c in callouts]

        lines = [l for l in all_lines
                 if not any(centre_inside(l.bbox, tb) for tb in table_boxes)]
        for l in lines:
            for ci, c in enumerate(callouts):
                if centre_inside(l.bbox, c["bbox"]):
                    l.container = ci
                    break

        # figures
        consumed = set()
        seen = set()
        figures = []
        for info in page.get_image_info(xrefs=True):
            bb = pymupdf.Rect(info["bbox"])
            key = tuple(round(v) for v in bb)
            if key in seen or bb.width < 60 or bb.height < 40:
                continue
            seen.add(key)
            figure_no += 1
            fname = f"{slug}-p{pno + 1:03d}-fig{figure_no:02d}.png"
            try:
                page.get_pixmap(dpi=DPI, clip=bb).save(os.path.join(IMG_DIR, fname))
            except Exception as e:
                print("  ! figure render failed", fname, e)
            cap, capline = None, None
            for l in lines:
                if l.text.startswith("Figure") and -6 <= l.bbox.y0 - bb.y1 < 34:
                    cap, capline = l.text, l
                    break
            if cap is None:
                for l in lines:
                    if l.text.startswith("Figure") and -40 < bb.y0 - l.bbox.y1 <= 6:
                        cap, capline = l.text, l
                        break
            if capline is not None:
                consumed.add(id(capline))
            figures.append({"type": "figure", "bbox": bb, "page": pno,
                            "image": f"images/{fname}", "caption": cap})

        blockers = table_boxes + callout_boxes
        # boxes drawn as separate segments: with text -> callout, empty -> frame
        for r in get_line_boxes(page, blockers):
            holder = next((l for l in lines if centre_inside(l.bbox, r, pad=-2)), None)
            if holder is not None:
                callouts.append({"bbox": r, "color": None})
                callout_boxes = [c["bbox"] for c in callouts]
            else:
                pass  # frame, collected below
        line_frames = get_line_boxes(page, table_boxes + callout_boxes)
        for l in lines:
            for ci, c in enumerate(callouts):
                if centre_inside(l.bbox, c["bbox"]):
                    l.container = ci
                    break
        spaces = get_answer_spaces(page, blockers, lines)
        for r in line_frames:
            if any(centre_inside(l.bbox, r, pad=-2) for l in lines):
                continue
            if any(r.intersects(sp["bbox"]) for sp in spaces):
                continue
            spaces.append({"kind": "frame", "bbox": r, "n": None})
        frames = [sp["bbox"] for sp in spaces if sp["kind"] == "frame"]
        spaces = [sp for sp in spaces
                  if sp["kind"] == "frame"
                  or not any(f.contains(sp["bbox"]) for f in frames)]
        for s in spaces:
            s["type"] = "space"
            s["page"] = pno
            for ci, c in enumerate(callouts):
                if centre_inside(s["bbox"], c["bbox"]):
                    s["container"] = ci
                    break

        units = []
        for t in tables:
            units.append({"type": "table", "bbox": t["bbox"], "rows": t["rows"],
                          "page": pno, "container": None})
        units.extend(figures)
        units.extend(spaces)
        for l in lines:
            if id(l) in consumed:
                continue
            units.append({"type": "line", "line": l, "bbox": l.bbox, "page": pno,
                          "container": l.container})

        # callout containers swallow their children
        top = []
        callout_children = [[] for _ in callouts]
        for u in units:
            ci = u.get("container")
            if ci is not None:
                callout_children[ci].append(u)
            else:
                top.append(u)
        for ci, c in enumerate(callouts):
            top.append({"type": "callout", "bbox": c["bbox"], "page": pno,
                        "children": callout_children[ci]})
        top.sort(key=lambda u: (u["bbox"].y0, u["bbox"].x0))

        if cover:
            units_all.append(("cover", pno, top))
        else:
            units_all.append(("normal", pno, top))

    # ---------------------------------------------------------- assemble ----
    md = [f"<!-- Source PDF: {name} — {doc.page_count} pages -->",
          "<!-- Converted to Markdown — figures in images/ — "
          "invisible page markers throughout -->",
          ""]
    last_page = None

    def page_marker(p):
        nonlocal last_page
        if last_page is not None:
            for q in range(last_page + 1, p):
                md.append(f"<!-- page {q + 1} -->")
                md.append("")
        md.append(f"<!-- page {p + 1} -->")
        md.append("")
        last_page = p

    for kind, pno, units in units_all:
        if kind == "cover":
            page_marker(pno)
            clip = [u for u in units if u["type"] == "line"]
            clip.sort(key=lambda u: u["bbox"].y0)
            first = True
            for u in clip:
                l = u["line"]
                if first:
                    md.append(f"# {l.text}")
                    first = False
                else:
                    md.append(l.md)
                    md.append("")
            continue
        page_marker(pno)
        chunks = build_chunks(units)
        # render, but paragraphs may need inline page markers; render_chunks
        # writes into md directly
        for c in chunks:
            if c.kind == "heading":
                md += ["", "#" * c.level + " " + c.text, ""]
            elif c.kind in ("para", "listitem"):
                md += ["", render_paratext(c.pieces), ""]
            elif c.kind == "table":
                md.append("")
                md += md_table(c.rows)
                md.append("")
            elif c.kind == "figure":
                alt = (c.caption or f"Figure on page {c.page + 1}").replace("]", "）")
                md += ["", f"![{alt}]({c.image})", ""]
            elif c.kind == "space":
                n, sk = c.space
                md.append("")
                if sk == "frame":
                    md.append("_[answer space — box]_")
                else:
                    word = "line" if n == 1 else "lines"
                    md.append(f"_[answer space — {n} {word}]_")
                md.append("")
            elif c.kind == "callout":
                md.append("")
                inner = []
                render_chunks(c.children, inner, None, for_quote=True)
                # trim leading/trailing blanks of the quote
                while inner and inner[0].strip() in (">", ""):
                    inner.pop(0)
                while inner and inner[-1].strip() in (">", ""):
                    inner.pop()
                md += inner
                md.append("")

    return md, figure_no, doc


if __name__ == "__main__":
    os.makedirs(IMG_DIR, exist_ok=True)
    targets = sys.argv[1:]
    files = sorted(glob.glob(os.path.join(SRC_DIR, "*.pdf")))
    if targets:
        files = [f for f in files
                 if any(t.lower() in os.path.basename(f).lower() for t in targets)]
    report = []
    for f in files:
        md_lines, nfig, doc = convert(f)
        outname = os.path.join(OUT_DIR, os.path.basename(f)[:-4] + ".md")
        text = re.sub(r"\n{3,}", "\n\n", "\n".join(md_lines)).rstrip() + "\n"
        with open(outname, "w", encoding="utf-8") as fh:
            fh.write(text)
        md_lines = text.split("\n")
        plain = re.sub(r"<!--.*?-->", " ", text, flags=re.S)
        words = len(re.sub(r"[#>*_`\[\]()!|]", " ", plain).split())
        report.append({"pdf": os.path.basename(f), "md": os.path.basename(outname),
                       "pages": doc.page_count, "figures": nfig, "words": words})
        print(f"OK  {os.path.basename(f):42s} -> {os.path.basename(outname):42s}"
              f" pages={doc.page_count:4d} words={words:6d} figures={nfig:3d}")
        doc.close()
    with open(os.path.join(OUT_DIR, "conversion-report.json"), "w") as fh:
        json.dump(report, fh, indent=1)
