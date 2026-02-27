/*
Nama Fitur: Memori AI
License: MIT
AAuthor: Ichan & Lyra
*/
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")

const file = path.join(__dirname, "dataBase", "memory.json")

// Baca file JSON, kalau belum ada bikin baru
function loadMemory() {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "{}")
  }
  try {
    const data = fs.readFileSync(file, "utf8")
    return JSON.parse(data || "{}")
  } catch (err) {
    console.error("❌ Gagal baca memory.json:", err)
    return {}
  }
}

// Simpan memori ke file
function saveMemory(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

// Ambil memori user tertentu
function getMemory(user) {
  const mem = loadMemory()
  return mem[user] || []
}

// Tambahin data ke memori user (dengan salt unik)
function addMemory(user, role, content) {
  const mem = loadMemory()
  if (!mem[user]) mem[user] = []

  // 🧂 Tambahkan salt acak biar tiap pesan unik
  const salt = crypto.randomBytes(4).toString("hex")
  mem[user].push({ role, content, salt })

  saveMemory(mem)
}

// Inject personality ke awal memori user
function injectPersonality(user, personalityText) {
  const mem = loadMemory()

  mem[user] = [
    {
      role: "system",
      content: personalityText,
      salt: crypto.randomBytes(4).toString("hex")
    }
  ]

  saveMemory(mem)
}

// Reset memori user tertentu
function resetMemory(user) {
  const mem = loadMemory()
  delete mem[user]
  saveMemory(mem)
}

module.exports = { getMemory, addMemory, resetMemory, injectPersonality }