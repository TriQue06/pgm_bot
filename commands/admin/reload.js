const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "reload",
    aliases: ["yenile", "rl"],
    description: "Botu kapatmadan tüm komutları baştan yükler.",
    async execute(client, msg, args) {
        // system.json dosyasını anlık çekelim (emojiler için)
        const system = require("../../utils/dataManager").loadJson("system.json");
        const check = system["check"]?.emoji || "✅";
        const negative = system["negative"]?.emoji || "❌";

        // Yetki Kontrolü (Sadece yöneticiler)
        if (!msg.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return msg.reply(`${negative} Bu komut için yetkin yok.`);
        }

        const sent = await msg.reply("🔄 **Komutlar baştan yükleniyor, lütfen bekleyin...**");

        try {
            // Mevcut tüm komut hafızasını temizle
            client.commands.clear();

            // Komutlar klasörünü yeniden tara (Aynen index.js mantığı)
            const commandFolders = fs.readdirSync(path.join(__dirname, "../../commands"));

            let totalCommands = 0;

            for (const folder of commandFolders) {
                const folderPath = path.join(__dirname, `../../commands/${folder}`);

                // Klasör mü kontrolü
                if (!fs.lstatSync(folderPath).isDirectory()) continue;

                const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));

                for (const file of commandFiles) {
                    const filePath = path.join(folderPath, file);

                    // 🚨 KRİTİK: Node.js'in önbelleğini (cache) siliyoruz ki dosyayı sıfırdan okusun!
                    delete require.cache[require.resolve(filePath)];

                    const command = require(filePath);

                    // Komutu belleğe yaz
                    client.commands.set(command.name.toLowerCase(), command);
                    totalCommands++;

                    // Alternatif adları (aliases) belleğe yaz
                    if (command.aliases && Array.isArray(command.aliases)) {
                        command.aliases.forEach(alias => client.commands.set(alias.toLowerCase(), command));
                    }
                }
            }

            const embed = new EmbedBuilder()
                .setColor(0x57F287)
                .setDescription(`${check} **Başarılı!** Tüm komut önbelleği temizlendi ve **${totalCommands} adet** komut sıfırdan başarıyla yüklendi.`)
                .setTimestamp();

            await sent.edit({ content: null, embeds: [embed] });
            console.log(`[RELOAD] ${msg.author.tag} tarafından tüm komutlar discord üzerinden başarıyla yenilendi.`);

        } catch (error) {
            console.error("❌ Reload Komut Hatası:", error);
            await sent.edit(`${negative} **Komutlar yüklenirken bir hata oluştu!** Terminal loglarını kontrol et.`);
        }
    }
};