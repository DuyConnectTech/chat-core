import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

class GeminiService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: process.env.MODEL_AI || 'gemini-2.5-flash' });
    } else {
      console.warn('⚠️ Gemini API Key chưa được cấu hình hoặc đang để mặc định.');
    }
    const limitHistory = process.env.LIMIT_HISTORY_CHAT || '5';
    this.limitHistory = parseInt(limitHistory, 10);
  }

  /**
   * Tạo câu trả lời tự động từ Bot
   * @param {string} userContent - Nội dung tin nhắn mới nhất của người dùng
   * @param {Array} history - Danh sách các tin nhắn trước đó
   */
  async generateReply(userContent, history = []) {
    if (!this.model) {
      return 'AI chưa được cấu hình.';
    }

    try {
      const historyContext = history
        .map(m => `${m.sender?.display_name || 'User'}: ${m.content}`)
        .join('\n');

      const prompt = `
        Bạn là một trợ lý AI thông minh trong một ứng dụng Chat.
        Hãy trả lời tin nhắn của người dùng một cách tự nhiên, hữu ích và thân thiện.
        
        Lịch sử cuộc trò chuyện:
        ${historyContext}
        
        Tin nhắn mới nhất từ người dùng: "${userContent}"
        
        Hãy đưa ra câu trả lời trực tiếp cho người dùng.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Lỗi Gemini (generateReply):', error);
      return 'Xin lỗi, tôi gặp trục trặc kỹ thuật và không thể trả lời ngay bây giờ.';
    }
  }

  /**
   * Gợi ý câu trả lời dựa trên lịch sử chat
   * @param {string} historyContext - Chuỗi văn bản chứa lịch sử chat
   * @returns {Promise<string>} Câu trả lời gợi ý
   */
  async getSuggestedReply(historyContext) {
    if (!this.model) {
      return 'AI chưa được cấu hình. Vui lòng kiểm tra API Key.';
    }

    try {
      const prompt = `
        Bạn là một trợ lý hỗ trợ khách hàng chuyên nghiệp. 
        Dưới đây là lịch sử cuộc trò chuyện giữa Khách hàng và Admin.
        Hãy gợi ý một câu trả lời ngắn gọn, lịch sự và phù hợp cho Admin.
        
        Lịch sử:
        ${historyContext.slice(-this.limitHistory)}
        
        Chỉ trả về nội dung câu trả lời, không thêm lời dẫn.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Lỗi Gemini:', error);
      return 'Không thể tạo gợi ý lúc này.';
    }
  }
}

export default new GeminiService();
