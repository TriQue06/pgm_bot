process.on('unhandledRejection', (reason) => {
    console.error(reason);
});

process.on('uncaughtException', (err) => {
    console.error(err);
});

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, Collection, ActivityType } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");

if (fs.existsSync(commandsPath)) {
    const commandFolders = fs.readdirSync(commandsPath);

    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        if (!fs.lstatSync(folderPath).isDirectory()) continue;

        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));
        for (const file of commandFiles) {
            const command = require(path.join(folderPath, file));

            if (command.name) {
                client.commands.set(command.name.toLowerCase(), command);
                if (command.aliases && Array.isArray(command.aliases)) {
                    command.aliases.forEach(alias => client.commands.set(alias.toLowerCase(), command));
                }
            }
        }
    }
}

client.once("ready", (c) => {
    console.log(`Bot: ${c.user.tag}`);
    client.user.setPresence({
        activities: [{
            name: '!yardım',
            type: ActivityType.Playing
        }],
        status: 'online',
    });
});

client.on("messageCreate", async (msg) => {
    if (msg.author.bot || !msg.guild || !msg.content.startsWith("!")) return;

    const args = msg.content.slice(1).trim().split(/\s+/);
    const commandName = args.shift()?.toLowerCase();

    const command = client.commands.get(commandName);
    if (!command || !command.execute) return;

    try {
        await command.execute(client, msg, args);
    } catch (error) {
        console.error(error);
        msg.reply("Bir hata oluştu.");
    }
});

client.on("interactionCreate", async (interaction) => {
    if (interaction.isStringSelectMenu() && interaction.customId === "ses_secim") {
        const sesCommand = client.commands.get("ses");
        if (sesCommand?.handleSelect) {
            try {
                await sesCommand.handleSelect(client, interaction);
            } catch (err) {
                console.error(err);
                if (!interaction.replied && !interaction.deferred)
                    interaction.reply({ content: "Bir hata oluştu.", ephemeral: true });
            }
        }
        return;
    }

    if (interaction.isButton() && interaction.customId === "resume_music") {
        const pauseCommand = client.commands.get("pause");
        if (pauseCommand?.handleButton) {
            try {
                await pauseCommand.handleButton(client, interaction);
            } catch (err) {
                console.error(err);
                if (!interaction.replied && !interaction.deferred)
                    interaction.reply({ content: "Bir hata oluştu.", ephemeral: true });
            }
        }
        return;
    }
});

client.login(process.env.TOKEN);