import { Setting } from '../models/index.js';
import { CORE_FEATURES, OPTIONAL_FEATURES } from '../config/features.js';

/**
 * FeatureService — Quản lý Feature Flags
 *
 * Kiến trúc:
 *  - CORE features: đọc từ config/features.js, không lưu DB, không lộ admin UI
 *  - OPTIONAL features: đọc DB trước → fallback config nếu chưa có
 *
 * Thứ tự ưu tiên: DB → Config (fallback)
 */
class FeatureService {
    constructor() {
        /** @type {Map<string, boolean>} In-memory cache */
        this.cache = new Map();
    }

    /**
     * Seed các OPTIONAL feature flags mặc định vào DB (nếu chưa tồn tại)
     * Core features KHÔNG seed vào DB — chúng nằm trong config
     */
    async seedDefaults() {
        const optionalKeys = Object.keys(OPTIONAL_FEATURES);

        if (optionalKeys.length === 0) {
            console.log('✅ No optional features to seed');
            return;
        }

        for (const [key, { enabled }] of Object.entries(OPTIONAL_FEATURES)) {
            await Setting.findOrCreate({
                where: { key },
                defaults: { value: enabled ? 'true' : 'false' },
            });
        }

        console.log(`✅ Optional features seeded: ${optionalKeys.length} features`);
    }

    /**
     * Load feature flags vào cache
     * - Core: load từ config
     * - Optional: load từ DB, fallback config nếu chưa có
     */
    async loadFeatures() {
        this.cache.clear();

        // 1. Load core features từ config (luôn luôn)
        for (const [key, { enabled }] of Object.entries(CORE_FEATURES)) {
            this.cache.set(key, enabled);
        }

        // 2. Load optional features từ DB → fallback config
        const optionalKeys = Object.keys(OPTIONAL_FEATURES);

        if (optionalKeys.length > 0) {
            const settings = await Setting.findAll({
                where: { key: optionalKeys },
            });

            // Set DB values
            for (const setting of settings) {
                this.cache.set(setting.key, setting.value === 'true');
            }

            // Fallback: nếu DB chưa có → dùng config default
            for (const [key, { enabled }] of Object.entries(OPTIONAL_FEATURES)) {
                if (!this.cache.has(key)) {
                    this.cache.set(key, enabled);
                }
            }
        }

        const coreCount = Object.keys(CORE_FEATURES).length;
        const optionalCount = optionalKeys.length;
        console.log(`✅ Features loaded: ${coreCount} core + ${optionalCount} optional`);
    }

    /**
     * Kiểm tra 1 feature có đang bật không
     * @param {string} key - Feature key (ví dụ: 'feature_registration')
     * @returns {Promise<boolean>}
     */
    async isEnabled(key) {
        // Cache hit → trả luôn
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        // Core feature chưa load? → đọc config
        if (CORE_FEATURES[key]) {
            const enabled = CORE_FEATURES[key].enabled;
            this.cache.set(key, enabled);
            return enabled;
        }

        // Optional feature → query DB
        const setting = await Setting.findByPk(key);
        if (setting) {
            const enabled = setting.value === 'true';
            this.cache.set(key, enabled);
            return enabled;
        }

        // Fallback config cho optional
        if (OPTIONAL_FEATURES[key]) {
            const enabled = OPTIONAL_FEATURES[key].enabled;
            this.cache.set(key, enabled);
            return enabled;
        }

        // Feature không tồn tại → mặc định bật
        return true;
    }

    /**
     * Bật/Tắt 1 feature (CHỈ cho optional features)
     * Core features không thể toggle qua API
     * @param {string} key - Feature key
     * @param {boolean} enabled - true = bật, false = tắt
     */
    async setFeature(key, enabled) {
        // Chặn toggle core features
        if (CORE_FEATURES[key]) {
            throw new Error(`"${key}" là core feature, không thể toggle qua Admin. Hãy sửa config/features.js`);
        }

        const value = enabled ? 'true' : 'false';
        await Setting.upsert({ key, value });
        this.cache.set(key, enabled);
    }

    /**
     * Lấy danh sách OPTIONAL features (cho Admin UI)
     * Core features KHÔNG trả về — không lộ cho khách hàng
     * @returns {Promise<Array<{key: string, enabled: boolean, label: string}>>}
     */
    async getOptionalFeatures() {
        const features = [];

        for (const [key, config] of Object.entries(OPTIONAL_FEATURES)) {
            const enabled = await this.isEnabled(key);
            features.push({
                key,
                enabled,
                label: config.label,
            });
        }

        return features;
    }

    /**
     * Lấy TẤT CẢ feature flags (core + optional)
     * Dùng nội bộ để truyền vào frontend views
     * @returns {Promise<Array<{key: string, enabled: boolean, label: string}>>}
     */
    async getAllFeatures() {
        const features = [];

        // Core features
        for (const [key, config] of Object.entries(CORE_FEATURES)) {
            features.push({
                key,
                enabled: this.cache.get(key) ?? config.enabled,
                label: config.label,
                type: 'core',
            });
        }

        // Optional features
        for (const [key, config] of Object.entries(OPTIONAL_FEATURES)) {
            const enabled = await this.isEnabled(key);
            features.push({
                key,
                enabled,
                label: config.label,
                type: 'optional',
            });
        }

        return features;
    }
}

export default new FeatureService();
