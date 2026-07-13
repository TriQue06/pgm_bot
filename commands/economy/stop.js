const cfg = require("../../utils/configLoader");
const { states } = require("../../utils/voiceState");

module.exports = {
    name: "stop",
    aliases: ["dur", "bitir"],

    async execute(client, msg, args) {
        const ui = cfg.getAll("ui");
        const check = ui.check?.emoji || "✅";
        const negative = ui.negative?.emoji || "❌";

        const state = states.get(msg.guild.id);
        if (!state) {
            return msg.reply(`${negative} Şu an çalan bir müzik yok.`);
        }

        state.player.stop();
        state.connection.destroy();
        states.delete(msg.guild.id);

        await msg.reply(`${check} Müzik durduruldu ve kanaldan çıkıldı.`);
    }
};
