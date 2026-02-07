import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ROOT_DIR của chat-core (đi lùi 1 cấp từ utils)
export const ROOT_DIR = path.resolve(__dirname, "..");

export const PUBLIC_DIR = path.join(ROOT_DIR, "public");
export const VIEWS_DIR = path.join(ROOT_DIR, "views");
export const LOG_DIR = path.join(ROOT_DIR, "storage", "logs");
