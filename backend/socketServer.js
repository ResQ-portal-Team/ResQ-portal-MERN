const Message = require('./models/Message');
const ChatRoom = require('./models/ChatRoom');

let io;

const initializeSocket = (server) => {
  io = require('socket.io')(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);

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

        await ChatRoom.findByIdAndUpdate(data.chatRoomId, {
          lastMessage: { text: data.text, senderId: data.senderId, sentAt: new Date() },
          updatedAt: new Date()
        });

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

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });
  
  console.log('✅ Socket.IO server initialized');
};

module.exports = { initializeSocket };