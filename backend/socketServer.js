const Message = require('./models/Message');
const ChatRoom = require('./models/ChatRoom');
const Notification = require('./models/Notification'); // 🆕 Added

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
        // Save message
        const message = await Message.create({
          chatRoomId: data.chatRoomId,
          senderId: data.senderId,
          senderNickname: data.senderNickname,
          text: data.text
        });

        // Update chat room
        const chatRoom = await ChatRoom.findByIdAndUpdate(data.chatRoomId, {
          lastMessage: { text: data.text, senderId: data.senderId, sentAt: new Date() },
          updatedAt: new Date()
        }, { new: true });

        // 🆕 Create notification for the other participant
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
            console.log(`📧 Notification created for user: ${otherParticipant.userId}`);
            
            // 🆕 Emit event to refresh notifications for the other user
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

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });
  
  console.log('✅ Socket.IO server initialized');
};

module.exports = { initializeSocket };