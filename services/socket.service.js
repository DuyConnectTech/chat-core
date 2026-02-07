import chatService from './chat.service.js';
import { User, Conversation } from '../models/index.js';
import userService from './user.service.js';
import geminiService from './gemini.service.js';

/**
 * Quản lý các sự kiện Socket.io
 */
const webSocketService = (io) => {
  io.on('connection', async (socket) => {
    // 1. Xác thực Socket
    const userId = socket.handshake.auth.userId;
    if (!userId) return socket.disconnect();

    console.log(`🔌 User connected: ${userId}`);
    await User.update({ is_online: true }, { where: { id: userId } });
    io.emit('user:status', { userId, status: 'online' });

    // 2. Tham gia phòng chat
    socket.on('room:join', (roomId) => {
      socket.join(roomId);
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

        // Broadcast tin nhắn tới mọi người
        io.to(conversationId).emit('message:new', message);

        // --- Logic AI Bot tự động ---
        const conversation = await Conversation.findByPk(conversationId);
        if (conversation.is_bot_active && type === 'text') {
          handleBotReply(io, conversationId);
        }
      } catch (error) {
        socket.emit('error', { message: 'Không thể gửi tin nhắn' });
      }
    });

    // 4. Thu hồi tin nhắn
    socket.on('message:recall', (data) => {
      const { conversationId, messageId } = data;
      io.to(conversationId).emit('message:recalled', { messageId });
    });

    // 5. Trạng thái đang gõ phím
    socket.on('typing:start', (roomId) => {
      socket.to(roomId).emit('typing:status', { userId, isTyping: true });
    });

    socket.on('typing:stop', (roomId) => {
      socket.to(roomId).emit('typing:status', { userId, isTyping: false });
    });

    socket.on('disconnect', async () => {
      await User.update({ is_online: false }, { where: { id: userId } });
      io.emit('user:status', { userId, status: 'offline' });
    });
  });
};

/**
 * Hàm xử lý Bot trả lời
 */
async function handleBotReply(io, conversationId) {
  try {
    const botUser = await userService.findOrCreateBotUser();
    
    // Giả lập Bot đang gõ
    io.to(conversationId).emit('typing:status', { userId: botUser.id, isTyping: true });

    // Lấy ngữ cảnh 10 tin nhắn gần nhất
    const messages = await chatService.getMessages(conversationId, 10);
    const context = messages.map(m => `${m.sender?.display_name || 'User'}: ${m.content}`).join('\n');

    // Gọi Gemini
    const replyContent = await geminiService.getSuggestedReply(context);

    // Lưu và gửi tin nhắn Bot
    const botMessage = await chatService.sendMessage({
      conversationId,
      senderId: botUser.id,
      content: replyContent,
      type: 'ai'
    });

    // Dừng gõ và gửi tin
    setTimeout(() => {
      io.to(conversationId).emit('typing:status', { userId: botUser.id, isTyping: false });
      io.to(conversationId).emit('message:new', botMessage);
    }, 1000); // Delay một chút cho thật

  } catch (error) {
    console.error('Lỗi Bot trả lời:', error);
  }
}

export default webSocketService;
