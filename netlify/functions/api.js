const express = require('express');
const nodemailer = require('nodemailer');
const basicAuth = require('express-basic-auth');
const session = require('express-session');
const multer = require('multer');
const mongoose = require('mongoose');
const requestIp = require('request-ip');

const app = express();
const router = express.Router();

// Basic middleware
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
const MONGODB_URI = 'mongodb://mtiuser:MtiPass123!@ac-thlzd0c-shard-00-00.ayq9k3f.mongodb.net:27017,ac-thlzd0c-shard-00-01.ayq9k3f.mongodb.net:27017,ac-thlzd0c-shard-00-02.ayq9k3f.mongodb.net:27017/mti-projects?ssl=true&replicaSet=atlas-s9yn0c-shard-0&authSource=admin&retryWrites=true&w=majority&appName=mti-cluster';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Project Schema
const projectSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: String,
  category: String,
  date: Date,
  status: String
});

const Project = mongoose.model('Project', projectSchema);

// Projects routes
router.get('/projects', async (req, res) => {
  try {
    console.log('Fetching projects...');
    const projects = await Project.find();
    console.log('Projects found:', projects.length);
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Admin routes
router.get('/admin/projects', adminAuth, async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (error) {
    console.error('Error fetching admin projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Mount the router
app.use('/.netlify/functions/api', router);

// Export the handler for Netlify Functions
exports.handler = async (event, context) => {
  console.log('Received request:', {
    path: event.path,
    method: event.httpMethod,
    headers: event.headers
  });

  try {
    const response = await app(event, context);
    console.log('Response:', {
      statusCode: response.statusCode,
      headers: response.headers
    });
    return response;
  } catch (error) {
    console.error('Error handling request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
}; 