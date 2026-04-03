import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../hooks/useUser";
import { testAPI } from "../utils/api";
import API from "../utils/api";

// ─── Challenge stored in localStorage (no backend needed) ────────────────────
const STORAGE_KEY = "examguru_challenges";

function getChallenges() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function saveChallenges(challenges) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(challenges));
}

function generateChallengeCode() {
  return Math.random().toString(36).slice(2,8).toUpperCase();
}

// ─── Share text generator ─────────────────────────────────────────────────────
function getShareText(challenge, myScore) {
  const base = `🎯 ExamGuru AI Challenge!\n\n` +
    `📚 Subject: ${challenge.subject}\n` +
    `❓ ${challenge.questions?.length || 10} Questions\n` +
    `⏱️ ${challenge.timeLimit} minutes\n` +
    `🏆 Beat my score: ${myScore !== null ? myScore + "%" : "???"}\n\n` +
    `🔑 Challenge Code: ${challenge.code}\n\n` +
    `🚀 Join at: examguru.ai\n` +
    `(Enter code to accept challenge!)`;
  return base;
}

export default function PeerChallenge() {
  const { user } = useUser();
  const [tab, setTab]             = useState("create"); // create | join | active | results
  const [subject, setSubject]     = useState("");
  const [timeLimit, setTimeLimit] = useState(15);
  const [qCount, setQCount]       = useState(10);
  const [creating, setCreating]   = useState(false);
  const [joinCode, setJoinCode]   = useState("");
  const [myChallenge, setMyChal]  = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [phase, setPhase]         = useState("lobby"); // lobby|playing|done
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers]     = useState({});
  const [current, setCurrent]     = useState(0);
  const [timeLeft, setTimeLeft]   = useState(0);
  const [result, setResult]       = useState(null);
  const [shareMsg, setShareMsg]   = useState("");
  const timerRef = useRef(null);

  const examTarget = user?.examTarget || "JEE";
  const SUBJECTS = {
    JEE:["Physics","Chemistry","Mathematics"], NEET:["Physics","Chemistry","Biology"],
    UPSC:["History","Geography","Polity","Economy"],
    default:["General Knowledge","Reasoning","Mathematics"]
  };
  const subjects = SUBJECTS[examTarget] || SUBJECTS.default;

  useEffect(() => {
    setChallenges(getChallenges());
    if (subjects[0]) setSubject(subjects[0]);
  }, []);

  // Timer during challenge
  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); submitChallenge(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const createChallenge = async () => {
    if (!subject) return;
    setCreating(true);
    try {
      const res = await testAPI.generate({ userId: user.id, subject, examType: examTarget, count: qCount });
      const qs = res.data.questions || [];
      const code = generateChallengeCode();
      const challenge = {
        id: Date.now(),
        code,
        creatorId: user.id,
        creatorName: user.name,
        subject,
        examType: examTarget,
        timeLimit,
        questions: qs,
        createdAt: new Date().toISOString(),
        participants: [{ userId: user.id, name: user.name, score: null, completedAt: null }]
      };
      const all = [challenge, ...getChallenges()].slice(0, 20);
      saveChallenges(all);
      setChallenges(all);
      setMyChal(challenge);
      setTab("active");
    } catch(e) { alert("Error: " + e.message); }
    finally { setCreating(false); }
  };

  const joinChallenge = () => {
    const code = joinCode.trim().toUpperCase();
    const found = getChallenges().find(c => c.code === code);
    if (!found) { alert("Challenge not found! Code check karo."); return; }
    // Add participant if not already
    const already = found.participants?.find(p => p.userId === user.id);
    if (!already) {
      found.participants = [...(found.participants||[]), { userId: user.id, name: user.name, score: null, completedAt: null }];
      const all = getChallenges().map(c => c.code === code ? found : c);
      saveChallenges(all);
      setChallenges(all);
    }
    setMyChal(found);
    setTab("active");
  };

  const startPlaying = (challenge) => {
    setMyChal(challenge);
    setQuestions(challenge.questions || []);
    setAnswers({});
    setCurrent(0);
    setTimeLeft(challenge.timeLimit * 60);
    setPhase("playing");
  };

  const submitChallenge = () => {
    clearInterval(timerRef.current);
    const qs = questions;
    let correct = 0;
    qs.forEach((q, i) => { if (answers[i] === q.correctAnswer) correct++; });
    const score = Math.round((correct / qs.length) * 100);

    // Save score
    const all = getChallenges().map(c => {
      if (c.code !== myChallenge?.code) return c;
      const parts = (c.participants || []).map(p =>
        p.userId === user.id ? { ...p, score, completedAt: new Date().toISOString() } : p
      );
      return { ...c, participants: parts };
    });
    saveChallenges(all);
    setChallenges(all);
    const updated = all.find(c => c.code === myChallenge?.code);
    setMyChal(updated);
    setResult({ score, correct, total: qs.length });
    setPhase("done");
  };

  const shareChallenge = (challenge) => {
    const myPart = challenge.participants?.find(p => p.userId === user.id);
    const text = getShareText(challenge, myPart?.score ?? null);
    if (navigator.share) {
      navigator.share({ title: "ExamGuru Challenge!", text });
    } else {
      navigator.clipboard?.writeText(text).then(() => {
        setShareMsg("✅ Copied! WhatsApp pe paste karo 📱");
        setTimeout(() => setShareMsg(""), 3000);
      });
    }
  };

  const formatTime = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const timeColor = timeLeft < 60 ? "#ef4444" : timeLeft < 180 ? "#f59e0b" : "#10b981";

  // ── PLAYING SCREEN ──────────────────────────────────────────────────────────
  if (phase === "playing" && questions.length > 0) {
    const q = questions[current];
    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden" }}>
        <div style={{ padding:"12px 20px", background:"var(--bg-secondary)", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:"14px", flexShrink:0 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:"13px", fontWeight:800 }}>⚔️ {myChallenge?.creatorName}'s Challenge</div>
            <div style={{ fontSize:"11px", color:"var(--text-muted)" }}>Q {current+1}/{questions.length} • {subject}</div>
          </div>
          <div style={{ padding:"8px 16px", borderRadius:"8px", background:`${timeColor}15`, border:`1px solid ${timeColor}40`, fontFamily:"monospace", fontSize:"20px", fontWeight:900, color:timeColor }}>
            {formatTime(timeLeft)}
          </div>
          <button onClick={submitChallenge} style={{ padding:"8px 14px", borderRadius:"8px", border:"1px solid rgba(239,68,68,0.4)", background:"rgba(239,68,68,0.1)", color:"#f87171", cursor:"pointer", fontSize:"12px", fontWeight:800, fontFamily:"var(--font-main)" }}>Submit</button>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"20px" }}>
          <div className="card" style={{ marginBottom:"16px" }}>
            <p style={{ fontSize:"15px", lineHeight:"1.75", margin:0 }}>{q.question}</p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"20px" }}>
            {Object.entries(q.options || {}).map(([key, val]) => {
              const sel = answers[current] === val;
              return (
                <button key={key} onClick={() => setAnswers(p => ({...p,[current]:val}))}
                  style={{ padding:"14px 18px", borderRadius:"10px", border:`1.5px solid ${sel?"var(--accent)":"var(--border)"}`,
                    background: sel?"var(--accent-glow)":"var(--bg-card)", cursor:"pointer", textAlign:"left",
                    fontSize:"14px", fontWeight:sel?700:400, color:sel?"var(--accent)":"var(--text-primary)",
                    fontFamily:"var(--font-main)", transition:"all 0.15s", display:"flex", gap:"12px", alignItems:"center" }}>
                  <span style={{ width:"26px", height:"26px", borderRadius:"50%", border:`1.5px solid ${sel?"var(--accent)":"var(--border)"}`,
                    background:sel?"var(--accent)":"transparent", display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:"12px", fontWeight:900, color:sel?"white":"var(--text-muted)", flexShrink:0 }}>{key}</span>
                  {val}
                </button>
              );
            })}
          </div>
          <div style={{ display:"flex", gap:"10px" }}>
            <button className="btn btn-secondary" onClick={() => setCurrent(c=>Math.max(0,c-1))} disabled={current===0}>← Prev</button>
            {current < questions.length-1
              ? <button className="btn btn-primary" onClick={() => setCurrent(c=>c+1)}>Next →</button>
              : <button className="btn btn-primary" onClick={submitChallenge}>✅ Submit</button>}
          </div>
        </div>
      </div>
    );
  }

  // ── DONE SCREEN ─────────────────────────────────────────────────────────────
  if (phase === "done" && result) {
    const grade = result.score>=90?"🥇":result.score>=75?"🥈":result.score>=50?"🥉":"💪";
    const leaderboard = (myChallenge?.participants||[]).filter(p=>p.score!==null).sort((a,b)=>b.score-a.score);
    return (
      <div style={{ padding:"24px", overflowY:"auto", maxHeight:"100vh" }}>
        <div className="card fade-in" style={{ textAlign:"center", marginBottom:"20px", padding:"32px",
          background:"linear-gradient(135deg,rgba(59,130,246,0.1),rgba(99,102,241,0.05))", borderColor:"rgba(59,130,246,0.3)" }}>
          <div style={{ fontSize:"60px", marginBottom:"8px" }}>{grade}</div>
          <div style={{ fontSize:"48px", fontWeight:900, color:"var(--accent)", marginBottom:"4px" }}>{result.score}%</div>
          <div style={{ fontSize:"14px", color:"var(--text-muted)" }}>{result.correct}/{result.total} correct</div>
          <button onClick={() => shareChallenge(myChallenge)} className="btn btn-primary" style={{ marginTop:"16px", justifyContent:"center" }}>
            📤 Share on WhatsApp
          </button>
          {shareMsg && <div style={{ marginTop:"8px", fontSize:"12px", color:"#10b981", fontWeight:700 }}>{shareMsg}</div>}
        </div>

        <div className="card fade-in" style={{ marginBottom:"16px" }}>
          <h3 style={{ fontSize:"14px", fontWeight:800, marginBottom:"12px" }}>🏆 Leaderboard</h3>
          {leaderboard.map((p, i) => (
            <div key={p.userId} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 0",
              borderBottom:"1px solid var(--border)" }}>
              <span style={{ fontSize:"20px" }}>{["🥇","🥈","🥉"][i]||"⭐"}</span>
              <span style={{ flex:1, fontWeight:p.userId===user.id?800:400 }}>{p.name} {p.userId===user.id&&"(You)"}</span>
              <span style={{ fontWeight:900, color:"var(--accent)" }}>{p.score}%</span>
            </div>
          ))}
          {leaderboard.length === 1 && <p style={{ color:"var(--text-muted)", fontSize:"13px", marginTop:"8px" }}>Abhi sirf tumne attempt kiya — share karo! 📱</p>}
        </div>

        <button className="btn btn-secondary" onClick={() => { setPhase("lobby"); setTab("active"); }} style={{ justifyContent:"center", width:"100%" }}>
          ← Back to Challenges
        </button>
      </div>
    );
  }

  // ── MAIN SCREEN ─────────────────────────────────────────────────────────────
  return (
    <div style={{ padding:"24px", overflowY:"auto", maxHeight:"100vh" }}>
      <div style={{ marginBottom:"20px" }}>
        <h1 style={{ fontSize:"22px", fontWeight:900, marginBottom:"4px" }}>⚔️ Peer Challenge</h1>
        <p style={{ color:"var(--text-secondary)", fontSize:"13px" }}>Friends ko challenge karo — score beat karo!</p>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"4px", background:"var(--bg-secondary)", borderRadius:"10px", padding:"4px", marginBottom:"20px", width:"fit-content" }}>
        {[["create","➕ Create"],["join","🔑 Join"],["active","📋 My Challenges"]].map(([id,l]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:"7px 16px", borderRadius:"8px", border:"none",
            background:tab===id?"var(--accent)":"transparent", color:tab===id?"white":"var(--text-muted)",
            fontWeight:700, fontSize:"12px", fontFamily:"var(--font-main)", cursor:"pointer", transition:"all 0.15s" }}>{l}</button>
        ))}
      </div>

      {/* CREATE */}
      {tab === "create" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
          <div className="card">
            <h3 style={{ fontSize:"14px", fontWeight:800, marginBottom:"12px" }}>📚 Subject</h3>
            <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
              {subjects.map(s => (
                <button key={s} onClick={() => setSubject(s)}
                  style={{ padding:"7px 16px", borderRadius:"8px", border:`1px solid ${subject===s?"var(--accent)":"var(--border)"}`,
                    background:subject===s?"var(--accent-glow)":"var(--bg-secondary)",
                    color:subject===s?"var(--accent)":"var(--text-secondary)",
                    cursor:"pointer", fontWeight:700, fontSize:"12px", fontFamily:"var(--font-main)" }}>{s}</button>
              ))}
            </div>
          </div>

          <div className="card" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
            <div>
              <label style={{ fontSize:"12px", fontWeight:700, display:"block", marginBottom:"6px" }}>❓ Questions</label>
              {[5,10,15,20].map(n => (
                <button key={n} onClick={() => setQCount(n)}
                  style={{ marginRight:"6px", padding:"5px 12px", borderRadius:"6px",
                    border:`1px solid ${qCount===n?"var(--accent)":"var(--border)"}`,
                    background:qCount===n?"var(--accent-glow)":"var(--bg-secondary)",
                    color:qCount===n?"var(--accent)":"var(--text-secondary)",
                    cursor:"pointer", fontWeight:700, fontSize:"12px", fontFamily:"var(--font-main)" }}>{n}</button>
              ))}
            </div>
            <div>
              <label style={{ fontSize:"12px", fontWeight:700, display:"block", marginBottom:"6px" }}>⏱️ Time (min)</label>
              {[5,10,15,30].map(n => (
                <button key={n} onClick={() => setTimeLimit(n)}
                  style={{ marginRight:"6px", padding:"5px 12px", borderRadius:"6px",
                    border:`1px solid ${timeLimit===n?"var(--accent)":"var(--border)"}`,
                    background:timeLimit===n?"var(--accent-glow)":"var(--bg-secondary)",
                    color:timeLimit===n?"var(--accent)":"var(--text-secondary)",
                    cursor:"pointer", fontWeight:700, fontSize:"12px", fontFamily:"var(--font-main)" }}>{n}</button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" onClick={createChallenge} disabled={!subject || creating}
            style={{ justifyContent:"center", padding:"14px", fontSize:"15px" }}>
            {creating ? <><div className="loader" style={{width:"16px",height:"16px"}}/> Questions Generate Ho Rahe Hain...</>
              : "⚔️ Challenge Create Karo"}
          </button>
        </div>
      )}

      {/* JOIN */}
      {tab === "join" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
          <div className="card">
            <h3 style={{ fontSize:"14px", fontWeight:800, marginBottom:"12px" }}>🔑 Challenge Code Enter Karo</h3>
            <p style={{ fontSize:"13px", color:"var(--text-secondary)", marginBottom:"12px" }}>
              Friend ne share kiya hoga — WhatsApp ya chat se code lo
            </p>
            <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Jaise: ABC123"
              maxLength={6}
              style={{ width:"100%", padding:"14px", borderRadius:"10px", border:"2px solid var(--border)",
                background:"var(--bg-secondary)", color:"var(--text-primary)", fontSize:"22px",
                fontWeight:900, fontFamily:"monospace", textAlign:"center", outline:"none",
                letterSpacing:"0.3em", boxSizing:"border-box",
                borderColor: joinCode.length===6?"var(--accent)":"var(--border)" }}/>
            <button className="btn btn-primary" onClick={joinChallenge} disabled={joinCode.length !== 6}
              style={{ marginTop:"12px", width:"100%", justifyContent:"center", padding:"12px" }}>
              🚀 Challenge Accept Karo
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE */}
      {tab === "active" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
          {challenges.length === 0 ? (
            <div className="card" style={{ textAlign:"center", padding:"40px" }}>
              <div style={{ fontSize:"40px", marginBottom:"12px" }}>⚔️</div>
              <p style={{ color:"var(--text-muted)" }}>Koi challenge nahi! Create karo ya friend ka code join karo.</p>
            </div>
          ) : challenges.map(ch => {
            const myPart = ch.participants?.find(p => p.userId === user.id);
            const completed = myPart?.score !== null && myPart?.score !== undefined;
            const others = ch.participants?.filter(p => p.userId !== user.id) || [];
            return (
              <div key={ch.id} className="card fade-in">
                <div style={{ display:"flex", alignItems:"flex-start", gap:"12px" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:"14px", marginBottom:"4px" }}>
                      {ch.creatorId === user.id ? "⚔️ Tumhara Challenge" : `⚔️ ${ch.creatorName} ka Challenge`}
                    </div>
                    <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", marginBottom:"8px" }}>
                      <span style={{ fontSize:"11px", padding:"3px 8px", borderRadius:"20px", background:"var(--bg-secondary)", color:"var(--text-muted)", fontWeight:700 }}>
                        📚 {ch.subject}
                      </span>
                      <span style={{ fontSize:"11px", padding:"3px 8px", borderRadius:"20px", background:"var(--bg-secondary)", color:"var(--text-muted)", fontWeight:700 }}>
                        ❓ {ch.questions?.length} Qs
                      </span>
                      <span style={{ fontSize:"11px", padding:"3px 8px", borderRadius:"20px", background:"var(--bg-secondary)", color:"var(--text-muted)", fontWeight:700 }}>
                        ⏱️ {ch.timeLimit} min
                      </span>
                      <span style={{ fontSize:"12px", padding:"3px 10px", borderRadius:"20px",
                        background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)",
                        color:"#fbbf24", fontWeight:900, fontFamily:"monospace", letterSpacing:"0.1em" }}>
                        🔑 {ch.code}
                      </span>
                    </div>
                    {others.length > 0 && (
                      <div style={{ fontSize:"12px", color:"var(--text-muted)" }}>
                        👥 {others.map(p => `${p.name}${p.score!==null?` (${p.score}%)`:" (pending"}`).join(", ")}
                      </div>
                    )}
                  </div>
                  {completed && (
                    <div style={{ textAlign:"center", minWidth:"50px" }}>
                      <div style={{ fontSize:"22px", fontWeight:900, color:"var(--accent)" }}>{myPart.score}%</div>
                      <div style={{ fontSize:"9px", color:"var(--text-muted)", fontWeight:700 }}>YOUR SCORE</div>
                    </div>
                  )}
                </div>
                <div style={{ display:"flex", gap:"8px", marginTop:"10px" }}>
                  {!completed && (
                    <button className="btn btn-primary" onClick={() => startPlaying(ch)} style={{ flex:1, justifyContent:"center", fontSize:"13px" }}>
                      ▶️ {ch.creatorId===user.id ? "Play Now" : "Accept Challenge"}
                    </button>
                  )}
                  <button onClick={() => shareChallenge(ch)} className="btn btn-secondary" style={{ fontSize:"12px", padding:"8px 14px" }}>
                    📤 Share
                  </button>
                  {completed && (
                    <button onClick={() => { setMyChal(ch); setResult({ score:myPart.score, correct:Math.round(myPart.score/100*ch.questions.length), total:ch.questions.length }); setPhase("done"); }}
                      className="btn btn-secondary" style={{ fontSize:"12px" }}>
                      📊 Results
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {shareMsg && (
        <div style={{ position:"fixed", bottom:"80px", left:"50%", transform:"translateX(-50%)", padding:"12px 20px",
          background:"rgba(16,185,129,0.9)", borderRadius:"30px", color:"white", fontWeight:700, fontSize:"13px",
          boxShadow:"0 4px 20px rgba(0,0,0,0.3)" }}>
          {shareMsg}
        </div>
      )}
    </div>
  );
}
