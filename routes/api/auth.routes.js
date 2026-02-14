import express from 'express';
import authController from '#controllers/auth.controller.js';
import featureGuard from '#middlewares/featureGuard.js';

const router = express.Router();

router.post('/register', featureGuard('feature_registration'), authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

export default router;
