/* eslint-disable no-console */
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const audits = [
  { label: 'frontend', cwd: process.cwd() },
  { label: 'backend', cwd: path.join(process.cwd(), 'backend') },
];

const npmCli = process.env.npm_execpath;

if (!npmCli) {
  console.error('Security audit check failed.');
  console.error('Unable to locate npm CLI from the current environment.');
  process.exit(1);
}

const runnerCommand = process.execPath;

for (const audit of audits) {
  console.log(`Running npm audit for ${audit.label}...`);
  const result = spawnSync(runnerCommand, [npmCli, 'audit', '--json'], {
    cwd: audit.cwd,
    encoding: 'utf8',
    env: process.env,
    shell: false,
  });

  if (result.status !== 0 && !result.stdout) {
    console.error('Security audit check failed.');
    console.error(`Unable to read audit output for ${audit.label}.`);
    process.exit(result.status || 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch (_error) {
    console.error('Security audit check failed.');
    console.error(`Invalid JSON audit output for ${audit.label}.`);
    process.exit(1);
  }

  const counts = parsed.metadata && parsed.metadata.vulnerabilities
    ? parsed.metadata.vulnerabilities
    : { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 };

  console.log(
    `${audit.label}: ${counts.total} total (${counts.critical} critical, ${counts.high} high, ${counts.moderate} moderate, ${counts.low} low, ${counts.info} info)`
  );

  if (counts.total > 0) {
    console.error('Security audit check failed.');
    console.error(`Vulnerabilities remain in ${audit.label}.`);
    process.exit(1);
  }
}

console.log('Security audit check passed.');
