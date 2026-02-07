import fs from "node:fs";
import path from "node:path";
import { LOG_DIR } from "./path.js";

function ensureLogStream() {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    const fileName = `${new Date().toISOString().slice(0, 10)}-error.log`;
    return fs.createWriteStream(path.join(LOG_DIR, fileName), { flags: "a" });
}

function debugConfig(app) {
    const stream = ensureLogStream();
    const isDev = process.env.NODE_ENV === "development";

    // Middleware xử lý lỗi tập trung
    app.use((err, req, res, next) => {
        const statusCode = err.status || 500;
        const message = err.message || "Internal Server Error";
        
        const logEntry = `[${new Date().toISOString()}] ${req.method} ${req.url} ${statusCode} - ${message}\n${err.stack}\n\n`;
        stream.write(logEntry);

        if (isDev) console.error(logEntry);

        res.status(statusCode).render("pages/error", { 
            title: "Lỗi", 
            message, 
            error: isDev ? err : {} 
        });
    });
}

export { debugConfig };