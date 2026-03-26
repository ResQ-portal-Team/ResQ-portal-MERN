const Message = require('./models/Message');
const ChatRoom = require('./models/ChatRoom');

let io;

const initializeSocket = (server) => {
  io = require('socket.io')(server, {
    cors: { origin: process.env.FRONTEND_URL, credentials: true }
  });

  io.on('connection', (socket) => {
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
    });

    socket.on('send-message', async (data) => {
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

      io.to(data.chatRoomId).emit('receive-message', message);
    });

    socket.on('typing', ({ chatRoomId, userId }) => {
      socket.to(chatRoomId).emit('user-typing', { userId });
    });
  });
};

module.exports = { initializeSocket };