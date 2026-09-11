'use strict';

const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Resolve the Python interpreter to use for conversion.
 *
 * Priority:
 *   1. PYTHON_BIN env override (if it exists on disk or is a bare command).
 *   2. The isolated virtual environment at backend/python/venv.
 *
 * Returns the absolute path (or command) of the interpreter, or throws if
 * no suitable interpreter can be found.
 */
function resolvePythonBin() {
  if (config.pythonBinOverride) {
    return config.pythonBinOverride;
  }

  const venvDir = path.join(config.pythonDir, 'venv');
  const candidates =
    process.platform === 'win32'
      ? [path.join(venvDir, 'Scripts', 'python.exe')]
      : [path.join(venvDir, 'bin', 'python3'), path.join(venvDir, 'bin', 'python')];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    'Python interpreter not found. Create the virtual environment at ' +
      'backend/python/venv, or set PYTHON_BIN (see backend README). The ' +
      'converter uses only the Python standard library plus system LibreOffice.'
  );
}

module.exports = { resolvePythonBin };
