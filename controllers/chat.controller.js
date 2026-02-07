import chatService from '../services/chat.service.js';
import { User, Conversation } from '../models/index.js';
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
      where: { id: { [Op.ne]: userId }, role: { [Op.ne]: 'bot' } },
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

  /**
   * API xử lý upload file (Image/Audio)
   */
  uploadFile = asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new Error('Không có file nào được tải lên');
    }

    const folder = req.file.mimetype.startsWith('image/') ? 'images' : 'audio';
    const fileUrl = `/uploads/${folder}/${req.file.filename}`;

    res.json({
      url: fileUrl,
      mimetype: req.file.mimetype,
      filename: req.file.originalname
    });
  });

  /**
   * API Thu hồi tin nhắn
   */
  recallMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const userId = req.session.user.id;
    const message = await chatService.recallMessage(messageId, userId);
    res.json({ success: true, message });
  });

  /**
   * API Xóa tin nhắn phía mình
   */
  deleteMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const userId = req.session.user.id;
    await chatService.deleteMessageForMe(messageId, userId);
    res.json({ success: true });
  });

  /**
   * API Rời khỏi nhóm
   */
  leaveGroup = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.session.user.id;
    await chatService.leaveGroup(conversationId, userId);
    res.json({ success: true });
  });

  /**
   * API Xóa nhóm (Chỉ Owner)
   */
  deleteGroup = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.session.user.id;
    await chatService.deleteGroup(conversationId, userId);
    res.json({ success: true });
  });

  /**
   * API Bật/Tắt Bot AI cho cuộc hội thoại
   */
  toggleBot = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { active } = req.body;
    
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) throw new Error('Cuộc hội thoại không tồn tại');
    
    await conversation.update({ is_bot_active: active });
    res.json({ success: true, is_bot_active: active });
  });
}

export default new ChatController();