const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");
const cfg = require("../../utils/configLoader");
const itemChecker = require("../../utils/itemChecker");

const COOLDOWN = 6 * 60 * 60 * 1000;

module.exports = {
    name: "günlük",
    aliases: ["gunluk", "daily"],
    async execute(client, msg, args) {
        const ui = cfg.getAll("ui");
        const check = ui.check?.emoji || "";
        const negative = ui.negative?.emoji || "";
        const userId = msg.author.id;

        const data = loadJson("data.json");
        ensureUser(data, userId);
        const p = data[userId];
        const now = Date.now();

        if (p.lastDaily && (now - p.lastDaily) < COOLDOWN) {
            const remaining = COOLDOWN - (now - p.lastDaily);
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

            let timeStr = "";
            if (hours > 0) timeStr += `${hours} saat `;
            if (minutes > 0 || hours > 0) timeStr += `${minutes} dakika `;
            timeStr += `${seconds} saniye`;

            return msg.reply(`${negative} **Ödülünü zaten aldın!** Yeniden almana **${timeStr}** var.`);
        }

        const dailyLoot = loadJson("daily_loot.json");
        if (!dailyLoot || !dailyLoot.rewards) {
            return msg.reply(`${negative} Günlük ödül tablosu sistemde tanımlı değil.`);
        }

        let rewards = [];

        dailyLoot.rewards.forEach(reward => {
            const roll = Math.random() * 100;

            if (roll <= reward.chance) {
                const amount = Math.floor(Math.random() * (reward.max - reward.min + 1)) + reward.min;

                if (reward.type === "currency") {
                    const res = itemChecker.exists(reward.name);
                    if (res && res.type === "currency") {
                        p[res.key] = (p[res.key] || 0) + amount;
                        rewards.push(`- +${amount} ${res.name}`);
                    }
                }
                else if (reward.type === "random_kit") {
                    const allKits = Object.keys(cfg.getAll("kits"));
                    if (allKits.length > 0) {
                        const kitName = allKits[Math.floor(Math.random() * allKits.length)];
                        const res = itemChecker.exists(kitName);

                        if (res && res.type === "kit") {
                            if (!p.kits) p.kits = {};
                            p.kits[res.key] = (p.kits[res.key] || 0) + amount;
                            rewards.push(`- +${amount} ${res.name}`);
                        }
                    }
                }
                else if (reward.type === "crate") {
                    const res = itemChecker.exists(reward.name);
                    if (res && res.type === "crate") {
                        if (!p.crates) p.crates = {};
                        p.crates[res.key] = (p.crates[res.key] || 0) + amount;
                        rewards.push(`- +${amount} ${res.name}`);
                    }
                }
            }
        });

        p.lastDaily = now;
        saveJson("data.json", data);

        if (rewards.length > 0) {
            const successMessage = `
${check} **${msg.author.username}**, günlük ödüllerini başarıyla topladın!
Hesabına eklenen varlıklar:

${rewards.join("\n")}
`.trim();
            msg.reply({ content: successMessage });
        } else {
            msg.reply({ content: `${negative} **${msg.author.username}**, şansına bugün günlük kutundan hiçbir ödül isabet etmedi... Yarın tekrar dene!` });
        }
    }
};