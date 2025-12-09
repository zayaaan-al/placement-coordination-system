const express = require('express');
const Joi = require('joi');
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const markReadSchema = Joi.object({
  notificationIds: Joi.array().items(Joi.string().hex().length(24)).optional(),
  markAll: Joi.boolean().default(false)
});

/**
 * @route   GET /api/v1/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      isRead,
      priority
    } = req.query;

    // Build query
    const query = { userId: req.user._id };
    
    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead === 'true';
    if (priority) query.priority = priority;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.getUnreadCount(req.user._id);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        unreadCount
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', authenticate, async (req, res, next) => {
  try {
    const unreadCount = await Notification.getUnreadCount(req.user._id);

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/notifications/mark-read
 * @desc    Mark notifications as read
 * @access  Private
 */
router.post('/mark-read', authenticate, async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = markReadSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    let result;

    if (value.markAll) {
      // Mark all notifications as read
      result = await Notification.updateMany(
        { userId: req.user._id, isRead: false },
        { isRead: true, readAt: new Date() }
      );
    } else if (value.notificationIds && value.notificationIds.length > 0) {
      // Mark specific notifications as read
      result = await Notification.markMultipleAsRead(req.user._id, value.notificationIds);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either provide notificationIds or set markAll to true'
      });
    }

    res.json({
      success: true,
      message: 'Notifications marked as read',
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/notifications/:id/read
 * @desc    Mark single notification as read
 * @access  Private
 */
router.put('/:id/read', authenticate, async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/v1/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/notifications/recent
 * @desc    Get recent notifications (last 5)
 * @access  Private
 */
router.get('/recent', authenticate, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    const unreadCount = await Notification.getUnreadCount(req.user._id);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
