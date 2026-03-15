const GENERIC_PACKAGE_PATTERN = /^project-\d+-package\.(pdf|xlsx?|docx?|pptx?)$/i;
const ROOM_PAGE_PATTERN = /^(\d+)[\s_-]*room_page-(\d+)\.(png|jpe?g|webp)$/i;
const DEMO_NOTE_PATTERNS = [
  /sample operational document for demo use\.?/i,
  /sample homeowner closeout package for demo use\.?/i,
  /demo use\.?$/i,
];

const titleCase = (value = '') =>
  String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

const splitFileName = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return { stem: '', ext: '' };
  const lastDot = raw.lastIndexOf('.');
  if (lastDot <= 0) return { stem: raw, ext: '' };
  return {
    stem: raw.slice(0, lastDot),
    ext: raw.slice(lastDot + 1),
  };
};

const rebuildFileName = (stem, ext) => (ext ? `${stem}.${ext}` : stem);

export const getClientFacingFileName = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return 'Shared file';

  const roomMatch = raw.match(ROOM_PAGE_PATTERN);
  if (roomMatch) {
    const roomNumber = Number(roomMatch[1]);
    const photoNumber = Number(roomMatch[2]);
    const ext = roomMatch[3].toLowerCase();
    return rebuildFileName(`Room ${roomNumber} progress photo ${photoNumber}`, ext);
  }

  if (GENERIC_PACKAGE_PATTERN.test(raw)) {
    const { ext } = splitFileName(raw);
    return rebuildFileName('Shared project package', ext.toLowerCase());
  }

  const { stem, ext } = splitFileName(raw);
  const cleanedStem = stem.replace(/[_-]+/g, ' ').trim();
  if (!cleanedStem) return raw;

  return rebuildFileName(titleCase(cleanedStem), ext.toLowerCase());
};

export const getClientFacingFileNote = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (DEMO_NOTE_PATTERNS.some((pattern) => pattern.test(raw))) return '';
  return raw;
};
