const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { loadJson, saveJson } = require("../../utils/dataManager");
const cfg = require("../../utils/configLoader");

module.exports = {
    name: "turnuvaaç",
    aliases: ["turnuvaac", "turnuvakapat", "şalter", "salter"],
    description: "Turnuva katılım durumunu açar veya kapatır. (Sadece Yönetici)",
    execute(client, msg, args) {
        const ui = cfg.getAll("ui");
        const check = ui.check?.emoji || "";
        const negative = ui.negative?.emoji || "";

        if (!msg.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return msg.reply(`${negative} Bu komutu kullanmak için \`Sunucuyu Yönet\` yetkisine sahip olmalısın.`);
        }

        const triggerCommand = msg.content.slice(1).trim().split(/\s+/)[0].toLowerCase();

        const statusData = loadJson("tournament_status.json", { tournamentActive: false });
        const embed = new EmbedBuilder().setTimestamp();

        if (["turnuvaaç", "turnuvaac"].includes(triggerCommand) || args[0]?.toLowerCase() === "aç" || args[0]?.toLowerCase() === "ac") {
            if (statusData.tournamentActive) {
                return msg.reply(`${negative} **Turnuva kayıtları zaten şu anda aktif!**`);
            }

            statusData.tournamentActive = true;
            saveJson("tournament_status.json", statusData);

            embed.setColor(0x2B2D31)
                .setTitle(`${check} PGM BOT // Sistem Güncellemesi`)
                .setDescription("## 🔓 Turnuva Kayıtları Açıldı!\n\nOyuncular artık `!turnuva` komutunu kullanarak kayıt yaptırabilir veya envanterlerindeki kitleri seçerek katılım sağlayabilirler.")
                .setFooter({ text: "PGM Turnuva Yönetim Sistemi" });

            return msg.channel.send({ embeds: [embed] });
        }

        else if (triggerCommand === "turnuvakapat" || args[0]?.toLowerCase() === "kapat") {
            if (!statusData.tournamentActive) {
                return msg.reply(`${negative} **Turnuva kayıtları zaten şu anda kapalı!**`);
            }

            statusData.tournamentActive = false;
            saveJson("tournament_status.json", statusData);

            embed.setColor(0x2B2D31)
                .setTitle(`${negative} PGM BOT // Sistem Güncellemesi`)
                .setDescription("## 🔒 Turnuva Kayıtları Kapatıldı!\n\nTurnuva katılım aşaması sona ermiştir. Yeni kayıt veya kayıt düzenleme işlemleri bir sonraki turnuvaya kadar durdurulmuştur.")
                .setFooter({ text: "PGM Turnuva Yönetim Sistemi" });

            return msg.channel.send({ embeds: [embed] });
        }
    }
};