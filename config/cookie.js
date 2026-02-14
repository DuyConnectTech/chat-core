import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Cấu hình Cookie chung cho toàn hệ thống
 * Tất cả nơi dùng res.cookie() đều import từ đây
 */
const cookieConfig = {
    /**
     * Refresh Token Cookie
     * HttpOnly: ngăn JS client đọc → chống XSS
     * Secure: chỉ gửi qua HTTPS (production)
     * SameSite: chống CSRF
     */
    refreshToken: {
        httpOnly: true,
        secure: isProduction,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ngày
        sameSite: 'strict',
        path: '/',
    },

    /**
     * Access Token Cookie (nếu cần lưu client-side)
     * KHÔNG httpOnly → JS client cần đọc để gửi qua header
     */
    accessToken: {
        httpOnly: false,
        secure: isProduction,
        maxAge: 60 * 60 * 1000, // 1 giờ
        sameSite: 'strict',
        path: '/',
    },
};

export default cookieConfig;
