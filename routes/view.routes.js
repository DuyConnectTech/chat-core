import express from 'express';
import authController from '../controllers/auth.controller.js';
import chatController from '../controllers/chat.controller.js';
import authenticate from '../middlewares/authenticate.js';

const router = express.Router();

// --- Public Routes ---
router.get('/login', authController.renderLogin);
router.get('/register', authController.renderRegister);

// --- Private Routes (Yêu cầu xác thực) ---
router.get('/', authenticate, chatController.renderChat);
router.get('/logout', authController.logout); // API xử lý logout đồng thời

export default router;