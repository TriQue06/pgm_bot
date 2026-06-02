const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");
const cfg = require("../../utils/configLoader");

module.exports = {
    name: "satınal",
    aliases: ["satinal", "buy"],
    description: "Marketten bakiye ile kit veya kasa satın almanızı sağlar.",
    execute(client, msg, args) {
        // Emojiler kaldırıldı, sadece metin etiketleri kullanılıyor
        const check = "[BAŞARILI]";
        const negative = "[HATA]";

        const targetItem = args[0]?.toLowerCase();

        if (!targetItem) {
            return msg.reply(`${negative} **Kullanım:** \`!satınal <öge_adı>\``);
        }

        // Fiyat listesini çek
        const prices = loadJson("prices.json");
        const itemConfig = prices[targetItem];

        if (!itemConfig) {
            return msg.reply(`${negative} **Marketimizde böyle bir öge bulunmuyor!** Mağazadaki ögeleri görmek için \`!market\` yazabilirsin.`);
        }

        const data = loadJson("data.json");
        ensureUser(data, msg.author.id);
        const p = data[msg.author.id];

        const cost = itemConfig.price;
        const currencyType = itemConfig.currency;
        const userBalance = p[currencyType] || 0;

        // Bakiye kontrolü (Emojisiz metin)
        if (userBalance < cost) {
            const currencyName = cfg.getRaw("currencies", currencyType)?.name || currencyType.toUpperCase();
            return msg.reply(`${negative} Bu ögeyi satın almak için yeterli **${currencyName}** bakiyen bulunmuyor!\n**Gerekli:** ${cost} ${currencyName} // **Sende Olan:** ${userBalance} ${currencyName}`);
        }

        // İşlem
        p[currencyType] -= cost;

        if (itemConfig.type === "kit") {
            if (!p.kits) p.kits = {};
            p.kits[targetItem] = (p.kits[targetItem] || 0) + 1;
        } else if (itemConfig.type === "crate") {
            if (!p.crates) p.crates = {};
            p.crates[targetItem] = (p.crates[targetItem] || 0) + 1;
        }

        saveJson("data.json", data);

        const itemName = cfg.getRaw("crates", targetItem)?.name ||
            cfg.getRaw("general", targetItem)?.name ||
            targetItem;

        msg.reply(`${check} Başarıyla **${itemName}** satın aldın!`);
    }
};