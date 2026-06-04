const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const cfg = require("../../utils/configLoader");

module.exports = {
    name: "reload",
    aliases: ["yenile", "rl"],
    async execute(client, msg, args) {
        if (!msg.member.permissions.has(PermissionFlagsBits.ManageGuild)) return;

        const ui = cfg.getAll("ui");
        const check = ui.check?.emoji || "";
        const negative = ui.negative?.emoji || "";

        const sent = await msg.reply("Sistem dosyaları ve komutlar temizleniyor...");

        try {
            const configPath = require.resolve("../../utils/configLoader");
            delete require.cache[configPath];
            const freshCfg = require("../../utils/configLoader");
            freshCfg.reload();

            client.commands.clear();

            const commandsPath = path.resolve(__dirname, "../../commands");
            if (!fs.existsSync(commandsPath)) {
                throw new Error("'commands' klasörü bulunamadı.");
            }

            const commandFolders = fs.readdirSync(commandsPath);
            let totalCommands = 0;

            for (const folder of commandFolders) {
                const folderPath = path.join(commandsPath, folder);
                if (!fs.lstatSync(folderPath).isDirectory()) continue;

                const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));
                for (const file of commandFiles) {
                    const filePath = path.resolve(folderPath, file);

                    try {
                        const resolvedPath = require.resolve(filePath);
                        delete require.cache[resolvedPath];
                    } catch (e) {}

                    const command = require(filePath);

                    if (command.name) {
                        client.commands.set(command.name.toLowerCase(), command);
                        if (command.aliases && Array.isArray(command.aliases)) {
                            command.aliases.forEach(a => client.commands.set(a.toLowerCase(), command));
                        }
                        totalCommands++;
                    }
                }
            }

            const embed = new EmbedBuilder()
                .setColor(0x1183D4)
                .setTitle(`${check} Sistem Yenilendi`)
                .setDescription(`## Başarıyla Güncellendi!\n\n- \`system.json\` config önbelleği tamamen temizlendi ve RAM'e yeniden alındı.\n- Toplam **${totalCommands}** adet komut hafızadan temizlenip başarıyla yeniden yüklendi.`)
                .setTimestamp();

            await sent.edit({ content: null, embeds: [embed] });
        } catch (error) {
            console.error(error);
            await sent.edit(`${negative} **Yeniden yükleme sırasında bir hata oluştu:** \`${error.message}\``);
        }
    }
};