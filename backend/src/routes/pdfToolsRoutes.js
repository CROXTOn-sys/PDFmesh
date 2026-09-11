'use strict';

const express = require('express');
const multer = require('multer');
const config = require('../config');
const {
  handleMerge,
  handleSplit,
  handlePdfToJpg,
  handleJpgToPdf,
  handleCompress,
  handleWordToPdf,
} = require('../controllers/pdfToolsController');

const router = express.Router();

const MAX_FILES = 30;

// Uploads kept in memory; controllers write them to unique temp paths.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxUploadBytes,
    files: MAX_FILES,
  },
});

// Wrap a multer middleware so its errors become clean client responses instead
// of surfacing as unhandled errors.
function withUpload(multerMiddleware) {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res
              .status(413)
              .json({ error: `File too large. Maximum size is ${config.maxUploadMb} MB.` });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: `Too many files. Maximum is ${MAX_FILES}.` });
          }
          return res.status(400).json({ error: 'Invalid file upload.' });
        }
        return next(err);
      }
      next();
    });
  };
}

// Multi-file: merge and jpg-to-pdf. Single-file: split and pdf-to-jpg.
router.post('/merge-pdf', withUpload(upload.array('files', MAX_FILES)), handleMerge);
router.post('/jpg-to-pdf', withUpload(upload.array('files', MAX_FILES)), handleJpgToPdf);
router.post('/split-pdf', withUpload(upload.array('files', 1)), handleSplit);
router.post('/pdf-to-jpg', withUpload(upload.array('files', 1)), handlePdfToJpg);
router.post('/compress-pdf', withUpload(upload.array('files', 1)), handleCompress);
router.post('/word-to-pdf', withUpload(upload.array('files', 1)), handleWordToPdf);

module.exports = router;
