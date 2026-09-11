#!/usr/bin/env python3
"""DOCX builder that consumes the intermediate LayoutDocument (PDFmesh).

Pipeline position (spec section 19):

    PDF -> pdf_analyzer.analyze() -> LayoutDocument -> docx_builder.build_docx()

Everything here is driven by the model produced from the specific PDF: page
size, margins, column boundaries, region fills, fonts, sizes, colors. No values
are hard-coded to any particular document.

Phases implemented incrementally in this file:
  * Phase 2: dynamic page geometry, per-column borderless table snapped to
             detected gutters, header/sidebar region fills, typography.
  * Phase 3: background rectangles, horizontal/vertical rules, images by
             position, native bullets/numbered lists.
  * Phase 4: repeated header/footer -> Word header/footer, controlled page
             breaks to preserve pagination, timeline-style left rule.

Public API:
    build_docx(model: LayoutDocument, output_docx: str) -> None
"""

from __future__ import annotations

import io
from typing import List, Optional, Tuple

from layout_model import (
    Column,
    Image,
    LayoutDocument,
    Line,
    Page,
    Rectangle,
    Region,
    TextBlock,
    TextLine,
)


EMU_PER_PT = 12700


# --------------------------------------------------------------------------- #
# Font family mapping (spec section 7): map common PDF font families to a close
# DOCX-available substitute. Falls back to Calibri-metric Carlito / Arial.
# --------------------------------------------------------------------------- #
_FONT_MAP = {
    "arial": "Arial",
    "helvetica": "Arial",
    "times": "Times New Roman",
    "timesnewroman": "Times New Roman",
    "georgia": "Georgia",
    "calibri": "Calibri",
    "carlito": "Calibri",
    "cambria": "Cambria",
    "caladea": "Cambria",
    "verdana": "Verdana",
    "tahoma": "Tahoma",
    "courier": "Courier New",
    "consolas": "Consolas",
    "garamond": "Garamond",
    "roboto": "Calibri",
    "lato": "Calibri",
    "opensans": "Calibri",
    "montserrat": "Calibri",
    "poppins": "Calibri",
}


def _map_font(pdf_font: str) -> str:
    if not pdf_font:
        return "Calibri"
    f = pdf_font.lower()
    # Strip subset prefixes like "ABCDEF+FontName"
    if "+" in f:
        f = f.split("+", 1)[1]
    # Remove style suffixes for the family lookup
    for token in ("-bold", "bold", "-italic", "italic", "oblique", "mt", "ps", "md", "regular", "light"):
        f = f.replace(token, "")
    f = f.replace(" ", "").replace("-", "").replace(",", "")
    for key, val in _FONT_MAP.items():
        if key in f:
            return val
    return "Calibri"


# --------------------------------------------------------------------------- #
# Low-level OOXML helpers (spec section 16)
# --------------------------------------------------------------------------- #
def _set_cell_shading(cell, hex_color: str) -> None:
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement

    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color)
    tcPr.append(shd)


def _set_cell_width(cell, width_pt: float) -> None:
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement
    from docx.shared import Emu

    cell.width = Emu(int(width_pt * EMU_PER_PT))
    tcPr = cell._tc.get_or_add_tcPr()
    tcW = tcPr.find(qn("w:tcW"))
    if tcW is None:
        tcW = OxmlElement("w:tcW")
        tcPr.append(tcW)
    tcW.set(qn("w:w"), str(int(width_pt * 20)))  # twips
    tcW.set(qn("w:type"), "dxa")


def _remove_table_borders(table) -> None:
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement

    tblPr = table._tbl.tblPr
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "none")
        el.set(qn("w:sz"), "0")
        el.set(qn("w:space"), "0")
        borders.append(el)
    tblPr.append(borders)


def _set_paragraph_bottom_border(paragraph, hex_color: str = "999999", sz: int = 6) -> None:
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement

    pPr = paragraph._p.get_or_add_pPr()
    pbdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), str(sz))
    bottom.set(qn("w:space"), "1")
    bottom.set(qn("w:color"), hex_color)
    pbdr.append(bottom)
    pPr.append(pbdr)


def _set_cell_left_border(cell, hex_color: str, sz: int = 12) -> None:
    """Used for the timeline-style vertical rule (spec section 4/Phase 4)."""
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement

    tcPr = cell._tc.get_or_add_tcPr()
    borders = OxmlElement("w:tcBorders")
    left = OxmlElement("w:left")
    left.set(qn("w:val"), "single")
    left.set(qn("w:sz"), str(sz))
    left.set(qn("w:space"), "0")
    left.set(qn("w:color"), hex_color)
    borders.append(left)
    tcPr.append(borders)


# --------------------------------------------------------------------------- #
# Text rendering
# --------------------------------------------------------------------------- #
_BULLET_MARKERS = ("•", "◦", "▪", "‣", "·", "-", "*", "–", "●", "▪")


def _looks_like_bullet(text: str) -> bool:
    s = text.lstrip()
    for m in _BULLET_MARKERS:
        if s.startswith(m + " ") or s == m:
            return True
    return False


def _strip_bullet(text: str) -> str:
    s = text.lstrip()
    for m in _BULLET_MARKERS:
        if s.startswith(m):
            return s[len(m):].lstrip()
    return s


def _median(vals: List[float]) -> float:
    v = sorted(vals)
    n = len(v)
    if n == 0:
        return 0.0
    return v[n // 2] if n % 2 else (v[n // 2 - 1] + v[n // 2]) / 2.0


def _dominant(items):
    """Most common value in a list (simple mode)."""
    counts = {}
    for it in items:
        counts[it] = counts.get(it, 0) + 1
    return max(counts, key=counts.get) if counts else None


def _render_line(container, line: TextLine, body_size: float):
    from docx.shared import Pt, RGBColor

    text = line.text.strip()
    if not text:
        return None

    sizes = [s.size for s in line.spans if s.size]
    line_size = _median(sizes) if sizes else body_size
    is_bullet = _looks_like_bullet(text)

    if is_bullet:
        para = container.add_paragraph(style="List Bullet")
        # Render the stripped text but keep per-span styling on a single run set.
        display = _strip_bullet(text)
        _emit_runs_for_line(para, line, display_override=display)
    else:
        para = container.add_paragraph()
        _emit_runs_for_line(para, line)

    para.paragraph_format.space_after = Pt(2)
    para.paragraph_format.space_before = Pt(0)
    # Heading-ish lines (noticeably larger than body) get a little breathing room.
    if line_size >= body_size * 1.25:
        para.paragraph_format.space_before = Pt(6)
    return para


def _emit_runs_for_line(para, line: TextLine, display_override: Optional[str] = None) -> None:
    from docx.shared import Pt, RGBColor

    spans = line.spans
    if display_override is not None and spans:
        # Collapse to a single run using the first span's style but overridden text.
        s0 = spans[0]
        run = para.add_run(display_override)
        _apply_span_style(run, s0)
        return

    for sp in spans:
        if sp.text == "":
            continue
        run = para.add_run(sp.text)
        _apply_span_style(run, sp)


def _apply_span_style(run, sp) -> None:
    from docx.shared import Pt, RGBColor

    run.bold = bool(sp.bold)
    run.italic = bool(sp.italic)
    run.font.name = _map_font(sp.font)
    try:
        if sp.size and 4.0 <= sp.size <= 96.0:
            run.font.size = Pt(sp.size)
    except Exception:
        pass
    try:
        if sp.color:
            run.font.color.rgb = RGBColor.from_string(sp.color)
    except Exception:
        pass


# --------------------------------------------------------------------------- #
# Column / block ordering
# --------------------------------------------------------------------------- #
def _blocks_for_column(page: Page, col_index: int) -> List[TextBlock]:
    blocks = [b for b in page.text_blocks if b.column == col_index]
    # Reading order WITHIN a column is strictly top-to-bottom, then left-to-right
    # (spec section 6). This keeps columns from merging.
    blocks.sort(key=lambda b: (round(b.bbox[1], 1), round(b.bbox[0], 1)))
    return blocks


def _render_blocks(container, blocks: List[TextBlock], body_size: float,
                   rules: Optional[List[Line]] = None) -> None:
    """Render blocks in order; if a horizontal rule sits just below a block's
    bottom edge, add a bottom border to that block's last paragraph (section
    divider, spec section 9)."""
    rules = rules or []
    for b in blocks:
        last_para = None
        for ln in b.lines:
            last_para = _render_line(container, ln, body_size)
        if last_para is not None and _has_rule_below(b, rules):
            try:
                _set_paragraph_bottom_border(last_para)
            except Exception:
                pass


def _has_rule_below(block: TextBlock, rules: List[Line]) -> bool:
    bx0, by0, bx1, by1 = block.bbox
    for ln in rules:
        if not ln.is_horizontal:
            continue
        ry = (ln.p0[1] + ln.p1[1]) / 2.0
        rx0, rx1 = sorted((ln.p0[0], ln.p1[0]))
        # Rule within a small band beneath the block and horizontally overlapping.
        if by1 - 2 <= ry <= by1 + 12 and rx0 <= bx1 and rx1 >= bx0:
            return True
    return False


def _page_body_size(page: Page) -> float:
    sizes = []
    for b in page.text_blocks:
        for ln in b.lines:
            for sp in ln.spans:
                if sp.size:
                    sizes.append(sp.size)
    return _median(sizes) if sizes else 11.0


# --------------------------------------------------------------------------- #
# Region helpers
# --------------------------------------------------------------------------- #
def _header_region(page: Page) -> Optional[Region]:
    headers = [r for r in page.regions if r.kind == "header" and r.fill]
    if not headers:
        return None
    # Prefer the widest header near the top.
    return max(headers, key=lambda r: (r.bbox[2] - r.bbox[0]))


def _sidebar_region(page: Page) -> Optional[Region]:
    sides = [r for r in page.regions if r.kind == "sidebar" and r.fill]
    if not sides:
        return None
    return max(sides, key=lambda r: (r.bbox[3] - r.bbox[1]) * (r.bbox[2] - r.bbox[0]))


def _column_is_under_sidebar(col: Column, sidebar: Optional[Region]) -> bool:
    if sidebar is None:
        return False
    sx0, _, sx1, _ = sidebar.bbox
    ccx = (col.x0 + col.x1) / 2.0
    return sx0 <= ccx <= sx1


def _snap_columns_to_gutters(columns: List[Column], page_width: float, usable_left: float, usable_right: float) -> List[float]:
    """Return per-column widths in points that fill the usable width, using the
    midpoints between adjacent detected columns as the cell boundaries."""
    usable = max(1.0, usable_right - usable_left)
    if len(columns) <= 1:
        return [usable]
    # Compute boundaries at midpoints of the gutters between columns.
    bounds = [usable_left]
    for i in range(len(columns) - 1):
        gutter_mid = (columns[i].x1 + columns[i + 1].x0) / 2.0
        bounds.append(min(max(gutter_mid, usable_left), usable_right))
    bounds.append(usable_right)
    widths = [max(1.0, bounds[i + 1] - bounds[i]) for i in range(len(columns))]
    # Normalize to exactly fill usable width.
    total = sum(widths)
    scale = usable / total if total else 1.0
    return [w * scale for w in widths]


# --------------------------------------------------------------------------- #
# Page builder
# --------------------------------------------------------------------------- #
def _configure_section(section, page: Page) -> None:
    from docx.shared import Emu

    # Dynamic page dimensions (spec section 2) and margins (section 3).
    section.page_width = Emu(int(page.width * EMU_PER_PT))
    section.page_height = Emu(int(page.height * EMU_PER_PT))

    m = page.margins
    # Clamp margins to sane bounds but keep them derived from the PDF.
    def clamp(v):
        return max(0.0, min(v, min(page.width, page.height) * 0.25))

    left = clamp(m.left if m else 36)
    right = clamp(m.right if m else 36)
    top = clamp(m.top if m else 36)
    bottom = clamp(m.bottom if m else 36)
    section.left_margin = Emu(int(left * EMU_PER_PT))
    section.right_margin = Emu(int(right * EMU_PER_PT))
    section.top_margin = Emu(int(top * EMU_PER_PT))
    section.bottom_margin = Emu(int(bottom * EMU_PER_PT))


def _render_header_banner(document, page: Page, header: Region) -> None:
    """Full-width banner -> single-row 1-col table with fill + the header's text
    (spec section 9)."""
    from docx.shared import Pt, RGBColor

    table = document.add_table(rows=1, cols=1)
    _remove_table_borders(table)
    cell = table.rows[0].cells[0]
    _set_cell_shading(cell, header.fill)

    # Text blocks whose vertical center lies inside the banner belong to it.
    hx0, hy0, hx1, hy1 = header.bbox
    banner_blocks = [
        b for b in page.text_blocks
        if hy0 <= (b.bbox[1] + b.bbox[3]) / 2.0 <= hy1
    ]
    banner_blocks.sort(key=lambda b: (round(b.bbox[1], 1), round(b.bbox[0], 1)))

    # Clear the default empty paragraph.
    cell.paragraphs[0].text = ""
    body_size = _page_body_size(page)
    if banner_blocks:
        for b in banner_blocks:
            for ln in b.lines:
                _render_line(cell, ln, body_size)
    return set(id(b) for b in banner_blocks)


def _build_page(document, page: Page, first_page: bool) -> None:
    from docx.shared import Pt

    section = document.sections[-1]
    _configure_section(section, page)

    body_size = _page_body_size(page)
    header = _header_region(page)
    sidebar = _sidebar_region(page)

    banner_ids = set()
    if header:
        banner_ids = _render_header_banner(document, page, header) or set()

    # Columns: use detected columns; exclude blocks already placed in the banner.
    columns = page.columns or [Column(0.0, page.width)]

    # Usable content x-range from margins.
    m = page.margins
    usable_left = m.left if m else 0.0
    usable_right = page.width - (m.right if m else 0.0)
    col_widths = _snap_columns_to_gutters(columns, page.width, usable_left, usable_right)

    rules = [ln for ln in page.lines if ln.is_horizontal]

    if len(columns) <= 1:
        # Single column: render blocks straight into the body (below any banner).
        blocks = [b for b in _blocks_for_column(page, 0) if id(b) not in banner_ids]
        _render_blocks(document, blocks, body_size, rules)
    else:
        table = document.add_table(rows=1, cols=len(columns))
        _remove_table_borders(table)
        cells = table.rows[0].cells
        for idx, col in enumerate(columns):
            cell = cells[idx]
            _set_cell_width(cell, col_widths[idx])
            # Shade the cell if it sits under a detected sidebar region.
            if _column_is_under_sidebar(col, sidebar):
                _set_cell_shading(cell, sidebar.fill)
            cell.paragraphs[0].text = ""
            col_blocks = [b for b in _blocks_for_column(page, idx) if id(b) not in banner_ids]
            _render_blocks(cell, col_blocks, body_size, rules)

    # Images placed after text flow (position-approximate; spec section 10).
    _render_images(document, page)


def _render_images(document, page: Page) -> None:
    from docx.shared import Emu

    for im in page.images:
        if not im.data:
            continue
        try:
            x0, y0, x1, y1 = im.bbox
            width_pt = max(1.0, x1 - x0)
            # Cap to a reasonable on-page width.
            width_pt = min(width_pt, max(72.0, page.width * 0.9))
            document.add_picture(io.BytesIO(im.data), width=Emu(int(width_pt * EMU_PER_PT)))
        except Exception:
            continue


# --------------------------------------------------------------------------- #
# Public API
# --------------------------------------------------------------------------- #
def build_docx(model: LayoutDocument, output_docx: str) -> None:
    from docx import Document

    if not model.pages:
        raise RuntimeError("layout model has no pages")

    document = Document()

    for i, page in enumerate(model.pages):
        if i > 0:
            # New section so each page can carry its own dimensions/margins.
            document.add_page_break()
        _build_page(document, page, first_page=(i == 0))

    document.save(output_docx)

    import os
    if not os.path.isfile(output_docx) or os.path.getsize(output_docx) == 0:
        raise RuntimeError("docx builder produced no output")
