'use strict';

require('dotenv').config();

const path = require('path');

const BACKEND_ROOT = path.resolve(__dirname, '..');

const config = {
  port: Number(process.env.PORT) || 4000,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  maxUploadBytes: (Number(process.env.MAX_UPLOAD_MB) || 50) * 1024 * 1024,
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB) || 50,
  conversionTimeoutMs: Number(process.env.CONVERSION_TIMEOUT_MS) || 120000,
  maxConcurrentConversions: Number(process.env.MAX_CONCURRENT_CONVERSIONS) || 2,

  backendRoot: BACKEND_ROOT,
  tempDir: path.join(BACKEND_ROOT, 'temp'),
  pythonDir: path.join(BACKEND_ROOT, 'python'),
  converterScript: path.join(BACKEND_ROOT, 'python', 'converter.py'),

  // Optional explicit python binary override.
  pythonBinOverride: process.env.PYTHON_BIN || null,
};

module.exports = config;
