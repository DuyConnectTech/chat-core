import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ROOT_DIR } from './path.js';

// Cấu hình nơi lưu trữ
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'public/uploads/';
    if (file.mimetype.startsWith('image/')) {
      folder += 'images';
    } else if (file.mimetype.startsWith('audio/') || file.originalname.endsWith('.webm') || file.originalname.endsWith('.mp3')) {
      folder += 'audio';
    } else {
      folder += 'others';
    }
    cb(null, path.join(ROOT_DIR, folder));
  },
  filename: (req, file, cb) => {
    // Giữ nguyên extension, đặt tên bằng UUID để tránh trùng lặp
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

// Bộ lọc file
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'audio/webm', 'audio/ogg', 'audio/wav'];
  if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Định dạng file không hỗ trợ'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Giới hạn 10MB
  }
});

export default upload;
