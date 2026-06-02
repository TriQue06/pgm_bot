const { EmbedBuilder } = require("discord.js");
const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");

module.exports = {
    name: "envanter",
    aliases: ["e", "inv", "profile"],
    execute(client, msg, args) {
        const user = msg.mentions.users.first() || msg.author;
        const data = loadJson("data.json");

        ensureUser(data, user.id);
        saveJson("data.json", data);

        const p = data[user.id];
        const system = loadJson("system.json");
        const prices = loadJson("prices.json");

        const cuzdanInfo = system["cuzdan"] || { name: "Cüzdan", emoji: "💳" };
        const cantaInfo = system["canta"] || { name: "Kitler", emoji: "⚔️" };
        const envKasaInfo = system["envanterkasa"] || { name: "Kasalar", emoji: "📦" };

        // 1. Dinamik Cüzdan Listesi
        let walletList = [];
        for (const [key, value] of Object.entries(system)) {
            if (value.currency === true) {
                const balance = p[key] || 0;
                walletList.push(`${value.emoji || "🪙"} **${value.name || key.toUpperCase()}**: ${balance}`);
            }
        }
        const walletText = walletList.join("\n") || "_Tanımlı para birimi bulunamadı._";

        // 2. Dinamik Kit Listesi
        const kitList = (p.kits && Object.entries(p.kits).length > 0)
            ? Object.entries(p.kits).map(([k, v]) => {
                const info = prices[k.toLowerCase()];
                return `${info?.emoji || "⚔️"} **${info?.name || k.toUpperCase()}** (x${v})`;
            }).join("\n")
            : "_Kit bulunmuyor._";

        // 3. Dinamik Kasa Listesi
        const crateList = (p.crates && Object.entries(p.crates).length > 0)
            ? Object.entries(p.crates).map(([k, v]) => {
                const info = prices[k.toLowerCase()];
                return `${info?.emoji || "📦"} **${info?.name || k.toUpperCase()}** (x${v})`;
            }).join("\n")
            : "_Kasa bulunmuyor._";

        const descriptionContent = `## ${cuzdanInfo.emoji} ${cuzdanInfo.name}\n${walletText}\n\n## ${envKasaInfo.emoji} ${envKasaInfo.name}\n${crateList}\n\n## ${cantaInfo.emoji} ${cantaInfo.name}\n${kitList}`;

        const embed = new EmbedBuilder()
            .setColor(0x2B2D31)
            .setAuthor({ name: `${user.username} Envanteri`, iconURL: user.displayAvatarURL() })
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setDescription(descriptionContent)
            .setFooter({ text: "PGM BOT" })
            .setTimestamp();

        msg.channel.send({ embeds: [embed] });
    }
};