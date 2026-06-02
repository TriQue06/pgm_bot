const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");

module.exports = {
    name: "gönder",
    aliases: ["gonder", "transfer", "send"],
    execute(client, msg, args) {
        const system = loadJson("system.json");
        const prices = loadJson("prices.json");

        const check = system["check"]?.emoji || "✅";
        const negative = system["negative"]?.emoji || "❌";

        const recipient = msg.mentions.users.first();
        const amount = parseInt(args[1]);
        const targetKey = args[2]?.toLowerCase();

        // Temel Girdi Kontrolleri
        if (!recipient || isNaN(amount) || !targetKey || amount <= 0) {
            return msg.reply(`${negative} **Kullanım:** \`!gönder @kullanıcı <miktar> <öge_kodu>\`\n*Örnek: !gönder @Eros 10 pgmcoin*`);
        }

        if (recipient.id === msg.author.id) {
            return msg.reply(`${negative} Kendine öge transfer edemezsin.`);
        }

        if (recipient.bot) {
            return msg.reply(`${negative} Botlara öge transfer edemezsin.`);
        }

        const data = loadJson("data.json");
        ensureUser(data, msg.author.id);
        ensureUser(data, recipient.id);

        const sender = data[msg.author.id];
        const receiver = data[recipient.id];

        // 1. Durum: Sabit Para Birimleri Transferi (pgmcoin, cevher, elmas)
        if (targetKey === "pgmcoin" || targetKey === "cevher" || targetKey === "elmas") {
            if ((sender[targetKey] || 0) < amount) {
                const currencyEmoji = system[targetKey]?.emoji || "🪙";
                return msg.reply(`${negative} Hesabında yeterli bakiye yok!`);
            }

            sender[targetKey] -= amount;
            receiver[targetKey] = (receiver[targetKey] || 0) + amount;

            saveJson("data.json", data);
            const coinEmoji = system[targetKey]?.emoji || "🪙";
            return msg.reply(`${check} **${recipient.username}** kişisine **${amount} adet** ${coinEmoji} **${targetKey.toUpperCase()}** transfer edildi.`);
        }

        // 2. Durum: prices.json içindeki Kit ve Kasaların Transferi
        const itemInfo = prices[targetKey];
        if (!itemInfo) {
            return msg.reply(`${negative} **${targetKey}** adında geçerli bir para birimi, kit veya kasa bulunamadı.`);
        }

        if (itemInfo.type === "crate") {
            if (!sender.crates || !sender.crates[targetKey] || sender.crates[targetKey] < amount) {
                return msg.reply(`${negative} Envanterinde yeterli **${itemInfo.emoji || "📦"} ${itemInfo.name}** bulunmuyor!`);
            }
            sender.crates[targetKey] -= amount;
            if (sender.crates[targetKey] <= 0) delete sender.crates[targetKey];

            if (!receiver.crates) receiver.crates = {};
            receiver.crates[targetKey] = (receiver.crates[targetKey] || 0) + amount;
        }
        else if (itemInfo.type === "kit") {
            if (!sender.kits || !sender.kits[targetKey] || sender.kits[targetKey] < amount) {
                return msg.reply(`${negative} Envanterinde yeterli **${itemInfo.emoji || "⚔️"} ${itemInfo.name}** kiti bulunmuyor!`);
            }
            sender.kits[targetKey] -= amount;
            if (sender.kits[targetKey] <= 0) delete sender.kits[targetKey];

            if (!receiver.kits) receiver.kits = {};
            receiver.kits[targetKey] = (receiver.kits[targetKey] || 0) + amount;
        }

        saveJson("data.json", data);
        msg.reply(`${check} **${recipient.username}** kişisine **${amount} adet** ${itemInfo.emoji || "📦"} **${itemInfo.name}** başarıyla transfer edildi.`);
    }
};