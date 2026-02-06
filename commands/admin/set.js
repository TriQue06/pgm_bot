const { PermissionFlagsBits } = require("discord.js");
const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");

const CURRENCIES = ["pgmcoin", "ruby", "diamond", "crystal"];

module.exports = {
    name: "!set",
    aliases: ["!ayarla", "!sabitle"],
    description: "Kullanıcının bakiyesini veya eşyasını direkt ayarlar.",
    execute(client, msg, args) {
        // 1. Yetki Kontrolü
        if (!msg.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return msg.reply("❌ Bu komut için yetkin yok.");
        }

        const user = msg.mentions.users.first();
        const amount = parseInt(args[1]);
        const target = args[2]?.toLowerCase();

        // 2. Argüman Kontrolü
        if (!user || isNaN(amount) || !target) {
            return msg.reply("Kullanım: `!set @user <yeni_miktar> <birim_adi>`\nÖrnek: `!set @Baris 5000 pgmcoin` (Direkt 5000 yapar)");
        }

        const data = loadJson("data.json");
        const market = loadJson("market.json");
        ensureUser(data, user.id);

        // 3. İŞLEM MANTIĞI
        if (CURRENCIES.includes(target)) {
            // A) Para Birimi Ayarlama (= operatörü)
            data[user.id][target] = amount;
            
            // Negatif sayı girildiyse 0 yap
            if (data[user.id][target] < 0) data[user.id][target] = 0;

            saveJson("data.json", data);
            msg.reply(`✅ ${user.username} kullanıcısının **${target}** bakiyesi **${amount}** olarak ayarlandı.`);

        } else {
            // B) Kit Ayarlama
            if (!market[target]) {
                return msg.reply(`❌ **${target}** adında geçerli bir kit bulunamadı!`);
            }

            // Eğer 0 veya daha az girildiyse direkt sil, yoksa eşitle
            if (amount <= 0) {
                delete data[user.id].kits[target];
                saveJson("data.json", data);
                msg.reply(`✅ ${user.username} kullanıcısının **${target}** kiti silindi (0landı).`);
            } else {
                data[user.id].kits[target] = amount;
                saveJson("data.json", data);
                msg.reply(`✅ ${user.username} kullanıcısının **${target}** miktarı **${amount}** adet olarak ayarlandı.`);
            }
        }
    }
};