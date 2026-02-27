/*
Nama Fitur: Lapor via bot
License: MIT
Author: Ichan & Lyra
*/
const ownerList = ["62xxxxxxxxxx"] //nomor owner (only number)

async function handleReport(conn, msg, userText, prefix) {
  const args = userText.slice(prefix.length + 5).trim()
  if (!args) {
    return conn.sendMessage(msg.key.remoteJid, { 
      text: "Hehe~ isi dulu laporannya ya 💌" 
    }, { quoted: msg })
  }

  const sender = msg.key.remoteJid
  const user = msg.pushName || "Unknown"
  const nomor = msg.key.participant?.split("@")[0] || msg.key.remoteJid.split("@")[0]
  const waktu = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })

  const report = `🌸 *Laporan Baru Masuk!* 🌸\n\n` +
    `*Dari:* ${user}\n` +
    `*Nomor:* ${nomor}\n` +
    `*Waktu:* ${waktu}\n\n` +
    `*Isi:* ${args}\n\n`

  const contactMsg = {
    key: { 
      fromMe: false, 
      participant: "0@s.whatsapp.net",
      remoteJid: "status@broadcast"
    },
    message: {
      contactMessage: {
        displayName: `Laporan dari ${user}`,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${user}\nTEL;waid=${nomor}:${nomor}\nEND:VCARD`
      }
    }
  }

  for (const owner of ownerList) {
    await conn.sendMessage(`${owner}@s.whatsapp.net`, { text: report }, { quoted: contactMsg })
  }

  await conn.sendMessage(sender, { 
    text: "✨ Laporanmu udah dikirim ke Owner~ makasih ya 💞" 
  }, { quoted: msg })
}

module.exports = { handleReport }