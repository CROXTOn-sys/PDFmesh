#!/usr/bin/env python3
"""Dynamic PDF layout analyzer (PDFmesh, spec sections 1-6, Phase 1).

Uses PyMuPDF (fitz) to extract, per page, a structured geometric model:
page size, content-derived margins, columns, regions, text blocks, rectangles,
lines and images.

Design principles (from the spec):
  * Nothing is hard-coded to any specific PDF. Page size, margins, column
    boundaries and regions are all DERIVED from the uploaded PDF's geometry.
  * Relative positioning: callers normalize coordinates by page width/height.
  * PyMuPDF is the primary geometry source (already installed in the venv).

Public API:
    analyze(input_pdf: str) -> LayoutDocument
"""

from __future__ import annotations

from typing import List, Optional, Tuple

from layout_model import (
    BBox,
    Column,
    Image,
    LayoutDocument,
    Line,
    Margins,
    Page,
    Rectangle,
    Region,
    TextBlock,
    TextLine,
    TextSpan,
)


# --------------------------------------------------------------------------- #
# Color helpers
# --------------------------------------------------------------------------- #
def _int_to_hex(color_int: Optional[int]) -> Optional[str]:
    """PyMuPDF encodes sRGB colors as a single integer (0xRRGGBB)."""
    if color_int is None:
        return None
    try:
        c = int(color_int) & 0xFFFFFF
        return f"{c:06X}"
    except Exception:
        return None


def _flags_bold(flags: int) -> bool:
    # PyMuPDF span flag bit 4 (16) = bold; also infer from fontname elsewhere.
    return bool(flags & 16)


def _flags_italic(flags: int) -> bool:
    # bit 1 (2) = italic
    return bool(flags & 2)


def _name_bold(font: str) -> bool:
    f = (font or "").lower()
    return any(k in f for k in ("bold", "black", "heavy", "semibold", "-bd"))


def _name_italic(font: str) -> bool:
    f = (font or "").lower()
    return "italic" in f or "oblique" in f


# --------------------------------------------------------------------------- #
# Text extraction
# --------------------------------------------------------------------------- #
def _extract_text_blocks(page) -> List[TextBlock]:
    blocks: List[TextBlock] = []
    data = page.get_text("dict")
    for blk in data.get("blocks", []):
        if blk.get("type", 0) != 0:  # 0 = text block
            continue
        lines: List[TextLine] = []
        for ln in blk.get("lines", []):
            spans: List[TextSpan] = []
            for sp in ln.get("spans", []):
                text = sp.get("text", "")
                if text == "":
                    continue
                font = sp.get("font", "")
                flags = int(sp.get("flags", 0))
                spans.append(
                    TextSpan(
                        text=text,
                        bbox=tuple(sp.get("bbox", (0, 0, 0, 0))),
                        font=font,
                        size=float(sp.get("size", 0.0)),
                        color=_int_to_hex(sp.get("color")) or "000000",
                        bold=_flags_bold(flags) or _name_bold(font),
                        italic=_flags_italic(flags) or _name_italic(font),
                    )
                )
            if spans:
                lines.append(TextLine(bbox=tuple(ln.get("bbox", (0, 0, 0, 0))), spans=spans))
        if lines:
            blocks.append(TextBlock(bbox=tuple(blk.get("bbox", (0, 0, 0, 0))), lines=lines))
    return blocks


# --------------------------------------------------------------------------- #
# Drawing extraction (rectangles + lines)
# --------------------------------------------------------------------------- #
def _extract_drawings(page) -> Tuple[List[Rectangle], List[Line]]:
    rects: List[Rectangle] = []
    lines: List[Line] = []
    try:
        drawings = page.get_drawings()
    except Exception:
        return rects, lines

    for d in drawings:
        fill = _int_to_hex(_color_seq_to_int(d.get("fill")))
        stroke = _int_to_hex(_color_seq_to_int(d.get("color")))
        width = float(d.get("width") or 0.0)
        for item in d.get("items", []):
            op = item[0]
            if op == "re":  # rectangle
                r = item[1]
                rects.append(
                    Rectangle(
                        bbox=(float(r.x0), float(r.y0), float(r.x1), float(r.y1)),
                        fill=fill,
                        stroke=stroke,
                        width=width,
                    )
                )
            elif op == "l":  # line segment
                p0, p1 = item[1], item[2]
                lines.append(
                    Line(
                        p0=(float(p0.x), float(p0.y)),
                        p1=(float(p1.x), float(p1.y)),
                        color=stroke or fill,
                        width=width,
                    )
                )
    return rects, lines


def _color_seq_to_int(seq) -> Optional[int]:
    """PyMuPDF fill/stroke colors are float RGB tuples (0..1) or None."""
    if not seq:
        return None
    try:
        if isinstance(seq, (int, float)):
            v = int(round(float(seq) * 255)) & 0xFF
            return (v << 16) | (v << 8) | v
        r, g, b = (max(0, min(255, int(round(float(c) * 255)))) for c in seq[:3])
        return (r << 16) | (g << 8) | b
    except Exception:
        return None


# --------------------------------------------------------------------------- #
# Image extraction
# --------------------------------------------------------------------------- #
def _extract_images(doc, page) -> List[Image]:
    images: List[Image] = []
    try:
        infos = page.get_image_info(xrefs=True)
    except Exception:
        infos = []
    for info in infos:
        xref = info.get("xref", 0)
        bbox = info.get("bbox")
        if not bbox:
            continue
        data = b""
        ext = "png"
        if xref:
            try:
                extracted = doc.extract_image(xref)
                data = extracted.get("image", b"")
                ext = extracted.get("ext", "png")
            except Exception:
                data = b""
        images.append(
            Image(bbox=(float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3])), ext=ext, data=data)
        )
    return images


# --------------------------------------------------------------------------- #
# Margin detection (from content bounds, NOT assumed)
# --------------------------------------------------------------------------- #
def _detect_margins(blocks: List[TextBlock], images: List[Image], width: float, height: float) -> Margins:
    xs0, ys0, xs1, ys1 = [], [], [], []
    for b in blocks:
        x0, y0, x1, y1 = b.bbox
        xs0.append(x0); ys0.append(y0); xs1.append(x1); ys1.append(y1)
    for im in images:
        x0, y0, x1, y1 = im.bbox
        xs0.append(x0); ys0.append(y0); xs1.append(x1); ys1.append(y1)
    if not xs0:
        # Fall back to a small default only when the page is truly empty.
        return Margins(left=0.0, top=0.0, right=0.0, bottom=0.0)
    left = max(0.0, min(xs0))
    top = max(0.0, min(ys0))
    right = max(0.0, width - max(xs1))
    bottom = max(0.0, height - max(ys1))
    return Margins(left=left, top=top, right=right, bottom=bottom)


# --------------------------------------------------------------------------- #
# Column detection (x-gap analysis over text blocks)
# --------------------------------------------------------------------------- #
def _detect_columns(blocks: List[TextBlock], width: float, height: float) -> List[Column]:
    """Detect columns by finding vertical whitespace gaps that persist over a
    large fraction of the page height. Fully dynamic: no fixed percentages.

    Returns a list of Column spans (1 = single column)."""
    if not blocks:
        return [Column(0.0, width)]

    # Build an occupancy histogram across x, weighted by vertical extent so that
    # a tall gap (spanning most of the page) is what separates columns.
    bins = 200
    bin_w = width / bins
    if bin_w <= 0:
        return [Column(0.0, width)]
    coverage = [0.0] * bins  # total y-extent covering each x-bin

    content_top = min(b.bbox[1] for b in blocks)
    content_bottom = max(b.bbox[3] for b in blocks)
    content_height = max(1.0, content_bottom - content_top)

    for b in blocks:
        x0, y0, x1, y1 = b.bbox
        h = max(0.0, y1 - y0)
        si = max(0, int(x0 / bin_w))
        ei = min(bins - 1, int(x1 / bin_w))
        for i in range(si, ei + 1):
            coverage[i] += h

    # A bin is "empty" if almost nothing covers it relative to content height.
    empty_threshold = content_height * 0.15
    empty = [c <= empty_threshold for c in coverage]

    # Find contiguous empty runs that are wide enough to be true column gutters,
    # ignoring the outer margins.
    # First, find the content x-range.
    content_left = min(b.bbox[0] for b in blocks)
    content_right = max(b.bbox[2] for b in blocks)
    left_bin = max(0, int(content_left / bin_w))
    right_bin = min(bins - 1, int(content_right / bin_w))

    min_gutter_frac = 0.02  # gutter must be >= 2% of page width
    min_gutter_bins = max(1, int(bins * min_gutter_frac))

    gutters: List[Tuple[int, int]] = []
    i = left_bin
    while i <= right_bin:
        if empty[i]:
            j = i
            while j <= right_bin and empty[j]:
                j += 1
            if (j - i) >= min_gutter_bins:
                gutters.append((i, j))
            i = j
        else:
            i += 1

    if not gutters:
        return [Column(content_left, content_right)]

    # Build columns as the content segments between gutters.
    cols: List[Column] = []
    seg_start = content_left
    for (gi, gj) in gutters:
        gutter_left = gi * bin_w
        gutter_right = gj * bin_w
        if gutter_left > seg_start:
            cols.append(Column(seg_start, gutter_left))
        seg_start = gutter_right
    if content_right > seg_start:
        cols.append(Column(seg_start, content_right))

    # Filter out slivers narrower than 8% of page width (noise).
    cols = [c for c in cols if c.width >= width * 0.08]
    return cols or [Column(content_left, content_right)]


def _assign_blocks_to_columns(blocks: List[TextBlock], columns: List[Column]) -> None:
    """Assign each text block to the column whose x-range best contains its
    horizontal center. This is what keeps left/right column content separate
    (spec section 6) instead of merging by reading order."""
    if len(columns) <= 1:
        for b in blocks:
            b.column = 0
        return
    for b in blocks:
        cx = (b.bbox[0] + b.bbox[2]) / 2.0
        best_idx, best_dist = 0, float("inf")
        for idx, col in enumerate(columns):
            if col.x0 <= cx <= col.x1:
                best_idx = idx
                break
            dist = min(abs(cx - col.x0), abs(cx - col.x1))
            if dist < best_dist:
                best_dist = dist
                best_idx = idx
        b.column = best_idx


# --------------------------------------------------------------------------- #
# Region detection (banner/sidebar/main from big rectangles)
# --------------------------------------------------------------------------- #
def _detect_regions(rects: List[Rectangle], width: float, height: float) -> List[Region]:
    """Detect high-level regions purely from rectangle geometry:
      * a wide filled rect near the top  -> 'header'/banner
      * a tall filled rect on one side   -> 'sidebar'
    Thresholds are RELATIVE to page size, never absolute coordinates."""
    regions: List[Region] = []
    for r in rects:
        if not r.fill or r.fill.upper() == "FFFFFF":
            continue
        x0, y0, x1, y1 = r.bbox
        w = x1 - x0
        h = y1 - y0
        if w <= 0 or h <= 0:
            continue
        wide = w >= width * 0.6
        tall = h >= height * 0.5
        near_top = y0 <= height * 0.12
        short = h <= height * 0.35

        if wide and short and near_top:
            regions.append(Region(kind="header", bbox=r.bbox, fill=r.fill))
        elif tall and w <= width * 0.5:
            side = "sidebar-left" if x0 <= width * 0.1 else ("sidebar-right" if x1 >= width * 0.9 else "band")
            regions.append(Region(kind="sidebar", bbox=r.bbox, fill=r.fill))
    return regions


# --------------------------------------------------------------------------- #
# Public API
# --------------------------------------------------------------------------- #
def analyze(input_pdf: str) -> LayoutDocument:
    import fitz  # PyMuPDF

    document = LayoutDocument()
    doc = fitz.open(input_pdf)
    try:
        for page in doc:
            rect = page.rect
            width = float(rect.width)
            height = float(rect.height)
            rotation = int(getattr(page, "rotation", 0) or 0)

            blocks = _extract_text_blocks(page)
            rects, lines = _extract_drawings(page)
            images = _extract_images(doc, page)

            margins = _detect_margins(blocks, images, width, height)
            columns = _detect_columns(blocks, width, height)
            _assign_blocks_to_columns(blocks, columns)
            regions = _detect_regions(rects, width, height)

            document.pages.append(
                Page(
                    width=width,
                    height=height,
                    rotation=rotation,
                    margins=margins,
                    columns=columns,
                    regions=regions,
                    text_blocks=blocks,
                    rectangles=rects,
                    lines=lines,
                    images=images,
                )
            )
    finally:
        doc.close()
    return document


# --------------------------------------------------------------------------- #
# CLI: quick inspection for development (spec section 28.D / 25)
# --------------------------------------------------------------------------- #
def _main(argv: List[str]) -> int:
    import json

    if len(argv) != 2:
        print("usage: pdf_analyzer.py <input_pdf>")
        return 1
    model = analyze(argv[1])
    summary = model.summary()
    print(json.dumps(summary, indent=2))
    # Per-page detail for the first few pages.
    for i, p in enumerate(model.pages[:3]):
        print(f"\n--- page {i + 1} ---")
        print(f"  size: {round(p.width)}x{round(p.height)}  landscape={p.is_landscape}  rotation={p.rotation}")
        if p.margins:
            m = p.margins
            print(f"  margins: L={round(m.left)} T={round(m.top)} R={round(m.right)} B={round(m.bottom)}")
        print(f"  columns ({len(p.columns)}):")
        for c in p.columns:
            print(f"    x0={round(c.x0)} x1={round(c.x1)} width={round(c.width)} ({round(100*c.width/p.width)}% of page)")
        print(f"  regions ({len(p.regions)}):")
        for rg in p.regions:
            bx = tuple(round(v) for v in rg.bbox)
            print(f"    {rg.kind} fill=#{rg.fill} bbox={bx}")
        print(f"  text_blocks={len(p.text_blocks)} rects={len(p.rectangles)} lines={len(p.lines)} images={len(p.images)}")
        # column distribution of blocks
        dist = {}
        for b in p.text_blocks:
            dist[b.column] = dist.get(b.column, 0) + 1
        print(f"  blocks per column: {dist}")
    return 0


if __name__ == "__main__":
    import sys
    raise SystemExit(_main(sys.argv))
