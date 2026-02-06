const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "!sorgu",
    aliases: ["!premiumkontrol", "!check"],
    description: "Kullanıcının PGM Premium durumu kontrol edilir.",
    execute: async (client, msg, args) => {
        // Kullanıcıyı argümanla al veya komutu yazan kişi olsun
        const user = msg.mentions.users.first() || msg.author;

        // Premium kontrolü (senin veritabanına göre)
        const isPremium = client.pgmPremiumUsers?.includes(user.id) || false;

        let embed;

        if (isPremium) {
            // Premium varsa
            embed = new EmbedBuilder()
                .setColor(0xFFD700) // Altın rengi
                .setTitle("🎉 Premium Durumu")
                .setDescription(`Tebrikler ${user.username}! Sen PGM Premium üyesisin. 🌟`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: "Premium ayrıcalıklarının tadını çıkar!" })
                .setTimestamp();
        } else {
            // Premium yoksa
            embed = new EmbedBuilder()
                .setColor(0xFF0000) // Kırmızı renk
                .setTitle("❌ Premium Durumu")
                .setDescription(`Maalesef ${user.username}, senin PGM Premium'un yok. 😏\nHemen şimdi Premium'lu ol! **!premium**`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: "Ayrıcalıkları kaçırma!" })
                .setTimestamp();
        }

        msg.channel.send({ embeds: [embed] });
    },
};
