const cfg = require("../../utils/configLoader");

module.exports = {
    name: "yardım",
    aliases: ["h", "help", "y", "yardim"],
    execute(client, msg, args) {
        const ui = cfg.getAll("ui");
        const invUi = cfg.getAll("inventory_ui");
        const currencies = cfg.getAll("currencies");

        const check = ui.check?.emoji || "";
        const cuzdanEmoji = invUi.cuzdan?.emoji || "";
        const cantaEmoji = invUi.canta?.emoji || "";
        const marketEmoji = invUi.market?.emoji || "";
        const kasaUiEmoji = invUi.envanterkasa?.emoji || "";

        const pgmcoinEmoji = currencies.pgmcoin?.emoji || "";
        const elmasEmoji = currencies.elmas?.emoji || "";

        const helpMessage = `
## ${check} PGM BOT // Yardım \`!yardım, !y\`

## Birimler
- ${pgmcoinEmoji} **PGM Coin** \`pgmcoin\`, ${elmasEmoji} **Elmas** \`elmas\`
## Genel Komutlar
- ${pgmcoinEmoji} \`!günlük, !daily\` → Günlük ödülünü al. (6 saatte bir.)
- ${cuzdanEmoji} \`!envanter, !e\` → Envanterini görüntüle.
- ${marketEmoji} \`!market, !m\` → Kasa veya kit satın almak için marketi kullan.
## Gönder Komudu
- ${pgmcoinEmoji} \`!gönder <@kullanıcı> <eşya_kodu> <miktar>\` → Birine herhangi bir öge gönder.
*Örnek: **!gönder @BayPGM pgmcoin 8***
- ${cantaEmoji} Kit veya kasa transferleri de yapabilirsin.
*Örnek: **!gönder @eren_za yagmaci 1***
## Kasa Komutları
- ${kasaUiEmoji} \`!kasa\` → Envanterindeki kasayı aç.
## Turnuva Katılımı ve Kit Komutları
- ${cantaEmoji} \`!turnuva, !kayıt\` → Turnuva kayıt menüsünü aç, katılımını yönet veya listeyi gör.
`.trim();
        msg.reply({ content: helpMessage });
    }
};