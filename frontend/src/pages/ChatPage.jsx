import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { chatAPI } from "../utils/api";
import API from "../utils/api";
import { useUser } from "../hooks/useUser";
import { VoiceInputButton, SpeakButton, VoiceTutor } from "../components/VoiceTutor";
import ExplanationEngine from "../components/ExplanationEngine";
import DrawCanvas from "../components/DrawCanvas";

// ─── All 67 exam subjects ─────────────────────────────────────────────────────
const EXAM_SUBJECTS = {
  // School
  FOUNDATION:    ["Mathematics","Science","Social Science","Hindi","English"],
  CLASS_9:       ["Mathematics","Science","Social Science","Hindi","English","Sanskrit"],
  CLASS_10:      ["Mathematics","Science","Social Science","Hindi","English","Sanskrit"],
  CLASS_11_SCI:  ["Physics","Chemistry","Mathematics","Biology","English"],
  CLASS_11_COM:  ["Accountancy","Economics","Business Studies","Mathematics","English"],
  CLASS_11_ARTS: ["History","Geography","Political Science","Hindi","English"],
  CLASS_12_SCI:  ["Physics","Chemistry","Mathematics","Biology","English"],
  CLASS_12_COM:  ["Accountancy","Economics","Business Studies","Mathematics","English"],
  CLASS_12_ARTS: ["History","Geography","Political Science","Hindi","English"],
  CLASS_1112_SCI:["Physics","Chemistry","Mathematics","Biology"],
  CLASS_1112_COM:["Accountancy","Economics","Business Studies","Mathematics"],
  // Engineering
  JEE:           ["Physics","Chemistry","Mathematics"],
  JEE_MAIN:      ["Physics","Chemistry","Mathematics"],
  BITSAT:        ["Physics","Chemistry","Mathematics","English","Logical Reasoning"],
  MHT_CET:       ["Physics","Chemistry","Mathematics","Biology"],
  KCET:          ["Physics","Chemistry","Mathematics","Biology"],
  WBJEE:         ["Physics","Chemistry","Mathematics"],
  // Medical
  NEET:          ["Physics","Chemistry","Biology"],
  NEET_PG:       ["Anatomy","Physiology","Biochemistry","Pharmacology","Pathology"],
  AIIMS:         ["Medicine","Surgery","Obstetrics","Pediatrics","Psychiatry"],
  // UPSC
  UPSC:          ["History","Geography","Polity","Economy","Science & Technology","Environment","Current Affairs","Ethics"],
  UPSC_PRE:      ["History","Geography","Polity","Economy","Environment","Science & Technology","Current Affairs"],
  UPSC_MAINS:    ["GS1 History & Society","GS2 Polity & IR","GS3 Economy & Environment","GS4 Ethics","Essay"],
  UPSC_CSAT:     ["Reading Comprehension","Logical Reasoning","Quantitative Aptitude","Decision Making"],
  // State PCS
  UP_PCS:        ["History","Geography","Polity","Economy","UP Special","Current Affairs","Hindi"],
  MP_PCS:        ["History","Geography","Polity","Economy","MP Special","Current Affairs","Hindi"],
  RAS:           ["History","Geography","Polity","Economy","Rajasthan Special","Current Affairs","Hindi"],
  BPSC:          ["History","Geography","Polity","Economy","Bihar Special","Current Affairs","Hindi"],
  MPSC:          ["History","Geography","Polity","Economy","Maharashtra Special","Current Affairs","Marathi"],
  UKPSC:         ["History","Geography","Polity","Economy","Uttarakhand Special","Current Affairs"],
  HPSC:          ["History","Geography","Polity","Economy","Haryana Special","Current Affairs"],
  PPSC:          ["History","Geography","Polity","Economy","Punjab Special","Current Affairs"],
  JPSC:          ["History","Geography","Polity","Economy","Jharkhand Special","Current Affairs"],
  CGPSC:         ["History","Geography","Polity","Economy","CG Special","Current Affairs"],
  GPSC:          ["History","Geography","Polity","Economy","Gujarat Special","Current Affairs"],
  KPSC:          ["History","Geography","Polity","Economy","Karnataka Special","Current Affairs","Kannada"],
  TNPSC:         ["History","Geography","Polity","Economy","Tamil Nadu Special","Current Affairs","Tamil"],
  APPSC:         ["History","Geography","Polity","Economy","AP Special","Current Affairs","Telugu"],
  TSPSC:         ["History","Geography","Polity","Economy","Telangana Special","Current Affairs","Telugu"],
  WBPSC:         ["History","Geography","Polity","Economy","West Bengal Special","Current Affairs","Bengali"],
  OPSC:          ["History","Geography","Polity","Economy","Odisha Special","Current Affairs","Odia"],
  RPSC:          ["General Knowledge","Reasoning","Mathematics","Hindi","English"],
  // SSC / Railway / Defence
  SSC_CGL:       ["General Intelligence","General Awareness","Quantitative Aptitude","English Language"],
  SSC_CHSL:      ["General Intelligence","General Awareness","Quantitative Aptitude","English Language"],
  SSC_GD:        ["General Intelligence","General Knowledge","Mathematics","Hindi/English"],
  SSC_MTS:       ["General Intelligence","General Awareness","Quantitative Aptitude","English Language"],
  SSC_CPO:       ["General Intelligence","General Knowledge","Quantitative Aptitude","English Language"],
  RRB_NTPC:      ["Mathematics","General Intelligence","General Awareness","English"],
  RRB_GROUP_D:   ["Mathematics","General Intelligence","General Awareness","Science"],
  RRB_JE:        ["Mathematics","General Intelligence","General Awareness","Technical Ability"],
  NDA:           ["Mathematics","Physics","Chemistry","History","Geography","General Knowledge"],
  CDS:           ["Mathematics","English Language","General Knowledge"],
  CAPF:          ["General Ability","General Studies","Essay Writing"],
  AFCAT:         ["Verbal Ability","Numerical Ability","Reasoning","Military Aptitude","General Awareness"],
  // Banking
  IBPS_PO:       ["Reasoning","Quantitative Aptitude","English Language","General Awareness","Computer"],
  IBPS_CLERK:    ["Reasoning","Quantitative Aptitude","English Language","General Awareness","Computer"],
  SBI_PO:        ["Reasoning","Quantitative Aptitude","English Language","General Awareness","Data Analysis"],
  SBI_CLERK:     ["Reasoning","Quantitative Aptitude","English Language","General Awareness"],
  RBI_GRADE_B:   ["Economic & Social Issues","Finance & Management","English Language","Reasoning"],
  LIC_AAO:       ["Reasoning","Quantitative Aptitude","English Language","General Knowledge","Insurance"],
  NABARD:        ["Economic & Social Development","Agriculture","Rural Development","English","Reasoning"],
  // Law & Others
  CLAT:          ["English Language","Current Affairs","Legal Reasoning","Logical Reasoning","Quantitative Techniques"],
  AILET:         ["English","General Knowledge","Legal Aptitude","Reasoning","Mathematics"],
  CAT:           ["Verbal Ability","Data Interpretation","Logical Reasoning","Quantitative Aptitude"],
  CUET:          ["Domain Subject","Language","General Test"],
  NTA_UGC:       ["Paper 1 Teaching Aptitude","Subject Knowledge"],
  GATE:          ["Engineering Mathematics","General Aptitude","Core Engineering Subject"],
};

const QUICK_PROMPTS = {
  Physics:     ["Newton's laws explain karo","Ohm's Law with example","Wave optics summary"],
  Chemistry:   ["Chemical bonding explain karo","Organic reactions ke types","Periodic table trends"],
  Mathematics: ["Integration by parts explain karo","Probability concepts","3D geometry formulas"],
  Biology:     ["Cell division explain karo","Human digestive system","DNA replication process"],
  History:     ["Mughal Empire ka summary","Freedom movement events","Ancient India civilizations"],
  Polity:      ["Fundamental Rights explain karo","Parliament structure","DPSP vs Fundamental Rights"],
  Economy:     ["GDP vs GNP difference","Inflation types explain karo","Monetary policy kya hai"],
  Geography:   ["Monsoon system explain karo","Ocean currents types","Soil types in India"],
  "Science & Technology":["Space missions India","AI aur technology","Nuclear energy explain"],
  Environment: ["Climate change explain karo","Biodiversity kya hai","Paris Agreement"],
  "Current Affairs":["Aaj ki important news","India's foreign policy","Recent government schemes"],
  Ethics:      ["Ethics kya hoti hai","Public servant ke duties","Integrity explain karo"],
  "UP Special":["UP ki geography","UP ke mukhyamantri history","UP government schemes"],
  "MP Special":["MP ki geography","Madhya Pradesh tribes","MP government schemes"],
  "Rajasthan Special":["Rajasthan ki geography","Rajput history","Desert ecosystem"],
  "Bihar Special":["Bihar ka itihaas","Magadh empire","Bihar government schemes"],
  "Maharashtra Special":["Maratha history","Maharashtra geography","Mumbai economics"],
  Hindi:       ["Hindi grammar rules","Essay likhne ka tarika","Sandhi aur Samas"],
  Marathi:     ["Marathi grammar","Essay likhne ka tarika","Marathi literature"],
  "General Intelligence":["Reasoning shortcuts","Series completion tricks","Blood relations solve karo"],
  "General Awareness":["India GK important facts","Science GK shortcuts","Current affairs important"],
  "Quantitative Aptitude":["Percentage shortcuts","Profit loss tricks","Speed time distance"],
  "English Language":["Grammar rules important","Vocabulary tricks","Error detection kaise kare"],
  "Social Science":["French Revolution explain karo","Climate zones of India","Indian Constitution"],
  "Science":   ["Photosynthesis explain karo","Newton laws explain","Chemical reactions"],
  Accountancy: ["Journal entry kaise karte hain","Balance sheet explain karo","Depreciation kya hai"],
  Economics:   ["Demand supply explain karo","GDP kya hota hai","Indian economy basics"],
  "Business Studies":["Marketing mix explain karo","Types of business","Management functions"],
  "Political Science":["Democracy explain karo","Indian constitution","Human rights"],
  Sanskrit:    ["Sandhi explain karo","Vibhakti explain karo","Shloka meaning"],
  // Engineering additions
  "Logical Reasoning": ["Series completion","Blood relations","Coding-decoding shortcuts"],
  "Technical Ability":  ["Signal processing basics","Control systems","Electronics fundamentals"],
  // Medical
  Anatomy:      ["Human body systems","Bone structure","Organ locations"],
  Physiology:   ["Blood circulation","Nerve impulse","Digestion process"],
  Biochemistry: ["Enzyme function","Metabolism pathways","DNA replication"],
  // Banking additions
  Reasoning:    ["Syllogism tricks","Seating arrangement","Puzzle solving shortcuts"],
  Insurance:    ["LIC products explain","Insurance principles","Premium calculation"],
  "Banking Awareness": ["RBI functions","Types of loans","Digital banking"],
  "Data Analysis": ["DI shortcuts","Table interpretation","Bar graph tricks"],
  "Economic & Social Issues": ["Poverty schemes","Employment policy","Social welfare"],
  "Finance & Management": ["RBI monetary policy","Financial markets","Management concepts"],
  // Defence
  "Military Aptitude": ["Map reading","Leadership qualities","Defence history India"],
  "Verbal Ability":    ["Reading comprehension tricks","Para jumbles","Sentence correction"],
  "Numerical Ability": ["Number series","Percentage tricks","Ratio proportion"],
  // Law
  "Legal Reasoning":   ["Legal aptitude basics","Constitutional law","Contract act"],
  "Legal Aptitude":    ["Tort law basics","Criminal procedure","Evidence act"],
  "Current Affairs":   ["Aaj ki important news","India foreign policy","Recent government schemes"],
  "General Test":      ["GK shortcuts","Current affairs important","Reasoning basics"],
  "Domain Subject":    ["Subject ke important topics","Previous year questions","Key formulas"],
  // UPSC advanced
  "GS1 History & Society": ["Post-independence India","Social issues","World history modern"],
  "GS2 Polity & IR":  ["Federalism issues","India foreign policy","International organizations"],
  "GS3 Economy & Environment": ["Economic survey","Climate change policy","Agriculture schemes"],
  "GS4 Ethics":       ["Emotional intelligence","Ethics case study","Probity in governance"],
  Essay:         ["Essay introduction kaise likhe","Conclusion strategies","Current essay topics"],
  "Decision Making": ["Ethical dilemmas","Administrative cases","Policy decisions"],
  // State specific
  "CG Special":        ["Chhattisgarh geography","CG tribal culture","Bastar region"],
  "Gujarat Special":   ["Gujarat history","Gandhinagar schemes","Rann of Kutch"],
  "Karnataka Special": ["Vijayanagara empire","Kannada culture","Karnataka geography"],
  "Tamil Nadu Special":["Dravidian history","Tamil literature","TN government schemes"],
  "AP Special":        ["Andhra Pradesh geography","Telugu culture","AP bifurcation"],
  "Telangana Special": ["Hyderabad history","Telangana culture","Irrigation projects"],
  "West Bengal Special":["Bengal renaissance","Partition of Bengal","WB geography"],
  "Odisha Special":    ["Kalinga history","Puri jagannath","Odisha geography"],
  "Uttarakhand Special":["Uttarakhand geography","Chipko movement","Char Dham"],
  "Haryana Special":   ["Haryana history","Kurukshetra","Haryana agriculture"],
  "Punjab Special":    ["Sikh history","Punjab agriculture","Jallianwala Bagh"],
  "Jharkhand Special": ["Jharkhand tribal history","Mineral resources","Ranchi"],
  Kannada:      ["Kannada grammar basics","Kannada literature","Karnataka culture"],
  Tamil:        ["Tamil grammar","Sangam literature","Tamil culture"],
  Telugu:       ["Telugu grammar","Telugu literature","Andhra culture"],
  Bengali:      ["Bengali grammar","Tagore literature","Bengal culture"],
  Odia:         ["Odia grammar","Odia literature","Odisha culture"],
  default:     ["Ek concept explain karo","Example ke saath samjhao","Practice question do"]
};

// ─── Doubt Photo Scanner Component (v2 - Upgraded) ───────────────────────────
/**
 * DoubtScanner v2
 * Improvements over v1:
 * 1. Image preview before scan (confirm/retake)
 * 2. Camera grid overlay for alignment
 * 3. 4-step scan animation
 * 4. File size validation (max 10MB)
 * 5. Cleaner UI with separate preview state
 */
function DoubtScanner({ onScanResult, subject, examType }) {
  const [scanState, setScanState] = useState("idle"); // idle|preview|scanning|done|error
  const [preview, setPreview]     = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [dragOver, setDragOver]   = useState(false);
  const [scanStep, setScanStep]   = useState("");
  const fileRef   = useRef(null);
  const cameraRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const SCAN_STEPS = [
    "📖 Image padh raha hoon...",
    "🔍 Question identify kar raha hoon...",
    "🧠 Solution calculate kar raha hoon...",
    "✍️ Answer format kar raha hoon..."
  ];

  const analyzeImage = useCallback(async (base64Data, mimeType) => {
    setScanState("scanning");
    let stepIdx = 0;
    setScanStep(SCAN_STEPS[0]);
    const stepTimer = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, SCAN_STEPS.length - 1);
      setScanStep(SCAN_STEPS[stepIdx]);
    }, 1800);
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${API_URL}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Data, mimeType, subject, examType })
      });
      const data = await response.json();
      clearInterval(stepTimer);
      if (!response.ok) throw new Error(data.error || "Scan failed");
      onScanResult(null, data.result);
      setScanState("done");
    } catch (err) {
      clearInterval(stepTimer);
      setScanState("error");
      setTimeout(() => setScanState("idle"), 3000);
      onScanResult(null, `❌ Scan nahi ho saka: ${err.message}. Text mein type karo!`);
    }
    setPreview(null);
    setPreviewFile(null);
    setCameraOpen(false);
  }, [examType, subject, onScanResult]);

  const processFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) {
      setScanState("error");
      setTimeout(() => setScanState("idle"), 2000);
      return;
    }
    if (file.size > 10 * 1024 * 1024) { alert("File too large! Max 10MB."); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      setPreviewFile({ base64: e.target.result.split(",")[1], mimeType: file.type });
      setScanState("preview");
    };
    reader.readAsDataURL(file);
  }, []);

  const confirmScan = () => { if (previewFile) analyzeImage(previewFile.base64, previewFile.mimeType); };
  const retake = () => { setPreview(null); setPreviewFile(null); setScanState("idle"); };

  const handleFileChange = (e) => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ""; };
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:"environment", width:{ideal:1280}, height:{ideal:720} } });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => { if (cameraRef.current) cameraRef.current.srcObject = stream; }, 100);
    } catch { fileRef.current?.click(); }
  };

  const capturePhoto = () => {
    if (!cameraRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = cameraRef.current.videoWidth;
    canvas.height = cameraRef.current.videoHeight;
    canvas.getContext("2d").drawImage(cameraRef.current, 0, 0);
    canvas.toBlob((blob) => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      setCameraOpen(false);
      processFile(new File([blob], "photo.jpg", { type:"image/jpeg" }));
    }, "image/jpeg", 0.95);
  };

  const closeCamera = () => { streamRef.current?.getTracks().forEach(t => t.stop()); setCameraOpen(false); };

  // Camera view
  if (cameraOpen) return (
    <div style={{ position:"fixed", inset:0, background:"#000", zIndex:1000, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
      <div style={{ position:"relative", width:"100%", maxWidth:"600px" }}>
        <video ref={cameraRef} autoPlay playsInline style={{ width:"100%", borderRadius:"12px", display:"block" }}/>
        <div style={{ position:"absolute", inset:0, pointerEvents:"none",
          backgroundImage:"linear-gradient(rgba(255,255,255,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.08) 1px,transparent 1px)",
          backgroundSize:"33.3% 33.3%", borderRadius:"12px" }}/>
      </div>
      <p style={{ color:"rgba(255,255,255,0.7)", fontSize:"13px", margin:"12px 0" }}>
        📐 Question ko frame ke andar rakhо — phir 📸 dabao
      </p>
      <div style={{ display:"flex", gap:"20px" }}>
        <button onClick={closeCamera} style={{ width:"52px", height:"52px", borderRadius:"50%", background:"rgba(255,255,255,0.15)", border:"2px solid rgba(255,255,255,0.4)", cursor:"pointer", fontSize:"20px", color:"white" }}>✕</button>
        <button onClick={capturePhoto} style={{ width:"70px", height:"70px", borderRadius:"50%", background:"white", border:"4px solid #3b82f6", cursor:"pointer", fontSize:"28px", boxShadow:"0 0 0 4px rgba(59,130,246,0.3)" }}>📸</button>
        <div style={{ width:"52px" }}/>
      </div>
    </div>
  );

  // Main scanner bar
  return (
    <div style={{ padding:"8px 24px", borderBottom:"1px solid var(--border)" }}>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display:"none" }}/>

      {/* Preview + confirm */}
      {scanState === "preview" && preview && (
        <div style={{ marginBottom:"8px" }}>
          <div style={{ display:"flex", gap:"8px", alignItems:"center", marginBottom:"6px" }}>
            <img src={preview} alt="preview" style={{ width:"60px", height:"45px", objectFit:"cover", borderRadius:"6px", border:"2px solid var(--accent)" }}/>
            <div style={{ flex:1, fontSize:"12px", color:"var(--text-secondary)" }}>
              👀 Image ready — scan karein?
            </div>
            <button onClick={retake} style={{ padding:"5px 10px", borderRadius:"6px", border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", cursor:"pointer", fontSize:"11px", fontWeight:700, fontFamily:"var(--font-main)" }}>🔄 Retake</button>
            <button onClick={confirmScan} style={{ padding:"5px 14px", borderRadius:"6px", border:"none", background:"var(--accent)", color:"white", cursor:"pointer", fontSize:"11px", fontWeight:800, fontFamily:"var(--font-main)" }}>🔍 Scan →</button>
          </div>
        </div>
      )}

      {/* Scanning animation */}
      {scanState === "scanning" && (
        <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"8px 0" }}>
          <div className="loader" style={{ width:"16px", height:"16px", flexShrink:0 }}/>
          <span style={{ fontSize:"12px", color:"var(--accent)", fontWeight:700 }}>{scanStep}</span>
          {preview && <img src={preview} alt="" style={{ width:"32px", height:"24px", objectFit:"cover", borderRadius:"4px", opacity:0.6, marginLeft:"auto" }}/>}
        </div>
      )}

      {/* Default bar */}
      {(scanState === "idle" || scanState === "done" || scanState === "error") && (
        <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
          style={{ border:`2px dashed ${dragOver?"var(--accent)":"var(--border-light)"}`, borderRadius:"var(--radius)", padding:"10px 16px", display:"flex", alignItems:"center", gap:"12px", background:dragOver?"var(--accent-glow)":"var(--bg-card)", transition:"all 0.2s" }}>
          <span style={{ fontSize:"20px" }}>📸</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:"13px", fontWeight:700, marginBottom:"2px" }}>
              Doubt Photo Scanner
              <span style={{ marginLeft:"8px", fontSize:"10px", background:"linear-gradient(135deg,#3b82f6,#6366f1)", color:"white", padding:"2px 6px", borderRadius:"10px", fontWeight:800 }}>NEW</span>
            </div>
            <div style={{ fontSize:"11px", color:"var(--text-muted)" }}>
              {scanState==="done" ? "✅ Scan complete! Scroll down dekho." :
               scanState==="error" ? "❌ Error. Try again!" :
               dragOver ? "📂 Drop karo!" :
               "Notebook/textbook ka photo lo — AI solve karega"}
            </div>
          </div>
          <button onClick={openCamera}
            style={{ padding:"7px 14px", borderRadius:"8px", border:"none", background:"var(--accent)", color:"white", cursor:"pointer", fontSize:"12px", fontWeight:700, fontFamily:"var(--font-main)", display:"flex", alignItems:"center", gap:"6px" }}>
            📷 Camera
          </button>
          <button onClick={() => fileRef.current?.click()}
            style={{ padding:"7px 14px", borderRadius:"8px", border:"1px solid var(--border)", background:"var(--bg-secondary)", color:"var(--text-secondary)", cursor:"pointer", fontSize:"12px", fontWeight:700, fontFamily:"var(--font-main)" }}>
            🖼️ Upload
          </button>
        </div>
      )}
    </div>
  );
}

// ─── ChatPage ────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { user } = useUser();
  const [subject, setSubject] = useState(() => (EXAM_SUBJECTS[user?.examTarget] || ["General Knowledge"])[0]);

  const handleSubjectChange = (newSubject) => {
    setSubject(newSubject);
    setSessionId(null);
    setMessages([]);
  };
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState("");
  const [drawOpen, setDrawOpen] = useState(false);
  const [drawConcept, setDrawConcept] = useState("");
  const [teacherStyle, setTeacherStyle] = useState("friendly");
  const [showTeacherPicker, setShowTeacherPicker] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const subjects = user?.subjects?.length > 0 ? user.subjects : (EXAM_SUBJECTS[user?.examTarget] || ["General Knowledge","Mathematics","Reasoning"]);
  const quickPrompts = QUICK_PROMPTS[subject] || QUICK_PROMPTS.default;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const examLabels = { JEE:"JEE",NEET:"NEET",UPSC:"UPSC CSE",UP_PCS:"UP PCS",MP_PCS:"MP PCS",RAS:"Rajasthan RAS",BPSC:"Bihar BPSC",MPSC:"Maharashtra MPSC",SSC_CGL:"SSC CGL",SSC_CHSL:"SSC CHSL" };
    const examLabel = examLabels[user?.examTarget] || user?.examTarget;
    setMessages([{ role:"assistant", content:`Namaste ${user?.name}! 🙏 Main tumhara **ExamGuru AI** hoon.\n\nMain **${examLabel}** ke liye **${subject}** mein tumhari help karunga.\n\n📸 **Naya Feature:** Apne notebook ka photo lo — AI directly solve karega!\n\nKya poochna hai?` }]);
    setSessionId(null);
  }, [subject, user]);

  const isConfused = useCallback((text) => {
    const keywords = ["nahi samjha","samajh nahi","confuse","clear nahi","fir se batao","dobara","kya matlab","phir batao","nahi pata","kuch nahi samjha","ekdum nahi","not clear","dont understand","explain again","समझ नहीं","फिर से","dono baaraa"];
    return keywords.some(k => text.toLowerCase().includes(k));
  }, []);

  const [toast, setToast]       = useState("");
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("eg_bookmarks") || "[]"); } catch { return []; }
  });
  const [quizModal, setQuizModal]   = useState(null); // { question, options, correct, explanation }
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [notesPanel, setNotesPanel] = useState(false);
  const [smartNotes, setSmartNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("eg_notes") || "[]"); } catch { return []; }
  });
  const [loadingQuiz, setLoadingQuiz]   = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  // Bookmark toggle
  const toggleBookmark = (msg) => {
    const id = msg.question || msg.content?.slice(0,50);
    const exists = bookmarks.find(b => b.id === id);
    let updated;
    if (exists) {
      updated = bookmarks.filter(b => b.id !== id);
      showToast("🔖 Bookmark removed");
    } else {
      updated = [{ id, question: msg.question, content: msg.content, subject, time: new Date().toISOString() }, ...bookmarks].slice(0,50);
      showToast("🔖 Bookmarked! Notes mein milega");
    }
    setBookmarks(updated);
    localStorage.setItem("eg_bookmarks", JSON.stringify(updated));
  };

  const isBookmarked = (msg) => {
    const id = msg.question || msg.content?.slice(0,50);
    return bookmarks.some(b => b.id === id);
  };

  // Generate instant quiz on topic
  const generateQuiz = async (question) => {
    setLoadingQuiz(true);
    setQuizAnswer(null);
    try {
      const res = await API.post("/chat/message", {
        userId: user.id, sessionId,
        message: `Generate 1 MCQ question on: "${question}". Format EXACTLY:
Q: [question]
A) [option]
B) [option]
C) [option]
D) [option]
Correct: [A/B/C/D]
Explanation: [brief explanation]`,
        examType: user.examTarget, subject
      });
      const text = res.data.response || "";
      // Parse response
      const qMatch    = text.match(/Q:\s*(.+)/);
      const aMatch    = text.match(/A\)\s*(.+)/);
      const bMatch    = text.match(/B\)\s*(.+)/);
      const cMatch    = text.match(/C\)\s*(.+)/);
      const dMatch    = text.match(/D\)\s*(.+)/);
      const corrMatch = text.match(/Correct:\s*([ABCD])/i);
      const expMatch  = text.match(/Explanation:\s*(.+)/s);
      if (qMatch && aMatch && corrMatch) {
        setQuizModal({
          question:    qMatch[1].trim(),
          options:     { A: aMatch[1]?.trim(), B: bMatch?.[1]?.trim(), C: cMatch?.[1]?.trim(), D: dMatch?.[1]?.trim() },
          correct:     corrMatch[1].toUpperCase(),
          explanation: expMatch?.[1]?.trim() || "",
        });
      } else {
        showToast("Quiz generate nahi hua, dobara try karo");
      }
    } catch { showToast("Quiz error — try again"); }
    finally { setLoadingQuiz(false); }
  };

  // Generate smart notes from conversation
  const generateNotes = async () => {
    const recentMsgs = messages.filter(m => m.role === "assistant" && m.isExplain).slice(-3);
    if (recentMsgs.length === 0) { showToast("⚠️ Pehle kuch padho, phir notes banao!"); return; }
    setLoadingNotes(true);
    try {
      const context = recentMsgs.map(m => `Topic: ${m.question}\nAnswer: ${m.content?.slice(0,500)}`).join("\n\n");
      const res = await API.post("/chat/message", {
        userId: user.id,
        message: `From this study session, create concise bullet-point notes in Hinglish:
${context}

Format:
📌 Topic: [topic name]
• Key point 1
• Key point 2
• Key formula/fact
⭐ Exam tip: [important exam tip]`,
        examType: user.examTarget, subject
      });
      const note = {
        id: Date.now(),
        subject,
        content: res.data.response,
        time: new Date().toLocaleDateString("en-IN"),
      };
      const updated = [note, ...smartNotes].slice(0,20);
      setSmartNotes(updated);
      localStorage.setItem("eg_notes", JSON.stringify(updated));
      setNotesPanel(true);
      showToast("📝 Smart notes ready!");
    } catch { showToast("Notes error — try again"); }
    finally { setLoadingNotes(false); }
  };

  const askExaminer = useCallback(async () => {
    const lastUser = [...messages].reverse().find(m => m.role === "user");
    if (!lastUser) { showToast("⚠️ Pehle ek sawaal poochho, phir Examiner mode use karo!"); return; }
    setLoading(true);
    try {
      const res = await API.post("/chat/examiner", { question: lastUser.content, subject, examType: user.examTarget });
      setMessages(prev => [...prev, { role:"assistant", content:res.data.response, isExplain:true, question:lastUser.content, badge:"🎯 Examiner Mode" }]);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [messages, subject, user]);

  const askWhyStudy = useCallback(async () => {
    const lastUser = [...messages].reverse().find(m => m.role === "user");
    if (!lastUser) { showToast("⚠️ Pehle ek sawaal poochho, phir Why? use karo!"); return; }
    setLoading(true);
    try {
      const res = await API.post("/chat/whystudy", { topic: lastUser.content, subject, examType: user.examTarget });
      setMessages(prev => [...prev, { role:"assistant", content:res.data.response, isExplain:true, question:lastUser.content, badge:"💡 Why Study This?" }]);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [messages, subject, user]);

  const askTeacherStyle = useCallback(async (style) => {
    const lastUser = [...messages].reverse().find(m => m.role === "user");
    if (!lastUser) { showToast("⚠️ Pehle ek sawaal poochho, phir Style change karo!"); setShowTeacherPicker(false); return; }
    setTeacherStyle(style);
    setShowTeacherPicker(false);
    setLoading(true);
    const styleLabels = { strict:"👨‍🏫 Strict Teacher", friendly:"😊 Friendly Senior", storyteller:"📖 Storyteller", coach:"🎯 Exam Coach", simple:"🧒 Simple Teacher" };
    try {
      const res = await API.post("/chat/teacherstyle", { question: lastUser.content, subject, examType: user.examTarget, style });
      setMessages(prev => [...prev, { role:"assistant", content:res.data.response, isExplain:true, question:lastUser.content, badge: styleLabels[style]||"👨‍🏫 Teacher Style" }]);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, [messages, subject, user]);

  const sendMessage = useCallback(async (text, reStyle) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    setError("");
    const confused = isConfused(msg);
    setMessages(prev => [...prev, { role:"user", content:msg, isConfused:confused }]);
    setLoading(true);
    try {
      let res;
      if (confused || reStyle) {
        const lastAI = [...messages].reverse().find(m => m.role === "assistant");
        const question = lastAI?.question || msg;
        res = await chatAPI.reExplain({ question, subject, examType: user.examTarget, style: reStyle||"simple" });
        setMessages(prev => [...prev, { role:"assistant", content:res.data.response, isExplain:true, question, isReExplain:true, style:reStyle||"simple" }]);
      } else {
        res = await chatAPI.sendMessage({ userId:user.id, sessionId, message:msg, examType:user.examTarget, subject });
        setSessionId(res.data.sessionId);
        setMessages(prev => [...prev, { role:"assistant", content:res.data.response, isExplain:true, question:msg }]);
      }
    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, { role:"assistant", content:`❌ Error: ${err.message}. Please try again.` }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, sessionId, subject, user, messages, isConfused]);

  const handleScanResult = useCallback((userMsg, aiMsg) => {
    if (aiMsg) {
      setMessages(prev => [...prev, { role:"user", content:"📸 [Photo se doubt scan kiya]" }, { role:"assistant", content:aiMsg }]);
    } else if (userMsg) { sendMessage(userMsg); }
  }, [sendMessage]);

  const handleKeyDown = (e) => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const clearChat = () => { setSessionId(null); setMessages([{ role:"assistant", content:`Naya session shuru! ${subject} ke baare mein kya poochna hai? 🎯` }]); };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden" }} onClick={() => setShowTeacherPicker(false)}>
      {/* Header */}
      <div style={{ padding:"16px 24px", background:"var(--bg-secondary)", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:"12px", flexShrink:0, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:"120px" }}>
          <h1 style={{ fontSize:"18px", fontWeight:800, marginBottom:"2px" }}>💬 AI Tutor</h1>
          <p style={{ fontSize:"12px", color:"var(--text-muted)" }}>{user?.examTarget} • {subject}</p>
        </div>
        <select className="input" style={{ width:"160px" }} value={subject} onChange={e => handleSubjectChange(e.target.value)}>
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <VoiceTutor user={user} subject={subject} examType={user?.examTarget} sessionId={sessionId} setSessionId={setSessionId}/>
        <button className="btn btn-secondary" onClick={clearChat} style={{ padding:"8px 14px", fontSize:"13px" }}>🔄 New Chat</button>
        <button onClick={askExaminer} disabled={loading} style={{ padding:"8px 12px", borderRadius:"8px", border:"1px solid rgba(239,68,68,0.35)", background:"rgba(239,68,68,0.08)", color:"#f87171", cursor:"pointer", fontSize:"11px", fontWeight:800, fontFamily:"var(--font-main)" }}>🎯 Examiner</button>
        <button onClick={askWhyStudy} disabled={loading} style={{ padding:"8px 12px", borderRadius:"8px", border:"1px solid rgba(245,158,11,0.35)", background:"rgba(245,158,11,0.08)", color:"#fbbf24", cursor:"pointer", fontSize:"11px", fontWeight:800, fontFamily:"var(--font-main)" }}>💡 Why?</button>
        {/* Teacher Style Picker */}
        <div style={{ position:"relative" }} onClick={e => e.stopPropagation()}>
          <button onClick={() => setShowTeacherPicker(p => !p)} disabled={loading} style={{ padding:"8px 12px", borderRadius:"8px", border:"1px solid rgba(16,185,129,0.35)", background:"rgba(16,185,129,0.08)", color:"#10b981", cursor:"pointer", fontSize:"11px", fontWeight:800, fontFamily:"var(--font-main)", display:"flex", alignItems:"center", gap:"4px" }}>
            👨‍🏫 Style {showTeacherPicker?"▲":"▼"}
          </button>
          {showTeacherPicker && (
            <div style={{ position:"absolute", top:"38px", right:0, zIndex:999, background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"12px", padding:"8px", width:"200px", boxShadow:"0 8px 24px rgba(0,0,0,0.4)", display:"flex", flexDirection:"column", gap:"4px" }}>
              <div style={{ fontSize:"10px", fontWeight:800, color:"var(--text-muted)", marginBottom:"4px", padding:"0 4px" }}>TEACHER STYLE CHUNIYE</div>
              {[
                { id:"friendly",    icon:"😊", label:"Friendly Senior",   desc:"Dost jaisa, casual Hinglish" },
                { id:"strict",      icon:"👨‍🏫", label:"Strict Teacher",    desc:"Formal, structured, serious" },
                { id:"storyteller", icon:"📖", label:"Storyteller",        desc:"Kahani se samjhata hai" },
                { id:"coach",       icon:"🎯", label:"Exam Coach",         desc:"Shortcuts, tricks, marks focus" },
                { id:"simple",      icon:"🧒", label:"5th Class Style",    desc:"Bilkul simple, basic words" },
              ].map(t => (
                <button key={t.id} onClick={() => askTeacherStyle(t.id)} style={{ padding:"8px 10px", borderRadius:"8px", border:`1px solid ${teacherStyle===t.id?"var(--accent)":"transparent"}`, background:teacherStyle===t.id?"var(--accent-glow)":"var(--bg-secondary)", cursor:"pointer", textAlign:"left", fontFamily:"var(--font-main)", transition:"all 0.15s", width:"100%" }}>
                  <div style={{ fontSize:"12px", fontWeight:700, color:teacherStyle===t.id?"var(--accent)":"var(--text-primary)" }}>{t.icon} {t.label}</div>
                  <div style={{ fontSize:"10px", color:"var(--text-muted)", marginTop:"2px" }}>{t.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={generateNotes} disabled={loadingNotes}
          style={{ padding:"8px 12px", borderRadius:"8px", border:"1px solid rgba(16,185,129,0.35)",
            background:"rgba(16,185,129,0.08)", color:"#10b981", cursor:"pointer",
            fontSize:"11px", fontWeight:800, fontFamily:"var(--font-main)",
            display:"flex", alignItems:"center", gap:"4px" }}>
          {loadingNotes ? <><div className="loader" style={{width:"10px",height:"10px"}}/></> : "📝"} Notes
        </button>
        <button onClick={() => setNotesPanel(p=>!p)}
          style={{ padding:"8px 8px", borderRadius:"8px",
            border:`1px solid ${bookmarks.length?"rgba(251,191,36,0.4)":"rgba(71,85,105,0.3)"}`,
            background:bookmarks.length?"rgba(251,191,36,0.08)":"transparent",
            color:bookmarks.length?"#fbbf24":"var(--text-muted)",
            cursor:"pointer", fontSize:"11px", fontWeight:800, fontFamily:"var(--font-main)",
            display:"flex", alignItems:"center", gap:"4px", position:"relative" }}>
          🔖 {bookmarks.length>0 && <span style={{ position:"absolute", top:"-4px", right:"-4px", background:"#ef4444", borderRadius:"50%", width:"16px", height:"16px", fontSize:"9px", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:"white" }}>{bookmarks.length}</span>}
        </button>
        <button onClick={() => { setDrawConcept(subject); setDrawOpen(true); }} style={{ padding:"8px 14px", borderRadius:"8px", border:"1px solid rgba(139,92,246,0.4)", background:"rgba(139,92,246,0.1)", color:"#a78bfa", cursor:"pointer", fontSize:"12px", fontWeight:800, fontFamily:"var(--font-main)", display:"flex", alignItems:"center", gap:"6px" }}>✏️ Draw</button>
      </div>

      {/* Quick prompts */}
      <div style={{ padding:"10px 24px", display:"flex", gap:"8px", overflowX:"auto", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
        {quickPrompts.map((p, i) => (
          <button key={i} onClick={() => sendMessage(p)} disabled={loading}
            style={{ padding:"6px 14px", borderRadius:"20px", border:"1px solid var(--border)", background:"var(--bg-card)", color:"var(--text-secondary)", cursor:"pointer", fontSize:"12px", fontWeight:500, whiteSpace:"nowrap", fontFamily:"var(--font-main)", transition:"all 0.15s" }}
            onMouseOver={e => { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.color="var(--accent)"; }}
            onMouseOut={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text-secondary)"; }}>
            {p}
          </button>
        ))}
      </div>

      {/* Doubt Scanner */}
      <DoubtScanner onScanResult={handleScanResult} subject={subject} examType={user?.examTarget}/>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:"20px 24px", display:"flex", flexDirection:"column", gap:"16px" }}>
        {messages.map((msg, i) => (
          <div key={i} className="fade-in" style={{ display:"flex", gap:"12px", justifyContent:msg.role==="user"?"flex-end":"flex-start" }}>
            {msg.role==="assistant" && (
              <div style={{ width:"34px", height:"34px", borderRadius:"10px", background:"linear-gradient(135deg,#3b82f6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", flexShrink:0 }}>🎓</div>
            )}
            <div style={{ maxWidth:"72%", background:msg.role==="user"?"var(--accent)":"var(--bg-card)", borderRadius:msg.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px", padding:"12px 16px", border:msg.role==="user"?"none":"1px solid var(--border)", fontSize:"14px", lineHeight:"1.6" }}>
              {msg.role==="assistant"
                ? <div>
                    {(msg.badge || msg.isReExplain) && (
                      <div style={{ marginBottom:"8px", padding:"4px 10px", borderRadius:"20px", background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.2)", display:"inline-flex", alignItems:"center", gap:"6px", fontSize:"11px", color:"var(--accent)", fontWeight:800 }}>
                        {msg.badge || "🔄 Re-Explained"}
                      </div>
                    )}
                    <button onClick={() => { setDrawConcept(msg.question||subject); setDrawOpen(true); }}
                      style={{ marginBottom:"8px", padding:"5px 12px", borderRadius:"8px", border:"1px solid rgba(139,92,246,0.3)", background:"rgba(139,92,246,0.08)", color:"#a78bfa", cursor:"pointer", fontSize:"11px", fontWeight:800, fontFamily:"var(--font-main)", display:"inline-block", marginRight:"6px" }}>
                      ✏️ Draw
                    </button>
                    {msg.isExplain
                      ? <ExplanationEngine message={msg.question} response={msg.content} subject={subject} examType={user?.examTarget}
                          onRetry={(type) => {
                            const prompts = {
                              simpler:`${msg.question} — bilkul simple mein samjhao, 5th class student ko jaise samjhaoge`,
                              example:`${msg.question} — ek real life example se samjhao`,
                              exam:`${msg.question} — ${user?.examTarget} exam ke liye kya important hai?`,
                              hinglish:`${msg.question} — Hindi aur English mix mein samjhao (Hinglish)`
                            };
                            sendMessage(prompts[type]||msg.question);
                          }}/>
                      : <div className="markdown"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                    }
                    <div style={{ marginTop:"8px", display:"flex", gap:"6px", flexWrap:"wrap", alignItems:"center" }}>
                      <SpeakButton text={msg.content}/>
                      {/* Quick Action Buttons */}
                      {msg.isExplain && (
                        <>
                          <button onClick={() => generateQuiz(msg.question || msg.content?.slice(0,80))}
                            disabled={loadingQuiz}
                            title="Iss topic pe instant quiz lo"
                            style={{ padding:"4px 10px", borderRadius:"20px", border:"1px solid rgba(99,102,241,0.4)",
                              background:"rgba(99,102,241,0.1)", color:"#a78bfa", cursor:"pointer",
                              fontSize:"11px", fontWeight:700, fontFamily:"var(--font-main)",
                              display:"flex", alignItems:"center", gap:"4px" }}>
                            {loadingQuiz ? <div className="loader" style={{width:"10px",height:"10px"}}/> : "🧩 Quiz Me"}
                          </button>
                          <button onClick={() => sendMessage(`${msg.question} — iska exam mein kya trick hai? Short mein batao`)}
                            title="Exam shortcut trick"
                            style={{ padding:"4px 10px", borderRadius:"20px", border:"1px solid rgba(245,158,11,0.4)",
                              background:"rgba(245,158,11,0.08)", color:"#fbbf24", cursor:"pointer",
                              fontSize:"11px", fontWeight:700, fontFamily:"var(--font-main)" }}>
                            ⚡ Exam Trick
                          </button>
                          <button onClick={() => sendMessage(`${msg.question} — ek practice question do`)}
                            title="Practice question"
                            style={{ padding:"4px 10px", borderRadius:"20px", border:"1px solid rgba(16,185,129,0.4)",
                              background:"rgba(16,185,129,0.08)", color:"#10b981", cursor:"pointer",
                              fontSize:"11px", fontWeight:700, fontFamily:"var(--font-main)" }}>
                            📝 Practice Q
                          </button>
                          <button onClick={() => toggleBookmark(msg)}
                            title={isBookmarked(msg) ? "Bookmark hatao" : "Bookmark karo"}
                            style={{ padding:"4px 8px", borderRadius:"20px",
                              border:`1px solid ${isBookmarked(msg)?"rgba(251,191,36,0.6)":"rgba(71,85,105,0.4)"}`,
                              background:isBookmarked(msg)?"rgba(251,191,36,0.12)":"transparent",
                              color:isBookmarked(msg)?"#fbbf24":"var(--text-muted)",
                              cursor:"pointer", fontSize:"12px", fontFamily:"var(--font-main)" }}>
                            {isBookmarked(msg) ? "🔖" : "🏷️"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                : <div>
                    <span style={{ color:"white" }}>{msg.content}</span>
                    {msg.isConfused && (
                      <div style={{ marginTop:"8px", display:"flex", gap:"6px", flexWrap:"wrap" }}>
                        <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.7)", width:"100%", marginBottom:"4px" }}>🤔 Confusion detect hua! Kaise samjhoon?</div>
                        {[{style:"simple",label:"😊 Aur Simple"},{style:"story",label:"📖 Story mein"},{style:"example",label:"🌍 Example se"},{style:"visual",label:"👁️ Visual"},{style:"steps",label:"📋 Steps mein"}].map(btn => (
                          <button key={btn.style} onClick={() => sendMessage(msg.content, btn.style)}
                            style={{ padding:"4px 10px", borderRadius:"20px", border:"1px solid rgba(255,255,255,0.3)", background:"rgba(255,255,255,0.1)", color:"white", cursor:"pointer", fontSize:"11px", fontWeight:700, fontFamily:"var(--font-main)" }}>
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>}
            </div>
            {msg.role==="user" && (
              <div style={{ width:"34px", height:"34px", borderRadius:"10px", background:"var(--bg-card)", border:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", flexShrink:0 }}>👤</div>
            )}
          </div>
        ))}
        {loading && (
          <div className="fade-in" style={{ display:"flex", gap:"12px" }}>
            <div style={{ width:"34px", height:"34px", borderRadius:"10px", background:"linear-gradient(135deg,#3b82f6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px" }}>🎓</div>
            <div className="card" style={{ padding:"14px 18px" }}>
              <div style={{ display:"flex", gap:"4px", alignItems:"center" }}>
                {[0,1,2].map(i => <div key={i} style={{ width:"6px", height:"6px", borderRadius:"50%", background:"var(--accent)", animation:"pulse 1.2s ease-in-out infinite", animationDelay:`${i*0.2}s` }}/>)}
                <span style={{ marginLeft:"8px", fontSize:"12px", color:"var(--text-muted)" }}>Soch raha hoon...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{ padding:"16px 24px", borderTop:"1px solid var(--border)", background:"var(--bg-secondary)", flexShrink:0 }}>
        {error && <div style={{ color:"#f87171", fontSize:"12px", marginBottom:"8px" }}>⚠️ {error}</div>}
        <div style={{ display:"flex", gap:"10px" }}>
          <VoiceInputButton onTranscript={(text) => { setInput(text); setTimeout(() => sendMessage(text), 100); }} disabled={loading}/>
          <textarea ref={inputRef} className="input" style={{ resize:"none", height:"46px", lineHeight:"1.5", paddingTop:"12px" }}
            placeholder={`${subject} ke baare mein kuch bhi poocho... ya 📸 photo scan karo!`}
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} rows={1}/>
          <button className="btn btn-primary" onClick={() => sendMessage()} disabled={loading||!input.trim()} style={{ padding:"12px 20px", flexShrink:0 }}>
            {loading ? <div className="loader" style={{ width:"16px", height:"16px" }}/> : "Send ↑"}
          </button>
        </div>
        <p style={{ fontSize:"11px", color:"var(--text-muted)", marginTop:"6px" }}>Enter to send • Shift+Enter new line • 📸 Camera se direct scan</p>
      </div>

      {drawOpen && <DrawCanvas concept={drawConcept||subject} subject={subject} onClose={() => setDrawOpen(false)}/>}

      {/* ── Concept Quiz Modal ─────────────────────────────────────────────── */}
      {quizModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:1000,
          display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)",
            borderRadius:"18px", padding:"24px", maxWidth:"480px", width:"100%",
            boxShadow:"0 20px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"16px" }}>
              <span style={{ fontSize:"13px", fontWeight:800, color:"var(--accent)" }}>🧩 Concept Quiz</span>
              <button onClick={() => { setQuizModal(null); setQuizAnswer(null); }}
                style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:"18px" }}>✕</button>
            </div>
            <p style={{ fontSize:"15px", fontWeight:600, lineHeight:"1.7", marginBottom:"16px" }}>
              {quizModal.question}
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"16px" }}>
              {Object.entries(quizModal.options).filter(([,v])=>v).map(([key, val]) => {
                const isSelected = quizAnswer === key;
                const isCorrect  = key === quizModal.correct;
                const revealed   = quizAnswer !== null;
                let bg = "var(--bg-secondary)", border = "var(--border)", color = "var(--text-primary)";
                if (revealed && isCorrect)  { bg="#10b98115"; border="#10b981"; color="#10b981"; }
                if (revealed && isSelected && !isCorrect) { bg="#ef444415"; border="#ef4444"; color="#ef4444"; }
                return (
                  <button key={key} onClick={() => !quizAnswer && setQuizAnswer(key)}
                    style={{ padding:"12px 16px", borderRadius:"10px", border:`1.5px solid ${border}`,
                      background:bg, cursor:quizAnswer?"default":"pointer", textAlign:"left",
                      fontSize:"13px", color, fontFamily:"var(--font-main)", display:"flex", gap:"10px" }}>
                    <span style={{ fontWeight:800, width:"20px" }}>{key})</span> {val}
                    {revealed && isCorrect && <span style={{ marginLeft:"auto" }}>✅</span>}
                    {revealed && isSelected && !isCorrect && <span style={{ marginLeft:"auto" }}>❌</span>}
                  </button>
                );
              })}
            </div>
            {quizAnswer && (
              <div style={{ padding:"12px 14px", borderRadius:"10px", background:"rgba(59,130,246,0.08)",
                border:"1px solid rgba(59,130,246,0.2)", marginBottom:"12px" }}>
                <div style={{ fontSize:"12px", fontWeight:800, color:"var(--accent)", marginBottom:"4px" }}>
                  {quizAnswer === quizModal.correct ? "🎉 Sahi jawab!" : `❌ Galat! Sahi jawab: ${quizModal.correct}`}
                </div>
                <div style={{ fontSize:"12px", color:"var(--text-secondary)", lineHeight:"1.6" }}>
                  💡 {quizModal.explanation}
                </div>
              </div>
            )}
            <div style={{ display:"flex", gap:"8px" }}>
              {quizAnswer && <button onClick={() => { generateQuiz(quizModal.question); }}
                style={{ flex:1, padding:"10px", borderRadius:"8px", border:"none", background:"var(--accent)",
                  color:"white", cursor:"pointer", fontWeight:700, fontSize:"13px", fontFamily:"var(--font-main)" }}>
                🔄 Next Question
              </button>}
              <button onClick={() => { setQuizModal(null); setQuizAnswer(null); }}
                style={{ padding:"10px 16px", borderRadius:"8px", border:"1px solid var(--border)",
                  background:"transparent", color:"var(--text-muted)", cursor:"pointer",
                  fontSize:"13px", fontFamily:"var(--font-main)" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Notes + Bookmarks Panel ────────────────────────────────────────── */}
      {notesPanel && (
        <div style={{ position:"fixed", top:0, right:0, width:"340px", height:"100vh", zIndex:900,
          background:"var(--bg-secondary)", borderLeft:"1px solid var(--border)",
          display:"flex", flexDirection:"column", boxShadow:"-8px 0 24px rgba(0,0,0,0.3)" }}>
          <div style={{ padding:"16px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontWeight:800, fontSize:"15px" }}>📚 Notes & Bookmarks</span>
            <button onClick={() => setNotesPanel(false)}
              style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:"20px" }}>✕</button>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"12px" }}>
            {/* Smart Notes */}
            {smartNotes.length > 0 && (
              <div style={{ marginBottom:"20px" }}>
                <div style={{ fontSize:"12px", fontWeight:800, color:"#10b981", marginBottom:"8px" }}>📝 SMART NOTES</div>
                {smartNotes.map((note,i) => (
                  <div key={note.id} style={{ padding:"12px", borderRadius:"10px",
                    background:"var(--bg-card)", border:"1px solid var(--border)",
                    marginBottom:"8px", fontSize:"12px", lineHeight:"1.7",
                    color:"var(--text-secondary)", position:"relative" }}>
                    <div style={{ fontSize:"10px", color:"var(--text-muted)", marginBottom:"6px", display:"flex", justifyContent:"space-between" }}>
                      <span>📚 {note.subject}</span><span>{note.time}</span>
                    </div>
                    <div style={{ whiteSpace:"pre-wrap" }}>{note.content?.slice(0,400)}</div>
                    <button onClick={() => { const u=[...smartNotes]; u.splice(i,1); setSmartNotes(u); localStorage.setItem("eg_notes",JSON.stringify(u)); }}
                      style={{ position:"absolute", top:"8px", right:"8px", background:"none", border:"none",
                        color:"var(--text-muted)", cursor:"pointer", fontSize:"12px" }}>🗑️</button>
                  </div>
                ))}
              </div>
            )}
            {/* Bookmarks */}
            {bookmarks.length > 0 && (
              <div>
                <div style={{ fontSize:"12px", fontWeight:800, color:"#fbbf24", marginBottom:"8px" }}>🔖 BOOKMARKS</div>
                {bookmarks.map((bm,i) => (
                  <div key={bm.id} style={{ padding:"12px", borderRadius:"10px",
                    background:"var(--bg-card)", border:"1px solid var(--border)",
                    marginBottom:"8px", position:"relative" }}>
                    <div style={{ fontSize:"12px", fontWeight:700, marginBottom:"4px", color:"var(--text-primary)" }}>
                      {bm.question?.slice(0,60) || "Saved response"}
                    </div>
                    <div style={{ fontSize:"11px", color:"var(--text-muted)", lineHeight:"1.5" }}>
                      {bm.content?.slice(0,120)}...
                    </div>
                    <div style={{ fontSize:"10px", color:"var(--text-muted)", marginTop:"4px" }}>📚 {bm.subject}</div>
                    <button onClick={() => { const u=[...bookmarks]; u.splice(i,1); setBookmarks(u); localStorage.setItem("eg_bookmarks",JSON.stringify(u)); }}
                      style={{ position:"absolute", top:"8px", right:"8px", background:"none", border:"none",
                        color:"var(--text-muted)", cursor:"pointer", fontSize:"12px" }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            {smartNotes.length===0 && bookmarks.length===0 && (
              <div style={{ textAlign:"center", padding:"40px 20px", color:"var(--text-muted)" }}>
                <div style={{ fontSize:"40px", marginBottom:"12px" }}>📭</div>
                <p style={{ fontSize:"13px" }}>Koi notes ya bookmarks nahi hain abhi.<br/>Chat mein padho aur 📝 Notes ya 🔖 button use karo!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div style={{ position:"fixed", bottom:"80px", left:"50%", transform:"translateX(-50%)",
          padding:"10px 20px", background:"rgba(30,40,70,0.95)", border:"1px solid rgba(245,158,11,0.5)",
          borderRadius:"30px", color:"#fbbf24", fontWeight:700, fontSize:"13px",
          boxShadow:"0 4px 20px rgba(0,0,0,0.4)", zIndex:9999, whiteSpace:"nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
