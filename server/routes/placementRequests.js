const express = require('express');
const Joi = require('joi');
const mongoose = require('mongoose');

const { authenticate, authorize } = require('../middleware/auth');
const PlacementRequest = require('../models/PlacementRequest');
const StudentProfile = require('../models/StudentProfile');
const StudentEvaluation = require('../models/StudentEvaluation');

const router = express.Router();

const createPlacementRequestSchema = Joi.object({
  studentProfileId: Joi.string().required(),
});

const reviewPlacementRequestSchema = Joi.object({
  adminRemarks: Joi.string().trim().allow('', null).max(1000).optional(),
});

const computeAvgScoreForTrainerStudent = async ({ trainerId, studentProfileId }) => {
  const [row] = await StudentEvaluation.aggregate([
    {
      $match: {
        trainerId: new mongoose.Types.ObjectId(trainerId),
        studentProfileId: new mongoose.Types.ObjectId(studentProfileId),
      },
    },
    {
      $group: {
        _id: null,
        avgScorePercentage: {
          $avg: {
            $cond: [
              { $gt: ['$maxScore', 0] },
              { $multiply: [{ $divide: ['$score', '$maxScore'] }, 100] },
              null,
            ],
          },
        },
      },
    },
  ]);

  return row?.avgScorePercentage ?? null;
};

/**
 * @route   POST /api/v1/placement-requests
 * @desc    Trainer creates a placement request for a student
 * @access  Private (trainer only)
 */
router.post('/', authenticate, authorize(['trainer']), async (req, res, next) => {
  try {
    const { error, value } = createPlacementRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const { studentProfileId } = value;

    const studentProfile = await StudentProfile.findOne({
      _id: studentProfileId,
      trainerId: req.user._id,
      approvalStatus: 'approved',
    }).populate('userId', 'name email');

    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        error: 'Student not found or not assigned to you',
      });
    }

    if (studentProfile.placementStatus === 'approved' || studentProfile.placementStatus === 'placed') {
      return res.status(400).json({
        success: false,
        error: 'Student is already approved for placement',
      });
    }

    const existingPending = await PlacementRequest.findOne({
      studentProfileId: studentProfile._id,
      status: 'pending',
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        error: 'A placement request is already pending for this student',
      });
    }

    const avgScore = await computeAvgScoreForTrainerStudent({
      trainerId: req.user._id,
      studentProfileId: studentProfile._id,
    });

    const placementRequest = await PlacementRequest.create({
      studentId: studentProfile.userId?._id,
      studentProfileId: studentProfile._id,
      trainerId: req.user._id,
      avgScore,
      status: 'pending',
      requestedAt: new Date(),
    });

    studentProfile.placementStatus = 'pending';
    studentProfile.placementEligible = false;
    studentProfile.placementAdminRemarks = '';
    studentProfile.placementReviewedAt = null;
    await studentProfile.save();

    res.status(201).json({
      success: true,
      data: placementRequest,
    });
  } catch (err) {
    console.error('Create placement request error:', err);
    next(err);
  }
});

/**
 * @route   DELETE /api/v1/placement-requests/:studentProfileId/cancel
 * @desc    Trainer cancels (unmoves) a pending placement request
 * @access  Private (trainer only)
 */
router.delete('/:studentProfileId/cancel', authenticate, authorize(['trainer']), async (req, res, next) => {
  try {
    const { studentProfileId } = req.params;

    const studentProfile = await StudentProfile.findOne({
      _id: studentProfileId,
      trainerId: req.user._id,
      approvalStatus: 'approved',
    });

    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        error: 'Student not found or not assigned to you',
      });
    }

    const pendingRequest = await PlacementRequest.findOne({
      studentProfileId: studentProfile._id,
      trainerId: req.user._id,
      status: 'pending',
    });

    if (!pendingRequest) {
      return res.status(400).json({
        success: false,
        error: 'No pending placement request found to cancel',
      });
    }

    await PlacementRequest.deleteOne({ _id: pendingRequest._id });

    studentProfile.placementStatus = 'not_requested';
    studentProfile.placementEligible = false;
    studentProfile.placementAdminRemarks = '';
    studentProfile.placementReviewedAt = null;
    await studentProfile.save();

    res.json({
      success: true,
      data: { cancelled: true },
    });
  } catch (err) {
    console.error('Cancel placement request error:', err);
    next(err);
  }
});

/**
 * @route   GET /api/v1/placement-requests
 * @desc    Coordinator lists placement requests (default: pending)
 * @access  Private (coordinator/admin only)
 */
router.get('/', authenticate, authorize(['coordinator', 'admin']), async (req, res, next) => {
  try {
    const status = req.query.status || 'pending';
    const query = {};
    if (status && status !== 'all') query.status = status;

    const requests = await PlacementRequest.find(query)
      .sort({ requestedAt: -1 })
      .populate('trainerId', 'name email')
      .populate({
        path: 'studentProfileId',
        populate: { path: 'userId', select: 'name email' },
        select: 'rollNo batch program placementStatus placementEligible',
      })
      .select('-__v');

    res.json({
      success: true,
      data: requests,
    });
  } catch (err) {
    console.error('List placement requests error:', err);
    next(err);
  }
});

/**
 * @route   PUT /api/v1/placement-requests/:id/approve
 * @desc    Coordinator approves a placement request
 * @access  Private (coordinator/admin only)
 */
router.put('/:id/approve', authenticate, authorize(['coordinator', 'admin']), async (req, res, next) => {
  try {
    const { error, value } = reviewPlacementRequestSchema.validate(req.body || {});
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const request = await PlacementRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Placement request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Only pending requests can be approved' });
    }

    request.status = 'approved';
    request.reviewedAt = new Date();
    request.adminRemarks = value.adminRemarks || '';
    await request.save();

    const studentProfile = await StudentProfile.findById(request.studentProfileId);
    if (studentProfile) {
      studentProfile.placementStatus = 'approved';
      studentProfile.placementEligible = true;
      studentProfile.placementAdminRemarks = request.adminRemarks;
      studentProfile.placementReviewedAt = request.reviewedAt;
      await studentProfile.save();
    }

    res.json({ success: true, data: request });
  } catch (err) {
    console.error('Approve placement request error:', err);
    next(err);
  }
});

/**
 * @route   PUT /api/v1/placement-requests/:id/reject
 * @desc    Coordinator rejects a placement request
 * @access  Private (coordinator/admin only)
 */
router.put('/:id/reject', authenticate, authorize(['coordinator', 'admin']), async (req, res, next) => {
  try {
    const { error, value } = reviewPlacementRequestSchema.validate(req.body || {});
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }

    const request = await PlacementRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Placement request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Only pending requests can be rejected' });
    }

    request.status = 'rejected';
    request.reviewedAt = new Date();
    request.adminRemarks = value.adminRemarks || '';
    await request.save();

    const studentProfile = await StudentProfile.findById(request.studentProfileId);
    if (studentProfile) {
      studentProfile.placementStatus = 'rejected';
      studentProfile.placementEligible = false;
      studentProfile.placementAdminRemarks = request.adminRemarks;
      studentProfile.placementReviewedAt = request.reviewedAt;
      await studentProfile.save();
    }

    res.json({ success: true, data: request });
  } catch (err) {
    console.error('Reject placement request error:', err);
    next(err);
  }
});

module.exports = router;
