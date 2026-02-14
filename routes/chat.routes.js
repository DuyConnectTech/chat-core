import express from 'express';
import chatController from '../controllers/chat.controller.js';
import authenticate from '../middlewares/authenticate.js';
import upload from '../utils/upload.js';

const router = express.Router();

// Tất cả các route chat đều cần authenticate
router.use(authenticate);

// --- Conversations ---
router.get('/conversations', chatController.getConversations);
router.post('/conversations/private', chatController.createPrivateChat);
router.post('/conversations/group', chatController.createGroupChat);
router.get('/conversations/:id/messages', chatController.getMessages);
router.put('/conversations/:id/bot', chatController.toggleBot);
router.post('/conversations/:id/leave', chatController.leaveGroup);
router.delete('/conversations/:id', chatController.deleteGroup);
router.get('/conversations/:id/suggest', chatController.suggestReply);

// --- Messages ---
router.delete('/messages/:id/recall', chatController.recallMessage);
router.delete('/messages/:id/me', chatController.deleteMessageForMe);

// --- Multimedia ---
router.post('/upload', upload.single('file'), chatController.uploadFile);

export default router;
