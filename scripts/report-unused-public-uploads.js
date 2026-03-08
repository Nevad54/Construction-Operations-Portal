const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const uploadsDir = path.join(rootDir, 'public', 'Uploads');
const srcDir = path.join(rootDir, 'src');

const LARGE_FILE_THRESHOLD_BYTES = 256 * 1024;

const getAllFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return getAllFiles(fullPath);
    return fullPath;
  });
};

const srcFiles = getAllFiles(srcDir)
  .filter((file) => /\.(js|jsx|css|ts|tsx)$/.test(file))
  .map((file) => fs.readFileSync(file, 'utf8'));

const uploadFiles = fs.readdirSync(uploadsDir)
  .map((fileName) => {
    const fullPath = path.join(uploadsDir, fileName);
    return {
      fileName,
      fullPath,
      size: fs.statSync(fullPath).size,
    };
  });

const referencedUploads = new Set();
for (const file of uploadFiles) {
  const directRef = `/Uploads/${file.fileName}`;
  const cssRef = `Uploads/${file.fileName}`;
  if (srcFiles.some((content) => content.includes(directRef) || content.includes(cssRef))) {
    referencedUploads.add(file.fileName);
  }
}

const unusedLargeUploads = uploadFiles
  .filter((file) => !referencedUploads.has(file.fileName))
  .filter((file) => file.size > LARGE_FILE_THRESHOLD_BYTES)
  .sort((a, b) => b.size - a.size);

const formatKb = (bytes) => `${(bytes / 1024).toFixed(2)} kB`;
const totalUnusedLargeBytes = unusedLargeUploads.reduce((sum, file) => sum + file.size, 0);

console.log('Unused public upload report');
console.log(`Tracked threshold: ${formatKb(LARGE_FILE_THRESHOLD_BYTES)}`);
console.log(`Referenced public uploads: ${referencedUploads.size}`);
console.log(`Unused large uploads: ${unusedLargeUploads.length}`);
console.log(`Unused large upload total: ${formatKb(totalUnusedLargeBytes)}`);

if (unusedLargeUploads.length) {
  console.log('');
  unusedLargeUploads.forEach((file) => {
    console.log(`- ${file.fileName} -> ${formatKb(file.size)}`);
  });
} else {
  console.log('');
  console.log('No unused public uploads exceed the reporting threshold.');
}
