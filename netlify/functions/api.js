const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const app = express();

// CORS headers
const allowedOrigins = ['https://mastertech2.netlify.app', 'https://mastertech3.netlify.app'];

const corsHeaders = {
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
    status: String,
    location: String,
    owner: String
});

const Project = mongoose.model('Project', projectSchema);

// Configure CORS
const corsOptions = {
    origin: allowedOrigins,
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
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
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
    console.log('Origin:', event.headers.origin);

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        console.log('Handling preflight request');
        const origin = event.headers.origin;
        const headers = {
            ...corsHeaders,
            'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
        };
        return {
            statusCode: 204,
            headers
        };
    }

    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        const origin = event.headers.origin;
        const responseHeaders = {
            ...corsHeaders,
            'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
        };

        // Handle GET /projects
        if (event.httpMethod === 'GET' && event.path.includes('/projects')) {
            console.log('Handling GET /projects request');
            const projects = await Project.find({});
            console.log('Found projects:', projects);
            
            return {
                statusCode: 200,
                headers: responseHeaders,
                body: JSON.stringify(projects)
            };
        }

        // Handle POST /projects
        if (event.httpMethod === 'POST' && event.path.includes('/projects')) {
            console.log('Handling POST /projects request');
            console.log('Content-Type:', event.headers['content-type']);
            
            let projectData;
            try {
                if (event.headers['content-type'] && event.headers['content-type'].includes('multipart/form-data')) {
                    // Parse FormData
                    const formData = new FormData();
                    const buffer = Buffer.from(event.body, 'base64');
                    const text = buffer.toString('utf8');
                    const parts = text.split('\r\n');
                    
                    // Extract form fields
                    projectData = {};
                    for (let i = 0; i < parts.length; i++) {
                        if (parts[i].includes('name="')) {
                            const fieldName = parts[i].match(/name="([^"]+)"/)[1];
                            i += 2; // Skip the empty line
                            projectData[fieldName] = parts[i];
                        }
                    }
                } else {
                    // Parse JSON
                    projectData = JSON.parse(event.body);
                }
            } catch (error) {
                console.error('Error parsing request body:', error);
                return {
                    statusCode: 400,
                    headers: responseHeaders,
                    body: JSON.stringify({ error: 'Invalid request body' })
                };
            }
            
            // Validate required fields
            if (!projectData.title || !projectData.description) {
                return {
                    statusCode: 400,
                    headers: responseHeaders,
                    body: JSON.stringify({ error: 'Title and description are required' })
                };
            }

            // Create new project
            const project = new Project({
                title: projectData.title,
                description: projectData.description,
                location: projectData.location,
                owner: projectData.owner,
                date: projectData.date ? new Date(projectData.date) : null,
                status: projectData.status || 'ongoing'
            });

            try {
                const savedProject = await project.save();
                console.log('Created new project:', savedProject);

                return {
                    statusCode: 201,
                    headers: responseHeaders,
                    body: JSON.stringify(savedProject)
                };
            } catch (error) {
                console.error('Error saving project:', error);
                return {
                    statusCode: 500,
                    headers: responseHeaders,
                    body: JSON.stringify({ error: 'Failed to save project' })
                };
            }
        }

        // Handle PUT /projects/:id
        if (event.httpMethod === 'PUT' && event.path.match(/\/projects\/[^\/]+$/)) {
            console.log('Handling PUT /projects/:id request');
            const id = event.path.split('/').pop();
            const updateData = JSON.parse(event.body);
            
            console.log('Updating project:', id);
            console.log('Update data:', updateData);

            const updatedProject = await Project.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            );

            if (!updatedProject) {
                return {
                    statusCode: 404,
                    headers: responseHeaders,
                    body: JSON.stringify({ error: 'Project not found' })
                };
            }

            return {
                statusCode: 200,
                headers: responseHeaders,
                body: JSON.stringify(updatedProject)
            };
        }

        // Handle DELETE /projects/:id
        if (event.httpMethod === 'DELETE' && event.path.match(/\/projects\/[^\/]+$/)) {
            console.log('Handling DELETE /projects/:id request');
            const id = event.path.split('/').pop();
            
            console.log('Deleting project:', id);

            try {
                const deletedProject = await Project.findByIdAndDelete(id);
                
                if (!deletedProject) {
                    return {
                        statusCode: 404,
                        headers: responseHeaders,
                        body: JSON.stringify({ error: 'Project not found' })
                    };
                }

                return {
                    statusCode: 200,
                    headers: responseHeaders,
                    body: JSON.stringify({ message: 'Project deleted successfully' })
                };
            } catch (error) {
                console.error('Error deleting project:', error);
                return {
                    statusCode: 500,
                    headers: responseHeaders,
                    body: JSON.stringify({ error: 'Failed to delete project' })
                };
            }
        }

        // Handle other routes
        console.log('Route not found:', event.path);
        return {
            statusCode: 404,
            headers: responseHeaders,
            body: JSON.stringify({ error: 'Not Found' })
        };
    } catch (error) {
        console.error('Error:', error);
        const origin = event.headers.origin;
        return {
            statusCode: 500,
            headers: {
                ...corsHeaders,
                'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
            },
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');
    }
}; 