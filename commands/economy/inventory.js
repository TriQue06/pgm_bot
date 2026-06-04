const { EmbedBuilder } = require("discord.js");
const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");
const cfg = require("../../utils/configLoader");

module.exports = {
    name: "envanter",
    aliases: ["e", "inv", "profile"],
    execute(client, msg, args) {
        const user = msg.mentions.users.first() || msg.author;
        const data = loadJson("data.json");
        ensureUser(data, user.id);
        const p = data[user.id];

        const ui = cfg.getAll("inventory_ui");

        const walletText = Object.entries(cfg.getAll("currencies"))
            .map(([k, v]) => `${v.emoji} **${v.name}**: ${p[k] || 0}`)
            .join("\n");

        const crateText = Object.entries(cfg.getAll("crates"))
            .filter(([k]) => p.crates && p.crates[k])
            .map(([k, v]) => `${v.emoji} **${v.name}**: (x${p.crates[k]})`)
            .join("\n") || "_Kasa bulunmuyor._";

        const kitText = Object.entries(cfg.getAll("kits"))
            .filter(([k]) => p.kits && p.kits[k])
            .map(([k, v]) => `${v.emoji} **${v.name}**: (x${p.kits[k]})`)
            .join("\n") || "_Kit bulunmuyor._";

        const embed = new EmbedBuilder()
            .setColor(0x1183D4)
            .setAuthor({ name: `${user.username} Envanteri`, iconURL: user.displayAvatarURL() })
            .setDescription(`## ${ui.cuzdan.emoji} ${ui.cuzdan.name}\n${walletText}\n\n## ${ui.envanterkasa.emoji} ${ui.envanterkasa.name}\n${crateText}\n\n## ${ui.canta.emoji} ${ui.canta.name}\n${kitText}`)
            .setTimestamp();

        msg.channel.send({ embeds: [embed] });
    }
};