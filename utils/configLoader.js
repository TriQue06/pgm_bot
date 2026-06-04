const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data/system.json');

let systemCache = null;

const loadCache = () => {
    try {
        if (fs.existsSync(FILE_PATH)) {
            const fileContent = fs.readFileSync(FILE_PATH, 'utf8');
            systemCache = fileContent.trim() ? JSON.parse(fileContent) : {};
        } else {
            systemCache = {};
        }
    } catch (err) {
        console.error("❌ [CONFIG HATASI] system.json belleğe yüklenirken bir hata oluştu:", err);
        systemCache = {};
    }
};

module.exports = {
    reload: () => {
        loadCache();
    },

    get: (category, key) => {
        if (!systemCache) loadCache();

        if (!systemCache[category] || !systemCache[category][key]) {
            return `[${category}.${key} Eksik!]`;
        }

        const item = systemCache[category][key];
        const emoji = item.emoji || "";
        const name = item.name || "";

        return `${emoji} ${name}`.trim();
    },

    getAll: (category) => {
        if (!systemCache) loadCache();
        return systemCache[category] || {};
    },

    getRaw: (category, key) => {
        if (!systemCache) loadCache();
        return systemCache[category] ? systemCache[category][key] : null;
    }
};