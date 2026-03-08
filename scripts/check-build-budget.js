const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const buildAssetsDir = path.join(rootDir, 'build', 'assets');

const MAX_MAIN_BUNDLE_BYTES = 190 * 1024;
const MAX_TOTAL_JS_BYTES = 700 * 1024;

const formatKb = (bytes) => `${(bytes / 1024).toFixed(2)} kB`;

if (!fs.existsSync(buildAssetsDir)) {
  console.error('Build budget check failed.');
  console.error('Missing build output. Run `npm run build` first.');
  process.exit(1);
}

const jsFiles = fs.readdirSync(buildAssetsDir)
  .filter((file) => file.endsWith('.js'))
  .map((file) => {
    const fullPath = path.join(buildAssetsDir, file);
    return {
      file,
      size: fs.statSync(fullPath).size,
    };
  });

const mainBundle = jsFiles.find((entry) => /^index-[^.]+\.js$/.test(entry.file));
if (!mainBundle) {
  console.error('Build budget check failed.');
  console.error('Main bundle not found in build/assets.');
  process.exit(1);
}

const totalJsBytes = jsFiles.reduce((sum, entry) => sum + entry.size, 0);
const failures = [];

if (mainBundle.size > MAX_MAIN_BUNDLE_BYTES) {
  failures.push(`Main bundle ${mainBundle.file} is ${formatKb(mainBundle.size)} (limit ${formatKb(MAX_MAIN_BUNDLE_BYTES)}).`);
}

if (totalJsBytes > MAX_TOTAL_JS_BYTES) {
  failures.push(`Total JS output is ${formatKb(totalJsBytes)} (limit ${formatKb(MAX_TOTAL_JS_BYTES)}).`);
}

if (failures.length) {
  console.error('Build budget check failed.');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Build budget check passed.');
console.log(`Main bundle: ${mainBundle.file} -> ${formatKb(mainBundle.size)}`);
console.log(`Total JS output: ${formatKb(totalJsBytes)}`);
