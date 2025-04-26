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

// Export the handler for Netlify Functions
exports.handler = async (event, context) => {
  console.log('Function started');
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return {
      statusCode: 204,
      headers: corsHeaders
    };
  }

  // Handle GET /projects
  if (event.httpMethod === 'GET' && event.path.includes('/projects')) {
    console.log('Handling GET /projects request');
    
    // Return a test response first
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify([
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
      ])
    };
  }

  // Handle other routes
  console.log('Route not found:', event.path);
  return {
    statusCode: 404,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Not Found' })
  };
}; 