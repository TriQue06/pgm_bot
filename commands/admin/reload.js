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
                .setDescription(`${check} **Sistem yapılandırması ve ${totalCommands} komut başarıyla yeniden yüklendi.**`);

            await sent.edit({ content: null, embeds: [embed] });
        } catch (error) {
            await sent.edit(`${negative} **Yeniden yükleme sırasında bir hata oluştu:** ${error.message}`);
        }
    }
};