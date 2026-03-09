/* eslint-disable no-console */
const { spawnSync } = require('node:child_process');

const frontendUrl = String(process.env.FRONTEND_URL || '').trim();

if (!frontendUrl) {
  console.error('Production verification failed.');
  console.error('Set FRONTEND_URL to the deployed frontend origin you want to verify.');
  process.exit(1);
}

const npmCli = process.env.npm_execpath;

if (!npmCli) {
  console.error('Production verification failed.');
  console.error('Unable to locate npm CLI from the current environment.');
  process.exit(1);
}

const runnerCommand = process.execPath;
const commands = [
  ['run', 'smoke:production'],
  ['run', 'smoke:deploy-contact'],
  ['run', 'smoke:deploy-protected-routes'],
  ['run', 'report:production-health'],
];

for (const args of commands) {
  console.log(`> npm ${args.join(' ')}`);
  const result = spawnSync(runnerCommand, [npmCli, ...args], {
    stdio: 'inherit',
    env: process.env,
    shell: false,
  });

  if (result.status !== 0) {
    console.error('Production verification failed.');
    console.error(`Command failed: npm ${args.join(' ')}`);
    process.exit(result.status || 1);
  }
}

console.log('Production verification passed.');
console.log(`Frontend: ${frontendUrl.replace(/\/$/, '')}`);
if (process.env.BACKEND_URL) {
  console.log(`Backend: ${String(process.env.BACKEND_URL).trim().replace(/\/$/, '')}`);
}
