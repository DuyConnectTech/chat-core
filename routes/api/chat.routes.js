import express from 'express';
import chatController from '#controllers/chat.controller.js';
import authenticate from '#middlewares/authenticate.js';
import featureGuard from '#middlewares/featureGuard.js';
import upload from '#utils/upload.js';

const router = express.Router();

// Tất cả các route chat đều cần authenticate
router.use(authenticate);

// --- Conversations ---
router.get('/conversations', chatController.getConversations);
router.post('/conversations/private', featureGuard('feature_private_chat'), chatController.createPrivateChat);
router.post('/conversations/group', featureGuard('feature_group_chat'), chatController.createGroupChat);
router.get('/conversations/:id/messages', chatController.getMessages);
router.put('/conversations/:id/bot', featureGuard('feature_ai_bot'), chatController.toggleBot);
router.post('/conversations/:id/leave', featureGuard('feature_group_chat'), chatController.leaveGroup);
router.delete('/conversations/:id', featureGuard('feature_group_chat'), chatController.deleteGroup);
router.get('/conversations/:id/suggest', featureGuard('feature_ai_suggest'), chatController.suggestReply);
router.post('/conversations/:id/read', chatController.markAsRead);

// --- Messages ---
router.delete('/messages/:id/recall', featureGuard('feature_message_recall'), chatController.recallMessage);
router.delete('/messages/:id/me', featureGuard('feature_message_delete'), chatController.deleteMessageForMe);

// --- Multimedia ---
router.post('/upload', featureGuard('feature_multimedia'), upload.single('file'), chatController.uploadFile);

export default router;
