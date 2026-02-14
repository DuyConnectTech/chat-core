import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { ROOT_DIR } from './path.js';
import { MULTIMEDIA_CONFIG } from '../config/features.js';

const { thumbnail, uploadDir } = MULTIMEDIA_CONFIG;

/**
 * Thumbnail Helper — Dynamic Size
 *
 * Cấu trúc thư mục:
 *   uploads/images/              → ảnh gốc
 *   uploads/thumbnails/{w}x{h}x{z}/  → thumbnail theo kích thước
 *
 * @example
 *   import { getThumbnailUrl, generateThumbnail } from '../utils/thumbnail.js';
 *
 *   // Upload: lưu gốc + tạo thumbnail default
 *   const result = await generateThumbnail(buffer, 'cat_1.png');
 *
 *   // Render UI: lấy thumbnail theo kích thước tùy ý
 *   const avatar  = await getThumbnailUrl('cat_1.png', 100, 100);
 *   // → '/uploads/thumbnails/100x100x1/cat_1.webp'
 *
 *   const preview = await getThumbnailUrl('cat_1.png', 400, 300, 2);
 *   // → '/uploads/thumbnails/400x300x2/cat_1.webp'
 */

// ─────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────

function getAbsolutePath(...segments) {
    return path.join(ROOT_DIR, 'public', ...segments);
}

/**
 * Clamp giá trị không vượt quá max config
 */
function clamp(value, max) {
    return Math.max(1, Math.min(value, max));
}

/**
 * Tạo tên thư mục size: {w}x{h}x{z}
 */
function sizeDir(w, h, z) {
    return `${w}x${h}x${z}`;
}

/**
 * Đổi extension file theo config format
 * cat_1.png → cat_1.webp
 */
function toThumbName(originalFilename) {
    const parsed = path.parse(originalFilename);
    return `${parsed.name}.${thumbnail.format}`;
}

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Thực hiện resize + convert bằng sharp
 */
async function processImage(inputBuffer, outputPath, width, height) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    await sharp(inputBuffer)
        .resize(width, height, {
            fit: thumbnail.fit,
            withoutEnlargement: thumbnail.withoutEnlargement,
        })
        [thumbnail.format]({ quality: thumbnail.quality })
        .toFile(outputPath);
}

// ─────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────

/**
 * Tạo thumbnail từ buffer (dùng khi upload file mới)
 *
 * - Lưu ảnh gốc vào uploads/images/
 * - Tạo thumbnail default (maxWidth x maxHeight x 1) vào uploads/thumbnails/{w}x{h}x{z}/
 *
 * @param {Buffer} buffer - Buffer ảnh gốc
 * @param {string} filename - Tên file gốc, vd: 'cat_1.png'
 * @returns {Promise<{originalUrl: string, thumbnailUrl: string|null}>}
 */
export async function generateThumbnail(buffer, filename) {
    // Lưu ảnh gốc
    const originalPath = getAbsolutePath(uploadDir.image, filename);
    await fs.mkdir(path.dirname(originalPath), { recursive: true });
    await fs.writeFile(originalPath, buffer);

    const result = {
        originalUrl: `/${uploadDir.image}/${filename}`,
        thumbnailUrl: null,
    };

    // Tạo thumbnail default nếu config bật
    if (thumbnail.enabled) {
        const w = thumbnail.maxWidth;
        const h = thumbnail.maxHeight;
        const z = 1;
        const dir = sizeDir(w, h, z);
        const thumbName = toThumbName(filename);
        const thumbPath = getAbsolutePath(uploadDir.thumbnail, dir, thumbName);

        await processImage(buffer, thumbPath, w, h);

        result.thumbnailUrl = `/${uploadDir.thumbnail}/${dir}/${thumbName}`;
    }

    return result;
}

/**
 * Lấy URL thumbnail theo kích thước tùy ý
 *
 * Nếu thumbnail chưa tồn tại → lazy-generate từ ảnh gốc
 * Width/Height/Zoom được clamp theo config max, không cho vượt
 *
 * @param {string} filename - Tên file gốc, vd: 'cat_1.png'
 * @param {number} [width=thumbnail.maxWidth] - Chiều rộng mong muốn (px)
 * @param {number} [height=thumbnail.maxHeight] - Chiều cao mong muốn (px)
 * @param {number} [zoom=1] - Hệ số zoom (1x, 2x cho retina...)
 * @returns {Promise<string>} URL thumbnail
 *
 * @example
 *   await getThumbnailUrl('cat_1.png', 100, 100)      → /uploads/thumbnails/100x100x1/cat_1.webp
 *   await getThumbnailUrl('cat_1.png', 400, 300, 2)    → /uploads/thumbnails/400x300x2/cat_1.webp
 *   await getThumbnailUrl('cat_1.png', 9999, 9999)     → clamp → /uploads/thumbnails/1200x1200x1/cat_1.webp
 *   await getThumbnailUrl('cat_1.png')                 → /uploads/thumbnails/1200x1200x1/cat_1.webp (default)
 */
export async function getThumbnailUrl(filename, width, height, zoom = 1) {
    const originalUrl = `/${uploadDir.image}/${filename}`;

    // Config tắt thumbnail → trả ảnh gốc
    if (!thumbnail.enabled) {
        return originalUrl;
    }

    // Clamp theo config max
    const w = clamp(width || thumbnail.maxWidth, thumbnail.maxWidth);
    const h = clamp(height || thumbnail.maxHeight, thumbnail.maxHeight);
    const z = clamp(zoom, 3); // zoom max 3x

    // Kích thước thực tế sau zoom
    const realW = clamp(w * z, thumbnail.maxWidth);
    const realH = clamp(h * z, thumbnail.maxHeight);

    const dir = sizeDir(w, h, z);
    const thumbName = toThumbName(filename);
    const thumbPath = getAbsolutePath(uploadDir.thumbnail, dir, thumbName);
    const thumbUrl  = `/${uploadDir.thumbnail}/${dir}/${thumbName}`;

    // Đã tồn tại → trả luôn
    if (await fileExists(thumbPath)) {
        return thumbUrl;
    }

    // Chưa có → tạo từ ảnh gốc
    const originalPath = getAbsolutePath(uploadDir.image, filename);

    if (!(await fileExists(originalPath))) {
        return originalUrl; // Ảnh gốc không tồn tại
    }

    const buffer = await fs.readFile(originalPath);
    await processImage(buffer, thumbPath, realW, realH);

    return thumbUrl;
}
