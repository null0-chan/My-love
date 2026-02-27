// =========================
// 🔹 Plana Status Watcher
// 🔹 License: MIT
// 🔹 Author: Ichan & Lyra
// =========================

const { autoAI } = require("../main/autoAI")
module.exports = (plana) => {

  if (!global.statusProcessed) global.statusProcessed = new Set()

  plana.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (msg.key.remoteJid !== "status@broadcast") return

    const owner = msg.key.participant
    if (!owner) return

    const statusId = msg.messageTimestamp
    const uniqueKey = `${owner}:${statusId}`

    if (global.statusProcessed.has(uniqueKey)) return
    global.statusProcessed.add(uniqueKey)

    const caption =
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      msg.message?.extendedTextMessage?.text ||
      ""

    try {
      await plana.readMessages([msg.key]);
    } catch (err) {
      console.log("⚠️ Reaction gagal:", err.message)
    }

    const isMentioned = /\bplana\b/i.test(caption)
    if (!isMentioned) return

    // Panggil AI
    let reply
    try {
      reply = await autoAI(owner, caption.trim())
    } catch (err) {
      console.log("❌ Error AI process:", err.message)
      return
    }

    if (!reply) return

    // Kirim reply ke chat
    try {
      await plana.sendMessage(owner, {
        text: reply,
        contextInfo: {
          stanzaId: msg.key.id,
          participant: owner,
          quotedMessage: msg.message
        }
      })
    } catch (err) {
      console.log("⚠️ Gagal kirim reply:", err.message)
    }

  })
}