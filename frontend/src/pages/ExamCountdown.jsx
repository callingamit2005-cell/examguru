import React, { useState, useEffect } from "react";
import { useUser } from "../hooks/useUser";

const EXAM_DATES = {
  JEE:       [{ name:"JEE Main Session 1", date:"2026-01-22" }, { name:"JEE Main Session 2", date:"2026-04-02" }, { name:"JEE Advanced", date:"2026-05-24" }],
  NEET:      [{ name:"NEET UG 2026", date:"2026-05-03" }],
  UPSC:      [{ name:"UPSC Prelims 2026", date:"2026-05-24" }, { name:"UPSC Mains 2026", date:"2026-09-20" }],
  UP_PCS:    [{ name:"UP PCS Pre 2026", date:"2026-06-14" }],
  SSC_CGL:   [{ name:"SSC CGL Tier 1", date:"2026-07-01" }],
  SSC_CHSL:  [{ name:"SSC CHSL Tier 1", date:"2026-06-01" }],
  RRB_NTPC:  [{ name:"RRB NTPC CBT 1", date:"2026-03-15" }],
  IBPS_PO:   [{ name:"IBPS PO Prelims", date:"2026-10-10" }],
  default:   [{ name:"Your Exam", date:"2026-12-31" }],
};

const PHASES = [
  { pct:100, label:"Foundation Phase", color:"#3b82f6", desc:"Basics aur NCERT complete karo" },
  { pct:70,  label:"Practice Phase",   color:"#10b981", desc:"Previous year papers + mock tests" },
  { pct:40,  label:"Revision Phase",   color:"#f59e0b", desc:"Weak topics focus + formula revision" },
  { pct:15,  label:"Final Sprint",     color:"#ef4444", desc:"Daily tests + last minute revision" },
  { pct:5,   label:"Exam Week",        color:"#8b5cf6", desc:"Sirf revision, stress-free raho" },
];

function daysLeft(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / (1000*60*60*24)));
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" });
}

export default function ExamCountdown() {
  const { user } = useUser();
  const [customDate, setCustomDate] = useState("");
  const [customName, setCustomName] = useState("");
  const [saved, setSaved] = useState([]);
  const [tick, setTick] = useState(0);

  const examType = user?.examTarget || "default";
  const examDates = EXAM_DATES[examType] || EXAM_DATES.default;

  useEffect(() => {
    const s = JSON.parse(localStorage.getItem("examguru_custom_exams") || "[]");
    setSaved(s);
    const timer = setInterval(() => setTick(t => t+1), 60000); // refresh every minute
    return () => clearInterval(timer);
  }, []);

  const addCustom = () => {
    if (!customDate || !customName) return;
    const updated = [...saved, { name: customName, date: customDate, custom: true }];
    setSaved(updated);
    localStorage.setItem("examguru_custom_exams", JSON.stringify(updated));
    setCustomDate(""); setCustomName("");
  };

  const removeCustom = (i) => {
    const updated = saved.filter((_,idx) => idx !== i);
    setSaved(updated);
    localStorage.setItem("examguru_custom_exams", JSON.stringify(updated));
  };

  const allExams = [...examDates, ...saved].filter(e => daysLeft(e.date) >= 0);

  const nearestExam = allExams.sort((a,b) => new Date(a.date)-new Date(b.date))[0];
  const mainDays = nearestExam ? daysLeft(nearestExam.date) : 0;
  const totalDays = 365;
  const pctLeft = Math.round((mainDays / totalDays) * 100);
  const currentPhase = PHASES.find(p => pctLeft >= p.pct) || PHASES[PHASES.length-1];

  // Live countdown
  const [liveTime, setLiveTime] = useState({ h:0, m:0, s:0 });
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const target = nearestExam ? new Date(nearestExam.date + "T00:00:00") : new Date();
      const diff = Math.max(0, target - now);
      setLiveTime({
        d: Math.floor(diff / (1000*60*60*24)),
        h: Math.floor((diff % (1000*60*60*24)) / (1000*60*60)),
        m: Math.floor((diff % (1000*60*60)) / (1000*60)),
        s: Math.floor((diff % (1000*60)) / 1000),
      });
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [nearestExam]);

  return (
    <div style={{ padding:"24px", overflowY:"auto", maxHeight:"100vh" }}>
      <div style={{ marginBottom:"20px" }}>
        <h1 style={{ fontSize:"22px", fontWeight:900, marginBottom:"4px" }}>⏳ Exam Countdown</h1>
        <p style={{ color:"var(--text-secondary)", fontSize:"13px" }}>Time dekho — plan karo — qualify karo!</p>
      </div>

      {/* Main countdown */}
      {nearestExam && (
        <div className="card fade-in" style={{ marginBottom:"20px", textAlign:"center", padding:"28px",
          background:"linear-gradient(135deg,rgba(59,130,246,0.1),rgba(99,102,241,0.05))",
          borderColor:"rgba(59,130,246,0.3)" }}>
          <div style={{ fontSize:"13px", fontWeight:800, color:"var(--accent)", marginBottom:"8px" }}>
            🎯 Next Exam: {nearestExam.name}
          </div>
          <div style={{ fontSize:"12px", color:"var(--text-muted)", marginBottom:"16px" }}>
            {formatDate(nearestExam.date)}
          </div>

          {/* Live digital countdown */}
          <div style={{ display:"flex", justifyContent:"center", gap:"12px", marginBottom:"16px" }}>
            {[["d","Days"],["h","Hours"],["m","Minutes"],["s","Seconds"]].map(([k,l]) => (
              <div key={k} style={{ textAlign:"center", minWidth:"60px" }}>
                <div style={{ fontSize:"36px", fontWeight:900, color:"white",
                  background:"rgba(255,255,255,0.08)", borderRadius:"12px", padding:"8px 12px",
                  border:"1px solid rgba(255,255,255,0.1)", fontFamily:"monospace",
                  minWidth:"60px", display:"inline-block" }}>
                  {String(liveTime[k]||0).padStart(2,"0")}
                </div>
                <div style={{ fontSize:"10px", color:"var(--text-muted)", marginTop:"4px", fontWeight:700 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Progress ring */}
          <div style={{ display:"flex", alignItems:"center", gap:"16px", background:"var(--bg-secondary)", borderRadius:"10px", padding:"12px 16px" }}>
            <div style={{ flex:1, height:"8px", background:"rgba(255,255,255,0.1)", borderRadius:"4px", overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${100-pctLeft}%`, background:`linear-gradient(90deg,${currentPhase.color},${currentPhase.color}aa)`, borderRadius:"4px", transition:"width 1s" }}/>
            </div>
            <div style={{ fontSize:"11px", fontWeight:800, color:currentPhase.color, flexShrink:0 }}>
              {Math.round(100-pctLeft)}% done
            </div>
          </div>
        </div>
      )}

      {/* Current Phase */}
      {nearestExam && (
        <div className="card fade-in" style={{ marginBottom:"16px",
          background:`${currentPhase.color}10`, borderColor:`${currentPhase.color}35` }}>
          <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <div style={{ width:"44px", height:"44px", borderRadius:"12px",
              background:`${currentPhase.color}20`, border:`1px solid ${currentPhase.color}40`,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>
              📍
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:"14px", color:currentPhase.color }}>{currentPhase.label}</div>
              <div style={{ fontSize:"12px", color:"var(--text-secondary)" }}>{currentPhase.desc}</div>
            </div>
          </div>
        </div>
      )}

      {/* All exams */}
      <div className="card" style={{ marginBottom:"16px" }}>
        <div style={{ fontSize:"14px", fontWeight:800, marginBottom:"14px" }}>📅 Upcoming Exams</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {allExams.sort((a,b) => new Date(a.date)-new Date(b.date)).map((exam, i) => {
            const d = daysLeft(exam.date);
            const color = d < 30 ? "#ef4444" : d < 90 ? "#f59e0b" : "#10b981";
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px 14px",
                borderRadius:"10px", background:"var(--bg-secondary)", border:"1px solid var(--border)" }}>
                <div style={{ textAlign:"center", minWidth:"52px" }}>
                  <div style={{ fontSize:"22px", fontWeight:900, color }}>{d}</div>
                  <div style={{ fontSize:"9px", color, fontWeight:700 }}>DAYS</div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:"13px" }}>{exam.name}</div>
                  <div style={{ fontSize:"11px", color:"var(--text-muted)" }}>{formatDate(exam.date)}</div>
                </div>
                {exam.custom && (
                  <button onClick={() => removeCustom(saved.indexOf(exam))}
                    style={{ padding:"4px 8px", borderRadius:"6px", border:"1px solid rgba(239,68,68,0.3)",
                      background:"transparent", color:"#f87171", cursor:"pointer", fontSize:"12px", fontFamily:"var(--font-main)" }}>
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add custom exam */}
      <div className="card">
        <div style={{ fontSize:"14px", fontWeight:800, marginBottom:"12px" }}>➕ Custom Exam Add Karo</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          <input value={customName} onChange={e => setCustomName(e.target.value)}
            placeholder="Exam ka naam (jaise: Board Exam 2026)"
            style={{ padding:"10px 14px", borderRadius:"8px", border:"1px solid var(--border)",
              background:"var(--bg-secondary)", color:"var(--text-primary)", fontSize:"13px",
              fontFamily:"var(--font-main)", outline:"none" }}/>
          <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)}
            min={new Date().toISOString().slice(0,10)}
            style={{ padding:"10px 14px", borderRadius:"8px", border:"1px solid var(--border)",
              background:"var(--bg-secondary)", color:"var(--text-primary)", fontSize:"13px",
              fontFamily:"var(--font-main)", outline:"none" }}/>
          <button className="btn btn-primary" onClick={addCustom} disabled={!customName||!customDate}
            style={{ justifyContent:"center" }}>
            ➕ Add Exam
          </button>
        </div>
      </div>
    </div>
  );
}
