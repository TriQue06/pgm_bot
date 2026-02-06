const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "!profil",
    aliases: ["!profile", "!p"],
    description: "Kullanıcının profil bilgilerini gösterir.",
    execute: async (client, msg, args) => {
        const user = msg.mentions.users.first() || msg.author;
        const member = msg.guild.members.cache.get(user.id);

        const joinedAt = member.joinedAt;

        const isPremium = client.pgmPremiumUsers?.includes(user.id) || false;

        const embed = new EmbedBuilder()
            .setColor(isPremium ? 0xFFD700 : 0x00AEFF)
            .setTitle(`${user.username}#${user.discriminator} Profil`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: "PGM Premium", value: isPremium ? "✅ Var" : "❌ Yok", inline: true },
                { name: "Sunucuya Katılım", value: `<t:${Math.floor(joinedAt.getTime() / 1000)}:R>`, inline: true },
            )
            .setFooter({ text: `İsteyen: ${msg.author.tag}`, iconURL: msg.author.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        msg.channel.send({ embeds: [embed] });
    },
};
