import express from 'express';
import authenticate from '#middlewares/authenticate.js';
import chatController from '#controllers/chat.controller.js';

const router = express.Router();

// GET / → Trang chat chính (yêu cầu xác thực)
router.get('/', authenticate, chatController.renderChat);

export default router;
