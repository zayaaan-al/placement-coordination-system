const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['job_match', 'evaluation', 'approval', 'test_result', 'general', 'deadline'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  // Related entity references
  relatedEntity: {
    type: {
      type: String,
      enum: ['job', 'evaluation', 'test', 'user']
    },
    id: { type: mongoose.Schema.Types.ObjectId }
  },
  // Action button configuration
  actionButton: {
    text: { type: String, trim: true },
    url: { type: String, trim: true },
    action: { type: String, trim: true }
  },
  // Delivery tracking
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date }
  },
  // Expiry for cleanup
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  
  // TODO: Implement real-time notification via WebSocket
  // TODO: Send email if email channel is enabled
  
  return notification;
};

// Static method to mark multiple notifications as read
notificationSchema.statics.markMultipleAsRead = async function(userId, notificationIds) {
  return this.updateMany(
    { 
      userId, 
      _id: { $in: notificationIds },
      isRead: false 
    },
    { 
      isRead: true, 
      readAt: new Date() 
    }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ userId, isRead: false });
};

module.exports = mongoose.model('Notification', notificationSchema);

