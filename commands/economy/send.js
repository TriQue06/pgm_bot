const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");

// Para birimleri listesi
const CURRENCIES = ["pgmcoin", "ruby", "diamond", "crystal"];

module.exports = {
    name: "!send",
    aliases: ["!gonder", "!transfer", "!yolla"],
    description: "Başka bir kullanıcıya para, kasa veya kit gönderir.",
    execute(client, msg, args) {
        // 1. KULLANIM KONTROLLERİ
        const recipient = msg.mentions.users.first();
        const amount = parseInt(args[1]);
        const target = args[2]?.toLowerCase(); // Gönderilecek şeyin adı

        if (!recipient || isNaN(amount) || !target || amount <= 0) {
            return msg.reply("Kullanım: `!send @kullanici <miktar> <birim_adi/kasa_adi/kit_adi>`\nÖrnek: `!send @Ahmet 100 pgmcoin` veya `!send @Mehmet 2 altinkasa`");
        }

        if (recipient.id === msg.author.id) {
            return msg.reply("❌ Kendine gönderim yapamazsın.");
        }

        if (recipient.bot) {
            return msg.reply("❌ Botlara gönderim yapamazsın.");
        }

        // 2. VERİLERİ YÜKLE
        const data = loadJson("data.json");
        const market = loadJson("market.json");
        const loot = loadJson("loot.json"); // Kasaları kontrol etmek için
        
        ensureUser(data, msg.author.id); // Gönderen
        ensureUser(data, recipient.id);  // Alan

        const senderData = data[msg.author.id];
        const recipientData = data[recipient.id];

        // 3. İŞLEM MANTIĞI VE KATEGORİ KONTROLÜ

        // --- A) PARA BİRİMİ GÖNDERME ---
        if (CURRENCIES.includes(target)) {
            // Bakiye Yeterli mi?
            if ((senderData[target] || 0) < amount) {
                return msg.reply(`❌ Yeterli **${target}** bakiyen yok! \nSenin Bakiyen: ${senderData[target] || 0}`);
            }

            // İşlem
            senderData[target] -= amount;
            recipientData[target] += amount;

            saveJson("data.json", data);
            msg.reply(`✅ **${recipient.username}** kişisine başarıyla **${amount} ${target}** gönderildi.\nKalan Bakiyen: ${senderData[target]} ${target}`);
        } 
        
        // --- B) KASA GÖNDERME (LOOT) ---
        else if (loot[target]) {
            // Gönderenin kasa verisi var mı?
            if (!senderData.crates || !senderData.crates[target] || senderData.crates[target] < amount) {
                return msg.reply(`❌ Envanterinde yeterli sayıda **${target}** yok!`);
            }

            // Gönderenden Düş
            senderData.crates[target] -= amount;
            if (senderData.crates[target] <= 0) delete senderData.crates[target];

            // Alıcıya Ekle
            if (!recipientData.crates) recipientData.crates = {};
            recipientData.crates[target] = (recipientData.crates[target] || 0) + amount;

            saveJson("data.json", data);
            msg.reply(`📦 **${recipient.username}** kişisine başarıyla **${amount} adet ${target}** gönderildi.`);
        }

        // --- C) KİT GÖNDERME (MARKET) ---
        else if (market[target]) {
            // Gönderenin kit verisi var mı?
            if (!senderData.kits || !senderData.kits[target] || senderData.kits[target] < amount) {
                return msg.reply(`❌ Envanterinde yeterli sayıda **${target}** kiti yok!`);
            }

            // Gönderenden Düş
            senderData.kits[target] -= amount;
            if (senderData.kits[target] <= 0) delete senderData.kits[target];

            // Alıcıya Ekle
            if (!recipientData.kits) recipientData.kits = {};
            recipientData.kits[target] = (recipientData.kits[target] || 0) + amount;

            saveJson("data.json", data);
            msg.reply(`🎒 **${recipient.username}** kişisine başarıyla **${amount} adet ${target}** kiti transfer edildi.`);
        } 
        
        // --- D) BULUNAMADI ---
        else {
            msg.reply(`❌ **${target}** adında gönderilebilir bir para birimi, kasa veya kit bulunamadı.`);
        }
    }
};