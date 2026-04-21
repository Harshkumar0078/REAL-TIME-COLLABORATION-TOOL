const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Local Code Execution Engine
 * Runs code directly on your machine using installed compilers/runtimes.
 * No internet or API key required.
 *
 * Requirements (install what you need):
 *   Python   → https://python.org          (python3 / python)
 *   Node.js  → already installed (you're running this server)
 *   Java     → https://adoptium.net        (javac + java)
 *   C++      → https://winlibs.com (Windows) / apt install g++ (Linux)
 *   Go       → https://go.dev
 *   Rust     → https://rustup.rs
 */

const LANGUAGE_NAMES = {
  python: 'Python', javascript: 'JavaScript', typescript: 'TypeScript',
  cpp: 'C++', java: 'Java', go: 'Go', rust: 'Rust',
};

const isWindows = os.platform() === 'win32';

// ── Language execution configs ─────────────────────────────────────
const LANG_CONFIG = {
  python: {
    filename: 'main.py',
    // Try python3 first, fall back to python (Windows)
    run: (dir) => isWindows
      ? `cd /d "${dir}" && python main.py`
      : `cd "${dir}" && python3 main.py 2>/dev/null || python main.py`,
  },
  javascript: {
    filename: 'main.js',
    run: (dir) => `cd ${isWindows ? '/d ' : ''}"${dir}" && node main.js`,
  },
  typescript: {
    filename: 'main.ts',
    // Compile with tsc then run, or use ts-node if available
    run: (dir) => isWindows
      ? `cd /d "${dir}" && npx ts-node main.ts`
      : `cd "${dir}" && npx ts-node main.ts 2>/dev/null || (tsc main.ts && node main.js)`,
  },
  cpp: {
    filename: 'main.cpp',
    run: (dir) => isWindows
      ? `cd /d "${dir}" && g++ main.cpp -o main.exe && main.exe`
      : `cd "${dir}" && g++ main.cpp -o main && ./main`,
  },
  java: {
    filename: 'Main.java',
    run: (dir) => isWindows
      ? `cd /d "${dir}" && javac Main.java && java Main`
      : `cd "${dir}" && javac Main.java && java Main`,
  },
  go: {
    filename: 'main.go',
    run: (dir) => isWindows
      ? `cd /d "${dir}" && go run main.go`
      : `cd "${dir}" && go run main.go`,
  },
  rust: {
    filename: 'main.rs',
    run: (dir) => isWindows
      ? `cd /d "${dir}" && rustc main.rs -o main.exe && main.exe`
      : `cd "${dir}" && rustc main.rs -o main && ./main`,
  },
};

// ── Execute code locally ───────────────────────────────────────────
const runLocally = (code, langId, stdin = '') => {
  return new Promise((resolve) => {
    const cfg     = LANG_CONFIG[langId];
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codesync-'));
    const file    = path.join(tempDir, cfg.filename);

    try {
      // Write code to temp file
      fs.writeFileSync(file, code, 'utf8');

      const cmd     = cfg.run(tempDir);
      const shell   = isWindows ? 'cmd' : '/bin/sh';
      const shellFlag = isWindows ? '/c' : '-c';

      const child = exec(
        cmd,
        {
          shell,
          timeout:   15000,  // 15 second limit
          maxBuffer: 1024 * 1024, // 1MB output limit
          env: { ...process.env, PATH: process.env.PATH },
        },
        (error, stdout, stderr) => {
          // Cleanup temp files
          try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}

          if (error && error.killed) {
            return resolve({
              stdout:   stdout?.trim() || '',
              stderr:   'Time limit exceeded (15s)',
              exitCode: 124,
              stage:    'run',
            });
          }

          // Separate compile errors from runtime errors for compiled languages
          const isCompileError = stderr &&
            (stderr.includes('error:') || stderr.includes('Error:') || stderr.includes('cannot find')) &&
            !stdout;

          resolve({
            stdout:   (stdout || '').trim(),
            stderr:   (stderr || '').trim(),
            exitCode: error ? (error.code || 1) : 0,
            stage:    isCompileError ? 'compile' : 'run',
          });
        }
      );

      // Pipe stdin if provided
      if (stdin && child.stdin) {
        child.stdin.write(stdin);
        child.stdin.end();
      }

    } catch (err) {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
      resolve({
        stdout:   '',
        stderr:   err.message,
        exitCode: 1,
        stage:    'run',
      });
    }
  });
};

// ── POST /api/code/execute ─────────────────────────────────────────
const executeCode = async (req, res) => {
  try {
    const { code, language, stdin } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Code cannot be empty.' });
    }

    const langId = language || 'python';
    if (!LANG_CONFIG[langId]) {
      return res.status(400).json({ error: `Unsupported language: ${langId}` });
    }

    console.log(`▶ Executing [${langId}] locally`);

    const result = await runLocally(code, langId, stdin || '');

    console.log(`✓ exit:${result.exitCode} stage:${result.stage} stdout:${result.stdout.length}ch`);
    return res.json({ result });

  } catch (err) {
    console.error('Execution error:', err.message);
    return res.status(500).json({ error: 'Execution failed: ' + err.message });
  }
};

// ── GET /api/code/languages ────────────────────────────────────────
const getSupportedLanguages = (req, res) => {
  res.json({
    languages: Object.keys(LANG_CONFIG).map((id) => ({
      id,
      name: LANGUAGE_NAMES[id] || id,
    })),
  });
};

// ── Startup: check which runtimes are available ────────────────────
(async () => {
  const checks = [
    { name: 'Python',  cmd: isWindows ? 'python --version' : 'python3 --version || python --version' },
    { name: 'Node.js', cmd: 'node --version' },
    { name: 'Java',    cmd: 'java --version'  },
    { name: 'C++ (g++)', cmd: 'g++ --version' },
    { name: 'Go',      cmd: 'go version'      },
    { name: 'Rust',    cmd: 'rustc --version' },
  ];

  console.log('\n── Installed runtimes ──────────────────────────');
  for (const chk of checks) {
    await new Promise((resolve) => {
      exec(chk.cmd, { timeout: 3000 }, (err, stdout) => {
        if (!err && stdout) {
          console.log(`  ✅ ${chk.name}: ${stdout.trim().split('\n')[0]}`);
        } else {
          console.log(`  ⚪ ${chk.name}: not found (install to use)`);
        }
        resolve();
      });
    });
  }
  console.log('────────────────────────────────────────────────\n');
})();

module.exports = { executeCode, getSupportedLanguages };
