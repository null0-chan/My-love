/* 
Nama Fifur: AI plana
License: MIT
Author: Ichan & Lyra
*/
const { getMemory, addMemory } = require("../commands/memory")
const { getPersonality } = require("../commands/personality")
const { GoogleGenAI } = require("@google/genai")

// Inisialisasi AI (kunci otomatis diambil dari env)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY
})

async function autoAI(user, text) {
  try {
    const personality = getPersonality("plana")
    const history = getMemory(user)

    // Build parts
    const parts = []

    parts.push({
      text: [
        personality?.prompt ?? "",
        personality?.rules ?? "",
        personality?.behavior ?? ""
      ].join("\n\n")
    })

    history.forEach(h => {
      parts.push({ text: `${h.role}: ${h.content}` })
    })

    parts.push({ text: `user: ${text}` })

    // =============================
    // 🔄 Gemini 2.5 Flash (benar)
    // =============================
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      tools: [
          { googleSearch: {} }
          ],
      contents: [
        {
          role: "user",
          parts: parts
        }
      ]
    })

    const reply =
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ AI tidak merespons."

    // =============================
    // 💾 Simpan ke memori
    // =============================
    let cleanUserText = text
    if (typeof text === "string" && text.includes('Pesan dari user: "')) {
      const match = text.match(/Pesan dari user: "(.*)"/s)
      if (match) cleanUserText = match[1]
    }

    addMemory(user, "user", cleanUserText.trim())
    addMemory(user, "ai", reply.trim())

    return reply
  } catch (err) {
    console.error("❌ Error di autoAI:", err.message)
    return null
  }
}

module.exports = { autoAI }