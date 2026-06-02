const { EmbedBuilder } = require("discord.js");
const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");

const COOLDOWN = 6 * 60 * 60 * 1000; // 6 saat

module.exports = {
    name: "günlük", // index.js prefix kontrolü için başındaki "!" işaretini kaldırdık
    aliases: ["gunluk", "daily"],
    async execute(client, msg, args) {
        const data = loadJson("data.json");
        const system = loadJson("system.json");
        const prices = loadJson("prices.json");
        const dailyLoot = loadJson("daily_loot.json"); // Yeni dinamik günlük ödül dosyan

        const check = system["check"]?.emoji || "✅";
        const negative = system["negative"]?.emoji || "❌";
        const userId = msg.author.id;

        ensureUser(data, userId);
        const p = data[userId];
        const now = Date.now();

        // Bekleme Süresi Kontrolü
        if (p.lastDaily && (now - p.lastDaily) < COOLDOWN) {
            const remaining = COOLDOWN - (now - p.lastDaily);
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

            return msg.reply(`${negative} **Ödülünü zaten aldın!** Yeniden almana **${hours} saat ${minutes} dakika** var.`);
        }

        // daily_loot.json kontrolü
        if (!dailyLoot || !dailyLoot.rewards) {
            return msg.reply(`${negative} Günlük ödül tablosu (\`daily_loot.json\`) bulunamadı veya içi boş.`);
        }

        let rewards = [];

        dailyLoot.rewards.forEach(reward => {
            // Şans oranını kontrol et
            if ((Math.random() * 100) <= reward.chance) {
                // Rastgele miktar hesaplama
                const amount = Math.floor(Math.random() * (reward.max - reward.min + 1)) + reward.min;

                // 1. Durum: Doğrudan Para Birimi Ödülü
                if (reward.type === "currency") {
                    const sysEmoji = system[reward.name]?.emoji || "🪙";
                    const sysName = system[reward.name]?.name || reward.name.toUpperCase();

                    p[reward.name] = (p[reward.name] || 0) + amount;
                    rewards.push(`### ${sysEmoji} +${amount} ${sysName}`);
                }
                // 2. Durum: Rastgele Kit Ödülü
                else if (reward.type === "random_kit") {
                    // prices.json içindeki type alanı "kit" olanları filtrele
                    const allKits = Object.keys(prices).filter(k => prices[k].type === "kit");
                    if (allKits.length === 0) return;

                    const kitName = allKits[Math.floor(Math.random() * allKits.length)];
                    const kitInfo = prices[kitName];

                    if (!p.kits) p.kits = {};
                    p.kits[kitName] = (p.kits[kitName] || 0) + amount;
                    rewards.push(`### ${kitInfo?.emoji || "⚔️"} +${amount} ${kitInfo?.name || kitName.toUpperCase()} Kiti`);
                }
                // 3. Durum: Belirli Kasa Ödülü
                else if (reward.type === "crate") {
                    const info = prices[reward.name];

                    if (!p.crates) p.crates = {};
                    p.crates[reward.name] = (p.crates[reward.name] || 0) + amount;
                    rewards.push(`### ${info?.emoji || "📦"} +${amount} ${info?.name || reward.name.toUpperCase()}`);
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