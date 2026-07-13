const cfg = require("../../utils/configLoader");
const { states } = require("../../utils/voiceState");

module.exports = {
    name: "skip",
    aliases: ["geç", "atla"],

    async execute(client, msg, args) {
        const ui = cfg.getAll("ui");
        const check = ui.check?.emoji || "✅";
        const negative = ui.negative?.emoji || "❌";

        const state = states.get(msg.guild.id);
        if (!state) {
            return msg.reply(`${negative} Şu an çalan bir müzik yok.`);
        }

        const skipped = state.trackName;
        state.loop = false; // loop açıksa bu parçayı atlamak için kapat

        // stop() Idle event'i tetikler, playNext() sıradakini çalar
        state.player.stop();

        const nextTrack = state.queue[0]?.trackName;
        await msg.reply(
            nextTrack
                ? `${check} **${skipped}** atlandı. Şimdi çalıyor: **${nextTrack}**`
                : `${check} **${skipped}** atlandı. Kuyrukta başka parça yok.`
        );
    }
};
