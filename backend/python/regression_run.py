#!/usr/bin/env python3
"""Regression harness for PDFmesh layout reconstruction (spec section 5/21).

Runs the analyze + build_docx + visual-compare pipeline over every PDF in a
directory and prints a fidelity table. Development-time only.

Usage:
    python regression_run.py <pdf_dir> [out_dir]

Populate <pdf_dir> with a representative set (spec section 5):
    single-column resume, two-column resume, three-column doc, table-heavy doc,
    invoice, brochure, report, image-heavy PDF, different page sizes, landscape.
"""

from __future__ import annotations

import os
import sys
from typing import List

import visual_compare


def main(argv: List[str]) -> int:
    if len(argv) < 2:
        print("usage: regression_run.py <pdf_dir> [out_dir]")
        return 1
    pdf_dir = argv[1]
    out_dir = argv[2] if len(argv) > 2 else os.path.join(pdf_dir, "_out")
    os.makedirs(out_dir, exist_ok=True)

    pdfs = sorted(
        os.path.join(pdf_dir, f)
        for f in os.listdir(pdf_dir)
        if f.lower().endswith(".pdf")
    )
    if not pdfs:
        print(f"no PDFs found in {pdf_dir}")
        return 1

    print(f"{'file':40s}  {'pages':>5s}  {'cols':>10s}  {'avg_diff':>8s}")
    print("-" * 72)
    for pdf in pdfs:
        try:
            res = visual_compare.run_pipeline(pdf, out_dir)
            summ = res["summary"]
            cmp = res["compare"]
            name = os.path.basename(pdf)[:40]
            pages = summ.get("pages")
            cols = str(summ.get("columns_per_page"))[:10]
            avg = cmp.get("average")
            avg_s = f"{avg:.4f}" if isinstance(avg, (int, float)) else str(cmp.get("reason"))[:20]
            print(f"{name:40s}  {pages:>5}  {cols:>10s}  {avg_s:>8s}")
        except Exception as exc:  # noqa: BLE001
            print(f"{os.path.basename(pdf)[:40]:40s}  ERROR: {exc}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
