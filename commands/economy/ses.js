const fs = require("fs");
const path = require("path");
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    getVoiceConnection
} = require("@discordjs/voice");
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require("discord.js");
const ffmpegPath = require("ffmpeg-static");
const cfg = require("../../utils/configLoader");

process.env.FFMPEG_PATH = ffmpegPath;

const MUSICS_DIR = path.join(__dirname, "../../musics");

function getMusicFiles() {
    if (!fs.existsSync(MUSICS_DIR)) return [];
    return fs.readdirSync(MUSICS_DIR).filter(f => f.endsWith(".mp3"));
}

module.exports = {
    name: "ses",
    aliases: ["müzik", "muzik", "play"],

    async execute(client, msg, args) {
        const ui = cfg.getAll("ui");
        const check = ui.check?.emoji || "✅";
        const negative = ui.negative?.emoji || "❌";

        const files = getMusicFiles();

        if (files.length === 0) {
            return msg.reply(`${negative} \`musics/\` klasöründe hiç MP3 bulunamadı.`);
        }

        const member = await msg.guild.members.fetch(msg.author.id);
        if (!member.voice.channel) {
            return msg.reply(`${negative} Önce bir ses kanalına gir.`);
        }

        const options = files.map((file, i) =>
            new StringSelectMenuOptionBuilder()
                .setLabel(path.basename(file, ".mp3"))
                .setValue(file)
        );

        const select = new StringSelectMenuBuilder()
            .setCustomId("ses_secim")
            .setPlaceholder("Bir parça seç...")
            .addOptions(options.slice(0, 25));

        const row = new ActionRowBuilder().addComponents(select);

        await msg.reply({
            content: `${check} **Çalmak istediğin parçayı seç:**`,
            components: [row]
        });
    },

    async handleSelect(client, interaction) {
        const ui = cfg.getAll("ui");
        const check = ui.check?.emoji || "✅";
        const negative = ui.negative?.emoji || "❌";

        const fileName = interaction.values[0];
        const filePath = path.join(MUSICS_DIR, fileName);

        if (!fs.existsSync(filePath)) {
            return interaction.reply({ content: `${negative} Dosya bulunamadı.`, ephemeral: true });
        }

        const member = interaction.guild.members.cache.get(interaction.user.id)
            || await interaction.guild.members.fetch(interaction.user.id);

        const voiceChannel = member.voice.channel;
        if (!voiceChannel) {
            return interaction.reply({ content: `${negative} Önce bir ses kanalına gir.`, ephemeral: true });
        }

        await interaction.deferUpdate();

        const existingConnection = getVoiceConnection(interaction.guild.id);
        if (existingConnection) existingConnection.destroy();

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator
        });

        const resource = createAudioResource(filePath);
        const player = createAudioPlayer();

        player.play(resource);
        connection.subscribe(player);

        const trackName = path.basename(fileName, ".mp3");

        await interaction.editReply({
            content: `${check} **Şu an çalıyor:** ${trackName}`,
            components: []
        });

        player.on(AudioPlayerStatus.Idle, () => {
            connection.destroy();
        });

        player.on("error", (err) => {
            console.error("Ses oynatma hatası:", err);
            connection.destroy();
        });
    }
};
