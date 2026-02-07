const { EmbedBuilder } = require("discord.js");
const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");

const EMOJIS = {
    bronzkasa: "<:bronzkasa:1469400728442245347>",
    gumuskasa: "<:gumuskasa:1469400730589724828>",
    altinkasa: "<:altinkasa:1469400726043361443>",
    kit: "<:kit:1469016921478266880>",
    ruby: "<:ruby:1469015535911178280>",
    pgmcoin: "<:pgmcoin:1469015534493368442>",
    diamond: "<:diamond:1469015532836491274>",
    crystal: "<:crystal:1469015530760569058>"
};

const DISPLAY_NAMES = {
    pgmcoin: "PGM Coin",
    ruby: "Yakut",
    diamond: "Elmas",
    crystal: "Kristal",
    bronzkasa: "Bronz Kasa",
    gumuskasa: "Gümüş Kasa",
    altinkasa: "Altın Kasa"
};

// Çıkabilecek Kitler Listesi
const AVAILABLE_KITS = ["madenci", "nisanci", "demirci"];

function formatName(name) {
    return DISPLAY_NAMES[name] || name.charAt(0).toUpperCase() + name.slice(1);
}

module.exports = {
    name: "!kasa",
    aliases: ["!open", "!kasaac"],
    description: "Envanterindeki kasayı açar (Şansına göre kasa bile çıkabilir!).",
    execute(client, msg, args) {
        const crateType = args[0]?.toLowerCase();

        if (!crateType || !EMOJIS[crateType]) {
            return msg.reply("Kullanım: `!kasa <bronzkasa/gumuskasa/altinkasa>`");
        }

        const data = loadJson("data.json");
        const lootTable = loadJson("loot.json");
        
        ensureUser(data, msg.author.id);

        const userCrates = data[msg.author.id].crates;

        // 1. Kasa Kontrolü
        if (!userCrates[crateType] || userCrates[crateType] <= 0) {
            return msg.reply(`❌ Envanterinde hiç **${EMOJIS[crateType]} ${crateType}** yok! Kasa almak için \`!market\``);

        }

        // 2. Loot Tablosu Kontrolü
        const possibleLoot = lootTable[crateType];
        if (!possibleLoot) {
            return msg.reply("❌ Bu kasa için ganimet ayarları bulunamadı.");
        }

        // --- KASA AÇMA İŞLEMİ ---
        
        // Kasayı envanterden düş
        data[msg.author.id].crates[crateType] -= 1;
        if (data[msg.author.id].crates[crateType] <= 0) delete data[msg.author.id].crates[crateType];

        let rewards = [];

        // Tablodaki her bir ihtimali tek tek kontrol et
        possibleLoot.forEach(item => {
            // Şans Faktörü (0-100)
            const roll = Math.random() * 100;

            if (roll <= item.chance) {
                // Miktarı belirle (min-max arası)
                const amount = Math.floor(Math.random() * (item.max - item.min + 1)) + item.min;

                // --- A) PARA BİRİMİ ---
                if (item.type === "currency") {
                    data[msg.author.id][item.name] = (data[msg.author.id][item.name] || 0) + amount;
                    
                    const emoji = EMOJIS[item.name] || "💰";
                    rewards.push(`## ${emoji} +${amount} ${formatName(item.name)}`);
                } 
                // --- B) RASTGELE KİT ---
                else if (item.type === "random_kit") {
                    const randomKitName = AVAILABLE_KITS[Math.floor(Math.random() * AVAILABLE_KITS.length)];
                    
                    if (!data[msg.author.id].kits) data[msg.author.id].kits = {};
                    data[msg.author.id].kits[randomKitName] = (data[msg.author.id].kits[randomKitName] || 0) + amount;

                    rewards.push(`## ${EMOJIS.kit} +${amount} ${formatName(randomKitName)} Kiti`);
                }
                // --- C) KASA İÇİNDEN KASA (YENİ EKLENDİ) ---
                else if (item.type === "crate") {
                    if (!data[msg.author.id].crates) data[msg.author.id].crates = {};
                    
                    data[msg.author.id].crates[item.name] = (data[msg.author.id].crates[item.name] || 0) + amount;
                    
                    const emoji = EMOJIS[item.name] || "📦";
                    rewards.push(`## ${emoji} +${amount} ${formatName(item.name)}`);
                }
            }
        });

        saveJson("data.json", data);

        // --- SONUÇ MESAJI ---
        const embed = new EmbedBuilder()
            .setColor(0xF1C40F)
            .setTitle(`${EMOJIS[crateType]} Kasa Açıldı!`)
            .setDescription(`**${msg.author.username}** kasayı açtı! İşte çıkanlar:\n\n` + rewards.join("\n"))
            .setFooter({ text: "PGM Loot System", iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        msg.reply({ embeds: [embed] });
    }
};