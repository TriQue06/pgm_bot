const { AudioPlayerStatus } = require("@discordjs/voice");
const cfg = require("../../utils/configLoader");
const { states } = require("../../utils/voiceState");

module.exports = {
    name: "queue",
    aliases: ["sıra", "kuyruk", "q"],

    async execute(client, msg, args) {
        const ui = cfg.getAll("ui");
        const check = ui.check?.emoji || "✅";
        const negative = ui.negative?.emoji || "❌";

        const state = states.get(msg.guild.id);
        if (!state) {
            return msg.reply(`${negative} Şu an çalan bir müzik yok.`);
        }

        const isPlaying = state.player.state.status === AudioPlayerStatus.Playing;
        const isPaused = state.player.state.status === AudioPlayerStatus.Paused;
        const statusText = isPaused ? "⏸ Duraklatılmış" : isPlaying ? "▶ Çalıyor" : "⏹ Beklemede";

        let lines = [`${check} **Müzik Kuyruğu**\n`];
        lines.push(`**Şu an:** ${statusText} — **${state.trackName}**${state.loop ? " 🔁" : ""}`);

        if (state.queue.length === 0) {
            lines.push(`\nKuyrukta başka parça yok.`);
        } else {
            lines.push(`\n**Sıradakiler:**`);
            state.queue.forEach((item, i) => {
                lines.push(`\`${i + 1}.\` ${item.trackName}`);
            });
        }

        await msg.reply(lines.join("\n"));
    }
};
