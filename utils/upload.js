import multer from 'multer';

/**
 * Bộ lọc file: Giữ nguyên logic bảo mật của bro
 */
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 
    'audio/mpeg', 'audio/webm', 'audio/ogg', 'audio/wav'
  ];
  
  // Khôi phục logic check mimetype và startWith audio/
  if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Định dạng file không hỗ trợ'), false);
  }
};

/**
 * Sử dụng Memory Storage để có buffer xử lý bằng Sharp
 */
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

export default upload;
