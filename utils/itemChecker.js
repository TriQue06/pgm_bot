const { loadJson } = require("./dataManager");
const cfg = require("./configLoader");

module.exports = {
    exists: (targetKey) => {
        if (!targetKey) return null;
        const cleanKey = targetKey.toLowerCase();

        const currencyData = cfg.getRaw("currencies", cleanKey);
        if (currencyData) return { type: "currency", name: currencyData.name, key: cleanKey };

        const crateData = cfg.getRaw("crates", cleanKey);
        if (crateData) return { type: "crate", name: crateData.name, key: cleanKey };

        const kitData = cfg.getRaw("kits", cleanKey);
        if (kitData) return { type: "kit", name: kitData.name, key: cleanKey };

        return null;
    }
};