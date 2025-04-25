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

// CORS configuration
const corsOptions = {
  origin: [
    'https://mastertech2.netlify.app',
    'https://mastertech3.netlify.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable preflight requests for all routes
app.use(express.json());
app.use(requestIp.mw());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || '70f1e04a35336b79732f2f034b101d4d',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
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
exports.handler = async (event, context) => {
  // Create a new request object
  const request = {
    ...event,
    headers: {
      ...event.headers,
      'Access-Control-Allow-Origin': 'https://mastertech2.netlify.app',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
    }
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': 'https://mastertech2.netlify.app',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
      }
    };
  }

  try {
    const response = await app(request, context);
    
    // Add CORS headers to the response
    return {
      ...response,
      headers: {
        ...response.headers,
        'Access-Control-Allow-Origin': 'https://mastertech2.netlify.app',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
      }
    };
  } catch (error) {
    console.error('Error handling request:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': 'https://mastertech2.netlify.app',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
      },
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
}; 