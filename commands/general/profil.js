const { EmbedBuilder } = require("discord.js");
const ms = require("ms"); // Eğer süreyi güzel formatlamak istersen

module.exports = {
    name: "!profil",
    aliases: ["!profile", "!p"],
    description: "Kullanıcının profil bilgilerini gösterir.",
    execute: async (client, msg, args) => {
        // Kullanıcıyı argümanla al veya komutu yazan kişi olsun
        const user = msg.mentions.users.first() || msg.author;
        const member = msg.guild.members.cache.get(user.id);

        // Sunucuya katılım süresi
        const joinedAt = member.joinedAt;
        const joinedDuration = ms(Date.now() - joinedAt, { long: true });

        // PGM Premium durumu (örnek: veritabanı veya JSON'dan çek)
        // Burada basit örnek için rastgele atadım
        const isPremium = client.pgmPremiumUsers?.includes(user.id) || false;

        const embed = new EmbedBuilder()
            .setColor(isPremium ? 0xFFD700 : 0x00AEFF) // Premium için altın rengi
            .setTitle(`${user.username}#${user.discriminator} Profil`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: "Kullanıcı ID", value: user.id, inline: true },
                { name: "PGM Premium Pass", value: isPremium ? "✅ Var" : "❌ Yok", inline: true },
                { name: "Sunucuya Katılım", value: `<t:${Math.floor(joinedAt.getTime() / 1000)}:R> (${joinedDuration})`, inline: true },
                { name: "Hesap Oluşturulma", value: `<t:${Math.floor(user.createdAt.getTime() / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: `İsteyen: ${msg.author.tag}`, iconURL: msg.author.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        msg.channel.send({ embeds: [embed] });
    },
};
