process.on('unhandledRejection', (reason) => {
    console.error('⚠️ [HATA] Yakalanamayan Reddetme:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('⚠️ [HATA] Beklenmedik İstisna:', err);
});

require("dotenv").config();
const fs = require("fs");
const { Client, GatewayIntentBits, Collection, ActivityType, REST, Routes } = require("discord.js");

// Mesaj içeriğini okuma (MessageContent) ve GuildMessages intentleri tamamen temizlendi,
// çünkü artık sadece Slash Etkileşimlerini (Interactions) dinliyoruz.
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();
const slashCommandsArray = [];

const commandFolders = fs.readdirSync("./commands");

console.log('📂 Slash komutları yükleniyor...');
for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith(".js"));
    for (const file of commandFiles) {
        const command = require(`./commands/${folder}/${file}`);

        // Komutun geçerli bir Slash Command yapısı (.data) olup olmadığını kontrol ediyoruz
        if (command.data && typeof command.data.toJSON === "function") {
            const commandName = command.data.name.toLowerCase();
            client.commands.set(commandName, command);
            slashCommandsArray.push(command.data.toJSON());
        } else {
            console.warn(`⚠️ [UYARI] ${file} dosyasında geçerli bir Slash Command verisi (.data) bulunamadı, atlandı.`);
        }
    }
}
console.log('✅ Tüm geçerli komutlar belleğe alındı.');

client.once("ready", async (c) => {
    console.log(`\n---------------------------------`);
    console.log(`🚀 PGM BOT Çevrim içi! (Tamamen Slash Sürümü)`);
    console.log(`🤖 Bot: ${c.user.tag}`);
    console.log(`📅 Tarih: ${new Date().toLocaleString('tr-TR')}`);
    console.log(`---------------------------------\n`);

    // ⚙️ OTO-DEPLOY: Komutları otomatik olarak Discord API'ye işleme
    if (slashCommandsArray.length > 0) {
        try {
            console.log(`🔄 ${slashCommandsArray.length} adet komut Discord Uygulama Paneline kaydediliyor...`);
            const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

            // Küresel (Global) kayıt: Komutlar botun ekli olduğu tüm sunucularda aktif olur
            await rest.put(
                Routes.applicationCommands(c.user.id),
                { body: slashCommandsArray }
            );
            console.log('✅ Tüm komutlar Discord API ye işlendi ve kullanıma hazır!');
        } catch (error) {
            console.error('❌ Komutlar kaydedilirken API hatası oluştu:', error);
        }
    }

    client.user.setPresence({
        activities: [{
            name: 'custom',
            type: ActivityType.Custom,
            state: '🛠️ Resmi Discord Uygulaması // PGM BOT'
        }],
        status: 'online',
    });
});

// ====================================================================
// 🎛️ TEK TETİKLEYİCİ: SLASH COMMAND INTERACTION HANDLER
// ====================================================================
client.on("interactionCreate", async (interaction) => {
    // Sadece chat (eğik çizgi /) komutlarını dinle
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName.toLowerCase());
    if (!command || !command.executeSlash) return;

    console.log(`[/] ${interaction.user.tag} komutu çalıştırdı: /${interaction.commandName}`);

    try {
        await command.executeSlash(interaction);
    } catch (error) {
        console.error(`❌ Komut Hatası (/${interaction.commandName}):`, error);

        const errorMessage = "Bu işlem gerçekleştirilirken sistemsel bir hata oluştu. Lütfen geliştiriciye bildirin.";

        // Eğer komut içinde zaten bir yanıt verildiyse veya delege edildiyse (defer) followUp kullan, yoksa direkt reply at
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMessage, ephemeral: true }).catch(() => {});
        } else {
            await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => {});
        }
    }
});

client.login(process.env.TOKEN);