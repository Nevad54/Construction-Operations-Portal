const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const basicAuth = require('express-basic-auth');
const session = require('express-session');
const multer = require('multer');
const mongoose = require('mongoose');
const requestIp = require('request-ip');

const app = express();
const router = express.Router();

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestIp.mw());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}));

// Basic auth for admin routes
const adminAuth = basicAuth({
  users: { 
    [process.env.ADMIN_USERNAME || 'admin']: process.env.ADMIN_PASSWORD || 'admin123' 
  },
  challenge: true
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mastertech', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Contact form submission
router.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, message, recaptchaToken } = req.body;

    // Verify reCAPTCHA
    const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
    });

    const recaptchaData = await recaptchaResponse.json();

    if (!recaptchaData.success) {
      return res.status(400).json({ 
        error: 'reCAPTCHA verification failed',
        details: recaptchaData['error-codes']
      });
    }

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_RECIPIENT,
      subject: 'New Contact Form Submission',
      text: `
        Name: ${name}
        Email: ${email}
        Phone: ${phone}
        Message: ${message}
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Admin routes
router.get('/admin/projects', adminAuth, async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Mount the router
app.use('/.netlify/functions/api', router);

// Export the handler for Netlify Functions
const handler = app;

exports.handler = async (event, context) => {
  return handler(event, context);
}; 