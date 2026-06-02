const { EmbedBuilder } = require("discord.js");
const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");
const cfg = require("../../utils/configLoader"); // CFG yapısı eklendi

const COOLDOWN = 1 * 1000; // Test için 1 saniye olarak güncellendi

module.exports = {
    name: "günlük",
    aliases: ["gunluk", "daily"],
    async execute(client, msg, args) {
        const data = loadJson("data.json");
        const dailyLoot = loadJson("daily_loot.json");

        // Emojiler kaldırıldı, metin tabanlı etiketler kullanıldı
        const check = "[BAŞARILI]";
        const negative = "[HATA]";
        const userId = msg.author.id;

        ensureUser(data, userId);
        const p = data[userId];
        const now = Date.now();

        if (p.lastDaily && (now - p.lastDaily) < COOLDOWN) {
            const remaining = COOLDOWN - (now - p.lastDaily);
            const seconds = Math.floor(remaining / 1000);

            return msg.reply(`${negative} **Ödülünü zaten aldın!** Yeniden almana **${seconds} saniye** var.`);
        }

        if (!dailyLoot || !dailyLoot.rewards) {
            return msg.reply(`${negative} Günlük ödül tablosu bulunamadı.`);
        }

        let rewards = [];

        dailyLoot.rewards.forEach(reward => {
            if ((Math.random() * 100) <= reward.chance) {
                const amount = Math.floor(Math.random() * (reward.max - reward.min + 1)) + reward.min;

                if (reward.type === "currency") {
                    const itemName = cfg.getRaw("currencies", reward.name)?.name || reward.name;
                    p[reward.name] = (p[reward.name] || 0) + amount;
                    rewards.push(`### +${amount} ${itemName}`);
                }
                else if (reward.type === "random_kit") {
                    const allKits = Object.keys(cfg.getAll("general")); // Genel kategoriden kitleri çek
                    if (allKits.length === 0) return;

                    const kitKey = allKits[Math.floor(Math.random() * allKits.length)];
                    const kitInfo = cfg.getRaw("general", kitKey);

                    if (!p.kits) p.kits = {};
                    p.kits[kitKey] = (p.kits[kitKey] || 0) + amount;
                    rewards.push(`### +${amount} ${kitInfo?.name || kitKey} Kiti`);
                }
                else if (reward.type === "crate") {
                    const info = cfg.getRaw("crates", reward.name);
                    if (!p.crates) p.crates = {};
                    p.crates[reward.name] = (p.crates[reward.name] || 0) + amount;
                    rewards.push(`### +${amount} ${info?.name || reward.name}`);
                }
            }
        });

        p.lastDaily = now;
        saveJson("data.json", data);

        const embed = new EmbedBuilder()
            .setColor(0x57F287)
            .setAuthor({ name: `${msg.author.username} • Günlük Ödül`, iconURL: msg.author.displayAvatarURL() })
            .setDescription(rewards.length > 0 ? `${check} Tebrikler! Ödüllerin hesabına eklendi:\n\n${rewards.join("\n")}` : "Şansına bugün hiçbir ödül isabet etmedi...")
            .setFooter({ text: "PGM Günlük Sistem" })
            .setTimestamp();

        msg.reply({ embeds: [embed] });
    }
};