const { EmbedBuilder } = require("discord.js");
const { loadJson } = require("../../utils/dataManager");
const cfg = require("../../utils/configLoader"); // CFG yapısı eklendi

module.exports = {
    name: "market",
    aliases: ["shop", "m"],
    description: "Marketteki tüm ürünleri dinamik olarak listeler.",
    execute(client, msg, args) {
        const prices = loadJson("prices.json");

        let cratesText = "";
        let kitsText = "";

        // Tüm ürünleri dönerek listeyi oluştur
        for (const [key, item] of Object.entries(prices)) {
            // Emojiler tamamen kaldırıldı, sadece metin verisi kullanılıyor
            const currencyName = cfg.getRaw("currencies", item.currency)?.name || item.currency;
            const row = `- **${item.name}** \`${key}\` // **${item.price} ${currencyName}**\n`;

            if (item.type === "crate") cratesText += row;
            if (item.type === "kit") kitsText += row;
        }

        const embed = new EmbedBuilder()
            .setColor(0x00AE86)
            .setTitle("PGM BOT // Market Mağazası")
            .setDescription("Sistemdeki güncel fiyatlar ve satın alma kodları aşağıdadır.\nSatın almak için: `!satınal <ürün_kodu>`")
            .addFields(
                { name: "Kasalar", value: cratesText || "_Şu an satılık kasa bulunmuyor._", inline: false },
                { name: "Turnuva Kitleri", value: kitsText || "_Şu an satılık kit bulunmuyor._", inline: false }
            )
            .setFooter({ text: "PGM Mağaza Sistemi" })
            .setTimestamp();

        msg.reply({ embeds: [embed] });
    }
};