const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const basicAuth = require('express-basic-auth');
const nodemailer = require('nodemailer');
const requestIp = require('request-ip');
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

// In-memory fallback storage for development when MongoDB is unavailable
const fallbackFile = path.join(__dirname, 'dev_projects.json');
let fallbackProjects = [];
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

// Load .env from project root when running from backend/
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config(); // fallback to backend/.env if exists

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || '1111';
const EMP_USER = process.env.EMP_USER || 'employee';
const EMP_PASS = process.env.EMP_PASS || '1111';
const CLIENT_USER = process.env.CLIENT_USER || 'client';
const CLIENT_PASS = process.env.CLIENT_PASS || '1111';
const ADMIN_SIGNUP_CODE = process.env.ADMIN_SIGNUP_CODE || ADMIN_PASS;
console.log('ADMIN_USER:', ADMIN_USER);
console.log('ADMIN_PASS:', ADMIN_PASS);

const allowedOrigins = Array.from(
  new Set(
    [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://mastertech-frontend-yqjb.onrender.com',
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

// Multer Setup for File Uploads (Projects)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

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

const fileUpload = cloudStorageEnabled
  ? multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })
  : upload;

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
    "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'self' https://www.google.com https://recaptcha.google.com https://www.gstatic.com https://mastertech-frontend-yqjb.onrender.com; frame-src 'self' https://www.google.com https://recaptcha.google.com https://www.gstatic.com;"
  );
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../build')));
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use('/pages', express.static(pagesPath));

app.use(session({
    secret: process.env.SESSION_SECRET || '70f1e04a35336b79732f2f034b101d4d',
    resave: true,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 60 * 60 * 1000 // 1 hour
    }
}));

// Global OPTIONS handler for all routes
app.options('*', cors(corsOptions));

// Root Route
app.get('/', (req, res) => {
    console.log('Serving root route');
    res.sendFile(path.join(__dirname, '../pages/index.html'));
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
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/mti-projects';
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

const authUsersPath = path.join(__dirname, 'dev_auth_users.json');
const defaultAuthUsers = [
  { id: 'admin-1', username: ADMIN_USER, password: ADMIN_PASS, role: 'admin' },
  { id: 'user-1', username: EMP_USER, password: EMP_PASS, role: 'user' },
  { id: 'client-1', username: CLIENT_USER, password: CLIENT_PASS, role: 'client' },
];
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
    (u) => String(u.username || '').toLowerCase() === String(seedUser.username || '').toLowerCase()
  );
  if (!exists) AUTH_USERS.push(seedUser);
});
persistAuthUsers();

const sanitizeUser = (user) => ({ id: user.id, username: user.username, role: user.role });
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

const logActivity = async (req, payload) => {
  const actor = req.authUser || getSessionUser(req);
  if (!actor) return;

  const entry = {
    actorId: actor.id,
    actorRole: actor.role,
    action: payload.action,
    targetType: payload.targetType,
    targetId: payload.targetId || '',
    details: payload.details || '',
    metadata: payload.metadata || {},
  };

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

// API Routes
app.post('/api/auth/login', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const user = AUTH_USERS.find(
    (u) => String(u.username || '').toLowerCase() === username.toLowerCase() && u.password === password
  );
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  req.session.authUser = sanitizeUser(user);
  logActivity(req, {
    action: 'auth.login',
    targetType: 'session',
    targetId: req.sessionID || '',
    details: `${user.username} logged in`,
  });
  return res.json({ user: req.session.authUser });
});

app.post('/api/auth/register', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const roleInput = String(req.body.role || 'user').trim().toLowerCase();
  const adminCode = String(req.body.adminCode || '');
  const role = ['admin', 'user'].includes(roleInput) ? roleInput : 'user';

  if (!username || username.length < 3 || username.length > 32) {
    return res.status(400).json({ error: 'Username must be 3 to 32 characters' });
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    return res.status(400).json({ error: 'Username can only contain letters, numbers, dot, underscore, and dash' });
  }
  if (!password || password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  }
  const exists = AUTH_USERS.some(
    (u) => String(u.username || '').toLowerCase() === username.toLowerCase()
  );
  if (exists) {
    return res.status(409).json({ error: 'Username already exists' });
  }
  if (role === 'admin' && adminCode !== ADMIN_SIGNUP_CODE) {
    return res.status(403).json({ error: 'Invalid admin signup code' });
  }

  const newUser = {
    id: `${role}-${Date.now()}`,
    username,
    password,
    role,
  };
  AUTH_USERS.push(newUser);
  persistAuthUsers();
  req.session.authUser = sanitizeUser(newUser);
  logActivity(req, {
    action: 'auth.register',
    targetType: 'user',
    targetId: newUser.id,
    details: `${newUser.username} registered as ${newUser.role}`,
  });
  return res.status(201).json({ user: req.session.authUser });
});

app.post('/api/auth/logout', (req, res) => {
  logActivity(req, {
    action: 'auth.logout',
    targetType: 'session',
    targetId: req.sessionID || '',
    details: 'User logged out',
  });
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get('/api/auth/me', (req, res) => {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  return res.json({ user });
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

app.post('/api/projects', upload.single('image'), async (req, res) => {
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

app.put('/api/projects/:id', upload.single('image'), async (req, res) => {
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

app.post('/api/projects/bulk-delete', basicAuth({
    users: { [ADMIN_USER]: ADMIN_PASS },
    challenge: true,
    unauthorizedResponse: 'Unauthorized Access'
}), async (req, res) => {
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

app.delete('/api/projects/:id', async (req, res) => {
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
  const publicId = `mastertech-files/${Date.now()}-${base || 'file'}`;
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

const removeLocalFile = (filePath) => {
  if (!filePath) return;
  const normalized = path.join(__dirname, String(filePath).replace(/^\/+/, ''));
  if (fs.existsSync(normalized)) {
    fs.unlinkSync(normalized);
  }
};

const filterFilesByRole = (files, role, userId) => {
  if (role === 'admin') return files;
  if (role === 'client') return files.filter((f) => f.visibility === 'client');
  return files.filter((f) => f.ownerId === userId || f.visibility === 'team' || f.visibility === 'client');
};

app.get('/api/folders', requireAuth, async (req, res) => {
  try {
    const role = req.authUser.role;
    const userId = req.authUser.id;

    const files = useFallback || mongoose.connection.readyState !== 1
      ? filterFilesByRole(fallbackFiles, role, userId)
      : filterFilesByRole(await FileItem.find().lean(), role, userId);

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
    if (useFallback || mongoose.connection.readyState !== 1) {
      return res.json(fallbackActivityLogs.slice(0, limit));
    }
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(limit).lean();
    return res.json(logs);
  } catch (err) {
    console.error('Error fetching activity logs:', err);
    return res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

app.options('/api/files', cors(corsOptions));

app.options('/api/files/:id', cors(corsOptions));

app.get('/api/files', requireAuth, async (req, res) => {
  const role = req.authUser.role;
  const userId = req.authUser.id;
  try {
    if (useFallback || mongoose.connection.readyState !== 1) {
      return res.json(filterFilesByRole(fallbackFiles, role, userId));
    }

    const files = await FileItem.find().sort({ createdAt: -1 }).lean();
    return res.json(filterFilesByRole(files, role, userId));
  } catch (err) {
    console.error('Error fetching files:', err);
    return res.status(500).json({ error: 'Failed to fetch files' });
  }
});

app.post('/api/files', requireAuth, requireRoles(['admin', 'user']), fileUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File upload is required' });
    }

    const ownerId = req.authUser.role === 'admin'
      ? (req.body.ownerId || req.authUser.id).toString()
      : req.authUser.id;
    const visibility = ['private', 'team', 'client'].includes(req.body.visibility) ? req.body.visibility : 'private';
    const tags = normalizeTags(req.body.tags);
    const cloudMeta = cloudStorageEnabled ? await uploadFileToCloud(req.file) : null;
    const payload = {
      originalName: req.file.originalname,
      storedName: cloudMeta?.storedName || req.file.filename,
      path: cloudMeta?.path || `/uploads/${req.file.filename}`,
      mimeType: req.file.mimetype || '',
      size: req.file.size || 0,
      ownerId,
      visibility,
      folder: (req.body.folder || '').toString().trim(),
      projectId: (req.body.projectId || '').toString(),
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
    if (typeof req.body.notes === 'string') {
      updates.notes = req.body.notes;
    }

    if (useFallback || mongoose.connection.readyState !== 1) {
      const idx = fallbackFiles.findIndex((f) => f._id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'File not found' });
      if (req.authUser.role !== 'admin' && fallbackFiles[idx].ownerId !== req.authUser.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      fallbackFiles[idx] = { ...fallbackFiles[idx], ...updates, updatedAt: new Date().toISOString() };
      persistFallbackFiles();
      await logActivity(req, {
        action: 'file.update',
        targetType: 'file',
        targetId: req.params.id,
        details: `Updated ${fallbackFiles[idx].originalName}`,
        metadata: updates,
      });
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

    console.log('Received contact form submission:', {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      hasMessage: !!req.body.message,
      hasRecaptcha: !!req.body.recaptchaToken,
      attemptsRemaining: 3 - req.session.contactAttempts.length
    });

    const { name, email, phone, message, recaptchaToken } = req.body;

    if (!name || !email || !message || !recaptchaToken) {
      console.log('Missing required fields:', {
        name: !!name,
        email: !!email,
        phone: !!phone,
        message: !!message,
        recaptchaToken: !!recaptchaToken
      });
      return res.status(400).json({
        error: 'All fields are required, including reCAPTCHA verification.'
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

    // Check if email configuration is available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email configuration missing. Returning success without sending email.');
      return res.status(200).json({ 
        message: 'Message received successfully. We will get back to you soon.'
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
        text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\nMessage: ${message}`,
        html: `<p><strong>Name:</strong> ${name}</p>
               <p><strong>Email:</strong> ${email}</p>
               <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
               <p><strong>Message:</strong> ${message}</p>`
      };

      console.log('Sending email...');
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully');
      
      res.status(200).json({ message: 'Message sent successfully' });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      res.status(200).json({ 
        message: 'Message received successfully. We will get back to you soon.'
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
  res.json({ usingFallback: useFallback || !dbConnected, dbConnected, cloudStorageEnabled });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
});

// Start Server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
