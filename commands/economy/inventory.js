const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");
const cfg = require("../../utils/configLoader");

module.exports = {
    name: "envanter",
    aliases: ["e", "inv", "profile"],
    async execute(client, msg, args) {
        const user = msg.mentions.users.first() || msg.author;
        const data = loadJson("data.json");
        ensureUser(data, user.id);
        const p = data[user.id];

        const ui = cfg.getAll("inventory_ui");
        const currencies = cfg.getAll("currencies") || {};

        // Cüzdan Alanı (Yan yana pgmcoin ve elmas formatı)
        const walletParts = Object.entries(currencies).map(([k, v]) => {
            return `${v.emoji} **${v.name}**: \`${p[k] || 0}\``;
        });
        const walletText = walletParts.join("    ") || "_Bakiye bulunmuyor._";

        // Kasalar Alanı
        const crateText = Object.entries(cfg.getAll("crates"))
            .filter(([k]) => p.crates && p.crates[k] > 0)
            .map(([k, v]) => `${v.emoji} **${v.name}**: \`${p.crates[k]}\``)
            .join("\n") || "_Hiç kasan yok._";

        // Kitler Alanı (Yan yana listeleme formatı)
        const kitText = Object.entries(cfg.getAll("kits"))
            .filter(([k]) => p.kits && p.kits[k] > 0)
            .map(([k, v]) => `${v.emoji} **${v.name}**: \`${p.kits[k]}\``)
            .join("    ") || "_Hiç kitin yok._";

        // Normal Metin Tasarımı
        const responseText = [
            `## ◈━━━ ${ui.cuzdan?.emoji || ""} ${user.username} Envanteri ━━━◈`,
            walletText,
            `### ${ui.envanterkasa?.emoji || ""} ${ui.envanterkasa?.name || "Kasalar"}`,
            crateText,
            `### ${ui.canta?.emoji || ""} ${ui.canta?.name || "Kitler"}`,
            kitText
        ].join("\n");

        await msg.channel.send({ content: responseText }).catch(() => {});
    }
};