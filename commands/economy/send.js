const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");
const cfg = require("../../utils/configLoader");
const itemChecker = require("../../utils/itemChecker");

module.exports = {
    name: "gönder",
    aliases: ["gonder", "transfer", "send"],
    execute(client, msg, args) {
        const ui = cfg.getAll("ui");
        const check = ui.check?.emoji || "[BAŞARILI]";
        const negative = ui.negative?.emoji || "[HATA]";

        const recipient = msg.mentions.users.first();
        const targetKey = args[1]?.toLowerCase();
        const amount = parseInt(args[2]);

        if (!recipient || !targetKey || isNaN(amount) || amount <= 0) {
            return msg.reply(`${negative} **Kullanım:** \`!gönder @kullanıcı <eşya_kodu> <miktar>\``);
        }

        if (recipient.id === msg.author.id) {
            return msg.reply(`${negative} Kendine öge transfer edemezsin.`);
        }

        if (recipient.bot) {
            return msg.reply(`${negative} Botlara öge transfer edemezsin.`);
        }

        const item = itemChecker.exists(targetKey);
        if (!item) {
            return msg.reply(`${negative} **${targetKey}** adında geçerli bir para birimi, kit veya kasa bulunamadı.`);
        }

        const data = loadJson("data.json");
        ensureUser(data, msg.author.id);
        ensureUser(data, recipient.id);

        const sender = data[msg.author.id];
        const receiver = data[recipient.id];

        if (item.type === "currency") {
            if ((sender[item.key] || 0) < amount) {
                return msg.reply(`${negative} Hesabında yeterli bakiye yok!`);
            }

            sender[item.key] -= amount;
            receiver[item.key] = (receiver[item.key] || 0) + amount;
        } else {
            const container = item.type === "crate" ? "crates" : "kits";

            if (!sender[container] || !sender[container][item.key] || sender[container][item.key] < amount) {
                return msg.reply(`${negative} Envanterinde yeterli **${item.name}** bulunmuyor!`);
            }

            sender[container][item.key] -= amount;
            if (sender[container][item.key] <= 0) delete sender[container][item.key];

            if (!receiver[container]) receiver[container] = {};
            receiver[container][item.key] = (receiver[container][item.key] || 0) + amount;
        }

        saveJson("data.json", data);
        msg.reply(`${check} **${recipient.username}** kişisine **${amount} adet** **${item.name}** başarıyla transfer edildi.`);
    }
};