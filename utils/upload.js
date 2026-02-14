import multer from 'multer';
import { MULTIMEDIA_CONFIG } from '../config/features.js';

/**
 * Bộ lọc file: Kiểm tra MIME type dựa trên config
 */
const fileFilter = (req, file, cb) => {
  const { image, audio } = MULTIMEDIA_CONFIG.allowedTypes;
  const allAllowed = [...image, ...audio];

  if (allAllowed.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Định dạng file không hỗ trợ'), false);
  }
};

/**
 * Sử dụng Memory Storage để có buffer xử lý bằng Sharp
 */
const storage = multer.memoryStorage();

// Lấy giới hạn kích thước lớn nhất giữa image và audio
const maxFileSize = Math.max(
  MULTIMEDIA_CONFIG.maxFileSize.image,
  MULTIMEDIA_CONFIG.maxFileSize.audio
);

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSize,
  },
});

export default upload;
