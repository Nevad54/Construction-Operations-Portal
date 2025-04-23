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
const fetch = require('node-fetch');

const Project = require('./models/Projects');

dotenv.config();

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || '1111';
console.log('ADMIN_USER:', ADMIN_USER);
console.log('ADMIN_PASS:', ADMIN_PASS);

const app = express();

// Multer Setup for File Uploads (Projects)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://mastertech-frontend-yqjb.onrender.com', 'https://mastertech-app.onrender.com']
        : true,
    credentials: true
}));

// Add CSP headers
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'self' https://www.google.com https://recaptcha.google.com https://www.gstatic.com; frame-src 'self' https://www.google.com https://recaptcha.google.com https://www.gstatic.com;"
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
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Root Route
app.get('/', (req, res) => {
    console.log('Serving root route');
    res.sendFile(path.join(__dirname, '../pages/index.html'));
});

// CAPTCHA Route
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
console.log('Attempting to connect to MongoDB with URI:', mongoURI);
const connectDB = async () => {
    try {
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

// Helper function to verify reCAPTCHA token using https module
async function verifyRecaptcha(token) {
    return new Promise((resolve) => {
        try {
            const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY || '6Ld7MSErAAAAAEm-A_oRw1bcU2EhpK78zia29yZh'; // Production secret key
            
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
mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected'));

// API Routes
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await Project.find();
        res.json(projects);
    } catch (err) {
        console.error('Error fetching projects:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/projects/featured', async (req, res) => {
    try {
        const featuredProjects = await Project.find({ featured: true });
        res.json(featuredProjects);
    } catch (err) {
        console.error('Error fetching featured projects:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Project Routes
app.post('/api/projects', upload.single('image'), async (req, res) => {
    try {
        const { title, description, location, owner, date, status, featured } = req.body;
        const project = new Project({
            title,
            description,
            location,
            owner,
            date: date ? new Date(date) : null,
            image: req.file ? `/uploads/${req.file.filename}` : null,
            status: status || 'ongoing',
            featured: featured === 'true' || false
        });
        await project.save();
        res.status(201).json(project);
    } catch (err) {
        console.error('Error creating project:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/projects/:id', upload.single('image'), async (req, res) => {
    try {
        console.log('PUT Received body:', req.body);
        console.log('PUT Received file:', req.file);
        const { title, description, location, owner, date, status, featured } = req.body;
        console.log('Raw featured value:', featured, 'Type:', typeof featured);
        const updatedData = {
            title,
            description,
            location,
            owner,
            date: date ? new Date(date) : null,
            status: status || 'ongoing',
            featured: featured === 'true' || featured === true || featured === 'on'
        };
        console.log('Computed featured value:', updatedData.featured);
        if (req.file) updatedData.image = `/uploads/${req.file.filename}`;
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
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        console.log('Deleted Project:', project);
        res.json({ message: 'Project deleted' });
    } catch (err) {
        console.error('Error deleting project:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Contact Form Route
app.post('/api/contact', async (req, res) => {
    try {
        console.log('Received contact form submission:', {
            name: req.body.name,
            email: req.body.email,
            hasMessage: !!req.body.message,
            hasRecaptcha: !!req.body.recaptchaToken
        });

        const { name, email, message, recaptchaToken } = req.body;

        if (!name || !email || !message || !recaptchaToken) {
            console.log('Missing required fields:', {
                name: !!name,
                email: !!email,
                message: !!message,
                recaptchaToken: !!recaptchaToken
            });
            return res.status(400).json({
                error: 'All fields are required, including reCAPTCHA verification.'
            });
        }

        // Verify reCAPTCHA token
        const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY || '6Ld7MSErAAAAAEm-A_oRw1bcU2EhpK78zia29yZh';
        console.log('Verifying reCAPTCHA with secret:', recaptchaSecret.substring(0, 10) + '...');
        
        try {
            const verificationURL = 'https://www.google.com/recaptcha/api/siteverify';
            const verificationBody = `secret=${recaptchaSecret}&response=${recaptchaToken}`;

            console.log('Sending reCAPTCHA verification request...');
            const recaptchaResponse = await fetch(verificationURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: verificationBody
            });

            const recaptchaData = await recaptchaResponse.json();
            console.log('reCAPTCHA verification response:', recaptchaData);

            if (!recaptchaData.success) {
                console.log('reCAPTCHA verification failed:', recaptchaData['error-codes']);
                return res.status(400).json({
                    error: 'reCAPTCHA verification failed. Please try again.'
                });
            }
        } catch (recaptchaError) {
            console.error('Error verifying reCAPTCHA:', recaptchaError);
            // Continue with form submission even if reCAPTCHA verification fails
            // This is a fallback for development or when reCAPTCHA service is down
            console.log('Proceeding with form submission despite reCAPTCHA verification error');
        }

        // Check if email configuration is available
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('Email configuration missing. Skipping email send.');
            return res.status(200).json({ 
                message: 'Message received successfully (email sending disabled)',
                debug: process.env.NODE_ENV === 'development' ? 'Email configuration missing' : undefined
            });
        }

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
            text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
            html: `<p><strong>Name:</strong> ${name}</p>
                   <p><strong>Email:</strong> ${email}</p>
                   <p><strong>Message:</strong> ${message}</p>`
        };

        console.log('Sending email...');
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
        
        res.status(200).json({ message: 'Message sent successfully' });
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

// Serve React app for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
});

// Start Server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));