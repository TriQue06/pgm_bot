const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "reload",
    aliases: ["yenile", "rl"],
    async execute(client, msg, args) {
        if (!msg.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return msg.reply("[HATA] Bu komut için yetkin yok.");
        }

        const sent = await msg.reply("Sistem dosyaları ve komutlar temizleniyor...");

        try {
            // 1. ConfigLoader cache'ini temizle (JSON dosyalarının tekrar okunmasını sağlar)
            const configPath = require.resolve("../../utils/configLoader");
            delete require.cache[configPath];

            // 2. Komutları temizle
            client.commands.clear();
            const commandsPath = path.join(__dirname, "../../commands");
            const commandFolders = fs.readdirSync(commandsPath);
            let totalCommands = 0;

            for (const folder of commandFolders) {
                const folderPath = path.join(commandsPath, folder);
                if (!fs.lstatSync(folderPath).isDirectory()) continue;

                const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));
                for (const file of commandFiles) {
                    const filePath = path.join(folderPath, file);
                    delete require.cache[require.resolve(filePath)];
                    const command = require(filePath);

                    client.commands.set(command.name.toLowerCase(), command);
                    if (command.aliases) command.aliases.forEach(a => client.commands.set(a.toLowerCase(), command));
                    totalCommands++;
                }
            }

            const embed = new EmbedBuilder()
                .setColor(0x57F287)
                .setDescription(`[BAŞARILI] Sistem yapılandırması ve ${totalCommands} komut yeniden yüklendi.`);

            await sent.edit({ content: null, embeds: [embed] });
        } catch (error) {
            await sent.edit("[HATA] Yeniden yükleme sırasında bir hata oluştu: " + error.message);
        }
    }
};