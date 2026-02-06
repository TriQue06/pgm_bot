process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

require("dotenv").config();
const fs = require("fs");
const { Client, GatewayIntentBits, Collection, ActivityType } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

// --- Komut Yükleyici (Command Handler) ---
const commandFolders = fs.readdirSync("./commands");

for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith(".js"));
    for (const file of commandFiles) {
        const command = require(`./commands/${folder}/${file}`);
        client.commands.set(command.name, command);
        
        // Takma adları (aliases) yükle
        if (command.aliases) {
            command.aliases.forEach(alias => client.commands.set(alias, command));
        }
    }
}

client.on("clientReady", () => {
    console.log(`✅ Bot giriş yaptı: ${client.user.tag}`);
    client.user.setPresence({
        activities: [{ name: '"!yardim" kullan! • PGM BOT', type: ActivityType.Custom }],
        status: 'online',
    });
});

client.on("messageCreate", (msg) => {
    if (msg.author.bot) return;

    const args = msg.content.trim().split(/\s+/);
    const commandName = args.shift()?.toLowerCase();

    // Komut var mı kontrol et
    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        command.execute(client, msg, args);
    } catch (error) {
        console.error(error);
        msg.reply("Bu komutu çalıştırırken bir hata oluştu.");
    }
});

client.login(process.env.TOKEN);
