import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../hooks/useUser";
import API from "../utils/api";

const STORAGE_KEY = "examguru_doubts";

function getDoubts() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveDoubts(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return "abhi abhi";
  if (s < 3600) return `${Math.floor(s/60)} min pehle`;
  if (s < 86400) return `${Math.floor(s/3600)} ghante pehle`;
  return `${Math.floor(s/86400)} din pehle`;
}

export default function DoubtShare() {
  const { user } = useUser();
  const [doubts, setDoubts] = useState([]);
  const [text, setText] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeDoubt, setActiveDoubt] = useState(null);
  const [shareMsg, setShareMsg] = useState("");
  const [filter, setFilter] = useState("all"); // all | mine | unanswered
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const examTarget = user?.examTarget || "JEE";
  const SUBJECTS = {
    JEE:["Physics","Chemistry","Mathematics"],
    NEET:["Physics","Chemistry","Biology"],
    UPSC:["History","Geography","Polity","Economy","Current Affairs"],
    default:["General","Mathematics","Science","English"]
  };
  const subjects = SUBJECTS[examTarget] || SUBJECTS.default;

  useEffect(() => {
    const saved = getDoubts();
    // Add some example doubts if empty
    if (saved.length === 0) {
      const examples = [
        { id:1, userId:"ex1", userName:"Rahul", subject:"Physics", text:"Newton ka 2nd law kab apply karte hain? Force aur acceleration ka relation samajh nahi aaya.", time:new Date(Date.now()-3600000).toISOString(), aiAnswer:null, likes:3, helped:["u2"] },
        { id:2, userId:"ex2", userName:"Priya", subject:"Chemistry", text:"Ionic aur covalent bond mein kya difference hai? Exam mein kaise identify karein?", time:new Date(Date.now()-7200000).toISOString(), aiAnswer:"Ionic bond: electron transfer hota hai (metal + non-metal). Covalent bond: electron sharing hoti hai (non-metal + non-metal). Trick: NaCl ionic, H₂O covalent!", likes:5, helped:[] },
        { id:3, userId:"ex3", userName:"Amit", subject:"Mathematics", text:"Quadratic equation ke roots kab real hote hain? Discriminant wala formula yaad nahi ho raha.", time:new Date(Date.now()-1800000).toISOString(), aiAnswer:null, likes:1, helped:[] },
      ];
      saveDoubts(examples);
      setDoubts(examples);
    } else {
      setDoubts(saved);
    }
    if (subjects[0]) setSubject(subjects[0]);
  }, []);

  const postDoubt = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const doubt = {
      id: Date.now(),
      userId: user.id,
      userName: user.name,
      subject: subject || subjects[0],
      text: text.trim(),
      time: new Date().toISOString(),
      aiAnswer: null,
      likes: 0,
      helped: [],
    };

    try {
      // Get AI answer
      const res = await API.post("/chat/message", {
        userId: user.id,
        message: text.trim(),
        examType, subject: subject || subjects[0],
      });
      doubt.aiAnswer = res.data.response?.replace(/\*\*/g,"").replace(/#{1,3}\s/g,"").slice(0, 500);
    } catch { doubt.aiAnswer = "AI answer abhi unavailable. Baad mein try karo!"; }

    const updated = [doubt, ...getDoubts()].slice(0, 50);
    saveDoubts(updated);
    setDoubts(updated);
    setText("");
    setLoading(false);
    setActiveDoubt(doubt.id);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:"smooth" }), 100);
  };

  const toggleLike = (id) => {
    const updated = doubts.map(d => {
      if (d.id !== id) return d;
      const liked = d.helped?.includes(user.id);
      return { ...d, likes:(d.likes||0)+(liked?-1:1), helped:liked?d.helped.filter(u=>u!==user.id):[...(d.helped||[]),user.id] };
    });
    saveDoubts(updated);
    setDoubts(updated);
  };

  const shareDoubt = (doubt) => {
    const text = `❓ ${doubt.subject} Doubt — ExamGuru AI\n\n"${doubt.text}"\n\n💡 AI Answer: ${doubt.aiAnswer?.slice(0,200)||"Loading..."}\n\n📚 Join ExamGuru AI: examguru.ai`;
    if (navigator.share) {
      navigator.share({ title:"ExamGuru Doubt", text });
    } else {
      navigator.clipboard?.writeText(text).then(() => {
        setShareMsg("✅ Copied! WhatsApp pe paste karo");
        setTimeout(() => setShareMsg(""), 2500);
      });
    }
  };

  const deleteDoubt = (id) => {
    const updated = doubts.filter(d => d.id !== id);
    saveDoubts(updated);
    setDoubts(updated);
  };

  const filtered = doubts.filter(d => {
    if (filter === "mine") return d.userId === user.id;
    if (filter === "unanswered") return !d.aiAnswer;
    return true;
  });

  const examTarget2 = user?.examTarget;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", background:"var(--bg-secondary)", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"10px" }}>
          <div style={{ flex:1 }}>
            <h1 style={{ fontSize:"18px", fontWeight:900, margin:0 }}>💬 Doubt Community</h1>
            <p style={{ fontSize:"12px", color:"var(--text-muted)", margin:0 }}>Apna doubt poochho — AI + community solve karega</p>
          </div>
          <div style={{ fontSize:"12px", color:"var(--text-muted)", fontWeight:700 }}>
            {doubts.length} doubts
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display:"flex", gap:"6px" }}>
          {[["all","🌍 Sabhi"],["mine","👤 Mere"],["unanswered","❓ Unanswered"]].map(([id,l]) => (
            <button key={id} onClick={() => setFilter(id)}
              style={{ padding:"5px 12px", borderRadius:"20px", border:`1px solid ${filter===id?"var(--accent)":"var(--border)"}`,
                background:filter===id?"var(--accent-glow)":"transparent",
                color:filter===id?"var(--accent)":"var(--text-muted)",
                cursor:"pointer", fontSize:"11px", fontWeight:700, fontFamily:"var(--font-main)" }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Doubt list */}
      <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:"12px" }}>
        {filtered.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px", color:"var(--text-muted)" }}>
            <div style={{ fontSize:"40px", marginBottom:"8px" }}>💭</div>
            <p>Koi doubt nahi! Pehla doubt poochho 👇</p>
          </div>
        )}

        {filtered.map(doubt => (
          <div key={doubt.id} className="card fade-in"
            style={{ borderColor: activeDoubt===doubt.id?"var(--accent)":"var(--border)",
              background: activeDoubt===doubt.id?"rgba(59,130,246,0.03)":"var(--bg-card)", transition:"all 0.3s" }}>

            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"10px" }}>
              <div style={{ width:"34px", height:"34px", borderRadius:"50%", flexShrink:0,
                background:`hsl(${doubt.userName?.charCodeAt(0)*7||200},60%,40%)`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"14px", fontWeight:900, color:"white" }}>
                {doubt.userName?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"13px", fontWeight:800 }}>
                  {doubt.userName} {doubt.userId===user.id&&<span style={{color:"var(--accent)",fontSize:"10px"}}>(You)</span>}
                </div>
                <div style={{ fontSize:"10px", color:"var(--text-muted)" }}>
                  {doubt.subject} • {timeAgo(doubt.time)}
                </div>
              </div>
              <span style={{ padding:"3px 8px", borderRadius:"20px", fontSize:"10px", fontWeight:700,
                background:"var(--bg-secondary)", color:"var(--text-muted)" }}>
                📚 {doubt.subject}
              </span>
            </div>

            {/* Question */}
            <p style={{ fontSize:"14px", lineHeight:"1.7", color:"var(--text-primary)", marginBottom:"12px",
              background:"var(--bg-secondary)", padding:"10px 12px", borderRadius:"8px", fontStyle:"italic" }}>
              "{doubt.text}"
            </p>

            {/* AI Answer */}
            {doubt.aiAnswer ? (
              <div style={{ background:"linear-gradient(135deg,rgba(59,130,246,0.08),rgba(99,102,241,0.04))",
                border:"1px solid rgba(59,130,246,0.2)", borderRadius:"10px", padding:"12px" }}>
                <div style={{ fontSize:"10px", fontWeight:800, color:"var(--accent)", marginBottom:"6px" }}>
                  🤖 AI Answer
                </div>
                <p style={{ fontSize:"13px", lineHeight:"1.75", color:"var(--text-secondary)", margin:0 }}>
                  {doubt.aiAnswer}
                </p>
              </div>
            ) : (
              <div style={{ padding:"10px", borderRadius:"8px", background:"rgba(245,158,11,0.06)",
                border:"1px dashed rgba(245,158,11,0.3)", textAlign:"center",
                fontSize:"12px", color:"#f59e0b", fontWeight:700 }}>
                ⏳ AI Answer generate ho raha hai...
              </div>
            )}

            {/* Actions */}
            <div style={{ display:"flex", gap:"8px", marginTop:"12px", alignItems:"center" }}>
              <button onClick={() => toggleLike(doubt.id)}
                style={{ padding:"6px 12px", borderRadius:"8px",
                  border:`1px solid ${doubt.helped?.includes(user.id)?"rgba(239,68,68,0.4)":"var(--border)"}`,
                  background: doubt.helped?.includes(user.id)?"rgba(239,68,68,0.1)":"transparent",
                  color: doubt.helped?.includes(user.id)?"#f87171":"var(--text-muted)",
                  cursor:"pointer", fontSize:"12px", fontWeight:700, fontFamily:"var(--font-main)" }}>
                {doubt.helped?.includes(user.id)?"❤️":"🤍"} Helped ({doubt.likes||0})
              </button>

              <button onClick={() => shareDoubt(doubt)}
                style={{ padding:"6px 12px", borderRadius:"8px", border:"1px solid var(--border)",
                  background:"transparent", color:"var(--text-muted)", cursor:"pointer",
                  fontSize:"12px", fontWeight:700, fontFamily:"var(--font-main)" }}>
                📤 Share
              </button>

              {doubt.userId === user.id && (
                <button onClick={() => deleteDoubt(doubt.id)}
                  style={{ padding:"6px 10px", borderRadius:"8px", border:"1px solid rgba(239,68,68,0.2)",
                    background:"transparent", color:"#f87171", cursor:"pointer",
                    fontSize:"11px", fontFamily:"var(--font-main)", marginLeft:"auto" }}>
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>

      {/* Input area */}
      <div style={{ padding:"14px 16px", borderTop:"1px solid var(--border)", background:"var(--bg-secondary)", flexShrink:0 }}>
        {/* Subject selector */}
        <div style={{ display:"flex", gap:"6px", marginBottom:"10px", overflowX:"auto" }}>
          {subjects.map(s => (
            <button key={s} onClick={() => setSubject(s)}
              style={{ padding:"4px 12px", borderRadius:"20px", border:`1px solid ${subject===s?"var(--accent)":"var(--border)"}`,
                background:subject===s?"var(--accent-glow)":"transparent",
                color:subject===s?"var(--accent)":"var(--text-muted)",
                cursor:"pointer", fontSize:"11px", fontWeight:700, fontFamily:"var(--font-main)", whiteSpace:"nowrap" }}>{s}</button>
          ))}
        </div>

        <div style={{ display:"flex", gap:"10px", alignItems:"flex-end" }}>
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); postDoubt(); } }}
            placeholder={`${subject || subjects[0]} mein kya doubt hai? AI instantly solve karega! 🤖`}
            rows={2}
            style={{ flex:1, padding:"12px 14px", borderRadius:"12px", border:"1px solid var(--border)",
              background:"var(--bg-card)", color:"var(--text-primary)", fontSize:"14px",
              fontFamily:"var(--font-main)", resize:"none", outline:"none", lineHeight:"1.5" }}
          />
          <button onClick={postDoubt} disabled={!text.trim() || loading}
            style={{ padding:"12px 18px", borderRadius:"12px", border:"none",
              background: text.trim() && !loading ? "var(--accent)" : "#334155",
              color:"white", cursor: text.trim() && !loading ? "pointer" : "default",
              fontSize:"18px", flexShrink:0, transition:"all 0.15s" }}>
            {loading ? <div className="loader" style={{width:"18px",height:"18px"}}/> : "🚀"}
          </button>
        </div>
        <div style={{ fontSize:"10px", color:"var(--text-muted)", marginTop:"6px" }}>
          Enter to send • Shift+Enter for new line • AI will answer instantly
        </div>
      </div>

      {shareMsg && (
        <div style={{ position:"fixed", bottom:"100px", left:"50%", transform:"translateX(-50%)",
          padding:"10px 20px", background:"rgba(16,185,129,0.9)", borderRadius:"30px",
          color:"white", fontWeight:700, fontSize:"13px", boxShadow:"0 4px 20px rgba(0,0,0,0.3)", zIndex:999 }}>
          {shareMsg}
        </div>
      )}
    </div>
  );
}
