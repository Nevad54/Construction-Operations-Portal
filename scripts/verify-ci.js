/* eslint-disable no-console */
const { spawnSync } = require('node:child_process');

const npmCli = process.env.npm_execpath;

if (!npmCli) {
  console.error('CI parity verification failed.');
  console.error('Unable to locate npm CLI from the current environment.');
  process.exit(1);
}

const runnerCommand = process.execPath;
const commands = [
  ['run', 'verify:release:public'],
  ['run', 'check:security-audit'],
];

for (const args of commands) {
  console.log(`> npm ${args.join(' ')}`);
  const result = spawnSync(runnerCommand, [npmCli, ...args], {
    stdio: 'inherit',
    env: process.env,
    shell: false,
  });

  if (result.status !== 0) {
    console.error('CI parity verification failed.');
    console.error(`Command failed: npm ${args.join(' ')}`);
    process.exit(result.status || 1);
  }
}

console.log('CI parity verification passed.');
