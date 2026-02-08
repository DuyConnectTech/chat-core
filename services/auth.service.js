import bcrypt from "bcryptjs";
import { User } from "../models/index.js";
import { Op } from "sequelize";
import tokenService from "./token.service.js";

class AuthService {
    /**
     * Đăng ký người dùng mới
     */
    async register({ username, email, password, display_name }) {
        // Kiểm tra trùng lặp username
        const existingUsername = await User.findOne({ where: { username } });
        if (existingUsername) throw new Error("Tên đăng nhập đã tồn tại");

        // Kiểm tra trùng lặp email
        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) throw new Error("Email đã tồn tại");

        const hashedPassword = await bcrypt.hash(password, 10);
        return await User.create({
            username,
            email,
            password: hashedPassword,
            display_name,
            role: "user",
        });
    }

    /**
     * Đăng nhập người dùng (Hỗ trợ Username hoặc Email)
     */
    async login({ identity, password, ipAddress, userAgent }) {
        // Tìm user khớp với Username HOẶC Email
        const user = await User.findOne({
            where: {
                [Op.or]: [{ username: identity }, { email: identity }],
            },
        });

        if (!user) throw new Error("Thông tin đăng nhập không chính xác");

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error("Thông tin đăng nhập không chính xác");

        const accessToken = tokenService.generateAccessToken(user);
        const refreshToken = await tokenService.createRefreshToken(user.id, ipAddress, userAgent);

        return { user, accessToken, refreshToken };
    }

    /**
     * Làm mới Access Token (Refresh Flow)
     */
    async refreshAccessToken(rawRefreshToken, ipAddress, userAgent) {
        const tokenRecord = await tokenService.verifyRefreshToken(rawRefreshToken);
        if (!tokenRecord) throw new Error("Phiên đăng nhập hết hạn hoặc không hợp lệ");

        const user = await User.findByPk(tokenRecord.user_id);
        if (!user) throw new Error("Người dùng không tồn tại");

        await tokenService.revokeRefreshToken(rawRefreshToken);

        const newAccessToken = tokenService.generateAccessToken(user);
        const newRefreshToken = await tokenService.createRefreshToken(user.id, ipAddress, userAgent);

        return { user, accessToken: newAccessToken, refreshToken: newRefreshToken };
    }

    /**
     * Đăng xuất
     */
    async logout(rawRefreshToken) {
        if (rawRefreshToken) {
            await tokenService.revokeRefreshToken(rawRefreshToken);
        }
    }
}

export default new AuthService();
