import React, { useState, useEffect } from "react";
import { useUser } from "../hooks/useUser";
import { useAppData } from "../hooks/useAppData";
import { userAPI } from "../utils/api";
import API from "../utils/api";

const REVISION_CARDS = {
  JEE: {
    Physics: ["F=ma (Newton 2nd Law)","KE = ½mv²","PE = mgh","v² = u² + 2as","PV = nRT (Ideal Gas)","E = hν (Photoelectric)","λ = h/mv (de Broglie)"],
    Chemistry: ["Avogadro = 6.022×10²³","pH = -log[H⁺]","ΔG = ΔH - TΔS","Faraday = 96500 C/mol","pV = nRT","Raoult's Law: P = xP°"],
    Mathematics: ["sin²+cos²=1","∫xⁿdx = xⁿ⁺¹/n+1","d/dx(sin) = cos","nCr = n!/r!(n-r)!","Sum of AP = n/2(2a+(n-1)d)"],
  },
  NEET: {
    Biology: ["ATP = energy currency","DNA → RNA → Protein (Central Dogma)","Mitosis: PMAT (2 cells)","Meiosis: Prophase I crossing over (4 cells)","Photosynthesis site: Chloroplast","Respiration site: Mitochondria"],
    Physics: ["F=ma","KE=½mv²","Lens formula: 1/v - 1/u = 1/f"],
    Chemistry: ["pH scale 0-14","Acid + Base → Salt + Water","Organic: -OH alcohol, -COOH acid"],
  },
  UPSC: {
    History: ["1857 - First War of Independence","1885 - INC founded","1920 - Non-Cooperation Movement","1930 - Civil Disobedience/Dandi March","1942 - Quit India Movement","1947 - Independence, 15 August"],
    Polity: ["Part III: Fundamental Rights (Art 12-35)","Part IV: DPSP (Art 36-51)","Art 356: President's Rule","Art 370: J&K (now abrogated)","CAG: Art 148","Lok Sabha: 543 seats"],
    Economy: ["GDP = C + I + G + (X-M)","Repo Rate: RBI lends to banks","CRR: Cash reserve ratio","SLR: Statutory liquidity ratio","FDI vs FPI difference","SEBI: Securities regulator"],
    Geography: ["Tropic of Cancer: 23.5°N","Tropic of Capricorn: 23.5°S","Highest peak: K2 (India), Everest (World)","Largest river: Ganga (India)","Westerlies blow west to east"],
  },
  default: {
    General: ["Keep revising key formulas","Focus on weak topics first","Attempt previous year papers","Revise 1 day before exam"]
  }
};

export default function QuickRevision() {
  const { user } = useUser();
  const [mode, setMode] = useState("cards"); // cards | flashcard | weakfocus
  const [subject, setSubject] = useState("");
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [weakTopics, setWeakTopics] = useState([]);
  const [aiSummary, setAiSummary] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [mastered, setMastered] = useState({});

  const examTarget = user?.examTarget || "default";
  const revData = REVISION_CARDS[examTarget] || REVISION_CARDS.default;
  const subjects = Object.keys(revData);

  const { profile } = useAppData();
  useEffect(() => {
    if (profile) setWeakTopics(profile.weakTopics || []);
  }, [profile]);

  const getAISummary = async (subj) => {
    setLoadingAI(true);
    setAiSummary("");
    try {
      const res = await API.post("/chat/message", {
        userId: user.id,
        message: `${examTarget} ${subj} ke liye last-minute revision mein sirf TOP 5 most important formulas/facts do. Short bullet points mein. Exam kal hai!`,
        examType: examTarget, subject: subj
      });
      setAiSummary(res.data.response);
    } catch { setAiSummary("AI summary unavailable. Apne notes check karo!"); }
    finally { setLoadingAI(false); }
  };

  const cards = subject ? (revData[subject] || []) : [];
  const masteredCount = Object.values(mastered).filter(Boolean).length;

  return (
    <div style={{ padding:"24px", overflowY:"auto", maxHeight:"100vh" }}>
      <div style={{ marginBottom:"20px" }}>
        <h1 style={{ fontSize:"22px", fontWeight:900, marginBottom:"4px" }}>⚡ Quick Revision</h1>
        <p style={{ color:"var(--text-secondary)", fontSize:"13px" }}>Last-minute preparation — exam se pehle must do!</p>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"4px", background:"var(--bg-secondary)", borderRadius:"10px", padding:"4px", marginBottom:"20px", width:"fit-content" }}>
        {[["cards","📋 Key Points"],["flashcard","🃏 Flashcards"],["weakfocus","⚠️ Weak Focus"]].map(([id,l]) => (
          <button key={id} onClick={() => setMode(id)} style={{ padding:"7px 14px", borderRadius:"8px", border:"none",
            background: mode===id?"var(--accent)":"transparent",
            color: mode===id?"white":"var(--text-muted)",
            fontWeight:700, fontSize:"12px", fontFamily:"var(--font-main)", cursor:"pointer", transition:"all 0.15s" }}>{l}</button>
        ))}
      </div>

      {/* Subject selector */}
      <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"20px" }}>
        {subjects.map(s => (
          <button key={s} onClick={() => { setSubject(s); setCardIdx(0); setFlipped(false); if(mode==="cards") getAISummary(s); }}
            style={{ padding:"7px 16px", borderRadius:"8px", border:`1px solid ${subject===s?"var(--accent)":"var(--border)"}`,
              background: subject===s?"var(--accent-glow)":"var(--bg-secondary)",
              color: subject===s?"var(--accent)":"var(--text-secondary)",
              cursor:"pointer", fontWeight:700, fontSize:"12px", fontFamily:"var(--font-main)", transition:"all 0.15s" }}>{s}
          </button>
        ))}
      </div>

      {/* ── CARDS MODE ── */}
      {mode === "cards" && (
        <div>
          {subject ? (
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              {/* AI Summary */}
              {loadingAI && (
                <div className="card" style={{ display:"flex", gap:"10px", alignItems:"center" }}>
                  <div className="loader" style={{ width:"16px", height:"16px" }}/> AI summary load ho raha hai...
                </div>
              )}
              {aiSummary && !loadingAI && (
                <div className="card fade-in" style={{ borderColor:"rgba(59,130,246,0.3)", background:"rgba(59,130,246,0.04)" }}>
                  <div style={{ fontSize:"11px", fontWeight:800, color:"var(--accent)", marginBottom:"8px" }}>🤖 AI Last-Minute Tips</div>
                  <div style={{ fontSize:"13px", lineHeight:"1.8", color:"var(--text-secondary)", whiteSpace:"pre-wrap" }}>
                    {aiSummary.replace(/\*\*/g,"").replace(/#{1,3}\s/g,"")}
                  </div>
                </div>
              )}

              {/* Key Points */}
              <div className="card">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
                  <h3 style={{ fontSize:"14px", fontWeight:800 }}>📋 {subject} — Key Points</h3>
                  <span style={{ fontSize:"12px", color:"var(--accent)", fontWeight:700 }}>{masteredCount}/{cards.length} mastered</span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                  {cards.map((card, i) => (
                    <div key={i} style={{ display:"flex", gap:"12px", alignItems:"center", padding:"10px 12px", borderRadius:"8px",
                      background: mastered[i]?"rgba(16,185,129,0.08)":"var(--bg-secondary)",
                      border:`1px solid ${mastered[i]?"rgba(16,185,129,0.3)":"var(--border)"}`, transition:"all 0.2s" }}>
                      <input type="checkbox" checked={!!mastered[i]} onChange={() => setMastered(m => ({...m,[i]:!m[i]}))}
                        style={{ width:"16px", height:"16px", cursor:"pointer" }}/>
                      <span style={{ fontSize:"13px", color: mastered[i]?"var(--text-muted)":"var(--text-primary)",
                        textDecoration: mastered[i]?"line-through":"none", flex:1 }}>{card}</span>
                      {mastered[i] && <span style={{ fontSize:"12px" }}>✅</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign:"center", padding:"40px" }}>
              <div style={{ fontSize:"40px", marginBottom:"12px" }}>⚡</div>
              <p style={{ color:"var(--text-muted)" }}>Upar subject select karo — AI tips + key points milenge!</p>
            </div>
          )}
        </div>
      )}

      {/* ── FLASHCARD MODE ── */}
      {mode === "flashcard" && (
        <div>
          {subject && cards.length > 0 ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"20px" }}>
              {/* Progress */}
              <div style={{ width:"100%", display:"flex", gap:"10px", alignItems:"center" }}>
                <div style={{ flex:1, height:"6px", background:"var(--bg-secondary)", borderRadius:"3px", overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${((cardIdx+1)/cards.length)*100}%`, background:"var(--accent)", borderRadius:"3px", transition:"width 0.3s" }}/>
                </div>
                <span style={{ fontSize:"12px", fontWeight:700, color:"var(--text-muted)" }}>{cardIdx+1}/{cards.length}</span>
              </div>

              {/* Card */}
              <div onClick={() => setFlipped(f => !f)}
                style={{ width:"100%", maxWidth:"500px", minHeight:"200px", borderRadius:"16px",
                  background: flipped?"linear-gradient(135deg,rgba(16,185,129,0.1),rgba(16,185,129,0.05))":"var(--bg-card)",
                  border:`2px solid ${flipped?"rgba(16,185,129,0.4)":"var(--border)"}`,
                  display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                  padding:"32px", cursor:"pointer", transition:"all 0.3s", textAlign:"center",
                  boxShadow:"0 8px 32px rgba(0,0,0,0.2)" }}>
                {!flipped ? (
                  <div>
                    <div style={{ fontSize:"11px", fontWeight:800, color:"var(--text-muted)", marginBottom:"16px", textTransform:"uppercase" }}>📖 CONCEPT</div>
                    <div style={{ fontSize:"18px", fontWeight:800, color:"var(--text-primary)" }}>{cards[cardIdx]?.split("=")[0] || cards[cardIdx]}</div>
                    <div style={{ fontSize:"12px", color:"var(--text-muted)", marginTop:"16px" }}>Tap to reveal</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize:"11px", fontWeight:800, color:"#10b981", marginBottom:"16px", textTransform:"uppercase" }}>✅ ANSWER</div>
                    <div style={{ fontSize:"16px", fontWeight:700, color:"#10b981" }}>{cards[cardIdx]}</div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div style={{ display:"flex", gap:"10px" }}>
                <button className="btn btn-secondary" onClick={() => { setFlipped(false); setCardIdx(c => Math.max(0,c-1)); }} disabled={cardIdx===0}>← Prev</button>
                <button className="btn btn-primary" onClick={() => { setFlipped(false); setCardIdx(c => Math.min(cards.length-1,c+1)); }} disabled={cardIdx===cards.length-1}>Next →</button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign:"center", padding:"40px" }}>
              <p style={{ color:"var(--text-muted)" }}>Subject select karo — flashcards ready hain!</p>
            </div>
          )}
        </div>
      )}

      {/* ── WEAK FOCUS MODE ── */}
      {mode === "weakfocus" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
          <div className="card" style={{ background:"rgba(239,68,68,0.04)", borderColor:"rgba(239,68,68,0.2)" }}>
            <h3 style={{ fontSize:"14px", fontWeight:800, marginBottom:"12px" }}>⚠️ Tumhare Weak Topics — Priority Revision</h3>
            {weakTopics.length === 0 ? (
              <p style={{ color:"var(--text-muted)", fontSize:"13px" }}>Koi weak topic nahi! Mock tests do — yahan auto populate hoga.</p>
            ) : (
              weakTopics.slice(0,8).map((t,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 0", borderBottom: i<weakTopics.length-1?"1px solid var(--border)":"none" }}>
                  <div style={{ width:"28px", height:"28px", borderRadius:"8px",
                    background: t.wrong_count >= 8?"rgba(239,68,68,0.2)":t.wrong_count >= 5?"rgba(249,115,22,0.2)":"rgba(245,158,11,0.2)",
                    border: `1px solid ${t.wrong_count >= 8?"#ef4444":t.wrong_count >= 5?"#f97316":"#f59e0b"}`,
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", fontWeight:900,
                    color: t.wrong_count >= 8?"#ef4444":t.wrong_count >= 5?"#f97316":"#f59e0b", flexShrink:0 }}>
                    {t.wrong_count}x
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:"13px" }}>{t.topic}</div>
                    <div style={{ fontSize:"11px", color:"var(--text-muted)" }}>{t.subject}</div>
                  </div>
                  <div style={{ fontSize:"11px", color: t.wrong_count >= 8?"#ef4444":t.wrong_count >= 5?"#f97316":"#f59e0b", fontWeight:700 }}>
                    {t.wrong_count >= 8?"🔴 Critical":t.wrong_count >= 5?"🟠 Weak":"🟡 OK"}
                  </div>
                </div>
              ))
            )}
          </div>

          {weakTopics.length > 0 && (
            <div className="card" style={{ background:"linear-gradient(135deg,rgba(59,130,246,0.05),rgba(99,102,241,0.03))", borderColor:"rgba(59,130,246,0.2)" }}>
              <h3 style={{ fontSize:"14px", fontWeight:800, marginBottom:"8px" }}>🎯 Action Plan</h3>
              <div style={{ fontSize:"13px", color:"var(--text-secondary)", lineHeight:"1.8" }}>
                1. 🔴 Critical topics → AI Tutor se abhi poochho<br/>
                2. 🟠 Weak topics → 2-3 practice questions do<br/>
                3. 🟡 OK topics → Quick revision karo<br/>
                4. Exam se 1 hour pehle sirf formulas dekho
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
