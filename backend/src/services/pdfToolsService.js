'use strict';

const { spawn } = require('child_process');
const path = require('path');
const config = require('../config');
const { resolvePythonBin } = require('./pythonResolver');

/**
 * Concurrency cap shared across the utility tools (merge/split/pdf-to-jpg/
 * jpg-to-pdf). Kept separate from the PDF->DOCX converter so heavy conversions
 * and light utility ops don't starve each other.
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

const TOOLS_SCRIPT = path.join(config.pythonDir, 'pdf_tools.py');

/**
 * Error thrown when a tool operation fails. `code` is a stable machine-readable
 * reason; the message is safe to surface to clients.
 */
class ToolError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ToolError';
    this.code = code;
  }
}

/**
 * Run one pdf_tools.py operation.
 *
 * @param {string} op one of: merge | split | pdf-to-jpg | jpg-to-pdf
 * @param {string} outputPath absolute path where the result should be written
 * @param {string[]} inputPaths absolute paths of the input file(s)
 * @returns {Promise<void>}
 */
async function runTool(op, outputPath, inputPaths, baseName, extraEnv) {
  await semaphore.acquire();
  try {
    const pythonBin = resolvePythonBin();

    await new Promise((resolve, reject) => {
      const args = [TOOLS_SCRIPT, op, outputPath, ...inputPaths];
      const env = { ...process.env };
      if (baseName) env.PDFMESH_BASENAME = baseName;
      if (extraEnv && typeof extraEnv === 'object') Object.assign(env, extraEnv);
      const child = spawn(pythonBin, args, { shell: false, windowsHide: true, env });

      let stderr = '';
      let settled = false;

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        child.kill('SIGKILL');
        reject(new ToolError('TIMEOUT', 'The operation timed out. The file may be too large or complex.'));
      }, config.conversionTimeoutMs);

      child.stderr.on('data', (chunk) => {
        if (stderr.length < 8192) stderr += chunk.toString();
      });

      child.on('error', (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        console.error('[pdf-tools] failed to start python process:', err.message);
        reject(new ToolError('SPAWN_FAILED', 'The service is not available. Please try again later.'));
      });

      child.on('close', (exitCode) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);

        if (exitCode === 0) {
          resolve();
          return;
        }
        console.error(`[pdf-tools:${op}] python exited with code ${exitCode}. stderr: ${stderr.trim()}`);
        if (exitCode === 2) {
          reject(new ToolError('INVALID_INPUT', 'The uploaded file could not be read or is not valid.'));
        } else if (exitCode === 3) {
          reject(new ToolError('PASSWORD_PROTECTED', 'The PDF is password protected and cannot be processed.'));
        } else {
          reject(new ToolError('TOOL_FAILED', 'The file could not be processed.'));
        }
      });
    });
  } finally {
    semaphore.release();
  }
}

module.exports = { runTool, ToolError };
