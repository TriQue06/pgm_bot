const cfg = require("../../utils/configLoader");

module.exports = {
    name: "yardım",
    aliases: ["h", "help", "y", "yardim"],
    description: "Botun temel komutlarını ve birimlerini listeler.",
    execute(client, msg, args) {
        // system.json içerisindeki kategorilerden emojileri dinamik olarak çekiyoruz
        const ui = cfg.getAll("ui");
        const invUi = cfg.getAll("inventory_ui");
        const currencies = cfg.getAll("currencies");

        // UI Emojileri (Eksikse boş kalmasın diye fallback tanımlandı)
        const check = ui.check?.emoji || "";
        const cuzdanEmoji = invUi.cuzdan?.emoji || "";
        const cantaEmoji = invUi.canta?.emoji || "";
        const marketEmoji = invUi.market?.emoji || "";
        const kasaUiEmoji = invUi.envanterkasa?.emoji || "";

        // Birim Emojileri
        const pgmcoinEmoji = currencies.pgmcoin?.emoji || "";
        const elmasEmoji = currencies.elmas?.emoji || "";

        // Hazırladığın şablona göre düz metni oluşturuyoruz
        const helpMessage = `
# ${check} PGM BOT // Yardım

## Birimler
- ${pgmcoinEmoji} **PGM Coin** \`pgmcoin\` → Sunucunun ana ekonomik birimi. Kit satın almak için kullanabilirsin.
- ${elmasEmoji} **Elmas** \`elmas\` → Sezona özel birim, sezon marketinde kullanabilirsin.

## Genel Komutlar
- ${pgmcoinEmoji} \`!günlük\` → Günlük ödüllerinden birini al. (6 saatte yenilenir.)
- ${cuzdanEmoji} \`!envanter\` → Envanterini aç.
- ${marketEmoji} \`!market\` → Marketi görüntüle.
- ${pgmcoinEmoji} \`!gönder <@kullanıcı> <eşya_kodu> <miktar>\` → Birine herhangi bir birim veya eşya gönder.
*Örnek: **!gönder @BayPGM pgmcoin 8***

## Kasa Komutları
- ${kasaUiEmoji} \`!satınal <kasa>\` → Marketten yeni bir kasa al.
- ${kasaUiEmoji} \`!kasa <kasa>\` → Envanterindeki kasayı aç.
*Örnek: **!kasa altinkasa***

## Turnuva Katılımı ve Kit Komutları
- \`!satınal <kit>\` → Kit satın al.
- \`!katıl <mc_adi> yok\` → Turnuvaya kitsiz katıl.
- ${cantaEmoji} \`!katıl <mc_adi> <kit>\` → Turnuvaya seçtiğin kit ile katıl.
*Örnek: **!katıl BayPGM madenci***
*Not: Kit ile katılımda kit envanterinden düşer ve geri alınamaz.*

Detailed Guide & Rules: https://trique06.github.io/pgm_bot_website/
`.trim();

        // Doğrudan düz mesaj olarak gönderiyoruz (Embed yok!)
        msg.reply({ content: helpMessage });
    }
};