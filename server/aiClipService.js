import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function generateAiClip({ query = '', isRandom = false, onProgress = null }) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'aiClipEngine.py');
    const args = [scriptPath];

    if (isRandom || !query.trim()) {
      args.push('--random');
    } else {
      args.push(query.trim());
    }

    const proc = spawn('python', args, {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    let stdoutData = '';
    let stderrData = '';
    let resultClip = null;
    let errorMsg = null;

    proc.stdout.on('data', (data) => {
      const text = data.toString('utf-8');
      stdoutData += text;

      const lines = text.split('\n');
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (line.startsWith('__PROGRESS__')) {
          try {
            const payload = JSON.parse(line.replace('__PROGRESS__', ''));
            if (typeof onProgress === 'function') {
              onProgress(payload);
            }
          } catch (e) {}
        } else if (line.startsWith('__RESULT__')) {
          try {
            resultClip = JSON.parse(line.replace('__RESULT__', ''));
          } catch (e) {}
        } else if (line.startsWith('__ERROR__')) {
          try {
            const errObj = JSON.parse(line.replace('__ERROR__', ''));
            errorMsg = errObj.error;
          } catch (e) {
            errorMsg = line;
          }
        }
      }
    });

    proc.stderr.on('data', (data) => {
      stderrData += data.toString('utf-8');
    });

    proc.on('close', (code) => {
      if (resultClip) {
        resolve(resultClip);
      } else {
        const fallbackErr = errorMsg || stderrData.slice(-300) || 'Klip oluşturulamadı.';
        reject(new Error(fallbackErr));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}
