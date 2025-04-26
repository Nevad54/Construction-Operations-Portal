const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const app = express();

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://mastertech2.netlify.app',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
};

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

// Basic authentication middleware
const basicAuth = (req, res, next) => {
  const auth = basicAuth.parse(req.headers.authorization);
  
  if (!auth) {
    console.log('No authorization header provided');
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { name, pass } = auth;
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    console.error('Admin credentials not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (name === adminUsername && pass === adminPassword) {
    console.log('Admin authentication successful');
    return next();
  }

  console.log('Invalid admin credentials provided');
  res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
  return res.status(401).json({ error: 'Invalid credentials' });
};

// Admin routes
app.post('/admin/projects', basicAuth, upload.single('image'), async (req, res) => {
  try {
    console.log('Creating new project');
    const { title, description, location, category, status } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    
    const project = new Project({
      title,
      description,
      location,
      category,
      status,
      image,
      date: new Date()
    });

    await project.save();
    console.log('Project created successfully');
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.put('/admin/projects/:id', basicAuth, upload.single('image'), async (req, res) => {
  try {
    console.log('Updating project:', req.params.id);
    const { title, description, location, category, status } = req.body;
    const updateData = {
      title,
      description,
      location,
      category,
      status
    };

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!project) {
      console.log('Project not found:', req.params.id);
      return res.status(404).json({ error: 'Project not found' });
    }

    console.log('Project updated successfully');
    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.delete('/admin/projects/:id', basicAuth, async (req, res) => {
  try {
    console.log('Deleting project:', req.params.id);
    const project = await Project.findByIdAndDelete(req.params.id);
    
    if (!project) {
      console.log('Project not found:', req.params.id);
      return res.status(404).json({ error: 'Project not found' });
    }

    console.log('Project deleted successfully');
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

exports.handler = async (event, context) => {
    console.log('API function called with path:', event.path);
    console.log('Event:', JSON.stringify(event, null, 2));

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        console.log('Handling preflight request');
        return {
            statusCode: 204,
            headers: corsHeaders
        };
    }

    try {
        // Connect to MongoDB
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        console.log('Successfully connected to MongoDB');

        // Handle GET /projects
        if (event.httpMethod === 'GET' && event.path.includes('/projects')) {
            console.log('Handling GET /projects request');
            try {
                const projects = await Project.find({});
                console.log('Successfully fetched projects:', projects);
                
                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify(projects)
                };
            } catch (dbError) {
                console.error('Database error:', dbError);
                return {
                    statusCode: 500,
                    headers: corsHeaders,
                    body: JSON.stringify({ error: 'Database error', details: dbError.message })
                };
            }
        }

        // Handle other routes
        console.log('Route not found:', event.path);
        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Not Found' })
        };
    } catch (error) {
        console.error('Critical error:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ 
                error: 'Internal Server Error',
                details: error.message,
                stack: error.stack
            })
        };
    } finally {
        try {
            await mongoose.connection.close();
            console.log('Disconnected from MongoDB');
        } catch (closeError) {
            console.error('Error closing MongoDB connection:', closeError);
        }
    }
}; 