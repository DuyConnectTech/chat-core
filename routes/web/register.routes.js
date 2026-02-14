import express from 'express';
import authController from '#controllers/auth.controller.js';
import featureGuard from '#middlewares/featureGuard.js';

const router = express.Router();

// GET /register → Trang đăng ký (có feature guard)
router.get('/', featureGuard('feature_registration'), authController.renderRegister);

export default router;
