const mongoose = require('mongoose');

const jobPostingSchema = new mongoose.Schema({
  coordinatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    name: { type: String, required: true, trim: true },
    website: { type: String, trim: true },
    logo: { type: String, trim: true }
  },
  requiredSkills: [{
    name: { type: String, required: true, trim: true },
    minLevel: { type: Number, min: 0, max: 100, required: true }
  }],
  minAggregateScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  positions: {
    type: Number,
    required: true,
    min: 1
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  salary: {
    min: { type: Number },
    max: { type: Number },
    currency: { type: String, default: 'INR' }
  },
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'internship', 'contract'],
    default: 'full-time'
  },
  experience: {
    min: { type: Number, default: 0 },
    max: { type: Number }
  },
  deadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'draft'],
    default: 'open'
  },
  // Additional filters
  eligibleBatches: [{ type: String, trim: true }],
  eligiblePrograms: [{ type: String, trim: true }],
  
  // Application tracking
  applicants: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    appliedDate: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['applied', 'shortlisted', 'interviewed', 'selected', 'rejected'],
      default: 'applied'
    },
    matchScore: { type: Number, min: 0, max: 100 }
  }],
  
  // Job posting metadata
  views: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Indexes for efficient queries
jobPostingSchema.index({ coordinatorId: 1 });
jobPostingSchema.index({ status: 1 });
jobPostingSchema.index({ deadline: 1 });
jobPostingSchema.index({ 'requiredSkills.name': 1 });
jobPostingSchema.index({ createdAt: -1 });
jobPostingSchema.index({ minAggregateScore: 1 });

// Virtual for days remaining
jobPostingSchema.virtual('daysRemaining').get(function() {
  if (!this.deadline) return 0;
  const today = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Virtual for application count
jobPostingSchema.virtual('applicationCount').get(function() {
  return this.applicants.length;
});

// Virtual for shortlisted count
jobPostingSchema.virtual('shortlistedCount').get(function() {
  return this.applicants.filter(app => app.status === 'shortlisted').length;
});

// Method to check if job is expired
jobPostingSchema.methods.isExpired = function() {
  return new Date() > this.deadline;
};

// Method to add applicant
jobPostingSchema.methods.addApplicant = function(studentId, matchScore = 0) {
  // Check if student already applied
  const existingApplication = this.applicants.find(
    app => app.studentId.toString() === studentId.toString()
  );
  
  if (existingApplication) {
    throw new Error('Student has already applied for this job');
  }
  
  this.applicants.push({
    studentId,
    matchScore,
    appliedDate: new Date()
  });
  
  return this.save();
};

// Method to update applicant status
jobPostingSchema.methods.updateApplicantStatus = function(studentId, status) {
  const application = this.applicants.find(
    app => app.studentId.toString() === studentId.toString()
  );
  
  if (!application) {
    throw new Error('Application not found');
  }
  
  application.status = status;
  return this.save();
};

// Pre-save middleware to auto-close expired jobs
jobPostingSchema.pre('save', function(next) {
  if (this.isExpired() && this.status === 'open') {
    this.status = 'closed';
  }
  next();
});

module.exports = mongoose.model('JobPosting', jobPostingSchema);

