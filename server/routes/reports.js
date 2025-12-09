const express = require('express');
const StudentProfile = require('../models/StudentProfile');
const JobPosting = require('../models/JobPosting');
const TrainerEvaluation = require('../models/TrainerEvaluation');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/v1/reports/placement-stats
 * @desc    Get placement statistics and charts data
 * @access  Private (Coordinators only)
 */
router.get('/placement-stats', authenticate, authorize(['coordinator']), async (req, res, next) => {
  try {
    // Overall placement statistics
    const overallStats = await StudentProfile.aggregate([
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          approvedStudents: {
            $sum: { $cond: [{ $eq: ['$placementStatus', 'approved'] }, 1, 0] }
          },
          shortlistedStudents: {
            $sum: { $cond: [{ $eq: ['$placementStatus', 'shortlisted'] }, 1, 0] }
          },
          placedStudents: {
            $sum: { $cond: [{ $eq: ['$placementStatus', 'placed'] }, 1, 0] }
          },
          eligibleStudents: {
            $sum: { $cond: ['$placementEligible', 1, 0] }
          },
          avgAggregateScore: { $avg: '$aggregateScore' }
        }
      }
    ]);

    // Batch-wise statistics
    const batchStats = await StudentProfile.aggregate([
      {
        $group: {
          _id: '$batch',
          totalStudents: { $sum: 1 },
          approvedStudents: {
            $sum: { $cond: [{ $eq: ['$placementStatus', 'approved'] }, 1, 0] }
          },
          placedStudents: {
            $sum: { $cond: [{ $eq: ['$placementStatus', 'placed'] }, 1, 0] }
          },
          avgScore: { $avg: '$aggregateScore' },
          eligibleStudents: {
            $sum: { $cond: ['$placementEligible', 1, 0] }
          }
        }
      },
      {
        $addFields: {
          placementRate: {
            $multiply: [
              { $divide: ['$placedStudents', '$totalStudents'] },
              100
            ]
          },
          approvalRate: {
            $multiply: [
              { $divide: ['$approvedStudents', '$totalStudents'] },
              100
            ]
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Program-wise statistics
    const programStats = await StudentProfile.aggregate([
      {
        $group: {
          _id: '$program',
          totalStudents: { $sum: 1 },
          placedStudents: {
            $sum: { $cond: [{ $eq: ['$placementStatus', 'placed'] }, 1, 0] }
          },
          avgScore: { $avg: '$aggregateScore' }
        }
      },
      {
        $addFields: {
          placementRate: {
            $multiply: [
              { $divide: ['$placedStudents', '$totalStudents'] },
              100
            ]
          }
        }
      },
      { $sort: { placementRate: -1 } }
    ]);

    // Score distribution
    const scoreDistribution = await StudentProfile.aggregate([
      {
        $bucket: {
          groupBy: '$aggregateScore',
          boundaries: [0, 40, 60, 75, 85, 100],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            students: { $push: { rollNo: '$rollNo', score: '$aggregateScore' } }
          }
        }
      }
    ]);

    // Monthly placement trend (last 12 months)
    const monthlyTrend = await StudentProfile.aggregate([
      {
        $match: {
          placementStatus: 'placed',
          'placementDetails.placedDate': { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$placementDetails.placedDate' },
            month: { $month: '$placementDetails.placedDate' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // Top skills in demand (from job postings)
    const skillsDemand = await JobPosting.aggregate([
      { $unwind: '$requiredSkills' },
      {
        $group: {
          _id: '$requiredSkills.name',
          jobCount: { $sum: 1 },
          avgMinLevel: { $avg: '$requiredSkills.minLevel' }
        }
      },
      { $sort: { jobCount: -1 } },
      { $limit: 10 }
    ]);

    // Job posting statistics
    const jobStats = await JobPosting.aggregate([
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          openJobs: {
            $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] }
          },
          closedJobs: {
            $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] }
          },
          totalPositions: { $sum: '$positions' },
          totalApplications: { $sum: { $size: '$applicants' } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overall: overallStats[0] || {},
        batchStats,
        programStats,
        scoreDistribution,
        monthlyTrend,
        skillsDemand,
        jobStats: jobStats[0] || {}
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/reports/trainer-performance
 * @desc    Get trainer performance analytics
 * @access  Private (Coordinators only)
 */
router.get('/trainer-performance', authenticate, authorize(['coordinator']), async (req, res, next) => {
  try {
    // Trainer evaluation statistics
    const trainerStats = await TrainerEvaluation.aggregate([
      {
        $group: {
          _id: '$trainerId',
          totalEvaluations: { $sum: 1 },
          avgOverallRating: { $avg: '$overallRating' },
          avgTechnicalSkills: { $avg: '$technicalSkills' },
          avgCommunication: { $avg: '$communicationSkills' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'trainer'
        }
      },
      { $unwind: '$trainer' },
      {
        $project: {
          trainerName: { $concat: ['$trainer.name.first', ' ', '$trainer.name.last'] },
          trainerEmail: '$trainer.email',
          totalEvaluations: 1,
          avgOverallRating: { $round: ['$avgOverallRating', 2] },
          avgTechnicalSkills: { $round: ['$avgTechnicalSkills', 2] },
          avgCommunication: { $round: ['$avgCommunication', 2] }
        }
      },
      { $sort: { avgOverallRating: -1 } }
    ]);

    // Student performance under each trainer
    const studentPerformanceByTrainer = await StudentProfile.aggregate([
      { $unwind: '$trainerRemarks' },
      {
        $group: {
          _id: '$trainerRemarks.trainerId',
          studentCount: { $sum: 1 },
          avgStudentScore: { $avg: '$aggregateScore' },
          approvedStudents: {
            $sum: { $cond: [{ $eq: ['$placementStatus', 'approved'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'trainer'
        }
      },
      { $unwind: '$trainer' },
      {
        $project: {
          trainerName: { $concat: ['$trainer.name.first', ' ', '$trainer.name.last'] },
          studentCount: 1,
          avgStudentScore: { $round: ['$avgStudentScore', 2] },
          approvedStudents: 1,
          approvalRate: {
            $round: [
              { $multiply: [{ $divide: ['$approvedStudents', '$studentCount'] }, 100] },
              2
            ]
          }
        }
      },
      { $sort: { approvalRate: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        trainerStats,
        studentPerformanceByTrainer
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/reports/skills-analysis
 * @desc    Get skills analysis and trends
 * @access  Private (Coordinators only)
 */
router.get('/skills-analysis', authenticate, authorize(['coordinator']), async (req, res, next) => {
  try {
    // Most common skills among students
    const studentSkills = await StudentProfile.aggregate([
      { $unwind: '$skills' },
      {
        $group: {
          _id: '$skills.name',
          studentCount: { $sum: 1 },
          avgLevel: { $avg: '$skills.level' },
          maxLevel: { $max: '$skills.level' },
          minLevel: { $min: '$skills.level' }
        }
      },
      { $sort: { studentCount: -1 } },
      { $limit: 15 }
    ]);

    // Skills in demand from job postings
    const jobSkills = await JobPosting.aggregate([
      { $unwind: '$requiredSkills' },
      {
        $group: {
          _id: '$requiredSkills.name',
          jobCount: { $sum: 1 },
          avgMinLevel: { $avg: '$requiredSkills.minLevel' },
          maxMinLevel: { $max: '$requiredSkills.minLevel' }
        }
      },
      { $sort: { jobCount: -1 } },
      { $limit: 15 }
    ]);

    // Skills gap analysis
    const skillsGap = await StudentProfile.aggregate([
      { $unwind: '$skills' },
      {
        $lookup: {
          from: 'jobpostings',
          let: { skillName: '$skills.name' },
          pipeline: [
            { $unwind: '$requiredSkills' },
            {
              $match: {
                $expr: {
                  $eq: [
                    { $toLower: '$requiredSkills.name' },
                    { $toLower: '$$skillName' }
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                avgRequiredLevel: { $avg: '$requiredSkills.minLevel' },
                jobCount: { $sum: 1 }
              }
            }
          ],
          as: 'jobRequirement'
        }
      },
      { $unwind: { path: '$jobRequirement', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$skills.name',
          avgStudentLevel: { $avg: '$skills.level' },
          avgRequiredLevel: { $avg: '$jobRequirement.avgRequiredLevel' },
          studentCount: { $sum: 1 },
          jobDemand: { $max: '$jobRequirement.jobCount' }
        }
      },
      {
        $match: {
          avgRequiredLevel: { $exists: true }
        }
      },
      {
        $addFields: {
          skillGap: { $subtract: ['$avgRequiredLevel', '$avgStudentLevel'] }
        }
      },
      { $sort: { skillGap: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        studentSkills,
        jobSkills,
        skillsGap
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/reports/export/students
 * @desc    Export student data as CSV
 * @access  Private (Coordinators only)
 */
router.get('/export/students', authenticate, authorize(['coordinator']), async (req, res, next) => {
  try {
    const { batch, program, placementStatus } = req.query;

    // Build query
    const query = {};
    if (batch) query.batch = batch;
    if (program) query.program = program;
    if (placementStatus) query.placementStatus = placementStatus;

    const students = await StudentProfile.find(query)
      .populate('userId', 'name email')
      .lean();

    // Convert to CSV format
    const csvHeaders = [
      'Roll No',
      'Name',
      'Email',
      'Program',
      'Batch',
      'Aggregate Score',
      'Placement Status',
      'Placement Eligible',
      'Skills Count',
      'Test Count',
      'Trainer Remarks Count'
    ];

    const csvData = students.map(student => [
      student.rollNo,
      `${student.userId.name.first} ${student.userId.name.last}`,
      student.userId.email,
      student.program,
      student.batch,
      student.aggregateScore,
      student.placementStatus,
      student.placementEligible ? 'Yes' : 'No',
      student.skills?.length || 0,
      student.tests?.length || 0,
      student.trainerRemarks?.length || 0
    ]);

    // Create CSV content
    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students_export.csv');
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/reports/dashboard-summary
 * @desc    Get dashboard summary for coordinators
 * @access  Private (Coordinators only)
 */
router.get('/dashboard-summary', authenticate, authorize(['coordinator']), async (req, res, next) => {
  try {
    // Get current date for recent activity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Quick stats
    const [
      totalStudents,
      totalJobs,
      totalTrainers,
      recentEvaluations,
      pendingApprovals,
      activeJobs
    ] = await Promise.all([
      StudentProfile.countDocuments(),
      JobPosting.countDocuments(),
      User.countDocuments({ role: 'trainer', isActive: true }),
      TrainerEvaluation.countDocuments({ evaluationDate: { $gte: thirtyDaysAgo } }),
      StudentProfile.countDocuments({ placementStatus: 'not_approved', aggregateScore: { $gte: 60 } }),
      JobPosting.countDocuments({ status: 'open' })
    ]);

    // Recent activity
    const recentActivity = await Promise.all([
      // Recent job applications
      JobPosting.aggregate([
        { $unwind: '$applicants' },
        { $match: { 'applicants.appliedDate': { $gte: thirtyDaysAgo } } },
        { $count: 'count' }
      ]),
      
      // Recent placements
      StudentProfile.countDocuments({
        placementStatus: 'placed',
        'placementDetails.placedDate': { $gte: thirtyDaysAgo }
      })
    ]);

    const summary = {
      quickStats: {
        totalStudents,
        totalJobs,
        totalTrainers,
        recentEvaluations,
        pendingApprovals,
        activeJobs
      },
      recentActivity: {
        applications: recentActivity[0][0]?.count || 0,
        placements: recentActivity[1]
      }
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
