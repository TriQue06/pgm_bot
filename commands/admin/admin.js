const { PermissionFlagsBits } = require("discord.js");
const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");
const itemChecker = require("../../utils/itemChecker");
const cfg = require("../../utils/configLoader");

module.exports = {
    name: "admin",
    aliases: ["add", "set", "ekle", "ayarla"],
    execute(client, msg, args) {
        if (!msg.member.permissions.has(PermissionFlagsBits.ManageGuild)) return;

        const ui = cfg.getAll("ui");
        const check = ui.check?.emoji || "";
        const negative = ui.negative?.emoji || "";

        const commandName = msg.content.split(" ")[0].slice(1).toLowerCase();
        const isAdd = ["add", "ekle"].includes(commandName);
        const subCommand = isAdd ? "add" : "set";

        // İlk argümanın @everyone olup olmadığını kontrol ediyoruz
        const isEveryone = args[0] === "@everyone";
        const user = msg.mentions.users.first();

        const targetKey = args[1]?.toLowerCase();
        const amount = parseInt(args[2]);

        // Geçerlilik kontrolü (@everyone değilse mutlaka bir kullanıcı etiketlenmiş olmalı)
        if ((!isEveryone && !user) || !targetKey || isNaN(amount)) {
            return msg.reply(`${negative} **Kullanım:** \`!${commandName} <@kullanıcı | @everyone> <eşya> <miktar>\``);
        }

        const item = itemChecker.exists(targetKey);
        if (!item) return msg.reply(`${negative} Geçersiz eşya veya öge kodu.`);

        const data = loadJson("data.json");

        // Yardımcı fonksiyon: İşlemi tek bir kullanıcı objesi üzerinde uygular
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

        // --- YOL 1: TÜM SUNUCUYA (@everyone) UYGULAMA ---
        if (isEveryone) {
            const allUserIds = Object.keys(data);
            if (allUserIds.length === 0) {
                return msg.reply(`${negative} Veri tabanında kayıtlı hiçbir kullanıcı bulunamadı.`);
            }

            // data.json içindeki tüm ID'leri dönerek işlemi uyguluyoruz
            for (const id of allUserIds) {
                ensureUser(data, id);
                applyDataChange(data[id]);
            }

            saveJson("data.json", data);
            return msg.reply(`${check} Veri tabanındaki **tüm kullanıcıların (${allUserIds.length} kişi)** **${item.name}** bilgisi güncellendi.`);
        }

        // --- YOL 2: TEK BİR KULLANICIYA UYGULAMA ---
        else {
            ensureUser(data, user.id);
            applyDataChange(data[user.id]);

            saveJson("data.json", data);
            return msg.reply(`${check} **${user.username}** kullanıcısının **${item.name}** bilgisi güncellendi.`);
        }
    }
};