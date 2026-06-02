const { EmbedBuilder } = require("discord.js");
const { loadJson } = require("../../utils/dataManager");

module.exports = {
    name: "market",
    aliases: ["shop", "m"],
    description: "Marketteki tüm ürünleri dinamik olarak listeler.",
    execute(client, msg, args) {
        const system = loadJson("system.json");
        const prices = loadJson("prices.json");

        const marketEmoji = system["market"]?.emoji || "🛒";

        // Ürünleri türlerine göre ayıralım
        let cratesText = "";
        let kitsText = "";

        for (const [key, item] of Object.entries(prices)) {
            const currencyEmoji = system[item.currency]?.emoji || "🪙";
            const row = `- ${item.emoji || "📦"} **${item.name}** \`${key}\` // ${currencyEmoji} **${item.price} ${item.currency.toUpperCase()}**\n`;

            if (item.type === "crate") cratesText += row;
            if (item.type === "kit") kitsText += row;
        }

        const embed = new EmbedBuilder()
            .setColor(0x00AE86)
            .setTitle(`${marketEmoji} PGM BOT // Market Mağazası`)
            .setDescription("Sistemdeki güncel fiyatlar ve satın alma kodları aşağıdadır.\nSatın almak için: \`!satınal <ürün_kodu>\`")
            .addFields(
                { name: "📦 Kasalar", value: cratesText || "_Şu an satılık kasa bulunmuyor._", inline: false },
                { name: "⚔️ Turnuva Kitleri", value: kitsText || "_Şu an satılık kit bulunmuyor._", inline: false }
            )
            .setFooter({ text: "PGM Mağaza Sistemi" })
            .setTimestamp();

        msg.reply({ embeds: [embed] });
    }
};