function toBoolean(value, fallback = false) {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;
        if (["false", "0", "no", "n", "off"].includes(normalized)) return false;
    }
    return Boolean(value);
}

function toInteger(value, fallback = null) {
    if (value === undefined || value === null || value === "") return fallback;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
}

export { toBoolean, toInteger };
