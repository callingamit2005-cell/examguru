import React, { useState, useEffect, useCallback } from "react";
import { testAPI } from "../utils/api";
import { useUser } from "../hooks/useUser";

// ─── Complete subject mapping for all 67 exam types ─────────────────────────
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

const DIFFICULTIES = ["easy", "medium", "hard", "mixed"];
const GRADE_COLORS = { "A+": "#10b981", A: "#3b82f6", B: "#f59e0b", C: "#f97316", D: "#ef4444" };

export default function TestPage() {
  const { user } = useUser();
  const [phase, setPhase] = useState("setup"); // setup | taking | result
  const [config, setConfig] = useState({ subject: (EXAM_SUBJECTS[user?.examTarget] || ["General Knowledge"])[0], numQuestions: 10, difficulty: "mixed" });
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [error, setError] = useState("");

  const subjects = EXAM_SUBJECTS[user?.examTarget] || ["General Knowledge","Mathematics","Reasoning"];

  useEffect(() => {
    if (phase !== "taking") return;
    const timer = setInterval(() => setTimeElapsed(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const formatTime = (secs) => `${Math.floor(secs / 60).toString().padStart(2, "0")}:${(secs % 60).toString().padStart(2, "0")}`;

  const generateTest = async () => {
    setLoading(true); setError("");
    try {
      const res = await testAPI.generate({ userId: user.id, examType: user.examTarget, ...config });
      setTest(res.data);
      setAnswers({});
      setCurrent(0);
      setTimeElapsed(0);
      setPhase("taking");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const submitTest = useCallback(async () => {
    if (Object.keys(answers).length < test.questions.length) {
      if (!window.confirm(`${test.questions.length - Object.keys(answers).length} questions unanswered hain. Submit karna chahte ho?`)) return;
    }
    setLoading(true); setError("");
    try {
      const res = await testAPI.submit({ testId: test.testId, userId: user.id, userAnswers: answers });
      setResult(res.data);
      setPhase("result");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [answers, test, user]);

  const q = test?.questions[current];
  const answered = Object.keys(answers).length;

  if (phase === "setup") return (
    <div style={{ padding: "32px 28px", maxWidth: "560px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "6px" }}>📝 Mock Test</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "32px" }}>AI-generated questions — bilkul real exam jaisa</p>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>Subject</label>
          <select className="input" value={config.subject} onChange={e => setConfig(p => ({ ...p, subject: e.target.value }))}>
            {subjects.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>
            Questions: <strong style={{ color: "var(--accent)" }}>{config.numQuestions}</strong>
          </label>
          <input type="range" min={5} max={30} step={5} value={config.numQuestions}
            onChange={e => setConfig(p => ({ ...p, numQuestions: Number(e.target.value) }))}
            style={{ width: "100%", accentColor: "var(--accent)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
            <span>5</span><span>30</span>
          </div>
        </div>

        <div>
          <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>Difficulty</label>
          <div style={{ display: "flex", gap: "8px" }}>
            {DIFFICULTIES.map(d => (
              <button key={d} onClick={() => setConfig(p => ({ ...p, difficulty: d }))}
                style={{
                  flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid",
                  borderColor: config.difficulty === d ? "var(--accent)" : "var(--border)",
                  background: config.difficulty === d ? "var(--accent-glow)" : "var(--bg-secondary)",
                  color: config.difficulty === d ? "var(--accent)" : "var(--text-muted)",
                  cursor: "pointer", fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-main)",
                  textTransform: "capitalize", transition: "all 0.15s"
                }}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {error && <div style={{ color: "#f87171", fontSize: "13px" }}>❌ {error}</div>}

        <button className="btn btn-primary" onClick={generateTest} disabled={loading} style={{ justifyContent: "center", padding: "14px" }}>
          {loading ? <><div className="loader" style={{ width: "16px", height: "16px" }} /> Questions generate ho rahe hain...</> : `🚀 Start ${config.numQuestions} Question Test`}
        </button>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>AI 10-30 seconds mein fresh questions banata hai</p>
      </div>
    </div>
  );

  if (phase === "taking" && q) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header */}
      <div style={{ padding: "14px 24px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span className="badge badge-blue">{config.subject}</span>
            <span className="badge badge-yellow">⏱ {formatTime(timeElapsed)}</span>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "20px", fontWeight: 800 }}>{current + 1}<span style={{ color: "var(--text-muted)", fontWeight: 400 }}>/{test.total}</span></div>
        </div>
        <button className="btn btn-primary" onClick={submitTest} disabled={loading} style={{ padding: "8px 16px", fontSize: "13px" }}>
          {loading ? <div className="loader" style={{ width: "14px", height: "14px" }} /> : "Submit Test"}
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: "3px", background: "var(--border)" }}>
        <div style={{ height: "100%", background: "var(--accent)", width: `${((current + 1) / test.total) * 100}%`, transition: "width 0.3s ease" }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        {/* Question */}
        <div className="card fade-in" style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px", display: "flex", gap: "8px" }}>
            <span>Q{current + 1}</span>
            {q.topic && <><span>•</span><span>{q.topic}</span></>}
            {q.difficulty && <span className={`badge badge-${q.difficulty === "easy" ? "green" : q.difficulty === "hard" ? "red" : "yellow"}`}>{q.difficulty}</span>}
          </div>
          <p style={{ fontSize: "16px", fontWeight: 600, lineHeight: "1.6" }}>{q.question}</p>
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
          {Object.entries(q.options).map(([key, value]) => {
            const selected = answers[q.id] === key;
            return (
              <button
                key={key}
                onClick={() => setAnswers(p => ({ ...p, [q.id]: key }))}
                className="fade-in"
                style={{
                  display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 16px",
                  borderRadius: "var(--radius)", border: "1px solid",
                  borderColor: selected ? "var(--accent)" : "var(--border)",
                  background: selected ? "var(--accent-glow)" : "var(--bg-card)",
                  cursor: "pointer", textAlign: "left", width: "100%", transition: "all 0.15s",
                  fontFamily: "var(--font-main)"
                }}
              >
                <span style={{
                  width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: selected ? "var(--accent)" : "var(--bg-secondary)",
                  color: selected ? "white" : "var(--text-muted)", fontSize: "12px", fontWeight: 800,
                  border: selected ? "none" : "1px solid var(--border)"
                }}>{key}</span>
                <span style={{ fontSize: "14px", color: selected ? "var(--accent)" : "var(--text-primary)", lineHeight: "1.5", paddingTop: "2px" }}>{value}</span>
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
          <button className="btn btn-secondary" onClick={() => setCurrent(p => p - 1)} disabled={current === 0}>← Prev</button>
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "center", flex: 1 }}>
            {test.questions.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} style={{
                width: "28px", height: "28px", borderRadius: "6px", border: "1px solid",
                borderColor: i === current ? "var(--accent)" : answers[test.questions[i].id] ? "var(--success)" : "var(--border)",
                background: i === current ? "var(--accent)" : answers[test.questions[i].id] ? "rgba(16,185,129,0.15)" : "var(--bg-card)",
                color: i === current ? "white" : "var(--text-secondary)",
                cursor: "pointer", fontSize: "11px", fontWeight: 700, fontFamily: "var(--font-main)"
              }}>{i + 1}</button>
            ))}
          </div>
          {current < test.total - 1
            ? <button className="btn btn-primary" onClick={() => setCurrent(p => p + 1)}>Next →</button>
            : <button className="btn btn-success" onClick={submitTest} disabled={loading}>Submit ✓</button>
          }
        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)", marginTop: "12px" }}>
          {answered}/{test.total} answered
        </p>
      </div>
    </div>
  );

  if (phase === "result" && result) return (
    <div style={{ padding: "24px", overflowY: "auto", maxHeight: "100vh" }}>
      {/* Score card */}
      <div className="card fade-in" style={{ textAlign: "center", marginBottom: "24px", background: "linear-gradient(135deg, var(--bg-card), var(--bg-card-hover))", border: "1px solid var(--border-light)" }}>
        <div style={{ fontSize: "56px", fontWeight: 900, color: GRADE_COLORS[result.grade] || "var(--accent)", marginBottom: "8px", lineHeight: 1 }}>
          {result.grade}
        </div>
        <div style={{ fontSize: "28px", fontWeight: 800, marginBottom: "4px" }}>{result.percentage}%</div>
        <div style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>{result.score}/{result.total} sahi</div>

        <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
          <div><div style={{ fontSize: "20px", fontWeight: 800, color: "var(--success)" }}>{result.score}</div><div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Correct</div></div>
          <div style={{ width: "1px", background: "var(--border)" }} />
          <div><div style={{ fontSize: "20px", fontWeight: 800, color: "var(--danger)" }}>{result.total - result.score}</div><div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Wrong</div></div>
          <div style={{ width: "1px", background: "var(--border)" }} />
          <div><div style={{ fontSize: "20px", fontWeight: 800, color: "var(--warning)" }}>{formatTime(timeElapsed)}</div><div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Time</div></div>
        </div>
      </div>

      {/* Weak areas */}
      {result.weakAreas?.length > 0 && (
        <div className="card fade-in" style={{ marginBottom: "20px", borderColor: "rgba(245,158,11,0.3)" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "10px" }}>🎯 Weak Topics (Practice karo)</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {[...new Set(result.weakAreas.filter(Boolean))].map((t, i) => (
              <span key={i} className="badge badge-yellow">{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Detailed results */}
      <h3 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "14px" }}>📋 Detailed Results</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {result.results.map((r, i) => (
          <div key={i} className="card fade-in" style={{ borderColor: r.isCorrect ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)" }}>
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              <span style={{ fontSize: "18px" }}>{r.isCorrect ? "✅" : "❌"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, lineHeight: "1.5" }}>Q{i + 1}. {r.question}</div>
                {r.topic && <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{r.topic}</div>}
              </div>
            </div>
            <div style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-sm)", padding: "10px", fontSize: "13px" }}>
              {!r.isCorrect && <div style={{ color: "#f87171", marginBottom: "4px" }}>Tumhara answer: <strong>{r.userAnswer ? `(${r.userAnswer}) ${r.options[r.userAnswer]}` : "Not answered"}</strong></div>}
              <div style={{ color: "#34d399" }}>Sahi answer: <strong>({r.correct}) {r.options[r.correct]}</strong></div>
              {r.explanation && <div style={{ color: "var(--text-secondary)", marginTop: "6px", borderTop: "1px solid var(--border)", paddingTop: "6px" }}>💡 {r.explanation}</div>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
        <button className="btn btn-primary" onClick={() => setPhase("setup")} style={{ flex: 1, justifyContent: "center" }}>🔄 Naya Test</button>
      </div>
    </div>
  );

  return null;
}
