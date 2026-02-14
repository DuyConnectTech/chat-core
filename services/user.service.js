import { User } from '../models/index.js';

class UserService {
  /**
   * Tìm hoặc Tạo mới một User hệ thống (Bot)
   */
  async findOrCreateBotUser() {
    let bot = await User.findOne({ where: { role: 'bot' } });
    if (!bot) {
      bot = await User.create({
        username: 'ai_chatbot',
        email: 'bot@system.local',
        password: 'system_protected_password', // Bot không đăng nhập bằng pass
        display_name: 'AI Chatbot',
        role: 'bot',
        avatar_url: '/images/bot-avatar.png'
      });
    }
    return bot;
  }

  async findById(id) {
    return await User.findByPk(id);
  }
}

export default new UserService();
