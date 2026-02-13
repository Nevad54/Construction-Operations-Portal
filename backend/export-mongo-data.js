const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB connection string
const MONGO_URI = 'mongodb+srv://mtiuser:AtlasPass123@mti-cluster.ayq9k3f.mongodb.net/mti-projects?appName=mti-cluster';

// Project schema (matching your backend)
const projectSchema = new mongoose.Schema({
  title: String,
  description: String,
  location: String,
  owner: String,
  date: Date,
  image: String,
  status: String,
  _id: mongoose.Schema.Types.ObjectId
});

async function exportData() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });

    console.log('Connected! Fetching projects...');
    
    const Project = mongoose.model('Project', projectSchema, 'projects');
    const projects = await Project.find({});

    console.log(`Found ${projects.length} projects`);

    // Convert to plain objects
    const projectsData = projects.map(p => ({
      _id: p._id ? p._id.toString() : null,
      title: p.title,
      description: p.description,
      location: p.location,
      owner: p.owner,
      date: p.date,
      image: p.image,
      status: p.status
    }));

    // Save to file
    const outputPath = path.join(__dirname, 'dev_projects.json');
    fs.writeFileSync(outputPath, JSON.stringify(projectsData, null, 2));

    console.log(`✅ Successfully exported ${projectsData.length} projects to dev_projects.json`);
    console.log(`📁 File saved at: ${outputPath}`);

    // Display sample
    if (projectsData.length > 0) {
      console.log('\nSample project:');
      console.log(JSON.stringify(projectsData[0], null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

exportData();
