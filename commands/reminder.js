/*
Nama Fitur: Reminder
License: MIT
Author: Ichan & Lyra
*/
const fs = require("fs")
const path = require("path")
const schedule = require("node-schedule")

const reminderPath = path.join(__dirname, "dataBase", "reminder.json")

// 🔄 Fungsi buat load data reminder
function loadReminderData() {
  if (!fs.existsSync(reminderPath)) {
    fs.writeFileSync(reminderPath, JSON.stringify({}, null, 2))
  }
  return JSON.parse(fs.readFileSync(reminderPath, "utf8"))
}

// 💾 Fungsi buat save data reminder
function saveReminderData(data) {
  fs.writeFileSync(reminderPath, JSON.stringify(data, null, 2))
}

// 🕐 Jadwal utama reminder
async function startReminder(plana) {
  const data = loadReminderData()

  for (const [user, userData] of Object.entries(data)) {
    if (!userData.enabled || !userData.time || !userData.jid) continue

    const [hour, minute] = userData.time.split(":").map(Number)
    const timezone = userData.timezone || "Asia/Jakarta"

    // ⏰ Buat jadwal harian
    schedule.scheduleJob({ hour, minute, tz: timezone }, async () => {
      const today = new Date()
      const dayName = today.toLocaleString("id-ID", { weekday: "long", timeZone: timezone }).toLowerCase()
      const dateStr = today.toISOString().split("T")[0]

      // 📚 Ambil jadwal pelajaran hari ini (jika ada)
      const jadwalHariIni = userData.schedule?.[dayName] || []

    let message = `🌸 Selamat pagi ${user}~ 🌸\n\n`

    if (jadwalHariIni.length > 0) {
      message += `✨ *Jadwal pelajaran ${dayName.charAt(0).toUpperCase() + dayName.slice(1)} kamu:* ✨\n\n`
      message += jadwalHariIni.map((pel, i) => `${i + 1}. ${pel}`).join("\n")
      message += `\n\n🕕 *${userData.time} WIB*\n`
      message += `Jangan telat sekolah yaa~ 🤗💖`
} else {
  message += `\n\nKamu gak ada jadwal hari ini~ ✨\nNikmati waktu istirahatmu dengan baik ya~🤗💖`
}

      try {
        await plana.sendMessage(userData.jid, { text: message })
        console.log(`✅ Reminder terkirim ke ${user} (${userData.jid}) pada ${userData.time}`)
      } catch (err) {
        console.error(`❌ Gagal kirim reminder ke ${user}:`, err.message)
      }
    })
  }
}

module.exports = { startReminder }