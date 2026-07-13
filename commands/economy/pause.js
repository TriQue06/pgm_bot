const { AudioPlayerStatus } = require("@discordjs/voice");
const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const cfg = require("../../utils/configLoader");
const { states } = require("../../utils/voiceState");

module.exports = {
    name: "pause",
    aliases: ["duraklat"],

    async execute(client, msg, args) {
        const ui = cfg.getAll("ui");
        const check = ui.check?.emoji || "✅";
        const negative = ui.negative?.emoji || "❌";

        const state = states.get(msg.guild.id);
        if (!state) {
            return msg.reply(`${negative} Şu an çalan bir müzik yok.`);
        }

        if (state.player.state.status === AudioPlayerStatus.Paused) {
            return msg.reply(`${negative} Müzik zaten duraklatılmış.`);
        }

        if (state.player.state.status !== AudioPlayerStatus.Playing) {
            return msg.reply(`${negative} Şu an aktif çalan bir müzik yok.`);
        }

        state.player.pause();

        const resumeBtn = new ButtonBuilder()
            .setCustomId("resume_music")
            .setLabel("▶  Devam Ettir")
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(resumeBtn);

        await msg.reply({
            content: `${check} **${state.trackName}** duraklatıldı.`,
            components: [row]
        });
    },

    async handleButton(client, interaction) {
        const ui = cfg.getAll("ui");
        const check = ui.check?.emoji || "✅";
        const negative = ui.negative?.emoji || "❌";

        // Önce interaction'ı onayla, yoksa "etkileşim başarısız" hatası çıkar
        await interaction.deferUpdate();

        const state = states.get(interaction.guild.id);
        if (!state) {
            return interaction.editReply({ content: `${negative} Aktif bir müzik yok.`, components: [] });
        }

        if (state.player.state.status !== AudioPlayerStatus.Paused) {
            return interaction.editReply({ content: `${negative} Müzik zaten çalıyor.`, components: [] });
        }

        state.player.unpause();
        await interaction.editReply({
            content: `${check} **${state.trackName}** devam ediyor.`,
            components: []
        });
    }
};
