import express from 'express';
import authController from '#controllers/auth.controller.js';

const router = express.Router();

// GET /logout → Xử lý đăng xuất
router.get('/', authController.logout);

export default router;
