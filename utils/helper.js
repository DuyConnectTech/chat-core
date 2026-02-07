/**
 * Chuyển đổi một giá trị bất kỳ sang kiểu boolean (true/false) một cách "thông minh".
 * Xử lý các chuỗi phổ biến như "true", "1", "yes", "on" (thành true)
 * và "false", "0", "no", "off" (thành false).
 *
 * @param {any} value - Giá trị đầu vào cần chuyển đổi.
 * @param {boolean} [fallback=false] - Giá trị trả về mặc định nếu `value` là (undefined, null, "").
 * @returns {boolean} Giá trị boolean.
 */
function toBoolean(value, fallback = false) {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["true", "1", "yes", "y", "on"].includes(normalized)) {
            return true;
        }
        if (["false", "0", "no", "n", "off"].includes(normalized)) {
            return false;
        }
    }
    if (typeof value === "number") {
        return value !== 0;
    }
    // Đối với các trường hợp còn lại (vd: object, array), dùng cách ép kiểu mặc định
    return Boolean(value);
}

/**
 * Chuyển đổi một giá trị sang kiểu số (bao gồm cả số thực/float).
 *
 * @param {any} value - Giá trị đầu vào cần chuyển đổi.
 * @param {number|null} [fallback=null] - Giá trị trả về mặc định nếu `value` là empty hoặc không thể chuyển thành số hữu hạn (finite number).
 * @returns {number|null} Giá trị số hoặc giá trị `fallback`.
 */
function toNumber(value, fallback = null) {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }
    const numeric = Number(value);
    // Chỉ trả về số nếu nó là hữu hạn (không phải NaN hay Infinity)
    return Number.isFinite(numeric) ? numeric : fallback;
}

/**
 * Chuyển đổi một giá trị sang kiểu số nguyên (integer).
 *
 * @param {any} value - Giá trị đầu vào cần chuyển đổi.
 * @param {number|null} [fallback=null] - Giá trị trả về mặc định nếu `value` là empty hoặc không thể chuyển thành số nguyên.
 * @returns {number|null} Giá trị số nguyên hoặc giá trị `fallback`.
 */
function toInteger(value, fallback = null) {
    if (value === undefined || value === null || value === "") {
        return fallback;
    }
    // Sử dụng parseInt với cơ số 10 để đảm bảo tính chính xác
    const parsed = Number.parseInt(value, 10);
    // Kiểm tra nếu kết quả là NaN (ví dụ: "abc") thì trả về fallback
    return Number.isNaN(parsed) ? fallback : parsed;
}

/**
 * Chuyển đổi một giá trị (chuỗi CSV hoặc mảng) thành một mảng các chuỗi
 * đã được "chuẩn hóa":
 * 1. Đã trim (loại bỏ khoảng trắng ở đầu/cuối)
 * 2. Không rỗng (loại bỏ các chuỗi rỗng)
 * 3. Không trùng lặp (unique)
 *
 * @param {any} value - Giá trị đầu vào. Có thể là chuỗi "a,b,c", một mảng, hoặc null.
 * @returns {string[]} Một mảng các chuỗi đã được chuẩn hóa.
 */
function toCsvArray(value) {
    if (value === undefined || value === null) {
        return [];
    }

    // Nếu đầu vào là mảng, dùng nó. Nếu không, chuyển thành chuỗi và tách bằng dấu phẩy.
    const input = Array.isArray(value) ? value : String(value).split(",");

    const normalized = input
        .map((item) => {
            // Xử lý các phần tử null/undefined bên trong mảng
            if (item === undefined || item === null) {
                return "";
            }
            // Chuyển mọi thứ thành chuỗi và trim
            return String(item).trim();
        })
        // Lọc bỏ các chuỗi rỗng
        .filter((item) => item.length > 0);

    // Sử dụng Set để loại bỏ các giá trị trùng lặp và chuyển về mảng
    return Array.from(new Set(normalized));
}

export { toBoolean, toNumber, toInteger, toCsvArray };