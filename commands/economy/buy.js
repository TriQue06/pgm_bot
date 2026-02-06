const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");

module.exports = {
    name: "!satinal",
    aliases: ["!buy", "!al"],
    description: "Marketten eşya satın alır.",
    execute(client, msg, args) {
        // 1. Ürün adı girildi mi?
        const kitName = args[0]?.toLowerCase();
        if (!kitName) return msg.reply("Kullanım: `!satinal <kit_adi>`");

        const data = loadJson("data.json");
        const market = loadJson("market.json");
        
        ensureUser(data, msg.author.id);

        // 2. Ürün markette var mı?
        const item = market[kitName];
        if (!item) return msg.reply(`❌ **${kitName}** adında bir ürün markette bulunamadı.`);

        const { currency, price } = item;

        // 3. (ÖNEMLİ KORUMA) Para birimi geçerli mi?
        // Kullanıcının verisinde bu para birimi tanımlı mı diye bakıyoruz.
        if (data[msg.author.id][currency] === undefined) {
            console.log(`HATA: market.json dosyasındaki '${kitName}' ürününün 'currency' değeri (${currency}) kullanıcı verisinde yok!`);
            return msg.reply("❌ Sistemsel bir hata oluştu: Geçersiz para birimi. Lütfen yöneticiye bildir.");
        }

        // 4. Bakiye Yeterli mi?
        if (data[msg.author.id][currency] < price) {
            return msg.reply(`❌ Yeterli bakiyen yok! \nGereken: **${price} ${currency}** \nSenin Bakiyen: **${data[msg.author.id][currency]}**`);
        }

        // 5. Satın Alma İşlemi
        data[msg.author.id][currency] -= price;
        
        // Kit sayısını artır
        data[msg.author.id].kits[kitName] = (data[msg.author.id].kits[kitName] || 0) + 1;

        saveJson("data.json", data);
        msg.reply(`✅ Başarıyla **${kitName}** satın alındı! \nKalan Bakiyen: ${data[msg.author.id][currency]} ${currency}`);
    }
};