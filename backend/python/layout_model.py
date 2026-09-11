#!/usr/bin/env python3
"""Intermediate layout representation for PDFmesh (spec section 19).

The PDF analyzer produces these dataclasses; a DOCX builder later consumes them.
Keeping analysis and generation separate (PDF -> Analyzer -> Model -> Builder)
makes the system maintainable and testable.

Nothing here hard-codes page sizes, margins, or column positions. Every value is
supplied by the analyzer from the specific PDF being processed. Coordinates use
the PDF coordinate space in points (origin top-left, y increasing downward), the
same convention PyMuPDF uses for page.rect and block bboxes.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional, Tuple


BBox = Tuple[float, float, float, float]  # (x0, y0, x1, y1) in PDF points


@dataclass
class TextSpan:
    """A run of text sharing one font/size/color (PyMuPDF span)."""
    text: str
    bbox: BBox
    font: str
    size: float
    color: str            # "RRGGBB"
    bold: bool
    italic: bool


@dataclass
class TextLine:
    """A visual line made of spans that share a baseline."""
    bbox: BBox
    spans: List[TextSpan] = field(default_factory=list)

    @property
    def text(self) -> str:
        return "".join(s.text for s in self.spans)


@dataclass
class TextBlock:
    """A PyMuPDF text block (a paragraph-ish grouping of lines)."""
    bbox: BBox
    lines: List[TextLine] = field(default_factory=list)
    column: int = 0       # column index assigned during region detection

    @property
    def text(self) -> str:
        return "\n".join(ln.text for ln in self.lines)


@dataclass
class Rectangle:
    """A filled or stroked rectangle (background box, banner, sidebar, rule)."""
    bbox: BBox
    fill: Optional[str] = None     # "RRGGBB" or None
    stroke: Optional[str] = None   # "RRGGBB" or None
    width: float = 0.0             # stroke width in points

    @property
    def area(self) -> float:
        x0, y0, x1, y1 = self.bbox
        return abs((x1 - x0) * (y1 - y0))


@dataclass
class Line:
    """A thin horizontal or vertical rule."""
    p0: Tuple[float, float]
    p1: Tuple[float, float]
    color: Optional[str] = None
    width: float = 0.0

    @property
    def is_horizontal(self) -> bool:
        return abs(self.p0[1] - self.p1[1]) <= 1.5

    @property
    def is_vertical(self) -> bool:
        return abs(self.p0[0] - self.p1[0]) <= 1.5


@dataclass
class Image:
    """An embedded raster image with position and bytes."""
    bbox: BBox
    ext: str = "png"
    data: bytes = b""


@dataclass
class Column:
    """A detected vertical column region on a page."""
    x0: float
    x1: float

    @property
    def width(self) -> float:
        return self.x1 - self.x0


@dataclass
class Region:
    """A high-level geometric region (header/footer/sidebar/main/...)."""
    kind: str                      # 'header' | 'footer' | 'sidebar' | 'main' | 'band'
    bbox: BBox
    fill: Optional[str] = None


@dataclass
class Margins:
    left: float
    top: float
    right: float
    bottom: float


@dataclass
class Page:
    width: float
    height: float
    rotation: int = 0
    margins: Optional[Margins] = None
    columns: List[Column] = field(default_factory=list)
    regions: List[Region] = field(default_factory=list)
    text_blocks: List[TextBlock] = field(default_factory=list)
    rectangles: List[Rectangle] = field(default_factory=list)
    lines: List[Line] = field(default_factory=list)
    images: List[Image] = field(default_factory=list)

    @property
    def is_landscape(self) -> bool:
        return self.width > self.height


@dataclass
class LayoutDocument:
    pages: List[Page] = field(default_factory=list)

    def summary(self) -> dict:
        """Compact, log-friendly summary (spec section 25)."""
        return {
            "pages": len(self.pages),
            "page_sizes": [f"{round(p.width)}x{round(p.height)}" for p in self.pages],
            "columns_per_page": [len(p.columns) for p in self.pages],
            "regions_per_page": [len(p.regions) for p in self.pages],
            "text_blocks_per_page": [len(p.text_blocks) for p in self.pages],
            "rects_per_page": [len(p.rectangles) for p in self.pages],
            "lines_per_page": [len(p.lines) for p in self.pages],
            "images_per_page": [len(p.images) for p in self.pages],
        }
