const fs = require('fs');
const path = require('path');

const getJsonData = () => {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '../data/system.json'), 'utf8'));
};

module.exports = {
    get: (category, key) => {
        const data = getJsonData();
        if (!data[category] || !data[category][key]) return `[${category}.${key} Eksik!]`;

        const item = data[category][key];
        const emoji = item.emoji || "";
        const name = item.name || "";

        return `${emoji} ${name}`.trim();
    },

    getAll: (category) => {
        const data = getJsonData();
        return data[category] || {};
    },

    getRaw: (category, key) => {
        const data = getJsonData();
        return data[category] ? data[category][key] : null;
    }
};