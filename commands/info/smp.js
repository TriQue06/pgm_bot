const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const util = require("minecraft-server-util");
const cfg = require("../../utils/configLoader");

module.exports = {
    name: "smp",
    aliases: ["status", "uptime"],
    async execute(client, msg, args) {
        const ui = cfg.getAll("ui");
        const invUi = cfg.getAll("inventory_ui");

        const smpEmoji = ui.smp?.emoji || "";
        const check = ui.check?.emoji || "";
        const negative = ui.negative?.emoji || "";
        const cantaEmoji = invUi.canta?.emoji || "";

        try {
            const status = await util.status("pgmsmp.com", 25565, { timeout: 2000 });

            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle(`${check} PGM BOT - PGM SMP Kontrolü`)
                .setDescription(`# ${smpEmoji}  \`pgmsmp.com\`\n${check} Online\n${cantaEmoji} Ping: ${status.roundTripLatency}ms\n${cantaEmoji} Aktif Oyuncu: ${status.players.online}`)
                .setTimestamp();

            if (status.favicon) {
                const buffer = Buffer.from(status.favicon.split(',')[1], 'base64');
                const attachment = new AttachmentBuilder(buffer, { name: 'icon.png' });
                embed.setThumbnail('attachment://icon.png');
                await msg.reply({ embeds: [embed], files: [attachment] });
            } else {
                await msg.reply({ embeds: [embed] });
            }
        } catch (e) {
            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle(`${check} PGM BOT - PGM SMP Kontrolü`)
                .setDescription(`# ${smpEmoji}  \`pgmsmp.com\`\n${negative} Offline`)
                .setTimestamp();

            await msg.reply({ embeds: [embed] });
        }
    }
};