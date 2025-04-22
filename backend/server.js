const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const basicAuth = require('express-basic-auth');
const nodemailer = require('nodemailer');
const session = require('express-session');
const requestIp = require('request-ip');
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
// Enable CORS with credentials to preserve session cookies for CAPTCHA
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-random-secret-here',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Static file paths
const uploadsPath = path.join(__dirname, 'uploads');
const assetsPath = path.join(__dirname, '../assets');
const pagesPath = path.join(__dirname, '../pages');
console.log('Uploads directory:', uploadsPath);
console.log('Serving assets from:', assetsPath);
console.log('Serving pages from:', pagesPath);

app.use('/uploads', express.static(uploadsPath, {
    setHeaders: (res, path) => {
        console.log(`Serving file: ${path}`);
    }
}));
app.use('/assets', express.static(assetsPath));

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

    req.session.captchaAnswer = correctAnswer;
    const question = `Please select the image that shows a ${imageOptions[correctIndex].label}`;
    console.log('Generated CAPTCHA:', { correctAnswer, question });

    const shuffledImages = [...imageOptions].sort(() => Math.random() - 0.5);
    const response = {
        images: shuffledImages,
        correct: correctAnswer,
        question: question
    };
    console.log('Sending response:', response);
    res.json(response);
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

connectDB();
mongoose.connection.on('connected', () => console.log('Mongoose connected to DB'));
mongoose.connection.on('error', (err) => console.log('Mongoose connection error:', err));
mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected'));

// Project Routes
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await Project.find();
        console.log('Projects fetched from DB:', projects);
        res.json(projects);
    } catch (err) {
        console.error('Error fetching projects:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// New Route for Featured Projects
app.get('/api/projects/featured', async (req, res) => {
    try {
        const featuredProjects = await Project.find({ featured: true });
        console.log('Featured projects fetched from DB:', featuredProjects);
        res.json(featuredProjects);
    } catch (err) {
        console.error('Error fetching featured projects:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/projects', upload.single('image'), async (req, res) => {
    try {
        console.log('POST Received body:', req.body);
        console.log('POST Received file:', req.file);
        const { title, description, location, owner, date, status, featured } = req.body;
        const project = new Project({
            title,
            description,
            location,
            owner,
            date: date ? new Date(date) : null,
            image: req.file ? `/uploads/${req.file.filename}` : null,
            status: status || 'ongoing',
            featured: featured === 'true' || false // Convert string 'true' to boolean
        });
        await project.save();
        console.log('Saved Project:', project);
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

// Contact Form Route (unchanged from last version)
app.post('/api/contact', async (req, res) => {
    try {
        const clientIp = requestIp.getClientIp(req);
        console.log('Raw request body:', req.body);
        const { name, email, message, captchaAnswer } = req.body;

        req.session[clientIp] = req.session[clientIp] || {
            attempts: 0,
            submissions: []
        };
        const userSession = req.session[clientIp];
        const maxAttempts = 5;
        const maxHourlySubmissions = 3;
        const maxDailySubmissions = 10;
        const now = Date.now();

        userSession.submissions = userSession.submissions.filter(
            timestamp => now - timestamp < 24 * 60 * 60 * 1000
        );

        const hourlySubmissions = userSession.submissions.filter(
            timestamp => now - timestamp < 60 * 60 * 1000
        );
        if (hourlySubmissions.length >= maxHourlySubmissions) {
            console.log('Hourly submission limit reached:', { ip: clientIp, submissions: hourlySubmissions.length });
            return res.status(429).json({
                error: `You've reached the hourly limit of ${maxHourlySubmissions} submissions. Please try again later.`
            });
        }

        if (userSession.submissions.length >= maxDailySubmissions) {
            console.log('Daily submission limit reached:', { ip: clientIp, submissions: userSession.submissions.length });
            return res.status(429).json({
                error: `You've reached the daily limit of ${maxDailySubmissions} submissions. Please try again tomorrow.`
            });
        }

        if (userSession.attempts >= maxAttempts) {
            console.log('Attempt limit reached:', { ip: clientIp, attempts: userSession.attempts });
            return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
        }

        if (!name || !email || !message || !captchaAnswer) {
            userSession.attempts += 1;
            console.log('Missing fields:', { name, email, message, captchaAnswer, attempts: userSession.attempts });
            return res.status(400).json({
                error: `All fields are required, including CAPTCHA. Attempts remaining: ${maxAttempts - userSession.attempts}`
            });
        }

        const correctAnswer = req.session.captchaAnswer;
        if (!correctAnswer || captchaAnswer !== correctAnswer) {
            userSession.attempts += 1;
            console.log('CAPTCHA verification failed:', { captchaAnswer, correctAnswer, attempts: userSession.attempts });
            return res.status(400).json({
                error: `Incorrect CAPTCHA selection. Attempts remaining: ${maxAttempts - userSession.attempts}`
            });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        const mailOptions = {
            from: `"${name}" <${email}>`,
            replyTo: email,
            to: process.env.CONTACT_EMAIL || 'carldavenquimoyog@gmail.com',
            subject: `New Contact Form Submission from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
            html: `<p><strong>Name:</strong> ${name}</p>
                   <p><strong>Email:</strong> ${email}</p>
                   <p><strong>Message:</strong> ${message}</p>`
        };
        await transporter.sendMail(mailOptions);
        console.log('Email sent:', { name, email, message });

        userSession.submissions.push(now);
        userSession.attempts = 0;
        req.session.captchaAnswer = null;

        res.status(200).json({ message: 'Message sent successfully' });
    } catch (err) {
        const clientIp = requestIp.getClientIp(req);
        req.session[clientIp] = req.session[clientIp] || { attempts: 0, submissions: [] };
        req.session[clientIp].attempts += 1;
        console.error('Error processing contact form:', err, { attempts: req.session[clientIp].attempts });
        res.status(500).json({
            error: `Failed to send message. Attempts remaining: ${5 - req.session[clientIp].attempts}`
        });
    }
});

// Start Server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));