const fs = require("fs");
const path = require("path");
const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
} = require("@discordjs/voice");
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require("discord.js");
const ffmpegPath = require("ffmpeg-static");
const cfg = require("../../utils/configLoader");
const { states } = require("../../utils/voiceState");

process.env.FFMPEG_PATH = ffmpegPath;

const MUSICS_DIR = path.join(__dirname, "../../musics");

function getMusicFiles() {
    if (!fs.existsSync(MUSICS_DIR)) return [];
    return fs.readdirSync(MUSICS_DIR).filter(f => f.endsWith(".mp3"));
}

function playNext(guildId) {
    const state = states.get(guildId);
    if (!state) return;

    if (state.loop && state.currentFile) {
        const resource = createAudioResource(state.currentFile);
        state.player.play(resource);
        return;
    }

    if (state.queue.length > 0) {
        const next = state.queue.shift();
        state.currentFile = next.filePath;
        state.trackName = next.trackName;
        const resource = createAudioResource(next.filePath);
        state.player.play(resource);
        return;
    }

    // kuyruk bitti, kanalda bekle
}

function setupPlayer(player, guildId) {
    player.on(AudioPlayerStatus.Idle, () => playNext(guildId));
    player.on("error", (err) => console.error("Ses oynatma hatası:", err));
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

        const options = files.map(file =>
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
        const trackName = path.basename(fileName, ".mp3");

        if (!fs.existsSync(filePath)) {
            return interaction.reply({ content: `${negative} Dosya bulunamadı.`, ephemeral: true });
        }

        const member = await interaction.guild.members.fetch(interaction.user.id);
        const voiceChannel = member.voice.channel;
        if (!voiceChannel) {
            return interaction.reply({ content: `${negative} Önce bir ses kanalına gir.`, ephemeral: true });
        }

        await interaction.deferUpdate();

        const guildId = interaction.guild.id;
        const existingState = states.get(guildId);
        const isActive = existingState &&
            (existingState.player.state.status === AudioPlayerStatus.Playing ||
             existingState.player.state.status === AudioPlayerStatus.Paused);

        if (isActive) {
            existingState.queue.push({ filePath, trackName });
            const pos = existingState.queue.length;
            await interaction.editReply({
                content: `${check} **${trackName}** kuyruğa eklendi. (Sıra: ${pos})`,
                components: []
            });
            return;
        }

        let connection;
        let player;

        if (existingState) {
            existingState.player.stop();
            connection = existingState.connection;
            player = existingState.player;

            if (connection.joinConfig.channelId !== voiceChannel.id) {
                connection.destroy();
                connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId,
                    adapterCreator: interaction.guild.voiceAdapterCreator
                });
                player = createAudioPlayer();
                setupPlayer(player, guildId);
                connection.subscribe(player);
            }
        } else {
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator
            });
            player = createAudioPlayer();
            setupPlayer(player, guildId);
            connection.subscribe(player);
        }

        states.set(guildId, {
            connection,
            player,
            currentFile: filePath,
            trackName,
            loop: false,
            queue: []
        });

        const resource = createAudioResource(filePath);
        player.play(resource);

        await interaction.editReply({
            content: `${check} **Şu an çalıyor:** ${trackName}`,
            components: []
        });
    }
};
