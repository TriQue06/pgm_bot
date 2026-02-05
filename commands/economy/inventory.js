const { EmbedBuilder } = require("discord.js");
const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");

// Emojiler (Senin verdiğin ID'ler)
const EMOJIS = {
    pgmcoin: "<:pgmcoin:1469015534493368442>",
    ruby: "<:ruby:1469015535911178280>",
    diamond: "<:diamond:1469015532836491274>",
    crystal: "<:crystal:1469015530760569058>",
    kit: "<:kit:1469016921478266880>",
    cuzdan: "<:cuzdan:1469017634950480097>",
    canta: "<:canta:1469018374930698240>"
};

module.exports = {
    name: "!envanter",
    aliases: ["!inv", "!canta", "!profile", "!e"],
    description: "Kullanıcının bakiyesini ve kitlerini gösterir.",
    execute(client, msg, args) {
        const user = msg.mentions.users.first() || msg.author;
        const data = loadJson("data.json");
        
        ensureUser(data, user.id);
        saveJson("data.json", data);

        const p = data[user.id];

        // Kit Listesi Hazırlama
        const kitList = Object.entries(p.kits).length > 0
            ? Object.entries(p.kits)
                .map(([k, v]) => `${EMOJIS.kit} **${k}** (x${v})`)
                .join("\n")
            : "_Çantanız boş._";

        // Cüzdan Listesi Hazırlama (İstediğin Sıralama)
        const walletList = [
            `${EMOJIS.pgmcoin} **PGM Coin:** ${p.pgmcoin}`,
            `${EMOJIS.ruby} **Yakut:** ${p.ruby}`,
            `${EMOJIS.diamond} **Elmas:** ${p.diamond}`,
            `${EMOJIS.crystal} **Kristal:** ${p.crystal}`
        ].join("\n");

        const embed = new EmbedBuilder()
            .setColor(0x2B2D31) // Koyu Gri
            .setAuthor({ name: `${user.username} Envanteri`, iconURL: user.displayAvatarURL() })
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                // Bölüm 1: Cüzdan
                { 
                    name: `${EMOJIS.cuzdan} Cüzdan`, 
                    value: walletList, 
                    inline: false 
                },
                // Bölüm 2: Kitler
                { 
                    name: `${EMOJIS.canta} Kitler`, 
                    value: kitList, 
                    inline: false 
                }
            )
            .setFooter({ text: "PGM Economy", iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        msg.channel.send({ embeds: [embed] });
    }
};