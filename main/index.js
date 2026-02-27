// Import Module 
require("dotenv").config()

const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys")
const pino = require("pino")
const chalk = require("chalk")
const readline = require("readline")
const { resolve } = require("path")
const { version } = require("os")

// Metode Pairing
const usePairingCode = true

// Prompt Input Terminal
async function question(promt) {
    process.stdout.write(promt)
    const r1 = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })

    return new Promise((resolve) => r1.question("", (ans) => {
        r1.close()
        resolve(ans)
    }))
    
}

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./PlanaSesi')
  
  // New version
  const { version, isLatest } = await fetchLatestBaileysVersion()
  console.log(`Plana Using WA v${version.join('.')}, isLatest: ${isLatest}`)

  const plana = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: !usePairingCode,
    auth: state,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    version: version,
    syncFullHistory: true,
    generateHighQualityLinkPreview: true,
    getMessage: async (key) => {
      if (store) {
        const msg = await store.loadMessage(key.remoteJid, key.id)
        return msg?.message || undefined
      }
      return proto.Message.fromObject({})
    }
  })

  // Handle Pairing Code
  if (usePairingCode && !plana.authState.creds.registered) {
    try {
      const phoneNumber = await question('☘️ Input Your Number:\n')
      const code = await plana.requestPairingCode(phoneNumber.trim())
      console.log(`🎁 Pairing Code : ${code}`)
    } catch (err) {
      console.error('Failed get the pairing code:', err)
    }
  }
    // Save Login session
    plana.ev.on("creds.update", saveCreds)

    // Connection Information
plana.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update
    if (connection === "close") {
        console.log(chalk.red("Disconnected, trying connect again"))
        connectToWhatsApp()
    } else if (connection === "open") {
        console.log(chalk.green("✔ Bot Success Connected"))

        // 🔔 Running reminder after connect to Whatsapp
        const { startReminder } = require("../commands/reminder")
        startReminder(plana)

        // Always active status
        plana.sendPresenceUpdate("available").catch(err =>
            console.warn("⚠️ Failed update status available:", err.message)
        )

        // Load module watch status/story
    require("../commands/plana-reaction")(plana)
    }
})

    // Respond Message
    plana.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0]

        if (!msg.message) return

        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
        const sender = msg.key.remoteJid
        const pushname = msg.pushName || "Ichan"

        // Log Message on Terminal
        const listColor = ["red", "green", "yellow", "magenta", "cyan", "white", "blue"]
        const randomColor = listColor[Math.floor(Math.random() * listColor.length)]

        console.log(
            chalk.green.bold("[ Message on WhatsApp ]"),
            chalk[randomColor](pushname),
            chalk[randomColor](" : "),
            chalk.white(body)
            
        )

        require("./Plana")(plana, m)
    })
    
}

// Connection to WhatsApp
connectToWhatsApp()