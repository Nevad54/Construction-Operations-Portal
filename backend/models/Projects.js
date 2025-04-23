const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: String,
    date: Date,
    image: String,
    status: String
  });

module.exports = mongoose.model('Project', projectSchema);

// After
