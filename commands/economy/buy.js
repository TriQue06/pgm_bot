const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");

module.exports = {
    name: "satınal",
    aliases: ["satinal", "buy"],
    description: "Marketten bakiye ile kit veya kasa satın almanızı sağlar.",
    execute(client, msg, args) {
        // system.json ve prices.json dosyalarını doğrudan yüklüyoruz
        const system = loadJson("system.json");
        const prices = loadJson("prices.json");

        const check = system["check"]?.emoji || "✅";
        const negative = system["negative"]?.emoji || "❌";

        const targetItem = args[0]?.toLowerCase();

        if (!targetItem) {
            return msg.reply(`${negative} **Kullanım:** \`!satınal <öge_adı>\`\n*Örnek: !satınal madenci*\n*Örnek: !satınal altinkasa*`);
        }

        // Market dosyasından ögenin konfigürasyonunu kontrol et
        const itemConfig = prices[targetItem];

        if (!itemConfig) {
            return msg.reply(`${negative} **Marketimizde böyle bir öge bulunmuyor!** Mağazadaki ögeleri görmek için \`!market\` yazabilirsin.`);
        }

        const data = loadJson("data.json");
        ensureUser(data, msg.author.id);
        const p = data[msg.author.id];

        const cost = itemConfig.price;
        const currencyType = itemConfig.currency; // örn: pgmcoin veya cevher

        // Kullanıcının cüzdanında yeterli para birimi var mı?
        const userBalance = p[currencyType] || 0;
        if (userBalance < cost) {
            const currencyEmoji = system[currencyType]?.emoji || "🪙";
            const currencyName = system[currencyType]?.name || currencyType.toUpperCase();
            return msg.reply(`${negative} Bu ögeyi satın almak için yeterli **${currencyName}** bakiyen bulunmuyor!\n**Gerekli:** ${cost} ${currencyEmoji} // **Sende Olan:** ${userBalance} ${currencyEmoji}`);
        }

        // Ödemeyi cüzdandan düş
        p[currencyType] -= cost;

        // Öge türüne göre envantere ekleme yap (kit veya crate)
        if (itemConfig.type === "kit") {
            if (!p.kits) p.kits = {};
            p.kits[targetItem] = (p.kits[targetItem] || 0) + 1;
        }
        else if (itemConfig.type === "crate") {
            if (!p.crates) p.crates = {};
            p.crates[targetItem] = (p.crates[targetItem] || 0) + 1;
        }

        saveJson("data.json", data);

        const itemEmoji = itemConfig.emoji || "📦";
        const itemName = itemConfig.name || targetItem.toUpperCase();

        msg.reply(`${check} Başarıyla **1 adet ${itemEmoji} ${itemName}** satın aldın! Ücret envanterinden tahsil edildi.`);
    }
};