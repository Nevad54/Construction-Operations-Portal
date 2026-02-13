const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = 'mongodb+srv://mtiuser:AtlasPass123@mti-cluster.ayq9k3f.mongodb.net/mti-projects?appName=mti-cluster';

const projectSchema = new mongoose.Schema({
  _id: String,
  title: String,
  description: String,
  location: String,
  owner: String,
  date: Date,
  image: String,
  status: String,
  featured: Boolean
}, { _id: false });

async function syncToAtlas() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log('✅ Connected to Atlas!');
    
    const Project = mongoose.model('Project', projectSchema, 'projects');

    // Read local projects
    const localFilePath = path.join(__dirname, 'dev_projects.json');
    const localProjects = JSON.parse(fs.readFileSync(localFilePath, 'utf8'));

    console.log(`\n📥 Uploading ${localProjects.length} projects to Atlas...`);

    // Clear existing projects (optional - comment out to keep existing)
    // await Project.deleteMany({});
    // console.log('Cleared existing projects');

    // Insert/upsert projects
    for (const project of localProjects) {
      await Project.updateOne(
        { _id: project._id },
        { $set: project },
        { upsert: true }
      );
    }

    console.log(`✅ Successfully synced ${localProjects.length} projects to MongoDB Atlas!`);
    console.log('\n📊 Projects synced:');
    localProjects.forEach(p => {
      console.log(`  ✓ ${p.title}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
      console.log('\n⚠️  Cannot reach MongoDB Atlas from your network.');
      console.log('Your local data is safe in dev_projects.json');
      console.log('The app will continue working with local storage.');
    }
    process.exit(1);
  }
}

syncToAtlas();
