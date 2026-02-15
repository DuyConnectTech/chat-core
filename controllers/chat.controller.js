import chatService from '#services/chat.service.js';
import { User, Conversation } from '#models/index.js';
import { Op } from 'sequelize';
import asyncHandler from '#utils/async-handler.js';
import geminiService from '#services/gemini.service.js';
import featureService from '#services/feature.service.js';
import { MULTIMEDIA_CONFIG } from '#config/features.js';
import { generateThumbnail } from '#utils/thumbnail.js';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ROOT_DIR } from '#utils/path.js';
import socketService from '#services/socket.service.js';

class ChatController {
  /**
   * API xử lý upload file với logic phân loại folder và tối ưu hóa
   */
  uploadFile = asyncHandler(async (req, res) => {
    if (!req.file) throw new Error('Không có file nào được tải lên');

    const { mimetype, originalname, buffer } = req.file;
    const { allowedTypes, uploadDir } = MULTIMEDIA_CONFIG;

    // Detect file type based on Config (image, audio...)
    let fileType = 'other';
    for (const [type, mimeList] of Object.entries(allowedTypes)) {
      if (mimeList.includes(mimetype) || mimetype.startsWith(`${type}/`)) {
        fileType = type;
        break;
      }
    }

    // Fallback: Check extension if mimetype is generic
    if (fileType === 'other') {
      const ext = path.extname(originalname).toLowerCase();
      if (['.mp3', '.wav', '.ogg', '.webm'].includes(ext)) fileType = 'audio';
      else if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) fileType = 'image';
    }

    const ext = path.extname(originalname).toLowerCase();
    const name = path.basename(originalname, ext);
    // Sanitize name: remove special chars, replace spaces with dashes
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
    const filename = `${cleanName}-${Date.now()}${ext}`;

    // Process based on Type  
    if (fileType === 'image') {
      const result = await generateThumbnail(buffer, filename);
      return res.json({
        success: true,
        url: result.thumbnailUrl || result.originalUrl,
        originalUrl: result.originalUrl,
        thumbnailUrl: result.thumbnailUrl,
        mimetype,
        filename
      });
    }

    // Audio & Others handling
    const folder = uploadDir[fileType] || 'uploads/others';
    const uploadPath = path.join(ROOT_DIR, 'public', folder, filename);

    await fs.mkdir(path.dirname(uploadPath), { recursive: true });
    await fs.writeFile(uploadPath, buffer);

    res.json({
      success: true,
      url: `/${folder}/${filename}`,
      mimetype,
      filename
    });
  });

  /**
   * Render trang chat chính
   * @method GET /chat
   */
  renderChat = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const conversations = await chatService.getConversations(userId);

    const otherUsers = await User.findAll({
      where: { id: { [Op.ne]: userId }, role: { [Op.ne]: 'bot' } },
      limit: 10
    });

    // Lấy feature flags để truyền vào frontend
    const features = await featureService.getAllFeatures();
    const featureFlags = {};
    features.forEach(f => { featureFlags[f.key] = f.enabled; });

    res.render('pages/chat', {
      title: 'Chat Room',
      user: req.user,
      conversations,
      otherUsers,
      featureFlags
    });
  });

  /**
   * API lấy danh sách hội thoại
   * @method GET /api/conversations
   */
  getConversations = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const conversations = await chatService.getConversations(userId);
    res.json(conversations);
  });

  /**
   * API lấy tin nhắn của một cuộc hội thoại
   * @method GET /api/conversations/:id/messages
   */
  getMessages = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { limit, beforeId } = req.query;
    const messages = await chatService.getMessages(id, limit, beforeId);
    res.json(messages);
  });

  /**
   * API bắt đầu chat với một User (Chat 1-1)
   * @method POST /api/conversations/private
   */
  createPrivateChat = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { targetUserId } = req.body;
    const conversation = await chatService.findOrCreatePrivateChat(userId, targetUserId);
    
    // Notify users
    socketService.notifyNewConversation(conversation, [userId, targetUserId]);
    
    res.json(conversation);
  });

  /**
   * API tạo nhóm chat mới
   * @method POST /api/conversations/group
   */
  createGroupChat = asyncHandler(async (req, res) => {
    const creatorId = req.user.id;
    const { title, memberIds } = req.body;
    const conversation = await chatService.createGroupChat(title, creatorId, memberIds);
    
    // Notify users (creator + members)
    const allMembers = [creatorId, ...memberIds];
    socketService.notifyNewConversation(conversation, allMembers);
    
    res.json(conversation);
  });

  /**
   * API Bật/Tắt Bot AI
   * @method POST /api/conversations/:id/bot
   */
  toggleBot = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { active } = req.body;
    await chatService.toggleBot(id, active);
    res.json({ success: true, is_bot_active: active });
  });

  /**
   * API Rời khỏi nhóm
   * @method POST /api/conversations/:id/leave
   */
  leaveGroup = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    await chatService.leaveGroup(id, userId);
    res.json({ success: true });
  });

  /**
   * API Xóa nhóm (Chỉ Owner)
   * @method DELETE /api/conversations/:id
   */
  deleteGroup = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    await chatService.deleteGroup(id, userId);
    res.json({ success: true });
  });

  /**
   * API Thu hồi tin nhắn
   * @method POST /api/messages/:id/recall
   */
  recallMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const message = await chatService.recallMessage(id, userId);
    res.json({ success: true, message });
  });

  /**
   * API Xóa tin nhắn phía mình
   * @method DELETE /api/messages/:id/me
   */
  deleteMessageForMe = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    await chatService.deleteMessageForMe(id, userId);
    res.json({ success: true });
  });

  /**
   * API Gợi ý trả lời bằng AI
   * @method POST /api/conversations/:id/suggest-reply
   */
  suggestReply = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const messages = await chatService.getMessages(id, 10);
    const context = messages.map(m => `${m.sender?.display_name || 'User'}: ${m.content}`).join('\n');
    const suggestion = await geminiService.generateReply(context, []);
    res.json({ suggestion });
  });

  /**
   * API Đánh dấu hội thoại đã đọc
   * @method POST /api/conversations/:id/read
   */
  markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    await chatService.markConversationAsRead(id, userId);
    res.json({ success: true });
  });

  /**
   * API Render Sidebar (cho frontend refresh)
   * @method GET /api/chat/partials/sidebar
   */
  renderSidebar = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const conversations = await chatService.getConversations(userId);
    const features = await featureService.getAllFeatures();
    const featureFlags = {};
    features.forEach(f => { featureFlags[f.key] = f.enabled; });

    res.render('partials/chat/sidebar', {
      conversations,
      featureFlags
    });
  });
}

export default new ChatController();