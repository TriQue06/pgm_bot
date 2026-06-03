const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType } = require("discord.js");
const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");
const cfg = require("../../utils/configLoader");
const itemChecker = require("../../utils/itemChecker");

module.exports = {
    name: "kasa",
    aliases: ["open", "kasaac", "kasaaç"],
    async execute(client, msg, args) {
        const ui = cfg.getAll("ui");
        const invUi = cfg.getAll("inventory_ui");
        const currencies = cfg.getAll("currencies") || {};
        const systemCrates = cfg.getAll("crates") || {};

        const check = ui.check?.emoji || "";
        const negative = ui.negative?.emoji || "";
        const kasaEmoji = invUi.envanterkasa?.emoji || "";
        const cantaEmoji = invUi.canta?.emoji || ""; // Random kit için kullanılacak

        const data = loadJson("data.json");
        ensureUser(data, msg.author.id);
        const p = data[msg.author.id];

        // 1. Envanterde açılabilir kasa kontrolü
        if (!p.crates || Object.keys(p.crates).length === 0 || Object.values(p.crates).every(val => val <= 0)) {
            return msg.reply(`${negative} Envanterinde açılabilir bir kasa bulunmuyor.`);
        }

        const crateLoot = loadJson("crate_loot.json");

        // 2. Kasa İhtimalleri Tablosunu (Loot Table) Dinamik Oluşturma
        let lootTableText = "";
        for (const [cKey, cLoot] of Object.entries(crateLoot)) {
            const crateInfo = systemCrates[cKey];
            if (!crateInfo) continue;

            const cEmoji = crateInfo.emoji || "";
            lootTableText += `### ${cEmoji} ${crateInfo.name}\n`;

            cLoot.forEach(item => {
                let itemEmoji = "";
                let itemName = "";

                if (item.type === "currency") {
                    itemEmoji = currencies[item.name]?.emoji || "";
                    itemName = currencies[item.name]?.name || item.name;
                } else if (item.type === "random_kit") {
                    itemEmoji = cantaEmoji;
                    itemName = "Rastgele Kit";
                } else if (item.type === "crate") {
                    itemEmoji = systemCrates[item.name]?.emoji || "";
                    itemName = systemCrates[item.name]?.name || item.name;
                }

                // Min ve Max aynıysa tek sayı göster, farklıysa aralık (Örn: 2-6)
                const amountText = item.min === item.max ? `${item.min}` : `${item.min}-${item.max}`;
                lootTableText += `- ${itemEmoji} **${itemName}** (\`${amountText}x\`) ➔ **%${item.chance}**\n`;
            });
            lootTableText += "\n";
        }

        // 3. Kasa seçim menüsünü oluşturma
        const menu = new StringSelectMenuBuilder()
            .setCustomId("crate_select")
            .setPlaceholder("Hemen açmak istediğin kasayı seç...");

        let added = 0;
        for (const [key, amount] of Object.entries(p.crates)) {
            if (amount > 0) {
                const res = itemChecker.exists(key);
                if (res && res.type === "crate") {
                    menu.addOptions(new StringSelectMenuOptionBuilder()
                        .setLabel(res.name.replace(/\*\*/g, "").replace(/<:[a-zA-Z0-9_]+:[0-9]+>\s*/g, ""))
                        .setDescription(`Envanterinde ${amount} adet var. (Seçildiğinde anında açılır)`)
                        .setValue(key));
                    added++;
                }
            }
        }

        if (added === 0) {
            return msg.reply(`${negative} Envanterinde geçerli sistem kasası bulunmuyor.`);
        }

        const row = new ActionRowBuilder().addComponents(menu);

        const initialEmbed = new EmbedBuilder()
            .setColor(0x2B2D31)
            .setTitle(`${kasaEmoji} Kasa Sistemi ve Oranlar`)
            .setDescription(`Aşağıdaki menüden seçtiğin kasa **anında açılacaktır**.\n\n${lootTableText.trim()}`)
            .setFooter({ text: "PGM Loot Sistemi" })
            .setTimestamp();

        const botMessage = await msg.reply({ embeds: [initialEmbed], components: [row] });

        // Menü Collector'ı (60 saniye dinler)
        const collector = botMessage.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 });

        collector.on("collect", async (inter) => {
            if (inter.user.id !== msg.author.id) {
                return inter.reply({ content: `${negative} Bu menüyü sadece komutu yazan kişi kullanabilir.`, ephemeral: true });
            }

            const selectedKey = inter.values[0];
            const resInfo = itemChecker.exists(selectedKey);

            // Çakışmayı önlemek için kasa açılma anında veriyi tekrar yükle
            const freshData = loadJson("data.json");
            ensureUser(freshData, msg.author.id);
            const freshP = freshData[msg.author.id];

            if (!freshP.crates || !freshP.crates[selectedKey] || freshP.crates[selectedKey] <= 0) {
                collector.stop();
                return inter.update({ content: `${negative} Hata: İşlem sırasında bu kasan tükendi veya bulunamadı!`, embeds: [], components: [] });
            }

            const possibleLoot = crateLoot[selectedKey];
            if (!possibleLoot) {
                collector.stop();
                return inter.update({ content: `${negative} Bu kasanın ödül tablosu sistemde tanımlı değil!`, embeds: [], components: [] });
            }

            // Envanterden kasanın eksiltilmesi
            freshP.crates[selectedKey] -= 1;
            if (freshP.crates[selectedKey] <= 0) delete freshP.crates[selectedKey];

            let rewards = [];

            // crate_loot.json üzerinden şans (RNG) algoritması
            possibleLoot.forEach(lootItem => {
                const roll = Math.random() * 100;

                if (roll <= lootItem.chance) {
                    const amount = Math.floor(Math.random() * (lootItem.max - lootItem.min + 1)) + lootItem.min;

                    if (lootItem.type === "currency") {
                        const res = itemChecker.exists(lootItem.name);
                        if (res && res.type === "currency") {
                            freshP[res.key] = (freshP[res.key] || 0) + amount;
                            const curEmoji = currencies[res.key]?.emoji || "";
                            rewards.push(`- ${curEmoji} **${amount}x** ${res.name}`);
                        }
                    }
                    else if (lootItem.type === "random_kit") {
                        const allKits = Object.keys(cfg.getAll("kits"));
                        const kitName = allKits[Math.floor(Math.random() * allKits.length)];
                        const res = itemChecker.exists(kitName);

                        if (res && res.type === "kit") {
                            if (!freshP.kits) freshP.kits = {};
                            freshP.kits[res.key] = (freshP.kits[res.key] || 0) + amount;
                            rewards.push(`- ${cantaEmoji} **${amount}x** ${res.name}`);
                        }
                    }
                    else if (lootItem.type === "crate") {
                        const res = itemChecker.exists(lootItem.name);
                        if (res && res.type === "crate") {
                            if (!freshP.crates) freshP.crates = {};
                            freshP.crates[res.key] = (freshP.crates[res.key] || 0) + amount;
                            const crEmoji = systemCrates[res.key]?.emoji || "";
                            rewards.push(`- ${crEmoji} **${amount}x** ${res.name}`);
                        }
                    }
                }
            });

            saveJson("data.json", freshData);

            const resultEmbed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle(`${check} Kasa Açıldı!`)
                .setDescription(`**${resInfo.name}** kasasını açtın!\n\n### Çıkan Ödüller:\n${rewards.length > 0 ? rewards.join("\n") : "_Maalesef hiçbir şey çıkmadı..._"}`)
                .setFooter({ text: "PGM Loot Sistemi", iconURL: msg.author.displayAvatarURL() })
                .setTimestamp();

            await inter.update({ content: null, embeds: [resultEmbed], components: [] });
            collector.stop(); // İşlem bitince ana menüyü öldür
        });

        // Zaman aşımı toleransı
        collector.on("end", (collected, reason) => {
            if (reason === "time") {
                botMessage.edit({ components: [] }).catch(() => {});
            }
        });
    }
};