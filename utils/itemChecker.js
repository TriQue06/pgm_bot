const cfg = require("./configLoader");

module.exports = {
    exists: (targetKey) => {
        if (!targetKey) return null;
        const cleanKey = targetKey.toLowerCase();

        const allCurrencies = cfg.getAll("currencies") || {};
        const allCrates = cfg.getAll("crates") || {};
        const allKits = cfg.getAll("kits") || {};

        const currencyData = allCurrencies[cleanKey];
        if (currencyData) {
            const emojiStr = currencyData.emoji ? `${currencyData.emoji} ` : "";
            return {
                type: "currency",
                name: `**${emojiStr}${currencyData.name || cleanKey}**`,
                key: cleanKey
            };
        }

        const crateData = allCrates[cleanKey];
        if (crateData) {
            const emojiStr = crateData.emoji ? `${crateData.emoji} ` : "";
            return {
                type: "crate",
                name: `**${emojiStr}${crateData.name || cleanKey}**`,
                key: cleanKey
            };
        }

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