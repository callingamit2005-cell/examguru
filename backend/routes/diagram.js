const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Topics that have good visual diagrams ────────────────────────────────────
// For abstract topics (polity, economy, ethics) — skip image, show nothing
const VISUAL_TOPICS = [
  // Biology
  "cell","pollen","mitosis","meiosis","dna","photosynthesis","heart","neuron",
  "kidney","nephron","brain","lung","liver","digestive","respiratory","circulatory",
  "chromosome","enzyme","osmosis","ecosystem","food chain","water cycle","nitrogen cycle",
  "carbon cycle","rock cycle","mitochondria","chloroplast","ribosome","virus","bacteria",
  // Physics
  "atom","molecule","electric circuit","wave","electromagnetic","refraction","reflection",
  "lens","magnet","magnetic field","nuclear fission","nuclear fusion","transformer",
  "simple harmonic","projectile","newton laws","ohm law","thermodynamics",
  // Chemistry
  "periodic table","chemical bond","ionic bond","covalent bond","electrolysis","benzene",
  "electron configuration","titration","distillation","chromatography",
  // Geography/Earth
  "plate tectonics","volcano","earthquake","solar system","moon phases","atmosphere",
  "monsoon","glacier","river delta","rock formation","weather map","topographic",
  // History (maps/battles)
  "battle of plassey","mughal empire","british india","indus valley","ancient india",
  "world war","french revolution","roman empire","silk road",
  // Math
  "pythagoras","trigonometry","quadratic","parabola","probability","geometry","calculus",
  // Diagrams/structures
  "parliament building","supreme court","structure","flowchart","cycle","process",
  "map","timeline","chart","graph","diagram",
];

function needsDiagram(concept) {
  const c = concept.toLowerCase();
  return VISUAL_TOPICS.some(t => c.includes(t));
}

// ─── AI extracts Wikipedia concept ───────────────────────────────────────────
async function extractConcept(question, subject) {
  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 20,
      temperature: 0,
      messages: [{
        role: "user",
        content: `Convert to Wikipedia search term (2-4 words, no action words like explain/samjhao/kya hai):
"${question}"
Reply ONLY with the term:`
      }]
    });
    return res.choices[0].message.content.trim().replace(/['"]/g,"").replace(/^(term:|answer:)/i,"").trim().slice(0,60);
  } catch {
    return question.replace(/^(explain|what is|samjhao|batao|kya hai|describe)\s+/gi,"").trim().slice(0,50);
  }
}

// ─── Wikimedia Commons: only for VISUAL topics ────────────────────────────────
async function getCommonsImage(concept) {
  try {
    const queries = [`${concept} diagram labeled`, `${concept} structure`, concept];
    for (const q of queries) {
      const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search` +
        `&srsearch=${encodeURIComponent(q)}&srnamespace=6&format=json&srlimit=20&origin=*`;
      const res = await fetch(url);
      const data = await res.json();
      const files = data.query?.search || [];

      const scored = files.map(f => {
        const t = f.title.toLowerCase();
        let score = 0;
        if (t.endsWith('.svg')) score += 10;
        if (t.endsWith('.png')) score += 6;
        if (t.includes('diagram')) score += 9;
        if (t.includes('label')) score += 8;
        if (t.includes('scheme') || t.includes('schematic')) score += 7;
        if (t.includes('structure')) score += 6;
        if (t.includes('cross') || t.includes('section')) score += 5;
        if (t.includes('anatomy')) score += 7;
        // Penalize: paintings, photos, portraits → likely irrelevant
        if (t.includes('painting') || t.includes('portrait') || t.includes('photo')) score -= 15;
        if (t.includes('devi') || t.includes('temple') || t.includes('art')) score -= 10;
        if (t.endsWith('.jpg') || t.endsWith('.jpeg')) score -= 4;
        return { ...f, score };
      }).filter(f => f.score > 0) // only positive scores
        .sort((a, b) => b.score - a.score);

      for (const file of scored.slice(0, 5)) {
        const fUrl = `https://commons.wikimedia.org/w/api.php?action=query` +
          `&titles=${encodeURIComponent(file.title)}&prop=imageinfo` +
          `&iiprop=url&iiurlwidth=900&format=json&origin=*`;
        const fRes = await fetch(fUrl);
        const fData = await fRes.json();
        const pages = fData.query?.pages || {};
        for (const p of Object.values(pages)) {
          const imgUrl = p.imageinfo?.[0]?.url;
          if (imgUrl && !imgUrl.match(/\.(ogg|webm|mp3|mp4)$/i)) {
            return { url: imgUrl, title: file.title.replace("File:",""), source:"Wikimedia Commons",
              link:`https://commons.wikimedia.org/wiki/${encodeURIComponent(file.title)}` };
          }
        }
      }
    }
    return null;
  } catch { return null; }
}

// ─── Wikipedia thumbnail ──────────────────────────────────────────────────────
async function getWikiThumb(concept) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query` +
      `&titles=${encodeURIComponent(concept)}&prop=pageimages` +
      `&pithumbsize=900&format=json&origin=*`;
    const res = await fetch(url);
    const data = await res.json();
    const pages = data.query?.pages || {};
    for (const p of Object.values(pages)) {
      if (p.thumbnail?.source) {
        // Skip if thumbnail looks like a person portrait (for abstract topics)
        return { url: p.thumbnail.source, title: p.title, source:"Wikipedia",
          link:`https://en.wikipedia.org/wiki/${encodeURIComponent(p.title)}` };
      }
    }
    return null;
  } catch { return null; }
}

const cache = new Map();

router.post("/", async (req, res, next) => {
  try {
    const { concept: rawConcept, subject, question } = req.body;
    if (!rawConcept && !question) return res.status(400).json({ error: "concept required" });

    const input = question || rawConcept;
    const concept = await extractConcept(input, subject || "General");
    const cacheKey = concept.toLowerCase().trim();

    if (cache.has(cacheKey)) return res.json(cache.get(cacheKey));

    // Only fetch diagram if topic is visual
    const isVisual = needsDiagram(concept) || needsDiagram(input);

    console.log(`🖼️ Diagram: "${concept}" | visual=${isVisual} | from: "${input?.slice(0,40)}"`);

    let result = null;
    if (isVisual) {
      // Try Commons first (better labeled diagrams), then Wikipedia
      const [commons, wiki] = await Promise.allSettled([
        getCommonsImage(concept),
        getWikiThumb(concept)
      ]);
      result = (commons.status==="fulfilled" && commons.value) ||
               (wiki.status==="fulfilled" && wiki.value);
    }

    const response = result
      ? { type:"image", concept, url:result.url, title:result.title, source:result.source, link:result.link }
      : { type:"none", concept };

    cache.set(cacheKey, response);
    setTimeout(() => cache.delete(cacheKey), 60*60*1000);
    res.json(response);
  } catch (err) { next(err); }
});

module.exports = router;
