const express = require('express');

const { authenticate, authorize } = require('../middleware/auth');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const JobPosting = require('../models/JobPosting');
const PlacementRequest = require('../models/PlacementRequest');

const router = express.Router();

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const safePercentChange = (current, previous) => {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
};

router.get('/dashboard-overview', authenticate, authorize(['admin', 'coordinator']), async (req, res, next) => {
  try {
    const monthStart = startOfMonth();
    const todayStart = startOfToday();

    const jobScope = req.user.role === 'admin'
      ? {}
      : { coordinatorId: req.user._id };

    const [
      totalStudents,
      totalStudentsBeforeThisMonth,
      activeTrainers,
      newTrainersThisMonth,
      openPositions,
      newJobsToday,
      pendingTrainerApprovals,
      pendingPlacementRequests,
      upcomingJobs,
      recentTrainerRegistrations,
      recentTrainerStatusUpdates,
      recentJobs,
      recentPlacedProfiles,
      recentRemovedProfiles,
    ] = await Promise.all([
      StudentProfile.countDocuments({}),
      StudentProfile.countDocuments({ createdAt: { $lt: monthStart } }),
      User.countDocuments({ role: 'trainer', trainerStatus: 'approved' }),
      User.countDocuments({ role: 'trainer', createdAt: { $gte: monthStart } }),
      JobPosting.countDocuments({ ...jobScope, isActive: true, status: 'open' }),
      JobPosting.countDocuments({ ...jobScope, isActive: true, status: 'open', createdAt: { $gte: todayStart } }),
      User.countDocuments({ role: 'trainer', trainerStatus: 'pending' }),
      PlacementRequest.countDocuments({ status: 'pending' }),
      JobPosting.find({ ...jobScope, isActive: true, status: 'open', deadline: { $gte: new Date() } })
        .sort({ deadline: 1 })
        .limit(5)
        .select('title company jobType deadline createdAt'),
      User.find({ role: 'trainer', createdAt: { $gte: monthStart } })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name email createdAt'),
      User.find({ role: 'trainer', trainerStatus: { $in: ['approved', 'rejected'] } })
        .sort({ updatedAt: -1 })
        .limit(10)
        .select('name email trainerStatus updatedAt'),
      JobPosting.find({ ...jobScope })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('title company status createdAt'),
      StudentProfile.find({ placementStatus: 'placed' })
        .sort({ updatedAt: -1 })
        .limit(10)
        .populate('userId', 'name email')
        .select('userId placementDetails updatedAt'),
      StudentProfile.find({ placementStatus: 'removed' })
        .sort({ updatedAt: -1 })
        .limit(10)
        .populate('userId', 'name email')
        .select('userId placementAdminRemarks placementReviewedAt updatedAt'),
    ]);

    const totalStudentsPercentChange = safePercentChange(totalStudents, totalStudentsBeforeThisMonth);

    const pendingApprovals = pendingTrainerApprovals + pendingPlacementRequests;

    const upcomingPlacements = upcomingJobs.map((job) => ({
      id: job._id,
      company: job.company?.name || '—',
      position: job.title || '—',
      type: job.jobType || '—',
      date: job.deadline || null,
    }));

    const activities = [];

    recentTrainerRegistrations.forEach((t) => {
      activities.push({
        id: `trainer_registration_${t._id}`,
        type: 'trainer_registration_submitted',
        title: 'New Trainer Registration',
        description: `${t?.name?.first || ''} ${t?.name?.last || ''}`.trim() || 'New trainer registered',
        createdAt: t.createdAt,
      });
    });

    recentTrainerStatusUpdates.forEach((t) => {
      activities.push({
        id: `trainer_status_${t._id}_${t.updatedAt?.getTime?.() || ''}`,
        type: t.trainerStatus === 'approved' ? 'trainer_approved' : 'trainer_rejected',
        title: t.trainerStatus === 'approved' ? 'Trainer Approved' : 'Trainer Rejected',
        description: `${t?.name?.first || ''} ${t?.name?.last || ''}`.trim() || 'Trainer status updated',
        createdAt: t.updatedAt,
      });
    });

    recentJobs.forEach((j) => {
      activities.push({
        id: `job_${j._id}`,
        type: 'placement_drive_created',
        title: 'Placement Drive Created',
        description: `${j.company?.name || 'Company'} • ${j.title || 'Job'}`,
        createdAt: j.createdAt,
      });
    });

    recentPlacedProfiles.forEach((p) => {
      const u = p.userId;
      const name = `${u?.name?.first || ''} ${u?.name?.last || ''}`.trim() || 'Student';
      activities.push({
        id: `student_placed_${p._id}`,
        type: 'student_placed',
        title: 'Student Placed',
        description: name,
        createdAt: p.placementDetails?.placedDate || p.updatedAt,
      });
    });

    recentRemovedProfiles.forEach((p) => {
      const u = p.userId;
      const name = `${u?.name?.first || ''} ${u?.name?.last || ''}`.trim() || 'Student';
      activities.push({
        id: `student_removed_${p._id}`,
        type: 'student_removed_from_placement',
        title: 'Student Removed',
        description: name,
        createdAt: p.placementReviewedAt || p.updatedAt,
      });
    });

    activities.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const recentActivities = activities.slice(0, 8);

    const responsePayload = {
      success: true,
      data: {
        stats: {
          totalStudents: typeof totalStudents === 'number' ? totalStudents : 0,
          totalStudentsPercentChange: typeof totalStudentsPercentChange === 'number' ? totalStudentsPercentChange : 0,
          activeTrainers: typeof activeTrainers === 'number' ? activeTrainers : 0,
          newTrainersThisMonth: typeof newTrainersThisMonth === 'number' ? newTrainersThisMonth : 0,
          openPositions: typeof openPositions === 'number' ? openPositions : 0,
          newJobsToday: typeof newJobsToday === 'number' ? newJobsToday : 0,
          pendingApprovals: typeof pendingApprovals === 'number' ? pendingApprovals : 0,
          pendingTrainerApprovals: typeof pendingTrainerApprovals === 'number' ? pendingTrainerApprovals : 0,
          pendingPlacementRequests: typeof pendingPlacementRequests === 'number' ? pendingPlacementRequests : 0,
        },
        upcomingPlacements,
        recentActivities,
      },
    };

    res.json(responsePayload);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
