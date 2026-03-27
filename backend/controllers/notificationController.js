const Notification = require('../models/Notification');

// Get user's notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to get notifications' });
  }
};

// Get unread notifications count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      userId: req.user.id, 
      read: false 
    });
    res.json({ success: true, count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
};

// Mark a single notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: req.user.id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Return the notification data for frontend to use
    res.json({ 
      success: true, 
      notification: {
        _id: notification._id,
        type: notification.type,
        itemId: notification.itemId,
        chatRoomId: notification.chatRoomId,
        matchScore: notification.matchScore,
        matchPercentage: notification.matchPercentage,
        matchData: notification.matchData
      }
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: 'Failed to mark all as read' });
  }
};

// 🆕 Get a single notification by ID
exports.getNotificationById = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findOne({
      _id: notificationId,
      userId: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({ message: 'Failed to get notification' });
  }
};

// 🆕 Create notification (updated with match score support)
exports.createNotification = async (userId, type, message, options = {}) => {
  try {
    // Validate required fields
    if (!userId || !type || !message) {
      console.error('Missing required notification fields');
      return null;
    }
    
    const notificationData = {
      userId,
      type,
      message,
      itemId: options.itemId || null,
      chatRoomId: options.chatRoomId || null,
      itemTitle: options.itemTitle || null,
    };
    
    // 🆕 Add match score if provided
    if (options.matchScore !== undefined && options.matchScore !== null) {
      notificationData.matchScore = options.matchScore;
    }
    
    // 🆕 Add match data if provided
    if (options.matchData) {
      notificationData.matchData = {
        score: options.matchData.score,
        commonFeatures: options.matchData.commonFeatures,
        matchedItemId: options.matchData.matchedItemId,
        matchedItemTitle: options.matchData.matchedItemTitle,
        matchedItemImage: options.matchData.matchedItemImage
      };
    }
    
    const notification = new Notification(notificationData);
    await notification.save();
    
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

// 🆕 Delete old notifications (cleanup)
exports.cleanupOldNotifications = async (daysToKeep = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const result = await Notification.deleteMany({
      read: true,
      createdAt: { $lt: cutoffDate }
    });
    
    console.log(`Cleaned up ${result.deletedCount} old notifications`);
    return result;
  } catch (error) {
    console.error('Cleanup notifications error:', error);
    return null;
  }
};