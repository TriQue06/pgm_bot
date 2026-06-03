const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, version, ComponentType } = require("discord.js");
const cfg = require("../../utils/configLoader");
const os = require("os");

function createProgressBar(current, total, size = 10) {
    const percentage = current / total;
    const progress = Math.round(size * percentage);
    const emptyProgress = size - progress;

    const progressText = '▓'.repeat(progress);
    const emptyProgressText = '░'.repeat(emptyProgress);

    return `[${progressText}${emptyProgressText}]`;
}

module.exports = {
    name: "ping",
    aliases: ["i", "info"],
    async execute(client, msg, args) {
        const ui = cfg.getAll("ui") || {};
        const negative = ui.negative?.emoji || "";

        const sent = await msg.reply("🔄 **Sistem verileri toplanıyor, lütfen bekleyin...**");

        const getSystemEmbed = () => {
            const latency = sent.createdTimestamp - msg.createdTimestamp;
            const apiPing = client.ws.ping;

            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor(uptime / 3600) % 24;
            const minutes = Math.floor((uptime / 60) % 60);
            const seconds = Math.floor(uptime % 60);

            const usedMemory = process.memoryUsage().rss / 1024 / 1024;
            const totalMemory = os.totalmem() / 1024 / 1024;
            const ramPercent = Math.round((usedMemory / totalMemory) * 100);

            const cpus = os.cpus();
            const cpuModel = cpus && cpus.length > 0 ? cpus[0].model.trim() : "Bilinmiyor";
            const coreCount = cpus ? cpus.length : 0;
            const cpuSpeed = cpus && cpus.length > 0 ? cpus[0].speed : 0;

            const guildCount = client.guilds.cache.size;
            const userCount = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
            const channelCount = client.channels.cache.size;

            return new EmbedBuilder()
                .setColor(latency < 150 ? 0x43B581 : (latency < 300 ? 0xF1C40F : 0xF04747))
                .setAuthor({ name: `${client.user.username} Sistem Paneli`, iconURL: client.user.displayAvatarURL() })
                .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
                .setDescription(`
**Host:** \`${os.hostname()}\`
**OS:** \`${os.type()} ${os.release()} (${os.arch()})\`
**CPU:** \`${cpuModel}\`
`)
                .addFields(
                    {
                        name: "📡 __Bağlantı Durumu__",
                        value: `**Gecikme:** \`${latency}ms\`\n**API:** \`${apiPing}ms\``,
                        inline: true
                    },
                    {
                        name: "🤖 __Bot İstatistikleri__",
                        value: `**Sunucu:** \`${guildCount}\`\n**Kullanıcı:** \`${userCount}\`\n**Kanal:** \`${channelCount}\``,
                        inline: true
                    },
                    {
                        name: "💾 __RAM Kullanımı__",
                        value: `${createProgressBar(usedMemory, totalMemory)} **%${ramPercent}**\n\`${usedMemory.toFixed(2)} MB / ${(totalMemory / 1024).toFixed(2)} GB\``,
                        inline: false
                    },
                    {
                        name: "⚙️ __İşlemci Detayları__",
                        value: `**Çekirdek:** \`${coreCount} Çekirdek\`\n**Hız:** \`${cpuSpeed} MHz\``,
                        inline: true
                    },
                    {
                        name: "⏳ __Aktiflik Süresi__",
                        value: `\`${days}g ${hours}s ${minutes}dk ${seconds}sn\``,
                        inline: true
                    },
                    {
                        name: "📦 __Versiyonlar__",
                        value: `**Node:** \`${process.version}\`\n**D.js:** \`v${version}\``,
                        inline: true
                    }
                )
                .setFooter({ text: `Talep eden: ${msg.author.tag}`, iconURL: msg.author.displayAvatarURL() })
                .setTimestamp();
        };

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('refresh_stats')
                    .setLabel('Verileri Yenile')
                    .setEmoji('🔄')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('delete_stats')
                    .setLabel('Kapat')
                    .setEmoji('✖️')
                    .setStyle(ButtonStyle.Danger)
            );

        await sent.edit({ content: null, embeds: [getSystemEmbed()], components: [row] });

        const collector = sent.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

        collector.on('collect', async (i) => {
            if (i.user.id !== msg.author.id) {
                return i.reply({ content: `${negative} Bu paneli sadece komutu yazan kişi kontrol edebilir.`, ephemeral: true });
            }

            if (i.customId === 'refresh_stats') {
                await i.update({ embeds: [getSystemEmbed()], components: [row] });
            } else if (i.customId === 'delete_stats') {
                collector.stop();
                await sent.delete().catch(() => {});
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                const disabledRow = new ActionRowBuilder().addComponents(
                    row.components.map(btn => ButtonBuilder.from(btn).setDisabled(true))
                );
                sent.edit({ components: [disabledRow] }).catch(() => {});
            }
        });
    }
};