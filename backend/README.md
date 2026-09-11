# PDFmesh Backend

Node.js + Express API that converts PDF files to DOCX. Conversion is performed by
`python/converter.py`, which selects the best engine per file.

## Conversion engine (tiered strategy)

- Endpoint: `POST /api/pdf-to-docx` (multipart form field: `file`).
- The Node layer writes the upload to a temp file and runs:
  `python converter.py <input_pdf> <output_docx>`

`converter.py` picks a path based on the PDF's script, and falls through tiers
if an engine fails (each tier raises on failure):

**English / mixed-content PDFs (best visual fidelity, all free):**

1. **Dynamic layout reconstruction** (`pdf_analyzer.py` + `docx_builder.py`,
   PyMuPDF + python-docx) — analyzes the PDF geometry into an intermediate
   `LayoutDocument` (page size, margins, columns, regions, text blocks,
   rectangles, lines, images), then builds a DOCX that reproduces: dynamic page
   size / margins, multi-column layout via borderless tables snapped to detected
   gutters, header banner and shaded sidebar regions, per-span font family /
   size / weight / color, native Word bullets, and section-divider rules. No
   values are hard-coded to any specific PDF.
2. **`pdf2docx-plus`** — good table / image / block layout reconstruction.
3. **LibreOffice headless** — last-resort fallback.

**Indic-language PDFs (Telugu, Hindi/Marathi, Kannada, Tamil, ...):**

1. **LibreOffice headless** — shapes complex scripts correctly.
2. **`pdf2docx-plus`** — fallback.

Script detection uses PyMuPDF (`fitz`). Set `DISABLE_LAYOUT_REBUILD=1` to skip
tier 1 and go straight to `pdf2docx-plus` for English/mixed content.

Requirements:

- The Python interpreter is resolved from `backend/python/venv` (or the
  `PYTHON_BIN` env override) — keep the venv in place.
- Install the pip engines into the venv (see below).
- Keep **LibreOffice** installed as a system package for the fallback path.

### Install / reinstall the pip engines (in the venv)

```bash
# Linux — install everything converter.py needs
backend/python/venv/bin/pip install \
  pdfplumber python-docx \
  "pdf2docx-plus @ git+https://github.com/mithunvoe/pdf2docx-plus.git" PyMuPDF

# or simply:
backend/python/venv/bin/pip install -r backend/python/requirements.txt
```

## Server requirements

These are **system** installs on the VPS (not pip):

1. **LibreOffice** — provides the `soffice` binary used by `converter.py`.
2. **Fonts for every script you need** — without the right fonts, text can
   render as boxes even when the engine is correct. Noto and Lohit cover the
   major Indic scripts.

### Ubuntu / Debian

```bash
sudo apt-get update
# LibreOffice (Writer core is enough for PDF -> DOCX)
sudo apt-get install -y libreoffice-core libreoffice-writer

# Fonts: broad Indic + Latin coverage
sudo apt-get install -y \
  fonts-noto \
  fonts-noto-core \
  fonts-noto-cjk \
  fonts-indic \
  fonts-lohit-telu fonts-lohit-deva fonts-lohit-knda \
  fonts-lohit-taml fonts-lohit-guru fonts-lohit-gujr fonts-lohit-beng

# Common Latin fonts — this is the SINGLE biggest free layout win. When the
# server has the same (or metric-compatible) fonts the PDF used, text stops
# reflowing/shifting during conversion.
#   - fonts-liberation / fonts-dejavu: Arial/Times/Courier metric-compatibles
#   - fonts-crosextra-carlito / fonts-crosextra-caladea: Calibri/Cambria metrics
sudo apt-get install -y \
  fonts-liberation fonts-liberation2 fonts-dejavu \
  fonts-crosextra-carlito fonts-crosextra-caladea

# Optional: the real Microsoft core fonts (Arial, Times New Roman, etc.).
# Requires accepting the EULA; enable 'contrib multiverse' first if needed.
# sudo apt-get install -y ttf-mscorefonts-installer

# Refresh the font cache so LibreOffice sees the new fonts
sudo fc-cache -f -v
```

Verify LibreOffice is on PATH:

```bash
soffice --version
```

If `soffice` is not on PATH, set an override in `backend/.env`:

```
SOFFICE_BIN=/usr/bin/soffice
```

### Optional environment variables

- `SOFFICE_BIN` — absolute path to the LibreOffice binary if it is not on PATH.
- `PYTHON_BIN` — absolute path to a Python interpreter if you are not using the
  `backend/python/venv` virtual environment.
- `DISABLE_LAYOUT_REBUILD` — set to `1` to skip the tier-1 structured rebuild
  for English/mixed PDFs and use `pdf2docx-plus` directly (a quick way to A/B
  the two on your real documents).

## Exit codes (converter.py -> Node mapping)

| Exit | Meaning                | Client message                       |
| ---- | ---------------------- | ------------------------------------ |
| 0    | success                | (returns the DOCX)                   |
| 1    | usage/unexpected error | generic conversion failure           |
| 2    | invalid/unreadable PDF | "could not be read as a valid PDF"   |
| 3    | password protected     | "PDF is password protected"          |

## Notes / limitations

- Text correctness is reliable for PDFs that contain real Unicode text. If a PDF
  was made with a non-Unicode custom font (copy-paste from it yields garbage),
  no text converter can recover it — that needs OCR (e.g. Tesseract with the
  relevant language packs).
- Layout is preserved closely but not pixel-perfect: PDF is fixed-layout and
  DOCX is reflowable, so minor spacing/positioning differences are expected.
