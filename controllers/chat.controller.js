import chatService from '../services/chat.service.js';
import { User } from '../models/index.js';
import { Op } from 'sequelize';

class ChatController {
  /**
   * Render trang chat chính
   */
  async renderChatPage(req, res) {
    if (!req.session.user) return res.redirect('/login');

    try {
      const userId = req.session.user.id;
      const conversations = await chatService.getConversations(userId);
      
      // Lấy danh sách user khác để có thể bắt đầu chat mới
      const otherUsers = await User.findAll({
        where: { id: { [Op.ne]: userId } },
        limit: 10
      });

      res.render('pages/chat', {
        title: 'Chat Room',
        user: req.session.user,
        conversations,
        otherUsers
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Lỗi máy chủ');
    }
  }

  /**
   * API lấy tin nhắn của một cuộc hội thoại
   */
  async getMessages(req, res) {
    try {
      const { conversationId } = req.params;
      const messages = await chatService.getMessages(conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * API bắt đầu chat với một User (Chat 1-1)
   */
  async startPrivateChat(req, res) {
    try {
      const userId = req.session.user.id;
      const { targetUserId } = req.body;
      
      const conversation = await chatService.findOrCreatePrivateChat(userId, targetUserId);
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * API tạo nhóm chat mới
   */
  async createGroup(req, res) {
    try {
      const creatorId = req.session.user.id;
      const { title, memberIds } = req.body;
      
      const conversation = await chatService.createGroupChat(title, creatorId, memberIds);
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new ChatController();