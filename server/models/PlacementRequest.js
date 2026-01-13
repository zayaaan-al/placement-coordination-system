const mongoose = require('mongoose');

const placementRequestSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  studentProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentProfile',
    required: true,
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  avgScore: {
    type: Number,
    default: null,
    min: 0,
    max: 100,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
  adminRemarks: {
    type: String,
    trim: true,
    default: '',
  },
}, { timestamps: true });

placementRequestSchema.index({ studentProfileId: 1, status: 1 });
placementRequestSchema.index({ trainerId: 1, requestedAt: -1 });

module.exports = mongoose.model('PlacementRequest', placementRequestSchema);
