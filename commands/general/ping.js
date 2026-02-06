const { EmbedBuilder, version } = require("discord.js");
const os = require("os");

module.exports = {
    name: "!ping",
    aliases: ["!gecikme", "!durum", "!stats", "!i", "!info"],
    description: "Botun gecikme değerlerini ve detaylı sistem bilgilerini gösterir.",
    async execute(client, msg, args) {
        // 1. Önce bir mesaj atıp zaman farkını ölçüyoruz
        const sent = await msg.channel.send("🏓 **Sistem verileri taranıyor...**");

        // 2. Gecikme Hesaplamaları
        const latency = sent.createdTimestamp - msg.createdTimestamp; // Mesajın gidip gelme süresi
        const apiPing = client.ws.ping; // Discord API ile bot arasındaki gecikme

        // 3. Sistem Bilgileri (Uptime, RAM, OS)
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime % 60);

        const usedMemory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        const cpus = os.cpus();
        const cpuModel = cpus.length > 0 ? cpus[0].model : "Bilinmiyor";
        const osType = os.type() === 'Linux' ? 'Linux (Fedora/Ubuntu vb.)' : os.type();

        // 4. Detaylı Embed Tasarımı
        const embed = new EmbedBuilder()
            .setColor(latency < 200 ? 0x43B581 : 0xF04747) // Hızlıysa yeşil, yavaşsa kırmızı
            .setAuthor({ name: `${client.user.username} • Sistem İstatistikleri`, iconURL: client.user.displayAvatarURL() })
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .setDescription(`**Host Sahibi:** ${os.hostname()} (Bu PC)\n**İşletim Sistemi:** ${osType} ${os.release()}`)
            .addFields(
                { 
                    name: "📡 __Bağlantı Hızı__", 
                    value: `**Bot Gecikmesi:** \`${latency}ms\`\n**API Gecikmesi:** \`${apiPing}ms\``, 
                    inline: true 
                },
                { 
                    name: "⏳ __Çalışma Süresi__", 
                    value: `\`${days} gün, ${hours} sa, ${minutes} dk, ${seconds} sn\``, 
                    inline: true 
                },
                { 
                    name: "💻 __Sistem Kaynakları__", 
                    value: `**RAM Kullanımı:** \`${usedMemory} MB\`\n**Toplam RAM:** \`${totalMemory} GB\`\n**İşlemci:** \`${cpuModel}\``, 
                    inline: false 
                },
                { 
                    name: "⚙️ __Sürüm Bilgileri__", 
                    value: `**Node.js:** \`${process.version}\`\n**Discord.js:** \`v${version}\``, 
                    inline: true 
                }
            )
            .setFooter({ text: `Talep eden: ${msg.author.tag}`, iconURL: msg.author.displayAvatarURL() })
            .setTimestamp();

        // 5. İlk mesajı silmeden, içeriğini embed ile değiştiriyoruz (Edit)
        sent.edit({ content: null, embeds: [embed] });
    }
};