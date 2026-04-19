const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const Item = require('../models/Item');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const { filterProfanity, containsProfanity } = require('../utils/profanityFilter');
const { checkRateLimit } = require('../utils/rateLimiter');
const { emitLeaderboardUpdate } = require('../socketServer');

// Get or create chat room (group by user, not by item)
exports.getOrCreateChatRoom = async (req, res) => {
  try {
    const { itemId, matchedUserId } = req.body;
    const currentUserId = req.user.id;
    
    console.log('📡 Creating/Getting chat room:', { itemId, matchedUserId, currentUserId });
    
    if (!itemId || !matchedUserId) {
      console.error('❌ Missing required fields:', { itemId, matchedUserId });
      return res.status(400).json({ message: 'Missing required fields: itemId and matchedUserId' });
    }
    
    let chatRoom = await ChatRoom.findOne({
      'participants.userId': { $all: [currentUserId, matchedUserId] }
    }).populate('participants.userId', 'nickname');

    if (!chatRoom) {
      const currentUser = await User.findById(currentUserId);
      const matchedUser = await User.findById(matchedUserId);
      
      if (!currentUser || !matchedUser) {
        console.error('❌ User not found:', { currentUserExists: !!currentUser, matchedUserExists: !!matchedUser });
        return res.status(404).json({ message: 'User not found' });
      }

      chatRoom = new ChatRoom({
        itemId,
        participants: [
          { userId: currentUserId, nickname: currentUser.nickname || 'User' },
          { userId: matchedUserId, nickname: matchedUser.nickname || 'User' }
        ],
        initiatedBy: currentUserId,
        status: 'active'
      });
      await chatRoom.save();

      await Message.create({
        chatRoomId: chatRoom._id,
        senderNickname: 'System',
        text: `Chat started. Your identity is protected!`,
        messageType: 'system'
      });
      
      chatRoom = await ChatRoom.findById(chatRoom._id).populate('participants.userId', 'nickname');
    } else {
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

// Verify OTP - UPDATED: Only finder gets points, both items returned, with leaderboard update
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

    const currentItem = await Item.findById(chatRoom.itemId);
    const matchedItem = await Item.findOne({
      type: currentItem.type === 'lost' ? 'found' : 'lost',
      category: currentItem.category,
      $or: [
        { matchedWith: currentItem._id },
        { _id: currentItem.matchedWith }
      ]
    });
    
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
    
    // 🆕 Give points and emit leaderboard update
    if (finderId) {
      const updatedUser = await User.findByIdAndUpdate(
        finderId,
        { $inc: { trustScore: 50 } },
        { new: true }
      );
      console.log(`✅ +50 trust points awarded to finder: ${finderId}`);
      console.log(`📊 New trustScore: ${updatedUser.trustScore}`);
      
      // 🆕 Emit real-time leaderboard update
      emitLeaderboardUpdate(finderId, updatedUser.trustScore);
      
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

// Socket message handler with validations
exports.handleSendMessage = async (socket, data, io) => {
  console.log('📨 Received message:', data);
  
  // 1. Empty message check
  if (!data.text || data.text.trim().length === 0) {
    socket.emit('error', { message: 'Message cannot be empty.' });
    console.log('❌ Empty message blocked');
    return;
  }
  
  // 2. Message length check (max 1000 chars)
  if (data.text.length > 1000) {
    socket.emit('error', { message: 'Message too long. Maximum 1000 characters.' });
    console.log('❌ Message too long blocked');
    return;
  }
  
  // 3. Rate limit check (spam prevention)
  const rateLimit = checkRateLimit(data.senderId, 10, 60000);
  if (!rateLimit.allowed) {
    socket.emit('error', { message: rateLimit.message || 'Too many messages. Please wait.' });
    console.log(`❌ Rate limit exceeded for user ${data.senderId}`);
    return;
  }
  
  // 4. Profanity filter
  const filteredText = filterProfanity(data.text);
  data.text = filteredText;
  
  try {
    const message = await Message.create({
      chatRoomId: data.chatRoomId,
      senderId: data.senderId,
      senderNickname: data.senderNickname,
      text: data.text
    });
    
    const chatRoom = await ChatRoom.findByIdAndUpdate(data.chatRoomId, {
      lastMessage: { text: data.text, senderId: data.senderId, sentAt: new Date() },
      updatedAt: new Date()
    }, { new: true });
    
    if (chatRoom && chatRoom.participants) {
      const otherParticipant = chatRoom.participants.find(p => 
        p.userId.toString() !== data.senderId
      );
      
      if (otherParticipant) {
        await createNotification(
          otherParticipant.userId,
          'new_message',
          `📩 New message from ${data.senderNickname}: "${data.text.slice(0, 50)}${data.text.length > 50 ? '...' : ''}"`,
          {
            chatRoomId: data.chatRoomId,
            itemTitle: 'New message'
          }
        );
        io.emit('new-notification', { userId: otherParticipant.userId });
      }
    }
    
    const populatedMessage = await Message.findById(message._id);
    io.to(data.chatRoomId).emit('receive-message', populatedMessage);
    console.log(`✅ Message broadcast to room ${data.chatRoomId}`);
  } catch (error) {
    console.error('❌ Error saving message:', error);
    socket.emit('error', { message: 'Failed to send message. Please try again.' });
  }
};