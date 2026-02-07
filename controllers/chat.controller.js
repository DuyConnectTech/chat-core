import chatService from '../services/chat.service.js';
import { User } from '../models/index.js';
import { Op } from 'sequelize';
import asyncHandler from '../utils/async-handler.js';

class ChatController {
  /**
   * Render trang chat chính
   */
  renderChatPage = asyncHandler(async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

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
  });

  /**
   * API lấy tin nhắn của một cuộc hội thoại
   */
  getMessages = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const messages = await chatService.getMessages(conversationId);
    res.json(messages);
  });

  /**
   * API bắt đầu chat với một User (Chat 1-1)
   */
  startPrivateChat = asyncHandler(async (req, res) => {
    const userId = req.session.user.id;
    const { targetUserId } = req.body;
    
    const conversation = await chatService.findOrCreatePrivateChat(userId, targetUserId);
    res.json(conversation);
  });

  /**
   * API tạo nhóm chat mới
   */
  createGroup = asyncHandler(async (req, res) => {
    const creatorId = req.session.user.id;
    const { title, memberIds } = req.body;
    
    const conversation = await chatService.createGroupChat(title, creatorId, memberIds);
    res.json(conversation);
  });

  /**
   * API lấy gợi ý từ AI cho cuộc hội thoại
   */
  getAiSuggestion = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const messages = await chatService.getMessages(conversationId, 10);
    
    const context = messages.map(m => `${m.sender?.display_name || 'User'}: ${m.content}`).join('\n');
    
    const geminiService = await import('../services/gemini.service.js').then(m => m.default);
    const suggestion = await geminiService.getSuggestedReply(context);
    res.json({ suggestion });
  });
}

export default new ChatController();