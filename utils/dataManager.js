const fs = require("fs");
const fsPromises = require("fs").promises; // Asenkron yazma işlemleri için promises eklendi
const path = require("path");
const cfg = require("./configLoader");

const DATA_PATH = path.join(__dirname, "../data");

if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(DATA_PATH);
}

function getFilePath(filename) {
    return path.join(DATA_PATH, filename);
}

// Okuma işlemi hızlı olması açısından senkron kalabilir ancak hata yönetimi zırh gibi sağlamlaştırıldı
function loadJson(filename, fallback = {}) {
    const filePath = getFilePath(filename);
    if (!fs.existsSync(filePath)) {
        try {
            fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
        } catch (err) {
            console.error(`❌ [YAZMA HATASI] ${filename} oluşturulamadı:`, err);
        }
        return fallback;
    }
    try {
        const content = fs.readFileSync(filePath, "utf8");
        return content.trim() ? JSON.parse(content) : fallback;
    } catch (err) {
        console.error(`❌ [JSON HATASI] ${filename} okunurken hata oluştu, fallback dönüyor:`, err);
        return fallback;
    }
}

// KRİTİK DEĞİŞİKLİK: Veritabanı yazma işlemi asenkron yapıldı.
// Bot diske yazarken diğer slash komutlarını işlemeye devam edebilir, kilitlenme (I/O Block) yaşanmaz.
async function saveJson(filename, data) {
    const filePath = getFilePath(filename);
    try {
        await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
    } catch (err) {
        console.error(`❌ [ASENKRON YAZMA HATASI] ${filename} kaydedilemedi:`, err);
    }
}

function ensureUser(data, userId) {
    const currencies = cfg.getAll("currencies") || {};

    if (!data[userId]) {
        data[userId] = {
            kits: {},
            crates: {}
        };
    }

    // Para birimlerini güvenli bir şekilde döngüye sokuyoruz
    for (const key of Object.keys(currencies)) {
        if (data[userId][key] === undefined) {
            data[userId][key] = 0;
        }
    }

    if (!data[userId].kits) data[userId].kits = {};
    if (!data[userId].crates) data[userId].crates = {};

    return data;
}

module.exports = { loadJson, saveJson, ensureUser };