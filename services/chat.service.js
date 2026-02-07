import { Conversation, Message, User, ConversationMember, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

class ChatService {
  /**
   * Lấy danh sách các cuộc hội thoại của User
   */
  async getConversations(userId) {
    return await Conversation.findAll({
      include: [
        {
          model: User,
          where: { id: { [Op.ne]: userId } }, // Lấy thông tin đối phương (cho chat 1-1)
          required: false,
          through: { attributes: [] }
        },
        {
          model: Message,
          as: 'lastMessage',
          include: [{ model: User, as: 'sender', attributes: ['display_name'] }]
        }
      ],
      // Lọc ra các conversation mà user này tham gia
      where: sequelize.literal(`\`Conversation\`.\`id\` IN (SELECT conversation_id FROM conversation_members WHERE user_id = '${userId}')`),
      order: [['updated_at', 'DESC']]
    });
  }

  /**
   * Lấy lịch sử tin nhắn của một cuộc hội thoại
   */
  async getMessages(conversationId, limit = 50) {
    return await Message.findAll({
      where: { conversation_id: conversationId },
      include: [{ model: User, as: 'sender', attributes: ['id', 'display_name', 'avatar_url'] }],
      order: [['created_at', 'ASC']],
      limit: limit
    });
  }

  /**
   * Gửi tin nhắn mới
   */
  async sendMessage({ conversationId, senderId, content, type = 'text' }) {
    const t = await sequelize.transaction();
    try {
      // 1. Tạo tin nhắn
      const message = await Message.create({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        type
      }, { transaction: t });

      // 2. Cập nhật tin nhắn cuối cùng của conversation
      await Conversation.update(
        { last_message_id: message.id },
        { where: { id: conversationId }, transaction: t }
      );

      await t.commit();

      // Lấy thông tin đầy đủ của message sau khi tạo
      return await Message.findByPk(message.id, {
        include: [{ model: User, as: 'sender', attributes: ['id', 'display_name', 'avatar_url'] }]
      });
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Tạo cuộc hội thoại Nhóm (Group Chat)
   */
  async createGroupChat(title, creatorId, memberIds = []) {
    const t = await sequelize.transaction();
    try {
      // 1. Tạo conversation type='group'
      const conversation = await Conversation.create({
        type: 'group',
        title: title
      }, { transaction: t });

      // 2. Thêm người tạo làm admin nhóm
      const members = [
        { conversation_id: conversation.id, user_id: creatorId, role: 'admin' },
        ...memberIds.map(id => ({ conversation_id: conversation.id, user_id: id, role: 'member' }))
      ];

      await ConversationMember.bulkCreate(members, { transaction: t });

      // 3. Tạo tin nhắn hệ thống chào mừng
      await Message.create({
        conversation_id: conversation.id,
        sender_id: creatorId,
        content: `đã tạo nhóm "${title}"`,
        type: 'system'
      }, { transaction: t });

      await t.commit();
      return conversation;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Tìm hoặc Tạo cuộc hội thoại 1-1
   */
  async findOrCreatePrivateChat(userA, userB) {
    // Tìm conversation type='private' mà cả 2 đều là thành viên
    const query = `
      SELECT conversation_id FROM conversation_members 
      WHERE user_id IN ('${userA}', '${userB}')
      GROUP BY conversation_id
      HAVING COUNT(user_id) = 2
    `;
    const [existing] = await sequelize.query(query);

    if (existing.length > 0) {
      // Kiểm tra xem đó có phải là private chat không
      const conv = await Conversation.findOne({
        where: { id: existing[0].conversation_id, type: 'private' }
      });
      if (conv) return conv;
    }

    // Nếu không có, tạo mới
    const t = await sequelize.transaction();
    try {
      const conversation = await Conversation.create({ type: 'private' }, { transaction: t });
      await ConversationMember.bulkCreate([
        { conversation_id: conversation.id, user_id: userA },
        { conversation_id: conversation.id, user_id: userB }
      ], { transaction: t });

      await t.commit();
      return conversation;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }
}

export default new ChatService();
