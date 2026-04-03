import React, { useState, useEffect } from "react";
import { useUser } from "../hooks/useUser";

const EXAM_DATES_2025_26 = {
  JEE:      [{ name: "JEE Main Session 1", date: "2026-01-22", color: "#3b82f6" },{ name: "JEE Main Session 2", date: "2026-04-02", color: "#6366f1" },{ name: "JEE Advanced", date: "2026-05-24", color: "#8b5cf6" }],
  NEET:     [{ name: "NEET UG 2026", date: "2026-05-03", color: "#10b981" }],
  UPSC:     [{ name: "UPSC Prelims 2026", date: "2026-05-24", color: "#f59e0b" },{ name: "UPSC Mains 2026", date: "2026-09-20", color: "#f97316" }],
  UP_PCS:   [{ name: "UP PCS Prelims 2026", date: "2026-07-12", color: "#8b5cf6" },{ name: "UP PCS Mains 2026", date: "2026-11-15", color: "#7c3aed" }],
  MP_PCS:   [{ name: "MP PCS Prelims 2026", date: "2026-06-21", color: "#06b6d4" }],
  RAS:      [{ name: "RAS Prelims 2026", date: "2026-08-02", color: "#f97316" }],
  BPSC:     [{ name: "BPSC 69th Prelims", date: "2026-05-15", color: "#ec4899" }],
  MPSC:     [{ name: "MPSC Rajyaseva Prelims 2026", date: "2026-06-07", color: "#14b8a6" }],
  SSC_CGL:  [{ name: "SSC CGL Tier 1 2026", date: "2026-07-01", color: "#3b82f6" },{ name: "SSC CGL Tier 2 2026", date: "2026-09-15", color: "#6366f1" }],
  SSC_CHSL: [{ name: "SSC CHSL Tier 1 2026", date: "2026-06-10", color: "#10b981" }],
};

const SUBJECT_TOPICS = {
  JEE: {
    Physics:     ["Mechanics","Thermodynamics","Waves","Optics","Electrostatics","Current Electricity","Magnetism","Modern Physics"],
    Chemistry:   ["Physical Chemistry","Organic Chemistry","Inorganic Chemistry","Chemical Bonding","Equilibrium","Electrochemistry"],
    Mathematics: ["Algebra","Trigonometry","Calculus","Coordinate Geometry","Vectors","Probability","Matrices"],
  },
  NEET: {
    Physics:     ["Mechanics","Thermodynamics","Optics","Modern Physics","Current Electricity"],
    Chemistry:   ["Physical Chemistry","Organic Chemistry","Inorganic Chemistry"],
    Biology:     ["Cell Biology","Genetics","Human Physiology","Plant Biology","Ecology","Evolution"],
  },
  UPSC: {
    History:     ["Ancient India","Medieval India","Modern India","World History","Art & Culture"],
    Geography:   ["Physical Geography","Indian Geography","World Geography","Environment"],
    Polity:      ["Constitution","Governance","Panchayati Raj","International Relations"],
    Economy:     ["Indian Economy","Planning","Agriculture","Industry","Banking"],
    "Science & Technology": ["Space","Defense","IT","Bio-Tech","Environment"],
    "Current Affairs": ["National","International","Economy News","Science News"],
    Ethics:      ["Ethics Theory","Case Studies","Integrity","Aptitude"],
  },
  UP_PCS: {
    History:     ["Ancient India","Medieval India","Modern India","UP History"],
    Geography:   ["Physical Geography","Indian Geography","UP Geography"],
    Polity:      ["Constitution","UP Governance","Panchayati Raj"],
    Economy:     ["Indian Economy","UP Economy","Agriculture"],
    "UP Special":["UP Culture","UP Schemes","UP Current Affairs"],
    Hindi:       ["Grammar","Essay","Letter Writing"],
  },
  MP_PCS: {
    History:     ["Ancient India","Medieval India","MP History"],
    Geography:   ["Physical Geography","MP Geography","Environment"],
    Polity:      ["Constitution","MP Governance"],
    Economy:     ["Indian Economy","MP Economy"],
    "MP Special":["MP Culture","MP Schemes","Tribal Issues"],
    Hindi:       ["Grammar","Essay","Comprehension"],
  },
  RAS: {
    History:     ["Rajasthan History","Ancient India","Modern India"],
    Geography:   ["Rajasthan Geography","Indian Geography"],
    Polity:      ["Constitution","Rajasthan Governance"],
    Economy:     ["Rajasthan Economy","Indian Economy"],
    "Rajasthan Special":["Rajasthani Culture","Desert Ecology","Rajput History"],
    Hindi:       ["Grammar","Essay","Literature"],
  },
  BPSC: {
    History:     ["Bihar History","Ancient India","Modern India","Magadh Empire"],
    Geography:   ["Bihar Geography","Indian Geography"],
    Polity:      ["Constitution","Bihar Governance"],
    Economy:     ["Bihar Economy","Indian Economy"],
    "Bihar Special":["Bihar Culture","Bihar Schemes","Tribal Issues"],
    Hindi:       ["Grammar","Essay","Comprehension"],
  },
  MPSC: {
    History:     ["Maharashtra History","Ancient India","Modern India"],
    Geography:   ["Maharashtra Geography","Indian Geography"],
    Polity:      ["Constitution","Maharashtra Governance"],
    Economy:     ["Maharashtra Economy","Indian Economy"],
    "Maharashtra Special":["Maratha History","Marathi Culture","Maharashtra Schemes"],
    Marathi:     ["Grammar","Essay","Comprehension"],
  },
  SSC_CGL: {
    "General Intelligence":["Reasoning","Coding-Decoding","Blood Relations","Puzzles","Series"],
    "General Awareness":   ["History","Geography","Polity","Economy","Current Affairs","Science"],
    "Quantitative Aptitude":["Number System","Percentage","Profit-Loss","Speed-Time","Geometry","Algebra"],
    "English Language":    ["Grammar","Vocabulary","Comprehension","Error Detection","Synonyms"],
  },
  SSC_CHSL: {
    "General Intelligence":["Reasoning","Coding-Decoding","Blood Relations","Puzzles"],
    "General Awareness":   ["History","Geography","Science","Current Affairs"],
    "Quantitative Aptitude":["Number System","Percentage","Profit-Loss","Basic Geometry"],
    "English Language":    ["Grammar","Vocabulary","Comprehension","Fill in Blanks"],
  },
};

function daysLeft(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr);
  return Math.ceil((target - today) / 86400000);
}

function CountdownCard({ exam, isMain }) {
  const days = daysLeft(exam.date);
  const isPast = days < 0;
  const isUrgent = days <= 30 && days >= 0;
  const isSoon = days <= 90 && days >= 0;

  return (
    <div className="card fade-in" style={{
      border: `1px solid ${isMain ? exam.color + "60" : "var(--border)"}`,
      background: isMain ? `linear-gradient(135deg, ${exam.color}12, ${exam.color}05)` : "var(--bg-card)",
      position: "relative", overflow: "hidden"
    }}>
      {isMain && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: exam.color }} />}
      {isPast && <div style={{ position: "absolute", top: "8px", right: "8px" }}><span className="badge badge-red">Over</span></div>}
      {isUrgent && !isPast && <div style={{ position: "absolute", top: "8px", right: "8px" }}><span className="badge badge-red">⚠️ Urgent</span></div>}

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{
          minWidth: "80px", textAlign: "center", padding: "12px",
          background: isPast ? "var(--bg-secondary)" : `${exam.color}20`,
          borderRadius: "12px", border: `1px solid ${isPast ? "var(--border)" : exam.color + "40"}`
        }}>
          <div style={{ fontSize: "32px", fontWeight: 900, color: isPast ? "var(--text-muted)" : exam.color, lineHeight: 1 }}>
            {isPast ? "✓" : Math.abs(days)}
          </div>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", marginTop: "2px" }}>
            {isPast ? "DONE" : "DAYS"}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: "15px", marginBottom: "4px" }}>{exam.name}</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {new Date(exam.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </div>
          {!isPast && (
            <div style={{ marginTop: "8px", height: "4px", background: "var(--bg-secondary)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: "4px",
                background: isUrgent ? "#ef4444" : isSoon ? "#f59e0b" : exam.color,
                width: `${Math.max(5, Math.min(100, 100 - (days / 365) * 100))}%`,
                transition: "width 1s ease"
              }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function generateStudyPlan(examType, targetDate, weakTopics) {
  const days = daysLeft(targetDate);
  if (days <= 0) return [];

  const subjects = Object.keys(SUBJECT_TOPICS[examType] || {});
  const plan = [];
  const today = new Date(); today.setHours(0,0,0,0);

  // Phase distribution
  const phases = days > 90
    ? [{ name: "Foundation", pct: 0.4, icon: "🏗️", color: "#3b82f6" },
       { name: "Practice",   pct: 0.35, icon: "💪", color: "#8b5cf6" },
       { name: "Revision",   pct: 0.15, icon: "🔄", color: "#f59e0b" },
       { name: "Mock Tests", pct: 0.10, icon: "📝", color: "#ef4444" }]
    : days > 30
    ? [{ name: "Practice",   pct: 0.40, icon: "💪", color: "#8b5cf6" },
       { name: "Revision",   pct: 0.35, icon: "🔄", color: "#f59e0b" },
       { name: "Mock Tests", pct: 0.25, icon: "📝", color: "#ef4444" }]
    : [{ name: "Revision",   pct: 0.50, icon: "🔄", color: "#f59e0b" },
       { name: "Mock Tests", pct: 0.50, icon: "📝", color: "#ef4444" }];

  let dayOffset = 0;
  phases.forEach(phase => {
    const phaseDays = Math.max(1, Math.round(days * phase.pct));
    const daysPerSubject = Math.max(1, Math.floor(phaseDays / subjects.length));

    subjects.forEach((subject, si) => {
      const topics = SUBJECT_TOPICS[examType][subject] || [];
      const isWeak = weakTopics.some(w => w.subject === subject);

      Array.from({ length: daysPerSubject }).forEach((_, di) => {
        const d = new Date(today);
        d.setDate(d.getDate() + dayOffset + si * daysPerSubject + di);
        const topic = topics[di % topics.length];
        plan.push({
          date: d.toISOString().split("T")[0],
          subject, topic, phase: phase.name,
          phaseIcon: phase.icon, phaseColor: phase.color,
          isWeak, priority: isWeak ? "high" : "normal",
          tasks: [
            phase.name === "Foundation" ? `${topic} ke concepts padho (NCERT)` :
            phase.name === "Practice"   ? `${topic} ke 20 questions solve karo` :
            phase.name === "Revision"   ? `${topic} ka quick revision karo` :
                                          `${topic} ka full mock test do`,
            isWeak ? `⚠️ ${topic} weak hai — extra 30 min do` : null,
            "AI Tutor se doubts poochho"
          ].filter(Boolean)
        });
      });
    });
    dayOffset += phaseDays;
  });

  return plan;
}

export default function StudyPlannerPage() {
  const { user } = useUser();
  const examDates = EXAM_DATES_2025_26[user?.examTarget] || [];
  const [selectedExam, setSelectedExam] = useState(examDates[0]);
  const [customDate, setCustomDate] = useState("");
  const [plan, setPlan] = useState([]);
  const [view, setView] = useState("countdown"); // countdown | plan | today
  const [expandedDay, setExpandedDay] = useState(null);

  const weakTopics = JSON.parse(localStorage.getItem(`weak_${user?.id}`) || "[]");

  useEffect(() => {
    if (!selectedExam) return;
    const targetDate = customDate || selectedExam.date;
    const generated = generateStudyPlan(user?.examTarget, targetDate, weakTopics);
    setPlan(generated);
  }, [selectedExam, customDate, user]);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayPlan = plan.filter(p => p.date === todayStr);
  const weekPlan = plan.filter(p => {
    const d = new Date(p.date);
    const today = new Date(); today.setHours(0,0,0,0);
    const diff = Math.ceil((d - today) / 86400000);
    return diff >= 0 && diff <= 6;
  });

  // Group week by date
  const weekByDate = weekPlan.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});

  const phaseStats = plan.reduce((acc, p) => {
    acc[p.phase] = (acc[p.phase] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ padding: "24px", overflowY: "auto", maxHeight: "100vh" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "4px" }}>🗓️ Exam Planner</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>AI-powered study plan — exam date se reverse calculate</p>
      </div>

      {/* Exam selector */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        {examDates.map((exam, i) => (
          <button key={i} onClick={() => { setSelectedExam(exam); setCustomDate(""); }}
            style={{
              padding: "8px 16px", borderRadius: "8px", cursor: "pointer",
              border: `1px solid ${selectedExam?.name === exam.name ? exam.color : "var(--border)"}`,
              background: selectedExam?.name === exam.name ? `${exam.color}20` : "var(--bg-card)",
              color: selectedExam?.name === exam.name ? exam.color : "var(--text-secondary)",
              fontWeight: 700, fontSize: "13px", fontFamily: "var(--font-main)", transition: "all 0.15s"
            }}>
            {exam.name}
          </button>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 700 }}>Custom:</span>
          <input type="date" className="input" style={{ width: "160px", fontSize: "13px" }}
            value={customDate} onChange={e => setCustomDate(e.target.value)} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", background: "var(--bg-secondary)", borderRadius: "10px", padding: "4px", marginBottom: "20px", width: "fit-content" }}>
        {["countdown","today","plan"].map(t => (
          <button key={t} onClick={() => setView(t)} style={{
            padding: "8px 18px", borderRadius: "8px", border: "none",
            background: view === t ? "var(--accent)" : "transparent",
            color: view === t ? "white" : "var(--text-muted)",
            fontWeight: 700, fontSize: "13px", fontFamily: "var(--font-main)",
            cursor: "pointer", transition: "all 0.15s"
          }}>
            {t === "countdown" ? "⏳ Countdown" : t === "today" ? "📅 Aaj" : "🗺️ Full Plan"}
          </button>
        ))}
      </div>

      {/* COUNTDOWN VIEW */}
      {view === "countdown" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Main countdown */}
          {selectedExam && (
            <div className="card fade-in" style={{
              textAlign: "center", padding: "40px 24px",
              background: `linear-gradient(135deg, ${selectedExam.color}15, ${selectedExam.color}05)`,
              border: `1px solid ${selectedExam.color}40`
            }}>
              <div style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 700, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {selectedExam.name}
              </div>
              <div style={{ fontSize: "80px", fontWeight: 900, color: selectedExam.color, lineHeight: 1, marginBottom: "8px" }}>
                {Math.max(0, daysLeft(selectedExam.date))}
              </div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "16px" }}>din baaki hain</div>
              <div style={{ display: "flex", justifyContent: "center", gap: "24px" }}>
                {[
                  ["Weeks", Math.max(0, Math.floor(daysLeft(selectedExam.date) / 7))],
                  ["Hours", Math.max(0, daysLeft(selectedExam.date) * 24)],
                  ["Study Sessions", Math.max(0, daysLeft(selectedExam.date) * 3)],
                ].map(([label, val]) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "22px", fontWeight: 900, color: "var(--text-primary)" }}>{val.toLocaleString()}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All exams */}
          <h3 style={{ fontSize: "15px", fontWeight: 800, marginBottom: "2px" }}>📋 Saare {user?.examTarget} Exams</h3>
          {examDates.map((exam, i) => <CountdownCard key={i} exam={exam} isMain={selectedExam?.name === exam.name} />)}

          {/* Plan summary */}
          {plan.length > 0 && (
            <div className="card fade-in">
              <h3 style={{ fontSize: "15px", fontWeight: 800, marginBottom: "14px" }}>📊 Study Plan Summary</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {Object.entries(phaseStats).map(([phase, days]) => (
                  <div key={phase} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "100px", fontSize: "13px", fontWeight: 700 }}>{phase}</div>
                    <div style={{ flex: 1, height: "8px", background: "var(--bg-secondary)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(days / plan.length) * 100}%`, background: "var(--accent)", borderRadius: "4px" }} />
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 700, width: "60px", textAlign: "right" }}>{days} days</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TODAY VIEW */}
      {view === "today" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {todayPlan.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "48px" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
              <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "8px" }}>Aaj ke liye plan ready nahi!</h3>
              <p style={{ color: "var(--text-secondary)" }}>Pehle ek exam select karo — plan auto generate ho jayega.</p>
            </div>
          ) : (
            <>
              <div className="card fade-in" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.05))", borderColor: "rgba(59,130,246,0.3)" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}>
                  {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                </div>
                <div style={{ fontSize: "20px", fontWeight: 900 }}>Aaj ka Study Plan 📅</div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                  {todayPlan.length} sessions • Est. {todayPlan.length * 2} hours
                </div>
              </div>

              {todayPlan.map((item, i) => (
                <div key={i} className="card fade-in" style={{ animationDelay: `${i * 0.1}s`, borderLeft: `3px solid ${item.phaseColor}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    <div style={{ fontSize: "24px" }}>{item.phaseIcon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: "16px" }}>{item.subject} — {item.topic}</div>
                      <div style={{ fontSize: "12px", color: item.phaseColor, fontWeight: 700 }}>{item.phase}</div>
                    </div>
                    {item.isWeak && <span className="badge badge-yellow">⚠️ Weak Topic</span>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {item.tasks.map((task, ti) => (
                      <div key={ti} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "8px 12px", background: "var(--bg-secondary)", borderRadius: "8px" }}>
                        <span style={{ color: "var(--success)", fontWeight: 800, marginTop: "1px" }}>→</span>
                        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* This week */}
          <h3 style={{ fontSize: "15px", fontWeight: 800, marginTop: "8px" }}>📆 Is Hafte Ka Plan</h3>
          {Object.entries(weekByDate).map(([date, items]) => {
            const isToday = date === todayStr;
            return (
              <div key={date} className="card fade-in" style={{ borderLeft: isToday ? "3px solid var(--accent)" : "3px solid var(--border)" }}>
                <div onClick={() => setExpandedDay(expandedDay === date ? null : date)}
                  style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                  <div style={{
                    minWidth: "50px", textAlign: "center", padding: "8px",
                    background: isToday ? "var(--accent-glow)" : "var(--bg-secondary)", borderRadius: "8px"
                  }}>
                    <div style={{ fontSize: "16px", fontWeight: 900, color: isToday ? "var(--accent)" : "var(--text-primary)" }}>
                      {new Date(date).getDate()}
                    </div>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)" }}>
                      {new Date(date).toLocaleDateString("en-IN", { weekday: "short" }).toUpperCase()}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "14px" }}>
                      {items.map(i => i.subject).join(", ")}
                      {isToday && <span className="badge badge-blue" style={{ marginLeft: "8px", fontSize: "10px" }}>Today</span>}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{items.length} sessions • {items[0]?.phase}</div>
                  </div>
                  <span style={{ color: "var(--text-muted)", fontSize: "16px" }}>{expandedDay === date ? "▲" : "▼"}</span>
                </div>
                {expandedDay === date && (
                  <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {items.map((item, i) => (
                      <div key={i} style={{ padding: "8px 12px", background: "var(--bg-secondary)", borderRadius: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
                        {item.phaseIcon} <strong>{item.subject}:</strong> {item.topic}
                        {item.isWeak && " ⚠️"}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FULL PLAN VIEW */}
      {view === "plan" && (
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "16px" }}>
            Total {plan.length} study sessions — {selectedExam?.name} tak
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {Object.entries(plan.slice(0, 60).reduce((acc, item) => {
              if (!acc[item.date]) acc[item.date] = [];
              acc[item.date].push(item);
              return acc;
            }, {})).map(([date, items]) => {
              const isToday = date === todayStr;
              const isPast = new Date(date) < new Date(new Date().setHours(0,0,0,0));
              return (
                <div key={date} style={{
                  display: "flex", gap: "12px", alignItems: "center",
                  padding: "10px 14px", borderRadius: "8px",
                  background: isToday ? "rgba(59,130,246,0.08)" : "var(--bg-card)",
                  border: `1px solid ${isToday ? "rgba(59,130,246,0.3)" : "var(--border)"}`,
                  opacity: isPast ? 0.5 : 1
                }}>
                  <div style={{ minWidth: "80px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 700 }}>
                    {new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    {isToday && <div style={{ color: "var(--accent)", fontSize: "10px" }}>TODAY</div>}
                  </div>
                  <div style={{ display: "flex", gap: "8px", flex: 1, flexWrap: "wrap" }}>
                    {items.map((item, i) => (
                      <span key={i} style={{
                        padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
                        background: `${item.phaseColor}20`, color: item.phaseColor,
                        border: `1px solid ${item.phaseColor}40`
                      }}>
                        {item.phaseIcon} {item.subject}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{items[0]?.phase}</div>
                </div>
              );
            })}
            {plan.length > 60 && (
              <div style={{ textAlign: "center", padding: "16px", color: "var(--text-muted)", fontSize: "13px" }}>
                ...aur {plan.length - 60} din ka plan ready hai
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
