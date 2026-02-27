/*
Nama Fitur: Ichan
License: MIT
Author: Ichan & Lyra
*/
const fs = require("fs")
const path = require("path")

const file = path.join(__dirname, "dataBase", "personality.json")

// Buat file kalau belum ada
function ensureFile() {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify({}, null, 2))
  }
}

// Ambil data personality.json
function loadPersonality() {
  ensureFile()
  try {
    const data = fs.readFileSync(file, "utf8")
    return JSON.parse(data || "{}")
  } catch (err) {
    console.error("❌ Gagal baca personality.json:", err)
    return {}
  }
}

// Simpan perubahan ke file
function savePersonality(data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
  } catch (err) {
    console.error("❌ Gagal simpan personality.json:", err)
  }
}

// Ambil personality tertentu (misal: "plana")
function getPersonality(name) {
  const data = loadPersonality()
  return data[name] || null
}

// Tambah / ubah personality
function setPersonality(name, value) {
  const data = loadPersonality()
  data[name] = value
  savePersonality(data)
}

// Hapus satu personality
function deletePersonality(name) {
  const data = loadPersonality()
  if (data[name]) {
    delete data[name]
    savePersonality(data)
  }
}

// Reset semua personality
function resetAllPersonality() {
  savePersonality({})
}

module.exports = {
  getPersonality,
  setPersonality,
  deletePersonality,
  resetAllPersonality
}