import featureService from '../services/feature.service.js';

/**
 * Middleware factory: Chặn request khi feature bị tắt
 * @param {string} featureKey - Key của feature cần kiểm tra (ví dụ: 'feature_multimedia')
 * @returns {Function} Express middleware
 *
 * @example
 * router.post('/upload', featureGuard('feature_multimedia'), upload.single('file'), controller.uploadFile);
 */
const featureGuard = (featureKey) => {
    return async (req, res, next) => {
        try {
            const enabled = await featureService.isEnabled(featureKey);

            if (!enabled) {
                // Nếu request là API → trả JSON 403
                if (req.xhr || req.path.startsWith('/api/') || req.headers.accept?.includes('application/json')) {
                    return res.status(403).json({
                        error: 'Tính năng này hiện đang bị tắt',
                        feature: featureKey,
                    });
                }

                // Nếu request là View → redirect về trang trước hoặc trang chủ
                return res.redirect(req.headers.referer || '/');
            }

            next();
        } catch (error) {
            console.error(`FeatureGuard Error (${featureKey}):`, error);
            next(error);
        }
    };
};

export default featureGuard;
