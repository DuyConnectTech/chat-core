/**
 * @file Định nghĩa và export các hằng số đường dẫn (path constants)
 * cho toàn bộ dự án.
 *
 * Cách làm này giúp đảm bảo mọi file trong dự án đều có thể
 * truy cập đúng đường dẫn gốc, thư mục public, v.v.
 * một cách nhất quán, bất kể file đó đang nằm ở đâu.
 *
 * @lưu_ý File này được đặt trong thư mục /utils (hoặc tương tự),
 * vì vậy `ROOT_DIR` cần đi lùi một cấp (`..`).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Đường dẫn tuyệt đối đến file hiện tại (ví dụ: /app/utils/path-config.js).
 * @type {string}
 * @internal
 */
const __filename = fileURLToPath(import.meta.url);

/**
 * Đường dẫn tuyệt đối đến thư mục chứa file hiện tại (ví dụ: /app/utils).
 * @type {string}
 * @internal
 */
const __dirname = path.dirname(__filename);

/**
 * Đường dẫn tuyệt đối đến thư mục gốc của dự án.
 * (Đi lùi một cấp từ thư mục chứa file này).
 * @type {string}
 */
export const ROOT_DIR = path.resolve(__dirname, "..");

/**
 * Đường dẫn tuyệt đối đến thư mục 'public'.
 * @type {string}
 */
export const PUBLIC_DIR = path.join(ROOT_DIR, "public");

/**
 * Đường dẫn tuyệt đối đến thư mục 'views'.
 * @type {string}
 */
export const VIEWS_DIR = path.join(ROOT_DIR, "views");

/**
 * Thư mục để lưu trữ file log.
 * @type {string}
 * @internal
 */
export const LOG_DIR = path.join(ROOT_DIR, "storage", "logs");

/**
 * Thư mục để lưu trữ prompts cho AI.
 * @type {string}
 * @internal
 */
export const PROMPTS_DIR = path.join(ROOT_DIR, "prompts/gemini-suggestion-prompt.txt");