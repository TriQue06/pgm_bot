const cfg = require("./configLoader");

module.exports = {
    exists: (targetKey) => {
        if (!targetKey) return null;
        const cleanKey = targetKey.toLowerCase();

        // Performans: Kategorilerin tamamını tek seferde RAM'e (belleğe) yüklüyoruz
        const allCurrencies = cfg.getAll("currencies") || {};
        const allCrates = cfg.getAll("crates") || {};
        const allKits = cfg.getAll("kits") || {};

        // 1. Para Birimleri Kontrolü (Bellekten)
        const currencyData = allCurrencies[cleanKey];
        if (currencyData) {
            // system.json yapındaki emoji ve name alanlarını tam standart kalınlıkta birleştiriyoruz
            const emojiStr = currencyData.emoji ? `${currencyData.emoji} ` : "";
            return {
                type: "currency",
                name: `**${emojiStr}${currencyData.name || cleanKey}**`,
                key: cleanKey
            };
        }

        // 2. Kasalar Kontrolü (Bellekten)
        const crateData = allCrates[cleanKey];
        if (crateData) {
            const emojiStr = crateData.emoji ? `${crateData.emoji} ` : "";
            return {
                type: "crate",
                name: `**${emojiStr}${crateData.name || cleanKey}**`,
                key: cleanKey
            };
        }

        // 3. Kitler Kontrolü (Bellekten)
        const kitData = allKits[cleanKey];
        if (kitData) {
            const emojiStr = kitData.emoji ? `${kitData.emoji} ` : "";
            return {
                type: "kit",
                name: `**${emojiStr}${kitData.name || cleanKey}**`,
                key: cleanKey
            };
        }

        return null;
    }
};