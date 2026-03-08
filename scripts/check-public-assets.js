const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const uploadsDir = path.join(rootDir, 'public', 'Uploads');

const trackedAssets = [
  'about-image.png',
  'background1.png',
  'commercial.jpg',
  'industrial.jpg',
  'logo-removebg-preview.png',
  'renovation.jpg',
  'residential.jpg',
];

const MAX_SINGLE_ASSET_BYTES = 1.5 * 1024 * 1024;
const MAX_TOTAL_TRACKED_BYTES = 3.25 * 1024 * 1024;

const formatKb = (bytes) => `${(bytes / 1024).toFixed(2)} kB`;

const failures = [];
let totalTrackedBytes = 0;

for (const assetName of trackedAssets) {
  const assetPath = path.join(uploadsDir, assetName);

  if (!fs.existsSync(assetPath)) {
    failures.push(`Missing tracked public asset: ${assetName}`);
    continue;
  }

  const size = fs.statSync(assetPath).size;
  totalTrackedBytes += size;

  if (size > MAX_SINGLE_ASSET_BYTES) {
    failures.push(`${assetName} is ${formatKb(size)} (limit ${formatKb(MAX_SINGLE_ASSET_BYTES)}).`);
  }
}

if (totalTrackedBytes > MAX_TOTAL_TRACKED_BYTES) {
  failures.push(`Tracked public assets total ${formatKb(totalTrackedBytes)} (limit ${formatKb(MAX_TOTAL_TRACKED_BYTES)}).`);
}

if (failures.length) {
  console.error('Public asset budget check failed.');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Public asset budget check passed.');
console.log(`Tracked assets: ${trackedAssets.join(', ')}`);
console.log(`Tracked asset total: ${formatKb(totalTrackedBytes)}`);
