import chatService from './chat.service.js';
import { User } from '../models/index.js';

/**
 * Quản lý các sự kiện Socket.io
 */
const webSocketService = (io) => {
  io.on('connection', async (socket) => {
    // 1. Xác thực Socket (Lấy user từ handshake/session)
    // Lưu ý: Trong phiên bản đơn giản này, chúng ta giả định client gửi userId qua auth
    const userId = socket.handshake.auth.userId;
    if (!userId) {
      return socket.disconnect();
    }

    console.log(`🔌 User connected: ${userId} (${socket.id})`);

    // Cập nhật trạng thái online
    await User.update({ is_online: true }, { where: { id: userId } });
    io.emit('user:status', { userId, status: 'online' });

    // 2. Tham gia phòng chat
    socket.on('room:join', (roomId) => {
      socket.join(roomId);
      console.log(`👤 User ${userId} joined room: ${roomId}`);
    });

    // 3. Xử lý gửi tin nhắn
    socket.on('message:send', async (data) => {
      const { conversationId, content, type } = data;
      try {
        const message = await chatService.sendMessage({
          conversationId,
          senderId: userId,
          content,
          type
        });

        // Broadcast tin nhắn tới tất cả mọi người trong phòng (bao gồm cả người gửi)
        io.to(conversationId).emit('message:new', message);
      } catch (error) {
        socket.emit('error', { message: 'Không thể gửi tin nhắn' });
      }
    });

    // 4. Trạng thái đang gõ phím
    socket.on('typing:start', (roomId) => {
      socket.to(roomId).emit('typing:status', { userId, isTyping: true });
    });

    socket.on('typing:stop', (roomId) => {
      socket.to(roomId).emit('typing:status', { userId, isTyping: false });
    });

    // 5. Ngắt kết nối
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${userId}`);
      await User.update({ is_online: false }, { where: { id: userId } });
      io.emit('user:status', { userId, status: 'offline' });
    });
  });
};

export default webSocketService;
