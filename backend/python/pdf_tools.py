#!/usr/bin/env python3
"""PDFmesh lossless PDF utility tools (merge / split / pdf-to-jpg / jpg-to-pdf).

Invoked by the Node.js backend as:

    python pdf_tools.py <op> <output_path> <input_path> [<input_path> ...]

where <op> is one of:
    merge        Concatenate multiple PDFs into one PDF (output: .pdf)
    split        Split one PDF into one PDF per page (output: .zip)
    pdf-to-jpg   Render each PDF page to a JPG image (output: .zip)
    jpg-to-pdf   Combine images into a single PDF, one image per page (output: .pdf)
    compress     Reduce PDF file size (output: .pdf)
    word-to-pdf  Render a Word document (.doc/.docx) to PDF via LibreOffice (output: .pdf)

The PDF-native operations are lossless/faithful (pages and images are copied or
rendered directly). word-to-pdf uses LibreOffice headless, which renders the
document with full layout fidelity.

Uses PyMuPDF (fitz) + the Python standard library, and (for word-to-pdf) the
system LibreOffice binary. Exit codes mirror the existing converter contract:

    0  success
    1  usage / unexpected error
    2  invalid or unreadable input
    3  password protected input
"""

import io
import os
import shutil
import subprocess
import sys
import tempfile
import zipfile


PDF_MAGIC = b"%PDF-"
RENDER_DPI = 150  # good quality for pdf-to-jpg without huge files


def _fail(code: int, message: str) -> None:
    print(message, file=sys.stderr)
    sys.exit(code)


def _entry_base(input_path: str) -> str:
    """Base filename used for entries inside output ZIPs. Prefer the caller's
    original name (via PDFMESH_BASENAME) over the internal temp token."""
    import re

    override = os.environ.get("PDFMESH_BASENAME", "").strip()
    candidate = override or os.path.splitext(os.path.basename(input_path))[0]
    candidate = re.sub(r"[^\w.-]+", "_", candidate).strip("_")
    return candidate[:80] or "document"


def _looks_like_pdf(path: str) -> bool:
    try:
        with open(path, "rb") as fh:
            return fh.read(5) == PDF_MAGIC
    except OSError:
        return False


def _open_pdf(path):
    import fitz

    if not os.path.isfile(path):
        _fail(2, f"input file does not exist: {path}")
    if not _looks_like_pdf(path):
        _fail(2, f"not a valid PDF: {os.path.basename(path)}")
    try:
        doc = fitz.open(path)
    except Exception as exc:  # noqa: BLE001
        text = str(exc).lower()
        if "password" in text or "encrypt" in text:
            _fail(3, "password protected PDF")
        _fail(2, f"could not open PDF: {exc}")
    if getattr(doc, "needs_pass", False) or getattr(doc, "is_encrypted", False):
        # Try empty password; if it still needs one, bail.
        try:
            if not doc.authenticate(""):
                _fail(3, "password protected PDF")
        except Exception:
            _fail(3, "password protected PDF")
    return doc


# --------------------------------------------------------------------------- #
# Operations
# --------------------------------------------------------------------------- #
def op_merge(output_path: str, inputs: list) -> None:
    """Concatenate multiple PDFs into a single PDF, preserving pages exactly."""
    import fitz

    if not inputs:
        _fail(1, "merge requires at least one input PDF")

    out = fitz.open()
    try:
        for path in inputs:
            src = _open_pdf(path)
            try:
                out.insert_pdf(src)
            finally:
                src.close()
        if out.page_count == 0:
            _fail(2, "no pages to merge")
        out.save(output_path, garbage=3, deflate=True)
    finally:
        out.close()


def op_split(output_path: str, inputs: list) -> None:
    """Split a single PDF into one PDF per page, packaged as a ZIP."""
    import fitz

    if len(inputs) != 1:
        _fail(1, "split requires exactly one input PDF")

    src = _open_pdf(inputs[0])
    base = _entry_base(inputs[0])
    try:
        n = src.page_count
        if n == 0:
            _fail(2, "the PDF has no pages")
        with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
            width = max(2, len(str(n)))
            for i in range(n):
                single = fitz.open()
                try:
                    single.insert_pdf(src, from_page=i, to_page=i)
                    buf = single.tobytes(garbage=3, deflate=True)
                finally:
                    single.close()
                zf.writestr(f"{base}_page_{i + 1:0{width}d}.pdf", buf)
    finally:
        src.close()


def op_pdf_to_jpg(output_path: str, inputs: list) -> None:
    """Render each PDF page to a JPG, packaged as a ZIP."""
    import fitz

    if len(inputs) != 1:
        _fail(1, "pdf-to-jpg requires exactly one input PDF")

    src = _open_pdf(inputs[0])
    base = _entry_base(inputs[0])
    zoom = RENDER_DPI / 72.0
    matrix = fitz.Matrix(zoom, zoom)
    try:
        n = src.page_count
        if n == 0:
            _fail(2, "the PDF has no pages")
        with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
            width = max(2, len(str(n)))
            for i in range(n):
                page = src[i]
                pix = page.get_pixmap(matrix=matrix, alpha=False)
                jpg_bytes = pix.tobytes(output="jpg", jpg_quality=90)
                zf.writestr(f"{base}_page_{i + 1:0{width}d}.jpg", jpg_bytes)
    finally:
        src.close()


def op_jpg_to_pdf(output_path: str, inputs: list) -> None:
    """Combine images (JPG/PNG/...) into a single PDF, one image per page.

    Each page is sized to the image so there is no cropping or distortion."""
    import fitz

    if not inputs:
        _fail(1, "jpg-to-pdf requires at least one input image")

    out = fitz.open()
    try:
        added = 0
        for path in inputs:
            if not os.path.isfile(path):
                _fail(2, f"input file does not exist: {path}")
            try:
                img = fitz.open(path)
            except Exception as exc:  # noqa: BLE001
                _fail(2, f"could not read image {os.path.basename(path)}: {exc}")
            try:
                # Convert the single-image document to a one-page PDF, then append.
                pdf_bytes = img.convert_to_pdf()
            finally:
                img.close()
            img_pdf = fitz.open("pdf", pdf_bytes)
            try:
                out.insert_pdf(img_pdf)
                added += 1
            finally:
                img_pdf.close()
        if added == 0:
            _fail(2, "no images could be added")
        out.save(output_path, garbage=3, deflate=True)
    finally:
        out.close()


def op_compress(output_path: str, inputs: list) -> None:
    """Reduce PDF file size. Most PDF weight is in embedded raster images, so we
    downsample + re-encode images as JPEG according to a level, then rewrite the
    PDF with maximum garbage collection and stream deflation.

    Level comes from PDFMESH_COMPRESS_LEVEL (extreme | recommended | less);
    defaults to 'recommended'. Falls back to a lossless clean-up if image
    recompression is unavailable, so it never makes the file larger.
    """
    import fitz

    if len(inputs) != 1:
        _fail(1, "compress requires exactly one input PDF")

    level = os.environ.get("PDFMESH_COMPRESS_LEVEL", "recommended").strip().lower()
    # (max image dimension in px, JPEG quality)
    presets = {
        "extreme": (1000, 45),
        "recommended": (1600, 65),
        "less": (2200, 80),
    }
    max_dim, quality = presets.get(level, presets["recommended"])

    src = _open_pdf(inputs[0])
    try:
        if src.page_count == 0:
            _fail(2, "the PDF has no pages")

        # Recompress images in place where it actually saves space.
        try:
            _recompress_images(src, fitz, max_dim, quality)
        except Exception as exc:  # noqa: BLE001 - fall back to lossless clean-up
            print(f"image recompression skipped: {exc}", file=sys.stderr)

        # Save with aggressive clean-up. These flags shrink even text-only PDFs.
        src.save(
            output_path,
            garbage=4,
            deflate=True,
            deflate_images=True,
            deflate_fonts=True,
            clean=True,
        )
    finally:
        src.close()

    # Safety net: if somehow the "compressed" file is larger than the original,
    # keep the smaller original instead.
    try:
        if os.path.getsize(output_path) > os.path.getsize(inputs[0]) > 0:
            import shutil
            shutil.copyfile(inputs[0], output_path)
    except OSError:
        pass


def _recompress_images(doc, fitz, max_dim: int, quality: int) -> None:
    """Downsample large images and re-encode them as JPEG to shrink the PDF."""
    seen = set()
    for page_index in range(doc.page_count):
        for img in doc.get_page_images(page_index, full=True):
            xref = img[0]
            if xref in seen:
                continue
            seen.add(xref)
            try:
                info = doc.extract_image(xref)
            except Exception:
                continue
            raw = info.get("image")
            if not raw:
                continue

            pix = fitz.Pixmap(raw)
            # Skip tiny images and masks; recompressing them rarely helps.
            if pix.width <= 8 or pix.height <= 8:
                continue

            # Ensure RGB (drop alpha / convert CMYK) for JPEG encoding.
            if pix.n >= 5 or pix.alpha:
                pix = fitz.Pixmap(fitz.csRGB, pix)

            scale = min(1.0, max_dim / float(max(pix.width, pix.height)))
            if scale < 1.0:
                new_w = max(1, int(pix.width * scale))
                new_h = max(1, int(pix.height * scale))
                # PyMuPDF >= 1.24 supports Pixmap scaling via shrink/factor.
                try:
                    pix = fitz.Pixmap(pix, new_w, new_h)  # resample
                except Exception:
                    pass

            try:
                new_bytes = pix.tobytes(output="jpg", jpg_quality=quality)
            except Exception:
                continue

            # Only replace if we actually saved space.
            if len(new_bytes) < len(raw):
                try:
                    doc.update_stream(xref, new_bytes, new=False)
                    # Mark the image stream as DCT (JPEG) encoded.
                    doc.xref_set_key(xref, "Filter", "/DCTDecode")
                    doc.xref_set_key(xref, "ColorSpace", "/DeviceRGB")
                    doc.xref_set_key(xref, "BitsPerComponent", "8")
                    doc.xref_set_key(xref, "Width", str(pix.width))
                    doc.xref_set_key(xref, "Height", str(pix.height))
                    if doc.xref_get_key(xref, "SMask")[0] != "null":
                        doc.xref_set_key(xref, "SMask", "null")
                except Exception:
                    continue


def _find_soffice() -> str:
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
    _fail(1, "LibreOffice (soffice) is not installed or not on PATH")


def op_word_to_pdf(output_path: str, inputs: list) -> None:
    """Render a Word document (.doc/.docx/.odt/.rtf) to PDF via LibreOffice
    headless. LibreOffice is the layout source of truth for the DOCX, so the PDF
    matches the document's layout with high fidelity."""
    if len(inputs) != 1:
        _fail(1, "word-to-pdf requires exactly one input document")

    input_doc = inputs[0]
    if not os.path.isfile(input_doc):
        _fail(2, f"input file does not exist: {input_doc}")

    soffice = _find_soffice()

    with tempfile.TemporaryDirectory(prefix="pdfmesh_w2p_") as work_dir:
        profile_dir = os.path.join(work_dir, "profile")
        out_dir = os.path.join(work_dir, "out")
        os.makedirs(profile_dir, exist_ok=True)
        os.makedirs(out_dir, exist_ok=True)
        profile_uri = "file:///" + profile_dir.lstrip("/").replace(os.sep, "/")

        cmd = [
            soffice,
            "--headless",
            "--norestore",
            "--nolockcheck",
            "--nodefault",
            "--nofirststartwizard",
            "--nologo",
            f"-env:UserInstallation={profile_uri}",
            "--convert-to",
            "pdf:writer_pdf_Export",
            "--outdir",
            out_dir,
            input_doc,
        ]

        try:
            proc = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=110,
                check=False,
            )
        except subprocess.TimeoutExpired:
            _fail(1, "word-to-pdf timed out")
            return
        except OSError as exc:
            _fail(1, f"failed to start LibreOffice: {exc}")
            return

        stdout_text = (proc.stdout or b"").decode("utf-8", "replace")
        stderr_text = (proc.stderr or b"").decode("utf-8", "replace")
        blob = (stderr_text + "\n" + stdout_text).lower()

        if proc.returncode != 0:
            if "password" in blob or "encrypt" in blob:
                _fail(3, "password protected document")
            _fail(2, f"could not convert the document: {stderr_text.strip()}")

        produced = None
        for name in os.listdir(out_dir):
            if name.lower().endswith(".pdf"):
                produced = os.path.join(out_dir, name)
                break

        if produced is None or not os.path.isfile(produced) or os.path.getsize(produced) == 0:
            if "password" in blob or "encrypt" in blob:
                _fail(3, "password protected document")
            _fail(2, "conversion produced no output; the document may be invalid or protected")
            return

        try:
            shutil.move(produced, output_path)
        except OSError:
            shutil.copyfile(produced, output_path)


_OPS = {
    "merge": op_merge,
    "split": op_split,
    "pdf-to-jpg": op_pdf_to_jpg,
    "jpg-to-pdf": op_jpg_to_pdf,
    "compress": op_compress,
    "word-to-pdf": op_word_to_pdf,
}


def main() -> None:
    if len(sys.argv) < 4:
        _fail(1, "usage: pdf_tools.py <op> <output_path> <input_path> [<input_path> ...]")

    op = sys.argv[1]
    output_path = sys.argv[2]
    inputs = sys.argv[3:]

    fn = _OPS.get(op)
    if fn is None:
        _fail(1, f"unknown op: {op}")

    try:
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        fn(output_path, inputs)
    except SystemExit:
        raise
    except Exception as exc:  # noqa: BLE001
        _fail(1, f"{op} failed: {exc}")

    if not os.path.isfile(output_path) or os.path.getsize(output_path) == 0:
        _fail(1, f"{op} produced no output")
    sys.exit(0)


if __name__ == "__main__":
    main()
