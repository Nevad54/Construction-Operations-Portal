const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: '', trim: true },
    companyName: { type: String, default: '', trim: true },
    projectType: { type: String, default: '', trim: true },
    siteLocation: { type: String, default: '', trim: true },
    timeline: { type: String, default: '', trim: true },
    serviceNeeded: { type: String, default: '', trim: true },
    message: { type: String, required: true },
    source: { type: String, default: 'contact_form' },
    ipAddress: { type: String, default: '' },
    status: {
      type: String,
      enum: ['new', 'in_progress', 'resolved', 'spam'],
      default: 'new',
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    owner: { type: String, default: '', trim: true },
    assignedTo: { type: String, default: '' },
    nextFollowUpAt: { type: Date, default: null },
    notes: { type: String, default: '' },
    handledBy: { type: String, default: '' },
    handledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inquiry', inquirySchema);
