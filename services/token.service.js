import jwt from "jsonwebtoken";
import crypto from "crypto";
import { PersonalAccessToken, Session } from "../models/index.js";

class TokenService {
    constructor() {
        this.accessTokenSecret = process.env.JWT_SECRET || "your_access_token_secret";
        this.accessTokenExpiry = "1h"; // Access Token ngắn hạn
        this.refreshTokenExpiryDays = 30; // Refresh Token dài hạn (30 ngày)
    }

    /**
     * Tạo Access Token (JWT)
     */
    generateAccessToken(user) {
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
        };
        return jwt.sign(payload, this.accessTokenSecret, { expiresIn: this.accessTokenExpiry });
    }

    /**
     * Xác thực Access Token
     */
    verifyAccessToken(token) {
        try {
            return jwt.verify(token, this.accessTokenSecret);
        } catch (error) {
            return null;
        }
    }

    /**
     * Tạo chuỗi Refresh Token ngẫu nhiên
     */
    generateRandomToken() {
        return crypto.randomBytes(40).toString("hex");
    }

    /**
     * Hash token (SHA-256) để lưu DB
     */
    hashToken(token) {
        return crypto.createHash("sha256").update(token).digest("hex");
    }

    /**
     * Lưu Refresh Token và Session vào DB
     */
    async createRefreshToken(userId, ipAddress, userAgent) {
        const rawToken = this.generateRandomToken();
        const hash = this.hashToken(rawToken);

        // Ngày hết hạn
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + this.refreshTokenExpiryDays);

        // 1. Lưu PersonalAccessToken
        const tokenRecord = await PersonalAccessToken.create({
            user_id: userId,
            token_hash: hash,
            expires_at: expiresAt,
        });

        // 2. Tạo Session liên kết
        await Session.create({
            user_id: userId,
            refresh_token_id: tokenRecord.id,
            ip_address: ipAddress,
            user_agent: userAgent,
        });

        return rawToken;
    }

    /**
     * Xác thực Refresh Token từ Database
     */
    async verifyRefreshToken(rawToken) {
        const hash = this.hashToken(rawToken);

        const tokenRecord = await PersonalAccessToken.findOne({
            where: { token_hash: hash, revoked_at: null },
            include: [{ model: Session, as: "Session" }],
        });

        if (!tokenRecord) return null;

        // Kiểm tra hết hạn
        if (new Date() > new Date(tokenRecord.expires_at)) {
            return null;
        }

        return tokenRecord;
    }

    /**
     * Thu hồi Refresh Token
     */
    async revokeRefreshToken(rawToken) {
        const hash = this.hashToken(rawToken);
        await PersonalAccessToken.update({ revoked_at: new Date() }, { where: { token_hash: hash } });
    }
}

export default new TokenService();
