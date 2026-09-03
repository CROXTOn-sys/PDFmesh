'use strict';

const { spawn } = require('child_process');
const config = require('../config');
const { resolvePythonBin } = require('./pythonResolver');

/**
 * Simple in-process semaphore to cap concurrent conversions. Prevents the
 * server from spawning an unbounded number of heavy Python processes.
 */
class Semaphore {
  constructor(max) {
    this.max = Math.max(1, max);
    this.active = 0;
    this.queue = [];
  }

  acquire() {
    if (this.active < this.max) {
      this.active += 1;
      return Promise.resolve();
    }
    return new Promise((resolve) => this.queue.push(resolve));
  }

  release() {
    this.active -= 1;
    const next = this.queue.shift();
    if (next) {
      this.active += 1;
      next();
    }
  }
}

const semaphore = new Semaphore(config.maxConcurrentConversions);

/**
 * Error thrown when a conversion fails. `code` gives a stable machine-readable
 * reason; the message is safe to surface to clients (no filesystem paths, no
 * Python stack traces).
 */
class ConversionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ConversionError';
    this.code = code;
  }
}

/**
 * Convert a PDF to DOCX by invoking the isolated Python converter.
 *
 * File paths are passed as SEPARATE process arguments (never interpolated into
 * a shell string), and the process is spawned WITHOUT a shell, so user-derived
 * filenames cannot be used for command injection.
 *
 * @param {string} inputPdfPath absolute path to the temp PDF
 * @param {string} outputDocxPath absolute path where the DOCX should be written
 * @returns {Promise<void>}
 */
async function convertPdfToDocx(inputPdfPath, outputDocxPath) {
  await semaphore.acquire();

  try {
    const pythonBin = resolvePythonBin();

    await new Promise((resolve, reject) => {
      const child = spawn(
        pythonBin,
        [config.converterScript, inputPdfPath, outputDocxPath],
        { shell: false, windowsHide: true }
      );

      let stderr = '';
      let settled = false;

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        child.kill('SIGKILL');
        reject(
          new ConversionError('TIMEOUT', 'The conversion timed out. The PDF may be too large or complex.')
        );
      }, config.conversionTimeoutMs);

      child.stderr.on('data', (chunk) => {
        // Cap captured stderr so a runaway process cannot exhaust memory.
        if (stderr.length < 8192) {
          stderr += chunk.toString();
        }
      });

      child.on('error', (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        // Log internally; do not leak details to the client.
        console.error('[conversion] failed to start python process:', err.message);
        reject(
          new ConversionError('SPAWN_FAILED', 'The conversion service is not available. Please try again later.')
        );
      });

      child.on('close', (exitCode) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);

        if (exitCode === 0) {
          resolve();
          return;
        }

        // Log full stderr internally only.
        console.error(`[conversion] python exited with code ${exitCode}. stderr: ${stderr.trim()}`);

        // Map known converter exit codes to safe client messages.
        if (exitCode === 2) {
          reject(new ConversionError('INVALID_PDF', 'The uploaded file could not be read as a valid PDF.'));
        } else if (exitCode === 3) {
          reject(new ConversionError('PASSWORD_PROTECTED', 'The PDF is password protected and cannot be converted.'));
        } else {
          reject(new ConversionError('CONVERSION_FAILED', 'The PDF could not be converted to DOCX.'));
        }
      });
    });
  } finally {
    semaphore.release();
  }
}

module.exports = { convertPdfToDocx, ConversionError };
