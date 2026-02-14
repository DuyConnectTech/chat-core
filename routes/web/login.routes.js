import express from 'express';
import authController from '#controllers/auth.controller.js';

const router = express.Router();

// GET /login → Trang đăng nhập
router.get('/', authController.renderLogin);

export default router;
