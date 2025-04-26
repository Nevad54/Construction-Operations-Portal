const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const app = express();

// MongoDB connection
const MONGODB_URI = 'mongodb://mtiuser:MtiPass123!@ac-thlzd0c-shard-00-00.ayq9k3f.mongodb.net:27017,ac-thlzd0c-shard-00-01.ayq9k3f.mongodb.net:27017,ac-thlzd0c-shard-00-02.ayq9k3f.mongodb.net:27017/mti-projects?ssl=true&replicaSet=atlas-s9yn0c-shard-0&authSource=admin&retryWrites=true&w=majority&appName=mti-cluster';

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

// Configure CORS
const corsOptions = {
    origin: 'https://mastertech2.netlify.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Add headers middleware
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://mastertech2.netlify.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});

app.use(express.json());

// Test projects data
const testProjects = [
    {
        _id: 'test1',
        title: 'Test Project 1',
        description: 'This is a test project',
        image: 'https://via.placeholder.com/150',
        category: 'test',
        date: new Date().toISOString(),
        status: 'active'
    },
    {
        _id: 'test2',
        title: 'Test Project 2',
        description: 'This is another test project',
        image: 'https://via.placeholder.com/150',
        category: 'test',
        date: new Date().toISOString(),
        status: 'active'
    }
];

// Projects endpoint
app.get('/projects', (req, res) => {
    console.log('Projects endpoint called');
    console.log('Request headers:', req.headers);
    
    res.status(200).json(testProjects);
});

// Handle preflight requests
app.options('*', (req, res) => {
    console.log('Preflight request received');
    res.status(204).end();
});

// Handle all other routes
app.use((req, res) => {
    console.log('Unhandled route:', req.path);
    res.status(404).json({ error: 'Not found' });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

exports.handler = async (event, context) => {
    console.log('API function called with path:', event.path);
    console.log('Event:', JSON.stringify(event, null, 2));
    
    return new Promise((resolve, reject) => {
        app.handle(event, context, (err, result) => {
            if (err) {
                console.error('Error in handler:', err);
                reject(err);
            } else {
                console.log('Handler result:', result);
                resolve(result);
            }
        });
    });
}; 