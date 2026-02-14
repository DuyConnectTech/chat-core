/**
 * Cấu hình Feature Flags
 *
 * Hệ thống chia features thành 2 loại:
 *  - CORE: Tính năng lõi của hệ thống, luôn bật, cấu hình tại đây.
 *          KHÔNG hiển thị trên Admin UI. Không lưu vào DB.
 *  - OPTIONAL: Tính năng mở rộng (add-on), toggle qua Admin UI.
 *          Lưu trong DB (bảng settings), fallback về config nếu chưa có.
 *
 * Thứ tự ưu tiên load:  DB → Config (fallback)
 */

/**
 * Core Features — Tính năng lõi, KHÔNG cho phép tắt qua Admin
 * Sửa trực tiếp file này nếu muốn thay đổi.
 */
export const CORE_FEATURES = {
    feature_registration:   { enabled: true, label: 'Đăng ký tài khoản' },
    feature_private_chat:   { enabled: true, label: 'Chat 1-1' },
    feature_group_chat:     { enabled: true, label: 'Chat nhóm' },
    feature_ai_bot:         { enabled: true, label: 'AI Bot tự động trả lời' },
    feature_ai_suggest:     { enabled: true, label: 'AI gợi ý câu trả lời' },
    feature_multimedia:     { enabled: true, label: 'Upload ảnh/audio' },
    feature_message_recall: { enabled: true, label: 'Thu hồi tin nhắn' },
    feature_message_delete: { enabled: true, label: 'Xóa tin nhắn phía mình' },
};

/**
 * Optional Features — Tính năng tùy chọn, toggle qua Admin UI
 * Giá trị ở đây là DEFAULT khi feature chưa tồn tại trong DB.
 *
 * Ví dụ thêm feature mới:
 *   feature_video_call: { enabled: false, label: 'Gọi video' },
 *   feature_stickers:   { enabled: true,  label: 'Sticker & Emoji' },
 */
export const OPTIONAL_FEATURES = {
    // Thêm features mở rộng ở đây
};

// ─────────────────────────────────────────────────────────
// Cấu hình chi tiết cho từng tính năng
// ─────────────────────────────────────────────────────────

/**
 * Cấu hình Multimedia (Upload ảnh/audio)
 */
export const MULTIMEDIA_CONFIG = {
    // --- Allowed File Types (MIME types) ---
    allowedTypes: {
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        audio: ['audio/mpeg', 'audio/webm', 'audio/ogg', 'audio/wav'],
    },

    // --- Giới hạn kích thước file (bytes) ---
    maxFileSize: {
        image: 5 * 1024 * 1024,   // 5MB
        audio: 10 * 1024 * 1024,  // 10MB
    },

    // --- Thumbnail / Xử lý ảnh ---
    thumbnail: {
        enabled: true,                 // Bật/tắt tạo thumbnail
        maxWidth: 1200,                // Chiều rộng tối đa (px)
        maxHeight: 1200,               // Chiều cao tối đa (px)
        fit: 'inside',                 // 'inside' | 'cover' | 'contain' | 'fill'
        withoutEnlargement: true,      // Không phóng to ảnh nhỏ
        format: 'webp',                // Output format: 'webp' | 'jpeg' | 'png'
        quality: 80,                   // Chất lượng ảnh (1-100)
    },

    // --- Thư mục upload ---
    uploadDir: {
        image:     'uploads/images',
        thumbnail: 'uploads/thumbnails',
        audio:     'uploads/audio',
    },
};
