const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ComponentType } = require("discord.js");
const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");
const cfg = require("../../utils/configLoader");
const itemChecker = require("../../utils/itemChecker");

module.exports = {
    name: "turnuva",
    aliases: ["katıl", "katil", "join", "part", "katılımcılar", "kayıt"],
    description: "Turnuva kayıt işlemlerini ve interaktif katılımcı listesini yönetir.",
    async execute(client, msg, args) {
        const statusData = loadJson("tournament_status.json", { tournamentActive: false });
        const ui = cfg.getAll("ui");
        const check = ui.check?.emoji || "";
        const negative = ui.negative?.emoji || "";

        if (!statusData.tournamentActive) {
            return msg.reply(`${negative} **Şu anda aktif bir turnuva kaydı bulunmuyor!**`);
        }

        // 1. AŞAMA: ANA BUTONLAR
        const actionBtn = new ButtonBuilder()
            .setCustomId("btn_register_action")
            .setLabel("Katıl / Yönet")
            .setStyle(ButtonStyle.Success);

        const listBtn = new ButtonBuilder()
            .setCustomId("btn_register_list")
            .setLabel("Katılımcıları Gör")
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(actionBtn, listBtn);

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`${check} PGM BOT // Turnuva Sistemi`)
            .setDescription("Sistemde aktif bir turnuva bulunuyor!\n\nAşağıdaki butona tıklayarak **kaydını başlatabilir**, daha önce kayıt olduysan **kaydını yönetebilir** (isim/kit değiştirme, çekilme) veya turnuvaya katılanları görüntüleyebilirsin.")
            .setFooter({ text: "PGM Turnuva ve Etkinlik Sistemi" })
            .setTimestamp();

        const botMessage = await msg.reply({ embeds: [embed], components: [row] });
        const collector = botMessage.createMessageComponentCollector({ time: 300000 });

        collector.on("collect", async (interaction) => {
            const pData = loadJson("participants.json", { players: {} });
            const players = pData.players || {};

            // A) KATILIMCILARI GÖRME
            if (interaction.customId === "btn_register_list") {
                const listText = Object.entries(players).map(([name, data]) => {
                    const kitKey = typeof data === "string" ? data : data.kit;
                    if (kitKey === "yok") return `- **${name}** ➔ _Kitsiz_`;
                    const kitRes = itemChecker.exists(kitKey);
                    return `- **${name}** ➔ ${kitRes ? kitRes.name : kitKey}`;
                }).join("\n") || "_Henüz turnuvaya katılan aktif bir oyuncu yok._";

                const listEmbed = new EmbedBuilder()
                    .setColor(0x2B2D31)
                    .setTitle(`${check} PGM Turnuvası // Güncel Katılımcı Listesi`)
                    .setDescription(listText)
                    .setFooter({ text: `Toplam Oyuncu: ${Object.keys(players).length}` })
                    .setTimestamp();

                return interaction.reply({ embeds: [listEmbed], ephemeral: true });
            }

            // B) KAYIT VE YÖNETİM MERKEZİ
            if (interaction.customId === "btn_register_action") {
                // Kullanıcının kayıtlı olup olmadığını kontrol ediyoruz
                let userMcName = null;
                let userRecord = null;

                for (const [name, data] of Object.entries(players)) {
                    if (typeof data === "object" && data.discordId === interaction.user.id) {
                        userMcName = name;
                        userRecord = data;
                        break;
                    }
                }

                // ==========================================
                // DURUM 1: OYUNCU ZATEN KAYITLI (YÖNETİM PANELİ)
                // ==========================================
                if (userRecord) {
                    const editNameBtn = new ButtonBuilder().setCustomId("btn_manage_name").setLabel("İsmi Düzenle").setStyle(ButtonStyle.Primary);
                    const editKitBtn = new ButtonBuilder().setCustomId("btn_manage_kit").setLabel("Kiti Düzenle").setStyle(ButtonStyle.Primary);
                    const leaveBtn = new ButtonBuilder().setCustomId("btn_manage_leave").setLabel("Turnuvadan Çekil").setStyle(ButtonStyle.Danger);

                    const manageRow = new ActionRowBuilder().addComponents(editNameBtn, editKitBtn, leaveBtn);

                    const kitRes = itemChecker.exists(userRecord.kit);
                    const kitDisplay = kitRes ? kitRes.name : (userRecord.kit === "yok" ? "_Kitsiz_" : userRecord.kit);

                    const manageMsg = await interaction.reply({
                        content: `Turnuvaya **${userMcName}** adıyla ve ${kitDisplay} kitiyle kayıtlısın.\nLütfen yapmak istediğin işlemi seç:`,
                        components: [manageRow],
                        ephemeral: true,
                        fetchReply: true
                    });

                    try {
                        const manageInter = await manageMsg.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id, time: 120000 });

                        // --- İŞLEM: TURNUVADAN ÇEKİLME ---
                        if (manageInter.customId === "btn_manage_leave") {
                            const freshData = loadJson("data.json");
                            ensureUser(freshData, interaction.user.id);

                            // Kiti iade et
                            if (userRecord.kit !== "yok") {
                                if (!freshData[interaction.user.id].kits) freshData[interaction.user.id].kits = {};
                                freshData[interaction.user.id].kits[userRecord.kit] = (freshData[interaction.user.id].kits[userRecord.kit] || 0) + 1;
                            }

                            const freshPData = loadJson("participants.json", { players: {} });
                            delete freshPData.players[userMcName];

                            saveJson("data.json", freshData);
                            saveJson("participants.json", freshPData);

                            await manageInter.update({ content: `${check} Turnuvadan başarıyla ayrıldın. ${userRecord.kit !== "yok" ? "Kullandığın kit envanterine iade edildi." : ""}`, components: [] });
                        }

                        // --- İŞLEM: MC ADINI DEĞİŞTİRME ---
                        else if (manageInter.customId === "btn_manage_name") {
                            const modal = new ModalBuilder().setCustomId("edit_mc_modal").setTitle("MC Adını Düzenle");
                            const mcInput = new TextInputBuilder()
                                .setCustomId("new_mc_name")
                                .setLabel("Yeni Minecraft Adınız:")
                                .setValue(userMcName)
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                                .setMinLength(3)
                                .setMaxLength(16);

                            modal.addComponents(new ActionRowBuilder().addComponents(mcInput));
                            await manageInter.showModal(modal);

                            const modalSubmit = await manageInter.awaitModalSubmit({ time: 60000 });
                            const newName = modalSubmit.fields.getTextInputValue("new_mc_name").trim();

                            const freshPData = loadJson("participants.json", { players: {} });

                            if (newName !== userMcName && freshPData.players[newName] !== undefined) {
                                return modalSubmit.reply({ content: `${negative} **${newName}** kullanıcı adı başkası tarafından alınmış!`, ephemeral: true });
                            }

                            if (newName !== userMcName) {
                                freshPData.players[newName] = freshPData.players[userMcName];
                                delete freshPData.players[userMcName];
                                saveJson("participants.json", freshPData);
                            }

                            await modalSubmit.reply({ content: `${check} Minecraft adın başarıyla **${newName}** olarak güncellendi!`, ephemeral: true });
                            await manageMsg.edit({ components: [] }); // Orijinal butonları temizle
                        }

                        // --- İŞLEM: KİTİ DEĞİŞTİRME ---
                        else if (manageInter.customId === "btn_manage_kit") {
                            const data = loadJson("data.json");
                            ensureUser(data, interaction.user.id);
                            const pDataFresh = data[interaction.user.id];

                            const kitMenu = new StringSelectMenuBuilder()
                                .setCustomId("edit_kit_select")
                                .setPlaceholder("Kullanmak istediğin yeni kiti seç...");

                            kitMenu.addOptions(new StringSelectMenuOptionBuilder().setLabel("Kitsiz Katıl (Ekipmansız)").setValue("yok"));

                            if (pDataFresh.kits) {
                                let addedOptions = 1;
                                for (const [kitKey, amount] of Object.entries(pDataFresh.kits)) {
                                    if (amount > 0 && addedOptions < 25) {
                                        const kRes = itemChecker.exists(kitKey);
                                        if (kRes) {
                                            kitMenu.addOptions(new StringSelectMenuOptionBuilder()
                                                .setLabel(kRes.name.replace(/\*\*/g, "").replace(/<:[a-zA-Z0-9_]+:[0-9]+>\s*/g, ""))
                                                .setDescription(`Envanterinde ${amount} adet bulunuyor.`)
                                                .setValue(kitKey));
                                            addedOptions++;
                                        }
                                    }
                                }
                            }

                            await manageInter.update({ content: "👇 Lütfen turnuvada kullanmak istediğin YENİ kiti seç.", components: [new ActionRowBuilder().addComponents(kitMenu)] });

                            const kitSelectInter = await manageMsg.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id && i.customId === "edit_kit_select", time: 60000 });
                            const newKit = kitSelectInter.values[0];

                            if (newKit === userRecord.kit) {
                                return kitSelectInter.update({ content: `${negative} Zaten bu kiti kullanıyorsun.`, components: [] });
                            }

                            // Verileri tekrar tazeleyip değişimi yapalım
                            const finalData = loadJson("data.json");
                            ensureUser(finalData, interaction.user.id);
                            const pFinal = finalData[interaction.user.id];

                            // 1. Yeni kit yok ise ve envanterde yeterliyse düşür
                            if (newKit !== "yok") {
                                if (!pFinal.kits || !pFinal.kits[newKit] || pFinal.kits[newKit] <= 0) {
                                    return kitSelectInter.update({ content: `${negative} Envanterinde bu kit bulunamadı!`, components: [] });
                                }
                                pFinal.kits[newKit] -= 1;
                                if (pFinal.kits[newKit] <= 0) delete pFinal.kits[newKit];
                            }

                            // 2. Eski kiti iade et
                            if (userRecord.kit !== "yok") {
                                if (!pFinal.kits) pFinal.kits = {};
                                pFinal.kits[userRecord.kit] = (pFinal.kits[userRecord.kit] || 0) + 1;
                            }

                            // 3. Veritabanını kaydet
                            const finalPData = loadJson("participants.json", { players: {} });
                            finalPData.players[userMcName].kit = newKit;

                            saveJson("data.json", finalData);
                            saveJson("participants.json", finalPData);

                            const newKitRes = itemChecker.exists(newKit);
                            await kitSelectInter.update({ content: `${check} Kitin başarıyla ${newKitRes ? newKitRes.name : "_Kitsiz_"} olarak değiştirildi!`, components: [] });
                        }
                    } catch (e) {
                        // Kullanıcı panelde 2 dakika işlem yapmazsa butonlar ölür, hata vermesini engelliyoruz.
                    }
                    return;
                }

                // ==========================================
                // DURUM 2: OYUNCU KAYITLI DEĞİL (YENİ KAYIT EKRANI)
                // ==========================================
                const data = loadJson("data.json");
                ensureUser(data, interaction.user.id);
                const p = data[interaction.user.id];

                const kitMenu = new StringSelectMenuBuilder()
                    .setCustomId("register_kit_select")
                    .setPlaceholder("Turnuvada kullanmak istediğin kiti seç...");

                kitMenu.addOptions(new StringSelectMenuOptionBuilder().setLabel("Kitsiz Katıl (Ekipmansız)").setDescription("Turnuvaya hiçbir kit kullanmadan katıl.").setValue("yok"));

                if (p.kits && Object.keys(p.kits).length > 0) {
                    let addedOptions = 1;
                    for (const [kitKey, amount] of Object.entries(p.kits)) {
                        if (amount > 0 && addedOptions < 25) {
                            const kitRes = itemChecker.exists(kitKey);
                            if (kitRes) {
                                kitMenu.addOptions(new StringSelectMenuOptionBuilder()
                                    .setLabel(kitRes.name.replace(/\*\*/g, "").replace(/<:[a-zA-Z0-9_]+:[0-9]+>\s*/g, ""))
                                    .setDescription(`Envanterinde ${amount} adet bulunuyor.`)
                                    .setValue(kitKey));
                                addedOptions++;
                            }
                        }
                    }
                }

                const ephMsg = await interaction.reply({
                    content: "👇 Lütfen turnuvada kullanmak istediğin kiti seç. (Menüde sadece sahip olduğun kitler görünür)",
                    components: [new ActionRowBuilder().addComponents(kitMenu)],
                    ephemeral: true,
                    fetchReply: true
                });

                try {
                    const kitInteraction = await ephMsg.awaitMessageComponent({ filter: i => i.user.id === interaction.user.id && i.customId === "register_kit_select", time: 60000 });
                    const selectedKit = kitInteraction.values[0];

                    const modal = new ModalBuilder().setCustomId("register_mc_modal").setTitle("Turnuva Kaydı: Minecraft Adı");
                    const mcInput = new TextInputBuilder().setCustomId("mc_username").setLabel("Minecraft Kullanıcı Adınızı Giriniz:").setPlaceholder("Örn: BayPGM").setStyle(TextInputStyle.Short).setRequired(true).setMinLength(3).setMaxLength(16);
                    modal.addComponents(new ActionRowBuilder().addComponents(mcInput));
                    await kitInteraction.showModal(modal);

                    const modalSubmit = await kitInteraction.awaitModalSubmit({ filter: i => i.user.id === interaction.user.id && i.customId === "register_mc_modal", time: 60000 });
                    const mcName = modalSubmit.fields.getTextInputValue("mc_username").trim();

                    const freshPData = loadJson("participants.json", { players: {} });
                    if (freshPData.players[mcName] !== undefined) {
                        return modalSubmit.reply({ content: `${negative} **${mcName}** kullanıcı adı başkası tarafından zaten alınmış!`, ephemeral: true });
                    }

                    const freshData = loadJson("data.json");
                    ensureUser(freshData, interaction.user.id);
                    const pFresh = freshData[interaction.user.id];
                    let finalKitDisplay = "_Kitsiz_";

                    if (selectedKit !== "yok") {
                        if (!pFresh.kits || !pFresh.kits[selectedKit] || pFresh.kits[selectedKit] <= 0) {
                            return modalSubmit.reply({ content: `${negative} İşlem sırasında envanterindeki bu kit tükendi veya bulunamadı!`, ephemeral: true });
                        }
                        pFresh.kits[selectedKit] -= 1;
                        if (pFresh.kits[selectedKit] <= 0) delete pFresh.kits[selectedKit];
                        const kitRes = itemChecker.exists(selectedKit);
                        finalKitDisplay = kitRes ? kitRes.name : selectedKit;
                    }

                    freshPData.players[mcName] = { discordId: interaction.user.id, kit: selectedKit };
                    saveJson("data.json", freshData);
                    saveJson("participants.json", freshPData);

                    await modalSubmit.reply({ content: `${check} Turnuvaya başarıyla kayıt oldun!\n\n**Minecraft Adı:** \`${mcName}\`\n**Kullanılan Kit:** ${finalKitDisplay}`, ephemeral: true });
                    msg.channel.send(`${check} **${interaction.user.username}** turnuvaya \`${mcName}\` adıyla katıldı!`);

                } catch (err) {}
            }
        });
    }
};