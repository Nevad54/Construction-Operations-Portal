const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  usernameLower: { type: String, required: true, unique: true, index: true },
  role: { type: String, enum: ['admin', 'user', 'client'], required: true, index: true },
  passwordHash: { type: String, required: true },
  // Project access scope (used for filtering files/projects by assignment).
  // Stored as strings to avoid cross-model coupling and keep session payload simple.
  projectIds: { type: [String], default: [] },
}, { timestamps: true });

UserSchema.pre('validate', function preValidate(next) {
  if (this.username) {
    this.usernameLower = String(this.username).trim().toLowerCase();
  }
  next();
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
