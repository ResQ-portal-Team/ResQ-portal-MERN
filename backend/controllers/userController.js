const User = require('../models/User');
const Item = require('../models/Item');
const ChatRoom = require('../models/ChatRoom');

// Get leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const { time } = req.query;
    let dateFilter = {};
    
    // Apply time filter
    if (time === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (time === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { createdAt: { $gte: monthAgo } };
    }
    
    // Get top 50 users by trust score
    const users = await User.find({ role: 'user' })
      .sort({ trustScore: -1 })
      .limit(50)
      .select('nickname realName trustScore');
    
    // For each user, get additional stats
    const usersWithStats = await Promise.all(users.map(async (user) => {
      // Count items found (found items that were returned)
      const itemsFound = await Item.countDocuments({ 
        postedBy: user._id, 
        type: 'found',
        status: 'returned'
      });
      
      // Count items lost (lost items that were returned)
      const itemsLost = await Item.countDocuments({ 
        postedBy: user._id, 
        type: 'lost',
        status: 'returned'
      });
      
      // Count successful handovers
      const successfulHandovers = await ChatRoom.countDocuments({
        'participants.userId': user._id,
        status: 'closed'
      });
      
      return {
        ...user.toObject(),
        itemsFound,
        itemsLost,
        itemsReturned: itemsFound + itemsLost,
        successfulHandovers
      };
    }));
    
    res.json({ success: true, users: usersWithStats });
  } catch (error) {
    console.error('❌ Get leaderboard error:', error);
    res.status(500).json({ message: 'Failed to get leaderboard' });
  }
};

// Get user profile (optional)
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
};

// Update user profile (optional)
exports.updateUserProfile = async (req, res) => {
  try {
    const { nickname } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (nickname) user.nickname = nickname;
    
    await user.save();
    
    res.json({ success: true, user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};