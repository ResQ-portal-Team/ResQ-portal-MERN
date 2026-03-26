const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const Item = require('../models/Item');
const User = require('../models/User');

// Get or create chat room
exports.getOrCreateChatRoom = async (req, res) => {
  try {
    const { itemId, matchedUserId } = req.body;
    const currentUserId = req.user.id;

    let chatRoom = await ChatRoom.findOne({
      itemId,
      'participants.userId': { $all: [currentUserId, matchedUserId] }
    }).populate('participants.userId', 'nickname');

    if (!chatRoom) {
      const currentUser = await User.findById(currentUserId);
      const matchedUser = await User.findById(matchedUserId);

      chatRoom = new ChatRoom({
        itemId,
        participants: [
          { userId: currentUserId, nickname: currentUser.nickname },
          { userId: matchedUserId, nickname: matchedUser.nickname }
        ],
        initiatedBy: currentUserId,
        status: 'active'
      });
      await chatRoom.save();

      // System message
      await Message.create({
        chatRoomId: chatRoom._id,
        senderNickname: 'System',
        text: `Chat started. Your identity is protected!`,
        messageType: 'system'
      });
    }

    res.json({ success: true, chatRoom });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create chat' });
  }
};

// Get messages
exports.getMessages = async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    const messages = await Message.find({ chatRoomId })
      .sort({ createdAt: 1 });
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get messages' });
  }
};

// Get user's chat rooms
exports.getUserChatRooms = async (req, res) => {
  try {
    const chatRooms = await ChatRoom.find({
      'participants.userId': req.user.id,
      status: { $ne: 'closed' }
    })
    .populate('participants.userId', 'nickname')
    .populate('itemId', 'title image location')
    .sort({ updatedAt: -1 });

    const roomsWithLastMsg = await Promise.all(chatRooms.map(async (room) => {
      const lastMessage = await Message.findOne({ chatRoomId: room._id })
        .sort({ createdAt: -1 });
      const unreadCount = await Message.countDocuments({
        chatRoomId: room._id,
        senderId: { $ne: req.user.id },
        isRead: false
      });
      
      return {
        ...room.toObject(),
        lastMessage,
        unreadCount
      };
    }));

    res.json({ success: true, chatRooms: roomsWithLastMsg });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get chats' });
  }
};

// Generate OTP
exports.generateOTP = async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await ChatRoom.findByIdAndUpdate(chatRoomId, {
      status: 'handover',
      handoverOTP: {
        otp,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60000)
      }
    });

    await Message.create({
      chatRoomId,
      senderNickname: 'System',
      text: `Handover OTP: ${otp}. Valid for 15 minutes.`,
      messageType: 'handover_request'
    });

    res.json({ success: true, otp });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate OTP' });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    const { otp } = req.body;
    
    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom.handoverOTP || chatRoom.handoverOTP.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    
    if (new Date() > chatRoom.handoverOTP.expiresAt) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    chatRoom.handoverOTP.verifiedBy = req.user.id;
    chatRoom.handoverOTP.verifiedAt = new Date();
    chatRoom.status = 'closed';
    await chatRoom.save();

    // Update item and add points
    await Item.findByIdAndUpdate(chatRoom.itemId, { status: 'returned' });
    await User.updateMany(
      { _id: { $in: chatRoom.participants.map(p => p.userId) } },
      { $inc: { trustScore: 50 } }
    );

    await Message.create({
      chatRoomId,
      senderNickname: 'System',
      text: '✅ Handover complete! +50 trust points each.',
      messageType: 'handover_confirmed'
    });

    res.json({ success: true, message: 'Handover complete! +50 points' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
};