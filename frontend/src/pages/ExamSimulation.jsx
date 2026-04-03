import React, { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "../hooks/useUser";
import { testAPI } from "../utils/api";

const EXAM_CONFIGS = {
  JEE:      { total:90, time:180, neg:-1, pass:4, sections:["Physics (30)","Chemistry (30)","Maths (30)"] },
  NEET:     { total:180, time:200, neg:-1, pass:4, sections:["Physics (45)","Chemistry (45)","Biology (90)"] },
  UPSC:     { total:100, time:120, neg:-0.33, pass:2, sections:["GS (100)"] },
  UP_PCS:   { total:150, time:120, neg:-0.33, pass:2, sections:["GS-I (75)","GS-II (75)"] },
  SSC_CGL:  { total:100, time:60, neg:-0.5, pass:2, sections:["General (100)"] },
  SSC_CHSL: { total:100, time:60, neg:-0.5, pass:2, sections:["General (100)"] },
  CLASS_10: { total:40, time:90, neg:0, pass:1, sections:["Subject (40)"] },
  CLASS_12_SCI: { total:70, time:180, neg:0, pass:1, sections:["Subject (70)"] },
  default:  { total:50, time:60, neg:0, pass:2, sections:["General (50)"] },
};

export default function ExamSimulation() {
  const { user } = useUser();
  const [phase, setPhase] = useState("setup"); // setup | loading | exam | result
  const [subject, setSubject] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});   // marked for review
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const timerRef = useRef(null);

  const examTarget = user?.examTarget || "default";
  const cfg = EXAM_CONFIGS[examTarget] || EXAM_CONFIGS.default;

  const SUBJECTS = {
    JEE:["Physics","Chemistry","Mathematics"],
    NEET:["Physics","Chemistry","Biology"],
    UPSC:["History","Geography","Polity","Economy","Current Affairs"],
    UP_PCS:["History","Polity","Economy","Geography"],
    SSC_CGL:["General Intelligence","General Awareness","Quantitative Aptitude","English"],
    SSC_CHSL:["General Awareness","Quantitative Aptitude","English"],
    CLASS_10:["Mathematics","Science","Social Science"],
    CLASS_12_SCI:["Physics","Chemistry","Mathematics","Biology"],
    default:["General"]
  };
  const subjects = SUBJECTS[examTarget] || SUBJECTS.default;

  // Timer
  useEffect(() => {
    if (phase !== "exam") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); submitExam(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const startExam = async () => {
    if (!subject) return;
    setLoading(true);
    setPhase("loading");
    try {
      const res = await testAPI.generate({
        userId: user.id, subject,
        examType: examTarget, count: Math.min(cfg.total, 30)
      });
      const qs = res.data.questions || [];
      setQuestions(qs);
      setAnswers({});
      setMarked({});
      setCurrent(0);
      setTimeLeft(cfg.time * 60);
      setPhase("exam");
    } catch {
      setPhase("setup");
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = useCallback((qi, opt) => {
    setAnswers(prev => {
      if (prev[qi] === opt) {
        const n = {...prev}; delete n[qi]; return n;
      }
      return {...prev, [qi]: opt};
    });
  }, []);

  const toggleMark = useCallback((qi) => {
    setMarked(prev => ({...prev, [qi]: !prev[qi]}));
  }, []);

  const submitExam = useCallback(() => {
    clearInterval(timerRef.current);
    let correct = 0, wrong = 0, skipped = 0;
    questions.forEach((q, i) => {
      if (!answers[i]) { skipped++; return; }
      if (answers[i] === q.correctAnswer) correct++;
      else wrong++;
    });
    const score = correct * cfg.pass + wrong * cfg.neg;
    const maxScore = questions.length * cfg.pass;
    setResult({ correct, wrong, skipped, score: Math.max(0, score), maxScore, pct: Math.round((Math.max(0,score)/maxScore)*100) });
    setPhase("result");
  }, [questions, answers, cfg]);

  const formatTime = (s) => `${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const timeColor = timeLeft < 300 ? "#ef4444" : timeLeft < 600 ? "#f59e0b" : "#10b981";

  const stats = {
    answered: Object.keys(answers).length,
    markedCount: Object.values(marked).filter(Boolean).length,
    notVisited: questions.length - Object.keys(answers).length
  };

  // ── SETUP SCREEN ─────────────────────────────────────────────────────────────
  if (phase === "setup") return (
    <div style={{ padding:"24px", overflowY:"auto", maxHeight:"100vh" }}>
      <div style={{ marginBottom:"24px" }}>
        <h1 style={{ fontSize:"22px", fontWeight:900, marginBottom:"4px" }}>⏱️ Exam Simulation</h1>
        <p style={{ color:"var(--text-secondary)", fontSize:"13px" }}>Real exam experience — timer, negative marking, review system</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"24px" }}>
        {[
          { icon:"📝", label:"Questions", value:Math.min(cfg.total,30) },
          { icon:"⏱️", label:"Time Limit", value:`${cfg.time} min` },
          { icon:"✅", label:"Correct Marks", value:`+${cfg.pass}` },
          { icon:"❌", label:"Wrong Marks", value:cfg.neg === 0 ? "No negative" : String(cfg.neg) },
        ].map((s,i) => (
          <div key={i} className="card" style={{ textAlign:"center" }}>
            <div style={{ fontSize:"24px", marginBottom:"6px" }}>{s.icon}</div>
            <div style={{ fontSize:"20px", fontWeight:900, color:"var(--accent)" }}>{s.value}</div>
            <div style={{ fontSize:"11px", color:"var(--text-muted)", fontWeight:700 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom:"16px" }}>
        <h3 style={{ fontSize:"14px", fontWeight:800, marginBottom:"12px" }}>📚 Subject Select Karo</h3>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
          {subjects.map(s => (
            <button key={s} onClick={() => setSubject(s)}
              style={{ padding:"8px 18px", borderRadius:"8px", border:`1px solid ${subject===s?"var(--accent)":"var(--border)"}`,
                background: subject===s?"var(--accent-glow)":"var(--bg-secondary)",
                color: subject===s?"var(--accent)":"var(--text-secondary)",
                cursor:"pointer", fontWeight:700, fontSize:"13px", fontFamily:"var(--font-main)", transition:"all 0.15s" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom:"20px", background:"rgba(245,158,11,0.04)", borderColor:"rgba(245,158,11,0.3)" }}>
        <h3 style={{ fontSize:"13px", fontWeight:800, marginBottom:"10px", color:"#fbbf24" }}>⚠️ Exam Rules</h3>
        {[
          `✅ Har sahi answer: +${cfg.pass} marks`,
          `❌ Har galat answer: ${cfg.neg} marks${cfg.neg===0?" (no penalty)":""}`,
          `⏭️ Skip karo bina marks gaye`,
          `🔖 Mark for Review — wapas aao`,
          `⏱️ Time khatam → auto submit`,
          `📊 End mein detailed analysis`,
        ].map((r,i) => <div key={i} style={{ fontSize:"12px", color:"var(--text-secondary)", padding:"4px 0" }}>{r}</div>)}
      </div>

      <button className="btn btn-primary" onClick={startExam} disabled={!subject || loading}
        style={{ width:"100%", justifyContent:"center", padding:"14px", fontSize:"15px" }}>
        {loading ? <><div className="loader" style={{width:"16px",height:"16px"}}/> Questions Generate Ho Rahe Hain...</>
          : "🚀 Exam Shuru Karo"}
      </button>
    </div>
  );

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (phase === "loading") return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", gap:"16px" }}>
      <div className="loader" style={{ width:"40px", height:"40px" }}/>
      <div style={{ fontSize:"16px", fontWeight:700 }}>Questions Generate Ho Rahe Hain...</div>
      <div style={{ fontSize:"13px", color:"var(--text-muted)" }}>{subject} — {examTarget}</div>
    </div>
  );

  // ── EXAM SCREEN ──────────────────────────────────────────────────────────────
  if (phase === "exam") {
    const q = questions[current];
    if (!q) return null;

    return (
      <div style={{ display:"flex", flexDirection:"column", height:"100vh", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ padding:"12px 16px", background:"var(--bg-secondary)", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:"12px", flexShrink:0 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:"12px", color:"var(--text-muted)", fontWeight:700 }}>{examTarget} — {subject}</div>
            <div style={{ fontSize:"11px", color:"var(--text-muted)" }}>Q {current+1} of {questions.length}</div>
          </div>
          {/* Timer */}
          <div style={{ padding:"8px 16px", borderRadius:"8px", background:`${timeColor}15`, border:`1px solid ${timeColor}40`, textAlign:"center" }}>
            <div style={{ fontSize:"20px", fontWeight:900, color:timeColor, fontFamily:"monospace" }}>{formatTime(timeLeft)}</div>
            <div style={{ fontSize:"9px", color:timeColor, fontWeight:700 }}>TIME LEFT</div>
          </div>
          {/* Stats */}
          <div style={{ display:"flex", gap:"8px" }}>
            {[{l:"✅",v:stats.answered,c:"#10b981"},{l:"🔖",v:stats.markedCount,c:"#f59e0b"},{l:"⭕",v:stats.notVisited,c:"#ef4444"}].map((s,i) => (
              <div key={i} style={{ textAlign:"center", minWidth:"32px" }}>
                <div style={{ fontSize:"14px", fontWeight:900, color:s.c }}>{s.v}</div>
                <div style={{ fontSize:"10px" }}>{s.l}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setSidebarOpen(o => !o)}
            style={{ padding:"7px 12px", borderRadius:"8px", border:"1px solid var(--border)", background:"var(--bg-card)", cursor:"pointer", fontSize:"12px", fontWeight:700, fontFamily:"var(--font-main)", color:"var(--text-secondary)" }}>
            📋 Q List
          </button>
          <button onClick={submitExam}
            style={{ padding:"7px 14px", borderRadius:"8px", border:"1px solid rgba(239,68,68,0.4)", background:"rgba(239,68,68,0.1)", color:"#f87171", cursor:"pointer", fontSize:"12px", fontWeight:800, fontFamily:"var(--font-main)" }}>
            Submit
          </button>
        </div>

        <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
          {/* Main question area */}
          <div style={{ flex:1, overflowY:"auto", padding:"20px" }}>
            {/* Question */}
            <div className="card fade-in" style={{ marginBottom:"16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
                <span style={{ fontSize:"12px", fontWeight:800, color:"var(--accent)" }}>Question {current+1}</span>
                <button onClick={() => toggleMark(current)}
                  style={{ padding:"4px 12px", borderRadius:"20px", border:`1px solid ${marked[current]?"#f59e0b":"var(--border)"}`,
                    background: marked[current]?"rgba(245,158,11,0.1)":"transparent",
                    color: marked[current]?"#fbbf24":"var(--text-muted)",
                    cursor:"pointer", fontSize:"11px", fontWeight:700, fontFamily:"var(--font-main)" }}>
                  🔖 {marked[current]?"Marked":"Mark for Review"}
                </button>
              </div>
              <p style={{ fontSize:"15px", lineHeight:"1.75", color:"var(--text-primary)", margin:0 }}>{q.question}</p>
            </div>

            {/* Options */}
            <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"20px" }}>
              {(q.options || []).map((opt, oi) => {
                const isSelected = answers[current] === opt;
                return (
                  <button key={oi} onClick={() => selectAnswer(current, opt)}
                    style={{ padding:"14px 18px", borderRadius:"10px", border:`1.5px solid ${isSelected?"var(--accent)":"var(--border)"}`,
                      background: isSelected?"var(--accent-glow)":"var(--bg-card)",
                      cursor:"pointer", textAlign:"left", fontSize:"14px", fontWeight: isSelected?700:400,
                      color: isSelected?"var(--accent)":"var(--text-primary)",
                      fontFamily:"var(--font-main)", transition:"all 0.15s",
                      display:"flex", alignItems:"center", gap:"12px" }}>
                    <span style={{ width:"26px", height:"26px", borderRadius:"50%", border:`1.5px solid ${isSelected?"var(--accent)":"var(--border)"}`,
                      background: isSelected?"var(--accent)":"transparent",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:"12px", fontWeight:900, color: isSelected?"white":"var(--text-muted)", flexShrink:0 }}>
                      {["A","B","C","D"][oi]}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div style={{ display:"flex", gap:"10px", justifyContent:"space-between" }}>
              <button className="btn btn-secondary" onClick={() => setCurrent(c => Math.max(0,c-1))} disabled={current===0} style={{ fontSize:"13px" }}>
                ← Previous
              </button>
              <button className="btn btn-secondary" onClick={() => { const n = {...answers}; delete n[current]; setAnswers(n); }} style={{ fontSize:"13px" }}>
                Clear
              </button>
              <button className="btn btn-primary" onClick={() => setCurrent(c => Math.min(questions.length-1,c+1))} disabled={current===questions.length-1} style={{ fontSize:"13px" }}>
                Next →
              </button>
            </div>
          </div>

          {/* Question sidebar */}
          {sidebarOpen && (
            <div style={{ width:"220px", background:"var(--bg-secondary)", borderLeft:"1px solid var(--border)", padding:"14px", overflowY:"auto", flexShrink:0 }}>
              <div style={{ fontSize:"12px", fontWeight:800, color:"var(--text-muted)", marginBottom:"10px" }}>Question Panel</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"6px" }}>
                {questions.map((_,i) => {
                  const isAnswered = answers[i] !== undefined;
                  const isMarked = marked[i];
                  const isCurrent = i === current;
                  const bg = isCurrent?"var(--accent)":isMarked?"#f59e0b":isAnswered?"#10b981":"var(--bg-card)";
                  return (
                    <button key={i} onClick={() => { setCurrent(i); setSidebarOpen(false); }}
                      style={{ width:"36px", height:"36px", borderRadius:"8px", border:`1px solid ${isCurrent?"var(--accent)":"var(--border)"}`,
                        background: bg, color:"white", cursor:"pointer", fontSize:"11px", fontWeight:800,
                        fontFamily:"var(--font-main)" }}>
                      {i+1}
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop:"14px", display:"flex", flexDirection:"column", gap:"6px" }}>
                {[{c:"#10b981",l:"Answered"},{c:"#f59e0b",l:"Marked"},{c:"var(--bg-card)",l:"Not answered"},{c:"var(--accent)",l:"Current"}].map((l,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:"8px", fontSize:"11px", color:"var(--text-muted)" }}>
                    <div style={{ width:"14px", height:"14px", borderRadius:"3px", background:l.c, border:"1px solid var(--border)", flexShrink:0 }}/>
                    {l.l}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── RESULT SCREEN ────────────────────────────────────────────────────────────
  if (phase === "result" && result) {
    const grade = result.pct >= 90?"A+":result.pct >= 75?"A":result.pct >= 60?"B":result.pct >= 45?"C":"D";
    const gradeColor = result.pct >= 75?"#10b981":result.pct >= 45?"#f59e0b":"#ef4444";

    return (
      <div style={{ padding:"24px", overflowY:"auto", maxHeight:"100vh" }}>
        <div className="card fade-in" style={{ textAlign:"center", marginBottom:"20px", padding:"32px", background:`linear-gradient(135deg, ${gradeColor}10, ${gradeColor}05)`, border:`1px solid ${gradeColor}30` }}>
          <div style={{ fontSize:"60px", fontWeight:900, color:gradeColor, marginBottom:"8px" }}>{grade}</div>
          <div style={{ fontSize:"28px", fontWeight:900, marginBottom:"4px" }}>{result.score.toFixed(2)} / {result.maxScore}</div>
          <div style={{ fontSize:"18px", color:"var(--text-secondary)", marginBottom:"16px" }}>{result.pct}% Score</div>
          <div style={{ display:"flex", justifyContent:"center", gap:"24px" }}>
            {[{l:"Correct",v:result.correct,c:"#10b981"},{l:"Wrong",v:result.wrong,c:"#ef4444"},{l:"Skipped",v:result.skipped,c:"#f59e0b"}].map((s,i) => (
              <div key={i} style={{ textAlign:"center" }}>
                <div style={{ fontSize:"24px", fontWeight:900, color:s.c }}>{s.v}</div>
                <div style={{ fontSize:"11px", color:"var(--text-muted)", fontWeight:700 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Answer Review */}
        <div className="card fade-in" style={{ marginBottom:"16px" }}>
          <h3 style={{ fontSize:"15px", fontWeight:800, marginBottom:"14px" }}>📋 Answer Review</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:"10px", maxHeight:"400px", overflowY:"auto" }}>
            {questions.map((q,i) => {
              const ua = answers[i];
              const isCorrect = ua === q.correctAnswer;
              const isSkipped = !ua;
              const c = isSkipped?"#f59e0b":isCorrect?"#10b981":"#ef4444";
              return (
                <div key={i} style={{ padding:"12px 14px", borderRadius:"10px", border:`1px solid ${c}30`, background:`${c}08` }}>
                  <div style={{ display:"flex", gap:"8px", marginBottom:"8px" }}>
                    <span style={{ fontWeight:900, color:c, fontSize:"12px" }}>Q{i+1}</span>
                    <span style={{ fontSize:"12px", color:"var(--text-secondary)", flex:1 }}>{q.question?.slice(0,80)}...</span>
                    <span style={{ fontSize:"11px", fontWeight:800, color:c }}>{isSkipped?"⭕ Skip":isCorrect?"✅ +"+cfg.pass:"❌ "+cfg.neg}</span>
                  </div>
                  {!isSkipped && !isCorrect && (
                    <div style={{ fontSize:"11px", color:"#10b981" }}>✓ Correct: {q.correctAnswer}</div>
                  )}
                  {q.explanation && (
                    <div style={{ fontSize:"11px", color:"var(--text-muted)", marginTop:"4px", fontStyle:"italic" }}>{q.explanation?.slice(0,120)}...</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display:"flex", gap:"10px" }}>
          <button className="btn btn-primary" onClick={() => { setPhase("setup"); setResult(null); }} style={{ flex:1, justifyContent:"center" }}>
            🔄 Dobara Do
          </button>
          <button className="btn btn-secondary" onClick={() => setSubject("")} style={{ flex:1, justifyContent:"center" }}>
            📚 New Subject
          </button>
        </div>
      </div>
    );
  }

  return null;
}
