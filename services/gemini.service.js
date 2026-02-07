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
        ${historyContext}
        
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
