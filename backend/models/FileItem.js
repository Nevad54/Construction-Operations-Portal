const mongoose = require('mongoose');

const fileItemSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    path: { type: String, required: true },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
    ownerId: { type: String, default: 'user-1' },
    visibility: {
      type: String,
      enum: ['private', 'team', 'client'],
      default: 'private',
    },
    folder: { type: String, default: '' },
    projectId: { type: String, default: '' },
    tags: { type: [String], default: [] },
    notes: { type: String, default: '' },
    cloudProvider: { type: String, default: '' },
    cloudPublicId: { type: String, default: '' },
    // Optional preview (e.g., Office -> PDF) generated via third-party services.
    previewProvider: { type: String, default: '' },
    previewUrl: { type: String, default: '' },
    previewMimeType: { type: String, default: '' },
    previewExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FileItem', fileItemSchema);
