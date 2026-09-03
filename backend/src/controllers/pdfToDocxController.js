'use strict';

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');
const { convertPdfToDocx, ConversionError } = require('../services/conversionService');

const PDF_MAGIC = Buffer.from('%PDF-');

/**
 * Best-effort delete that never throws. Used in finally blocks so cleanup can
 * run even when the request failed.
 */
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

/**
 * Validate that the buffer actually starts with the PDF magic bytes. This is a
 * defense-in-depth check on top of multer's mimetype filter.
 */
function looksLikePdf(buffer) {
  return Buffer.isBuffer(buffer) && buffer.length >= 5 && buffer.subarray(0, 5).equals(PDF_MAGIC);
}

async function handlePdfToDocx(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file uploaded. Send a file under the "file" field.' });
  }

  if (!looksLikePdf(req.file.buffer)) {
    return res.status(400).json({ error: 'The uploaded file is not a valid PDF.' });
  }

  // Generate unique, server-controlled filenames. User input never influences
  // the path, which protects against path traversal.
  const token = crypto.randomBytes(16).toString('hex');
  const inputPdfPath = path.join(config.tempDir, `${token}.pdf`);
  const outputDocxPath = path.join(config.tempDir, `${token}.docx`);

  try {
    await fsp.writeFile(inputPdfPath, req.file.buffer);

    await convertPdfToDocx(inputPdfPath, outputDocxPath);

    // Ensure the converter actually produced the output.
    let stats;
    try {
      stats = await fsp.stat(outputDocxPath);
    } catch {
      throw new ConversionError('NO_OUTPUT', 'The converted DOCX could not be produced.');
    }
    if (!stats.isFile() || stats.size === 0) {
      throw new ConversionError('NO_OUTPUT', 'The converted DOCX could not be produced.');
    }

    // Derive a friendly download name from the original upload name.
    const originalBase = path.basename(req.file.originalname || 'document', path.extname(req.file.originalname || ''));
    const safeBase = originalBase.replace(/[^\w.-]+/g, '_').slice(0, 100) || 'document';
    const downloadName = `${safeBase}.docx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.setHeader('Content-Length', stats.size);

    // Stream the file, then clean up both temp files once the response ends.
    await new Promise((resolve, reject) => {
      const stream = fs.createReadStream(outputDocxPath);
      stream.on('error', reject);
      res.on('finish', resolve);
      res.on('close', resolve);
      stream.pipe(res);
    });
  } catch (err) {
    if (!res.headersSent) {
      if (err instanceof ConversionError) {
        const status = err.code === 'INVALID_PDF' || err.code === 'PASSWORD_PROTECTED' ? 400 : 502;
        return res.status(status).json({ error: err.message });
      }
      console.error('[pdf-to-docx] unexpected error:', err.message);
      return res.status(500).json({ error: 'An unexpected error occurred while converting the PDF.' });
    }
    // Headers already sent (mid-stream failure); just log.
    console.error('[pdf-to-docx] error after response started:', err.message);
  } finally {
    await Promise.all([safeUnlink(inputPdfPath), safeUnlink(outputDocxPath)]);
  }
}

module.exports = { handlePdfToDocx };
