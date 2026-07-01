const { PermissionFlagsBits } = require("discord.js");
const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");
const itemChecker = require("../../utils/itemChecker");
const cfg = require("../../utils/configLoader");

module.exports = {
    name: "admin",
    aliases: ["add", "set", "ekle", "ayarla"],
    async execute(client, msg, args) {
        if (!msg.member.permissions.has(PermissionFlagsBits.ManageGuild)) return;

        const ui = cfg.getAll("ui");
        const check = ui.check?.emoji || "";
        const negative = ui.negative?.emoji || "";

        const commandName = msg.content.split(" ")[0].slice(1).toLowerCase();
        const isAdd = ["add", "ekle"].includes(commandName);
        const subCommand = isAdd ? "add" : "set";

        const isEveryone = args[0] === "@everyone";
        const user = msg.mentions.users.first();

        const targetKey = args[1]?.toLowerCase();
        const amount = parseInt(args[2]);

        if ((!isEveryone && !user) || !targetKey || isNaN(amount)) {
            return msg.reply(`${negative} **Kullanım:** \`!${commandName} <@kullanıcı | @everyone> <eşya> <miktar>\``);
        }

        const item = itemChecker.exists(targetKey);
        if (!item) return msg.reply(`${negative} Geçersiz eşya veya öge kodu.`);

        const data = loadJson("data.json");

        function applyDataChange(playerObj) {
            if (item.type === "currency") {
                playerObj[item.key] = subCommand === "add" ? (playerObj[item.key] || 0) + amount : amount;
                if (playerObj[item.key] < 0) playerObj[item.key] = 0;
            } else {
                const container = item.type === "crate" ? "crates" : "kits";
                if (!playerObj[container]) playerObj[container] = {};

                playerObj[container][item.key] = subCommand === "add"
                    ? (playerObj[container][item.key] || 0) + amount
                    : amount;

                if (playerObj[container][item.key] <= 0) delete playerObj[container][item.key];
            }
        }

        if (isEveryone) {
            const members = await msg.guild.members.fetch();
            const humanMembers = members.filter(m => !m.user.bot);

            if (humanMembers.size === 0) {
                return msg.reply(`${negative} Sunucuda hiçbir üye bulunamadı.`);
            }

            for (const [id] of humanMembers) {
                ensureUser(data, id);
                applyDataChange(data[id]);
            }

            await saveJson("data.json", data);
            return msg.reply(`${check} Sunucudaki **tüm üyelerin (${humanMembers.size} kişi)** **${item.name}** bilgisi güncellendi.`);
        } else {
            ensureUser(data, user.id);
            applyDataChange(data[user.id]);

            await saveJson("data.json", data);
            return msg.reply(`${check} **${user.username}** kullanıcısının **${item.name}** bilgisi güncellendi.`);
        }
    }
};