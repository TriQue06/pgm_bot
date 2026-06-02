const { EmbedBuilder } = require("discord.js");
const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");

module.exports = {
    name: "katıl",
    aliases: ["katil", "join", "part", "katılımcılar", "katilimcilar"],
    description: "Turnuva kayıt işlemlerini ve katılımcı listesini yönetir.",
    execute(client, msg, args) {
        const system = loadJson("system.json");
        const prices = loadJson("prices.json");

        const check = system["check"]?.emoji || "";
        const negative = system["negative"]?.emoji || "";

        const triggerCommand = msg.content.slice(1).trim().split(/\s+/)[0].toLowerCase();

        if (["part", "katılımcılar", "katilimcilar"].includes(triggerCommand)) {
            const pData = loadJson("participants.json", { players: {} });
            const players = pData.players || {};

            const list = Object.entries(players)
                .map(([name, kit]) => {
                    const kitInfo = prices[kit.toLowerCase()];
                    // Emojisi yoksa default kılıç/kalkan basmaz, boş bırakır
                    const displayKit = kitInfo ? `${kitInfo.emoji || ""} ${kitInfo.name}` : `${kit.toUpperCase()}`;
                    return `• **${name}** ➔ ${kit === "yok" ? "_Kitsiz_" : displayKit}`;
                })
                .join("\n") || "_Henüz turnuvaya katılan aktif bir oyuncu yok._";

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle("PGM Turnuvası // Güncel Katılımcı Listesi")
                .setDescription(list)
                .setFooter({ text: `Toplam Oyuncu: ${Object.keys(players).length}` })
                .setTimestamp();

            return msg.reply({ embeds: [embed] });
        }

        const statusData = loadJson("tournament_status.json", { tournamentActive: false });
        if (!statusData.tournamentActive) {
            return msg.reply(`${negative} **Şu anda aktif bir turnuva kaydı bulunmuyor!**`);
        }

        const mcName = args[0];
        const kitChoice = args[1]?.toLowerCase();

        if (!mcName || !kitChoice) {
            return msg.reply(`${negative} **Doğru Kullanım:** \`!katıl <Minecraft_Adı> <kit_adı>\` ya da \`!katıl <Minecraft_Adı> yok\``);
        }

        const data = loadJson("data.json");
        const pData = loadJson("participants.json", { players: {} });
        if (!pData.players) pData.players = {};

        const isMcRegistered = pData.players[mcName] !== undefined;
        const isDiscordRegistered = Object.values(pData.players).some(p => p.discordId === msg.author.id);

        if (isMcRegistered || isDiscordRegistered) {
            return msg.reply(`${negative} **Turnuvaya zaten kayıtlısın!**`);
        }

        ensureUser(data, msg.author.id);
        const p = data[msg.author.id];

        let finalKitDisplay = "Kitsiz (Ekipmansız)";
        let finalKitEmoji = ""; // Default kalkan silindi

        if (kitChoice !== "yok") {
            const itemInfo = prices[kitChoice];

            if (!itemInfo || itemInfo.type !== "kit") {
                return msg.reply(`${negative} **Geçersiz kit adı!**`);
            }

            if (!p.kits || !p.kits[kitChoice] || p.kits[kitChoice] <= 0) {
                return msg.reply(`${negative} Envanterinde **${itemInfo.emoji || ""} ${itemInfo.name}** kiti bulunmuyor!`);
            }

            p.kits[kitChoice] -= 1;
            if (p.kits[kitChoice] <= 0) delete p.kits[kitChoice];

            finalKitDisplay = itemInfo.name;
            finalKitEmoji = itemInfo.emoji || "";
            pData.players[mcName] = kitChoice;
        } else {
            pData.players[mcName] = "yok";
        }

        saveJson("data.json", data);
        saveJson("participants.json", pData);

        msg.reply(`${check} **${mcName}** turnuvaya ${finalKitEmoji} **${finalKitDisplay}** seçimiyle katıldı.`);
    }
};