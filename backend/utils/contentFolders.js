/**
 * contentFolders.js — Folder-based content organization
 * 
 * Structure:
 * backend/data/content/
 * ├── _folders.json          ← folder registry
 * ├── _index.json            ← all content index
 * ├── folder_6th_maths/      ← "6th Class Maths" folder
 * │   ├── content_xxx.json
 * │   └── content_yyy.json
 * ├── folder_neet_biology/   ← "NEET Biology" folder
 * │   └── content_zzz.json
 */

const fs   = require("fs");
const path = require("path");

const DATA_DIR     = path.join(__dirname, "../data/content");
const FOLDERS_FILE = path.join(DATA_DIR, "_folders.json");

// ─── Ensure dirs ──────────────────────────────────────────────────────────────
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ─── Folder helpers ───────────────────────────────────────────────────────────
function readFolders() {
  try { return JSON.parse(fs.readFileSync(FOLDERS_FILE, "utf8")); }
  catch { return []; }
}
function writeFolders(f) { fs.writeFileSync(FOLDERS_FILE, JSON.stringify(f, null, 2)); }

function folderDir(folderId) {
  const d = path.join(DATA_DIR, `folder_${folderId}`);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  return d;
}

// ─── Auto-generate folder ID from name ───────────────────────────────────────
function nameToId(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

// ─── Enterprise naming: EXAM_SUBJECT_TYPE ────────────────────────────────────
const EXAM_CODES = {
  FOUNDATION:"CL6", CLASS_6:"CL6",  CLASS_7:"CL7",  CLASS_8:"CL8",
  CLASS_9:"CL9",    CLASS_10:"CL10", CLASS_11_SCI:"CL11S", CLASS_12_SCI:"CL12S",
  CLASS_11_COM:"CL11C", CLASS_12_COM:"CL12C", CLASS_11_ARTS:"CL11A",
  JEE:"JEE", JEE_MAIN:"JEE", NEET:"NEET", NEET_PG:"NEETPG",
  UPSC:"UPSC", UPSC_PRE:"UPSC", UPSC_MAINS:"UPSC",
  UP_PCS:"UPPCS", MP_PCS:"MPPCS", RAS:"RAS", BPSC:"BPSC", MPSC:"MPSC",
  SSC_CGL:"SSCGL", SSC_CHSL:"SSCHL", SSC_GD:"SSCGD",
  RRB_NTPC:"RRBNTPC", NDA:"NDA", CDS:"CDS",
  IBPS_PO:"IBPSPO", SBI_PO:"SBIPO", RBI_GRADE_B:"RBI",
  CLAT:"CLAT", CAT:"CAT", GATE:"GATE", GENERAL:"GEN",
};

const SUBJECT_CODES = {
  "Mathematics":"MTH",    "Physics":"PHY",       "Chemistry":"CHM",
  "Biology":"BIO",        "Science":"SCI",       "History":"HIS",
  "Geography":"GEO",      "Polity":"POL",        "Economy":"ECO",
  "Environment":"ENV",    "Current Affairs":"CA","Ethics":"ETH",
  "General Intelligence":"GI", "Quantitative Aptitude":"QA",
  "English Language":"ENG",    "English":"ENG",   "Hindi":"HIN",
  "Social Science":"SST", "Banking Awareness":"BNK",
  "Reasoning":"GI",       "General Awareness":"GA",
  "Science & Technology":"ST", "General":"GEN",
};

function autoSuggestFolder(examType, subject, contentType="NCT") {
  const examCode    = EXAM_CODES[examType]    || examType.slice(0,6).toUpperCase();
  const subjectCode = SUBJECT_CODES[subject]  || subject.slice(0,3).toUpperCase();
  return `${examCode}_${subjectCode}_${contentType}`;
}

// Human-readable name from code
function codeToName(folderCode) {
  const examNames = {
    CL6:"Class 6", CL7:"Class 7", CL8:"Class 8", CL9:"Class 9", CL10:"Class 10",
    CL11S:"Class 11 Sci", CL12S:"Class 12 Sci", CL11C:"Class 11 Com", CL12C:"Class 12 Com",
    JEE:"JEE", NEET:"NEET", UPSC:"UPSC", UPPCS:"UP PCS", SSCGL:"SSC CGL",
    IBPSPO:"IBPS PO", NDA:"NDA",
  };
  const subjNames = {
    MTH:"Mathematics", PHY:"Physics", CHM:"Chemistry", BIO:"Biology",
    SCI:"Science", HIS:"History", GEO:"Geography", POL:"Polity",
    ECO:"Economy", ENV:"Environment", CA:"Current Affairs", ETH:"Ethics",
    GI:"Reasoning", QA:"Quant Aptitude", ENG:"English", HIN:"Hindi",
    SST:"Social Science", BNK:"Banking",
  };
  const typeNames = {
    NCT:"NCERT", PYQ:"Prev Year Q", NTS:"Notes", FRM:"Formulas",
    MCQ:"MCQ Set", SOL:"Solutions", MOD:"Model Paper",
  };
  const parts = folderCode.split("_");
  if (parts.length < 2) return folderCode;
  const exam = examNames[parts[0]] || parts[0];
  const subj = subjNames[parts[1]] || parts[1];
  const type = parts[2] ? (typeNames[parts[2]] || parts[2]) : "";
  return `${exam} ${subj}${type ? " — " + type : ""}`;
}

// ─── Create folder ────────────────────────────────────────────────────────────
function createFolder({ name, exam_type, subject, content_type, description }) {
  const folders = readFolders();
  // If name looks like enterprise code (e.g. CL9_MTH_NCT), keep as-is
  // Otherwise generate from exam+subject
  const finalName = name || (exam_type && subject ? autoSuggestFolder(exam_type, subject, content_type||"NCT") : "general");
  const id = finalName.replace(/[^a-zA-Z0-9_]/g,"_").toLowerCase().slice(0,40);
  const displayName = finalName;

  // Check duplicate
  if (folders.find(f => f.id === id))
    return folders.find(f => f.id === id); // return existing

  const folder = {
    id,
    name: displayName,
    exam_type:   exam_type  || null,
    subject:     subject    || null,
    description: description || null,
    created_at:  new Date().toISOString(),
    count:       0,
  };

  folders.unshift(folder);
  writeFolders(folders);
  folderDir(id); // create directory
  console.log(`📁 Folder created: "${name}" (${id})`);
  return folder;
}

// ─── Get or create auto folder ────────────────────────────────────────────────
function getOrCreateAutoFolder(examType, subject) {
  const name    = autoSuggestFolder(examType, subject);
  const folders = readFolders();
  const id      = nameToId(name);
  const existing = folders.find(f => f.id === id);
  if (existing) return existing;
  return createFolder({ name, exam_type: examType, subject });
}

// ─── Save content to folder ───────────────────────────────────────────────────
function saveToFolder(folderId, contentId, contentData) {
  const dir      = folderDir(folderId);
  const filePath = path.join(dir, `${contentId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(contentData, null, 2));

  // Update folder count
  const folders = readFolders();
  const folder  = folders.find(f => f.id === folderId);
  if (folder) {
    folder.count = (folder.count || 0) + 1;
    folder.last_updated = new Date().toISOString();
    writeFolders(folders);
  }
}

// ─── Search within a specific folder ─────────────────────────────────────────
function searchInFolder(folderId, keywords, limit = 3) {
  const dir = path.join(DATA_DIR, `folder_${folderId}`);
  if (!fs.existsSync(dir)) return [];

  const files   = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
  const results = [];

  for (const file of files) {
    try {
      const data  = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
      const text  = (data.content_text || "").toLowerCase();
      const title = (data.title || "").toLowerCase();
      const score = keywords.filter(k => text.includes(k)).length
                  + keywords.filter(k => title.includes(k)).length * 2;
      if (score > 0) results.push({ ...data, score });
    } catch {}
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ─── Find best matching folder for a question ─────────────────────────────────
function findMatchingFolders(examType, subject) {
  const folders = readFolders();
  const matches = [];

  for (const f of folders) {
    let score = 0;
    if (f.exam_type && f.exam_type === examType) score += 3;
    if (f.subject   && subject && f.subject.toLowerCase() === subject.toLowerCase()) score += 3;
    // Also check if folder name contains exam or subject
    const fname = f.name.toLowerCase();
    if (examType && fname.includes(examType.toLowerCase().replace("_",""))) score += 1;
    if (subject  && fname.includes(subject.toLowerCase())) score += 2;
    if (score > 0) matches.push({ ...f, score });
  }

  return matches.sort((a, b) => b.score - a.score);
}

// ─── Delete folder ─────────────────────────────────────────────────────────────
function deleteFolder(folderId) {
  const dir = path.join(DATA_DIR, `folder_${folderId}`);
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(f => fs.unlinkSync(path.join(dir, f)));
    fs.rmdirSync(dir);
  }
  writeFolders(readFolders().filter(f => f.id !== folderId));
}

// ─── List all files in a folder ───────────────────────────────────────────────
function listFolderContents(folderId, limit = 50) {
  const dir = path.join(DATA_DIR, `folder_${folderId}`);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith(".json"))
    .slice(0, limit)
    .map(f => {
      try {
        const d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
        return { id:d.id, title:d.title, subject:d.subject, content_type:d.content_type, size:(d.content_text||"").length, created_at:d.created_at };
      } catch { return null; }
    }).filter(Boolean);
}

module.exports = {
  readFolders, writeFolders, createFolder,
  getOrCreateAutoFolder, saveToFolder,
  searchInFolder, findMatchingFolders,
  deleteFolder, listFolderContents, nameToId,
};
