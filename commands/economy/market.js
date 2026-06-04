const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ComponentType } = require("discord.js");
const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");
const cfg = require("../../utils/configLoader");
const itemChecker = require("../../utils/itemChecker");

function generateMarketText(prices, categoryFilter, allCurrencies, invUi) {
    let text = "";
    const targetCategories = categoryFilter ? [categoryFilter] : ["crates", "kits"];

    for (const cat of targetCategories) {
        if (!prices[cat] || Object.keys(prices[cat]).length === 0) continue;

        const catEmoji = cat === "crates" ? (invUi.envanterkasa?.emoji || "") : (invUi.canta?.emoji || "");
        const catName = cat === "crates" ? (invUi.envanterkasa?.name || "Kasalar") : (invUi.canta?.name || "Kitler");

        text += `## ${catEmoji} ${catName}\n`;

        for (const [key, itemData] of Object.entries(prices[cat])) {
            const res = itemChecker.exists(key);
            if (!res) continue;

            const currencyData = allCurrencies[itemData.currency] || {};
            const currencyEmoji = currencyData.emoji || "";
            const currencyName = currencyData.name || itemData.currency;

            text += `- ${res.name} \`${key}\` → ${currencyEmoji} **${itemData.price}** **${currencyName}**\n`;
        }
        text += "\n";
    }
    return text.trim();
}

module.exports = {
    name: "market",
    aliases: ["shop", "m", "satınal", "buy"],
    async execute(client, msg, args) {
        const prices = loadJson("prices.json");
        const ui = cfg.getAll("ui");
        const invUi = cfg.getAll("inventory_ui");
        const allCurrencies = cfg.getAll("currencies") || {};

        const check = ui.check?.emoji || "";
        const negative = ui.negative?.emoji || "";

        const cratesTitle = invUi.envanterkasa?.name || "Kasalar";
        const kitsTitle = invUi.canta?.name || "Kitler";

        const fullMarketText = generateMarketText(prices, null, allCurrencies, invUi);

        const categoryMenu = new StringSelectMenuBuilder()
            .setCustomId("market_category_select")
            .setPlaceholder("Alışveriş yapmak istediğin kategoriyi seç...")
            .addOptions([
                new StringSelectMenuOptionBuilder()
                    .setLabel(cratesTitle)
                    .setValue("crates"),
                new StringSelectMenuOptionBuilder()
                    .setLabel(kitsTitle)
                    .setValue("kits")
            ]);

        const categoryRow = new ActionRowBuilder().addComponents(categoryMenu);

        const embed = new EmbedBuilder()
            .setColor(0x1183D4)
            .setTitle(`${check} PGM BOT // Market`)
            .setDescription(`Sistemdeki güncel fiyatlar aşağıdadır.\n\n${fullMarketText}\n\nİncelemek ve satın almak istediğin kategoriyi seç:`)
            .setFooter({ text: "PGM BOT Mağaza Sistemi" })
            .setTimestamp();

        const botMessage = await msg.reply({ embeds: [embed], components: [categoryRow] });

        const collector = botMessage.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 180000 });

        collector.on("collect", async (interaction) => {
            if (interaction.user.id !== msg.author.id) {
                return interaction.reply({ content: `${negative} Bu menüyü sadece komutu yazan kişi kullanabilir.`, ephemeral: true });
            }

            if (interaction.customId === "market_category_select") {
                const selectedCategory = interaction.values[0];
                const categoryItems = prices[selectedCategory];

                if (!categoryItems || Object.keys(categoryItems).length === 0) {
                    return interaction.reply({ content: `${negative} Bu kategoride şu an satılık ürün bulunmuyor.`, ephemeral: true });
                }

                const filteredMarketText = generateMarketText(prices, selectedCategory, allCurrencies, invUi);

                const itemMenu = new StringSelectMenuBuilder()
                    .setCustomId(`market_item_select_${selectedCategory}`)
                    .setPlaceholder("Satın almak istediğin ürünü seç...");

                for (const [key, itemData] of Object.entries(categoryItems)) {
                    const res = itemChecker.exists(key);
                    if (!res) continue;

                    const currencyData = allCurrencies[itemData.currency] || {};
                    const currencyName = currencyData.name || itemData.currency;

                    itemMenu.addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel(res.name.replace(/\*\*/g, "").replace(/<:[a-zA-Z0-9_]+:[0-9]+>\s*/g, ""))
                            .setDescription(`Fiyat: ${itemData.price} ${currencyName}`)
                            .setValue(key)
                    );
                }

                const itemRow = new ActionRowBuilder().addComponents(itemMenu);
                embed.setDescription(`Sistemdeki güncel fiyatlar aşağıdadır.\n\n${filteredMarketText}\n\nSatın almak istediğin ürünü aşağıdaki menüden seçebilirsin:`);

                await interaction.update({ embeds: [embed], components: [itemRow] });
            }
            else if (interaction.customId.startsWith("market_item_select_")) {
                const selectedCategory = interaction.customId.split("_")[3];
                const selectedItemKey = interaction.values[0];
                const itemData = prices[selectedCategory][selectedItemKey];

                const rawData = cfg.getRaw(selectedCategory, selectedItemKey);
                const itemName = rawData ? rawData.name : selectedItemKey;

                const modal = new ModalBuilder()
                    .setCustomId(`buy_modal_${selectedCategory}_${selectedItemKey}`)
                    .setTitle(`Satın Al: ${itemName}`);

                const quantityInput = new TextInputBuilder()
                    .setCustomId("buy_quantity")
                    .setLabel("Kaç adet almak istiyorsun?")
                    .setPlaceholder("Örn: 1, 5, 10")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const modalRow = new ActionRowBuilder().addComponents(quantityInput);
                modal.addComponents(modalRow);

                await interaction.showModal(modal);

                try {
                    const modalSubmit = await interaction.awaitModalSubmit({
                        filter: (i) => i.customId === `buy_modal_${selectedCategory}_${selectedItemKey}` && i.user.id === msg.author.id,
                        time: 60000
                    });

                    const quantityStr = modalSubmit.fields.getTextInputValue("buy_quantity");
                    const quantity = parseInt(quantityStr);

                    if (isNaN(quantity) || quantity <= 0) {
                        return modalSubmit.reply({ content: `${negative} Geçersiz bir miktar girdin. Lütfen sadece sayı kullan.`, ephemeral: true });
                    }

                    const totalPrice = itemData.price * quantity;
                    const data = loadJson("data.json");
                    ensureUser(data, msg.author.id);
                    const p = data[msg.author.id];

                    if ((p[itemData.currency] || 0) < totalPrice) {
                        return modalSubmit.reply({ content: `${negative} Hesabında yeterli bakiye bulunmuyor! Gereken: **${totalPrice}**, Sende olan: **${p[itemData.currency] || 0}**`, ephemeral: true });
                    }

                    p[itemData.currency] -= totalPrice;

                    if (selectedCategory === "crates") {
                        if (!p.crates) p.crates = {};
                        p.crates[selectedItemKey] = (p.crates[selectedItemKey] || 0) + quantity;
                    } else if (selectedCategory === "kits") {
                        if (!p.kits) p.kits = {};
                        p.kits[selectedItemKey] = (p.kits[selectedItemKey] || 0) + quantity;
                    }

                    await saveJson("data.json", data);

                    const resInfo = itemChecker.exists(selectedItemKey);
                    const currencyData = allCurrencies[itemData.currency] || {};
                    const currencyEmoji = currencyData.emoji || "";
                    const currencyName = currencyData.name || itemData.currency;

                    await modalSubmit.reply({
                        content: `${check} **${msg.author.username}**, başarıyla **${quantity}x** ${resInfo.name} satın aldın!\n*Ödenen Tutar:* ${currencyEmoji} **${totalPrice}** **${currencyName}**`
                    });

                    await botMessage.edit({ components: [] });

                } catch (err) {}
            }
        });

        collector.on("end", () => {
            botMessage.edit({ components: [] }).catch(() => {});
        });
    }
};