//================================
//🔹Module Configuration & Command
//================================
const fs = require("fs")
const path = require("path")
const { autoAI } = require("./autoAI")
const { resetMemory } = require("../commands/memory")

if (global.planaAIEnabled === undefined) global.planaAIEnabled = true

const cache = {}
if (!global.processedMsgIds) global.processedMsgIds = new Map()
if (!global.userLocks) global.userLocks = new Map() 

// Load personality.json
const personalityPath = path.join(__dirname, "..", "commands", "dataBase", "personality.json")
const personalityData = JSON.parse(fs.readFileSync(personalityPath, "utf8"))
const persona = [
  personalityData.plana.prompt,
  personalityData.plana.rules,
  personalityData.plana.behavior
].filter(Boolean).join("\n\n")

module.exports = async (plana, m) => {
  try {
    const msg = m?.messages?.[0]
    if (!msg?.message) return

    const sender = msg.key?.remoteJid
    if (!sender) return

    if (msg.key.fromMe || sender === "status@broadcast") return

    const msgId = msg.key.id || ""
    const processedKey = `${sender}:${msgId}`
    const now = Date.now()
    const DUP_WINDOW = 30 * 1000 // 30 detik

    for (const [k, ts] of global.processedMsgIds) {
      if (now - ts > DUP_WINDOW) global.processedMsgIds.delete(k)
    }

    if (global.processedMsgIds.has(processedKey)) return
    global.processedMsgIds.set(processedKey, now)

    if (global.userLocks.get(sender)) return
    global.userLocks.set(sender, true)

    try {
      await plana.readMessages([msg.key])
    } catch {}

    // Ambil isi teks
    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      ""
    let text = body.trim()
    if (!text) return

    // ==========================
    // 🔹 Info group / private
    // ==========================
    const isPrivate = !sender.endsWith("@g.us")
    const mentionRegex = /(^|\s|[,.!?])plana\b/i
    const isMentioned = mentionRegex.test(text)

    const prefix = "."
    const isCommand = text.startsWith(prefix)

    if (!isPrivate && !isMentioned && !isCommand) return

    let userText = text
    if (!userText) userText = text

    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
    let quotedText = ""

    if (quoted) {
      quotedText =
        quoted.conversation ||
        quoted.extendedTextMessage?.text ||
        quoted.imageMessage?.caption ||
        ""
    }

    if (isCommand) {
      const command = userText.slice(prefix.length).split(" ")[0].toLowerCase()
      const allowed = ["lapor", "chat-on", "chat-off", "chat-status", "test", "reset"]

      if (!allowed.includes(command)) return

      if (command === "lapor") {
        const { handleReport } = require("./commands/lapor")
        await handleReport(plana, msg, userText, prefix)
        return
      }

      if (command === "chat-on") {
        global.planaAIEnabled = true
        await plana.sendMessage(sender, { text: "AutoAI Online" }, { quoted: msg })
        return
      }

      if (command === "chat-off") {
        global.planaAIEnabled = false
        await plana.sendMessage(sender, { text: "AutoAI Offline" }, { quoted: msg })
        return
      }

      if (command === "chat-status") {
        const status = global.planaAIEnabled ? "Online" : "Offline"
        await plana.sendMessage(sender, { text: `📊 AutoAI Status: ${status}` }, { quoted: msg })
        return
      }
    }

      // 🔹 Keyword manual
      if (userText === "/test") {
        await plana.sendMessage(sender, { text: "ini keyword test" }, { quoted: msg })
        global.userLocks.delete(sender)
        return
      }

      if (userText === "/reset") {
        await resetMemory(sender)
        await plana.sendMessage(sender, { text: "Memori kamu sudah dihapus 🥀" }, { quoted: msg })
        global.userLocks.delete(sender)
        return
      }

    if (cache[sender] && cache[sender][userText]) {
      global.userLocks.delete(sender)
      return
    }

    // Simulasi typing 
    await plana.presenceSubscribe(sender)
    await plana.sendPresenceUpdate("composing", sender)
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 1000))

    // Jika autoAI dimatikan
    if (!global.planaAIEnabled) {
      global.userLocks.delete(sender)
      return
    }

    let aiResponse

    const fullPrompt = `${persona}\n\nPesan dari user: "${userText}"`
    aiResponse = await autoAI(sender, fullPrompt)

    await plana.sendPresenceUpdate("paused", sender)

    // 📨 Kirim hasil respon ke WA
    if (aiResponse && typeof aiResponse === "string" && !aiResponse.startsWith("⚠️")) {
      await plana.sendMessage(sender, { text: aiResponse.trim() }, { quoted: msg })

      // Simpan cache respon untuk anti-spam
      if (!cache[sender]) cache[sender] = {}
      cache[sender][userText] = aiResponse
    } else {
      console.log("⚠️ AI gagal atau null, tidak kirim pesan ke WA")
    }

  } catch (err) {
    console.error("Error di plana.js:", err)
  } finally {
    const sender = m?.messages?.[0]?.key?.remoteJid
    if (sender) global.userLocks.delete(sender)
  }
}