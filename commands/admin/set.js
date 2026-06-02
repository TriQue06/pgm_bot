const { PermissionFlagsBits } = require("discord.js");
const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");

module.exports = {
    name: "set",
    aliases: ["ayarla"],
    execute(client, msg, args) {
        const system = loadJson("system.json");
        const prices = loadJson("prices.json");

        const check = system["check"]?.emoji || "✅";
        const negative = system["negative"]?.emoji || "❌";

        if (!msg.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return msg.reply(`${negative} Bu komut için yetkin yok.`);
        }

        const user = msg.mentions.users.first();
        const amount = parseInt(args[1]);
        const targetKey = args[2]?.toLowerCase();

        if (!user || isNaN(amount) || !targetKey) {
            return msg.reply(`${negative} **Kullanım:** \`!set @user <miktar> <öge_adı>\``);
        }

        const isCurrency = system[targetKey] && system[targetKey].currency === true;
        const itemInfo = prices[targetKey];

        if (!isCurrency && !itemInfo) {
            return msg.reply(`${negative} **${targetKey}** adında geçerli bir birim, kit veya kasa bulunamadı.`);
        }

        const data = loadJson("data.json");
        ensureUser(data, user.id);
        const p = data[user.id];

        if (isCurrency) {
            p[targetKey] = amount < 0 ? 0 : amount;
        } else if (itemInfo.type === "crate") {
            if (!p.crates) p.crates = {};
            if (amount <= 0) delete p.crates[targetKey];
            else p.crates[targetKey] = amount;
        } else if (itemInfo.type === "kit") {
            if (!p.kits) p.kits = {};
            if (amount <= 0) delete p.kits[targetKey];
            else p.kits[targetKey] = amount;
        }

        saveJson("data.json", data);

        const displayEmoji = isCurrency ? (system[targetKey]?.emoji || "🪙") : (itemInfo?.emoji || "📦");
        const displayName = isCurrency ? (system[targetKey]?.name || targetKey.toUpperCase()) : (itemInfo?.name || targetKey.toUpperCase());

        if (amount <= 0 && !isCurrency) {
            msg.reply(`${check} **${user.username}** kullanıcısının **${displayEmoji} ${displayName}** ögeleri sıfırlandı.`);
        } else {
            msg.reply(`${check} **${user.username}** kullanıcısının **${displayEmoji} ${displayName}** miktarı **${amount}** olarak ayarlandı.`);
        }
    }
};