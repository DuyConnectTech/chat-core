/**
 * @file Cung cấp trình xử lý lỗi và gỡ lỗi toàn diện cho ứng dụng.
 *
 * Module này bao gồm:
 * 1. Middleware xử lý lỗi cho Express.
 * 2. Trình theo dõi (listener) cho `uncaughtException` và `unhandledRejection` của process.
 * 3. Ghi log lỗi vào file với cơ chế xoay vòng (rotating) hàng ngày.
 * 4. Chuẩn hóa (serialize) và ẩn (redact) dữ liệu nhạy cảm trước khi ghi log.
 * 5. Tự động đóng stream khi process thoát.
 */

import fs from "node:fs";
import path from "node:path";
import { LOG_DIR } from "./path.js";
import { describeLocation, resolveIp } from "./geoip.js";
import config from "../config/app.js";

/**
 * Độ dài tối đa cho một chuỗi trước khi bị cắt ngắn (truncate).
 * @type {number}
 * @internal
 */
const MAX_SERIALIZED_LENGTH = 4096;

/**
 * Danh sách các sự kiện process cần theo dõi để bắt lỗi.
 * @type {string[]}
 * @internal
 */
const PROCESS_EVENTS = [
    "uncaughtException",
    "unhandledRejection",
    "rejectionHandled", // promise bị reject sau rồi mới được .catch
    "multipleResolves", // resolve/reject nhiều lần – code smell
    "uncaughtExceptionMonitor", // observe uncaughtException mà không chặn
    "warning", // DeprecationWarning, MaxListenersExceededWarning, v.v.
    "beforeExit", // vòng đời tiến tới thoát (có thể còn async)
    "exit", // sắp out process – log/minidump nhanh
];

// Các tín hiệu hệ thống nên bắt để log & shutdown tử tế
const PROCESS_SIGNALS = [
    "SIGINT", // Ctrl+C (terminal, PM2)
    "SIGTERM", // kill default (k8s, systemd)
    "SIGUSR2", // nodemon hot-reload trên Linux/macOS
    // tuỳ môi trường: "SIGHUP","SIGQUIT"
];

// Tránh spam log: throttle theo key (event/signal)
const __lastHit = new Map();
function throttled(fn, key, ms = 1000) {
    const now = Date.now();
    const last = __lastHit.get(key) || 0;
    if (now - last > ms) {
        __lastHit.set(key, now);
        fn();
    }
}

/**
 * Đảm bảo thư mục log tồn tại và mở một stream ghi (write stream)
 * đến file log của ngày hôm nay.
 * File log sẽ có tên theo dạng "YYYY-MM-DD-error.log".
 *
 * @returns {fs.WriteStream} Một stream có thể ghi, với cờ 'a' (append).
 * @internal
 */
function ensureLogStream() {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    const fileName = `${new Date().toISOString().slice(0, 10)}-error.log`;
    const filePath = path.join(LOG_DIR, fileName);
    // Mở stream ở chế độ 'a' (append - ghi nối tiếp)
    return fs.createWriteStream(filePath, { flags: "a" });
}

const DEBUG_LOG_SUFFIX = "debug";

function resolveDailyLogPath(suffix = DEBUG_LOG_SUFFIX) {
    const fileName = `${new Date().toISOString().slice(0, 10)}-${suffix}.log`;
    return path.join(LOG_DIR, fileName);
}

function appendDebugLine(entry) {
    try {
        fs.mkdirSync(LOG_DIR, { recursive: true });
        const filePath = resolveDailyLogPath();
        fs.appendFile(filePath, entry, (error) => {
            if (error) {
                console.error("[debugLog] Failed to append debug entry:", error);
            }
        });
    } catch (error) {
        console.error("[debugLog] Failed to prepare debug log directory:", error);
    }
}

const debugLogs = (...args) => {
    debugLog(...args);
};

/**
 * Chuẩn hóa (serialize) một giá trị một cách an toàn để ghi log.
 * - Cắt ngắn (truncate) chuỗi dài.
 * - Giới hạn độ sâu (depth) của object/array để tránh lồng vô hạn.
 * - Ẩn (redact) các trường nhạy cảm như "password" hoặc "token".
 * - Xử lý các lỗi serialization.
 *
 * @param {any} value - Giá trị cần chuẩn hóa.
 * @param {number} [depth=0] - Độ sâu lồng hiện tại (dùng cho đệ quy).
 * @returns {any} Một bản sao "sạch" của giá trị, an toàn để JSON.stringify.
 * @internal
 */
function safeSerialize(value, depth = 0) {
    try {
        if (value === undefined) return undefined;
        if (value === null) return null;

        // Cắt ngắn chuỗi dài
        if (typeof value === "string") {
            return value.length > MAX_SERIALIZED_LENGTH ? `${value.slice(0, MAX_SERIALIZED_LENGTH)}…` : value;
        }

        // Xử lý mảng (giới hạn độ sâu và số lượng phần tử)
        if (Array.isArray(value)) {
            if (depth > 2) return "[Array truncated]";
            // Chỉ lấy 20 phần tử đầu tiên
            return value.slice(0, 20).map((item) => safeSerialize(item, depth + 1));
        }

        // Xử lý object (giới hạn độ sâu và ẩn thông tin nhạy cảm)
        if (typeof value === "object") {
            if (depth > 2) return "{Object truncated}";
            const clone = {};
            for (const [key, val] of Object.entries(value)) {
                // Ẩn các khóa nhạy cảm
                if (key.toLowerCase().includes("password") || key.toLowerCase().includes("token")) {
                    const k = key.toLowerCase();
                    const SENSITIVE_KEYS = ["password", "token", "authorization", "cookie", "set-cookie", "apikey", "api-key", "x-api-key", "secret", "client_secret", "access_token", "refresh_token", "session"];

                    if (SENSITIVE_KEYS.some((sKey) => k.includes(sKey))) {
                        clone[key] = "[REDACTED]";
                        continue;
                    }
                }
                clone[key] = safeSerialize(val, depth + 1);
            }
            return clone;
        }

        // Trả về các kiểu dữ liệu nguyên thủy (number, boolean)
        return value;
    } catch (error) {
        return `[Unserializable value: ${error.message}]`;
    }
}

function debugLog(namespace, message, payload, options = {}) {
    const { level = "info", force = false } = options;
    const enabled = force || Boolean(config?.appDebug);
    if (!enabled) {
        return;
    }

    const timestamp = new Date().toISOString();
    const scope = namespace || "App";
    const note = message || "";

    let serialized = "";
    if (payload !== undefined) {
        try {
            serialized = ` | data=${JSON.stringify(safeSerialize(payload))}`;
        } catch (_error) {
            serialized = " | data=[Unserializable payload]";
        }
    }

    const line = `[${timestamp}] [${scope}] ${note}${serialized}\n`;
    const consoleMethod = level === "error" ? "error" : level === "warn" ? "warn" : "log";
    const logger = typeof console[consoleMethod] === "function" ? console[consoleMethod] : console.log;
    logger.call(console, line.trim());
    appendDebugLine(line);
}

/**
 * Tạo một chuỗi log đầy đủ, đã định dạng từ thông tin lỗi và request.
 * Bao gồm timestamp, IP, vị trí, message, context (header, body,...) và stack trace.
 * @typedef {object} LogInput - Đầu vào để tạo một entry log.
 * @property {Error} err - Đối tượng Error.
 * @property {import('express').Request | null} [req] - Đối tượng Request (nếu có).
 * @property {import('express').Response | null} [res] - Đối tượng Response (nếu có).
 * @property {string} source - Nguồn gốc của lỗi (ví dụ: 'express', 'uncaughtException').
 * @property {any} [metadata] - Dữ liệu bổ sung tùy chọn cần log.
 *
 * @param {LogInput} { err, req, res, source, metadata } - Các thuộc tính lỗi (đã được destructure).
 * @returns {string} Chuỗi log đã định dạng, sẵn sàng để ghi.
 * @internal
 */
function createLogEntry({ err, req, res, source, metadata }) {
    const timestamp = new Date().toISOString();

    // Cố gắng lấy status code từ nhiều nguồn
    const statusCode = err?.status || err?.statusCode || (res && res.statusCode >= 400 ? res.statusCode : undefined) || 500;

    const method = req?.method || "-";
    const url = req?.originalUrl || req?.url || "-";

    // Xử lý IP và thông tin vị trí
    const clientIp = req ? resolveIp(req.headers["x-forwarded-for"] || req.ip) : null;
    const ipInfo = describeLocation(clientIp);
    const location = ipInfo.location || "Unknown location";
    const ipLabel = ipInfo.ip || clientIp || "unknown";

    const message = err?.message || String(err);

    // Dòng header chính của log
    const header = `[${timestamp}] [${source}] ${method} ${url} ${statusCode} (ip=${ipLabel}, location=${location}) - ${message}`;
    const lines = [header];

    // Thêm metadata nếu có
    if (metadata) {
        lines.push(`metadata=${JSON.stringify(safeSerialize(metadata))}`);
    }

    // Thêm context từ request (nếu có)
    if (req) {
        const context = {
            ip: ipLabel,
            location,
            headers: safeSerialize(req.headers),
            query: safeSerialize(req.query),
            params: safeSerialize(req.params),
            body: safeSerialize(req.body),
            user: safeSerialize(req.session?.user), // Giả sử có req.session.user
        };
        lines.push(`context=${JSON.stringify(context)}`);
    }

    // Thêm stack trace nếu có
    if (err?.stack) {
        lines.push(err.stack);
    }

    // Thêm một dòng mới ở cuối để phân tách các entry
    return `${lines.join("\n")}\n`;
}

/**
 * Cấu hình trình xử lý lỗi và gỡ lỗi toàn diện cho ứng dụng Express.
 *
 * - Thêm middleware xử lý lỗi cuối cùng cho Express.
 * - Gắn listener cho các lỗi process (uncaughtException, unhandledRejection).
 * - Khởi tạo stream ghi log.
 * - Tự động dọn dẹp stream khi process thoát.
 *
 * @param {import('express').Express} app - Đối tượng ứng dụng Express.
 */
function debugConfig(app) {
    // Khởi tạo stream ghi log
    const stream = ensureLogStream();
    const isDev = app.get("env") === "development";

    /**
     * Hàm nội bộ để ghi log lỗi.
     * Ghi vào stream và (nếu là dev) ghi ra console.
     * @param {Error} err - Đối tượng lỗi.
     * @param {import('express').Request | null} [req] - Đối tượng Request.
     * @param {import('express').Response | null} [res] - Đối tượng Response.
     * @param {string} [source="express"] - Nguồn lỗi.
     * @param {any} [metadata] - Dữ liệu bổ sung.
     * @internal
     */
    function logError(err, req = null, res = null, source = "express", metadata) {
        const entry = createLogEntry({ err, req, res, source, metadata });
        !stream.write(entry) && stream.once("drain", () => stream.write(entry));

        if (isDev) {
            // Hiển thị log lỗi ra console nếu ở môi trường development
            // eslint-disable-next-line no-console
            console.error(entry.trim());
        }
    }

    // Middleware xử lý lỗi của Express (phải đặt cuối cùng)
    app.use((err, req, res, next) => {
        if (!err) {
            return next();
        }

        // Đặt status code cho response
        const statusCode = err.status || err.statusCode || 500;
        res.status(statusCode);

        // Ghi log lỗi
        logError(err, req, res, "express");

        // Chuẩn bị dữ liệu để render trang lỗi
        res.locals.message = err.message;
        res.locals.error = isDev ? err : {}; // Chỉ hiển thị stack trace khi ở dev

        // Render trang lỗi (sử dụng view engine, ví dụ: 'ejs')
        res.render("error");
    });

    // Bắt các lỗi không xác định của process
    PROCESS_EVENTS.forEach((eventName) => {
        process.on(eventName, (arg1, arg2) => {
            // Chuẩn hoá thành Error để reuse logError()
            let err;
            if (eventName === "unhandledRejection" || eventName === "rejectionHandled") {
                const reason = arg1;
                err = reason instanceof Error ? reason : new Error(String(reason));
                err.message = `[${eventName}] ${err.message}`;
            } else if (eventName === "multipleResolves") {
                const type = arg1; // 'resolve' | 'reject'
                const promise = arg2;
                err = new Error(`[multipleResolves] type=${type}`);
                // nhét thêm metadata nếu muốn
            } else if (eventName === "warning") {
                const w = arg1; // node:process Warning
                err = new Error(`[warning] ${w?.name || "Warning"}: ${w?.message || ""}`);
                err.stack = w?.stack || err.stack;
            } else if (eventName === "beforeExit" || eventName === "exit") {
                err = new Error(`[${eventName}] code=${arg1 ?? ""}`);
            } else if (eventName === "uncaughtExceptionMonitor") {
                const e = arg1;
                err = e instanceof Error ? e : new Error(String(e));
                err.message = `[uncaughtExceptionMonitor] ${err.message}`;
            } else {
                const e = arg1;
                err = e instanceof Error ? e : new Error(String(e));
                err.message = `[${eventName}] ${err.message}`;
            }

            throttled(
                () =>
                    logError(err, null, null, eventName, {
                        pid: process.pid,
                        memory: process.memoryUsage?.(),
                        uptime: process.uptime?.(),
                        versions: process.versions,
                    }),
                `evt:${eventName}`,
                500
            );
        });
    });

    // Bắt tín hiệu để log & shutdown gọn
    PROCESS_SIGNALS.forEach((sig) => {
        process.on(sig, () => {
            throttled(
                () => {
                    const err = new Error(`[signal] ${sig} received`);
                    logError(err, null, null, "signal", { pid: process.pid });
                    try {
                        /* đóng stream/log/DB nếu có */
                    } catch (_) {}
                    if (sig === "SIGINT" || sig === "SIGTERM") {
                        // thoát “êm”: cho middleware/stream flush một nhịp
                        setTimeout(() => process.exit(0), 100);
                    }
                },
                `sig:${sig}`,
                500
            );
        });
    });

    // Đóng stream an toàn khi ứng dụng thoát
    process.on("exit", () => {
        try {
            stream.end();
        } catch (_error) {
            // Bỏ qua lỗi nếu stream đã đóng
        }
    });
}

export { debugConfig, debugLog, debugLogs };
