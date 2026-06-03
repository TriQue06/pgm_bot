const cfg = require("./configLoader");

module.exports = {
    exists: (targetKey) => {
        if (!targetKey) return null;
        const cleanKey = targetKey.toLowerCase();

        // Para Birimleri Kontrolü
        const currencyData = cfg.getRaw("currencies", cleanKey);
        if (currencyData) {
            return {
                type: "currency",
                name: `**${cfg.get("currencies", cleanKey)}**`,
                key: cleanKey
            };
        }

        // Kasalar Kontrolü
        const crateData = cfg.getRaw("crates", cleanKey);
        if (crateData) {
            return {
                type: "crate",
                name: `**${cfg.get("crates", cleanKey)}**`,
                key: cleanKey
            };
        }

        // Kitler Kontrolü
        const kitData = cfg.getRaw("kits", cleanKey);
        if (kitData) {
            return {
                type: "kit",
                name: `**${cfg.get("kits", cleanKey)}**`,
                key: cleanKey
            };
        }

        return null;
    }
};