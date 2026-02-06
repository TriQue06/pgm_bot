module.exports = {
    name: "!bilgi",
    description: "PGM Bot hakkında bilgi verir",

    execute(message) {
        message.channel.send(`
        **🤖 PGM Bot | Bilgi Menüsü**

        Merhaba! Ben **PGM Bot**
        Sunucunu daha eğlenceli, düzenli ve rekabetçi hale getirmek için buradayım.

        ━━━━━━━━━━━━━━━━━━
        📊 **Genel Bilgiler**
        • Bot Adı: **PGM Bot**
        • Sürüm: **v0.38.0 Beta**
        • Geliştirici: **BayPGM & Eros**
        • Durum: **Çevrimiçi**

        ━━━━━━━━━━━━━━━━━━
        💰 **Ekonomi Sistemi**
        • <:pgmcoin:> PGM Coin
        • 🛒 Market & Kitler
        • 🎁 Günlük ödüller

        ━━━━━━━━━━━━━━━━━━
        ⚔️ **Eğlence**
        • 🎲 Mini oyunlar
        • 🧩 Şans sistemleri

        ━━━━━━━━━━━━━━━━━━
        📖 **Komutlar**
        • !yardim
        • !market
        • !ping
        • !pgmyisik

        ━━━━━━━━━━━━━━━━━━
        ✨ **PGM Bot – Premium Bot**
        `);
    }
};
