'use strict';

const express = require('express');
const multer = require('multer');
const config = require('../config');
const { handlePdfToDocx } = require('../controllers/pdfToDocxController');

const router = express.Router();

// Keep the upload in memory; the controller writes it to a unique temp path.
// The size limit is enforced here and again validated by content sniffing.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxUploadBytes,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const isPdfMime = file.mimetype === 'application/pdf';
    const isPdfExt = /\.pdf$/i.test(file.originalname || '');
    if (isPdfMime || isPdfExt) {
      cb(null, true);
    } else {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only PDF files are accepted.'));
    }
  },
});

// Multer as middleware, with an error handler that maps multer errors to
// clean client responses.
router.post(
  '/pdf-to-docx',
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res
              .status(413)
              .json({ error: `File too large. Maximum size is ${config.maxUploadMb} MB.` });
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ error: 'Only a single PDF file is accepted under the "file" field.' });
          }
          return res.status(400).json({ error: 'Invalid file upload.' });
        }
        return next(err);
      }
      next();
    });
  },
  handlePdfToDocx
);

module.exports = router;
