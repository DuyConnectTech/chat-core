import authService from "../services/auth.service.js";
import asyncHandler from "../utils/async-handler.js";
import featureService from "../services/feature.service.js";

class AuthController {
    /**
     * Render trang đăng ký
     * @method GET /register
     */
    renderRegister = (req, res) => {
        res.render("pages/register", { title: "Đăng ký", error: null });
    };

    /**
     * Xử lý đăng ký
     * @method POST /register
     */
    register = asyncHandler(async (req, res) => {
        const { username, email, password, display_name } = req.body;
        await authService.register({ username, email, password, display_name });
        res.json({ success: true, message: "Đăng ký thành công" });
    });

    /**
     * Render trang đăng nhập
     * @method GET /login
     */
    renderLogin = async (req, res) => {
        const registrationEnabled = await featureService.isEnabled('feature_registration');
        res.render("pages/login", { title: "Đăng nhập", error: null, registrationEnabled });
    };

    /**
     * Xử lý đăng nhập
     * @method POST /login
     */
    login = asyncHandler(async (req, res) => {
        const { identity, password } = req.body;
        const ipAddress = req.ip;
        const userAgent = req.get("User-Agent");

        const { user, accessToken, refreshToken } = await authService.login({
            identity,
            password,
            ipAddress,
            userAgent,
        });

        // Gửi Refresh Token qua HttpOnly Cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 ngày
            sameSite: "strict",
        });

        res.json({
            success: true,
            accessToken,
            user: {
                id: user.id,
                username: user.username,
                display_name: user.display_name,
                role: user.role,
            },
        });
    });

    /**
     * Làm mới Access Token
     * @method POST /refresh
     */
    refresh = asyncHandler(async (req, res) => {
        const rawRefreshToken = req.cookies.refreshToken;
        if (!rawRefreshToken) return res.status(401).json({ error: "Không tìm thấy Refresh Token" });

        const ipAddress = req.ip;
        const userAgent = req.get("User-Agent");

        const { accessToken, refreshToken } = await authService.refreshAccessToken(rawRefreshToken, ipAddress, userAgent);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 30 * 24 * 60 * 60 * 1000,
            sameSite: "strict",
        });

        res.json({ success: true, accessToken });
    });

    /**
     * Đăng xuất
     * @method POST /logout
     */
    logout = asyncHandler(async (req, res) => {
        const rawRefreshToken = req.cookies.refreshToken;
        await authService.logout(rawRefreshToken);

        res.clearCookie("refreshToken");
        res.json({ success: true, message: "Đã đăng xuất" });
    });
}

export default new AuthController();
