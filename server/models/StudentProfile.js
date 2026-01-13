const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  rollNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  program: {
    type: String,
    required: true,
    trim: true
  },
  batch: {
    type: String,
    required: true,
    trim: true
  },
  skills: [{
    name: { type: String, required: true, trim: true },
    level: { type: Number, min: 0, max: 100, required: true },
    tags: [{ type: String, trim: true }],
    lastUpdated: { type: Date, default: Date.now }
  }],
  tests: [{
    testId: { type: mongoose.Schema.Types.ObjectId },
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    score: { type: Number, required: true, min: 0 },
    maxScore: { type: Number, default: 100 },
    subjectBreakdown: [{
      subject: { type: String, required: true, trim: true },
      marks: { type: Number, required: true, min: 0 }
    }],
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  trainerRemarks: [{
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    remark: { type: String, required: true, trim: true },
    rating: { type: Number, min: 1, max: 5, required: true }
  }],
  placementStatus: {
    type: String,
    enum: ['not_requested', 'not_approved', 'pending', 'approved', 'rejected', 'shortlisted', 'placed', 'removed'],
    default: 'not_requested'
  },
  placementEligible: {
    type: Boolean,
    default: false
  },
  placementAdminRemarks: {
    type: String,
    trim: true,
    default: ''
  },
  placementReviewedAt: {
    type: Date,
    default: null
  },
  aggregateScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Additional placement details
  placementDetails: {
    company: { type: String, trim: true },
    position: { type: String, trim: true },
    salary: { type: Number },
    placedDate: { type: Date }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
studentProfileSchema.index({ userId: 1 });
studentProfileSchema.index({ rollNo: 1 });
studentProfileSchema.index({ batch: 1 });
studentProfileSchema.index({ trainerId: 1, approvalStatus: 1 });
studentProfileSchema.index({ placementStatus: 1 });
studentProfileSchema.index({ 'skills.name': 1 });

// Calculate aggregate score based on tests and trainer ratings
studentProfileSchema.methods.calculateAggregateScore = function() {
  let testScore = 0;
  let trainerScore = 0;
  
  // Calculate average test score
  if (this.tests.length > 0) {
    const totalTestScore = this.tests.reduce((sum, test) => {
      const percentage = (test.score / test.maxScore) * 100;
      return sum + percentage;
    }, 0);
    testScore = totalTestScore / this.tests.length;
  }
  
  // Calculate average trainer rating (convert 1-5 scale to 0-100)
  if (this.trainerRemarks.length > 0) {
    const totalRating = this.trainerRemarks.reduce((sum, remark) => sum + remark.rating, 0);
    const avgRating = totalRating / this.trainerRemarks.length;
    trainerScore = (avgRating - 1) * 25; // Convert 1-5 to 0-100
  }
  
  // Weighted combination: 70% tests, 30% trainer ratings
  this.aggregateScore = Math.round((testScore * 0.7) + (trainerScore * 0.3));
  
  // Update placement eligibility
  this.placementEligible = this.placementStatus === 'approved' || this.placementStatus === 'placed';
  
  return this.aggregateScore;
};

// Pre-save middleware to calculate aggregate score
studentProfileSchema.pre('save', function(next) {
  this.calculateAggregateScore();
  next();
});

// Virtual to get latest trainer remark
studentProfileSchema.virtual('latestTrainerRemark').get(function() {
  if (this.trainerRemarks.length === 0) return null;
  return this.trainerRemarks[this.trainerRemarks.length - 1];
});

// Method to add test result
studentProfileSchema.methods.addTest = function(testData) {
  this.tests.push(testData);
  this.calculateAggregateScore();
  return this.save();
};

// Method to add trainer remark
studentProfileSchema.methods.addTrainerRemark = function(remarkData) {
  this.trainerRemarks.push(remarkData);
  this.calculateAggregateScore();
  return this.save();
};

module.exports = mongoose.model('StudentProfile', studentProfileSchema);

