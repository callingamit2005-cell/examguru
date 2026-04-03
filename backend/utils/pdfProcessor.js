/**
 * pdfProcessor.js — PDF → Smart Chapters
 * Extracts text, detects subject/class, splits into chapters
 */

const https = require("https");
const http  = require("http");

function fetchBuffer(url, redirectCount = 0) {
  // Handle Google Drive large file confirmation
  if (url.includes("drive.google.com/uc") && !url.includes("confirm=")) {
    url = url + "&confirm=t";
  }
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const options = {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/pdf,*/*",
      },
      timeout: 60000,
    };
    const req = lib.get(url, options, (res) => {
      // Follow redirects (max 10)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (redirectCount > 10) return reject(new Error("Too many redirects"));
        return fetchBuffer(res.headers.location, redirectCount + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      
      // Check if it's an HTML page (virus scan warning from Google)
      const contentType = res.headers["content-type"] || "";
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        const buf = Buffer.concat(chunks);
        // If Google returned HTML virus scan page, extract confirm token
        if (contentType.includes("text/html")) {
          const html = buf.toString("utf8");
          const confirmMatch = html.match(/confirm=([0-9A-Za-z_]+)/);
          if (confirmMatch) {
            const id = url.match(/id=([a-zA-Z0-9_-]+)/)?.[1];
            if (id) {
              const newUrl = `https://drive.google.com/uc?export=download&id=${id}&confirm=${confirmMatch[1]}`;
              return fetchBuffer(newUrl, redirectCount + 1).then(resolve).catch(reject);
            }
          }
          // Check if it is really HTML (not a PDF)
          if (html.includes("<!DOCTYPE") || html.includes("<html")) {
            return reject(new Error("Google returned HTML instead of PDF. Make sure file is publicly shared."));
          }
        }
        resolve(buf);
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Download timeout — PDF too large or slow connection")); });
  });
}

function detectClassLevel(text, title="") {
  const s = (title+" "+text.slice(0,500)).toLowerCase();
  const map = [
    ["class 6","CLASS_6"],["class vi","CLASS_6"],
    ["class 7","CLASS_7"],["class vii","CLASS_7"],
    ["class 8","CLASS_8"],["class viii","CLASS_8"],
    ["class 9","CLASS_9"],["class ix","CLASS_9"],
    ["class 10","CLASS_10"],["class x ","CLASS_10"],
    ["class 11","CLASS_11_SCI"],["class xi","CLASS_11_SCI"],
    ["class 12","CLASS_12_SCI"],["class xii","CLASS_12_SCI"],
  ];
  for (const [k,v] of map) if (s.includes(k)) return v;
  return null;
}

function detectSubject(text, title="") {
  const s = (title+" "+text.slice(0,1000)).toLowerCase();
  const subjects = [
    {n:"Mathematics",  k:["mathematics","maths","algebra","geometry","trigonometry","arithmetic","calculus"]},
    {n:"Physics",      k:["physics","motion","force","energy","electricity","magnetism","optics","waves"]},
    {n:"Chemistry",    k:["chemistry","chemical","atoms","molecules","periodic table","reactions","acid"]},
    {n:"Biology",      k:["biology","cells","organisms","photosynthesis","genetics","ecosystem"]},
    {n:"History",      k:["history","civilisation","empire","freedom","revolution","ancient","medieval"]},
    {n:"Geography",    k:["geography","climate","soil","rivers","mountains","resources","population"]},
    {n:"Polity",       k:["polity","constitution","democracy","parliament","fundamental rights"]},
    {n:"Economy",      k:["economics","gdp","inflation","poverty","agriculture","industry"]},
    {n:"Science",      k:["science","experiment","matter","light","sound","electricity"]},
    {n:"Social Science",k:["social science","social studies","civics","democratic"]},
    {n:"English",      k:["english","grammar","comprehension","literature","prose","poetry"]},
    {n:"Hindi",        k:["hindi","vyakaran","kavita","gadya","bhasha"]},
    {n:"Environmental Studies", k:["evs","environmental","nature","plants","animals"]},
  ];
  let best=null, score=0;
  for (const s2 of subjects) {
    const sc = s2.k.filter(k => s.includes(k)).length;
    if (sc > score) { score=sc; best=s2.n; }
  }
  return best || "General";
}

function splitIntoChapters(text) {
  // Strategy 1: Look for NCERT-style "Chapter N" headings (most reliable)
  // Must appear on its own line with substantial content after it
  const chapterPatterns = [
    // "Chapter 1 Real Numbers" or "Chapter 1
Real Numbers"
    /^(?:Chapter|CHAPTER)\s+(\d+)\s*[

]+\s*([^

]{4,60})/gm,
    // "CHAPTER 1 - REAL NUMBERS" on same line
    /^(?:Chapter|CHAPTER)\s+(\d+)\s*[:\-–—]\s*([^

]{4,60})/gm,
    // "1. Real Numbers" — only at start of line, capital letter
    /^(\d+)\.\s+([A-Z][^

]{4,50})\s*$/gm,
    // "Unit 1" style
    /^(?:Unit|UNIT)\s+(\d+)\s*[:\-–]?\s*([^

]{4,60})/gm,
  ];

  let matches = [];
  for (const re of chapterPatterns) {
    let m;
    while ((m = re.exec(text)) !== null) {
      const num   = parseInt(m[1]);
      const title = m[2].trim();
      // Avoid duplicates (same position)
      if (!matches.find(x => Math.abs(x.index - m.index) < 50)) {
        matches.push({ index: m.index, num, title });
      }
    }
    if (matches.length >= 3) break; // Found chapters, stop trying patterns
  }

  // Sort by position in text
  matches.sort((a, b) => a.index - b.index);

  // Dedupe: remove chapters too close to each other (< 500 chars apart = false positive)
  matches = matches.filter((ch, i) => {
    if (i === 0) return true;
    return ch.index - matches[i-1].index > 500;
  });

  // If found reasonable number of chapters (2-25), use them
  if (matches.length >= 2 && matches.length <= 25) {
    const chapters = matches.map((ch, i) => {
      const start = ch.index;
      const end   = i + 1 < matches.length ? matches[i + 1].index : text.length;
      const t     = text.slice(start, end).trim();
      return { chapterNum: ch.num || i + 1, title: ch.title, text: t }; // full chapter, no limit
    }).filter(ch => ch.text.length > 200); // min 200 chars per chapter
    
    if (chapters.length > 0) return chapters;
  }

  // Fallback: Split by pages if text is long (every ~3000 chars = 1 unit)
  if (text.length > 6000) {
    const chunkSize = Math.floor(text.length / Math.min(10, Math.ceil(text.length / 4000)));
    const chunks = [];
    let i = 0;
    while (i < text.length && chunks.length < 15) {
      const chunk = text.slice(i, i + chunkSize);
      if (chunk.trim().length > 200) {
        chunks.push({ chapterNum: chunks.length + 1, title: `Section ${chunks.length + 1}`, text: chunk }); // full section
      }
      i += chunkSize;
    }
    return chunks;
  }

  // Last resort: single chunk
  return [{ chapterNum: 1, title: "Complete Content", text: text }]; // complete content
}

async function processPdf(urlOrBuffer, titleHint="") {
  let buffer;
  if (typeof urlOrBuffer === "string") {
    let fetchUrl = urlOrBuffer;
    // Google Drive: extract file ID and build download URL
    // Handles: /file/d/ID/view, /open?id=ID, drive.google.com/uc?id=ID
    if (urlOrBuffer.includes("drive.google.com") || urlOrBuffer.includes("docs.google.com")) {
      const match = urlOrBuffer.match(/\/d\/([a-zA-Z0-9_-]{20,})/);
      if (match) {
        const fileId = match[1];
        fetchUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
        console.log(`📥 Google Drive PDF: ${fileId}`);
      }
    }
    buffer = await fetchBuffer(fetchUrl);
    console.log(`✅ Downloaded: ${Math.round(buffer.length/1024)}KB`);
  } else {
    buffer = urlOrBuffer;
  }

  const pdfParse = require("pdf-parse");
  const data = await pdfParse(buffer, { max: 0 });
  const text = data.text;

  const title   = titleHint || data.info?.Title || "Uploaded PDF";
  const subject = detectSubject(text, title);
  const classLvl= detectClassLevel(text, title);
  const chapters= splitIntoChapters(text);

  return { title, subject, classLevel:classLvl, pages:data.numpages, totalChars:text.length, chapters, preview:text.slice(0,500) };
}

module.exports = { processPdf, detectSubject, detectClassLevel, splitIntoChapters };
