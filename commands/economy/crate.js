const { EmbedBuilder } = require("discord.js");
const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");
const cfg = require("../../utils/configLoader");
const itemChecker = require("../../utils/itemChecker");

module.exports = {
    name: "kasa",
    aliases: ["open", "kasaac", "kasaaç"],
    execute(client, msg, args) {
        const crateType = args[0]?.toLowerCase();

        const ui = cfg.getAll("ui");
        const check = ui.check?.emoji || "";
        const negative = ui.negative?.emoji || "";

        if (!crateType) {
            return msg.reply(`${negative} **Doğru Kullanım:** \`!kasa <kasa_adı>\``);
        }

        const item = itemChecker.exists(crateType);
        if (!item || item.type !== "crate") {
            return msg.reply(`${negative} **Doğru Kullanım:** \`!kasa <kasa_adı>\``);
        }

        const data = loadJson("data.json");
        ensureUser(data, msg.author.id);
        const p = data[msg.author.id];

        if (!p.crates || !p.crates[item.key] || p.crates[item.key] <= 0) {
            return msg.reply(`${negative} Envanterinde hiç **${item.name}** bulunmuyor!`);
        }

        const crateLoot = loadJson("crate_loot.json");
        const possibleLoot = crateLoot[item.key];
        if (!possibleLoot) {
            return msg.reply(`${negative} Bu kasanın ödül tablosu sistemde tanımlı değil.`);
        }

        p.crates[item.key] -= 1;
        if (p.crates[item.key] <= 0) delete p.crates[item.key];

        let rewards = [];

        possibleLoot.forEach(lootItem => {
            const roll = Math.random() * 100;

            if (roll <= lootItem.chance) {
                const amount = Math.floor(Math.random() * (lootItem.max - lootItem.min + 1)) + lootItem.min;

                if (lootItem.type === "currency") {
                    const res = itemChecker.exists(lootItem.name);
                    if (res && res.type === "currency") {
                        p[res.key] = (p[res.key] || 0) + amount;
                        rewards.push(`### +${amount} **${res.name}**`);
                    }
                }
                else if (lootItem.type === "random_kit") {
                    const allKits = Object.keys(cfg.getAll("kits"));
                    const kitName = allKits[Math.floor(Math.random() * allKits.length)];
                    const res = itemChecker.exists(kitName);

                    if (res && res.type === "kit") {
                        if (!p.kits) p.kits = {};
                        p.kits[res.key] = (p.kits[res.key] || 0) + amount;
                        rewards.push(`### +${amount} **${res.name}**`);
                    }
                }
                else if (lootItem.type === "crate") {
                    const res = itemChecker.exists(lootItem.name);
                    if (res && res.type === "crate") {
                        if (!p.crates) p.crates = {};
                        p.crates[res.key] = (p.crates[res.key] || 0) + amount;
                        rewards.push(`### +${amount} **${res.name}**`);
                    }
                }
            }
        });

        saveJson("data.json", data);

        const embed = new EmbedBuilder()
            .setColor(0xF1C40F)
            .setTitle(`${item.name} Başarıyla Açıldı!`)
            .setDescription(`**${msg.author.username}** kasayı açtı! Çıkan ödüller:\n\n` + (rewards.length > 0 ? rewards.join("\n") : "### _Maalesef hiçbir şey çıkmadı..._"))
            .setFooter({ text: "PGM Loot Sistemi" })
            .setTimestamp();

        msg.reply({ embeds: [embed] });
    }
};