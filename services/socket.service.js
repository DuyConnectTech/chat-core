import { Server } from "socket.io";
import chatService from "#services/chat.service.js";
import userService from "#services/user.service.js";
import geminiService from "#services/gemini.service.js";
import tokenService from "#services/token.service.js";
import featureService from "#services/feature.service.js";

class SocketService {
    init(server) {
        this.io = new Server(server, {
            cors: { origin: "*" },
        });

        // --- Middleware xác thực Socket ---
        this.io.use((socket, next) => {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error("Authentication error: No token provided"));

            const decoded = tokenService.verifyAccessToken(token);
            if (!decoded) return next(new Error("Authentication error: Invalid token"));

            socket.userId = decoded.id;
            next();
        });

        this.io.on("connection", async (socket) => {
            console.log(`User connected: ${socket.userId} (${socket.id})`);

            // Tự động join tất cả các phòng chat của user
            try {
                const conversations = await chatService.getConversations(socket.userId);
                conversations.forEach(c => socket.join(c.id));
                console.log(`User ${socket.userId} auto-joined ${conversations.length} rooms`);
            } catch (e) {
                console.error('Auto-join rooms failed:', e);
            }

            // Tham gia phòng chat (Client active)
            socket.on("room:join", (conversationId) => {
                socket.join(conversationId);
                // console.log(`User ${socket.userId} joined room: ${conversationId}`);
            });

            // Rời phòng chat
            socket.on("room:leave", (conversationId) => {
                socket.leave(conversationId);
            });

            // Gửi tin nhắn
            socket.on("message:send", async ({ conversationId, content, type }) => {
                try {
                    const message = await chatService.sendMessage({
                        conversationId,
                        senderId: socket.userId,
                        content,
                        type,
                    });

                    // Phát tin nhắn cho cả phòng
                    this.io.to(conversationId).emit("message:new", message);

                    // Xử lý AI Bot tự động trả lời
                    this.handleBotReply(conversationId, content);
                } catch (error) {
                    console.error("Socket Error (message:send):", error);
                }
            });

            // Thu hồi tin nhắn
            socket.on("message:recall", async ({ conversationId, messageId }) => {
                const recallEnabled = await featureService.isEnabled('feature_message_recall');
                if (!recallEnabled) return;
                this.io.to(conversationId).emit("message:recalled", { messageId });
            });

            // Trạng thái đang gõ
            socket.on("typing:start", (conversationId) => {
                socket.to(conversationId).emit("typing:status", { userId: socket.userId, isTyping: true });
            });

            socket.on("typing:stop", (conversationId) => {
                socket.to(conversationId).emit("typing:status", { userId: socket.userId, isTyping: false });
            });

            socket.on("disconnect", () => {
                console.log(`User disconnected: ${socket.userId}`);
            });
        });
    }

    /**
     * Logic Bot tự động trả lời
     */
    async handleBotReply(conversationId, userContent) {
        try {
            // Check global feature toggle
            const botEnabled = await featureService.isEnabled('feature_ai_bot');
            if (!botEnabled) return;

            const botUser = await userService.findOrCreateBotUser();
            const conversation = await chatService.getConversationDetail(conversationId);

            if (conversation && conversation.is_bot_active) {
                // Thông báo Bot đang gõ
                this.io.to(conversationId).emit("typing:status", { userId: botUser.id, isTyping: true });

                // Lấy ngữ cảnh hội thoại
                const history = await chatService.getMessages(conversationId, 10);
                const reply = await geminiService.generateReply(userContent, history);

                // Gửi tin nhắn từ Bot
                const botMsg = await chatService.sendMessage({
                    conversationId,
                    senderId: botUser.id,
                    content: reply,
                    type: "ai",
                });

                this.io.to(conversationId).emit("typing:status", { userId: botUser.id, isTyping: false });
                this.io.to(conversationId).emit("message:new", botMsg);
            }
        } catch (err) {
            console.error("Bot Error:", err);
        }
    }

    /**
     * Thông báo có cuộc hội thoại mới
     * @param {Object} conversation - Object conversation
     * @param {Array} memberIds - Mảng user ID của thành viên
     */
    notifyNewConversation(conversation, memberIds) {
        // Find connected sockets
        const sockets = this.io.sockets.sockets; // Map<socketId, socket>
        
        sockets.forEach(socket => {
            if (memberIds.includes(socket.userId)) {
                // Join room
                socket.join(conversation.id);
                // Emit event
                socket.emit('conversation:new', conversation);
                console.log(`User ${socket.userId} joined new room ${conversation.id}`);
            }
        });
    }
}

export default new SocketService();
