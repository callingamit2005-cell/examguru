/**
 * content.js — Simple, Working Content Upload
 * Storage: backend/data/content/ (local JSON files)
 */
const express = require("express");
const router  = express.Router();
const fs      = require("fs");
const path    = require("path");
const https   = require("https");
const http    = require("http");

const DATA_DIR = path.join(__dirname, "../data/content");
const IDX_FILE = path.join(DATA_DIR, "_index.json");
const FOL_FILE = path.join(DATA_DIR, "_folders.json");

// Ensure dirs exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── Helpers ──────────────────────────────────────────────────────────────────
const readJSON  = (f, def) => { try { return JSON.parse(fs.readFileSync(f,"utf8")); } catch { return def; } };
const writeJSON = (f, d)   => fs.writeFileSync(f, JSON.stringify(d, null, 2));
const makeId    = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
const cleanId   = (s)      => s.toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,40);

function getFolderDir(folderId) {
  const d = path.join(DATA_DIR, `f_${folderId}`);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  return d;
}

function readContent(id) {
  // Search root and all folder dirs
  const root = path.join(DATA_DIR, `${id}.json`);
  if (fs.existsSync(root)) return readJSON(root, null);
  for (const d of fs.readdirSync(DATA_DIR)) {
    if (!d.startsWith("f_")) continue;
    const f = path.join(DATA_DIR, d, `${id}.json`);
    if (fs.existsSync(f)) return readJSON(f, null);
  }
  return null;
}

// ── URL Fetcher ───────────────────────────────────────────────────────────────
function fetchText(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    lib.get(url, { headers:{"User-Agent":"Mozilla/5.0"}, timeout:15000 }, (res) => {
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location)
        return fetchText(res.headers.location).then(resolve).catch(reject);
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const c = []; res.on("data",d=>c.push(d)); res.on("end",()=>resolve(Buffer.concat(c).toString("utf8")));
    }).on("error",reject).on("timeout",function(){this.destroy();reject(new Error("Timeout"));});
  });
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi,"").replace(/<style[\s\S]*?<\/style>/gi,"")
    .replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&")
    .replace(/\s+/g," ").trim();
}

// ── AI detect (optional, graceful fail) ──────────────────────────────────────
async function aiDetect(text, title) {
  try {
    const Groq = require("groq-sdk");
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const res  = await groq.chat.completions.create({
      model:"llama-3.1-8b-instant", max_tokens:60, temperature:0,
      messages:[{ role:"user", content:
        `Return ONLY JSON for this study content:\nTitle:"${title||""}"\nContent:"${text.slice(0,300)}"\n{"subject":"Mathematics","exam_type":"CLASS_9","content_type":"notes","importance":7}` }]
    });
    const m = res.choices[0].message.content.trim().match(/\{[^}]+\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch { return null; }
}

// ── FOLDER ROUTES ─────────────────────────────────────────────────────────────
router.get("/folders", (req, res) => {
  res.json({ folders: readJSON(FOL_FILE, []) });
});

router.post("/folders/create", (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error:"name required" });
  const id = cleanId(name.trim());
  const all = readJSON(FOL_FILE, []);
  const existing = all.find(f => f.id === id);
  if (existing) return res.json({ success:true, folder:existing });
  const folder = { id, name:name.trim(), count:0, created_at:new Date().toISOString() };
  all.unshift(folder);
  writeJSON(FOL_FILE, all);
  getFolderDir(id);
  res.json({ success:true, folder });
});

router.delete("/folders/:id", (req, res) => {
  const id  = req.params.id;
  const dir = path.join(DATA_DIR, `f_${id}`);
  if (fs.existsSync(dir)) { fs.readdirSync(dir).forEach(f=>fs.unlinkSync(path.join(dir,f))); fs.rmdirSync(dir); }
  writeJSON(FOL_FILE, readJSON(FOL_FILE,[]).filter(f=>f.id!==id));
  writeJSON(IDX_FILE, readJSON(IDX_FILE,[]).filter(i=>i.folder_id!==id));
  res.json({ success:true });
});

// ── UPLOAD TEXT ───────────────────────────────────────────────────────────────
router.post("/upload", async (req, res, next) => {
  try {
    const { title, content_text, subject, exam_type, source, exam_year, uploaded_by, folder_id } = req.body;
    if (!content_text || content_text.trim().length < 10)
      return res.status(400).json({ error:"content_text required (min 10 chars)" });

    // Auto-detect metadata
    let meta = { subject: subject||"General", exam_type: exam_type||"GENERAL", content_type:"notes", importance:5 };
    if (!subject || !exam_type) {
      const auto = await aiDetect(content_text, title||"");
      if (auto) {
        if (!subject)    meta.subject      = auto.subject;
        if (!exam_type)  meta.exam_type    = auto.exam_type;
        meta.content_type = auto.content_type || "notes";
        meta.importance   = auto.importance   || 5;
      }
    }

    // Get or create folder
    let fId = folder_id;
    if (!fId) {
      // Auto name: EXAM_SUBJECT
      const autoName = `${meta.exam_type}_${meta.subject}`.replace(/\s+/g,"_").toUpperCase().slice(0,30);
      fId = cleanId(autoName);
      const all = readJSON(FOL_FILE,[]);
      if (!all.find(f=>f.id===fId)) {
        all.unshift({ id:fId, name:autoName, count:0, created_at:new Date().toISOString() });
        writeJSON(FOL_FILE, all);
      }
    }
    getFolderDir(fId);

    const id    = makeId("c");
    const entry = { id, title:title||`${meta.subject} ${meta.content_type}`, subject:meta.subject,
      exam_type:meta.exam_type, content_type:meta.content_type, importance:meta.importance,
      source:source||null, exam_year:exam_year?parseInt(exam_year):null, uploaded_by:uploaded_by||null,
      created_at:new Date().toISOString(), content_text:content_text.trim(), folder_id:fId };

    writeJSON(path.join(getFolderDir(fId), `${id}.json`), entry);

    const idx = readJSON(IDX_FILE,[]);
    idx.unshift({ id, title:entry.title, subject:meta.subject, exam_type:meta.exam_type,
      content_type:meta.content_type, importance:meta.importance, source:entry.source,
      created_at:entry.created_at, size:content_text.trim().length, folder_id:fId });
    writeJSON(IDX_FILE, idx);

    // Update folder count
    const all2 = readJSON(FOL_FILE,[]);
    const f = all2.find(x=>x.id===fId);
    if (f) { f.count=(f.count||0)+1; f.last_updated=new Date().toISOString(); writeJSON(FOL_FILE,all2); }

    const folderName = readJSON(FOL_FILE,[]).find(f=>f.id===fId)?.name || fId;
    console.log(`✅ Content saved: ${id} → folder:${folderName}`);

    res.json({ success:true, id,
      folder:{ id:fId, name:folderName },
      detected:{ subject:meta.subject, exam_type:meta.exam_type, content_type:meta.content_type, importance:meta.importance },
      message:`Saved in folder: ${folderName}` });
  } catch(err) { next(err); }
});

// ── FETCH URL ─────────────────────────────────────────────────────────────────
router.post("/fetch-url", async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error:"url required" });
    let text="", pageTitle="";
    if (url.includes("docs.google.com/document")) {
      const m = url.match(/\/d\/([a-zA-Z0-9_-]{20,})/);
      if (!m) return res.status(400).json({ error:"Google Doc ID nahi mila" });
      text = await fetchText(`https://docs.google.com/document/d/${m[1]}/export?format=txt`);
    } else {
      const html = await fetchText(url);
      const t = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (t) pageTitle = t[1].trim().slice(0,100);
      text = stripHtml(html);
    }
    text = text.slice(0,50000);
    if (text.length < 50) return res.status(400).json({ error:"Content nahi mila URL se" });
    res.json({ text:text.trim(), title:pageTitle, chars:text.length, words:text.split(/\s+/).length });
  } catch(err) { next(err); }
});

// ── UPLOAD PDF ────────────────────────────────────────────────────────────────
router.post("/upload-pdf", async (req, res, next) => {
  try {
    const { url, title:th, subject, exam_type, folder_id, uploaded_by } = req.body;
    if (!url) return res.status(400).json({ error:"url required" });

    let proc;
    try { proc = require("../utils/pdfProcessor"); }
    catch { return res.status(503).json({ error:"PDF processing unavailable. Run: npm install pdf-parse" }); }

    const result   = await proc.processPdf(url, th||"");
    const subj     = subject   || result.subject   || "General";
    const examType = exam_type || result.classLevel || "GENERAL";

    let fId = folder_id;
    if (!fId) {
      const autoName = `${examType}_${subj}`.replace(/\s+/g,"_").toUpperCase().slice(0,30);
      fId = cleanId(autoName);
      const all = readJSON(FOL_FILE,[]);
      if (!all.find(f=>f.id===fId)) {
        all.unshift({ id:fId, name:autoName, count:0, created_at:new Date().toISOString() });
        writeJSON(FOL_FILE, all);
      }
    }
    getFolderDir(fId);

    const idx = readJSON(IDX_FILE,[]);
    const saved = [];

    for (const ch of result.chapters) {
      const id    = makeId("pdf");
      const entry = { id, title:`${result.title} — Ch${ch.chapterNum}: ${ch.title}`,
        subject:subj, exam_type:examType, content_type:"chapter", importance:7,
        source:url.slice(0,80), created_at:new Date().toISOString(),
        content_text:ch.text, chapter_num:ch.chapterNum, chapter_title:ch.title,
        pdf_title:result.title, folder_id:fId };
      writeJSON(path.join(getFolderDir(fId),`${id}.json`), entry);
      idx.unshift({ id, title:entry.title, subject:subj, exam_type:examType,
        content_type:"chapter", importance:7, source:entry.source,
        created_at:entry.created_at, size:ch.text.length, folder_id:fId, chapter_num:ch.chapterNum });
      saved.push({ id, chapter:ch.chapterNum, title:ch.title });
      await new Promise(r=>setTimeout(r,20));
    }
    writeJSON(IDX_FILE, idx);

    const all3 = readJSON(FOL_FILE,[]);
    const f3 = all3.find(x=>x.id===fId);
    if (f3) { f3.count=(f3.count||0)+result.chapters.length; f3.last_updated=new Date().toISOString(); writeJSON(FOL_FILE,all3); }

    const folderName = readJSON(FOL_FILE,[]).find(f=>f.id===fId)?.name || fId;
    res.json({ success:true, pdf_title:result.title,
      folder:{ id:fId, name:folderName },
      detected:{ subject:subj, exam_type:examType, pages:result.pages, chapters:result.chapters.length },
      saved:saved.length, message:`${result.chapters.length} chapters saved in ${folderName}` });
  } catch(err) { console.error("[PDF]",err.message); next(err); }
});

// ── SCAN DRIVE FOLDER (Google API key required) ──────────────────────────────
router.post("/scan-drive-folder", async (req, res, next) => {
  try {
    const { folder_url } = req.body;
    if (!folder_url) return res.status(400).json({ error:"folder_url required" });
    
    const match = folder_url.match(/folders\/([a-zA-Z0-9_-]{10,})/);
    if (!match) return res.status(400).json({ error:"Google Drive folder ID nahi mila URL mein" });
    const folderId = match[1];

    // Method 1: Google Drive API (requires GOOGLE_API_KEY in .env)
    if (process.env.GOOGLE_API_KEY && !process.env.GOOGLE_API_KEY.includes("your_")) {
      try {
        const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,size)&pageSize=100&key=${process.env.GOOGLE_API_KEY}`;
        const data   = JSON.parse(await fetchText(apiUrl));
        
        if (data.error) throw new Error(data.error.message);
        
        const fileList = (data.files||[]).filter(f =>
          f.mimeType === "application/pdf" ||
          f.mimeType === "application/vnd.google-apps.document"
        );
        
        if (fileList.length > 0) {
          return res.json({
            found:  fileList.length,
            method: "google_api",
            files:  fileList.map(f => ({
              id:   f.id,
              name: f.name,
              type: f.mimeType,
              url:  f.mimeType === "application/vnd.google-apps.document"
                ? `https://docs.google.com/document/d/${f.id}/export?format=txt`
                : `https://drive.google.com/uc?export=download&id=${f.id}`,
            }))
          });
        }
      } catch(e) {
        console.warn("Google API failed:", e.message);
      }
    }

    // Method 2: No API key — return folder ID so user can add PDFs manually  
    return res.status(400).json({
      error:     "GOOGLE_API_KEY required for folder scanning",
      folder_id: folderId,
      needs_key: true,
    });

  } catch(err) { next(err); }
});

// ── PROCESS SINGLE DRIVE PDF ──────────────────────────────────────────────────
// Takes a single Google Drive PDF share link and processes it
router.post("/process-drive-pdf", async (req, res, next) => {
  try {
    const { url, folder_id, subject, exam_type, uploaded_by } = req.body;
    if (!url) return res.status(400).json({ error:"url required" });

    // Extract file ID from various Google Drive URL formats
    const match = url.match(/\/d\/([a-zA-Z0-9_-]{20,})/);
    if (!match) return res.status(400).json({ error:"Google Drive file ID nahi mila. Share link check karo." });
    
    const fileId     = match[1];
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    let proc;
    try { proc = require("../utils/pdfProcessor"); }
    catch { return res.status(503).json({ error:"npm install pdf-parse karo backend mein" }); }

    console.log(`📥 Processing Drive PDF: ${fileId}`);
    const result = await proc.processPdf(downloadUrl, "");

    const subj   = subject   || result.subject   || "General";
    const examTy = exam_type || result.classLevel || "GENERAL";

    let fId = folder_id;
    if (!fId) {
      const autoName = `${examTy}_${subj}`.replace(/\s+/g,"_").toUpperCase().slice(0,30);
      fId = cleanId(autoName);
      const all = readJSON(FOL_FILE,[]);
      if (!all.find(f=>f.id===fId)) {
        all.unshift({ id:fId, name:autoName, count:0, created_at:new Date().toISOString() });
        writeJSON(FOL_FILE, all);
      }
    }
    getFolderDir(fId);

    const idx   = readJSON(IDX_FILE,[]);
    const saved = [];

    for (const ch of result.chapters) {
      const id    = makeId("pdf");
      const entry = {
        id, title:`${result.title||"PDF"} — Ch${ch.chapterNum}: ${ch.title}`,
        subject:subj, exam_type:examTy, content_type:"chapter", importance:7,
        source:`drive:${fileId}`, created_at:new Date().toISOString(),
        content_text:ch.text, chapter_num:ch.chapterNum, chapter_title:ch.title,
        pdf_title:result.title, folder_id:fId, uploaded_by:uploaded_by||null,
      };
      writeJSON(path.join(getFolderDir(fId), `${id}.json`), entry);
      idx.unshift({ id, title:entry.title, subject:subj, exam_type:examTy,
        content_type:"chapter", importance:7, source:entry.source,
        created_at:entry.created_at, size:ch.text.length,
        folder_id:fId, chapter_num:ch.chapterNum });
      saved.push({ id, chapter:ch.chapterNum, title:ch.title });
      await new Promise(r=>setTimeout(r,20));
    }
    writeJSON(IDX_FILE, idx);

    const all2=readJSON(FOL_FILE,[]); const f2=all2.find(x=>x.id===fId);
    if(f2){f2.count=(f2.count||0)+result.chapters.length; f2.last_updated=new Date().toISOString(); writeJSON(FOL_FILE,all2);}

    const folderName = readJSON(FOL_FILE,[]).find(f=>f.id===fId)?.name || fId;
    console.log(`✅ PDF processed: ${result.chapters.length} chapters → ${folderName}`);

    res.json({
      success:   true,
      pdf_title: result.title,
      pages:     result.pages,
      chapters:  result.chapters.length,
      folder:    { id:fId, name:folderName },
      saved:     saved.length,
      message:   `✅ ${result.chapters.length} chapters saved in "${folderName}"`,
    });
  } catch(err) {
    console.error("[DRIVE-PDF]", err.message);
    res.status(400).json({ error:`PDF processing failed: ${err.message}` });
  }
});

// ── IMPORT DRIVE FOLDER ───────────────────────────────────────────────────────
router.post("/import-drive-folder", async (req, res, next) => {
  try {
    const { files, exam_type, subject, folder_id:folderId, uploaded_by } = req.body;
    if (!files?.length) return res.status(400).json({ error:"files required" });

    let proc; try { proc = require("../utils/pdfProcessor"); } catch { proc = null; }

    let fId = folderId;
    if (!fId && exam_type && subject) {
      const autoName = `${exam_type}_${subject}`.replace(/\s+/g,"_").toUpperCase().slice(0,30);
      fId = cleanId(autoName);
      const all = readJSON(FOL_FILE,[]);
      if (!all.find(f=>f.id===fId)) { all.unshift({ id:fId, name:autoName, count:0, created_at:new Date().toISOString() }); writeJSON(FOL_FILE,all); }
    }
    if (!fId) fId = "imported";
    getFolderDir(fId);

    const results=[], errors=[];
    const idx = readJSON(IDX_FILE,[]);

    for (const file of files) {
      try {
        if (file.type==="application/pdf" && proc) {
          const r  = await proc.processPdf(file.url, file.name);
          const s  = subject   || r.subject   || "General";
          const et = exam_type || r.classLevel || "GENERAL";
          for (const ch of r.chapters) {
            const id = makeId("pdf");
            const entry = { id, title:`${file.name} Ch${ch.chapterNum}: ${ch.title}`, subject:s, exam_type:et,
              content_type:"chapter", importance:7, source:file.name, created_at:new Date().toISOString(),
              content_text:ch.text, chapter_num:ch.chapterNum, chapter_title:ch.title, folder_id:fId };
            writeJSON(path.join(getFolderDir(fId),`${id}.json`), entry);
            idx.unshift({ id, title:entry.title, subject:s, exam_type:et, content_type:"chapter",
              importance:7, source:file.name, created_at:entry.created_at, size:ch.text.length, folder_id:fId });
            await new Promise(r=>setTimeout(r,20));
          }
          results.push({ name:file.name, chapters:r.chapters.length, status:"✅" });
        } else {
          const text = (await fetchText(file.url)).slice(0,50000);
          if (text.length < 50) throw new Error("Content too short");
          const s  = subject   || "General";
          const et = exam_type || "GENERAL";
          const id = makeId("doc");
          const entry = { id, title:file.name, subject:s, exam_type:et, content_type:"notes", importance:6,
            source:file.name, created_at:new Date().toISOString(), content_text:text, folder_id:fId };
          writeJSON(path.join(getFolderDir(fId),`${id}.json`), entry);
          idx.unshift({ id, title:file.name, subject:s, exam_type:et, content_type:"notes", importance:6,
            source:file.name, created_at:entry.created_at, size:text.length, folder_id:fId });
          results.push({ name:file.name, chapters:1, status:"✅" });
        }
        await new Promise(r=>setTimeout(r,100));
      } catch(e) { errors.push({ name:file.name, error:e.message }); }
    }
    writeJSON(IDX_FILE, idx);
    const all4=readJSON(FOL_FILE,[]); const f4=all4.find(x=>x.id===fId);
    if (f4) { f4.count=(f4.count||0)+results.length; f4.last_updated=new Date().toISOString(); writeJSON(FOL_FILE,all4); }

    res.json({ success:true, imported:results.length, failed:errors.length, results, errors:errors.length?errors:undefined,
      message:`✅ ${results.length} files imported${errors.length?` (${errors.length} failed)`:""}` });
  } catch(err) { next(err); }
});

// ── SEARCH ────────────────────────────────────────────────────────────────────
router.get("/search", (req, res) => {
  const { q, exam_type, subject, limit=3 } = req.query;
  if (!q) return res.status(400).json({ error:"q required" });
  const stop = new Set(["kya","hai","ka","ki","ke","the","is","are","what","how","why","about","tell","explain"]);
  const kw   = q.toLowerCase().split(/\s+/).filter(w=>w.length>2&&!stop.has(w)).slice(0,6);
  const idx  = readJSON(IDX_FILE,[]);
  const results=[];
  for (const meta of idx) {
    if (exam_type && meta.exam_type!==exam_type) continue;
    const c = readContent(meta.id); if (!c) continue;
    const text  = (c.content_text||"").toLowerCase();
    const score = kw.filter(k=>text.includes(k)).length;
    if (score>0) results.push({ ...c, score });
    if (results.length>=parseInt(limit)*3) break;
  }
  results.sort((a,b)=>b.score-a.score);
  res.json({ results:results.slice(0,parseInt(limit)).map(r=>({ id:r.id, title:r.title, subject:r.subject, snippet:(r.content_text||"").slice(0,300), score:r.score })), count:results.length });
});

// ── LIST ──────────────────────────────────────────────────────────────────────
router.get("/list", (req, res) => {
  let idx = readJSON(IDX_FILE,[]);
  const { exam_type, subject, folder_id, limit=100 } = req.query;
  if (folder_id) idx = idx.filter(i=>i.folder_id===folder_id);
  if (exam_type) idx = idx.filter(i=>i.exam_type===exam_type);
  if (subject)   idx = idx.filter(i=>i.subject===subject);
  res.json({ content:idx.slice(0,parseInt(limit)), count:idx.length });
});

// ── VIEW content ─────────────────────────────────────────────────────────────
router.get("/:id/view", (req, res) => {
  const data = readContent(req.params.id);
  if (!data) return res.status(404).json({ error:"Content not found" });
  // Return FULL content - no truncation
  res.json({
    id:            data.id,
    title:         data.title,
    subject:       data.subject,
    exam_type:     data.exam_type,
    content_type:  data.content_type,
    chapter_num:   data.chapter_num,
    chapter_title: data.chapter_title,
    source:        data.source,
    created_at:    data.created_at,
    text:          data.content_text || "",
    size:          (data.content_text || "").length,
  });
});

// ── DELETE ────────────────────────────────────────────────────────────────────
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const c = readContent(id);
  if (c?.folder_id) { const f=path.join(DATA_DIR,`f_${c.folder_id}`,`${id}.json`); if(fs.existsSync(f))fs.unlinkSync(f); }
  writeJSON(IDX_FILE, readJSON(IDX_FILE,[]).filter(i=>i.id!==id));
  res.json({ success:true });
});

// ── STATS ─────────────────────────────────────────────────────────────────────
router.get("/stats", (req, res) => {
  const idx = readJSON(IDX_FILE,[]);
  const fl  = readJSON(FOL_FILE,[]);
  const byFolder={};
  idx.forEach(i=>{byFolder[i.folder_id||"uncategorized"]=(byFolder[i.folder_id||"uncategorized"]||0)+1;});
  res.json({ total:idx.length, folders:fl.length, byFolder, totalSizeKB:Math.round(idx.reduce((a,i)=>a+(i.size||0),0)/1024), storageType:"Local JSON" });
});

// ── RAG CONTEXT (used by chat.js) ─────────────────────────────────────────────
router.get("/context", (req, res) => {
  const { subject, exam_type, limit=3 } = req.query;
  const idx = readJSON(IDX_FILE,[]);
  const stop = new Set(["the","is","are","what","how"]);
  let matches = idx.filter(i => {
    const examMatch = !exam_type || i.exam_type===exam_type || i.exam_type==="GENERAL";
    const subjMatch = !subject   || (i.subject||"").toLowerCase().includes(subject.toLowerCase());
    return examMatch && subjMatch;
  }).slice(0,parseInt(limit));

  const context = matches.map(m => {
    const c = readContent(m.id);
    return c ? { ...m, snippet:(c.content_text||"").slice(0,600) } : null;
  }).filter(Boolean);
  res.json({ context, count:context.length });
});

module.exports = router;
