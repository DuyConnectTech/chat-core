/**
 * Lấy timestamp hiện tại và thời gian hết hạn
 * @param {string|number} endTime - '15m', '2d', '1h', '30s' hoặc số giây
 * @returns {object} {current, expiry, duration}
 */
function getTimestamp(endTime) {
    const current = Math.floor(Date.now() / 1000);
    const duration = parseTime(endTime);
    const expiry = current + duration;

    return {
        current,
        expiry,
        duration,
        // Bonus: format dates
        currentDate: new Date(current * 1000).toLocaleString("vi-VN"),
        expiryDate: new Date(expiry * 1000).toLocaleString("vi-VN"),
        humanDuration: formatTime(duration),
    };
}

/**
 * Parse time string thành giây
 * @param {string|number} time - '15m', '2d' hoặc số
 * @returns {number} giây
 */
function parseTime(time) {
    if (typeof time === "number") return time;
    if (/^\d+$/.test(time)) return parseInt(time);

    const match = time.match(/^(\d+)([smhd])$/);
    if (!match) throw new Error(`Invalid format: ${time}`);

    const [, num, unit] = match;
    const multipliers = {
        s: 1,
        m: 60,
        h: 3600,
        d: 86400,
    };

    return parseInt(num) * multipliers[unit];
}

/**
 * Format seconds thành text dễ đọc
 */
function formatTime(seconds) {
    if (seconds < 60) return `${seconds} giây`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ`;
    return `${Math.floor(seconds / 86400)} ngày`;
}

/**
 * Kiểm tra hết hạn
 */
function isExpired(expiryTimestamp) {
    return Math.floor(Date.now() / 1000) > expiryTimestamp;
}

console.log(getTimestamp("2d")); // Ví dụ sử dụng

export {
    getTimestamp,
    parseTime,
    formatTime,
    isExpired,
};
