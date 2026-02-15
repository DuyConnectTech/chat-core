import tokenService from "#services/token.service.js";
import { User } from "#models/index.js";

/**
 * Middleware xác thực người dùng dựa trên JWT
 */
const authenticate = async (req, res, next) => {
    try {
        // 1. Lấy token từ Header Authorization hoặc Cookie
        let token = null;
        if (req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        } else if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        }

        if (!token) {
            if (req.xhr || req.path.startsWith("/api/")) {
                return res.status(401).json({ error: "Unauthorized: No token provided" });
            }
            return res.redirect("/login");
        }

        // 2. Xác thực token
        const decoded = tokenService.verifyAccessToken(token);
        if (!decoded) {
            if (req.xhr || req.path.startsWith("/api/")) {
                return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
            }
            return res.redirect("/login");
        }

        // 3. Đính kèm user vào request
        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ["password"] },
        });

        if (!user) {
            return res.status(401).json({ error: "User no longer exists" });
        }

        req.user = user;
        res.locals.user = user; // Dùng cho EJS template

        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export default authenticate;
