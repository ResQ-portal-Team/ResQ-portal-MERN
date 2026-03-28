const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const Item = require('../models/Item');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// Get or create chat room (group by user, not by item)
exports.getOrCreateChatRoom = async (req, res) => {
  try {
    const { itemId, matchedUserId } = req.body;
    const currentUserId = req.user.id;
    
    console.log('📡 Creating/Getting chat room:', { itemId, matchedUserId, currentUserId });
    
    // Check if required fields exist
    if (!itemId || !matchedUserId) {
      console.error('❌ Missing required fields:', { itemId, matchedUserId });
      return res.status(400).json({ message: 'Missing required fields: itemId and matchedUserId' });
    }
    
    // 🔥 IMPORTANT: Check if a chat room already exists between these two users
    // (regardless of which item - one chat per user pair)
    let chatRoom = await ChatRoom.findOne({
      'participants.userId': { $all: [currentUserId, matchedUserId] }
    }).populate('participants.userId', 'nickname');

    if (!chatRoom) {
      // Get users
      const currentUser = await User.findById(currentUserId);
      const matchedUser = await User.findById(matchedUserId);
      
      if (!currentUser || !matchedUser) {
        console.error('❌ User not found:', { currentUserExists: !!currentUser, matchedUserExists: !!matchedUser });
        return res.status(404).json({ message: 'User not found' });
      }

      // Create new chat room
      chatRoom = new ChatRoom({
        itemId, // Store the first item that created this chat
        participants: [
          { userId: currentUserId, nickname: currentUser.nickname || 'User' },
          { userId: matchedUserId, nickname: matchedUser.nickname || 'User' }
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
      
      // Populate again after save
      chatRoom = await ChatRoom.findById(chatRoom._id).populate('participants.userId', 'nickname');
    } else {
      // 🔥 Update the itemId to the latest item being discussed (optional)
      // This helps show the most recent item in the chat list
      if (chatRoom.itemId !== itemId) {
        await ChatRoom.findByIdAndUpdate(chatRoom._id, { itemId });
        chatRoom.itemId = itemId;
      }
      console.log('✅ Using existing chat room between users');
    }

    res.json({ success: true, chatRoom });
  } catch (error) {
    console.error('❌ Create chat room error:', error);
    res.status(500).json({ message: error.message || 'Failed to create chat' });
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
    console.error('❌ Get messages error:', error);
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
    console.error('❌ Get user chats error:', error);
    res.status(500).json({ message: 'Failed to get chats' });
  }
};

// Generate OTP
exports.generateOTP = async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const chatRoom = await ChatRoom.findById(chatRoomId);
    const currentItem = await Item.findById(chatRoom.itemId);
    
    // Find the matched item
    let matchedItem = null;
    if (currentItem) {
      matchedItem = await Item.findOne({
        type: currentItem.type === 'lost' ? 'found' : 'lost',
        category: currentItem.category,
        $or: [
          { matchedWith: currentItem._id },
          { _id: currentItem.matchedWith }
        ]
      });
    }
    
    await ChatRoom.findByIdAndUpdate(chatRoomId, {
      status: 'handover',
      handoverOTP: {
        otp,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60000),
        lostItemId: currentItem?.type === 'lost' ? currentItem._id : matchedItem?._id,
        foundItemId: currentItem?.type === 'found' ? currentItem._id : matchedItem?._id
      }
    });

    await Message.create({
      chatRoomId,
      senderNickname: 'System',
      text: `🔐 Handover OTP: ${otp}\n\nShare this OTP with the other person to complete the handover.\nExpires in 15 minutes.`,
      messageType: 'handover_request'
    });

    res.json({ success: true, otp });
  } catch (error) {
    console.error('❌ Generate OTP error:', error);
    res.status(500).json({ message: 'Failed to generate OTP' });
  }
};

// Verify OTP - UPDATED: Only finder gets points, both items returned
exports.verifyOTP = async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    const { otp } = req.body;
    
    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom) {
      return res.status(404).json({ message: 'Chat room not found' });
    }
    
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

    // Get both items
    const currentItem = await Item.findById(chatRoom.itemId);
    const matchedItem = await Item.findOne({
      type: currentItem.type === 'lost' ? 'found' : 'lost',
      category: currentItem.category,
      $or: [
        { matchedWith: currentItem._id },
        { _id: currentItem.matchedWith }
      ]
    });
    
    // 🔥 Mark BOTH items as returned
    let finderId = null;
    let finderItemTitle = null;
    
    if (currentItem) {
      currentItem.status = 'returned';
      await currentItem.save();
      console.log(`✅ Item ${currentItem._id} (${currentItem.type}) marked as returned`);
      
      if (currentItem.type === 'found') {
        finderId = currentItem.postedBy?._id || currentItem.postedBy;
        finderItemTitle = currentItem.title;
      }
    }
    
    if (matchedItem) {
      matchedItem.status = 'returned';
      await matchedItem.save();
      console.log(`✅ Matched item ${matchedItem._id} (${matchedItem.type}) marked as returned`);
      
      if (matchedItem.type === 'found') {
        finderId = matchedItem.postedBy?._id || matchedItem.postedBy;
        finderItemTitle = matchedItem.title;
      }
    }
    
    // 🔥 Give +50 points ONLY to FINDER (who posted the FOUND item)
    if (finderId) {
      await User.findByIdAndUpdate(finderId, { $inc: { trustScore: 50 } });
      console.log(`✅ +50 trust points awarded to finder: ${finderId}`);
      
      // Send notification to finder about points
      await createNotification(
        finderId,
        'item_returned',
        `✅ Item "${finderItemTitle}" successfully returned! You received +50 trust points!`,
        {
          itemId: currentItem?._id || matchedItem?._id,
          itemTitle: finderItemTitle
        }
      );
    }

    // Send system message in chat
    await Message.create({
      chatRoomId,
      senderNickname: 'System',
      text: `✅ Handover complete! Both items marked as returned.\n\n${finderId ? '+50 trust points awarded to the finder!' : 'Handover completed successfully.'}`,
      messageType: 'handover_confirmed'
    });

    res.json({ 
      success: true, 
      message: finderId 
        ? 'Handover complete! +50 trust points awarded to finder.' 
        : 'Handover complete! Items returned successfully.',
      items: [currentItem, matchedItem].filter(i => i)
    });
  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
};