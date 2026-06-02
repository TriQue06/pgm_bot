const { PermissionFlagsBits } = require("discord.js");
const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");
const itemChecker = require("../../utils/itemChecker");

module.exports = {
    name: "admin",
    aliases: ["add", "set", "ekle", "ayarla"],
    execute(client, msg, args) {
        if (!msg.member.permissions.has(PermissionFlagsBits.ManageGuild)) return;

        const commandName = msg.content.split(" ")[0].slice(1).toLowerCase();

        const isAdd = ["add", "ekle"].includes(commandName);
        const subCommand = isAdd ? "add" : "set";

        const user = msg.mentions.users.first();
        const targetKey = args[1]?.toLowerCase();
        const amount = parseInt(args[2]);

        if (!user || !targetKey || isNaN(amount)) {
            return msg.reply(`Kullanım: !${commandName} @kullanıcı eşya miktar`);
        }

        const item = itemChecker.exists(targetKey);
        if (!item) return msg.reply("[HATA] Geçersiz eşya veya öge kodu.");

        const data = loadJson("data.json");
        ensureUser(data, user.id);
        const p = data[user.id];

        if (item.type === "currency") {
            p[item.key] = subCommand === "add" ? (p[item.key] || 0) + amount : amount;
            if (p[item.key] < 0) p[item.key] = 0;
        } else {
            const container = item.type === "crate" ? "crates" : "kits";
            if (!p[container]) p[container] = {};

            p[container][item.key] = subCommand === "add"
                ? (p[container][item.key] || 0) + amount
                : amount;

            if (p[container][item.key] <= 0) delete p[container][item.key];
        }

        saveJson("data.json", data);
        msg.reply(`[BAŞARILI] **${user.username}** kullanıcısının ${item.name} bilgisi güncellendi.`);
    }
};