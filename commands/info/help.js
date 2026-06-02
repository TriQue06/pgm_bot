const { EmbedBuilder } = require("discord.js");
const { loadJson } = require("../../utils/dataManager");

module.exports = {
    name: "yardım",
    aliases: ["h", "help", "y", "yardim"],
    description: "Botun tüm komutlarını ve turnuva sistemini gösterir.",
    execute(client, msg, args) {
        const system = loadJson("system.json");
        const marketEmoji = system["market"]?.emoji || "🛒";
        const cuzdanEmoji = system["cuzdan"]?.emoji || "💳";

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setAuthor({ name: `${client.user.username} // Yardım ve Bilgi Menüsü`, iconURL: client.user.displayAvatarURL() })
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription(`
Welcome to **PGM Bot**! Sunucudaki ekonomi, kasa ve espor turnuvası kayıt sistemini yöneten tüm güncel komutlar aşağıda listelenmiştir.

⚙️ **Genel ve Ekonomi Komutları**
\`!envanter\` • Bakiyenizi, turnuva kitlerinizi ve kasalarınızı listeler.
\`!market\` • Satılık turnuva kitlerini ve kasalarını listeler.
\`!satınal <öge>\` • Marketten bakiye ile kit veya kasa satın alır.
\`!gönder <@üye> <miktar> <öge>\` • Bir üyeye para veya eşya transfer eder.
\`!günlük\` • 6 saatte bir rastgele ödüllerinizi toplamanızı sağlar.
\`!kasa <kasa_adı>\` • Envanterinizdeki bir kasayı şans ödülleri için açar.

⚔️ **Turnuva Kayıt Komutları**
\`!katıl <Minecraft_Adı> <kit_adı>\` • Turnuvaya seçtiğiniz kitle kalıcı olarak kaydolur.
\`!katıl <Minecraft_Adı> yok\` • Turnuvaya hiçbir kit harcamadan (kitsiz) kaydolur.
\`!part\` • Turnuvaya o ana kadar kayıt olmuş tüm aktif oyuncuları listeler.
            `)
            .addFields(
                {
                    name: "🚨 Önemli Turnuva Kuralları",
                    value: `• Turnuvaya aynı Discord hesabından veya aynı Minecraft adıyla yalnızca **1 kez** kayıt olunabilir.\n• Seçtiğiniz turnuva kiti envanterinizden **kalıcı olarak düşer** ve turnuva alanına aktarılır.\n• Kayıtlar kapalıyken komut kullanılamaz.`,
                    inline: false
                }
            )
            .setFooter({ text: "PGM BOT • Gelişmiş Turnuva Sistemi", iconURL: msg.author.displayAvatarURL() })
            .setTimestamp();

        msg.reply({ embeds: [embed] });
    }
};