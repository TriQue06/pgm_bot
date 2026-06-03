const { EmbedBuilder } = require("discord.js");
const { loadJson } = require("../../utils/dataManager");
const cfg = require("../../utils/configLoader");
const itemChecker = require("../../utils/itemChecker");

module.exports = {
    name: "market",
    aliases: ["shop", "m"],
    description: "Marketteki tüm ürünleri dinamik olarak listeler.",
    execute(client, msg, args) {
        const prices = loadJson("prices.json");
        const ui = cfg.getAll("ui");
        const check = ui.check?.emoji || "";

        let cratesText = "";
        let kitsText = "";

        for (const [key, item] of Object.entries(prices)) {
            const res = itemChecker.exists(key);
            if (!res) continue;

            // Fiyat biriminin ham (raw) datasına erişerek emoji ve ismi ayırıyoruz
            const currencyData = cfg.getRaw("currencies", item.currency);
            const currencyEmoji = currencyData?.emoji || "";
            const currencyName = currencyData?.name || item.currency;

            // Sıralama: [Emoji] [**Bedel**] [**Birim İsmi**]
            const row = `- ${res.name} \`${key}\` → ${currencyEmoji} **${item.price}** **${currencyName}**\n`;

            if (res.type === "crate") cratesText += row;
            if (res.type === "kit") kitsText += row;
        }

        const embed = new EmbedBuilder()
            .setColor(0x2B2D31)
            .setTitle(`${check} PGM BOT // Market`)
            .setDescription("Sistemdeki güncel fiyatlar ve satın alma kodları aşağıdadır.\n Satın almak için: `!satınal <ürün_kodu>`")
            .addFields(
                { name: "Kasalar", value: cratesText || "_Şu an satılık kasa bulunmuyor._", inline: false },
                { name: "Turnuva Kitleri", value: kitsText || "_Şu an satılık kit bulunmuyor._", inline: false }
            )
            .setFooter({ text: "PGM BOT Mağaza Sistemi" })
            .setTimestamp();

        msg.reply({ embeds: [embed] });
    }
};