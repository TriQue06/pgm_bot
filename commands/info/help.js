const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const cfg = require("../../utils/configLoader");

module.exports = {
    name: "yardım",
    aliases: ["h", "help", "y", "yardim"],
    description: "Botun temel komutlarını ve web sitesini gösterir.",
    execute(client, msg, args) {
        const ui = cfg.getAll("inventory_ui");
        const cuzdanEmoji = ui.cuzdan?.emoji || "";
        const cantaEmoji = ui.canta?.emoji || "";

        const embed = new EmbedBuilder()
            .setColor(0x2B2D31)
            .setAuthor({ name: `${client.user.username} // Yardım Menüsü`, iconURL: client.user.displayAvatarURL() })
            .setDescription(`
Botumuzun ekonomi, kasa ve espor turnuvası kayıt sistemine ait temel komutlar aşağıda özetlenmiştir. Tüm detaylar, rehberler ve güncel kurallar için web sitemizi ziyaret edebilirsiniz.

${cuzdanEmoji} **Ekonomi ve Envanter**
\`!envanter\` • Hesabınızdaki tüm varlıkları listeler.
\`!gönder @kullanıcı <eşya> <miktar>\` • Başka bir oyuncuya varlık transfer eder.
\`!kasa <kasa_adı>\` • Envanterinizdeki bir kasayı şans ödülleri için açar.

${cantaEmoji} **Turnuva Kayıt**
\`!katıl <Minecraft_Adı> <kit_adı>\` • Envanterinizden kit harcayarak turnuvaya katılır.
\`!katıl <Minecraft_Adı> yok\` • Hiçbir kit harcamadan kitsiz olarak turnuvaya katılır.
\`!part\` • Turnuvaya kayıt olmuş aktif oyuncuları listeler.
            `)
            .setFooter({ text: "PGM BOT • Gelişmiş Turnuva Sistemi" })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("Tüm Komutlar ve Detaylı Rehber")
                .setStyle(ButtonStyle.Link)
                .setURL("https://trique06.github.io/pgm_bot_website/")
        );

        msg.reply({ embeds: [embed], components: [row] });
    }
};