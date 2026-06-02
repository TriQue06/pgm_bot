const { PermissionFlagsBits } = require("discord.js");
const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");

module.exports = {
    name: "add",
    aliases: ["ekle", "give"],
    async execute(client, msg, args) {
        const system = loadJson("system.json");
        const prices = loadJson("prices.json");

        const langCheck = system["check"]?.emoji || "✅";
        const langNegative = system["negative"]?.emoji || "❌";

        if (!msg.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return msg.reply(`${langNegative} Bu komut için yetkin yok.`);
        }

        const isEveryone = msg.mentions.everyone || args[0] === "@everyone" || args[0] === "everyone";
        const user = msg.mentions.users.first();
        const amount = parseInt(args[1]);
        const targetKey = args[2]?.toLowerCase();

        if ((!user && !isEveryone) || isNaN(amount) || !targetKey) {
            return msg.reply(`${langNegative} **Kullanım:** \`!add @user/everyone <miktar> <öge_adı>\``);
        }

        const isCurrency = system[targetKey] && system[targetKey].currency === true;
        const itemInfo = prices[targetKey];

        if (!isCurrency && !itemInfo) {
            return msg.reply(`${langNegative} **${targetKey}** adında geçerli bir birim, kit veya kasa bulunamadı!`);
        }

        const data = loadJson("data.json");
        let targetIds = isEveryone ? (await msg.guild.members.fetch()).filter(m => !m.user.bot).map(m => m.user.id) : [user.id];

        targetIds.forEach(id => {
            ensureUser(data, id);
            const p = data[id];

            if (isCurrency) {
                p[targetKey] = (p[targetKey] || 0) + amount;
                if (p[targetKey] < 0) p[targetKey] = 0;
            } else if (itemInfo.type === "crate") {
                if (!p.crates) p.crates = {};
                p.crates[targetKey] = (p.crates[targetKey] || 0) + amount;
                if (p.crates[targetKey] <= 0) delete p.crates[targetKey];
            } else if (itemInfo.type === "kit") {
                if (!p.kits) p.kits = {};
                p.kits[targetKey] = (p.kits[targetKey] || 0) + amount;
                if (p.kits[targetKey] <= 0) delete p.kits[targetKey];
            }
        });

        saveJson("data.json", data);

        const targetDisplayName = isEveryone ? "@everyone" : `**${user.username}**`;
        const displayEmoji = isCurrency ? (system[targetKey]?.emoji || "🪙") : (itemInfo?.emoji || "📦");
        const displayName = isCurrency ? (system[targetKey]?.name || targetKey.toUpperCase()) : (itemInfo?.name || targetKey.toUpperCase());

        msg.reply(`${langCheck} ${targetDisplayName} için **${Math.abs(amount)} adet** ${displayEmoji} **${displayName}** ${amount >= 0 ? "eklendi" : "çıkarıldı"}.`);
    }
};