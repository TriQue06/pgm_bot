const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ComponentType } = require("discord.js");
const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");
const cfg = require("../../utils/configLoader");
const itemChecker = require("../../utils/itemChecker");

// Önbellek destekli fiyat listesi oluşturucu
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
    // Resmi Discord Uygulaması Yapısı (Slash Command Registration)
    data: new SlashCommandBuilder()
        .setName("market")
        .setDescription("Marketteki ürünleri interaktif olarak listeler ve gizlice satın almanızı sağlar."),

    async executeSlash(interaction) { // Handler'ınızın slash tetikleyicisine göre burayı execute veya executeSlash yapabilirsiniz
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
                    .setDescription(`${cratesTitle} kategorisini listele`)
                    .setValue("crates"),
                new StringSelectMenuOptionBuilder()
                    .setLabel(kitsTitle)
                    .setDescription(`${kitsTitle} kategorisini listele`)
                    .setValue("kits")
            ]);

        const categoryRow = new ActionRowBuilder().addComponents(categoryMenu);

        const embed = new EmbedBuilder()
            .setColor(0x2B2D31)
            .setTitle(`${check} PGM BOT // Market`)
            .setDescription(`Sistemdeki güncel fiyatlar aşağıdadır.\n\n${fullMarketText}\n\nİncelemek ve satın almak istediğin kategoriyi seç:`)
            .setFooter({ text: "PGM BOT Mağaza Sistemi" })
            .setTimestamp();

        // HARİKA KISIM: Mesajı doğrudan yazılan kanalda, sadece komutu kullanan kişiye özel (ephemeral) açıyoruz!
        const botMessage = await interaction.reply({ embeds: [embed], components: [categoryRow], ephemeral: true, fetchReply: true });

        const collector = botMessage.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 180000 });

        collector.on("collect", async (inter) => {
            // Güvenlik kontrolü (Zaten ephemeral olduğu için başkası göremez ama tetikleyiciyi sağlama alıyoruz)
            if (inter.user.id !== interaction.user.id) return;

            // 2. AŞAMA: KATEGORİ SEÇİMİ
            if (inter.customId === "market_category_select") {
                const selectedCategory = inter.values[0];
                const categoryItems = prices[selectedCategory];

                if (!categoryItems || Object.keys(categoryItems).length === 0) {
                    return inter.reply({ content: `${negative} Bu kategoride şu an satılık ürün bulunmuyor.`, ephemeral: true });
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

                await inter.update({ embeds: [embed], components: [itemRow] });
            }

            // 3. AŞAMA: MODAL GÖSTERİMİ
            else if (inter.customId.startsWith("market_item_select_")) {
                const selectedCategory = inter.customId.split("_")[3];
                const selectedItemKey = inter.values[0];
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

                await inter.showModal(modal);

                // 4. AŞAMA: MODAL SUBMIT (SATIN ALMA)
                try {
                    const modalSubmit = await inter.awaitModalSubmit({
                        filter: (i) => i.customId === `buy_modal_${selectedCategory}_${selectedItemKey}` && i.user.id === interaction.user.id,
                        time: 60000
                    });

                    const quantityStr = modalSubmit.fields.getTextInputValue("buy_quantity");
                    const quantity = parseInt(quantityStr);

                    if (isNaN(quantity) || quantity <= 0) {
                        return modalSubmit.reply({ content: `${negative} Geçersiz bir miktar girdin. Lütfen sadece sayı kullan.`, ephemeral: true });
                    }

                    const totalPrice = itemData.price * quantity;
                    const data = loadJson("data.json");
                    ensureUser(data, interaction.user.id);
                    const p = data[interaction.user.id];

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

                    saveJson("data.json", data);

                    const resInfo = itemChecker.exists(selectedItemKey);
                    const currencyData = allCurrencies[itemData.currency] || {};
                    const currencyEmoji = currencyData.emoji || "";
                    const currencyName = currencyData.name || itemData.currency;

                    await modalSubmit.reply({
                        content: `${check} **${interaction.user.username}**, başarıyla **${quantity}x** ${resInfo.name} satın aldın!\n*Ödenen Tutar:* ${currencyEmoji} **${totalPrice}** **${currencyName}**`,
                        ephemeral: true
                    });

                    // İşlem bitince menüyü temizle
                    await interaction.editReply({ components: [] });

                } catch (err) {
                    // Zaman aşımı toleransı
                }
            }
        });

        collector.on("end", () => {
            interaction.editReply({ components: [] }).catch(() => {});
        });
    }
};