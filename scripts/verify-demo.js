const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const backendPort = process.env.DEMO_VERIFY_BACKEND_PORT || '3202';
const backendUrl = `http://localhost:${backendPort}`;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3101';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runCommand = (command, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
    ...options,
  });

  child.on('exit', (code) => {
    if (code === 0) {
      resolve();
      return;
    }
    reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`));
  });
});

const waitForBackend = async (timeoutMs = 20000) => {
  const startedAt = Date.now();

  while ((Date.now() - startedAt) < timeoutMs) {
    try {
      const response = await fetch(`${backendUrl}/api/status`, {
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        const payload = await response.json();
        if (payload && Object.prototype.hasOwnProperty.call(payload, 'usingFallback')) {
          return;
        }
      }
    } catch (_error) {
      // retry
    }
    await wait(500);
  }

  throw new Error(`Timed out waiting for demo backend at ${backendUrl}`);
};

const startBackend = () => spawn('node', ['server.js'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PORT: backendPort,
    NODE_ENV: 'development',
    EMAIL_USER: '',
    EMAIL_PASS: '',
    CONTACT_EMAIL: '',
  },
});

const main = async () => {
  let backendProcess;

  try {
    await runCommand('npm', ['run', 'build']);
    await runCommand('npm', ['run', 'check:bundle-budget']);
    await runCommand('npm', ['run', 'check:public-assets']);

    backendProcess = startBackend();
    await waitForBackend();

    await runCommand('npm', ['run', 'smoke:local-demo'], {
      env: {
        ...process.env,
        BACKEND_URL: backendUrl,
        FRONTEND_URL: frontendUrl,
      },
    });

    await runCommand('npm', ['run', 'smoke:admin'], {
      env: {
        ...process.env,
        BASE_URL: backendUrl,
      },
    });

    await runCommand('npm', ['run', 'smoke:contact'], {
      env: {
        ...process.env,
        BASE_URL: backendUrl,
      },
    });

    console.log('Demo verification passed.');
    console.log(`Frontend: ${frontendUrl}`);
    console.log(`Backend: ${backendUrl}`);
  } finally {
    if (backendProcess && !backendProcess.killed) {
      backendProcess.kill();
    }
  }
};

main().catch((error) => {
  console.error('Demo verification failed.');
  console.error(error.message);
  process.exitCode = 1;
});
