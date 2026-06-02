process.on('unhandledRejection', (reason) => {
    console.error('⚠️ [HATA] Yakalanamayan Reddetme:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('⚠️ [HATA] Beklenmedik İstisna:', err);
});

require("dotenv").config();
const fs = require("fs");
const { Client, GatewayIntentBits, Collection, ActivityType } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers 
    ]
});

client.commands = new Collection();

const commandFolders = fs.readdirSync("./commands");

console.log('📂 Komutlar yükleniyor...');
for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith(".js"));
    for (const file of commandFiles) {
        const command = require(`./commands/${folder}/${file}`);
        
        // Komut adını doğrudan küçük harfe çevirerek belleğe alıyoruz
        client.commands.set(command.name.toLowerCase(), command);
        
        if (command.aliases && Array.isArray(command.aliases)) {
            command.aliases.forEach(alias => client.commands.set(alias.toLowerCase(), command));
        }
    }
}
console.log('✅ Tüm komutlar başarıyla belleğe alındı.');

// 🛠️ DÜZELTME: clientReady yerine v14 standardı olan ready kullanıldı
client.once("ready", (c) => {
    console.log(`\n---------------------------------`);
    console.log(`🚀 PGM BOT Çevrim içi!`);
    console.log(`🤖 Bot: ${c.user.tag}`);
    console.log(`📅 Tarih: ${new Date().toLocaleString('tr-TR')}`);
    console.log(`---------------------------------\n`);
    
    client.user.setPresence({
        activities: [{ 
            name: 'custom', 
            type: ActivityType.Custom, 
            state: '🛠️ "!yardım" // PGM BOT v0.38.2' 
        }],
        status: 'online',
    });
});

client.on("messageCreate", async (msg) => {
    if (msg.author.bot || !msg.guild) return;

    // Prefix kontrolü
    if (!msg.content.startsWith("!")) return;

    const args = msg.content.slice(1).trim().split(/\s+/);
    
    // 🛠️ DÜZELTME: Başına tekrar "!" eklemek yerine saf komut adını alıyoruz (Örn: !add yazınca "add" kalır)
    const commandName = args.shift()?.toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    console.log(`[KOMUT] ${msg.author.tag}: !${commandName} ${args.join(" ")}`);

    try {
        await command.execute(client, msg, args);
    } catch (error) {
        console.error(`❌ Komut Hatası (!${commandName}):`, error);
        msg.reply("Bu komutu çalıştırırken sistemsel bir hata oluştu. Lütfen geliştiriciye bildirin.");
    }
});

client.login(process.env.TOKEN);