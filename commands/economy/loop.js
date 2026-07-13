const cfg = require("../../utils/configLoader");
const { states } = require("../../utils/voiceState");

module.exports = {
    name: "loop",
    aliases: ["döngü", "tekrar"],

    async execute(client, msg, args) {
        const ui = cfg.getAll("ui");
        const check = ui.check?.emoji || "✅";
        const negative = ui.negative?.emoji || "❌";

        const state = states.get(msg.guild.id);
        if (!state) {
            return msg.reply(`${negative} Şu an çalan bir müzik yok.`);
        }

        state.loop = !state.loop;

        await msg.reply(
            state.loop
                ? `${check} **${state.trackName}** loop modunda çalacak.`
                : `${negative} Loop modu kapatıldı.`
        );
    }
};
