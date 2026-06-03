const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '../data/system.json');

// RAM Üzerinde Saklanacak Önbellek (Cache)
let systemCache = null;

// Dosyayı belleğe yükleyen yardımcı fonksiyon (Sadece ilk açılışta veya yenilemede çalışır)
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
    /**
     * Önbelleği zorunlu olarak yeniler.
     * system.json el ile değiştirilirse veya oyun içi bir admin komutuyla güncellenirse çağrılır.
     */
    reload: () => {
        loadCache();
    },

    get: (category, key) => {
        // Eğer bellek boşsa ilk seferlik diski oku, sonra tamamen RAM'den devam et
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