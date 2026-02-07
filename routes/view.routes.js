import express from 'express';
import authController from '../controllers/auth.controller.js';
import chatController from '../controllers/chat.controller.js';

const router = express.Router();

// Auth Routes
router.get('/login', authController.renderLogin);
router.post('/login', authController.login);

router.get('/register', authController.renderRegister);
router.post('/register', authController.register);

router.get('/logout', authController.logout);

// Chat Page
router.get('/chat', chatController.renderChatPage);

// API Routes
router.get('/api/conversations/:conversationId/messages', chatController.getMessages);
router.post('/api/conversations/private', chatController.startPrivateChat);
router.post('/api/conversations/group', chatController.createGroup);
router.get('/api/conversations/:conversationId/suggest', chatController.getAiSuggestion);

// Home route
router.get('/', (req, res) => {
  res.redirect('/login');
});

export default router;
