const Message = require('./models/Message');
const ChatRoom = require('./models/ChatRoom');
const Notification = require('./models/Notification');

let io;

const initializeSocket = (server) => {
  io = require('socket.io')(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  // Store connected users
  const onlineUsers = new Map(); // socketId -> userId

  io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);

    // 🔥 User comes online
    socket.on('user-online', ({ chatRoomId, userId }) => {
      onlineUsers.set(socket.id, userId);
      socket.userId = userId;
      socket.join(chatRoomId);
      console.log(`📡 User ${userId} joined room ${chatRoomId}`);
      
      // Notify others in the room that user is online
      socket.to(chatRoomId).emit('user-joined', { userId });
    });

    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`📡 Socket ${socket.id} joined room: ${roomId}`);
    });

    socket.on('send-message', async (data) => {
      console.log('📨 Received message:', data);
      
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

        // Create notification for other participant
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
      }
    });

    socket.on('typing', ({ chatRoomId, userId }) => {
      socket.to(chatRoomId).emit('user-typing', { userId });
    });

    socket.on('stop-typing', ({ chatRoomId }) => {
      socket.to(chatRoomId).emit('user-stop-typing');
    });

    // 🔥 User disconnects
    socket.on('disconnect', () => {
      const userId = onlineUsers.get(socket.id);
      console.log('🔌 Client disconnected:', socket.id, 'User:', userId);
      
      // Notify all rooms this user was in that they left
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

module.exports = { initializeSocket };