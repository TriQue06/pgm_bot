const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { loadJson, saveJson } = require("../../utils/dataManager");
const cfg = require("../../utils/configLoader"); // CFG yapısı korunuyor

module.exports = {
    name: "turnuva",
    aliases: ["tournament", "şalter", "salter", "kayit"],
    execute(client, msg, args) {
        // İkon veya emoji çeken tüm satırlar kaldırıldı
        const check = "İşlem Başarılı:";
        const negative = "Hata:";

        if (!msg.member.permissions.has(PermissionFlagsBits.ManageGuild)) return;

        const action = args[0]?.toLowerCase();
        if (!["aç", "ac", "kapat"].includes(action)) {
            return msg.reply(`${negative} Kullanım: !turnuva aç/kapat`);
        }

        const statusData = loadJson("tournament_status.json", { tournamentActive: false });
        const embed = new EmbedBuilder().setTimestamp();

        if (action.startsWith("a")) { // Aç
            statusData.tournamentActive = true;
            saveJson("tournament_status.json", statusData);

            embed.setColor(0x57F287)
                .setDescription("Turnuva kayıtları BAŞARIYLA açıldı.");

            msg.channel.send({ embeds: [embed] });
        } else { // Kapat
            statusData.tournamentActive = false;
            saveJson("tournament_status.json", statusData);

            embed.setColor(0xED4245)
                .setDescription("Turnuva kayıtları KAPATILDI.");

            msg.channel.send({ embeds: [embed] });
        }
    }
};