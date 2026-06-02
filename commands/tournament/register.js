const { EmbedBuilder } = require("discord.js");
const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");

module.exports = {
    name: "katıl",
    aliases: ["katil", "join", "part", "katılımcılar", "katilimcilar"],
    description: "Turnuva kayıt işlemlerini ve katılımcı listesini yönetir.",
    execute(client, msg, args) {
        const system = loadJson("system.json");
        const prices = loadJson("prices.json");

        const check = system["check"]?.emoji || "✅";
        const negative = system["negative"]?.emoji || "❌";

        // Kullanıcı komutu tetiklerken !part veya !katılımcılar yazdıysa LİSTELEME moduna geç
        const triggerCommand = msg.content.slice(1).trim().split(/\s+/)[0].toLowerCase();

        if (["part", "katılımcılar", "katilimcilar"].includes(triggerCommand)) {
            const pData = loadJson("participants.json", { players: {} });
            const players = pData.players || {};

            const list = Object.entries(players)
                .map(([name, kit]) => {
                    // prices.json içinden kitin emojisini ve ismini bul, yoksa ham halini yaz
                    const kitInfo = prices[kit.toLowerCase()];
                    const displayKit = kitInfo ? `${kitInfo.emoji} ${kitInfo.name}` : `🛡️ ${kit.toUpperCase()}`;
                    return `• **${name}** ➔ ${kit === "yok" ? "_Kitsiz_" : displayKit}`;
                })
                .join("\n") || "_Henüz turnuvaya katılan aktif bir oyuncu yok._";

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle("⚔️ PGM Turnuvası // Güncel Katılımcı Listesi")
                .setDescription(list)
                .setFooter({ text: `Toplam Oyuncu: ${Object.keys(players).length}` })
                .setTimestamp();

            return msg.reply({ embeds: [embed] });
        }

        // --- BURADAN SONRASI !KATIL / !JOIN MODUDUR ---

        // KURAL 5 KONTROLÜ: Turnuva şalteri açık mı?
        const statusData = loadJson("tournament_status.json", { tournamentActive: false });
        if (!statusData.tournamentActive) {
            return msg.reply(`${negative} **Şu anda aktif bir turnuva kaydı bulunmuyor!** Lütfen moderatörlerin turnuva kayıtlarını açmasını bekleyin.`);
        }

        const mcName = args[0];
        const kitChoice = args[1]?.toLowerCase();

        // Girdi Kontrolü
        if (!mcName || !kitChoice) {
            return msg.reply(`${negative} **Doğru Kullanım:** \`!katıl <Minecraft_Adı> <kit_adı>\` ya da \`!katıl <Minecraft_Adı> yok\``);
        }

        const data = loadJson("data.json");
        const pData = loadJson("participants.json", { players: {} });
        if (!pData.players) pData.players = {};

        // KURAL 2: Çift Kayıt Engeli (Minecraft adına göre kontrol)
        // Eğer bu Minecraft adı veya bu Discord ID zaten kayıtlıysa engelle
        const isMcRegistered = pData.players[mcName] !== undefined;
        const isDiscordRegistered = Object.values(pData.players).some(p => p.discordId === msg.author.id);

        if (isMcRegistered || isDiscordRegistered) {
            return msg.reply(`${negative} **Turnuvaya zaten kayıtlısın!** Aynı hesaptan veya aynı Minecraft adıyla tekrar katılamazsın.`);
        }

        ensureUser(data, msg.author.id);
        const p = data[msg.author.id];

        let finalKitDisplay = "Kitsiz (Ekipmansız)";
        let finalKitEmoji = "🛡️";

        // Kullanıcı kitli katılmak istiyorsa
        if (kitChoice !== "yok") {
            const itemInfo = prices[kitChoice];

            if (!itemInfo || itemInfo.type !== "kit") {
                return msg.reply(`${negative} **Geçersiz kit adı!** Geçerli kitler: \`altinkalp\`, \`madenci\`, \`yagmaci\`, \`nisanci\`. Kitsiz girmek için \`yok\` yazabilirsin.`);
            }

            // Envanter kontrolü
            if (!p.kits || !p.kits[kitChoice] || p.kits[kitChoice] <= 0) {
                return msg.reply(`${negative} Envanterinde **${itemInfo.emoji || "⚔️"} ${itemInfo.name}** kiti bulunmuyor! Önce marketten satın almalısın.`);
            }

            // KURAL 3: Kit Tüketimi (Kalıcı olarak düşme)
            p.kits[kitChoice] -= 1;
            if (p.kits[kitChoice] <= 0) delete p.kits[kitChoice];

            finalKitDisplay = itemInfo.name;
            finalKitEmoji = itemInfo.emoji || "⚔️";

            // Plugin veri yapısına uygun ham kaydet (Örn: "madenci")
            pData.players[mcName] = kitChoice;
        } else {
            // Kitsiz katılım durumu
            pData.players[mcName] = "yok";
        }

        // Discord ID'yi içerde bir yerde eşleştirmek istersen yedek bilgi (Plugin sadece anahtarları okur)
        // Eğer pluginin bozulmasından korkuyorsan alttaki satırı silebilirsin, ama çift kayıt koruması için gereklidir.
        // Biz direkt ham yapıyı korumak adına plugin için pData.players[mcName] = kitChoice şeklinde bıraktık.

        saveJson("data.json", data);
        saveJson("participants.json", pData);

        msg.reply(`${check} 🎮 **Turnuva kaydın başarıyla oluşturuldu!**\n• **Minecraft:** \`${mcName}\`\n• **Seçilen Durum:** ${finalKitEmoji} **${finalKitDisplay}**\n*(Seçtiğin kit envanterinden kalıcı olarak düşüldü ve turnuvaya aktarıldı!)*`);
    }
};