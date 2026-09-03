'use strict';

const fs = require('fs');
const express = require('express');
const cors = require('cors');
const config = require('./config');
const pdfToDocxRoutes = require('./routes/pdfToDocxRoutes');

// Ensure the temp directory exists on boot.
fs.mkdirSync(config.tempDir, { recursive: true });

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
  })
);

// Health check.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes.
app.use('/api', pdfToDocxRoutes);

// 404 for anything else.
app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// Final error handler — never leak internals.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[server] unhandled error:', err && err.message);
  if (res.headersSent) return;
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

app.listen(config.port, () => {
  console.log(`PDFmesh backend listening on http://localhost:${config.port}`);
  console.log(`  Endpoint: POST /api/pdf-to-docx`);
  console.log(`  Max upload: ${config.maxUploadMb} MB | Timeout: ${config.conversionTimeoutMs} ms | Concurrency: ${config.maxConcurrentConversions}`);
});
