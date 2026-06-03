const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, version, ComponentType } = require("discord.js");
const cfg = require("../../utils/configLoader");
const os = require("os");

// Gelişmiş RAM ilerleme çubuğu (Progress Bar)
function createProgressBar(current, total, size = 10) {
    const percentage = current / total;
    const progress = Math.round(size * percentage);
    const emptyProgress = size - progress;

    const progressText = '▓'.repeat(progress);
    const emptyProgressText = '░'.repeat(emptyProgress);

    return `[${progressText}${emptyProgressText}]`;
}

module.exports = {
    // Resmi Discord Uygulaması (Slash Command) Yapısı
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Gelişmiş sistem monitörü ve bot istatistiklerini görüntüler."),

    async executeSlash(interaction) {
        const ui = cfg.getAll("ui") || {};
        const negative = ui.negative?.emoji || "";

        // İlk yükleme mesajı gönderiliyor (Daha sonra embed ile güncellenecek)
        const botMessage = await interaction.reply({ content: "🔄 **Sistem verileri toplanıyor, lütfen bekleyin...**", fetchReply: true });

        // Embed içeriğini dinamik olarak üreten fonksiyon
        const getSystemEmbed = () => {
            // Slash komutları için en hassas gecikme hesaplama formülü
            const latency = Date.now() - interaction.createdTimestamp;
            const apiPing = interaction.client.ws.ping;

            // Aktiflik Süresi (Uptime) Hesaplamaları
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor(uptime / 3600) % 24;
            const minutes = Math.floor((uptime / 60) % 60);
            const seconds = Math.floor(uptime % 60);

            // RAM Kullanım Hesaplamaları
            const usedMemory = process.memoryUsage().rss / 1024 / 1024;
            const totalMemory = os.totalmem() / 1024 / 1024;
            const ramPercent = Math.round((usedMemory / totalMemory) * 100);

            // CPU (İşlemci) Bilgileri
            const cpus = os.cpus();
            const cpuModel = cpus && cpus.length > 0 ? cpus[0].model.trim() : "Bilinmiyor";
            const coreCount = cpus ? cpus.length : 0;
            const cpuSpeed = cpus && cpus.length > 0 ? cpus[0].speed : 0;

            // Bot İstatistikleri
            const guildCount = interaction.client.guilds.cache.size;
            const userCount = interaction.client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
            const channelCount = interaction.client.channels.cache.size;

            return new EmbedBuilder()
                .setColor(latency < 150 ? 0x43B581 : (latency < 300 ? 0xF1C40F : 0xF04747))
                .setAuthor({ name: `${interaction.client.user.username} Sistem Paneli`, iconURL: interaction.client.user.displayAvatarURL() })
                .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
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
                .setFooter({ text: `Talep eden: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();
        };

        // Buton Arayüzü Tasarımı
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

        // İlk mesajı temizleyip Embed ve Butonları ekrana basıyoruz
        await interaction.editReply({ content: null, embeds: [getSystemEmbed()], components: [row] });

        // Butonları 1 dakika (60000ms) boyunca dinleyecek kolektör
        const collector = botMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

        collector.on('collect', async (i) => {
            // Güvenlik: Sadece komutu tetikleyen kullanıcı butonları yönetebilir
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: `${negative} Bu paneli sadece komutu yazan kişi kontrol edebilir.`, ephemeral: true });
            }

            if (i.customId === 'refresh_stats') {
                // Verileri RAM hızıyla günceller ve arayüzü tazeler
                await i.update({ embeds: [getSystemEmbed()], components: [row] });
            } else if (i.customId === 'delete_stats') {
                // Kolektörü durdurur ve mesajı tamamen imha eder
                collector.stop();
                await interaction.deleteReply().catch(() => {});
            }
        });

        // Zaman aşımı bittiğinde butonları güvenli bir şekilde devre dışı bırakır
        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                const disabledRow = new ActionRowBuilder().addComponents(
                    row.components.map(btn => ButtonBuilder.from(btn).setDisabled(true))
                );
                interaction.editReply({ components: [disabledRow] }).catch(() => {});
            }
        });
    }
};