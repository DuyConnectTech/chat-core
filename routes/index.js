import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT_DIR } from '#utils/path.js';

const ROUTES_DIR = path.join(ROOT_DIR, 'routes');
const ROUTE_SUFFIX = '.routes.js';

/**
 * Dynamic Route Loader
 *
 * Auto-scan thư mục routes/ và mount theo convention:
 *   routes/web/*.routes.js   → /{routeName}    (SSR views)
 *   routes/api/*.routes.js   → /api/{routeName} (API endpoints)
 *
 * Quy tắc:
 *   - Tên file (bỏ .routes.js) = route name
 *   - index.routes.js → mount tại root của nhóm (/ hoặc /api)
 *   - Hỗ trợ nested: routes/api/users/profile.routes.js → /api/users/profile
 *
 * @param {import('express').Express} app
 */
export async function loadRoutes(app) {
    const groups = ['web', 'api'];

    for (const group of groups) {
        const groupDir = path.join(ROUTES_DIR, group);

        if (!fs.existsSync(groupDir)) continue;

        const files = getRouteFiles(groupDir);

        for (const file of files) {
            // Relative path từ groupDir: auth.routes.js hoặc users/profile.routes.js
            const relativePath = path.relative(groupDir, file);

            // Tính mount path
            const mountPath = buildMountPath(group, relativePath);

            // Dynamic import (ESM)
            const fileUrl = pathToFileURL(file).href;
            const routeModule = await import(fileUrl);
            const router = routeModule.default;

            if (!router) {
                console.warn(`⚠️  [Router] Skip ${relativePath}: no default export`);
                continue;
            }

            app.use(mountPath, router);
            console.log(`✅ [Router] ${group.toUpperCase()} ${mountPath} ← ${relativePath}`);
        }
    }
}

/**
 * Scan recursive tìm tất cả file *.routes.js
 */
function getRouteFiles(dir) {
    const results = [];

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            results.push(...getRouteFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith(ROUTE_SUFFIX)) {
            // Bỏ qua file index.js (loader chính)
            if (entry.name === 'index.js') continue;
            results.push(fullPath);
        }
    }

    // Sort: index.routes.js lên đầu, còn lại theo alphabet
    return results.sort((a, b) => {
        const aIsIndex = path.basename(a) === `index${ROUTE_SUFFIX}`;
        const bIsIndex = path.basename(b) === `index${ROUTE_SUFFIX}`;
        if (aIsIndex && !bIsIndex) return -1;
        if (!aIsIndex && bIsIndex) return 1;
        return a.localeCompare(b);
    });
}

/**
 * Tính mount path từ group + relative file path
 *
 * @example
 *   buildMountPath('web', 'index.routes.js')           → '/'
 *   buildMountPath('web', 'login.routes.js')            → '/login'
 *   buildMountPath('api', 'auth.routes.js')             → '/api/auth'
 *   buildMountPath('api', 'chat.routes.js')             → '/api/chat'
 *   buildMountPath('api', 'users/profile.routes.js')    → '/api/users/profile'
 */
function buildMountPath(group, relativePath) {
    // Bỏ suffix .routes.js
    const routeName = relativePath.replace(ROUTE_SUFFIX, '');

    // Chuẩn hóa separator (Windows \\ → /)
    const normalized = routeName.split(path.sep).join('/');

    // index → root
    const segment = normalized === 'index' ? '' : normalized;

    if (group === 'web') {
        return segment ? `/${segment}` : '/';
    }

    // api group
    return segment ? `/api/${segment}` : '/api';
}
