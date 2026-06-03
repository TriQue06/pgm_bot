const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ComponentType } = require("discord.js");
const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");
const cfg = require("../../utils/configLoader");
const itemChecker = require("../../utils/itemChecker");

// Piyasayı (fiyatları) string formatında hazırlayan yardımcı fonksiyon
function generateMarketText(prices, categoryFilter = null) {
    let text = "";
    const targetCategories = categoryFilter ? [categoryFilter] : ["crates", "kits"];

    for (const cat of targetCategories) {
        if (!prices[cat] || Object.keys(prices[cat]).length === 0) continue;

        const title = cat === "crates" ? "## 📦 Kasalar" : "## 🎒 Turnuva Kitleri";
        text += `${title}\n`;

        for (const [key, itemData] of Object.entries(prices[cat])) {
            const res = itemChecker.exists(key);
            if (!res) continue;

            const currencyData = cfg.getRaw("currencies", itemData.currency);
            const currencyEmoji = currencyData?.emoji || "";
            const currencyName = currencyData?.name || itemData.currency;

            // İstediğin o kusursuz format: - **<:emoji:> Eşya** `kod` → <:emoji:> **Bedel** **Birim**
            text += `- ${res.name} \`${key}\` → ${currencyEmoji} **${itemData.price}** **${currencyName}**\n`;
        }
        text += "\n";
    }
    return text.trim();
}

module.exports = {
    name: "market",
    aliases: ["shop", "m", "satınal", "buy"],
    description: "Marketteki ürünleri interaktif olarak listeler ve satın alma imkanı sunar.",
    async execute(client, msg, args) {
        const prices = loadJson("prices.json");
        const ui = cfg.getAll("ui");

        const check = ui.check?.emoji || "";
        const negative = ui.negative?.emoji || "";

        // 1. AŞAMA: İLK EKRAN - TÜM LİSTEYİ HAZIRLAMA
        const fullMarketText = generateMarketText(prices);

        const categoryMenu = new StringSelectMenuBuilder()
            .setCustomId("market_category_select")
            .setPlaceholder("Alışveriş yapmak istediğin kategoriyi seç...")
            .addOptions([
                new StringSelectMenuOptionBuilder()
                    .setLabel("Kasalar")
                    .setDescription("Sadece envanter kasalarını listele")
                    .setValue("crates"),
                new StringSelectMenuOptionBuilder()
                    .setLabel("Turnuva Kitleri")
                    .setDescription("Sadece turnuva kitlerini listele")
                    .setValue("kits")
            ]);

        const categoryRow = new ActionRowBuilder().addComponents(categoryMenu);

        const embed = new EmbedBuilder()
            .setColor(0x2B2D31)
            .setTitle(`${check} PGM BOT // Market`)
            .setDescription(`Sistemdeki güncel fiyatlar aşağıdadır.\n\n${fullMarketText}\n\n👇 İncelemek ve satın almak istediğin kategoriyi seç:`)
            .setFooter({ text: "PGM BOT Mağaza Sistemi" })
            .setTimestamp();

        const botMessage = await msg.reply({ embeds: [embed], components: [categoryRow] });

        const collector = botMessage.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 180000 });

        collector.on("collect", async (interaction) => {
            if (interaction.user.id !== msg.author.id) {
                return interaction.reply({ content: `${negative} Bu market menüsünü sadece komutu yazan kişi kullanabilir.`, ephemeral: true });
            }

            // 2. AŞAMA: KATEGORİ SEÇİLİNCE EKRANI DARALTMA VE ÜRÜNLERİ MENÜYE DİZME
            if (interaction.customId === "market_category_select") {
                const selectedCategory = interaction.values[0]; // 'crates' veya 'kits'
                const categoryItems = prices[selectedCategory];

                if (!categoryItems || Object.keys(categoryItems).length === 0) {
                    return interaction.reply({ content: `${negative} Bu kategoride şu an satılık ürün bulunmuyor.`, ephemeral: true });
                }

                // Sadece seçilen kategorinin fiyat listesini oluşturuyoruz (Kasa seçildiyse kitler gidiyor)
                const filteredMarketText = generateMarketText(prices, selectedCategory);

                const itemMenu = new StringSelectMenuBuilder()
                    .setCustomId(`market_item_select_${selectedCategory}`)
                    .setPlaceholder("Satın almak istediğin ürünü seç...");

                for (const [key, itemData] of Object.entries(categoryItems)) {
                    const res = itemChecker.exists(key);
                    if (!res) continue;

                    const currencyData = cfg.getRaw("currencies", itemData.currency);
                    const currencyName = currencyData ? currencyData.name : itemData.currency;

                    itemMenu.addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel(res.name.replace(/\*\*/g, "").replace(/<:[a-zA-Z0-9_]+:[0-9]+>\s*/g, "")) // Temiz isim
                            .setDescription(`Fiyat: ${itemData.price} ${currencyName}`)
                            .setValue(key)
                    );
                }

                const itemRow = new ActionRowBuilder().addComponents(itemMenu);

                // Embed içeriğini sadece o kategorinin kalacağı şekilde güncelliyoruz
                embed.setDescription(`Sistemdeki güncel fiyatlar aşağıdadır.\n\n${filteredMarketText}\n\n👇 Satın almak istediğin ürünü aşağıdaki menüden seçebilirsin:`);

                await interaction.update({ embeds: [embed], components: [itemRow] });
            }

            // 3. AŞAMA: MİKTAR GİRİŞ MODALI
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

                // 4. AŞAMA: SATIN ALMA İŞLEMİ
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

                    saveJson("data.json", data);

                    const resInfo = itemChecker.exists(selectedItemKey);
                    const currencyData = cfg.getRaw("currencies", itemData.currency);
                    const currencyEmoji = currencyData?.emoji || "";
                    const currencyName = currencyData?.name || itemData.currency;

                    await modalSubmit.reply({
                        content: `${check} **${msg.author.username}**, başarıyla **${quantity}x** ${resInfo.name} satın aldın!\n*Ödenen Tutar:* ${currencyEmoji} **${totalPrice}** **${currencyName}**`
                    });

                    await botMessage.edit({ components: [] });

                } catch (err) {
                    // Zaman aşımı hatasını sönümle
                }
            }
        });

        collector.on("end", () => {
            botMessage.edit({ components: [] }).catch(() => {});
        });
    }
};