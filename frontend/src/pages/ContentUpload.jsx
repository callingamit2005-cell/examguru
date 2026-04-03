import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../hooks/useUser";
import API from "../utils/api";

const EXAM_TYPES = ["AUTO DETECT","CLASS_6","CLASS_7","CLASS_8","CLASS_9","CLASS_10","CLASS_11_SCI","CLASS_12_SCI","JEE","NEET","UPSC","UP_PCS","SSC_CGL","IBPS_PO","NDA","GENERAL"];
const SUBJECTS   = ["AUTO DETECT","Mathematics","Physics","Chemistry","Biology","Science","History","Geography","Polity","Economy","Current Affairs","English","Hindi","Social Science","General Intelligence","Quantitative Aptitude"];

export default function ContentUpload() {
  const { user, logout } = useUser();

  // ── States ────────────────────────────────────────────────────────────────
  const [tab, setTab]           = useState("upload");
  const [inputMode, setMode]    = useState("paste");
  const [content, setContent]   = useState("");
  const [title, setTitle]       = useState("");
  const [subject, setSubject]   = useState("AUTO DETECT");
  const [examType, setExam]     = useState("AUTO DETECT");
  const [source, setSource]     = useState("");
  const [urlInput, setUrl]      = useState("");
  const [folderList, setFolders]= useState([]);
  const [selFolder, setSelFol]  = useState("");
  const [newFolderName, setNFN] = useState("");
  const [contentList, setList]  = useState([]);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [urlLoading, setUrlLoad]= useState(false);
  const fileRef = useRef(null);
  const [viewerContent, setViewer] = useState(null); // { title, text }

  // Folder URL import
  const [pdfLinks, setPdfLinks] = useState([{url:"",name:"",loading:false,done:false,result:null}]);

  // Process single Drive PDF
  const processSinglePdf = async (idx) => {
    const link = pdfLinks[idx];
    if (!link.url.trim()) return;
    setPdfLinks(l => l.map((x,i)=>i===idx?{...x,loading:true}:x));
    try {
      const r = await API.post("/content/process-drive-pdf", {
        url:        link.url.trim(),
        subject:    subject  === "AUTO DETECT" ? undefined : subject,
        exam_type:  examType === "AUTO DETECT" ? undefined : examType,
        folder_id:  selFolder || undefined,
        uploaded_by: user?.id,
      });
      setPdfLinks(l => l.map((x,i)=>i===idx?{...x,loading:false,done:true,result:r.data}:x));
      await loadFolders();
    } catch(e) {
      setError("PDF failed: " + (e?.response?.data?.error || e.message));
      setPdfLinks(l => l.map((x,i)=>i===idx?{...x,loading:false}:x));
    }
  };

  useEffect(() => { loadFolders(); }, []);
  useEffect(() => { if (tab === "manage") { loadFolders(); loadList(); } }, [tab]);

  const loadFolders = async () => {
    try { const r = await API.get("/content/folders"); setFolders(r.data.folders || []); }
    catch(e) { console.error("loadFolders:", e.message); }
  };

  const loadList = async () => {
    try { const r = await API.get("/content/list?limit=100"); setList(r.data.content || []); }
    catch(e) { console.error("loadList:", e.message); }
  };

  // ── Create Folder ─────────────────────────────────────────────────────────
  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const r = await API.post("/content/folders/create", { name: newFolderName.trim() });
      await loadFolders();
      setSelFol(r.data.folder.id);
      setNFN("");
    } catch(e) { setError("Folder create failed: " + e.message); }
  };

  // ── Upload Text ───────────────────────────────────────────────────────────
  const handleUpload = async () => {
    const text = content.trim();
    if (text.length < 10) { setError("Content daalo pehle!"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await API.post("/content/upload", {
        title:        title || undefined,
        content_text: text,
        subject:      subject === "AUTO DETECT" ? undefined : subject,
        exam_type:    examType === "AUTO DETECT" ? undefined : examType,
        source:       source || undefined,
        folder_id:    selFolder || undefined,
        uploaded_by:  user?.id,
      });
      setResult(r.data);
      setContent(""); setTitle(""); setSource(""); setUrl("");
      setSubject("AUTO DETECT"); setExam("AUTO DETECT");
      await loadFolders();
    } catch(e) {
      setError("Upload failed: " + (e?.response?.data?.error || e.message));
    } finally { setLoading(false); }
  };

  // ── Fetch URL ─────────────────────────────────────────────────────────────
  const fetchUrl = async () => {
    if (!urlInput.trim()) return;
    setUrlLoad(true); setError("");
    try {
      const r = await API.post("/content/fetch-url", { url: urlInput.trim() });
      setContent(r.data.text);
      if (r.data.title && !title) setTitle(r.data.title);
      setSource(urlInput.trim().slice(0, 80));
    } catch(e) {
      setError("URL fetch failed: " + (e?.response?.data?.error || e.message));
    } finally { setUrlLoad(false); }
  };

  // ── File Upload ───────────────────────────────────────────────────────────
  const handleFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setContent(ev.target.result);
      if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ""));
    };
    reader.readAsText(f);
    e.target.value = "";
  };

  // ── Drive Folder Scan ─────────────────────────────────────────────────────
  const scanDriveFolder = async () => {
    if (!driveFolder.trim()) return;
    setDriveLoad(true); setError(""); setDriveFiles(null);
    try {
      const r = await API.post("/content/scan-drive-folder", { folder_url: driveFolder.trim() });
      setDriveFiles(r.data.files || []);
      const sel = {};
      r.data.files.forEach(f => sel[f.id] = true);
      setDriveSel(sel);
    } catch(e) {
      setError("Scan failed: " + (e?.response?.data?.error || e.message) +
        "\n→ Folder publicly shared hai? (Share → Anyone with link → Viewer)");
    } finally { setDriveLoad(false); }
  };

  // ── Drive Folder Import ───────────────────────────────────────────────────
  const importDriveFiles = async () => {
    const toImport = driveFiles?.filter(f => driveSelected[f.id]) || [];
    if (!toImport.length) return;
    setImpLoad(true); setError(""); setImpResult(null);
    try {
      const r = await API.post("/content/import-drive-folder", {
        files:      toImport,
        exam_type:  examType === "AUTO DETECT" ? undefined : examType,
        subject:    subject  === "AUTO DETECT" ? undefined : subject,
        folder_id:  selFolder || undefined,
        uploaded_by: user?.id,
      });
      setImpResult(r.data);
      await loadFolders();
    } catch(e) {
      setError("Import failed: " + (e?.response?.data?.error || e.message));
    } finally { setImpLoad(false); }
  };

  // ── Role check ────────────────────────────────────────────────────────────
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("examguru_user") || "{}"); }
    catch { return {}; }
  })();
  const userRole   = user?.role || storedUser?.role || "student";
  const isAdmin    = userRole === "admin";

  // ── NOT ADMIN ─────────────────────────────────────────────────────────────
  if (!isAdmin) return (
    <div style={{ padding: "32px 24px", maxWidth: "500px" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 900, marginBottom: "20px" }}>📤 Content Upload</h1>

      {/* Debug info */}
      <div style={{ padding: "12px 14px", borderRadius: "10px", background: "rgba(59,130,246,0.08)",
        border: "1px solid rgba(59,130,246,0.2)", fontSize: "12px", marginBottom: "16px", fontFamily: "monospace" }}>
        <div style={{ fontWeight: 800, marginBottom: "6px", color: "var(--accent)" }}>🔍 Debug Info:</div>
        <div>user.name: {user?.name || "not loaded"}</div>
        <div>user.role: <strong style={{ color: user?.role === "admin" ? "#10b981" : "#f87171" }}>{user?.role || "undefined"}</strong></div>
        <div>stored.role: <strong style={{ color: storedUser?.role === "admin" ? "#10b981" : "#f87171" }}>{storedUser?.role || "undefined"}</strong></div>
        <div>user.email: {user?.email || storedUser?.email || "—"}</div>
      </div>

      <div style={{ padding: "16px", borderRadius: "12px", background: "rgba(245,158,11,0.08)",
        border: "1px solid rgba(245,158,11,0.3)", fontSize: "13px", lineHeight: "2", marginBottom: "16px" }}>
        <strong style={{ color: "#f59e0b" }}>⚠️ Tumhara role "{userRole}" hai — Admin chahiye</strong><br/>
        <br/>
        <strong>Fix steps:</strong><br/>
        1️⃣ Neeche "Logout" click karo<br/>
        2️⃣ Login screen pe naam + email bharo → Next<br/>
        3️⃣ <strong>"Teacher/Admin"</strong> card select karo<br/>
        4️⃣ Secret key: <code style={{ background: "var(--bg-card)", padding: "1px 6px", borderRadius: "4px" }}>examguru2026</code><br/>
        5️⃣ Course select → Login<br/>
        6️⃣ Wapas "Content Upload" aao ✅
      </div>

      <button onClick={logout}
        style={{ padding: "12px 28px", borderRadius: "10px", border: "none",
          background: "#ef4444", color: "white", cursor: "pointer",
          fontWeight: 700, fontSize: "14px", fontFamily: "var(--font-main)" }}>
        🚪 Logout Now
      </button>
    </div>
  );

  // ── ADMIN UI ──────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "24px", overflowY: "auto", maxHeight: "100vh" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 900, marginBottom: "4px" }}>📚 Content Upload</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "20px" }}>
        Content upload karo → AI automatically sahi folder mein save karega → Students ko exact answers milenge
      </p>

      {/* Error */}
      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "10px", background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: "13px",
          marginBottom: "16px", whiteSpace: "pre-line" }}>
          ❌ {error}
          <button onClick={() => setError("")}
            style={{ float: "right", background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "16px" }}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", background: "var(--bg-secondary)", borderRadius: "10px",
        padding: "4px", marginBottom: "20px", width: "fit-content" }}>
        {[["upload","📤 Upload"],["drive","📁 Drive Folder"],["manage","📋 Manage"]].map(([id,l]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: "8px 18px", borderRadius: "8px", border: "none",
              background: tab === id ? "var(--accent)" : "transparent",
              color: tab === id ? "white" : "var(--text-muted)",
              fontWeight: 700, fontSize: "13px", fontFamily: "var(--font-main)", cursor: "pointer" }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── UPLOAD TAB ──────────────────────────────────────────────────────── */}
      {tab === "upload" && (
        <div style={{ maxWidth: "680px" }}>
          {/* Input mode */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            {[["paste","✍️","Text Paste"],["url","🌐","URL / Link"],["file","💾",".txt File"]].map(([id,icon,label]) => (
              <button key={id} onClick={() => setMode(id)}
                style={{ flex: 1, padding: "10px", borderRadius: "10px", cursor: "pointer",
                  border: `2px solid ${inputMode===id?"var(--accent)":"var(--border)"}`,
                  background: inputMode===id?"var(--accent-glow)":"var(--bg-secondary)",
                  fontFamily: "var(--font-main)", textAlign: "center" }}>
                <div style={{ fontSize: "20px", marginBottom: "3px" }}>{icon}</div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: inputMode===id?"var(--accent)":"var(--text-muted)" }}>{label}</div>
              </button>
            ))}
          </div>

          {/* URL mode */}
          {inputMode === "url" && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <input value={urlInput} onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchUrl()}
                placeholder="https://ncert.nic.in/... ya Google Docs link"
                className="input" style={{ flex: 1 }}/>
              <button onClick={fetchUrl} disabled={urlLoading || !urlInput.trim()}
                className="btn btn-primary" style={{ flexShrink: 0 }}>
                {urlLoading ? <div className="loader" style={{width:"14px",height:"14px"}}/> : "📥 Fetch"}
              </button>
            </div>
          )}

          {/* File mode */}
          {inputMode === "file" && (
            <div style={{ marginBottom: "12px" }}>
              <div onClick={() => fileRef.current?.click()}
                style={{ padding: "28px", borderRadius: "12px", border: "2px dashed var(--border)",
                  background: "var(--bg-secondary)", textAlign: "center", cursor: "pointer" }}>
                <div style={{ fontSize: "36px", marginBottom: "8px" }}>💾</div>
                <div style={{ fontSize: "13px", fontWeight: 700 }}>Click to select .txt file</div>
              </div>
              <input ref={fileRef} type="file" accept=".txt,.md,.text" onChange={handleFile} style={{ display: "none" }}/>
            </div>
          )}

          {/* Content textarea — always shown */}
          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "6px" }}>
              📄 Content {content.length > 0 && <span style={{ color: "#10b981" }}>({content.length} chars)</span>}
            </label>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="Yahan content paste karo ya oopar se fetch karo...

Example:
Chapter 1: Real Numbers
Natural numbers: 1, 2, 3, 4...
Integers: ...-2, -1, 0, 1, 2..."
              rows={10}
              style={{ width: "100%", padding: "14px", borderRadius: "10px",
                border: "1px solid var(--border)", background: "var(--bg-secondary)",
                color: "var(--text-primary)", fontSize: "13px", fontFamily: "var(--font-main)",
                resize: "vertical", outline: "none", lineHeight: "1.6", boxSizing: "border-box" }}/>
          </div>

          {/* Metadata */}
          <div style={{ marginBottom: "12px" }}>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="📝 Title (optional — e.g. NCERT Class 6 Maths Chapter 1)"
              className="input" style={{ marginBottom: "8px" }}/>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <select value={subject} onChange={e => setSubject(e.target.value)} className="input">
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={examType} onChange={e => setExam(e.target.value)} className="input">
                {EXAM_TYPES.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
          </div>

          {/* Folder selector */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "6px" }}>📁 Folder</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <select value={selFolder} onChange={e => setSelFol(e.target.value)} className="input" style={{ flex: 1 }}>
                <option value="">🤖 Auto-detect</option>
                {folderList.map(f => <option key={f.id} value={f.id}>📁 {f.name} ({f.count||0})</option>)}
              </select>
              <button onClick={() => setNFN(n => n ? "" : " ")}
                style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border)",
                  background: "var(--bg-secondary)", color: "var(--text-muted)", cursor: "pointer",
                  fontSize: "12px", fontFamily: "var(--font-main)", fontWeight: 700 }}>+ New</button>
            </div>
            {newFolderName.trim() !== "" && (
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <input value={newFolderName.trim()} onChange={e => setNFN(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && createFolder()}
                  placeholder="e.g. CL6_MTH_NCT" className="input" style={{ flex: 1 }}/>
                <button onClick={createFolder} className="btn btn-primary">Create</button>
              </div>
            )}
          </div>

          {/* Upload button */}
          <button onClick={handleUpload} disabled={loading || content.trim().length < 10}
            style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none",
              background: content.trim().length >= 10 ? "linear-gradient(135deg,var(--accent),#6366f1)" : "var(--bg-card)",
              color: content.trim().length >= 10 ? "white" : "var(--text-muted)",
              fontWeight: 900, fontSize: "15px", cursor: content.trim().length >= 10 ? "pointer" : "not-allowed",
              fontFamily: "var(--font-main)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            {loading ? <><div className="loader" style={{width:"16px",height:"16px"}}/> AI detect kar raha hai...</>
                     : "🚀 Upload Karo"}
          </button>

          {/* Result */}
          {result && (
            <div className="fade-in" style={{ marginTop: "16px", padding: "16px", borderRadius: "12px",
              background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)" }}>
              <div style={{ fontWeight: 900, color: "#10b981", fontSize: "15px", marginBottom: "10px" }}>✅ Upload Successful!</div>
              {result.folder && (
                <div style={{ fontSize: "12px", color: "var(--accent)", marginBottom: "8px", fontWeight: 700 }}>
                  📁 Saved in: {result.folder.name}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[["📚 Subject",result.detected?.subject],["🎯 Exam",result.detected?.exam_type],
                  ["📄 Type",result.detected?.content_type],["⭐ Importance",`${result.detected?.importance}/10`]
                ].map(([l,v]) => v && (
                  <div key={l} style={{ padding: "8px 12px", background: "var(--bg-card)", borderRadius: "8px" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{l}</div>
                    <div style={{ fontWeight: 800 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── DRIVE FOLDER TAB ────────────────────────────────────────────────── */}
      {tab === "drive" && (
        <div style={{ maxWidth: "680px" }}>

          {/* How to get PDF link */}
          <div style={{ padding:"14px 16px", borderRadius:"12px", marginBottom:"16px",
            background:"rgba(59,130,246,0.06)", border:"1px solid rgba(59,130,246,0.2)",
            fontSize:"12px", color:"var(--text-secondary)", lineHeight:"2.2" }}>
            <div style={{ fontWeight:800, color:"var(--accent)", marginBottom:"6px", fontSize:"13px" }}>
              📄 Google Drive PDF — Share Link kaise milega:
            </div>
            <div>1️⃣ Google Drive kholo → PDF file pe right-click karo</div>
            <div>2️⃣ <strong>"Share"</strong> click karo</div>
            <div>3️⃣ <strong>"Anyone with the link"</strong> → <strong>Viewer</strong></div>
            <div>4️⃣ <strong>"Copy link"</strong> dabao</div>
            <div>5️⃣ Neeche paste karo → <strong>Process PDF</strong> dabao</div>
            <div style={{ marginTop:"6px", padding:"8px 10px", borderRadius:"8px",
              background:"rgba(245,158,11,0.1)", color:"#f59e0b", fontWeight:700 }}>
              ⚡ Ek PDF = All chapters auto-split ho jaate hain!
            </div>
          </div>

          {/* PDF links list */}
          <div style={{ marginBottom:"14px" }}>
            <label style={{ fontSize:"12px", fontWeight:700, display:"block", marginBottom:"8px" }}>
              🔗 PDF Share Links (ek ek karke process karo)
            </label>

            {pdfLinks.map((link, idx) => (
              <div key={idx} style={{ display:"flex", gap:"8px", marginBottom:"8px", alignItems:"center" }}>
                <input value={link.url}
                  onChange={e => setPdfLinks(l => l.map((x,i)=>i===idx?{...x,url:e.target.value}:x))}
                  placeholder={`PDF ${idx+1}: https://drive.google.com/file/d/...`}
                  className="input" style={{ flex:1 }}/>
                <input value={link.name}
                  onChange={e => setPdfLinks(l => l.map((x,i)=>i===idx?{...x,name:e.target.value}:x))}
                  placeholder="Name (optional)"
                  className="input" style={{ width:"160px" }}/>
                <button onClick={() => processSinglePdf(idx)}
                  disabled={link.loading || !link.url.trim()}
                  style={{ padding:"10px 14px", borderRadius:"8px", border:"none",
                    background: link.done ? "rgba(16,185,129,0.2)" : "var(--accent)",
                    color: link.done ? "#10b981" : "white",
                    cursor:"pointer", fontWeight:700, fontSize:"12px",
                    fontFamily:"var(--font-main)", flexShrink:0, minWidth:"80px",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:"4px" }}>
                  {link.loading ? <div className="loader" style={{width:"12px",height:"12px"}}/>
                   : link.done ? "✅ Done"
                   : "📥 Process"}
                </button>
                {pdfLinks.length > 1 && (
                  <button onClick={() => setPdfLinks(l=>l.filter((_,i)=>i!==idx))}
                    style={{ padding:"10px", borderRadius:"8px", border:"1px solid rgba(239,68,68,0.3)",
                      background:"transparent", color:"#f87171", cursor:"pointer", fontFamily:"var(--font-main)" }}>
                    ✕
                  </button>
                )}
              </div>
            ))}

            <button onClick={() => setPdfLinks(l => [...l, {url:"",name:"",loading:false,done:false}])}
              style={{ padding:"8px 16px", borderRadius:"8px", border:"1px dashed var(--border)",
                background:"transparent", color:"var(--text-muted)", cursor:"pointer",
                fontSize:"12px", fontFamily:"var(--font-main)", fontWeight:700, marginTop:"4px" }}>
              + Aur PDF add karo
            </button>
          </div>

          {/* Folder + Subject selectors */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"12px" }}>
            <select value={subject} onChange={e => setSubject(e.target.value)} className="input">
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={examType} onChange={e => setExam(e.target.value)} className="input">
              {EXAM_TYPES.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>

          <div style={{ display:"flex", gap:"8px", marginBottom:"16px" }}>
            <select value={selFolder} onChange={e => setSelFol(e.target.value)} className="input" style={{ flex:1 }}>
              <option value="">🤖 Auto-detect folder</option>
              {folderList.map(f => <option key={f.id} value={f.id}>📁 {f.name} ({f.count||0})</option>)}
            </select>
          </div>

          {/* Summary */}
          {pdfLinks.some(l=>l.done) && (
            <div className="fade-in" style={{ padding:"14px", borderRadius:"12px",
              background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.3)" }}>
              <div style={{ fontWeight:800, color:"#10b981", marginBottom:"8px" }}>
                ✅ {pdfLinks.filter(l=>l.done).length} PDF(s) processed!
              </div>
              {pdfLinks.filter(l=>l.result).map((l,i) => (
                <div key={i} style={{ fontSize:"12px", color:"var(--text-secondary)", marginBottom:"4px" }}>
                  📄 {l.name || `PDF ${i+1}`} → {l.result?.chapters} chapters → 📁 {l.result?.folder?.name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MANAGE TAB ──────────────────────────────────────────────────────── */}
      {tab === "manage" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
            <span style={{ fontWeight: 700 }}>{folderList.length} folders • {contentList.length} files</span>
            <button onClick={() => { loadFolders(); loadList(); }} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }}>
              🔄 Refresh
            </button>
          </div>

          {folderList.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", marginBottom: "8px", letterSpacing: "0.08em" }}>📁 FOLDERS</div>
              {folderList.map(f => (
                <div key={f.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px",
                  borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border)", marginBottom: "6px" }}>
                  <span>📁</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "13px" }}>{f.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{f.count||0} files</div>
                  </div>
                  <button onClick={async () => { if (!window.confirm(`Delete "${f.name}"?`)) return; await API.delete(`/content/folders/${f.id}`); loadFolders(); loadList(); }}
                    style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#f87171", cursor: "pointer", fontSize: "11px", fontFamily: "var(--font-main)" }}>🗑️</button>
                </div>
              ))}
            </div>
          )}

          {contentList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
              <p>Koi content nahi. Upload karo!</p>
            </div>
          ) : (
            <>
              {/* Delete all button */}
              <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"10px" }}>
                <button onClick={async () => {
                  if (!window.confirm(`Sabhi ${contentList.length} items delete karo?`)) return;
                  for (const item of contentList) {
                    try { await API.delete(`/content/${item.id}`); } catch {}
                  }
                  loadList(); loadFolders();
                }} style={{ padding:"6px 12px", borderRadius:"8px", border:"1px solid rgba(239,68,68,0.3)",
                  background:"transparent", color:"#f87171", cursor:"pointer", fontSize:"11px", fontFamily:"var(--font-main)" }}>
                  🗑️ Delete All
                </button>
              </div>

              {contentList.map(item => (
                <div key={item.id} style={{ display:"flex", alignItems:"flex-start", gap:"10px", padding:"10px 14px",
                  borderRadius:"10px", background:"var(--bg-card)", border:"1px solid var(--border)", marginBottom:"6px" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:"12px", fontWeight:700, marginBottom:"4px",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.title}</div>
                    <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
                      {[item.subject, item.exam_type, item.content_type,
                        item.chapter_num && `Ch.${item.chapter_num}`,
                        item.folder_id && `📁${item.folder_id}`
                      ].filter(Boolean).map((t,i) => (
                        <span key={i} style={{ padding:"1px 6px", borderRadius:"20px",
                          background:"var(--bg-secondary)", fontSize:"10px", color:"var(--text-muted)", fontWeight:600 }}>{t}</span>
                      ))}
                      <span style={{ fontSize:"10px", color:"var(--text-muted)" }}>
                        {Math.round((item.size||0)/1024)}KB
                      </span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:"6px", flexShrink:0 }}>
                    {/* View button */}
                    <button onClick={async () => {
                      try {
                        const r = await API.get(`/content/${item.id}/view`);
                        setViewer(r.data);
                      } catch(e) { setError("View failed: " + e.message); }
                    }} style={{ padding:"4px 8px", borderRadius:"6px",
                      border:"1px solid rgba(59,130,246,0.3)", background:"rgba(59,130,246,0.08)",
                      color:"var(--accent)", cursor:"pointer", fontSize:"11px", fontFamily:"var(--font-main)" }}>
                      👁️
                    </button>
                    {/* Delete button */}
                    <button onClick={async () => {
                      if (!window.confirm("Delete?")) return;
                      await API.delete(`/content/${item.id}`);
                      loadList();
                    }} style={{ padding:"4px 8px", borderRadius:"6px",
                      border:"1px solid rgba(239,68,68,0.3)", background:"transparent",
                      color:"#f87171", cursor:"pointer", fontSize:"11px", fontFamily:"var(--font-main)" }}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
      {/* ── PDF CONTENT VIEWER MODAL ──────────────────────────────────────────── */}
      {viewerContent && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:2000,
          display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
          onClick={() => setViewer(null)}>
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)",
            borderRadius:"16px", width:"100%", maxWidth:"700px", maxHeight:"80vh",
            display:"flex", flexDirection:"column", boxShadow:"0 20px 60px rgba(0,0,0,0.5)" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)",
              display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
              <div>
                <div style={{ fontWeight:800, fontSize:"14px" }}>{viewerContent.title}</div>
                <div style={{ fontSize:"11px", color:"var(--text-muted)", marginTop:"2px" }}>
                  📄 {viewerContent.subject} • {viewerContent.exam_type} • {viewerContent.content_type}
                  {viewerContent.chapter_num && ` • Ch.${viewerContent.chapter_num}`}
                </div>
              </div>
              <button onClick={() => setViewer(null)}
                style={{ background:"none", border:"none", color:"var(--text-muted)",
                  cursor:"pointer", fontSize:"22px", lineHeight:1 }}>✕</button>
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:"20px",
              fontFamily:"var(--font-mono)", fontSize:"13px", lineHeight:"1.8",
              color:"var(--text-secondary)", whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
              {viewerContent.text}
            </div>
            <div style={{ padding:"12px 20px", borderTop:"1px solid var(--border)",
              fontSize:"11px", color:"var(--text-muted)", display:"flex", justifyContent:"space-between", flexShrink:0 }}>
              <span>📝 {viewerContent.text?.length?.toLocaleString()} characters</span>
              <span>{Math.ceil((viewerContent.text?.length||0)/1500)} min read</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
