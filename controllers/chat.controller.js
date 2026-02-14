import chatService from '../services/chat.service.js';
import { User, Conversation } from '../models/index.js';
import { Op } from 'sequelize';
import asyncHandler from '../utils/async-handler.js';
import geminiService from '../services/gemini.service.js';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ROOT_DIR } from '../utils/path.js';

class ChatController {
  /**
   * API xử lý upload file với logic phân loại folder và tối ưu hóa
   */
  uploadFile = asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new Error('Không có file nào được tải lên');
    }

    const { mimetype, originalname, buffer } = req.file;
    const ext = path.extname(originalname).toLowerCase();
    
    // Khôi phục logic phân loại folder của bro
    let folder = 'others';
    const isImage = mimetype.startsWith('image/');
    const isAudio = mimetype.startsWith('audio/') || originalname.endsWith('.webm') || originalname.endsWith('.mp3');

    if (isImage) {
      folder = 'images';
    } else if (isAudio) {
      folder = 'audio';
    }

    // Tên file mới (UUID)
    const filename = `${uuidv4()}${isImage ? '.webp' : ext}`;
    const uploadPath = path.join(ROOT_DIR, 'public', 'uploads', folder, filename);

    // Đảm bảo thư mục tồn tại
    await fs.mkdir(path.dirname(uploadPath), { recursive: true });

    if (isImage) {
      // Tối ưu hóa ảnh sang WebP
      await sharp(buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(uploadPath);
    } else {
      // Lưu file khác (audio, others) nguyên bản
      await fs.writeFile(uploadPath, buffer);
    }

    res.json({
      success: true,
      url: `/uploads/${folder}/${filename}`,
      mimetype: isImage ? 'image/webp' : mimetype,
      filename: filename
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

    res.render('pages/chat', {
      title: 'Chat Room',
      user: req.user,
      conversations,
      otherUsers
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
}

export default new ChatController();