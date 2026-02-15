/**
 * @file Cung cấp các hàm tiện ích liên quan đến IP và GeoIP.
 * Bao gồm phân giải IP, tra cứu vị trí, và ghi log thông tin nguồn gốc.
 */

import geoip from "geoip-lite";

/**
 * Phân giải và "làm sạch" một chuỗi IP thô.
 * Thường dùng cho header 'x-forwarded-for' có thể chứa nhiều IP.
 * - Lấy IP đầu tiên nếu có danh sách (phân tách bằng dấu phẩy).
 * - Loại bỏ prefix '::ffff:' của IPv4-mapped IPv6.
 *
 * @param {string} [rawValue=""] - Chuỗi IP thô (ví dụ: "1.2.3.4, 5.6.7.8").
 * @returns {string | null} IP đã được làm sạch, hoặc null nếu không hợp lệ.
 */
const resolveIp = (rawValue = "") => {
    if (!rawValue) return null;
    // Lấy IP đầu tiên trong danh sách (thường là IP thật của client)
    const ip = rawValue.split(",")[0].trim();
    if (!ip) return null;
    // Xử lý trường hợp IPv4-mapped IPv6 (vd: ::ffff:127.0.0.1 -> 127.0.0.1)
    return ip.startsWith("::ffff:") ? ip.substring(7) : ip;
};

/**
 * @typedef {object} IpLocation
 * @property {string} ip - Địa chỉ IP (hoặc "unknown").
 * @property {string} location - Chuỗi mô tả vị trí (ví dụ: "City, Region, Country").
 */

/**
 * Tra cứu thông tin vị trí địa lý cho một địa chỉ IP.
 *
 * @param {string | null} ip - Địa chỉ IP đã được làm sạch.
 * @returns {IpLocation} Một đối tượng chứa IP và chuỗi mô tả vị trí.
 */
const describeLocation = (ip) => {
    if (!ip) {
        return { ip: "unknown", location: "Unknown location" };
    }
    const geo = geoip.lookup(ip);
    if (!geo) {
        return { ip, location: "Unknown location" };
    }
    // Ghép các phần thông tin vị trí lại (loại bỏ các giá trị null/empty)
    const parts = [geo.city, geo.region, geo.country, geo.ll, geo.area].filter(Boolean);
    return { ip, location: parts.length ? parts.join(", ") : "Unknown location" };
};

/**
 * Ghi log thông tin nguồn gốc (IP và vị trí) ra console.
 * Chỉ hoạt động khi `config.appDebug` được bật (true).
 *
 * @param {string} source - Nguồn gốc của log (ví dụ: "WebSocket", "API").
 * @param {string | null | undefined} rawIp - Chuỗi IP thô từ request.
 * @returns {void}
 */
const logOrigin = (source, rawIp) => {
    // Chỉ chạy khi ở chế độ debug
    if (process.env.NODE_ENV !== "development") {
        return;
    }

    const ip = resolveIp(rawIp);
    const { location } = describeLocation(ip);
    console.log(`[${source}] ip=${ip ?? "unknown"} location=${location}`);
};

export { resolveIp, describeLocation, logOrigin };