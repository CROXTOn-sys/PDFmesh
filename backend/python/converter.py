#!/usr/bin/env python3
"""PDFmesh PDF -> DOCX converter.

Invoked by the Node.js backend as:

    python converter.py <input_pdf_path> <output_docx_path>

Uses pdf2docx-plus as the conversion engine. Exit codes are meaningful so the
Node layer can map them to safe, client-facing messages:

    0  success
    1  usage / unexpected error
    2  invalid or unreadable PDF
    3  password protected PDF
"""

import os
import sys


def _fail(code: int, message: str) -> None:
    # Diagnostics go to stderr only; Node captures and logs them internally.
    print(message, file=sys.stderr)
    sys.exit(code)


def main() -> None:
    if len(sys.argv) != 3:
        _fail(1, "usage: converter.py <input_pdf_path> <output_docx_path>")

    input_pdf = sys.argv[1]
    output_docx = sys.argv[2]

    if not os.path.isfile(input_pdf):
        _fail(2, f"input file does not exist: {input_pdf}")

    try:
        from pdf2docx_plus import convert
    except ImportError as exc:  # pragma: no cover - environment issue
        _fail(1, f"pdf2docx-plus is not installed in this environment: {exc}")

    try:
        # Rely on Node's process-level timeout as the hard limit; pass a
        # generous per-call timeout as a secondary guard.
        result = convert(input_pdf, output_docx, timeout_s=110)
    except Exception as exc:  # noqa: BLE001 - map broadly to safe exit codes
        name = type(exc).__name__.lower()
        text = str(exc).lower()
        if "password" in name or "password" in text:
            _fail(3, f"password protected: {exc}")
        if "input" in name or "parse" in name:
            _fail(2, f"invalid pdf: {exc}")
        _fail(1, f"conversion error: {exc}")
        return

    # Verify the output actually exists and is non-empty.
    if not os.path.isfile(output_docx) or os.path.getsize(output_docx) == 0:
        _fail(1, "conversion produced no output file")

    # Optional: surface page accounting on stdout for debugging.
    try:
        print(f"pages_ok={result.pages_ok} pages_total={result.pages_total}")
    except Exception:  # noqa: BLE001 - result shape is best-effort only
        pass

    sys.exit(0)


if __name__ == "__main__":
    main()
