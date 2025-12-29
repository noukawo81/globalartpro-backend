import fs from 'fs';
import path from 'path';
import os from 'os';

export function safeWriteJSON(filePath, data) {
  const dir = path.dirname(filePath);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    console.error('safeWriteJSON: mkdir error', e);
  }

  const str = JSON.stringify(data, null, 2);
  const tmp = `${filePath}.tmp`;

  // Try writing to a tmp file and renaming. Retry a few times on failure.
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Write tmp file
      fs.writeFileSync(tmp, str, 'utf8');
      // Replace the target file atomically (robust on Windows)
      try {
        fs.renameSync(tmp, filePath);
        return true;
      } catch (renameErr) {
        // Fallback: copy file over and remove tmp
        try {
          fs.copyFileSync(tmp, filePath);
          fs.unlinkSync(tmp);
          return true;
        } catch (copyErr) {
          // rethrow original rename error to be handled by outer catch
          throw renameErr;
        }
      }
    } catch (e) {
      console.warn(`safeWriteJSON: attempt ${attempt} failed for ${filePath}`, e && e.message);
      try {
        if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      } catch (e2) {
        /* ignore */
      }
    }
  }

  // Last-resort fallback: write to OS temp directory and return false
  try {
    const fallback = path.join(os.tmpdir(), `globalartpro-fallback-${path.basename(filePath)}`);
    fs.writeFileSync(fallback, str, 'utf8');
    console.warn(`safeWriteJSON: fallback write to ${fallback} successful. Original path ${filePath} may be unavailable.`);
    return false;
  } catch (e) {
    console.error('safeWriteJSON: final fallback failed', e);
    return false;
  }
}

export default { safeWriteJSON };
