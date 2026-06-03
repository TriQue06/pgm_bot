const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const cfg = require("../../utils/configLoader");

module.exports = {
    // Resmi Discord Slash Command kaydı
    data: new SlashCommandBuilder()
        .setName("yardım")
        .setDescription("Botun temel komutlarını ve birimlerini listeler."),

    async executeSlash(interaction) {
        const ui = cfg.getAll("ui");
        const invUi = cfg.getAll("inventory_ui");
        const currencies = cfg.getAll("currencies");

        // UI Emojileri
        const check = ui.check?.emoji || "";
        const cuzdanEmoji = invUi.cuzdan?.emoji || "";
        const cantaEmoji = invUi.canta?.emoji || "";
        const marketEmoji = invUi.market?.emoji || "";
        const kasaUiEmoji = invUi.envanterkasa?.emoji || "";

        // Birim Emojileri
        const pgmcoinEmoji = currencies.pgmcoin?.emoji || "";
        const elmasEmoji = currencies.elmas?.emoji || "";

        // Yardım içeriği
        const helpMessage = `
# ${check} PGM BOT // Yardım

## Birimler
- ${pgmcoinEmoji} **PGM Coin** \`pgmcoin\` → Sunucunun ana ekonomik birimi. Kit satın almak için kullanabilirsin.
- ${elmasEmoji} **Elmas** \`elmas\` → Sezona özel birim, sezon marketinde kullanabilirsin.

## Genel Komutlar
- ${pgmcoinEmoji} \`/günlük\` → Günlük ödülünü al. (6 saatte bir.)
- ${cuzdanEmoji} \`/envanter\` → Envanterini görüntüle.
- ${marketEmoji} \`/market\` → Market menüsünü aç.
- ${pgmcoinEmoji} \`/gönder\` → Başka bir oyuncuya birim veya eşya gönder.

## Kasa Komutları
- ${kasaUiEmoji} \`/kasa\` → Envanterindeki kasaları listele ve aç.

## Turnuva Sistemi
- ${cantaEmoji} \`/turnuva\` → Turnuva kayıtlarını yönet, katıl veya katılımcı listesini görüntüle.

---
**Daha fazla detay ve kurallar için:** [PGM BOT Rehberi](https://trique06.github.io/pgm_bot_website/)
`.trim();

        // Yanıtı sadece komutu yazan kişiye özel (ephemeral) olarak döndür
        await interaction.reply({ content: helpMessage, ephemeral: true });
    }
};