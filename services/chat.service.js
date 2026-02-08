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
   * Lấy lịch sử tin nhắn của một cuộc hội thoại (Hỗ trợ Lazy Loading)
   */
  async getMessages(conversationId, limit = 20, beforeId = null) {
    const where = { conversation_id: conversationId };
    
    if (beforeId) {
      const anchor = await Message.findByPk(beforeId);
      if (anchor) {
        where.created_at = { [Op.lt]: anchor.created_at };
      }
    }

    return await Message.findAll({
      where,
      include: [{ model: User, as: 'sender', attributes: ['id', 'display_name', 'avatar_url'] }],
      order: [['created_at', 'DESC']], // Lấy tin nhắn mới nhất trước
      limit: parseInt(limit)
    }).then(messages => messages.reverse()); // Sau đó đảo ngược lại để hiển thị đúng thứ tự thời gian
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

  /**
   * Thu hồi tin nhắn (Chỉ người gửi mới được thu hồi)
   */
  async recallMessage(messageId, userId) {
    const message = await Message.findByPk(messageId);
    if (!message) throw new Error('Tin nhắn không tồn tại');
    if (message.sender_id !== userId) throw new Error('Bạn không có quyền thu hồi tin nhắn này');

    // Kiểm tra thời gian (Ví dụ: cho phép thu hồi trong vòng 10 phút)
    const diff = (new Date() - new Date(message.created_at)) / 1000 / 60;
    if (diff > 10) throw new Error('Đã quá thời gian cho phép thu hồi (10 phút)');

    await message.update({ is_recalled: true });
    return message;
  }

  /**
   * Xóa tin nhắn phía mình
   */
  async deleteMessageForMe(messageId, userId) {
    const message = await Message.findByPk(messageId);
    if (!message) throw new Error('Tin nhắn không tồn tại');

    let deletedFor = message.deleted_for || [];
    if (!deletedFor.includes(userId)) {
      deletedFor.push(userId);
      await message.update({ deleted_for: deletedFor });
    }
    return true;
  }

  /**
   * Rời khỏi nhóm
   */
  async leaveGroup(conversationId, userId) {
    const member = await ConversationMember.findOne({
      where: { conversation_id: conversationId, user_id: userId }
    });

    if (!member) throw new Error('Bạn không phải thành viên của nhóm này');

    const conversation = await Conversation.findByPk(conversationId);
    
    const t = await sequelize.transaction();
    try {
      // 1. Xóa thành viên
      await member.destroy({ transaction: t });

      // 2. Nếu là Owner rời nhóm, chuyển quyền cho thành viên lâu nhất
      if (conversation.owner_id === userId) {
        const nextOwner = await ConversationMember.findOne({
          where: { conversation_id: conversationId },
          order: [['joined_at', 'ASC']],
          transaction: t
        });

        if (nextOwner) {
          await conversation.update({ owner_id: nextOwner.user_id }, { transaction: t });
          await nextOwner.update({ role: 'admin' }, { transaction: t });
        } else {
          // Không còn ai trong nhóm -> Xóa nhóm
          await conversation.destroy({ transaction: t });
        }
      }

      // 3. Tạo tin nhắn hệ thống
      const user = await User.findByPk(userId);
      await Message.create({
        conversation_id: conversationId,
        sender_id: userId,
        content: `đã rời khỏi nhóm`,
        type: 'system'
      }, { transaction: t });

      await t.commit();
      return true;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Lấy chi tiết một cuộc hội thoại
   */
  async getConversationDetail(conversationId) {
    return await Conversation.findByPk(conversationId, {
      include: [{ model: User, through: { attributes: ['role'] } }]
    });
  }

  /**
   * Bật/Tắt Bot trong cuộc hội thoại
   */
  async toggleBot(conversationId, active) {
    return await Conversation.update(
      { is_bot_active: active },
      { where: { id: conversationId } }
    );
  }

  /**
   * Xóa toàn bộ nhóm (Chỉ Owner)
   */
  async deleteGroup(conversationId, userId) {
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) throw new Error('Cuộc hội thoại không tồn tại');
    if (conversation.type !== 'group') throw new Error('Đây không phải là nhóm');
    if (conversation.owner_id !== userId) throw new Error('Chỉ chủ nhóm mới có quyền giải tán nhóm');

    await conversation.destroy(); // ON DELETE CASCADE sẽ tự xóa members và messages
    return true;
  }
}

export default new ChatService();
