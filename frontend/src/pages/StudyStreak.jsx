import React, { useState, useEffect } from "react";
import { useUser } from "../hooks/useUser";

const STREAK_KEY = "examguru_streak";
const TASKS_KEY  = "examguru_daily_tasks";

function getStreak() {
  try { return JSON.parse(localStorage.getItem(STREAK_KEY) || "{}"); }
  catch { return {}; }
}
function saveStreak(d) { localStorage.setItem(STREAK_KEY, JSON.stringify(d)); }

function getTasks() {
  try { return JSON.parse(localStorage.getItem(TASKS_KEY) || "[]"); }
  catch { return []; }
}
function saveTasks(d) { localStorage.setItem(TASKS_KEY, JSON.stringify(d)); }

function todayStr() { return new Date().toISOString().slice(0,10); }

const DEFAULT_TASKS = (examType) => [
  { id:1, label:"AI Tutor se 1 concept seekho", icon:"🤖", xp:20, done:false },
  { id:2, label:"1 Mock Test do", icon:"📝", xp:50, done:false },
  { id:3, label:"Weak topics review karo", icon:"⚠️", xp:15, done:false },
  { id:4, label:"1 Doubt Community mein post karo", icon:"💬", xp:10, done:false },
  { id:5, label:"Quick Revision karo (10 min)", icon:"⚡", xp:25, done:false },
];

export default function StudyStreak() {
  const { user } = useUser();
  const [streak, setStreak]   = useState({});
  const [tasks, setTasks]     = useState([]);
  const [todayXP, setTodayXP] = useState(0);
  const [showMotiv, setShowMotiv] = useState(false);
  const [motivMsg, setMotivMsg]   = useState("");

  const examType = user?.examTarget || "JEE";

  useEffect(() => {
    const s = getStreak();
    const today = todayStr();

    // Calculate current streak
    let currentStreak = s.count || 0;
    const lastDate = s.lastDate;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);

    if (lastDate === today) {
      // Already counted today
    } else if (lastDate === yesterday) {
      // Continuing streak
    } else if (lastDate && lastDate < yesterday) {
      // Streak broken
      currentStreak = 0;
    }

    setStreak({ ...s, count: currentStreak });

    // Load or init today's tasks
    const saved = getTasks();
    if (saved.date !== today) {
      const fresh = DEFAULT_TASKS(examType).map(t => ({ ...t, done: false }));
      saveTasks({ date: today, items: fresh });
      setTasks(fresh);
      setTodayXP(0);
    } else {
      setTasks(saved.items || DEFAULT_TASKS(examType));
      setTodayXP((saved.items || []).filter(t => t.done).reduce((a,t) => a+t.xp, 0));
    }
  }, []);

  const toggleTask = (id) => {
    const updated = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    const xp = updated.filter(t => t.done).reduce((a,t) => a+t.xp, 0);
    setTasks(updated);
    setTodayXP(xp);
    saveTasks({ date: todayStr(), items: updated });

    // Check if all done → update streak
    const allDone = updated.every(t => t.done);
    if (allDone) {
      const today = todayStr();
      const s = getStreak();
      if (s.lastDate !== today) {
        const newStreak = { count: (s.count || 0) + 1, lastDate: today, best: Math.max(s.best||0, (s.count||0)+1) };
        saveStreak(newStreak);
        setStreak(newStreak);
        triggerMotiv(newStreak.count);
      }
    }

    // Task complete animation
    if (!tasks.find(t=>t.id===id)?.done) {
      const task = tasks.find(t=>t.id===id);
      setMotivMsg(`+${task?.xp} XP! 🎉`);
      setShowMotiv(true);
      setTimeout(() => setShowMotiv(false), 1500);
    }
  };

  const triggerMotiv = (count) => {
    const msgs = {
      1: "🔥 Pehla din! Journey shuru ho gayi!",
      3: "🎯 3 din! Habit ban rahi hai!",
      7: "⭐ 1 hafte ka streak! Zabardast!",
      14: "🏆 2 hafte! Tum mast ho!",
      30: "👑 30 din! LEGEND!",
    };
    const msg = msgs[count] || `🔥 ${count} din ka streak! Keep going!`;
    setMotivMsg(msg);
    setShowMotiv(true);
    setTimeout(() => setShowMotiv(false), 3000);
  };

  const doneTasks = tasks.filter(t => t.done).length;
  const totalXP   = tasks.reduce((a,t) => a+t.xp, 0);
  const progress  = tasks.length ? (doneTasks / tasks.length) * 100 : 0;

  // Streak calendar (last 7 days)
  const last7 = Array.from({length:7}, (_,i) => {
    const d = new Date(Date.now() - (6-i)*86400000);
    const ds = d.toISOString().slice(0,10);
    const active = streak.lastDate && ds <= streak.lastDate &&
      ds >= new Date(Date.now() - (streak.count||0)*86400000).toISOString().slice(0,10);
    return { label: ["S","M","T","W","T","F","S"][d.getDay()], active, isToday: ds === todayStr() };
  });

  const MOTIVATIONAL = [
    "💪 Aaj ka din zero nahi jaana chahiye!",
    "🎯 Ek step aur — manzil paas hai!",
    "🔥 Consistency is the key to success!",
    "⭐ Har din ek naya concept seekho!",
    "🏆 Future tumhara — aaj mehnat karo!",
  ];
  const dailyQuote = MOTIVATIONAL[new Date().getDay() % MOTIVATIONAL.length];

  return (
    <div style={{ padding:"24px", overflowY:"auto", maxHeight:"100vh" }}>
      <div style={{ marginBottom:"20px" }}>
        <h1 style={{ fontSize:"22px", fontWeight:900, marginBottom:"4px" }}>🔥 Daily Streak</h1>
        <p style={{ color:"var(--text-secondary)", fontSize:"13px" }}>Roz padho — streak banao — topper bano!</p>
      </div>

      {/* Streak + XP */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px", marginBottom:"20px" }}>
        {[
          { icon:"🔥", value: streak.count || 0, label:"Day Streak", color:"#f97316" },
          { icon:"⭐", value: todayXP, label:"Today XP", color:"#fbbf24" },
          { icon:"🏆", value: streak.best || 0, label:"Best Streak", color:"#a78bfa" },
        ].map((s,i) => (
          <div key={i} className="card" style={{ textAlign:"center" }}>
            <div style={{ fontSize:"22px", marginBottom:"4px" }}>{s.icon}</div>
            <div style={{ fontSize:"26px", fontWeight:900, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:"10px", color:"var(--text-muted)", fontWeight:700 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Last 7 days calendar */}
      <div className="card" style={{ marginBottom:"16px" }}>
        <div style={{ fontSize:"12px", fontWeight:800, color:"var(--text-muted)", marginBottom:"12px" }}>📅 Last 7 Days</div>
        <div style={{ display:"flex", justifyContent:"space-between" }}>
          {last7.map((d,i) => (
            <div key={i} style={{ textAlign:"center", flex:1 }}>
              <div style={{ fontSize:"10px", color:"var(--text-muted)", marginBottom:"6px", fontWeight:700 }}>{d.label}</div>
              <div style={{ width:"32px", height:"32px", borderRadius:"8px", margin:"0 auto",
                background: d.active ? "linear-gradient(135deg,#f97316,#ef4444)" : "var(--bg-secondary)",
                border: d.isToday ? "2px solid var(--accent)" : "1px solid var(--border)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"14px" }}>
                {d.active ? "🔥" : d.isToday ? "📍" : ""}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's progress */}
      <div className="card" style={{ marginBottom:"16px", background:"linear-gradient(135deg,rgba(59,130,246,0.05),rgba(99,102,241,0.03))", borderColor:"rgba(59,130,246,0.2)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
          <div style={{ fontSize:"14px", fontWeight:800 }}>🎯 Aaj ka Target</div>
          <div style={{ fontSize:"13px", fontWeight:900, color:"var(--accent)" }}>{doneTasks}/{tasks.length} done</div>
        </div>
        <div style={{ height:"10px", background:"var(--bg-secondary)", borderRadius:"5px", overflow:"hidden", marginBottom:"8px" }}>
          <div style={{ height:"100%", width:`${progress}%`, borderRadius:"5px", transition:"width 0.5s ease",
            background:"linear-gradient(90deg,#3b82f6,#8b5cf6)" }}/>
        </div>
        <div style={{ fontSize:"11px", color:"var(--text-muted)" }}>
          {progress === 100 ? "🎉 Aaj ka target complete! Streak update ho gaya!" : `${Math.round(100-progress)}% baaki — kar sakte ho!`}
        </div>
      </div>

      {/* Daily tasks */}
      <div className="card" style={{ marginBottom:"16px" }}>
        <div style={{ fontSize:"14px", fontWeight:800, marginBottom:"14px" }}>✅ Aaj Ke Tasks</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {tasks.map(task => (
            <div key={task.id} onClick={() => toggleTask(task.id)}
              style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px 14px",
                borderRadius:"10px", cursor:"pointer", transition:"all 0.2s",
                background: task.done ? "rgba(16,185,129,0.08)" : "var(--bg-secondary)",
                border: `1px solid ${task.done ? "rgba(16,185,129,0.3)" : "var(--border)"}` }}>
              <div style={{ width:"22px", height:"22px", borderRadius:"6px", flexShrink:0,
                background: task.done ? "#10b981" : "transparent",
                border: `2px solid ${task.done ? "#10b981" : "var(--border)"}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"13px" }}>
                {task.done && "✓"}
              </div>
              <div style={{ fontSize:"20px", flexShrink:0 }}>{task.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"13px", fontWeight:task.done?600:400,
                  color:task.done?"var(--text-muted)":"var(--text-primary)",
                  textDecoration:task.done?"line-through":"none" }}>{task.label}</div>
              </div>
              <div style={{ fontSize:"11px", fontWeight:800, color:"#fbbf24" }}>+{task.xp} XP</div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily quote */}
      <div className="card fade-in" style={{ textAlign:"center", background:"linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.04))", borderColor:"rgba(99,102,241,0.2)" }}>
        <div style={{ fontSize:"13px", fontStyle:"italic", color:"var(--text-secondary)", lineHeight:"1.7" }}>
          "{dailyQuote}"
        </div>
        <div style={{ fontSize:"11px", color:"var(--text-muted)", marginTop:"6px" }}>— ExamGuru Daily Motivation</div>
      </div>

      {/* Floating XP toast */}
      {showMotiv && (
        <div style={{ position:"fixed", top:"80px", left:"50%", transform:"translateX(-50%)",
          padding:"12px 24px", background:"linear-gradient(135deg,#f97316,#ef4444)",
          borderRadius:"30px", color:"white", fontWeight:900, fontSize:"16px",
          boxShadow:"0 8px 24px rgba(239,68,68,0.4)", zIndex:9999,
          animation:"slideUp 0.3s ease" }}>
          {motivMsg}
        </div>
      )}
    </div>
  );
}
