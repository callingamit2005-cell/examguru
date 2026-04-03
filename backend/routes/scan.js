const express = require("express");
const router  = express.Router();

// ─── Debug endpoint — test keys without image ────────────────────────────────
router.get("/test", async (req, res) => {
  const results = { groq: "not_tested", note: "Gemini disabled — Groq only" };
  try {
    const Groq = require("groq-sdk");
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const r = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 10,
      messages: [{ role: "user", content: "Say OK" }]
    });
    results.groq = r.choices[0]?.message?.content ? "✅ working" : "❌ empty";
  } catch (e) {
    results.groq = "❌ " + e.message;
  }
  res.json(results);
});

// ─── Gemini Vision ────────────────────────────────────────────────────────────
async function scanWithGemini(imageBase64, mimeType, subject, examType) {
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  // Try models in order
  const models = ["gemini-1.5-flash-8b", "gemini-1.5-pro", "gemini-2.0-flash"];
  let lastErr;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([
        `You are an expert ${examType || "exam"} tutor in India. Subject: ${subject || "General"}.
A student uploaded a photo of their doubt from notebook/textbook.
Read the image carefully and respond in Hinglish (Hindi+English mix):

**📸 Maine dekha:** [what is in image]
**❓ Question:** [exact question from image]
**✅ Solution:** [step by step solution]
**🎯 Exam Tip:** [key concept to remember]
**💡 Yaad rakho:** [memory trick]`,
        { inlineData: { data: imageBase64, mimeType } }
      ]);
      const text = result.response.text();
      if (text) {
        console.log(`✅ Gemini scan OK (${modelName})`);
        return text;
      }
    } catch (e) {
      lastErr = e;
      console.warn(`⚠️ Gemini ${modelName} failed:`, e.message);
      continue;
    }
  }
  throw lastErr || new Error("All Gemini models failed");
}

// ─── Groq Vision fallback ─────────────────────────────────────────────────────
async function scanWithGroq(imageBase64, mimeType, subject, examType) {
  const Groq = require("groq-sdk");
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const models = [
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
  ];

  let lastErr;
  for (const model of models) {
    try {
      const response = await client.chat.completions.create({
        model,
        max_tokens: 1500,
        temperature: 0.1,
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
            { type: "text", text: `Expert ${examType || "exam"} tutor. Subject: ${subject || "General"}.
Read the question/doubt in this image and solve it step by step in Hinglish.
Format: 📸 Maine dekha → ❓ Question → ✅ Solution → 💡 Yaad rakho` }
          ]
        }]
      });
      const result = response.choices[0]?.message?.content;
      if (result) {
        console.log(`✅ Groq scan OK (${model})`);
        return result;
      }
    } catch (e) {
      lastErr = e;
      console.warn(`⚠️ Groq ${model} failed:`, e.message);
      continue;
    }
  }
  throw lastErr || new Error("All Groq vision models failed");
}

// ─── Main scan endpoint ───────────────────────────────────────────────────────
router.post("/", async (req, res, next) => {
  try {
    const { imageBase64, mimeType, subject, examType } = req.body;

    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: "imageBase64 and mimeType required" });
    }

    let result = null;
    let geminiError = null;
    let groqError   = null;

    // Groq Vision — primary (Gemini disabled until billing enabled)
    if (process.env.GROQ_API_KEY) {
      try {
        result = await scanWithGroq(imageBase64, mimeType, subject, examType);
      } catch (e) {
        groqError = e.message;
        console.error("❌ Groq scan failed:", groqError);
      }
    }

    if (!result) {
      // Helpful error message
      const errDetail = [
        geminiError ? `Gemini: ${geminiError}` : null,
        groqError   ? `Groq: ${groqError}`     : null,
      ].filter(Boolean).join(" | ");
      
      console.error("[SCAN BOTH FAILED]", errDetail);
      return res.status(503).json({
        error: "📸 Photo scan abhi available nahi. Text mein type karke poochho!",
        debug: process.env.NODE_ENV !== "production" ? errDetail : undefined
      });
    }

    res.json({ result, success: true });
  } catch (err) {
    console.error("[SCAN ERROR]", err.message);
    next(err);
  }
});

module.exports = router;
