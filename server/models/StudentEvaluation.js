const mongoose = require('mongoose');

const evaluationTypes = ['aptitude', 'logical', 'machine', 'spring_meet'];

const studentEvaluationSchema = new mongoose.Schema({
  studentProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentProfile',
    required: true,
    index: true
  },
  studentUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: evaluationTypes,
    required: true
  },
  frequency: {
    type: String,
    enum: ['weekly', 'monthly'],
    required: true
  },
  recordedDate: {
    type: Date,
    required: true
  },
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  periodLabel: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    min: 0,
    required: true
  },
  maxScore: {
    type: Number,
    min: 1,
    default: 25
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

studentEvaluationSchema.index(
  { studentProfileId: 1, type: 1, periodStart: 1 },
  { unique: true }
);

module.exports = mongoose.model('StudentEvaluation', studentEvaluationSchema);
