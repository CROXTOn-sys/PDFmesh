'use strict';

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');
const { runTool, ToolError } = require('../services/pdfToolsService');

const PDF_MAGIC = Buffer.from('%PDF-');

// Image magic bytes for jpg-to-pdf validation (defense-in-depth over multer).
const IMAGE_MAGICS = [
  Buffer.from([0xff, 0xd8, 0xff]), // JPEG
  Buffer.from([0x89, 0x50, 0x4e, 0x47]), // PNG
  Buffer.from([0x47, 0x49, 0x46, 0x38]), // GIF8
  Buffer.from([0x42, 0x4d]), // BMP
];

async function safeUnlink(filePath) {
  if (!filePath) return;
  try {
    await fsp.unlink(filePath);
  } catch (err) {
    if (err && err.code !== 'ENOENT') {
      console.error('[cleanup] failed to remove temp file:', err.message);
    }
  }
}

function looksLikePdf(buffer) {
  return Buffer.isBuffer(buffer) && buffer.length >= 5 && buffer.subarray(0, 5).equals(PDF_MAGIC);
}

function looksLikeImage(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return false;
  return IMAGE_MAGICS.some((magic) => buffer.subarray(0, magic.length).equals(magic));
}

/**
 * Generic runner shared by all four endpoints.
 *
 * @param {object} opts
 *   op          - pdf_tools.py operation name
 *   files       - array of multer files (memory storage)
 *   validate    - (buffer) => boolean, per-file content check
 *   inputExt    - extension for written temp inputs ('pdf' or from originalname)
 *   outputExt   - 'pdf' or 'zip'
 *   contentType - response Content-Type
 *   downloadName- response download filename
 */
async function runAndStream(res, opts) {
  const { op, files, validate, outputExt, contentType, downloadName, useOriginalExt, env } = opts;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  for (const f of files) {
    if (!validate(f.buffer)) {
      return res.status(400).json({ error: 'One of the uploaded files is not valid.' });
    }
  }

  const token = crypto.randomBytes(16).toString('hex');
  const inputPaths = [];
  const outputPath = path.join(config.tempDir, `${token}.${outputExt}`);

  try {
    // Write each uploaded file to a unique, server-controlled temp path so user
    // input never influences the filesystem path (path-traversal safe).
    for (let i = 0; i < files.length; i += 1) {
      const f = files[i];
      let ext = 'pdf';
      if (useOriginalExt) {
        const oe = path.extname(f.originalname || '').replace('.', '').toLowerCase();
        ext = /^[a-z0-9]{1,5}$/.test(oe) ? oe : 'img';
      }
      const p = path.join(config.tempDir, `${token}_${i}.${ext}`);
      await fsp.writeFile(p, f.buffer);
      inputPaths.push(p);
    }

    // Pass the first upload's base name so ZIP entry names are user-friendly.
    const firstOriginal = files[0] && files[0].originalname;
    const entryBase = firstOriginal ? path.basename(firstOriginal, path.extname(firstOriginal)) : undefined;
    await runTool(op, outputPath, inputPaths, entryBase, env);

    let stats;
    try {
      stats = await fsp.stat(outputPath);
    } catch {
      throw new ToolError('NO_OUTPUT', 'The operation produced no output.');
    }
    if (!stats.isFile() || stats.size === 0) {
      throw new ToolError('NO_OUTPUT', 'The operation produced no output.');
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.setHeader('Content-Length', stats.size);

    await new Promise((resolve, reject) => {
      const stream = fs.createReadStream(outputPath);
      stream.on('error', reject);
      res.on('finish', resolve);
      res.on('close', resolve);
      stream.pipe(res);
    });
  } catch (err) {
    if (!res.headersSent) {
      if (err instanceof ToolError) {
        const status = err.code === 'INVALID_INPUT' ? 400 : err.code === 'PASSWORD_PROTECTED' ? 400 : 502;
        return res.status(status).json({ error: err.message });
      }
      console.error(`[${op}] unexpected error:`, err.message);
      return res.status(500).json({ error: 'An unexpected error occurred.' });
    }
    console.error(`[${op}] error after response started:`, err.message);
  } finally {
    await Promise.all([...inputPaths.map(safeUnlink), safeUnlink(outputPath)]);
  }
}

function baseName(files, fallback) {
  const first = files && files[0] && files[0].originalname;
  if (!first) return fallback;
  const b = path.basename(first, path.extname(first)).replace(/[^\w.-]+/g, '_').slice(0, 80);
  return b || fallback;
}

async function handleMerge(req, res) {
  const files = req.files || [];
  return runAndStream(res, {
    op: 'merge',
    files,
    validate: looksLikePdf,
    outputExt: 'pdf',
    contentType: 'application/pdf',
    downloadName: 'merged.pdf',
  });
}

async function handleSplit(req, res) {
  const files = req.files || [];
  return runAndStream(res, {
    op: 'split',
    files,
    validate: looksLikePdf,
    outputExt: 'zip',
    contentType: 'application/zip',
    downloadName: `${baseName(files, 'document')}_pages.zip`,
  });
}

async function handlePdfToJpg(req, res) {
  const files = req.files || [];
  return runAndStream(res, {
    op: 'pdf-to-jpg',
    files,
    validate: looksLikePdf,
    outputExt: 'zip',
    contentType: 'application/zip',
    downloadName: `${baseName(files, 'document')}_images.zip`,
  });
}

async function handleJpgToPdf(req, res) {
  const files = req.files || [];
  return runAndStream(res, {
    op: 'jpg-to-pdf',
    files,
    validate: looksLikeImage,
    useOriginalExt: true,
    outputExt: 'pdf',
    contentType: 'application/pdf',
    downloadName: 'images.pdf',
  });
}

function looksLikeWordDoc(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return false;
  // .docx/.odt are ZIP-based (PK\x03\x04); legacy .doc is an OLE2 compound file.
  const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
  const ole2 = Buffer.from([0xd0, 0xcf, 0x11, 0xe0]);
  return buffer.subarray(0, 4).equals(zip) || buffer.subarray(0, 4).equals(ole2);
}

async function handleWordToPdf(req, res) {
  const files = req.files || [];
  const outName = files[0] && files[0].originalname
    ? `${path.basename(files[0].originalname, path.extname(files[0].originalname)).replace(/[^\w.-]+/g, '_').slice(0, 80) || 'document'}.pdf`
    : 'document.pdf';
  return runAndStream(res, {
    op: 'word-to-pdf',
    files,
    validate: looksLikeWordDoc,
    useOriginalExt: true,
    outputExt: 'pdf',
    contentType: 'application/pdf',
    downloadName: outName,
  });
}

async function handleCompress(req, res) {
  const files = req.files || [];
  // Optional compression level from the client (extreme | recommended | less).
  const level = String((req.body && req.body.level) || 'recommended').toLowerCase();
  const allowed = new Set(['extreme', 'recommended', 'less']);
  const outName = files[0] && files[0].originalname
    ? `${path.basename(files[0].originalname, path.extname(files[0].originalname)).replace(/[^\w.-]+/g, '_').slice(0, 80) || 'document'}_compressed.pdf`
    : 'compressed.pdf';
  return runAndStream(res, {
    op: 'compress',
    files,
    validate: looksLikePdf,
    outputExt: 'pdf',
    contentType: 'application/pdf',
    downloadName: outName,
    env: { PDFMESH_COMPRESS_LEVEL: allowed.has(level) ? level : 'recommended' },
  });
}

module.exports = { handleMerge, handleSplit, handlePdfToJpg, handleJpgToPdf, handleCompress, handleWordToPdf };
