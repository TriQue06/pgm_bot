const { loadText } = require("../../utils/dataManager");

module.exports = {
    name: "!bilgi",
    aliases: ["!info", "!about"],
    description: "PGM Bot hakkında bilgi verir.",
    execute(client, msg, args) {
        const content = loadText(
            "bilgi.txt",
            "Bilgi dosyası (data/bilgi.txt) bulunamadı."
        );

        msg.channel.send(content);
    }
};
