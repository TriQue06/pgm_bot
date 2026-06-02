const { EmbedBuilder } = require("discord.js");
const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");

module.exports = {
    name: "kasa",
    aliases: ["open", "kasaac", "kasaaç"],
    execute(client, msg, args) {
        const crateType = args[0]?.toLowerCase();

        const system = loadJson("system.json");
        const prices = loadJson("prices.json");
        const crateLoot = loadJson("crate_loot.json"); // Yeni ödül havuzu dosyan

        const negative = system["negative"]?.emoji || "❌";
        const check = system["check"]?.emoji || "✅";

        if (!crateType || !prices[crateType] || prices[crateType].type !== "crate") {
            return msg.reply(`${negative} **Doğru Kullanım:** \`!kasa <kasa_adı>\`\n*Örnek: !kasa altinkasa*`);
        }

        const info = prices[crateType];
        const data = loadJson("data.json");

        ensureUser(data, msg.author.id);
        const p = data[msg.author.id];

        // Envanter Kontrolü
        if (!p.crates || !p.crates[crateType] || p.crates[crateType] <= 0) {
            return msg.reply(`${negative} Envanterinde hiç **${info.emoji || "📦"} ${info.name}** bulunmuyor!`);
        }

        // Ganimet Tablosu Kontrolü
        const possibleLoot = crateLoot[crateType];
        if (!possibleLoot) {
            return msg.reply(`${negative} Bu kasanın ödül tablosu sistemde tanımlı değil.`);
        }

        // Kasayı envanterden 1 adet eksilt
        p.crates[crateType] -= 1;
        if (p.crates[crateType] <= 0) delete p.crates[crateType];

        let rewards = [];

        // Ödülleri hesaplama (Şans ve miktar rolleri)
        possibleLoot.forEach(item => {
            const roll = Math.random() * 100;

            if (roll <= item.chance) {
                const amount = Math.floor(Math.random() * (item.max - item.min + 1)) + item.min;

                if (item.type === "currency") {
                    const sysEmoji = system[item.name]?.emoji || "🪙";
                    const sysName = system[item.name]?.name || item.name.toUpperCase();

                    p[item.name] = (p[item.name] || 0) + amount;
                    rewards.push(`### ${sysEmoji} +${amount} ${sysName}`);
                }
                else if (item.type === "random_kit") {
                    const allKits = Object.keys(prices).filter(k => prices[k].type === "kit");
                    const kitName = allKits[Math.floor(Math.random() * allKits.length)];
                    const kitInfo = prices[kitName];

                    if (kitName) {
                        if (!p.kits) p.kits = {};
                        p.kits[kitName] = (p.kits[kitName] || 0) + amount;
                        rewards.push(`### ${kitInfo?.emoji || "⚔️"} +${amount} ${kitInfo?.name || kitName.toUpperCase()} Kiti`);
                    }
                }
                else if (item.type === "crate") {
                    const crateInfo = prices[item.name];
                    if (!p.crates) p.crates = {};
                    p.crates[item.name] = (p.crates[item.name] || 0) + amount;
                    rewards.push(`### ${crateInfo?.emoji || "📦"} +${amount} ${crateInfo?.name || item.name.toUpperCase()}`);
                }
            }
        });

        saveJson("data.json", data);

        const embed = new EmbedBuilder()
            .setColor(0xF1C40F)
            .setTitle(`${info.emoji || "📦"} ${info.name} Başarıyla Açıldı!`)
            .setDescription(`**${msg.author.username}** kasayı patlattı! Şansına çıkan ödüller:\n\n` + (rewards.length > 0 ? rewards.join("\n") : "### _Maalesef hiçbir şey çıkmadı, şansına küs..._"))
            .setFooter({ text: "PGM Loot Sistemi" })
            .setTimestamp();

        msg.reply({ embeds: [embed] });
    }
};