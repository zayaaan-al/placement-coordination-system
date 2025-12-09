const StudentProfile = require('../models/StudentProfile');
const JobPosting = require('../models/JobPosting');
const User = require('../models/User');

/**
 * Job-Student Matching Service
 * Implements sophisticated matching algorithm based on skills, performance, and other criteria
 */
class MatchingService {
  /**
   * Default weights for scoring components
   */
  static DEFAULT_WEIGHTS = {
    skills: 0.6,      // 60% - Skill matching
    tests: 0.25,      // 25% - Test performance
    trainer: 0.15     // 15% - Trainer ratings
  };

  /**
   * Find and rank eligible students for a job
   * @param {string} jobId - Job posting ID
   * @param {Object} options - Matching options
   * @param {Object} options.weights - Custom weights for scoring
   * @param {number} options.limit - Maximum number of candidates to return
   * @param {boolean} options.includeExplanation - Include score breakdown
   * @returns {Array} Ranked list of eligible candidates
   */
  async findCandidatesForJob(jobId, options = {}) {
    const {
      weights = MatchingService.DEFAULT_WEIGHTS,
      limit = 50,
      includeExplanation = false
    } = options;

    // Get job details
    const job = await JobPosting.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status !== 'open') {
      throw new Error('Job is not open for applications');
    }

    // Build query for eligible students
    const query = {
      placementEligible: true,
      aggregateScore: { $gte: job.minAggregateScore },
      placementStatus: 'approved'
    };

    // Add batch and program filters if specified
    if (job.eligibleBatches && job.eligibleBatches.length > 0) {
      query.batch = { $in: job.eligibleBatches };
    }

    if (job.eligiblePrograms && job.eligiblePrograms.length > 0) {
      query.program = { $in: job.eligiblePrograms };
    }

    // Get eligible students
    const students = await StudentProfile.find(query)
      .populate('userId', 'name email profile')
      .lean();

    // Calculate match scores for each student
    const candidates = [];

    for (const student of students) {
      // Skip if student already applied
      const hasApplied = job.applicants.some(
        app => app.studentId.toString() === student.userId._id.toString()
      );

      if (hasApplied) continue;

      const matchResult = this.calculateMatchScore(student, job, weights, includeExplanation);
      
      if (matchResult.totalScore > 0) {
        candidates.push({
          student,
          matchScore: matchResult.totalScore,
          ...(includeExplanation && { explanation: matchResult.explanation })
        });
      }
    }

    // Sort by match score (descending) and limit results
    candidates.sort((a, b) => b.matchScore - a.matchScore);
    
    return candidates.slice(0, limit);
  }

  /**
   * Calculate match score for a student-job pair
   * @param {Object} student - Student profile
   * @param {Object} job - Job posting
   * @param {Object} weights - Scoring weights
   * @param {boolean} includeExplanation - Include detailed breakdown
   * @returns {Object} Match score and explanation
   */
  calculateMatchScore(student, job, weights, includeExplanation = false) {
    const explanation = {};

    // 1. Skill Matching Score
    const skillScore = this.calculateSkillMatchScore(student, job.requiredSkills);
    explanation.skillScore = {
      score: skillScore,
      weight: weights.skills,
      contribution: skillScore * weights.skills,
      details: this.getSkillMatchDetails(student, job.requiredSkills)
    };

    // 2. Test Performance Score
    const testScore = this.calculateTestScore(student);
    explanation.testScore = {
      score: testScore,
      weight: weights.tests,
      contribution: testScore * weights.tests,
      details: {
        aggregateScore: student.aggregateScore,
        testCount: student.tests.length,
        averageScore: this.getAverageTestScore(student)
      }
    };

    // 3. Trainer Rating Score
    const trainerScore = this.calculateTrainerScore(student);
    explanation.trainerScore = {
      score: trainerScore,
      weight: weights.trainer,
      contribution: trainerScore * weights.trainer,
      details: {
        averageRating: this.getAverageTrainerRating(student),
        remarkCount: student.trainerRemarks.length,
        recentRemarks: student.trainerRemarks.slice(-3)
      }
    };

    // 4. Recency Boost
    const recencyBoost = this.calculateRecencyBoost(student);
    explanation.recencyBoost = {
      score: recencyBoost,
      details: {
        lastTestDate: this.getLastTestDate(student),
        lastRemarkDate: this.getLastRemarkDate(student)
      }
    };

    // Calculate total score
    const baseScore = (skillScore * weights.skills) + 
                     (testScore * weights.tests) + 
                     (trainerScore * weights.trainer);
    
    const totalScore = Math.min(100, Math.round(baseScore + recencyBoost));

    const result = { totalScore };
    
    if (includeExplanation) {
      result.explanation = {
        ...explanation,
        baseScore: Math.round(baseScore),
        totalScore,
        weights,
        timestamp: new Date()
      };
    }

    return result;
  }

  /**
   * Calculate skill matching score
   * @param {Object} student - Student profile
   * @param {Array} requiredSkills - Job required skills
   * @returns {number} Skill match score (0-100)
   */
  calculateSkillMatchScore(student, requiredSkills) {
    if (!requiredSkills || requiredSkills.length === 0) {
      return 100; // No specific skills required
    }

    if (!student.skills || student.skills.length === 0) {
      return 0; // Student has no skills listed
    }

    let totalWeight = 0;
    let matchedWeight = 0;

    for (const requiredSkill of requiredSkills) {
      totalWeight += 1;
      
      const studentSkill = student.skills.find(
        skill => skill.name.toLowerCase() === requiredSkill.name.toLowerCase()
      );

      if (studentSkill && studentSkill.level >= requiredSkill.minLevel) {
        // Give partial credit based on how much the student exceeds minimum
        const excess = Math.min(studentSkill.level - requiredSkill.minLevel, 20);
        const skillScore = 1 + (excess / 100); // Base 1 + bonus up to 0.2
        matchedWeight += skillScore;
      }
    }

    return totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;
  }

  /**
   * Get detailed skill match information
   * @param {Object} student - Student profile
   * @param {Array} requiredSkills - Job required skills
   * @returns {Object} Skill match details
   */
  getSkillMatchDetails(student, requiredSkills) {
    const details = {
      matched: [],
      missing: [],
      additional: []
    };

    const requiredSkillNames = requiredSkills.map(skill => skill.name.toLowerCase());

    for (const requiredSkill of requiredSkills) {
      const studentSkill = student.skills.find(
        skill => skill.name.toLowerCase() === requiredSkill.name.toLowerCase()
      );

      if (studentSkill) {
        details.matched.push({
          name: requiredSkill.name,
          required: requiredSkill.minLevel,
          actual: studentSkill.level,
          meets: studentSkill.level >= requiredSkill.minLevel
        });
      } else {
        details.missing.push({
          name: requiredSkill.name,
          required: requiredSkill.minLevel
        });
      }
    }

    // Find additional skills student has
    for (const studentSkill of student.skills || []) {
      if (!requiredSkillNames.includes(studentSkill.name.toLowerCase())) {
        details.additional.push({
          name: studentSkill.name,
          level: studentSkill.level
        });
      }
    }

    return details;
  }

  /**
   * Calculate test performance score
   * @param {Object} student - Student profile
   * @returns {number} Test score (0-100)
   */
  calculateTestScore(student) {
    return student.aggregateScore || 0;
  }

  /**
   * Calculate trainer rating score
   * @param {Object} student - Student profile
   * @returns {number} Trainer score (0-100)
   */
  calculateTrainerScore(student) {
    if (!student.trainerRemarks || student.trainerRemarks.length === 0) {
      return 50; // Neutral score if no trainer feedback
    }

    const avgRating = this.getAverageTrainerRating(student);
    return Math.round((avgRating - 1) * 25); // Convert 1-5 scale to 0-100
  }

  /**
   * Calculate recency boost based on recent activity
   * @param {Object} student - Student profile
   * @returns {number} Recency boost (0-10)
   */
  calculateRecencyBoost(student) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    let boost = 0;

    // Boost for recent tests
    const recentTests = student.tests?.filter(test => 
      new Date(test.date) > thirtyDaysAgo
    ) || [];
    
    if (recentTests.length > 0) {
      boost += Math.min(5, recentTests.length * 2);
    }

    // Boost for recent trainer remarks
    const recentRemarks = student.trainerRemarks?.filter(remark => 
      new Date(remark.date) > thirtyDaysAgo
    ) || [];
    
    if (recentRemarks.length > 0) {
      boost += Math.min(3, recentRemarks.length);
    }

    return Math.min(10, boost);
  }

  /**
   * Get average test score for student
   * @param {Object} student - Student profile
   * @returns {number} Average test score
   */
  getAverageTestScore(student) {
    if (!student.tests || student.tests.length === 0) return 0;
    
    const total = student.tests.reduce((sum, test) => {
      const percentage = (test.score / test.maxScore) * 100;
      return sum + percentage;
    }, 0);
    
    return Math.round(total / student.tests.length);
  }

  /**
   * Get average trainer rating for student
   * @param {Object} student - Student profile
   * @returns {number} Average trainer rating
   */
  getAverageTrainerRating(student) {
    if (!student.trainerRemarks || student.trainerRemarks.length === 0) return 3;
    
    const total = student.trainerRemarks.reduce((sum, remark) => sum + remark.rating, 0);
    return Math.round((total / student.trainerRemarks.length) * 10) / 10;
  }

  /**
   * Get last test date
   * @param {Object} student - Student profile
   * @returns {Date|null} Last test date
   */
  getLastTestDate(student) {
    if (!student.tests || student.tests.length === 0) return null;
    
    const dates = student.tests.map(test => new Date(test.date));
    return new Date(Math.max(...dates));
  }

  /**
   * Get last trainer remark date
   * @param {Object} student - Student profile
   * @returns {Date|null} Last remark date
   */
  getLastRemarkDate(student) {
    if (!student.trainerRemarks || student.trainerRemarks.length === 0) return null;
    
    const dates = student.trainerRemarks.map(remark => new Date(remark.date));
    return new Date(Math.max(...dates));
  }

  /**
   * Explain match score for a specific student-job pair
   * @param {string} studentId - Student ID
   * @param {string} jobId - Job ID
   * @param {Object} weights - Custom weights
   * @returns {Object} Detailed explanation
   */
  async explainMatchScore(studentId, jobId, weights = MatchingService.DEFAULT_WEIGHTS) {
    const student = await StudentProfile.findOne({ userId: studentId })
      .populate('userId', 'name email')
      .lean();
    
    if (!student) {
      throw new Error('Student not found');
    }

    const job = await JobPosting.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    return this.calculateMatchScore(student, job, weights, true);
  }
}

module.exports = new MatchingService();
