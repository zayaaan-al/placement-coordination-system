const mongoose = require('mongoose');

const trainerEvaluationSchema = new mongoose.Schema({
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  evaluationDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  skillsEvaluated: [{
    skillName: { type: String, required: true, trim: true },
    score: { type: Number, min: 0, max: 100, required: true },
    remark: { type: String, trim: true }
  }],
  overallRating: {
    type: Number,
    min: 1,
    max: 5,
    required: false
  },
  generalFeedback: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  attachments: [{
    filename: { type: String, required: true },
    url: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now }
  }],
  // Evaluation categories
  technicalSkills: {
    type: Number,
    min: 1,
    max: 5
  },
  communicationSkills: {
    type: Number,
    min: 1,
    max: 5
  },
  problemSolving: {
    type: Number,
    min: 1,
    max: 5
  },
  teamwork: {
    type: Number,
    min: 1,
    max: 5
  },
  punctuality: {
    type: Number,
    min: 1,
    max: 5
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
trainerEvaluationSchema.index({ trainerId: 1 });
trainerEvaluationSchema.index({ studentId: 1 });
trainerEvaluationSchema.index({ evaluationDate: -1 });
trainerEvaluationSchema.index({ trainerId: 1, studentId: 1 });

// Virtual for average skill score
trainerEvaluationSchema.virtual('averageSkillScore').get(function() {
  if (this.skillsEvaluated.length === 0) return 0;
  const total = this.skillsEvaluated.reduce((sum, skill) => sum + skill.score, 0);
  return Math.round(total / this.skillsEvaluated.length);
});

// Method to calculate comprehensive score
trainerEvaluationSchema.methods.calculateComprehensiveScore = function() {
  const categories = [
    this.technicalSkills,
    this.communicationSkills,
    this.problemSolving,
    this.teamwork,
    this.punctuality
  ].filter(score => score !== undefined);
  
  if (categories.length === 0) return this.overallRating * 20; // Convert 1-5 to 0-100
  
  const avgCategoryScore = categories.reduce((sum, score) => sum + score, 0) / categories.length;
  return Math.round(avgCategoryScore * 20); // Convert 1-5 to 0-100
};

module.exports = mongoose.model('TrainerEvaluation', trainerEvaluationSchema);

