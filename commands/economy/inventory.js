const { EmbedBuilder } = require("discord.js");
const { loadJson, saveJson, ensureUser } = require("../../utils/dataManager");

// Emojiler
const EMOJIS = {
    pgmcoin: "<:pgmcoin:1469015534493368442>",
    ruby: "<:ruby:1469015535911178280>",
    diamond: "<:diamond:1469015532836491274>",
    crystal: "<:crystal:1469015530760569058>",
    kit: "<:kit:1469016921478266880>",
    cuzdan: "<:cuzdan:1469017634950480097>",
    canta: "<:canta:1469018374930698240>",
    bronzkasa: "<:bronzkasa:1469400728442245347>",
    gumuskasa: "<:gumuskasa:1469400730589724828>",
    altinkasa: "<:altinkasa:1469400726043361443>",
    envanterkasa: "<:envanterkasa:1469403053097619578>"
};

// Görünen İsimler (Çeviri Listesi)
const DISPLAY_NAMES = {
    // Kasalar
    bronzkasa: "Bronz Kasa",
    gumuskasa: "Gümüş Kasa",
    altinkasa: "Altın Kasa",
    
    // Kitler
    madenci: "Madenci",
    nisanci: "Nişancı",
    demirci: "Demirci",
    buyucu: "Büyücü",
    kral: "Kral"
};

// Yardımcı Fonksiyon: İsmi Formatla
function formatName(key) {
    // 1. Listede varsa oradan al
    if (DISPLAY_NAMES[key.toLowerCase()]) {
        return DISPLAY_NAMES[key.toLowerCase()];
    }
    // 2. Yoksa baş harfini büyüt (örn: elmas -> Elmas)
    return key.charAt(0).toUpperCase() + key.slice(1);
}

module.exports = {
    name: "!envanter",
    aliases: ["!inv", "!canta", "!profile", "!e"],
    description: "Kullanıcının bakiyesini, kitlerini ve kasalarını gösterir.",
    execute(client, msg, args) {
        const user = msg.mentions.users.first() || msg.author;
        const data = loadJson("data.json");
        
        ensureUser(data, user.id);
        saveJson("data.json", data);

        const p = data[user.id];

        // 1. Kit Listesi
        const kitList = Object.entries(p.kits).length > 0
            ? Object.entries(p.kits).map(([k, v]) => `### ${EMOJIS.kit} ${formatName(k)} (x${v})`).join("\n")
            : "";

        // 2. Kasa Listesi
        const crateList = (p.crates && Object.entries(p.crates).length > 0)
            ? Object.entries(p.crates).map(([k, v]) => {
                // Eğer EMOJIS içinde kasanın adıyla bir emoji varsa onu kullan, yoksa envanterkasa kullan
                const emoji = EMOJIS[k.toLowerCase()] || EMOJIS.envanterkasa;
                return `### ${emoji} ${formatName(k)} (x${v})`;
            }).join("\n")
            : "";

        // 3. Cüzdan
        const walletList = [
            `### ${EMOJIS.pgmcoin} PGM Coin: ${p.pgmcoin}`,
            `### ${EMOJIS.ruby} Yakut: ${p.ruby}`,
            `### ${EMOJIS.diamond} Elmas: ${p.diamond}`,
            `### ${EMOJIS.crystal} Kristal: ${p.crystal}`
        ].join("\n");

        // Embed İçeriğini Oluştur
        let descriptionContent = `# ${EMOJIS.cuzdan} Envanter\n${walletList}\n\n`;

        // Eğer kasa varsa listeye ekle
        if (crateList) {
            descriptionContent += `# ${EMOJIS.envanterkasa} Kasalar\n${crateList}\n\n`;
        } else {
            descriptionContent += `# ${EMOJIS.envanterkasa} Kasalar\n### _Kasa bulunmuyor._\n\n`;
        }

        // Eğer kit varsa listeye ekle
        if (kitList) {
            descriptionContent += `# ${EMOJIS.canta} Kitler\n${kitList}`;
        } else {
            descriptionContent += `# ${EMOJIS.canta} Kitler\n### _Kit bulunmuyor._`;
        }

        const embed = new EmbedBuilder()
            .setColor(0x2B2D31)
            .setAuthor({ name: `${user.username} Envanteri`, iconURL: user.displayAvatarURL() })
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setDescription(descriptionContent)
            .setFooter({ text: "PGM BOT", iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        msg.channel.send({ embeds: [embed] });
    }
};