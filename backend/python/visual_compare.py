#!/usr/bin/env python3
"""Visual comparison / regression tool for PDFmesh (spec section 20/21).

Development-time only. Given an original PDF and a generated DOCX, it:

    1. renders the original PDF pages to PNG (PyMuPDF)
    2. converts the DOCX to PDF via LibreOffice headless
    3. renders the generated PDF pages to PNG (PyMuPDF)
    4. computes a per-page visual difference score (0..1, lower = closer)

This lets us tell whether a layout change actually improves fidelity, rather
than guessing. It is NOT part of the production request path.

Usage:
    python visual_compare.py <original.pdf> <generated.docx> [out_dir]

Also exposes:
    compare(original_pdf, generated_docx, out_dir=None) -> dict
    run_pipeline(original_pdf, out_dir) -> dict
        (analyze + build_docx + compare, for the regression harness)
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile
from typing import Dict, List, Optional


RENDER_DPI = 110


def _find_soffice() -> Optional[str]:
    override = os.environ.get("SOFFICE_BIN")
    if override and os.path.isfile(override):
        return override
    for name in ("soffice", "libreoffice", "soffice.bin"):
        found = shutil.which(name)
        if found:
            return found
    for path in (
        "/usr/bin/soffice",
        "/usr/bin/libreoffice",
        "/opt/libreoffice/program/soffice",
        "/snap/bin/libreoffice",
        r"C:\Program Files\LibreOffice\program\soffice.exe",
        r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
    ):
        if os.path.isfile(path):
            return path
    return None


def _docx_to_pdf(docx_path: str, out_dir: str) -> Optional[str]:
    soffice = _find_soffice()
    if not soffice:
        return None
    cmd = [
        soffice, "--headless", "--norestore", "--nolockcheck", "--nodefault",
        "--nofirststartwizard", "--nologo", "--convert-to", "pdf",
        "--outdir", out_dir, docx_path,
    ]
    try:
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                       timeout=120, check=False)
    except Exception:
        return None
    base = os.path.splitext(os.path.basename(docx_path))[0] + ".pdf"
    produced = os.path.join(out_dir, base)
    return produced if os.path.isfile(produced) else None


def _render_pdf_to_pngs(pdf_path: str, out_dir: str, prefix: str) -> List[str]:
    import fitz

    paths: List[str] = []
    doc = fitz.open(pdf_path)
    try:
        zoom = RENDER_DPI / 72.0
        matrix = fitz.Matrix(zoom, zoom)
        for i, page in enumerate(doc):
            pix = page.get_pixmap(matrix=matrix, alpha=False)
            out = os.path.join(out_dir, f"{prefix}_{i + 1:02d}.png")
            pix.save(out)
            paths.append(out)
    finally:
        doc.close()
    return paths


def _diff_score(png_a: str, png_b: str) -> float:
    """Mean absolute pixel difference (0..1) after resizing to a common size and
    converting to grayscale. Lower is closer. Uses Pillow + numpy."""
    from PIL import Image
    import numpy as np

    a = Image.open(png_a).convert("L")
    b = Image.open(png_b).convert("L")
    # Resize both to a common, modest resolution for a stable comparison.
    size = (600, 800)
    a = a.resize(size)
    b = b.resize(size)
    arr_a = np.asarray(a, dtype="float32")
    arr_b = np.asarray(b, dtype="float32")
    return float(np.mean(np.abs(arr_a - arr_b)) / 255.0)


def compare(original_pdf: str, generated_docx: str, out_dir: Optional[str] = None) -> Dict:
    """Compare an original PDF against a generated DOCX. Returns a dict with a
    per-page score list and an average. Degrades gracefully when optional deps
    (LibreOffice, Pillow) are missing."""
    result: Dict = {"ok": False, "reason": None, "pages": [], "average": None}

    cleanup = False
    if out_dir is None:
        out_dir = tempfile.mkdtemp(prefix="pdfmesh_vc_")
        cleanup = True
    os.makedirs(out_dir, exist_ok=True)

    try:
        gen_pdf = _docx_to_pdf(generated_docx, out_dir)
        if not gen_pdf:
            result["reason"] = "LibreOffice unavailable or DOCX->PDF failed"
            return result

        orig_pngs = _render_pdf_to_pngs(original_pdf, out_dir, "orig")
        gen_pngs = _render_pdf_to_pngs(gen_pdf, out_dir, "gen")

        try:
            import PIL  # noqa: F401
            import numpy  # noqa: F401
        except Exception:
            result["reason"] = "Pillow/numpy not installed; rendered PNGs only"
            result["orig_pngs"] = orig_pngs
            result["gen_pngs"] = gen_pngs
            return result

        n = min(len(orig_pngs), len(gen_pngs))
        scores = []
        for i in range(n):
            s = _diff_score(orig_pngs[i], gen_pngs[i])
            scores.append(s)
            result["pages"].append({"page": i + 1, "diff": round(s, 4)})
        result["orig_page_count"] = len(orig_pngs)
        result["gen_page_count"] = len(gen_pngs)
        if scores:
            result["average"] = round(sum(scores) / len(scores), 4)
        result["ok"] = True
        return result
    finally:
        if cleanup:
            # Leave artifacts only if caller supplied out_dir; else clean up.
            shutil.rmtree(out_dir, ignore_errors=True)


def run_pipeline(original_pdf: str, out_dir: str) -> Dict:
    """Analyze + build the DOCX with our engine, then compare. Used by the
    regression harness so a whole PDF set can be scored at once."""
    import pdf_analyzer
    import docx_builder

    os.makedirs(out_dir, exist_ok=True)
    base = os.path.splitext(os.path.basename(original_pdf))[0]
    generated_docx = os.path.join(out_dir, base + ".generated.docx")

    model = pdf_analyzer.analyze(original_pdf)
    summary = model.summary()
    docx_builder.build_docx(model, generated_docx)

    cmp = compare(original_pdf, generated_docx, out_dir=out_dir)
    return {"pdf": original_pdf, "summary": summary, "docx": generated_docx, "compare": cmp}


def _main(argv: List[str]) -> int:
    import json

    if len(argv) < 3:
        print("usage: visual_compare.py <original.pdf> <generated.docx> [out_dir]")
        return 1
    original_pdf = argv[1]
    generated_docx = argv[2]
    out_dir = argv[3] if len(argv) > 3 else None
    res = compare(original_pdf, generated_docx, out_dir=out_dir)
    print(json.dumps(res, indent=2))
    return 0 if res.get("ok") or res.get("reason") else 1


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv))
