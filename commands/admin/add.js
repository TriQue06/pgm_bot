const { PermissionFlagsBits } = require("discord.js");
const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");

const CURRENCIES = ["pgmcoin", "ruby", "diamond", "crystal"];

module.exports = {
    name: "!add",
    aliases: ["!ekle", "!ver"],
    description: "Kullanıcının bakiyesine veya eşyasına ekleme/çıkarma yapar.",
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
            return msg.reply("Kullanım: `!add @user <miktar> <birim_adi>`\nÖrnek: `!add @Baris 100 pgmcoin` veya `!add @Baris -50 ruby`");
        }

        const data = loadJson("data.json");
        const market = loadJson("market.json");
        ensureUser(data, user.id);

        // 3. İŞLEM MANTIĞI
        if (CURRENCIES.includes(target)) {
            // A) Para Birimi Ekleme/Çıkarma
            data[user.id][target] += amount;
            
            // Para eksiye düşerse 0'a eşitle (İsteğe bağlı, borç olsun istersen bu satırı sil)
            if (data[user.id][target] < 0) data[user.id][target] = 0;

            saveJson("data.json", data);
            msg.reply(`✅ ${user.username} kullanıcısının bakiyesine **${amount} ${target}** eklendi.\nGüncel: ${data[user.id][target]}`);

        } else {
            // B) Kit Ekleme
            if (!market[target]) {
                return msg.reply(`❌ **${target}** adında geçerli bir kit bulunamadı!`);
            }

            data[user.id].kits[target] = (data[user.id].kits[target] || 0) + amount;

            // Eğer miktar 0 veya altına düştüyse envanterden sil
            if (data[user.id].kits[target] <= 0) {
                delete data[user.id].kits[target];
            }

            saveJson("data.json", data);
            msg.reply(`✅ ${user.username} envanterine **${amount} adet ${target}** eklendi/çıkarıldı.`);
        }
    }
};