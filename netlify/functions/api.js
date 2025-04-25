const mongoose = require('mongoose');

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

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://mastertech2.netlify.app',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json'
};

// Connect to MongoDB
let db;
const connectDB = async () => {
  if (db) return db;
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');
    db = mongoose.connection;
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Export the handler for Netlify Functions
exports.handler = async (event, context) => {
  console.log('Received request:', {
    path: event.path,
    method: event.httpMethod,
    headers: event.headers
  });

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders
    };
  }

  // Handle GET /projects
  if (event.httpMethod === 'GET' && event.path.endsWith('/projects')) {
    try {
      await connectDB();
      const projects = await Project.find();
      console.log('Projects found:', projects.length);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(projects)
      };
    } catch (error) {
      console.error('Error fetching projects:', error);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Failed to fetch projects' })
      };
    }
  }

  // Handle other routes
  return {
    statusCode: 404,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Not Found' })
  };
}; 