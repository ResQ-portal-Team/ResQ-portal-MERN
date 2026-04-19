const Message = require('./models/Message');
const ChatRoom = require('./models/ChatRoom');
const Notification = require('./models/Notification');
const { filterProfanity, containsProfanity } = require('./utils/profanityFilter');
const { checkRateLimit } = require('./utils/rateLimiter');

let io;

const initializeSocket = (server) => {
  io = require('socket.io')(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);

    socket.on('user-online', ({ chatRoomId, userId }) => {
      onlineUsers.set(socket.id, userId);
      socket.userId = userId;
      socket.join(chatRoomId);
      console.log(`📡 User ${userId} joined room ${chatRoomId}`);
      socket.to(chatRoomId).emit('user-joined', { userId });
    });

    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`📡 Socket ${socket.id} joined room: ${roomId}`);
    });

    socket.on('send-message', async (data) => {
      console.log('📨 Received message:', data);
      
      // ========== VALIDATIONS ==========
      
      if (!data.text || data.text.trim().length === 0) {
        socket.emit('error', { message: 'Message cannot be empty.' });
        console.log('❌ Empty message blocked');
        return;
      }
      
      if (data.text.length > 1000) {
        socket.emit('error', { message: 'Message too long. Maximum 1000 characters.' });
        console.log('❌ Message too long blocked');
        return;
      }
      
      const rateLimit = checkRateLimit(data.senderId, 10, 60000);
      if (!rateLimit.allowed) {
        socket.emit('error', { message: rateLimit.message || 'Too many messages. Please wait.' });
        console.log(`❌ Rate limit exceeded for user ${data.senderId}`);
        return;
      }
      
      const filteredText = filterProfanity(data.text);
      console.log(`🔍 Original: "${data.text}" → Filtered: "${filteredText}"`);
      data.text = filteredText;
      
      // ========== END VALIDATIONS ==========
      
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
            await Notification.create({
              userId: otherParticipant.userId,
              type: 'new_message',
              message: `📩 New message from ${data.senderNickname}: "${data.text.slice(0, 50)}${data.text.length > 50 ? '...' : ''}"`,
              chatRoomId: data.chatRoomId,
              itemTitle: 'New message',
              read: false
            });
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
    });

    socket.on('typing', ({ chatRoomId, userId }) => {
      socket.to(chatRoomId).emit('user-typing', { userId });
    });

    socket.on('stop-typing', ({ chatRoomId }) => {
      socket.to(chatRoomId).emit('user-stop-typing');
    });

    socket.on('disconnect', () => {
      const userId = onlineUsers.get(socket.id);
      console.log('🔌 Client disconnected:', socket.id, 'User:', userId);
      socket.rooms.forEach(room => {
        if (room !== socket.id) {
          socket.to(room).emit('user-left', { userId });
        }
      });
      onlineUsers.delete(socket.id);
    });
  });
  
  console.log('✅ Socket.IO server initialized');
};

// Get io instance
const getIO = () => {
  if (!io) {
    console.log('⚠️ Socket.io not initialized yet');
  }
  return io;
};

// 🆕 Emit leaderboard update to all clients
const emitLeaderboardUpdate = (userId, newTrustScore) => {
  if (io) {
    io.emit('leaderboard-update', { 
      userId, 
      newTrustScore,
      timestamp: new Date().toISOString()
    });
    console.log(`📊 Leaderboard update emitted for user ${userId} → ${newTrustScore} points`);
  }
};

module.exports = { initializeSocket, getIO, emitLeaderboardUpdate };