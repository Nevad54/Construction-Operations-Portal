const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
let MongoStore = null;
try {
  // Optional dependency. In production, use it to avoid MemoryStore (session loss on restart).
  MongoStore = require('connect-mongo');
} catch (e) {
  MongoStore = null;
}
const basicAuth = require('express-basic-auth');
const nodemailer = require('nodemailer');
const requestIp = require('request-ip');
const User = require('./models/User');
const { hashPassword, verifyPassword } = require('./utils/password');
const https = require('https');
const querystring = require('querystring');
let cloudinary = null;
try {
  cloudinary = require('cloudinary').v2;
} catch (e) {
  cloudinary = null;
}

const Project = require('./models/Projects');
const FileItem = require('./models/FileItem');
const ActivityLog = require('./models/ActivityLog');
const Inquiry = require('./models/Inquiry');
const { registerAuthRoutes } = require('./routes/auth');
const { registerInquiryRoutes } = require('./routes/inquiries');
const { normalizeContactPayload, validateContactPayload, buildContactEmailContent } = require('./contactPayload');
const { buildAdminSystemStatusAlerts } = require('./utils/adminSystemStatus');
const { PASSWORD_POLICY, PASSWORD_POLICY_MESSAGE, isPasswordStrong } = require('./utils/passwordPolicy');

// In-memory fallback storage for development when MongoDB is unavailable
const fallbackFile = path.join(__dirname, 'dev_projects.json');
let fallbackProjects = [];

// helper to convert array of plain objects to CSV
function rowsToCsv(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return '';
  const header = Object.keys(rows[0]);
  const csvRows = [header.join(',')];
  for (const row of rows) {
    const values = header.map((key) => {
      let val = row[key] == null ? '' : row[key];
      if (typeof val === 'object') {
        try { val = JSON.stringify(val); } catch (_e) { val = String(val); }
      }
      val = String(val);
      if (val.includes('"')) {
        val = val.replace(/"/g, '""');
      }
      if (val.search(/,|\n|\r|"/) >= 0) {
        val = `"${val}"`;
      }
      return val;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\r\n');
}
try {
  if (fs.existsSync(fallbackFile)) {
    const data = fs.readFileSync(fallbackFile, 'utf8');
    fallbackProjects = JSON.parse(data || '[]');
  }
} catch (e) {
  console.error('Error loading fallback projects file:', e);
  fallbackProjects = [];
}
const fallbackFilesPath = path.join(__dirname, 'dev_files.json');
let fallbackFiles = [];
try {
  if (fs.existsSync(fallbackFilesPath)) {
    const data = fs.readFileSync(fallbackFilesPath, 'utf8');
    fallbackFiles = JSON.parse(data || '[]');
  }
} catch (e) {
  console.error('Error loading fallback files data:', e);
  fallbackFiles = [];
}
const fallbackActivityPath = path.join(__dirname, 'dev_activity_logs.json');
let fallbackActivityLogs = [];
try {
  if (fs.existsSync(fallbackActivityPath)) {
    const data = fs.readFileSync(fallbackActivityPath, 'utf8');
    fallbackActivityLogs = JSON.parse(data || '[]');
  }
} catch (e) {
  console.error('Error loading fallback activity logs:', e);
  fallbackActivityLogs = [];
}
const fallbackFoldersPath = path.join(__dirname, 'dev_folders.json');
let fallbackFolders = [];
try {
  if (fs.existsSync(fallbackFoldersPath)) {
    const data = fs.readFileSync(fallbackFoldersPath, 'utf8');
    fallbackFolders = JSON.parse(data || '[]');
  }
} catch (e) {
  console.error('Error loading fallback folders:', e);
  fallbackFolders = [];
}
const fallbackInquiriesPath = path.join(__dirname, 'dev_inquiries.json');
let fallbackInquiries = [];
try {
  if (fs.existsSync(fallbackInquiriesPath)) {
    const data = fs.readFileSync(fallbackInquiriesPath, 'utf8');
    fallbackInquiries = JSON.parse(data || '[]');
  }
} catch (e) {
  console.error('Error loading fallback inquiries:', e);
  fallbackInquiries = [];
}
// Try to use MongoDB Atlas by default; fall back to file storage if connection fails
// The app will work either way - online with cloud sync or offline with local storage
const useFallback = process.env.USE_MONGODB === 'false';

const persistFallbackFiles = () => {
  try {
    fs.writeFileSync(fallbackFilesPath, JSON.stringify(fallbackFiles, null, 2));
  } catch (e) {
    console.error('Failed writing fallback files file', e);
  }
};
const persistFallbackActivity = () => {
  try {
    fs.writeFileSync(fallbackActivityPath, JSON.stringify(fallbackActivityLogs, null, 2));
  } catch (e) {
    console.error('Failed writing fallback activity file', e);
  }
};
const persistFallbackFolders = () => {
  try {
    fs.writeFileSync(fallbackFoldersPath, JSON.stringify(fallbackFolders, null, 2));
  } catch (e) {
    console.error('Failed writing fallback folders file', e);
  }
};
const persistFallbackInquiries = () => {
  try {
    fs.writeFileSync(fallbackInquiriesPath, JSON.stringify(fallbackInquiries, null, 2));
  } catch (e) {
    console.error('Failed writing fallback inquiries file', e);
  }
};

// Load .env from project root when running from backend/
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config(); // fallback to backend/.env if exists

const isProduction = process.env.NODE_ENV === 'production';
const demoSeedEnabled = !isProduction;
const firstAdminSetupToken = String(process.env.FIRST_ADMIN_SETUP_TOKEN || '').trim();
const DEFAULT_SESSION_SECRET = '70f1e04a35336b79732f2f034b101d4d';

const getCredentialValue = (envValue, fallbackValue) => {
  const trimmed = String(envValue || '').trim();
  if (trimmed) return trimmed;
  return isProduction ? '' : fallbackValue;
};

const validateProductionConfig = () => {
  if (!isProduction) return;

  const errors = [];
  if (!String(process.env.MONGO_URI || '').trim()) {
    errors.push('MONGO_URI is required in production.');
  }
  if (!String(process.env.CORS_ORIGINS || '').trim()) {
    errors.push('CORS_ORIGINS is required in production.');
  }
  if (!String(process.env.FRONTEND_URL || '').trim()) {
    errors.push('FRONTEND_URL is required in production.');
  }
  if (!String(process.env.SESSION_SECRET || '').trim()) {
    errors.push('SESSION_SECRET is required in production.');
  } else if (String(process.env.SESSION_SECRET).trim() === DEFAULT_SESSION_SECRET) {
    errors.push('SESSION_SECRET must not use the built-in development fallback in production.');
  }
  if (!String(process.env.EMAIL_USER || '').trim()) {
    errors.push('EMAIL_USER is required in production.');
  }
  if (!String(process.env.EMAIL_PASS || '').trim()) {
    errors.push('EMAIL_PASS is required in production.');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid production configuration:\n- ${errors.join('\n- ')}`);
  }
};

validateProductionConfig();

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = getCredentialValue(process.env.ADMIN_PASS, '1111');
const EMP_USER = process.env.EMP_USER || 'employee';
const EMP_PASS = getCredentialValue(process.env.EMP_PASS, '1111');
const CLIENT_USER = process.env.CLIENT_USER || 'client';
const CLIENT_PASS = getCredentialValue(process.env.CLIENT_PASS, '1111');
const ADMIN_SIGNUP_CODE = getCredentialValue(process.env.ADMIN_SIGNUP_CODE, ADMIN_PASS);
console.log('ADMIN_USER:', ADMIN_USER);
// Never log passwords/secrets.

const allowedOrigins = Array.from(
  new Set(
    [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:3101',
      'http://127.0.0.1:3101',
      'https://your-frontend.netlify.app',
      'https://your-frontend.onrender.com',
      ...(process.env.CORS_ORIGINS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ]
  )
);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
};

const app = express();
app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Multer Setup for File Uploads (Projects)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const allowedProjectImageMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const projectImageUpload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowedProjectImageMimeTypes.has(String(file.mimetype || '').toLowerCase())) {
      return cb(null, true);
    }
    return cb(new Error('Only JPG, PNG, WEBP, and GIF project images are allowed.'));
  },
});
const handleProjectImageUpload = (req, res, next) => {
  projectImageUpload.single('image')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Project image must be 8MB or smaller.' });
    }
    return res.status(400).json({ error: err.message || 'Invalid project image upload.' });
  });
};
const blockedUploadExtensions = new Set([
  '.ade', '.adp', '.app', '.bat', '.chm', '.cmd', '.com', '.cpl', '.dll', '.exe', '.hta',
  '.ins', '.isp', '.jar', '.js', '.jse', '.lib', '.lnk', '.mde', '.msc', '.msi', '.msp',
  '.mst', '.pif', '.ps1', '.psm1', '.scr', '.sct', '.sh', '.sys', '.vb', '.vbe', '.vbs',
  '.ws', '.wsc', '.wsf', '.wsh', '.php', '.phar', '.cgi', '.pl'
]);
const blockedUploadMimeTypes = new Set([
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-dosexec',
  'application/x-sh',
  'application/x-bat',
  'application/x-powershell',
  'application/java-archive',
  'text/x-php',
  'application/x-httpd-php',
  'application/javascript',
  'text/javascript',
]);
const isDangerousUpload = (file) => {
  const extension = path.extname(String(file?.originalname || '')).toLowerCase();
  const mimeType = String(file?.mimetype || '').toLowerCase();
  if (blockedUploadExtensions.has(extension)) return true;
  if (blockedUploadMimeTypes.has(mimeType)) return true;
  return false;
};
let safeFileUpload;
let handleSafeFileUpload;

const cloudStorageEnabled = Boolean(
  cloudinary &&
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (cloudStorageEnabled) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

safeFileUpload = multer({
  storage: cloudStorageEnabled ? multer.memoryStorage() : storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (isDangerousUpload(file)) {
      return cb(new Error('This file type is not allowed.'));
    }
    return cb(null, true);
  },
});
handleSafeFileUpload = (req, res, next) => {
  safeFileUpload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Files must be 25MB or smaller.' });
    }
    return res.status(400).json({ error: err.message || 'Invalid file upload.' });
  });
};

// Add CORS headers directly to the response
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// CORS configuration
app.use(cors({
  ...corsOptions
}));

// Add CSP headers
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'self' https://www.google.com https://recaptcha.google.com https://www.gstatic.com https://your-frontend.onrender.com; frame-src 'self' https://www.google.com https://recaptcha.google.com https://www.gstatic.com;"
  );
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const getRequestOrigin = (req) => {
  const originHeader = String(req.headers.origin || '').trim();
  if (originHeader) return originHeader;
  const refererHeader = String(req.headers.referer || '').trim();
  if (!refererHeader) return '';
  try {
    const refererUrl = new URL(refererHeader);
    return refererUrl.origin;
  } catch (_err) {
    return '';
  }
};
app.use('/api', (req, res, next) => {
  if (!unsafeMethods.has(req.method)) return next();

  const hasSessionCookie = Boolean(String(req.headers.cookie || '').trim());
  if (!hasSessionCookie) return next();

  const requestOrigin = getRequestOrigin(req);
  if (!requestOrigin) {
    return res.status(403).json({ error: 'Blocked request origin' });
  }
  if (!allowedOrigins.includes(requestOrigin)) {
    return res.status(403).json({ error: 'Blocked request origin' });
  }
  return next();
});

// Optional: serve the built React app if it exists (useful for local single-server runs).
// On Render we're deploying backend-only, so ../build and ../pages may not exist.
const reactBuildPath = path.join(__dirname, '../build');
const reactIndexPath = path.join(reactBuildPath, 'index.html');
const hasReactBuild = fs.existsSync(reactIndexPath);
if (hasReactBuild) {
  app.use(express.static(reactBuildPath));
}

const publicAssetsPath = path.join(__dirname, '../public/assets');
if (fs.existsSync(publicAssetsPath)) {
  app.use('/assets', express.static(publicAssetsPath));
}

const isProjectImagePathPublic = async (publicPath) => {
  const normalizedPath = String(publicPath || '').trim();
  if (!normalizedPath.startsWith('/uploads/')) return false;

  if (useFallback || mongoose.connection.readyState !== 1) {
    return fallbackProjects.some((project) => String(project.image || '') === normalizedPath);
  }

  const match = await Project.exists({ image: normalizedPath });
  return Boolean(match);
};

// Only expose uploads that are attached to public project cards.
app.get('/uploads/:filename', async (req, res) => {
  try {
    const rawFilename = String(req.params.filename || '').trim();
    const safeFilename = path.basename(rawFilename);
    if (!safeFilename || safeFilename !== rawFilename) {
      return res.status(404).end();
    }

    const publicPath = `/uploads/${safeFilename}`;
    const allowed = await isProjectImagePathPublic(publicPath);
    if (!allowed) {
      return res.status(404).end();
    }

    const diskPath = path.join(__dirname, 'uploads', safeFilename);
    if (!fs.existsSync(diskPath)) {
      return res.status(404).end();
    }

    return res.sendFile(diskPath);
  } catch (err) {
    console.error('Error serving public project image:', err);
    return res.status(500).json({ error: 'Failed to load project image' });
  }
});

// Serve image assets for legacy client paths (/Uploads/*).
const publicUploadsPath = path.join(__dirname, '../public/Uploads');
if (fs.existsSync(publicUploadsPath)) {
  app.use('/Uploads', express.static(publicUploadsPath));
}

// Serve assets with fallback
const assetsPath = path.join(__dirname, '../assets');
if (fs.existsSync(assetsPath)) {
  app.use('/Uploads', express.static(assetsPath));
} else {
  console.log('Assets directory not found. Creating it...');
  fs.mkdirSync(assetsPath, { recursive: true });
  app.use('/Uploads', express.static(assetsPath));
}

// Static file paths
const uploadsPath = path.join(__dirname, 'uploads');
const pagesPath = path.join(__dirname, '../pages');
console.log('Uploads directory:', uploadsPath);
console.log('Serving assets from:', assetsPath);
console.log('Serving pages from:', pagesPath);

app.use('/assets', express.static(assetsPath));
if (fs.existsSync(pagesPath)) {
  app.use('/pages', express.static(pagesPath));
}

// If this server is behind a reverse proxy (Netlify/Render/etc), trust proxy so secure cookies work correctly.
app.set('trust proxy', 1);

// ---------- scheduled exports (runs in-memory when server is running) ----------
function performScheduledExport() {
  const exportsDir = path.join(__dirname, '../exports');
  try {
    if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });
  } catch (e) {
    console.error('Failed to create exports directory', e);
  }

  const writeCsvFile = (filename, rows) => {
    try {
      const csv = rowsToCsv(rows);
      fs.writeFileSync(path.join(exportsDir, filename), csv);
      console.log(`Scheduled export written: ${filename}`);
    } catch (e) {
      console.error(`Error writing scheduled export ${filename}`, e);
    }
  };

  (async () => {
    try {
      let users = [];
      if (isDbReady()) {
        users = await User.find().lean();
      } else {
        users = AUTH_USERS.map((u) => ({
          id: u.id,
          username: u.username,
          role: u.role,
          projectIds: Array.isArray(u.projectIds) ? u.projectIds.map((v) => String(v)) : [],
        }));
      }
      writeCsvFile('users.csv', users);

      let inq = [];
      if (isDbReady()) {
        inq = await Inquiry.find().lean();
      } else {
        inq = [...fallbackInquiries];
      }
      writeCsvFile('inquiries.csv', inq);

      let logs = [];
      if (isDbReady()) {
        logs = await ActivityLog.find().lean();
      } else {
        logs = [...fallbackActivityLogs];
      }
      writeCsvFile('activity_logs.csv', logs);
    } catch (err) {
      console.error('Scheduled export job failed', err);
    }
  })();
}

// schedule first run 30 seconds after server start (give DB time to connect) and then daily
setTimeout(() => {
  performScheduledExport();
  setInterval(performScheduledExport, 24 * 60 * 60 * 1000);
}, 30000);

const sessionCookieSecure =
  isProduction &&
  String(process.env.SESSION_COOKIE_SECURE || '').toLowerCase() !== 'false';
const sessionCookieName = process.env.SESSION_COOKIE_NAME || 'construction.sid';

app.use(session({
  ...(MongoStore && process.env.MONGO_URI
    ? {
        store: MongoStore.create({
          mongoUrl: process.env.MONGO_URI,
          collectionName: 'sessions',
          ttl: 60 * 60, // seconds
        }),
      }
    : {}),
  name: sessionCookieName,
  proxy: sessionCookieSecure,
  secret: process.env.SESSION_SECRET || DEFAULT_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  unset: 'destroy',
  cookie: {
    // Avoid breaking local development if NODE_ENV is mis-set; allow overriding in env.
    secure: sessionCookieSecure,
    sameSite: sessionCookieSecure ? 'none' : 'lax',
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 1000, // 1 hour
  },
}));

// Root Route
app.get('/', (req, res) => {
    console.log('Serving root route');
    if (hasReactBuild) {
      return res.sendFile(reactIndexPath);
    }
    return res.json({
      ok: true,
      service: 'construction-backend',
      status: '/api/status',
    });
});

// CAPTCHA Route
app.options('/api/captcha', cors(corsOptions)); // Add OPTIONS handler for captcha

app.get('/api/captcha', (req, res) => {
    console.log('HIT /api/captcha');
    const imageOptions = [
        { src: '/uploads/dog.jpg', id: 'dog', label: 'Dog' },
        { src: '/uploads/cat.jpg', id: 'cat', label: 'Cat' },
        { src: '/uploads/bird.jpg', id: 'bird', label: 'Bird' }
    ];
    const correctIndex = Math.floor(Math.random() * imageOptions.length);
    const correctAnswer = imageOptions[correctIndex].id;

    // Generate 9 random images (3x3 grid)
    const images = Array.from({ length: 9 }, (_, index) => ({
        id: index,
        url: `/captcha-images/${Math.floor(Math.random() * 20)}.jpg` // Assuming you have 20 different images
    }));

    // Randomly select 2-4 correct images
    const numCorrect = Math.floor(Math.random() * 3) + 2; // 2 to 4 correct images
    const correctAnswers = images
        .sort(() => Math.random() - 0.5)
        .slice(0, numCorrect)
        .map(img => img.id);

    // Store the correct answers in the session
    req.session.captchaAnswer = correctAnswers;

    res.json({
        question: imageOptions[correctIndex].label,
        images
    });
});

// Basic Auth for Admin Page
app.get('/pages/admin', basicAuth({
    users: { [ADMIN_USER]: ADMIN_PASS },
    challenge: true,
    unauthorizedResponse: 'Unauthorized Access'
}), (req, res) => {
    console.log('Admin access granted');
    res.sendFile(path.join(__dirname, '../pages/admin.html'));
});

// Dynamic Page Route
app.get('/pages/:page', (req, res) => {
    console.log('Serving dynamic page:', req.params.page);
    const pagePath = path.join(__dirname, '../pages', `${req.params.page}.html`);
    res.sendFile(pagePath, (err) => {
        if (err) {
            console.error(`Error serving page ${req.params.page}:`, err);
            res.status(404).send('Page not found');
        }
    });
});

// MongoDB Connection
const mongoURI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/mti-projects';
const isAtlas = mongoURI.includes('mongodb+srv://');
console.log('Attempting to connect to MongoDB with URI:', mongoURI.replace(/:[^:@]+@/, ':****@'));
const connectDB = async () => {
    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: isAtlas ? 15000 : 5000,
            maxPoolSize: 10,
        });
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err.message || err);
        if (isAtlas) {
            console.log('Atlas tips: 1) Network Access → Add IP or Allow from Anywhere  2) Database Access → user/password  3) Restart backend after fixing.');
        }
        console.log('Server will keep running; fix connection and restart to use projects.');
    }
};

// Helper function to verify reCAPTCHA token using https module
async function verifyRecaptcha(token) {
    return new Promise((resolve) => {
        try {
            // Use the correct secret key for reCAPTCHA v2
            const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY || '6Ld6MSErAAAAAO--jElWpUWtWMYqDGA301_LxMvM';
            
            const data = querystring.stringify({
                secret: recaptchaSecret,
                response: token
            });
            
            const options = {
                hostname: 'www.google.com',
                port: 443,
                path: '/recaptcha/api/siteverify',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': data.length
                }
            };
            
            const req = https.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const jsonResponse = JSON.parse(responseData);
                        console.log('reCAPTCHA verification response:', jsonResponse);
                        resolve(jsonResponse.success);
                    } catch (e) {
                        console.error('Error parsing reCAPTCHA response:', e);
                        resolve(false);
                    }
                });
            });
            
            req.on('error', (e) => {
                console.error('Error verifying reCAPTCHA:', e);
                resolve(false);
            });
            
            req.write(data);
            req.end();
        } catch (error) {
            console.error('reCAPTCHA verification error:', error);
            resolve(false);
        }
    });
}

connectDB();
mongoose.connection.on('connected', () => console.log('Mongoose connected to DB'));
mongoose.connection.on('error', (err) => console.log('Mongoose connection error:', err));
mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
    if (process.env.MONGO_URI) setTimeout(connectDB, 5000);
});

const isDbReady = () => !useFallback && mongoose.connection.readyState === 1;
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const isValidEmail = (value) => /\S+@\S+\.\S+/.test(String(value || '').trim());
const deriveDefaultEmail = (role, username) => {
  const local = String(username || role || 'user')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-');
  return `${local || role || 'user'}@construction.local`;
};
const getUserLabel = (user = {}) => String(user.email || user.username || '').trim();
const createPasswordResetToken = () => crypto.randomBytes(32).toString('hex');
const hashPasswordResetToken = (token) => crypto.createHash('sha256').update(String(token || '')).digest('hex');
const appOrigin = String(process.env.FRONTEND_URL || process.env.APP_URL || allowedOrigins[0] || 'http://localhost:3000').trim().replace(/\/$/, '');
const buildPasswordResetUrl = (token, audience = 'client') => {
  const params = new URLSearchParams({ token });
  const normalizedAudience = String(audience || '').trim().toLowerCase();
  if (normalizedAudience === 'staff') {
    params.set('audience', 'staff');
  }
  return `${appOrigin}/reset-password?${params.toString()}`;
};
const sendPasswordResetEmail = async ({ email, resetUrl, role, audience }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`Password reset email skipped. Reset URL for ${email}: ${resetUrl}`);
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const accountLabel = audience === 'staff'
    ? 'staff account'
    : role === 'client'
      ? 'client account'
      : 'workspace account';

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Reset your Construction Operations Portal password',
    text: `A password reset was requested for your ${accountLabel}.\n\nReset your password here:\n${resetUrl}\n\nThis link expires in 60 minutes. If you did not request this, you can ignore this email.`,
    html: `<p>A password reset was requested for your ${accountLabel}.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 60 minutes. If you did not request this, you can ignore this email.</p>`,
  });
  return true;
};

const ensureDefaultUsers = async () => {
  if (!isDbReady() || !demoSeedEnabled) return;
  try {
    const seeds = [
      { username: ADMIN_USER, email: deriveDefaultEmail('admin', ADMIN_USER), password: ADMIN_PASS, role: 'admin' },
      { username: EMP_USER, email: deriveDefaultEmail('user', EMP_USER), password: EMP_PASS, role: 'user' },
      { username: CLIENT_USER, email: deriveDefaultEmail('client', CLIENT_USER), password: CLIENT_PASS, role: 'client' },
    ];

    for (const seed of seeds) {
      const usernameLower = String(seed.username || '').trim().toLowerCase();
      const emailLower = normalizeEmail(seed.email);
      if (!usernameLower && !emailLower) continue;
      const exists = await User.findOne({
        $or: [
          ...(emailLower ? [{ emailLower }] : []),
          ...(usernameLower ? [{ usernameLower }] : []),
        ],
      });
      if (exists) {
        let changed = false;
        if (!exists.email && seed.email) {
          exists.email = seed.email;
          changed = true;
        }
        if (changed) await exists.save();
        continue;
      }
      const passwordHash = await hashPassword(seed.password);
      await User.create({
        username: seed.username || seed.email,
        email: seed.email,
        role: seed.role,
        passwordHash,
      });
    }
  } catch (err) {
    console.error('Failed ensuring default users', err);
  }
};

mongoose.connection.on('connected', () => {
  // Seed default accounts (admin/employee/client) if they don't exist yet.
  ensureDefaultUsers();
});

const authUsersPath = path.join(__dirname, 'dev_auth_users.json');
const defaultAuthUsers = demoSeedEnabled
  ? [
      { id: 'admin-1', username: ADMIN_USER, email: deriveDefaultEmail('admin', ADMIN_USER), password: ADMIN_PASS, role: 'admin' },
      { id: 'user-1', username: EMP_USER, email: deriveDefaultEmail('user', EMP_USER), password: EMP_PASS, role: 'user' },
      { id: 'client-1', username: CLIENT_USER, email: deriveDefaultEmail('client', CLIENT_USER), password: CLIENT_PASS, role: 'client' },
    ]
  : [];
let AUTH_USERS = [...defaultAuthUsers];

try {
  if (fs.existsSync(authUsersPath)) {
    const raw = fs.readFileSync(authUsersPath, 'utf8');
    const parsed = JSON.parse(raw || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) {
      AUTH_USERS = parsed;
    }
  }
} catch (e) {
  console.error('Error loading auth users fallback file:', e);
}

const persistAuthUsers = () => {
  try {
    fs.writeFileSync(authUsersPath, JSON.stringify(AUTH_USERS, null, 2));
  } catch (e) {
    console.error('Failed writing auth users file', e);
  }
};

defaultAuthUsers.forEach((seedUser) => {
  const exists = AUTH_USERS.some(
    (u) =>
      String(u.username || '').toLowerCase() === String(seedUser.username || '').toLowerCase() ||
      normalizeEmail(u.email) === normalizeEmail(seedUser.email)
  );
  if (!exists) AUTH_USERS.push(seedUser);
});
AUTH_USERS = AUTH_USERS.map((user) => ({
  ...user,
  email: String(user.email || deriveDefaultEmail(user.role, user.username)).trim().toLowerCase(),
  isActive: user.isActive !== false,
  deactivatedAt: user.deactivatedAt || null,
}));
persistAuthUsers();

const getAdminAccountCount = async () => {
  if (isDbReady()) {
    return User.countDocuments({ role: 'admin', isActive: true });
  }
  return AUTH_USERS.filter((user) => user.role === 'admin' && user.isActive !== false).length;
};

const sanitizeUser = (user) => ({
  id: String(user.id || user._id || ''),
  username: user.username || user.email || '',
  email: user.email || '',
  role: user.role,
  isActive: user.isActive !== false,
  projectIds: Array.isArray(user.projectIds) ? user.projectIds.map((v) => String(v)) : [],
});
const getSessionUser = (req) => req.session && req.session.authUser ? req.session.authUser : null;

const requireAuth = (req, res, next) => {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  req.authUser = user;
  next();
};

const requireRoles = (roles) => (req, res, next) => {
  const user = req.authUser || getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!roles.includes(user.role)) return res.status(403).json({ error: 'Forbidden' });
  req.authUser = user;
  next();
};

const normalizeInquiryStatus = (value) => {
  const v = String(value || '').trim().toLowerCase();
  if (['new', 'in_progress', 'resolved', 'spam'].includes(v)) return v;
  return 'new';
};

const normalizeInquiryPriority = (value) => {
  const v = String(value || '').trim().toLowerCase();
  if (['low', 'normal', 'high', 'urgent'].includes(v)) return v;
  return 'normal';
};

const isClosedInquiryStatus = (status) => ['resolved', 'spam'].includes(normalizeInquiryStatus(status));

const normalizeInquiryOwner = (value) => String(value || '').trim();

const normalizeFollowUpAt = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const sanitizeInquiry = (item) => ({
  id: String(item.id || item._id || ''),
  name: String(item.name || ''),
  email: String(item.email || ''),
  phone: String(item.phone || ''),
  companyName: String(item.companyName || ''),
  projectType: String(item.projectType || ''),
  siteLocation: String(item.siteLocation || ''),
  timeline: String(item.timeline || ''),
  serviceNeeded: String(item.serviceNeeded || ''),
  message: String(item.message || ''),
  source: String(item.source || 'contact_form'),
  ipAddress: String(item.ipAddress || ''),
  status: normalizeInquiryStatus(item.status),
  priority: normalizeInquiryPriority(item.priority),
  owner: String(item.owner || item.assignedTo || ''),
  assignedTo: String(item.assignedTo || ''),
  nextFollowUpAt: item.nextFollowUpAt || null,
  notes: String(item.notes || ''),
  handledBy: String(item.handledBy || ''),
  handledAt: item.handledAt || null,
  createdAt: item.createdAt || null,
  updatedAt: item.updatedAt || null,
});

const sanitizeClientFollowUpInquiry = (item) => {
  const inquiry = sanitizeInquiry(item);
  return {
    id: inquiry.id,
    projectType: inquiry.projectType,
    message: inquiry.message,
    source: inquiry.source,
    notes: inquiry.notes,
    status: inquiry.status,
    priority: inquiry.priority,
    owner: inquiry.owner,
    nextFollowUpAt: inquiry.nextFollowUpAt,
    createdAt: inquiry.createdAt,
    updatedAt: inquiry.updatedAt,
  };
};

const createInquiryRecord = async ({
  name,
  email,
  phone,
  companyName,
  projectType,
  siteLocation,
  timeline,
  serviceNeeded,
  message,
  source = 'contact_form',
  notes = '',
  ipAddress = '',
}) => {
  const payload = {
    name: String(name || '').trim(),
    email: String(email || '').trim(),
    phone: String(phone || '').trim(),
    companyName: String(companyName || '').trim(),
    projectType: String(projectType || '').trim(),
    siteLocation: String(siteLocation || '').trim(),
    timeline: String(timeline || '').trim(),
    serviceNeeded: String(serviceNeeded || '').trim(),
    message: String(message || '').trim(),
    source: String(source || 'contact_form').trim() || 'contact_form',
    ipAddress: String(ipAddress || '').trim(),
    status: 'new',
    priority: 'normal',
    owner: '',
    assignedTo: '',
    nextFollowUpAt: null,
    notes: String(notes || '').trim(),
    handledBy: '',
    handledAt: null,
  };

  if (useFallback || mongoose.connection.readyState !== 1) {
    const created = {
      _id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    fallbackInquiries.unshift(created);
    fallbackInquiries = fallbackInquiries.slice(0, 2000);
    persistFallbackInquiries();
    return sanitizeInquiry(created);
  }

  const created = await Inquiry.create(payload);
  return sanitizeInquiry(created.toObject ? created.toObject() : created);
};

const getInquiryByIds = async (ids = []) => {
  const normalizedIds = Array.from(
    new Set(
      ids
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    )
  );

  if (!normalizedIds.length) return [];

  if (useFallback || mongoose.connection.readyState !== 1) {
    return fallbackInquiries
      .filter((item) => normalizedIds.includes(String(item._id || item.id || '').trim()))
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
      .map(sanitizeClientFollowUpInquiry);
  }

  const records = await Inquiry.find({ _id: { $in: normalizedIds } }).lean();
  return records
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
    .map(sanitizeClientFollowUpInquiry);
};

const calculateAdminKpis = ({ inquiries = [] }) => {
  const now = Date.now();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const total = inquiries.length;
  const newToday = inquiries.filter((item) => {
    const createdAt = item.createdAt ? new Date(item.createdAt).getTime() : 0;
    return createdAt >= startOfDay.getTime();
  }).length;

  const overdueFollowups = inquiries.filter((item) => {
    const status = normalizeInquiryStatus(item.status);
    const followUpAt = item.nextFollowUpAt ? new Date(item.nextFollowUpAt).getTime() : 0;
    return !isClosedInquiryStatus(status) && followUpAt > 0 && followUpAt < now;
  }).length;

  const qualifiedCount = inquiries.filter((item) => {
    const status = normalizeInquiryStatus(item.status);
    return status === 'in_progress' || status === 'resolved';
  }).length;

  const proposalCount = inquiries.filter((item) => normalizeInquiryStatus(item.status) === 'resolved').length;

  return {
    new_today: newToday,
    overdue_followups: overdueFollowups,
    qualified_rate: total ? Math.round((qualifiedCount / total) * 100) : 0,
    proposal_rate: total ? Math.round((proposalCount / total) * 100) : 0,
  };
};

const logActivity = async (req, payload) => {
  const actor = req.authUser || getSessionUser(req);

  const entry = {
    actorId: actor?.id || payload.actorId || 'anonymous',
    actorRole: actor?.role || payload.actorRole || 'anonymous',
    action: payload.action,
    targetType: payload.targetType,
    targetId: payload.targetId || '',
    details: payload.details || '',
    metadata: payload.metadata || {},
  };

  if (!actor && !payload.allowAnonymous && !payload.actorId) return;

  if (useFallback || mongoose.connection.readyState !== 1) {
    fallbackActivityLogs.unshift({
      _id: Date.now().toString(),
      ...entry,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    fallbackActivityLogs = fallbackActivityLogs.slice(0, 500);
    persistFallbackActivity();
    return;
  }

  try {
    await ActivityLog.create(entry);
  } catch (err) {
    console.error('Failed to save activity log', err);
  }
};

const getLastExportActivity = async () => {
  const exportActionMap = {
    'admin.export_users': 'users',
    'admin.export_inquiries': 'inquiries',
    'admin.export_activity': 'activity',
    'admin.export_all': 'all',
  };
  const lastExports = {
    users: null,
    inquiries: null,
    activity: null,
    all: null,
  };

  if (useFallback || mongoose.connection.readyState !== 1) {
    fallbackActivityLogs
      .filter((item) => Object.prototype.hasOwnProperty.call(exportActionMap, String(item.action || '')))
      .forEach((item) => {
        const key = exportActionMap[String(item.action || '')];
        if (!lastExports[key]) {
          lastExports[key] = item.createdAt || null;
        }
      });
    return lastExports;
  }

  const items = await ActivityLog.find({
    action: { $in: Object.keys(exportActionMap) },
  }).sort({ createdAt: -1 }).lean();

  items.forEach((item) => {
    const key = exportActionMap[String(item.action || '')];
    if (key && !lastExports[key]) {
      lastExports[key] = item.createdAt || null;
    }
  });

  return lastExports;
};

const getActivityCategory = (action) => {
  const normalized = String(action || '').trim();
  if (normalized.startsWith('auth.')) return 'auth';
  if (normalized.startsWith('admin.export_')) return 'exports';
  if (normalized.startsWith('admin.user_')) return 'users';
  if (normalized.startsWith('admin.inquiry_')) return 'inquiries';
  return 'other';
};

const filterUsersByActiveState = (users, activeFilter = 'all') => {
  const normalized = String(activeFilter || 'all').trim().toLowerCase();
  if (normalized === 'active') {
    return users.filter((user) => user.isActive !== false);
  }
  if (normalized === 'inactive') {
    return users.filter((user) => user.isActive === false);
  }
  return users;
};

const getInactiveUserCount = async () => {
  if (isDbReady()) {
    return User.countDocuments({ isActive: false });
  }
  return AUTH_USERS.filter((user) => user.isActive === false).length;
};

const getRecentFailedLoginCount = async () => {
  const since = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));

  if (useFallback || mongoose.connection.readyState !== 1) {
    return fallbackActivityLogs.filter((item) => {
      if (String(item.action || '') !== 'auth.login_failed') return false;
      const createdAt = new Date(item.createdAt || 0);
      return !Number.isNaN(createdAt.getTime()) && createdAt >= since;
    }).length;
  }

  return ActivityLog.countDocuments({
    action: 'auth.login_failed',
    createdAt: { $gte: since },
  });
};

// API Routes
registerAuthRoutes(app, {
  User,
  AUTH_USERS,
  ADMIN_SIGNUP_CODE,
  hashPassword,
  verifyPassword,
  sanitizeUser,
  requireAuth,
  persistAuthUsers,
  logActivity,
  isDbReady,
  getSessionUser,
  createPasswordResetToken,
  hashPasswordResetToken,
  sendPasswordResetEmail,
  buildPasswordResetUrl,
  isProduction,
  getClientIp: (req) => requestIp.getClientIp(req) || req.ip || '',
  getAdminAccountCount,
  demoSeedEnabled,
  firstAdminSetupToken,
});

app.get('/api/admin/system-status', requireAuth, requireRoles(['admin']), async (_req, res) => {
  try {
    const dbConnected = mongoose.connection && mongoose.connection.readyState === 1;
    const adminCount = await getAdminAccountCount();
    const inactiveUserCount = await getInactiveUserCount();
    const recentFailedLogins = await getRecentFailedLoginCount();
    const frontendUrlConfigured = Boolean(String(process.env.FRONTEND_URL || '').trim());
    const emailConfigured = Boolean(String(process.env.EMAIL_USER || '').trim() && String(process.env.EMAIL_PASS || '').trim());
    const usingFallback = useFallback || !dbConnected;
    const lastExports = await getLastExportActivity();
    const setupTokenConfigured = Boolean(firstAdminSetupToken);
    const setupComplete = adminCount > 0;
    const alerts = buildAdminSystemStatusAlerts({
      usingFallback,
      emailConfigured,
      frontendUrlConfigured,
      isProduction,
      adminCount,
      demoSeedEnabled,
      setupTokenConfigured,
    });

    return res.json({
      dbConnected,
      usingFallback,
      emailConfigured,
      frontendUrlConfigured,
      cloudStorageEnabled,
      cloudConvertEnabled,
      isProduction,
      demoSeedEnabled,
      adminCount,
      inactiveUserCount,
      recentFailedLogins,
      requiresAdminSetup: isProduction && adminCount === 0,
      setupComplete,
      setupTokenConfigured,
      passwordPolicy: PASSWORD_POLICY,
      lastExports,
      alerts,
    });
  } catch (err) {
    console.error('Load admin system status failed', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/users', requireAuth, requireRoles(['admin']), async (req, res) => {
  try {
    if (isDbReady()) {
      const users = await User.find().sort({ createdAt: -1 }).lean();
      return res.json(users.map((u) => ({
        id: String(u._id),
        username: u.username || u.email || '',
        email: u.email || '',
        role: u.role,
        isActive: u.isActive !== false,
        projectIds: Array.isArray(u.projectIds) ? u.projectIds.map((v) => String(v)) : [],
        createdAt: u.createdAt,
      })));
    }
    return res.json(AUTH_USERS.map((u) => ({
      id: u.id,
      username: u.username || u.email || '',
      email: u.email || '',
      role: u.role,
      isActive: u.isActive !== false,
      projectIds: Array.isArray(u.projectIds) ? u.projectIds.map((v) => String(v)) : [],
    })));
  } catch (err) {
    console.error('List users failed', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/kpis', requireAuth, requireRoles(['admin']), async (req, res) => {
  try {
    let inquiries = [];
    if (useFallback || mongoose.connection.readyState !== 1) {
      inquiries = fallbackInquiries.map((item) => sanitizeInquiry(item));
    } else {
      const list = await Inquiry.find().lean();
      inquiries = list.map((item) => sanitizeInquiry(item));
    }

    return res.json({
      kpis: calculateAdminKpis({ inquiries }),
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Load admin KPIs failed', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// CSV export endpoints -----------------------------------------------------
app.get('/api/admin/export/users', requireAuth, requireRoles(['admin']), async (req, res) => {
  try {
    let users = [];
    if (isDbReady()) {
      users = await User.find().sort({ createdAt: -1 }).lean();
    } else {
      users = AUTH_USERS.map((u) => ({
        id: u.id,
        username: u.username || u.email || '',
        email: u.email || '',
        role: u.role,
        isActive: u.isActive !== false,
        projectIds: Array.isArray(u.projectIds) ? u.projectIds.map((v) => String(v)) : [],
      }));
    }
    // optional filter by role
    if (req.query.role && req.query.role !== 'all') {
      const roleReq = String(req.query.role).toLowerCase();
      users = users.filter((u) => String(u.role).toLowerCase() === roleReq);
    }
    users = filterUsersByActiveState(users, req.query.active || 'all');
    const csvData = rowsToCsv(users);
    await logActivity(req, {
      action: 'admin.export_users',
      targetType: 'export',
      targetId: 'users',
      details: 'Admin exported users CSV',
      metadata: { format: 'csv', roleFilter: req.query.role || 'all', activeFilter: req.query.active || 'all' },
    });
    res.setHeader('Content-Type', 'text/csv');
    res.attachment('users.csv');
    return res.send(csvData);
  } catch (err) {
    console.error('Export users CSV failed', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/export/inquiries', requireAuth, requireRoles(['admin']), async (req, res) => {
  try {
    let list = [];
    if (isDbReady()) {
      const filter = {};
      if (req.query.status && req.query.status !== 'all') {
        filter.status = String(req.query.status);
      }
      list = await Inquiry.find(filter).sort({ createdAt: -1 }).lean();
    } else {
      list = [...fallbackInquiries];
      if (req.query.status && req.query.status !== 'all') {
        list = list.filter((i) => String(i.status) === String(req.query.status));
      }
    }
    const csvData = rowsToCsv(list);
    await logActivity(req, {
      action: 'admin.export_inquiries',
      targetType: 'export',
      targetId: 'inquiries',
      details: 'Admin exported inquiries CSV',
      metadata: { format: 'csv', statusFilter: req.query.status || 'all' },
    });
    res.setHeader('Content-Type', 'text/csv');
    res.attachment('inquiries.csv');
    return res.send(csvData);
  } catch (err) {
    console.error('Export inquiries CSV failed', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/export/activity', requireAuth, requireRoles(['admin']), async (req, res) => {
  try {
    let logs = [];
    if (isDbReady()) {
      const q = ActivityLog.find().sort({ createdAt: -1 });
      const limit = parseInt(req.query.limit || '0', 10);
      if (limit > 0) q.limit(limit);
      logs = await q.lean();
    } else {
      logs = [...fallbackActivityLogs];
      const limit = parseInt(req.query.limit || '0', 10);
      if (limit > 0) logs = logs.slice(0, limit);
    }
    if (req.query.category && req.query.category !== 'all') {
      const category = String(req.query.category || 'all').trim().toLowerCase();
      logs = logs.filter((item) => getActivityCategory(item.action) === category);
    }
    const csvData = rowsToCsv(logs);
    await logActivity(req, {
      action: 'admin.export_activity',
      targetType: 'export',
      targetId: 'activity',
      details: 'Admin exported activity CSV',
      metadata: { format: 'csv', limit: req.query.limit || '0', category: req.query.category || 'all' },
    });
    res.setHeader('Content-Type', 'text/csv');
    res.attachment('activity_logs.csv');
    return res.send(csvData);
  } catch (err) {
    console.error('Export activity CSV failed', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/export/all', requireAuth, requireRoles(['admin']), async (req, res) => {
  try {
    let users = [];
    let inquiriesList = [];
    let projectsList = [];
    let activity = [];

    if (isDbReady()) {
      users = await User.find().sort({ createdAt: -1 }).lean();
      inquiriesList = await Inquiry.find().sort({ createdAt: -1 }).lean();
      projectsList = await Project.find().sort({ createdAt: -1 }).lean();
      activity = await ActivityLog.find().sort({ createdAt: -1 }).limit(500).lean();
    } else {
      users = AUTH_USERS.map((u) => ({
        id: u.id,
        username: u.username || u.email || '',
        email: u.email || '',
        role: u.role,
        isActive: u.isActive !== false,
        projectIds: Array.isArray(u.projectIds) ? u.projectIds.map((v) => String(v)) : [],
        deactivatedAt: u.deactivatedAt || null,
      }));
      inquiriesList = [...fallbackInquiries];
      projectsList = [...fallbackProjects];
      activity = [...fallbackActivityLogs].slice(0, 500);
    }

    const bundle = {
      exportedAt: new Date().toISOString(),
      exportedBy: {
        id: req.authUser.id,
        email: req.authUser.email || '',
        role: req.authUser.role,
      },
      systemStatus: {
        dbConnected: mongoose.connection && mongoose.connection.readyState === 1,
        usingFallback: useFallback || mongoose.connection.readyState !== 1,
        cloudStorageEnabled,
        cloudConvertEnabled,
      },
      users,
      inquiries: inquiriesList,
      projects: projectsList,
      activity,
    };

    await logActivity(req, {
      action: 'admin.export_all',
      targetType: 'export',
      targetId: 'all',
      details: 'Admin exported full admin data bundle',
      metadata: {
        format: 'json',
        users: users.length,
        inquiries: inquiriesList.length,
        projects: projectsList.length,
        activity: activity.length,
      },
    });

    res.setHeader('Content-Type', 'application/json');
    res.attachment(`admin-data-export-${new Date().toISOString().slice(0, 10)}.json`);
    return res.send(JSON.stringify(bundle, null, 2));
  } catch (err) {
    console.error('Export all admin data failed', err);
    return res.status(500).json({ error: 'Server error' });
  }
});


app.put('/api/admin/users/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!id) return res.status(400).json({ error: 'User id required' });

  const updates = {};
  if (req.body.email !== undefined) {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }
    updates.email = email;
    updates.username = email;
  }
  if (req.body.role !== undefined) {
    const roleInput = String(req.body.role || '').trim().toLowerCase();
    if (!['admin', 'user', 'client'].includes(roleInput)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    updates.role = roleInput;
  }
  if (req.body.isActive !== undefined) {
    updates.isActive = Boolean(req.body.isActive);
    updates.deactivatedAt = updates.isActive ? null : new Date();
  }

  if (req.body.projectIds !== undefined) {
    const raw = Array.isArray(req.body.projectIds) ? req.body.projectIds : [];
    const cleaned = raw
      .map((v) => String(v || '').trim())
      .filter(Boolean)
      .slice(0, 100);
    updates.projectIds = cleaned;
  }

  try {
    if (isDbReady()) {
      const existing = await User.findById(id);
      if (!existing) return res.status(404).json({ error: 'User not found' });
      if (updates.email) {
        const emailExists = await User.findOne({ emailLower: normalizeEmail(updates.email), _id: { $ne: id } }).lean();
        if (emailExists) return res.status(409).json({ error: 'Email already exists' });
      }

      if (
        (updates.role && existing.role === 'admin' && updates.role !== 'admin') ||
        (existing.role === 'admin' && updates.isActive === false)
      ) {
        const remainingAdmins = await User.countDocuments({ role: 'admin', isActive: true, _id: { $ne: id } });
        if (remainingAdmins === 0) {
          return res.status(400).json({ error: 'Cannot deactivate or demote the last active admin account' });
        }
      }

      Object.keys(updates).forEach((k) => { existing[k] = updates[k]; });
      await existing.save();

      await logActivity(req, {
        action: updates.isActive === false ? 'admin.user_deactivate' : updates.isActive === true ? 'admin.user_reactivate' : 'admin.user_update',
        targetType: 'user',
        targetId: String(existing._id),
        details: updates.isActive === false
          ? `Admin deactivated user ${existing.username} (${existing.role})`
          : updates.isActive === true
            ? `Admin reactivated user ${existing.username} (${existing.role})`
            : `Admin updated user ${existing.username}`,
        metadata: Object.keys(updates).reduce((acc, k) => ({ ...acc, [k]: updates[k] }), {}),
      });

      return res.json({ user: sanitizeUser(existing) });
    }

    const idx = AUTH_USERS.findIndex((u) => String(u.id) === id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    const existing = AUTH_USERS[idx];
    if (updates.email) {
      const emailExists = AUTH_USERS.some((u) => String(u.id) !== id && normalizeEmail(u.email) === normalizeEmail(updates.email));
      if (emailExists) return res.status(409).json({ error: 'Email already exists' });
    }

    if (
      (updates.role && existing.role === 'admin' && updates.role !== 'admin') ||
      (existing.role === 'admin' && updates.isActive === false)
    ) {
      const remainingAdmins = AUTH_USERS.filter((u) => u.role === 'admin' && u.isActive !== false && String(u.id) !== id).length;
      if (remainingAdmins === 0) {
        return res.status(400).json({ error: 'Cannot deactivate or demote the last active admin account' });
      }
    }

    AUTH_USERS[idx] = { ...existing, ...updates };
    persistAuthUsers();
    await logActivity(req, {
      action: updates.isActive === false ? 'admin.user_deactivate' : updates.isActive === true ? 'admin.user_reactivate' : 'admin.user_update',
      targetType: 'user',
      targetId: id,
      details: updates.isActive === false
        ? `Admin deactivated user ${existing.username} (${existing.role})`
        : updates.isActive === true
          ? `Admin reactivated user ${existing.username} (${existing.role})`
          : `Admin updated user ${existing.username}`,
      metadata: Object.keys(updates).reduce((acc, k) => ({ ...acc, [k]: updates[k] }), {}),
    });
    return res.json({ user: sanitizeUser(AUTH_USERS[idx]) });
  } catch (err) {
    console.error('Update user failed', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/users', requireAuth, requireRoles(['admin']), async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const roleInput = String(req.body.role || 'user').trim().toLowerCase();
  const role = ['admin', 'user', 'client'].includes(roleInput) ? roleInput : 'user';

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'A valid email is required' });
  }
  if (!isPasswordStrong(password)) {
    return res.status(400).json({ error: PASSWORD_POLICY_MESSAGE });
  }

  try {
    if (isDbReady()) {
      const exists = await User.findOne({ emailLower: normalizeEmail(email) }).lean();
      if (exists) return res.status(409).json({ error: 'Email already exists' });
      const passwordHash = await hashPassword(password);
      const created = await User.create({ username: email, email, role, passwordHash, isActive: true });
      await logActivity(req, {
        action: 'admin.user_create',
        targetType: 'user',
        targetId: String(created._id),
        details: `Admin created user ${getUserLabel(created)} (${created.role})`,
      });
      return res.status(201).json({ user: { id: String(created._id), username: created.username, email: created.email || '', role: created.role, createdAt: created.createdAt } });
    }

    const exists = AUTH_USERS.some((u) => normalizeEmail(u.email) === normalizeEmail(email));
    if (exists) return res.status(409).json({ error: 'Email already exists' });
    const created = { id: `${role}-${Date.now()}`, username: email, email, role, isActive: true, passwordHash: await hashPassword(password), projectIds: [] };
    AUTH_USERS.push(created);
    persistAuthUsers();
    await logActivity(req, {
      action: 'admin.user_create',
      targetType: 'user',
      targetId: created.id,
      details: `Admin created user ${getUserLabel(created)} (${created.role})`,
    });
    return res.status(201).json({ user: { id: created.id, username: created.username, email: created.email || '', role: created.role } });
  } catch (err) {
    console.error('Create user failed', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/users/:id/reset-password', requireAuth, requireRoles(['admin']), async (req, res) => {
  const id = String(req.params.id || '').trim();
  const newPassword = String(req.body.newPassword || '');
  if (!id) return res.status(400).json({ error: 'User id required' });
  if (!isPasswordStrong(newPassword)) return res.status(400).json({ error: PASSWORD_POLICY_MESSAGE });

  try {
    if (isDbReady()) {
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      user.passwordHash = await hashPassword(newPassword);
      await user.save();
      await logActivity(req, {
        action: 'admin.user_reset_password',
        targetType: 'user',
        targetId: String(user._id),
        details: `Admin reset password for ${user.username}`,
      });
      return res.json({ ok: true });
    }

    const record = AUTH_USERS.find((u) => String(u.id) === id);
    if (!record) return res.status(404).json({ error: 'User not found' });
    record.passwordHash = await hashPassword(newPassword);
    delete record.password;
    persistAuthUsers();
    await logActivity(req, {
      action: 'admin.user_reset_password',
      targetType: 'user',
      targetId: record.id,
      details: `Admin reset password for ${record.username}`,
    });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Reset password failed', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/users/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
  const id = String(req.params.id || '').trim();
  if (!id) return res.status(400).json({ error: 'User id required' });
  if (String(req.authUser.id) === id) return res.status(400).json({ error: 'You cannot deactivate your own account' });

  try {
    if (isDbReady()) {
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (user.isActive === false) {
        return res.json({ ok: true, user: sanitizeUser(user), alreadyInactive: true });
      }
      const remainingAdmins = await User.countDocuments({ role: 'admin', isActive: true, _id: { $ne: id } });
      if (user.role === 'admin' && remainingAdmins === 0) {
        return res.status(400).json({ error: 'Cannot deactivate the last active admin account' });
      }
      user.isActive = false;
      user.deactivatedAt = new Date();
      await user.save();
      await logActivity(req, {
        action: 'admin.user_deactivate',
        targetType: 'user',
        targetId: id,
        details: `Admin deactivated user ${user.username} (${user.role})`,
      });
      return res.json({ ok: true, user: sanitizeUser(user) });
    }

    const idx = AUTH_USERS.findIndex((u) => String(u.id) === id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    const user = AUTH_USERS[idx];
    if (user.isActive === false) {
      return res.json({ ok: true, user: sanitizeUser(user), alreadyInactive: true });
    }
    const remainingAdmins = AUTH_USERS.filter((u) => u.role === 'admin' && u.isActive !== false && String(u.id) !== id).length;
    if (user.role === 'admin' && remainingAdmins === 0) {
      return res.status(400).json({ error: 'Cannot deactivate the last active admin account' });
    }
    AUTH_USERS[idx] = {
      ...user,
      isActive: false,
      deactivatedAt: new Date().toISOString(),
    };
    persistAuthUsers();
    await logActivity(req, {
      action: 'admin.user_deactivate',
      targetType: 'user',
      targetId: id,
      details: `Admin deactivated user ${user.username} (${user.role})`,
    });
    return res.json({ ok: true, user: sanitizeUser(AUTH_USERS[idx]) });
  } catch (err) {
    console.error('Deactivate user failed', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

registerInquiryRoutes(app, {
  Inquiry,
  fallbackInquiries,
  useFallback,
  mongoose,
  requireAuth,
  requireRoles,
  normalizeInquiryStatus,
  normalizeInquiryPriority,
  normalizeInquiryOwner,
  normalizeFollowUpAt,
  isClosedInquiryStatus,
  sanitizeInquiry,
  persistFallbackInquiries,
  logActivity,
});

app.get('/api/health', (req, res) => {
  const dbConnected = mongoose.connection && mongoose.connection.readyState === 1;
  res.json({
    ok: true,
    dbConnected,
    usingFallback: useFallback || !dbConnected,
    mongoUriSource: process.env.MONGO_URI ? 'MONGO_URI' : (process.env.MONGODB_URI ? 'MONGODB_URI' : 'default'),
  });
});

app.get('/api/projects', async (req, res) => {
  if (useFallback || mongoose.connection.readyState !== 1) {
    return res.json(fallbackProjects);
  }
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    if (err.name === 'MongoServerError' || err.name === 'MongooseError' || (err.message && err.message.includes('buffering'))) {
      return res.json(fallbackProjects);
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Projects Routes
app.options('/api/projects', cors(corsOptions)); // Add OPTIONS handler for projects
app.options('/api/projects/bulk-delete', cors(corsOptions)); // Add OPTIONS handler for bulk delete
app.options('/api/projects/:id', cors(corsOptions)); // Add OPTIONS handler for project update/delete

app.post('/api/projects', requireAuth, requireRoles(['admin']), handleProjectImageUpload, async (req, res) => {
  try {
    console.log('Received project creation request:', req.body);
    console.log('Received file:', req.file);

    const { title, description, location, owner, date, status } = req.body;
        
    // Validate required fields and lengths
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    if (typeof title === 'string' && (title.trim().length < 3 || title.trim().length > 150)) {
      return res.status(400).json({ error: 'Title must be between 3 and 150 characters' });
    }
    if (typeof description === 'string' && description.trim().length < 10) {
      return res.status(400).json({ error: 'Description must be at least 10 characters' });
    }

    if (useFallback || mongoose.connection.readyState !== 1) {
      const id = Date.now().toString();
      const project = {
        _id: id,
        title,
        description,
        location: location || '',
        owner: owner || '',
        date: date ? new Date(date).toISOString() : null,
        image: req.file ? `/uploads/${req.file.filename}` : null,
        status: status || 'ongoing'
      };
      fallbackProjects.push(project);
      try { fs.writeFileSync(fallbackFile, JSON.stringify(fallbackProjects, null, 2)); } catch (e) { console.error('Failed writing fallback file', e); }
      return res.status(201).json(project);
    }

    const project = new Project({
      title,
      description,
      location,
      owner,
      date: date ? new Date(date) : null,
      image: req.file ? `/uploads/${req.file.filename}` : null,
      status: status || 'ongoing'
    });

    console.log('Creating new project:', project);
    await project.save();
    console.log('Project created successfully:', project);
    res.status(201).json(project);
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.put('/api/projects/:id', requireAuth, requireRoles(['admin']), handleProjectImageUpload, async (req, res) => {
    try {
        console.log('PUT Received body:', req.body);
        console.log('PUT Received file:', req.file);
        const { title, description, location, owner, date, status } = req.body;
        if (!title || !description) {
          return res.status(400).json({ error: 'Title and description are required' });
        }
        if (typeof title === 'string' && (title.trim().length < 3 || title.trim().length > 150)) {
          return res.status(400).json({ error: 'Title must be between 3 and 150 characters' });
        }
        if (typeof description === 'string' && description.trim().length < 10) {
          return res.status(400).json({ error: 'Description must be at least 10 characters' });
        }
        const updatedData = {
            title,
            description,
            location,
            owner,
            date: date ? new Date(date) : null,
            status: status || 'ongoing'
        };
        if (req.file) updatedData.image = `/uploads/${req.file.filename}`;
        if (useFallback || mongoose.connection.readyState !== 1) {
          const idx = fallbackProjects.findIndex(p => p._id === req.params.id);
          if (idx === -1) return res.status(404).json({ error: 'Project not found' });
          const existing = fallbackProjects[idx];
          const updatedProject = { ...existing, ...updatedData };
          if (req.file) updatedProject.image = `/uploads/${req.file.filename}`;
          fallbackProjects[idx] = updatedProject;
          try { fs.writeFileSync(fallbackFile, JSON.stringify(fallbackProjects, null, 2)); } catch (e) { console.error('Failed writing fallback file', e); }
          return res.json(updatedProject);
        }
        const updatedProject = await Project.findByIdAndUpdate(
          req.params.id,
          { $set: updatedData },
          { new: true, runValidators: true }
        );
        if (!updatedProject) {
          console.log('Project not found for ID:', req.params.id);
          return res.status(404).json({ error: 'Project not found' });
        }
        console.log('Updated Project from DB:', updatedProject);
        res.json(updatedProject);
    } catch (err) {
        console.error('Error updating project:', err);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

app.post('/api/projects/bulk-delete', requireAuth, requireRoles(['admin']), async (req, res) => {
    console.log('Reached /api/projects/bulk-delete endpoint');
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'No project IDs provided' });
    try {
      const validIds = ids.filter(id => typeof id === 'string' && id.trim() !== '');
      if (useFallback || mongoose.connection.readyState !== 1) {
        const before = fallbackProjects.length;
        fallbackProjects = fallbackProjects.filter(p => !validIds.includes(p._id));
        const deleted = before - fallbackProjects.length;
        try { fs.writeFileSync(fallbackFile, JSON.stringify(fallbackProjects, null, 2)); } catch (e) { console.error('Failed writing fallback file', e); }
        if (deleted === 0) return res.status(404).json({ message: 'No projects found to delete' });
        return res.status(200).json({ message: `${deleted} project(s) deleted successfully` });
      }
      const result = await Project.deleteMany({ _id: { $in: validIds } });
      if (result.deletedCount === 0) return res.status(404).json({ message: 'No projects found to delete' });
      console.log(`Deleted ${result.deletedCount} project(s)`);
      res.status(200).json({ message: `${result.deletedCount} project(s) deleted successfully` });
    } catch (err) {
      console.error('Error during bulk delete:', err);
      res.status(500).json({ message: 'Server error during bulk delete' });
    }
});

app.delete('/api/projects/:id', requireAuth, requireRoles(['admin']), async (req, res) => {
    try {
        if (useFallback || mongoose.connection.readyState !== 1) {
          const idx = fallbackProjects.findIndex(p => p._id === req.params.id);
          if (idx === -1) return res.status(404).json({ error: 'Project not found' });
          const removed = fallbackProjects.splice(idx, 1)[0];
          try { fs.writeFileSync(fallbackFile, JSON.stringify(fallbackProjects, null, 2)); } catch (e) { console.error('Failed writing fallback file', e); }
          console.log('Deleted Project (fallback):', removed);
          return res.json({ message: 'Project deleted' });
        }
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        console.log('Deleted Project:', project);
        res.json({ message: 'Project deleted' });
    } catch (err) {
        console.error('Error deleting project:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

const normalizeTags = (tagsInput) => {
  if (!tagsInput) return [];
  if (Array.isArray(tagsInput)) return tagsInput.map((t) => String(t).trim()).filter(Boolean);
  return String(tagsInput)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
};

const normalizeStringList = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((v) => String(v || '').trim()).filter(Boolean);
  }
  return String(input)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
};

const normalizeSharedRoles = (input) => {
  const allowed = new Set(['admin', 'user', 'client']);
  return normalizeStringList(input).filter((role) => allowed.has(role));
};

const normalizeLinkAccess = (value) => {
  const v = String(value || '').trim().toLowerCase();
  if (v === 'view' || v === 'comment') return v;
  return 'none';
};

const normalizeFolderPath = (value) => String(value || '').trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');

const joinFolderPath = (base, name) => {
  const b = normalizeFolderPath(base);
  const n = normalizeFolderPath(name);
  if (!b) return n;
  if (!n) return b;
  return `${b}/${n}`;
};

const copyDiskFileForRecord = (record) => {
  if (record && record.cloudPublicId) return null;
  const sourcePath = path.join(__dirname, String(record.path || '').replace(/^\/+/, ''));
  if (!fs.existsSync(sourcePath)) return null;
  const ext = path.extname(sourcePath);
  const newStoredName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
  const targetPath = path.join(__dirname, 'uploads', newStoredName);
  fs.copyFileSync(sourcePath, targetPath);
  return {
    storedName: newStoredName,
    path: `/uploads/${newStoredName}`,
  };
};

const uploadFileToCloud = async (file) => {
  if (!cloudStorageEnabled || !file || !file.buffer) return null;
  const ext = path.extname(file.originalname || '').toLowerCase();
  const base = path.basename(file.originalname || `file-${Date.now()}`, ext).replace(/[^a-zA-Z0-9-_]/g, '-');
  const publicId = `construction-files/${Date.now()}-${base || 'file'}`;
  const resourceType = (file.mimetype || '').startsWith('video/') ? 'video' : 'auto';

  const uploaded = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: resourceType,
        overwrite: false,
      },
      (err, result) => {
        if (err) return reject(err);
        return resolve(result);
      }
    );
    stream.end(file.buffer);
  });

  return {
    storedName: uploaded.public_id || publicId,
    path: uploaded.secure_url,
    cloudProvider: 'cloudinary',
    cloudPublicId: uploaded.public_id || publicId,
  };
};

const isOfficeName = (name = '') => {
  const ext = String(name || '').toLowerCase().split('.').pop();
  return ['xls', 'xlsx', 'doc', 'docx', 'ppt', 'pptx'].includes(ext);
};

const downloadFileBytes = async (record) => {
  if (!record) throw new Error('Missing file record');
  // Cloudinary-backed: use a signed Cloudinary download URL (no cookies required).
  if (record.cloudProvider === 'cloudinary' && record.cloudPublicId && cloudStorageEnabled && cloudinary) {
    const ext = path.extname(record.originalName || '').replace('.', '') || 'bin';
    const resourceType = inferCloudinaryResourceType(record);
    const signed = cloudinary.utils.private_download_url(record.cloudPublicId, ext, {
      resource_type: resourceType,
      type: 'upload',
      attachment: false,
    });
    const res = await fetch(signed);
    if (!res.ok) throw new Error(`Cloud download failed (${res.status})`);
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  }

  // Absolute URL (other providers): fetch.
  if (record.path && /^https?:\/\//i.test(String(record.path))) {
    const res = await fetch(String(record.path));
    if (!res.ok) throw new Error(`Remote download failed (${res.status})`);
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  }

  // Local disk-backed.
  const rel = String(record.path || '').replace(/\\/g, '/').replace(/^\/+/, '');
  const diskPath = path.join(__dirname, rel);
  if (!fs.existsSync(diskPath)) throw new Error('File not found on disk');
  return fs.readFileSync(diskPath);
};

const cloudConvertEnabled = Boolean(process.env.CLOUDCONVERT_API_KEY);

const cloudConvertJobToPdfUrl = async ({ filename, bytes, contentType }) => {
  if (!cloudConvertEnabled) {
    throw new Error('CloudConvert is not configured (missing CLOUDCONVERT_API_KEY)');
  }

  const createJobRes = await fetch('https://api.cloudconvert.com/v2/jobs', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.CLOUDCONVERT_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tasks: {
        'import-1': { operation: 'import/upload' },
        'convert-1': {
          operation: 'convert',
          input: ['import-1'],
          output_format: 'pdf',
          // If CloudConvert can infer type, leave input_format undefined.
        },
        'export-1': {
          operation: 'export/url',
          input: ['convert-1'],
          inline: true,
          archive_multiple_files: false,
        },
      },
    }),
  });

  if (!createJobRes.ok) {
    const msg = await createJobRes.text();
    if (createJobRes.status === 401 || createJobRes.status === 403) {
      throw new Error('CloudConvert API key unauthorized. Create a new API key with task.read + task.write scopes.');
    }
    throw new Error(`CloudConvert job create failed (${createJobRes.status}): ${msg}`);
  }

  const jobBody = await createJobRes.json();
  const jobId = jobBody?.data?.id;
  const importTask = (jobBody?.data?.tasks || []).find((t) => t.name === 'import-1');
  const form = importTask?.result?.form;
  if (!jobId || !form?.url || !form?.parameters) {
    throw new Error('CloudConvert did not return upload form');
  }

  const fd = new FormData();
  Object.entries(form.parameters).forEach(([k, v]) => fd.append(k, String(v)));
  fd.append('file', new Blob([bytes], { type: contentType || 'application/octet-stream' }), filename || 'file');

  const uploadRes = await fetch(form.url, { method: 'POST', body: fd });
  if (!uploadRes.ok) {
    const msg = await uploadRes.text();
    if (uploadRes.status === 401 || uploadRes.status === 403) {
      throw new Error('CloudConvert upload unauthorized. Verify your API key scopes include task.write.');
    }
    throw new Error(`CloudConvert upload failed (${uploadRes.status}): ${msg}`);
  }

  // Poll job status until finished.
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const pollRes = await fetch(`https://api.cloudconvert.com/v2/jobs/${encodeURIComponent(jobId)}`, {
      headers: { Authorization: `Bearer ${process.env.CLOUDCONVERT_API_KEY}` },
    });
    if (!pollRes.ok) {
      const msg = await pollRes.text();
      throw new Error(`CloudConvert job poll failed (${pollRes.status}): ${msg}`);
    }
    const pollBody = await pollRes.json();
    const status = pollBody?.data?.status;
    if (status === 'finished') {
      const exportTask = (pollBody?.data?.tasks || []).find((t) => t.name === 'export-1');
      const url = exportTask?.result?.files?.[0]?.url;
      if (!url) throw new Error('CloudConvert finished but no export URL found');
      return url;
    }
    if (status === 'error') {
      throw new Error('CloudConvert job failed');
    }
    await new Promise((r) => setTimeout(r, 1200));
  }

  throw new Error('CloudConvert preview timed out');
};

const removeLocalFile = (filePath) => {
  if (!filePath) return;
  const normalized = path.join(__dirname, String(filePath).replace(/^\/+/, ''));
  if (fs.existsSync(normalized)) {
    fs.unlinkSync(normalized);
  }
};

const normalizeProjectIds = (value) => {
  const raw = Array.isArray(value) ? value : [];
  return raw
    .map((v) => String(v || '').trim())
    .filter(Boolean);
};

const sameStringSet = (a, b) => {
  const sa = new Set(normalizeStringList(a));
  const sb = new Set(normalizeStringList(b));
  if (sa.size !== sb.size) return false;
  for (const val of sa) if (!sb.has(val)) return false;
  return true;
};

const summarizePermissionChanges = (before, after) => {
  const nextUsers = normalizeStringList(after?.sharedWithUsers);
  const nextRoles = normalizeSharedRoles(after?.sharedWithRoles);
  const nextLink = normalizeLinkAccess(after?.linkAccess);
  const prevUsers = normalizeStringList(before?.sharedWithUsers);
  const prevRoles = normalizeSharedRoles(before?.sharedWithRoles);
  const prevLink = normalizeLinkAccess(before?.linkAccess);

  const changedUsers = !sameStringSet(prevUsers, nextUsers);
  const changedRoles = !sameStringSet(prevRoles, nextRoles);
  const changedLink = prevLink !== nextLink;
  if (!changedUsers && !changedRoles && !changedLink) return null;

  const parts = [];
  if (changedUsers) parts.push(`users: ${nextUsers.join(', ') || 'none'}`);
  if (changedRoles) parts.push(`roles: ${nextRoles.join(', ') || 'none'}`);
  if (changedLink) parts.push(`link: ${nextLink}`);
  return parts.join('; ');
};

const buildPermissionSnapshot = (file = {}) => ({
  sharedWithUsers: normalizeStringList(file.sharedWithUsers),
  sharedWithRoles: normalizeSharedRoles(file.sharedWithRoles),
  linkAccess: normalizeLinkAccess(file.linkAccess),
});

const hasAclAccess = (file, auth = {}) => {
  const role = String(auth.role || '').trim();
  const userId = String(auth.id || '').trim();
  const username = String(auth.username || '').trim();

  if (!file) return false;
  if (role === 'admin') return true;
  if (String(file.ownerId || '') === userId) return true;

  const sharedUsers = normalizeStringList(file.sharedWithUsers);
  if (userId && sharedUsers.includes(userId)) return true;
  if (username && sharedUsers.includes(username)) return true;

  const sharedRoles = normalizeSharedRoles(file.sharedWithRoles);
  if (role && sharedRoles.includes(role)) return true;

  // Authenticated "anyone with link" access mode (foundation only).
  const linkAccess = normalizeLinkAccess(file.linkAccess);
  if (linkAccess === 'view' || linkAccess === 'comment') return true;

  return false;
};

const filterFilesByRole = (files, role, userId, projectIds = [], authUser = null) => {
  const allowedProjects = new Set(normalizeProjectIds(projectIds));
  const auth = authUser || { role, id: userId, projectIds };

  if (role === 'admin') return files;

  if (role === 'client') {
    // Clients: only client-visible files that belong to one of their assigned projects.
    return files.filter((f) => {
      if (hasAclAccess(f, auth)) return true;
      if (!allowedProjects.size) return false;
      return f.visibility === 'client' && allowedProjects.has(String(f.projectId || ''));
    });
  }

  // Employees (user): always see their own uploads.
  // For shared/team/client-visible files: require project match if a projectId exists.
  return files.filter((f) => {
    if (hasAclAccess(f, auth)) return true;
    const vis = String(f.visibility || '');
    if (vis !== 'team' && vis !== 'client') return false;

    const pid = String(f.projectId || '').trim();
    // Allow global shared files with no projectId.
    if (!pid) return true;
    // If user has no assigned projects, don't show project-scoped shared files.
    if (!allowedProjects.size) return false;
    return allowedProjects.has(pid);
  });
};

app.get('/api/folders', requireAuth, async (req, res) => {
  try {
    const role = req.authUser.role;
    const userId = req.authUser.id;
    const projectIds = req.authUser.projectIds || [];

    const files = useFallback || mongoose.connection.readyState !== 1
      ? filterFilesByRole(fallbackFiles, role, userId, projectIds, req.authUser)
      : filterFilesByRole(await FileItem.find().lean(), role, userId, projectIds, req.authUser);

    const fileFolders = files.map((f) => (f.folder || '').trim()).filter(Boolean);
    const standaloneFolders = role === 'admin'
      ? fallbackFolders.map((item) => item.path)
      : fallbackFolders.filter((item) => item.ownerId === userId).map((item) => item.path);
    const folders = [...new Set([...fileFolders, ...standaloneFolders])].sort((a, b) => a.localeCompare(b));
    return res.json(folders);
  } catch (err) {
    console.error('Error fetching folders:', err);
    return res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

app.post('/api/folders', requireAuth, requireRoles(['admin', 'user']), async (req, res) => {
  try {
    const pathValue = String(req.body.path || '').trim().replace(/\\/g, '/');
    if (!pathValue) return res.status(400).json({ error: 'Folder path is required' });
    if (pathValue.length > 180) return res.status(400).json({ error: 'Folder path is too long' });

    const exists = fallbackFolders.some((item) => item.path === pathValue && item.ownerId === req.authUser.id);
    if (!exists) {
      fallbackFolders.push({
        _id: `folder-${Date.now()}`,
        path: pathValue,
        ownerId: req.authUser.id,
        createdAt: new Date().toISOString(),
      });
      persistFallbackFolders();
    }

    await logActivity(req, {
      action: 'folder.create',
      targetType: 'folder',
      targetId: pathValue,
      details: `Created folder ${pathValue}`,
      metadata: { path: pathValue },
    });
    return res.status(201).json({ path: pathValue });
  } catch (err) {
    console.error('Error creating folder:', err);
    return res.status(500).json({ error: 'Failed to create folder' });
  }
});

app.post('/api/folders/move', requireAuth, requireRoles(['admin', 'user']), async (req, res) => {
  try {
    const sourcePath = normalizeFolderPath(req.body.sourcePath || '');
    const destinationPath = normalizeFolderPath(req.body.destinationPath || '');
    if (!sourcePath) return res.status(400).json({ error: 'Source folder is required' });
    if (!destinationPath && destinationPath !== '') return res.status(400).json({ error: 'Destination folder is required' });
    if (destinationPath.startsWith(sourcePath)) return res.status(400).json({ error: 'Cannot move folder into itself' });

    const nextBase = joinFolderPath(destinationPath, sourcePath.split('/').pop());
    const remapPath = (folder) => {
      const current = normalizeFolderPath(folder || '');
      if (current === sourcePath) return nextBase;
      if (current.startsWith(`${sourcePath}/`)) return `${nextBase}${current.slice(sourcePath.length)}`;
      return current;
    };

    if (useFallback || mongoose.connection.readyState !== 1) {
      fallbackFiles = fallbackFiles.map((file) => {
        if (req.authUser.role !== 'admin' && file.ownerId !== req.authUser.id) return file;
        return { ...file, folder: remapPath(file.folder), updatedAt: new Date().toISOString() };
      });
      fallbackFolders = fallbackFolders.map((folder) => {
        if (req.authUser.role !== 'admin' && folder.ownerId !== req.authUser.id) return folder;
        return { ...folder, path: remapPath(folder.path) };
      });
      persistFallbackFiles();
      persistFallbackFolders();
      await logActivity(req, {
        action: 'folder.move',
        targetType: 'folder',
        targetId: sourcePath,
        details: `Moved folder ${sourcePath} to ${destinationPath || 'root'}`,
        metadata: { sourcePath, destinationPath, nextBase },
      });
      return res.json({ sourcePath, destinationPath, nextBase });
    }

    const query = req.authUser.role === 'admin' ? {} : { ownerId: req.authUser.id };
    const files = await FileItem.find(query).lean();
    await Promise.all(files.map(async (file) => {
      const nextFolder = remapPath(file.folder);
      if (nextFolder !== normalizeFolderPath(file.folder || '')) {
        await FileItem.findByIdAndUpdate(file._id, { $set: { folder: nextFolder } });
      }
    }));
    await logActivity(req, {
      action: 'folder.move',
      targetType: 'folder',
      targetId: sourcePath,
      details: `Moved folder ${sourcePath} to ${destinationPath || 'root'}`,
      metadata: { sourcePath, destinationPath, nextBase },
    });
    return res.json({ sourcePath, destinationPath, nextBase });
  } catch (err) {
    console.error('Error moving folder:', err);
    return res.status(500).json({ error: 'Failed to move folder' });
  }
});

app.post('/api/folders/copy', requireAuth, requireRoles(['admin', 'user']), async (req, res) => {
  try {
    const sourcePath = normalizeFolderPath(req.body.sourcePath || '');
    const destinationPath = normalizeFolderPath(req.body.destinationPath || '');
    if (!sourcePath) return res.status(400).json({ error: 'Source folder is required' });

    const nextBase = joinFolderPath(destinationPath, sourcePath.split('/').pop());
    const remapPath = (folder) => {
      const current = normalizeFolderPath(folder || '');
      if (current === sourcePath) return nextBase;
      if (current.startsWith(`${sourcePath}/`)) return `${nextBase}${current.slice(sourcePath.length)}`;
      return null;
    };

    if (useFallback || mongoose.connection.readyState !== 1) {
      const scoped = req.authUser.role === 'admin'
        ? fallbackFiles
        : fallbackFiles.filter((file) => file.ownerId === req.authUser.id);
      const copies = scoped
        .map((file) => ({ file, nextFolder: remapPath(file.folder) }))
        .filter((item) => Boolean(item.nextFolder))
        .map(({ file, nextFolder }) => {
          const copiedDisk = copyDiskFileForRecord(file);
          return {
            ...file,
            _id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
            storedName: copiedDisk?.storedName || file.storedName,
            path: copiedDisk?.path || file.path,
            cloudProvider: copiedDisk ? '' : (file.cloudProvider || ''),
            cloudPublicId: copiedDisk ? '' : (file.cloudPublicId || ''),
            folder: nextFolder,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        });
      fallbackFiles.unshift(...copies);
      fallbackFolders.push({
        _id: `folder-${Date.now()}`,
        path: nextBase,
        ownerId: req.authUser.id,
        createdAt: new Date().toISOString(),
      });
      persistFallbackFiles();
      persistFallbackFolders();
      await logActivity(req, {
        action: 'folder.copy',
        targetType: 'folder',
        targetId: sourcePath,
        details: `Copied folder ${sourcePath} to ${destinationPath || 'root'}`,
        metadata: { sourcePath, destinationPath, nextBase, copied: copies.length },
      });
      return res.json({ copied: copies.length, sourcePath, destinationPath, nextBase });
    }

    const query = req.authUser.role === 'admin' ? {} : { ownerId: req.authUser.id };
    const files = await FileItem.find(query).lean();
    const payload = files
      .map((file) => ({ file, nextFolder: remapPath(file.folder) }))
      .filter((item) => Boolean(item.nextFolder))
      .map(({ file, nextFolder }) => {
        const copiedDisk = copyDiskFileForRecord(file);
        return {
          originalName: file.originalName,
          storedName: copiedDisk?.storedName || file.storedName,
          path: copiedDisk?.path || file.path,
          cloudProvider: copiedDisk ? '' : (file.cloudProvider || ''),
          cloudPublicId: copiedDisk ? '' : (file.cloudPublicId || ''),
          mimeType: file.mimeType || '',
          size: Number(file.size || 0),
          ownerId: file.ownerId || req.authUser.id,
          visibility: file.visibility || 'private',
          folder: nextFolder,
          projectId: file.projectId || '',
          sharedWithUsers: Array.isArray(file.sharedWithUsers) ? file.sharedWithUsers : [],
          sharedWithRoles: Array.isArray(file.sharedWithRoles) ? normalizeSharedRoles(file.sharedWithRoles) : [],
          linkAccess: normalizeLinkAccess(file.linkAccess),
          tags: Array.isArray(file.tags) ? file.tags : [],
          notes: file.notes || '',
        };
      });
    if (payload.length) await FileItem.insertMany(payload);
    await logActivity(req, {
      action: 'folder.copy',
      targetType: 'folder',
      targetId: sourcePath,
      details: `Copied folder ${sourcePath} to ${destinationPath || 'root'}`,
      metadata: { sourcePath, destinationPath, nextBase, copied: payload.length },
    });
    return res.json({ copied: payload.length, sourcePath, destinationPath, nextBase });
  } catch (err) {
    console.error('Error copying folder:', err);
    return res.status(500).json({ error: 'Failed to copy folder' });
  }
});

app.get('/api/activity-logs', requireAuth, requireRoles(['admin']), async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 30)));
    const skip = Math.max(0, Number(req.query.skip || 0));
    const actionPrefix = String(req.query.actionPrefix || '').trim();
    const action = String(req.query.action || '').trim();
    const permissionChanges = String(req.query.permissionChanges || '').trim() === 'true';
    const targetId = String(req.query.targetId || '').trim();
    const targetType = String(req.query.targetType || '').trim();

    const actionMatch = (val) => {
      const v = String(val || '');
      if (actionPrefix) return v.startsWith(actionPrefix);
      if (action && action.endsWith('*')) return v.startsWith(action.slice(0, -1));
      if (action) return v === action;
      return true;
    };

    if (useFallback || mongoose.connection.readyState !== 1) {
      const items = fallbackActivityLogs.filter((l) => {
        if (permissionChanges && String(l.action || '') !== 'file.permissions_update') return false;
        if (!actionMatch(l.action)) return false;
        if (targetType && String(l.targetType || '') !== targetType) return false;
        if (targetId) {
          const tid = String(l.targetId || '');
          // Handles both single targetId and comma-separated bulk targetIds.
          if (!(tid === targetId || tid.includes(targetId))) return false;
        }
        return true;
      });
      return res.json(items.slice(skip, skip + limit));
    }

    const query = {};
    if (permissionChanges) {
      query.action = 'file.permissions_update';
    } else if (actionPrefix) {
      query.action = { $regex: `^${actionPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` };
    } else if (action && action.endsWith('*')) {
      const prefix = action.slice(0, -1);
      query.action = { $regex: `^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` };
    } else if (action) {
      query.action = action;
    }
    if (targetType) query.targetType = targetType;
    if (targetId) {
      const escaped = targetId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match exact id or comma-separated list (bulk ops).
      query.targetId = { $regex: `(^|,)${escaped}(,|$)|${escaped}` };
    }

    const logs = await ActivityLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    return res.json(logs);
  } catch (err) {
    console.error('Error fetching activity logs:', err);
    return res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

app.get('/api/client/follow-ups', requireAuth, requireRoles(['client']), async (req, res) => {
  try {
    const sessionIds = Array.isArray(req.session?.clientWorkspaceInquiryIds)
      ? req.session.clientWorkspaceInquiryIds
      : [];
    const items = await getInquiryByIds(sessionIds);
    return res.json({
      items,
      count: items.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error loading client follow-ups:', err);
    return res.status(500).json({ error: 'Failed to load client follow-up status' });
  }
});

app.options('/api/files', cors(corsOptions));
app.options('/api/files/:id', cors(corsOptions));
app.options('/api/files/:id/view', cors(corsOptions));
app.options('/api/files/:id/download', cors(corsOptions));
app.options('/api/files/:id/preview', cors(corsOptions));

app.get('/api/files', cors(corsOptions), requireAuth, async (req, res) => {
  const role = req.authUser.role;
  const userId = req.authUser.id;
  const projectIds = req.authUser.projectIds || [];
  try {
    if (useFallback || mongoose.connection.readyState !== 1) {
      return res.json(filterFilesByRole(fallbackFiles, role, userId, projectIds, req.authUser));
    }

    const files = await FileItem.find().sort({ createdAt: -1 }).lean();
    return res.json(filterFilesByRole(files, role, userId, projectIds, req.authUser));
  } catch (err) {
    console.error('Error fetching files:', err);
    return res.status(500).json({ error: 'Failed to fetch files' });
  }
});

function inferCloudinaryResourceType(fileRecord) {
  try {
    const url = String(fileRecord?.path || '');
    const re = new RegExp('res\\\\.cloudinary\\\\.com\\\\/[^\\\\/]+\\\\/([^\\\\/]+)\\\\/', 'i');
    const match = url.match(re);
    if (match && match[1]) return String(match[1]).toLowerCase();
  } catch (e) {
    // ignore
  }
  const mime = String(fileRecord?.mimeType || '').toLowerCase();
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf') return 'image';
  return 'raw';
}

// Signed view/download URL for Cloudinary-backed files.
// Cloudinary delivery URLs in this account currently return 401, so we redirect to a signed download URL.
app.get('/api/files/:id/view', cors(corsOptions), requireAuth, async (req, res) => {
  try {
    const fileId = String(req.params.id || '').trim();
    if (!fileId) return res.status(400).json({ error: 'Missing file id' });

    const role = req.authUser.role;
    const userId = req.authUser.id;
    const wantsDownload =
      String(req.query.download || '') === '1' ||
      String(req.query.download || '').toLowerCase() === 'true';

    const loadOne = async () => {
      if (useFallback || mongoose.connection.readyState !== 1) {
        const scoped = filterFilesByRole(fallbackFiles, role, userId, req.authUser.projectIds || [], req.authUser);
        return scoped.find((f) => String(f._id) === fileId) || null;
      }
      if (role === 'admin') return await FileItem.findById(fileId).lean();
      const scoped = filterFilesByRole(await FileItem.find().lean(), role, userId, req.authUser.projectIds || [], req.authUser);
      return scoped.find((f) => String(f._id) === fileId) || null;
    };

    const record = await loadOne();
    if (!record) return res.status(404).json({ error: 'File not found' });

    if (record.cloudProvider === 'cloudinary' && record.cloudPublicId && cloudStorageEnabled && cloudinary) {
      const ext = path.extname(record.originalName || '').replace('.', '') || 'bin';
      const resourceType = inferCloudinaryResourceType(record);
      const signed = cloudinary.utils.private_download_url(record.cloudPublicId, ext, {
        resource_type: resourceType,
        type: 'upload',
        attachment: Boolean(wantsDownload),
      });
      return res.redirect(302, signed);
    }

    if (record.path && /^https?:\/\//i.test(String(record.path))) {
      return res.redirect(302, String(record.path));
    }

    const rel = String(record.path || '').replace(/\\/g, '/').replace(/^\/+/, '');
    const diskPath = path.join(__dirname, rel);
    if (!fs.existsSync(diskPath)) return res.status(404).json({ error: 'File not found on disk' });

    res.setHeader('Content-Type', record.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `${wantsDownload ? 'attachment' : 'inline'}; filename=\"${String(record.originalName || 'file')}\"`
    );
    return res.sendFile(diskPath);
  } catch (err) {
    console.error('Error serving file view:', err);
    return res.status(500).json({ error: 'Failed to open file' });
  }
});

// Download with a consistent filename (works for Cloudinary + local files).
app.get('/api/files/:id/download', cors(corsOptions), requireAuth, async (req, res) => {
  try {
    const fileId = String(req.params.id || '').trim();
    if (!fileId) return res.status(400).json({ error: 'Missing file id' });

    const role = req.authUser.role;
    const userId = req.authUser.id;

    const loadOne = async () => {
      if (useFallback || mongoose.connection.readyState !== 1) {
        const scoped = filterFilesByRole(fallbackFiles, role, userId, req.authUser.projectIds || [], req.authUser);
        return scoped.find((f) => String(f._id) === fileId) || null;
      }
      if (role === 'admin') return await FileItem.findById(fileId).lean();
      const scoped = filterFilesByRole(await FileItem.find().lean(), role, userId, req.authUser.projectIds || [], req.authUser);
      return scoped.find((f) => String(f._id) === fileId) || null;
    };

    const record = await loadOne();
    if (!record) return res.status(404).json({ error: 'File not found' });

    const safeName = String(record.originalName || 'download').replace(/[\r\n"]/g, '').trim() || 'download';

    // Cloud/remote: fetch bytes then send with our own Content-Disposition.
    if (
      (record.cloudProvider === 'cloudinary' && record.cloudPublicId) ||
      (record.path && /^https?:\/\//i.test(String(record.path)))
    ) {
      const bytes = await downloadFileBytes(record);
      res.setHeader('Content-Type', record.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
      res.setHeader('Content-Length', String(bytes.length));
      return res.status(200).send(bytes);
    }

    // Local disk-backed.
    const rel = String(record.path || '').replace(/\\/g, '/').replace(/^\/+/, '');
    const diskPath = path.join(__dirname, rel);
    if (!fs.existsSync(diskPath)) return res.status(404).json({ error: 'File not found on disk' });
    return res.download(diskPath, safeName);
  } catch (err) {
    console.error('Error downloading file:', err);
    return res.status(500).json({ error: 'Failed to download file' });
  }
});

// Office preview: converts Office docs to PDF via CloudConvert and returns a temporary PDF URL.
// Restricted to admin/user because conversion can incur third-party costs.
app.post('/api/files/:id/preview', cors(corsOptions), requireAuth, requireRoles(['admin', 'user']), async (req, res) => {
  try {
    const fileId = String(req.params.id || '').trim();
    if (!fileId) return res.status(400).json({ error: 'Missing file id' });

    const role = req.authUser.role;
    const userId = req.authUser.id;

    const loadOne = async () => {
      if (useFallback || mongoose.connection.readyState !== 1) {
        const scoped = filterFilesByRole(fallbackFiles, role, userId, req.authUser.projectIds || [], req.authUser);
        return scoped.find((f) => String(f._id) === fileId) || null;
      }
      if (role === 'admin') return await FileItem.findById(fileId);
      const scoped = filterFilesByRole(await FileItem.find().lean(), role, userId, req.authUser.projectIds || [], req.authUser);
      const match = scoped.find((f) => String(f._id) === fileId) || null;
      if (!match) return null;
      return await FileItem.findById(fileId);
    };

    const record = await loadOne();
    if (!record) return res.status(404).json({ error: 'File not found' });

    const isOffice = isOfficeName(record.originalName) || isOfficeName(record.path);
    if (!isOffice) {
      return res.json({ url: `/api/files/${encodeURIComponent(fileId)}/view` });
    }

    const now = Date.now();
    const expiresAt = record.previewExpiresAt ? new Date(record.previewExpiresAt).getTime() : 0;
    if (record.previewUrl && expiresAt && expiresAt > now + 15_000) {
      return res.json({ url: record.previewUrl, cached: true });
    }

    const bytes = await downloadFileBytes(record);
    const pdfUrl = await cloudConvertJobToPdfUrl({
      filename: record.originalName,
      bytes,
      contentType: record.mimeType || 'application/octet-stream',
    });

    const ttlMs = 60 * 60 * 1000;
    const nextExpires = new Date(Date.now() + ttlMs);

    if (useFallback || mongoose.connection.readyState !== 1) {
      fallbackFiles = fallbackFiles.map((f) => (
        String(f._id) === fileId
          ? { ...f, previewProvider: 'cloudconvert', previewUrl: pdfUrl, previewMimeType: 'application/pdf', previewExpiresAt: nextExpires.toISOString() }
          : f
      ));
      persistFallbackFiles();
      return res.json({ url: pdfUrl, cached: false, expiresAt: nextExpires.toISOString() });
    }

    record.previewProvider = 'cloudconvert';
    record.previewUrl = pdfUrl;
    record.previewMimeType = 'application/pdf';
    record.previewExpiresAt = nextExpires;
    await record.save();

    return res.json({ url: pdfUrl, cached: false, expiresAt: nextExpires.toISOString() });
  } catch (err) {
    console.error('Error generating office preview:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate preview' });
  }
});

app.post('/api/files', cors(corsOptions), requireAuth, requireRoles(['admin', 'user']), handleSafeFileUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File upload is required' });
    }

    const requestedProjectId = String(req.body.projectId || '').trim();
    const allowedProjects = new Set(normalizeProjectIds(req.authUser.projectIds || []));
    if (req.authUser.role !== 'admin' && requestedProjectId) {
      if (!allowedProjects.has(requestedProjectId)) {
        return res.status(403).json({ error: 'Forbidden: you are not assigned to this project' });
      }
    }

    const ownerId = req.authUser.role === 'admin'
      ? (req.body.ownerId || req.authUser.id).toString()
      : req.authUser.id;
    const visibility = ['private', 'team', 'client'].includes(req.body.visibility) ? req.body.visibility : 'private';
    const tags = normalizeTags(req.body.tags);
    const sharedWithUsers = normalizeStringList(req.body.sharedWithUsers);
    const sharedWithRoles = normalizeSharedRoles(req.body.sharedWithRoles);
    const linkAccess = normalizeLinkAccess(req.body.linkAccess);
    const cloudMeta = cloudStorageEnabled ? await uploadFileToCloud(req.file) : null;
    if (visibility === 'client' && !requestedProjectId) {
      return res.status(400).json({ error: 'Client shared files must be assigned to a project' });
    }

    const payload = {
      originalName: req.file.originalname,
      storedName: cloudMeta?.storedName || req.file.filename,
      path: cloudMeta?.path || `/uploads/${req.file.filename}`,
      mimeType: req.file.mimetype || '',
      size: req.file.size || 0,
      ownerId,
      visibility,
      folder: (req.body.folder || '').toString().trim(),
      projectId: requestedProjectId,
      sharedWithUsers,
      sharedWithRoles,
      linkAccess,
      tags,
      notes: (req.body.notes || '').toString(),
      cloudProvider: cloudMeta?.cloudProvider || '',
      cloudPublicId: cloudMeta?.cloudPublicId || '',
    };

    if (useFallback || mongoose.connection.readyState !== 1) {
      const fileDoc = { _id: Date.now().toString(), ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      fallbackFiles.unshift(fileDoc);
      persistFallbackFiles();
      await logActivity(req, {
        action: 'file.upload',
        targetType: 'file',
        targetId: fileDoc._id,
        details: `Uploaded ${fileDoc.originalName}`,
        metadata: { visibility: fileDoc.visibility, folder: fileDoc.folder || '' },
      });
      return res.status(201).json(fileDoc);
    }

    const fileDoc = await FileItem.create(payload);
    await logActivity(req, {
      action: 'file.upload',
      targetType: 'file',
      targetId: fileDoc._id.toString(),
      details: `Uploaded ${fileDoc.originalName}`,
      metadata: { visibility: fileDoc.visibility, folder: fileDoc.folder || '' },
    });
    return res.status(201).json(fileDoc);
  } catch (err) {
    console.error('Error uploading file:', err);
    return res.status(500).json({ error: 'Failed to upload file' });
  }
});

app.post('/api/files/bulk-move', requireAuth, requireRoles(['admin', 'user']), async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.map((id) => String(id)) : [];
    const destinationFolder = normalizeFolderPath(req.body.destinationFolder || '');
    if (!ids.length) return res.status(400).json({ error: 'No files selected' });

    if (useFallback || mongoose.connection.readyState !== 1) {
      fallbackFiles = fallbackFiles.map((file) => {
        if (!ids.includes(file._id)) return file;
        if (req.authUser.role !== 'admin' && file.ownerId !== req.authUser.id) return file;
        return { ...file, folder: destinationFolder, updatedAt: new Date().toISOString() };
      });
      persistFallbackFiles();
      await logActivity(req, {
        action: 'file.bulk_move',
        targetType: 'file',
        targetId: ids.join(','),
        details: `Moved ${ids.length} file(s) to ${destinationFolder || 'root'}`,
        metadata: { destinationFolder },
      });
      return res.json({ moved: ids.length, destinationFolder });
    }

    const query = req.authUser.role === 'admin'
      ? { _id: { $in: ids } }
      : { _id: { $in: ids }, ownerId: req.authUser.id };
    const result = await FileItem.updateMany(query, { $set: { folder: destinationFolder } });
    await logActivity(req, {
      action: 'file.bulk_move',
      targetType: 'file',
      targetId: ids.join(','),
      details: `Moved ${result.modifiedCount || 0} file(s) to ${destinationFolder || 'root'}`,
      metadata: { destinationFolder },
    });
    return res.json({ moved: result.modifiedCount || 0, destinationFolder });
  } catch (err) {
    console.error('Error bulk moving files:', err);
    return res.status(500).json({ error: 'Failed to move files' });
  }
});

app.post('/api/files/bulk-copy', requireAuth, requireRoles(['admin', 'user']), async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.map((id) => String(id)) : [];
    const destinationFolder = normalizeFolderPath(req.body.destinationFolder || '');
    if (!ids.length) return res.status(400).json({ error: 'No files selected' });

    const prepareCopy = (file) => {
      const copiedDisk = copyDiskFileForRecord(file);
      return {
        originalName: file.originalName,
        storedName: copiedDisk?.storedName || file.storedName,
        path: copiedDisk?.path || file.path,
        cloudProvider: copiedDisk ? '' : (file.cloudProvider || ''),
        cloudPublicId: copiedDisk ? '' : (file.cloudPublicId || ''),
        mimeType: file.mimeType || '',
        size: Number(file.size || 0),
        ownerId: req.authUser.role === 'admin' ? (file.ownerId || req.authUser.id) : req.authUser.id,
        visibility: file.visibility || 'private',
        folder: destinationFolder,
        projectId: file.projectId || '',
        sharedWithUsers: Array.isArray(file.sharedWithUsers) ? file.sharedWithUsers : [],
        sharedWithRoles: Array.isArray(file.sharedWithRoles) ? normalizeSharedRoles(file.sharedWithRoles) : [],
        linkAccess: normalizeLinkAccess(file.linkAccess),
        tags: Array.isArray(file.tags) ? file.tags : [],
        notes: file.notes || '',
      };
    };

    if (useFallback || mongoose.connection.readyState !== 1) {
      const sourceFiles = fallbackFiles.filter((file) => ids.includes(file._id));
      const allowed = req.authUser.role === 'admin'
        ? sourceFiles
        : sourceFiles.filter((file) => file.ownerId === req.authUser.id);
      const copies = allowed.map((file) => ({
        _id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
        ...prepareCopy(file),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      fallbackFiles.unshift(...copies);
      persistFallbackFiles();
      await logActivity(req, {
        action: 'file.bulk_copy',
        targetType: 'file',
        targetId: ids.join(','),
        details: `Copied ${copies.length} file(s) to ${destinationFolder || 'root'}`,
        metadata: { destinationFolder },
      });
      return res.json({ copied: copies.length, destinationFolder });
    }

    const query = req.authUser.role === 'admin'
      ? { _id: { $in: ids } }
      : { _id: { $in: ids }, ownerId: req.authUser.id };
    const sourceFiles = await FileItem.find(query).lean();
    const payload = sourceFiles.map((file) => prepareCopy(file));
    if (!payload.length) return res.json({ copied: 0, destinationFolder });
    await FileItem.insertMany(payload);
    await logActivity(req, {
      action: 'file.bulk_copy',
      targetType: 'file',
      targetId: ids.join(','),
      details: `Copied ${payload.length} file(s) to ${destinationFolder || 'root'}`,
      metadata: { destinationFolder },
    });
    return res.json({ copied: payload.length, destinationFolder });
  } catch (err) {
    console.error('Error bulk copying files:', err);
    return res.status(500).json({ error: 'Failed to copy files' });
  }
});

app.put('/api/files/:id', requireAuth, requireRoles(['admin', 'user']), async (req, res) => {
  try {
    const updates = {};
    if (typeof req.body.originalName === 'string' && req.body.originalName.trim()) {
      updates.originalName = req.body.originalName.trim();
    }
    if (typeof req.body.visibility === 'string' && ['private', 'team', 'client'].includes(req.body.visibility)) {
      updates.visibility = req.body.visibility;
    }
    if (req.body.tags !== undefined) {
      updates.tags = normalizeTags(req.body.tags);
    }
    if (req.body.folder !== undefined) {
      updates.folder = String(req.body.folder || '').trim();
    }
    if (req.body.projectId !== undefined) {
      updates.projectId = String(req.body.projectId || '').trim();
      if (req.authUser.role !== 'admin' && updates.projectId) {
        const allowedProjects = new Set(normalizeProjectIds(req.authUser.projectIds || []));
        if (!allowedProjects.has(updates.projectId)) {
          return res.status(403).json({ error: 'Forbidden: you are not assigned to this project' });
        }
      }
    }
    if (typeof req.body.notes === 'string') {
      updates.notes = req.body.notes;
    }
    if (req.body.sharedWithUsers !== undefined) {
      updates.sharedWithUsers = normalizeStringList(req.body.sharedWithUsers);
    }
    if (req.body.sharedWithRoles !== undefined) {
      updates.sharedWithRoles = normalizeSharedRoles(req.body.sharedWithRoles);
    }
    if (req.body.linkAccess !== undefined) {
      updates.linkAccess = normalizeLinkAccess(req.body.linkAccess);
    }

    if (updates.visibility === 'client' && !String(updates.projectId || '').trim()) {
      // If visibility is client and projectId isn't being updated, require existing projectId.
      if (useFallback || mongoose.connection.readyState !== 1) {
        const existing = fallbackFiles.find((f) => String(f._id) === String(req.params.id));
        if (!existing || !String(existing.projectId || '').trim()) {
          return res.status(400).json({ error: 'Client shared files must be assigned to a project' });
        }
      } else {
        const existing = await FileItem.findById(req.params.id).lean();
        if (!existing || !String(existing.projectId || '').trim()) {
          return res.status(400).json({ error: 'Client shared files must be assigned to a project' });
        }
      }
    }

    if (useFallback || mongoose.connection.readyState !== 1) {
      const idx = fallbackFiles.findIndex((f) => f._id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'File not found' });
      if (req.authUser.role !== 'admin' && fallbackFiles[idx].ownerId !== req.authUser.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const before = fallbackFiles[idx];
      fallbackFiles[idx] = { ...fallbackFiles[idx], ...updates, updatedAt: new Date().toISOString() };
      persistFallbackFiles();
      await logActivity(req, {
        action: 'file.update',
        targetType: 'file',
        targetId: req.params.id,
        details: `Updated ${fallbackFiles[idx].originalName}`,
        metadata: updates,
      });
      const permissionSummary = summarizePermissionChanges(before, fallbackFiles[idx]);
      if (permissionSummary) {
        const beforePerms = buildPermissionSnapshot(before);
        const afterPerms = buildPermissionSnapshot(fallbackFiles[idx]);
        await logActivity(req, {
          action: 'file.permissions_update',
          targetType: 'file',
          targetId: req.params.id,
          details: `Access updated for ${fallbackFiles[idx].originalName}: ${permissionSummary}`,
          metadata: {
            before: beforePerms,
            after: afterPerms,
          },
        });
      }
      return res.json(fallbackFiles[idx]);
    }

    const existing = await FileItem.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'File not found' });
    if (req.authUser.role !== 'admin' && existing.ownerId !== req.authUser.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const updated = await FileItem.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'File not found' });
    await logActivity(req, {
      action: 'file.update',
      targetType: 'file',
      targetId: updated._id.toString(),
      details: `Updated ${updated.originalName}`,
      metadata: updates,
    });
    const permissionSummary = summarizePermissionChanges(existing.toObject ? existing.toObject() : existing, updated.toObject ? updated.toObject() : updated);
    if (permissionSummary) {
      const beforePerms = buildPermissionSnapshot(existing.toObject ? existing.toObject() : existing);
      const afterPerms = buildPermissionSnapshot(updated.toObject ? updated.toObject() : updated);
      await logActivity(req, {
        action: 'file.permissions_update',
        targetType: 'file',
        targetId: updated._id.toString(),
        details: `Access updated for ${updated.originalName}: ${permissionSummary}`,
        metadata: {
          before: beforePerms,
          after: afterPerms,
        },
      });
    }
    return res.json(updated);
  } catch (err) {
    console.error('Error updating file:', err);
    return res.status(500).json({ error: 'Failed to update file' });
  }
});

app.delete('/api/files/:id', requireAuth, requireRoles(['admin', 'user']), async (req, res) => {
  try {
    const removeStoredAsset = async (record, scopeList = []) => {
      if (!record) return;
      if (record.cloudProvider === 'cloudinary' && record.cloudPublicId && cloudStorageEnabled) {
        const references = scopeList.filter((item) => item.cloudPublicId === record.cloudPublicId).length;
        if (references <= 1) {
          try {
            await cloudinary.uploader.destroy(record.cloudPublicId, { resource_type: 'auto' });
          } catch (e) {
            console.error('Failed to delete cloudinary file', e);
          }
        }
        return;
      }
      try { removeLocalFile(record.path); } catch (e) { console.error('Failed to delete local file', e); }
    };

    if (useFallback || mongoose.connection.readyState !== 1) {
      const idx = fallbackFiles.findIndex((f) => f._id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'File not found' });
      if (req.authUser.role !== 'admin' && fallbackFiles[idx].ownerId !== req.authUser.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const snapshot = [...fallbackFiles];
      const [removed] = fallbackFiles.splice(idx, 1);
      if (removed) {
        await removeStoredAsset(removed, snapshot);
      }
      persistFallbackFiles();
      await logActivity(req, {
        action: 'file.delete',
        targetType: 'file',
        targetId: req.params.id,
        details: `Deleted ${removed ? removed.originalName : 'file'}`,
      });
      return res.json({ message: 'File deleted' });
    }

    const existing = await FileItem.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ error: 'File not found' });
    if (req.authUser.role !== 'admin' && existing.ownerId !== req.authUser.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const removed = await FileItem.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ error: 'File not found' });

    if (existing.cloudProvider === 'cloudinary' && existing.cloudPublicId && cloudStorageEnabled) {
      const refs = await FileItem.countDocuments({ cloudPublicId: existing.cloudPublicId });
      if (refs === 0) {
        try {
          await cloudinary.uploader.destroy(existing.cloudPublicId, { resource_type: 'auto' });
        } catch (e) {
          console.error('Failed to delete cloudinary file', e);
        }
      }
    } else {
      try { removeLocalFile(existing.path); } catch (e) { console.error('Failed to delete DB file from disk', e); }
    };
    await logActivity(req, {
      action: 'file.delete',
      targetType: 'file',
      targetId: removed._id.toString(),
      details: `Deleted ${removed.originalName}`,
    });
    return res.json({ message: 'File deleted' });
  } catch (err) {
    console.error('Error deleting file:', err);
    return res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Contact Form Route
app.options('/api/contact', (req, res) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

app.post('/api/contact', async (req, res) => {
  // Set CORS headers
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  
  try {
    const clientIp = requestIp.getClientIp(req);
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    // Initialize session if it doesn't exist
    if (!req.session.contactAttempts) {
      req.session.contactAttempts = [];
    }

    // Clean up old attempts
    req.session.contactAttempts = req.session.contactAttempts.filter(time => time > oneHourAgo);

    // Check if user has exceeded attempts
    if (req.session.contactAttempts.length >= 3) {
      const oldestAttempt = req.session.contactAttempts[0];
      const timeLeft = Math.ceil((oldestAttempt + (60 * 60 * 1000) - now) / 1000 / 60);
      console.log('Too many attempts from IP:', clientIp);
      return res.status(429).json({
        error: `Too many attempts. Please try again in ${timeLeft} minutes.`
      });
    }

    // Add attempt before processing
    req.session.contactAttempts.push(now);
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
      }
    });

    const payload = normalizeContactPayload(req.body);

    console.log('Received contact form submission:', {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      companyName: payload.companyName,
      projectType: payload.projectType,
      siteLocation: payload.siteLocation,
      timeline: payload.timeline,
      serviceNeeded: payload.serviceNeeded,
      hasMessage: !!payload.message,
      hasRecaptcha: !!payload.recaptchaToken,
      attemptsRemaining: 3 - req.session.contactAttempts.length
    });

    const {
      name,
      email,
      phone,
      companyName,
      projectType,
      siteLocation,
      timeline,
      serviceNeeded,
      message,
      source,
      context,
      recaptchaToken,
    } = payload;

    const validationErrors = validateContactPayload(payload, { requireRecaptcha: true });

    if (Object.keys(validationErrors).length > 0) {
      console.log('Missing or invalid contact fields:', validationErrors);
      return res.status(400).json({
        error: 'Missing or invalid required contact fields.',
        fields: validationErrors
      });
    }

    // Verify reCAPTCHA token
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY || '6Ld6MSErAAAAAO--jElWpUWtWMYqDGA301_LxMvM';
    console.log('Verifying reCAPTCHA with secret:', recaptchaSecret.substring(0, 10) + '...');
    
    // Skip reCAPTCHA verification in development mode or if token is missing
    const isDevelopment = process.env.NODE_ENV === 'development';
    const skipVerification = isDevelopment || !recaptchaToken;
    
    if (skipVerification) {
      console.log('Skipping reCAPTCHA verification:', isDevelopment ? 'Development mode' : 'No token provided');
    } else {
      try {
        const verificationURL = 'https://www.google.com/recaptcha/api/siteverify';
        const verificationBody = `secret=${recaptchaSecret}&response=${recaptchaToken}`;

        console.log('Sending reCAPTCHA verification request...');
        const recaptchaResponse = await fetch(verificationURL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: verificationBody
        });

        if (!recaptchaResponse.ok) {
          console.error('reCAPTCHA verification request failed:', recaptchaResponse.status, recaptchaResponse.statusText);
          throw new Error('Failed to verify reCAPTCHA: Network error');
        }

        const recaptchaData = await recaptchaResponse.json();
        console.log('reCAPTCHA verification response:', recaptchaData);

        if (!recaptchaData.success) {
          console.log('reCAPTCHA verification failed:', recaptchaData['error-codes']);
          console.log('reCAPTCHA token used:', recaptchaToken.substring(0, 10) + '...');
          
          // In development, continue despite verification failure
          if (isDevelopment) {
            console.log('Development mode: Continuing despite reCAPTCHA failure');
          } else {
            return res.status(400).json({
              error: 'reCAPTCHA verification failed. Please try again.',
              details: recaptchaData['error-codes']
            });
          }
        }
      } catch (recaptchaError) {
        console.error('Error verifying reCAPTCHA:', recaptchaError);
        
        // In development, continue despite verification error
        if (isDevelopment) {
          console.log('Development mode: Continuing despite reCAPTCHA error');
        } else {
          return res.status(400).json({
            error: 'Failed to verify reCAPTCHA. Please try again.',
            details: recaptchaError.message
          });
        }
      }
    }

    let createdInquiry = null;
    try {
      createdInquiry = await createInquiryRecord({
        name,
        email,
        phone,
        companyName,
        projectType,
        siteLocation,
        timeline,
        serviceNeeded,
        message,
        source: source || 'contact_form',
        notes: context ? `Context: ${context}` : '',
        ipAddress: clientIp || '',
      });

      if (String(source || '').trim() === 'client-workspace' && createdInquiry?.id) {
        const nextIds = Array.isArray(req.session.clientWorkspaceInquiryIds)
          ? req.session.clientWorkspaceInquiryIds
          : [];
        req.session.clientWorkspaceInquiryIds = Array.from(new Set([createdInquiry.id, ...nextIds])).slice(0, 20);
      }
    } catch (inquiryErr) {
      console.error('Failed to persist inquiry record:', inquiryErr);
      // Continue with email flow even if inquiry persistence fails.
    }

    const emailContent = buildContactEmailContent(payload);

    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email configuration missing. Returning success without sending email.');
      return res.status(200).json({ 
        message: 'Message received successfully. We will get back to you soon.',
        inquiry: createdInquiry ? sanitizeClientFollowUpInquiry(createdInquiry) : null,
      });
    }

    try {
      console.log('Setting up email transport...');
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        replyTo: email,
        to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER,
        subject: `New Contact Form Submission from ${name}`,
        text: emailContent.text,
        html: emailContent.html
      };

      console.log('Sending email...');
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully');
      
      res.status(200).json({
        message: 'Message sent successfully',
        inquiry: createdInquiry ? sanitizeClientFollowUpInquiry(createdInquiry) : null,
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      res.status(200).json({ 
        message: 'Message received successfully. We will get back to you soon.',
        inquiry: createdInquiry ? sanitizeClientFollowUpInquiry(createdInquiry) : null,
      });
    }
  } catch (err) {
    console.error('Error processing contact form:', err);
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({
      error: 'Failed to send message. Please try again.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Status endpoint to indicate whether fallback is active and DB connectivity
// Placed before the catch-all so API requests return JSON instead of index.html
app.get('/api/status', (req, res) => {
  const dbConnected = mongoose.connection && mongoose.connection.readyState === 1;
  res.json({ usingFallback: useFallback || !dbConnected, dbConnected, cloudStorageEnabled, cloudConvertEnabled });
});

// Serve React app for all other routes.
app.use((req, res) => {
  if (hasReactBuild) {
    return res.sendFile(reactIndexPath);
  }
  return res.status(404).json({ error: 'Not found' });
});

// Start Server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

