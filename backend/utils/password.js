const crypto = require('crypto');

// PBKDF2 parameters. Keep iterations high enough for modern hardware.
const PBKDF2_DIGEST = 'sha256';
const PBKDF2_ITERATIONS = 310000;
const PBKDF2_KEYLEN = 32;

const timingSafeEqual = (a, b) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
};

const hashPassword = async (password) => {
  const pwd = String(password || '');
  if (!pwd) throw new Error('Password required');

  const salt = crypto.randomBytes(16);
  const derivedKey = await new Promise((resolve, reject) => {
    crypto.pbkdf2(pwd, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST, (err, key) => {
      if (err) return reject(err);
      resolve(key);
    });
  });

  // Format: pbkdf2$sha256$310000$<saltb64>$<hashb64>
  return [
    'pbkdf2',
    PBKDF2_DIGEST,
    String(PBKDF2_ITERATIONS),
    salt.toString('base64'),
    Buffer.from(derivedKey).toString('base64'),
  ].join('$');
};

const verifyPassword = async (password, storedHash) => {
  const pwd = String(password || '');
  const stored = String(storedHash || '');
  if (!pwd || !stored) return false;

  const parts = stored.split('$');
  if (parts.length !== 5) return false;
  const [scheme, digest, iterRaw, saltB64, hashB64] = parts;
  if (scheme !== 'pbkdf2') return false;

  const iterations = Number(iterRaw);
  if (!iterations || Number.isNaN(iterations)) return false;

  let salt;
  let expected;
  try {
    salt = Buffer.from(saltB64, 'base64');
    expected = Buffer.from(hashB64, 'base64');
  } catch (e) {
    return false;
  }

  const derivedKey = await new Promise((resolve, reject) => {
    crypto.pbkdf2(pwd, salt, iterations, expected.length, digest, (err, key) => {
      if (err) return reject(err);
      resolve(key);
    });
  });

  return timingSafeEqual(Buffer.from(derivedKey), expected);
};

module.exports = {
  hashPassword,
  verifyPassword,
};

