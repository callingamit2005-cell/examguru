import React, { useState, useEffect } from "react";
import { useUser } from "../hooks/useUser";
import { useAppData } from "../hooks/useAppData";

// ─── EXPANDED BADGES — 6 categories, 40+ badges ───────────────────────────────
const BADGE_CATEGORIES = [
  {
    cat: "🚀 Getting Started",
    badges: [
      { id:"first_chat",      icon:"💬", name:"Pehla Sawaal",       desc:"Pehli baar AI se poochha",          xp:50   },
      { id:"first_test",      icon:"📝", name:"Test Warrior",        desc:"Pehla mock test diya",              xp:100  },
      { id:"first_scan",      icon:"📸", name:"Scanner Pro",         desc:"Photo scanner use kiya",            xp:75   },
      { id:"first_voice",     icon:"🎙️", name:"Voice Student",      desc:"Voice class attend ki",             xp:75   },
      { id:"first_challenge", icon:"⚔️", name:"Challenger",          desc:"Pehla peer challenge kiya",         xp:100  },
      { id:"first_ncert",     icon:"📖", name:"NCERT Explorer",      desc:"NCERT practice shuru ki",           xp:100  },
    ]
  },
  {
    cat: "📚 Learning Milestones",
    badges: [
      { id:"questions_10",    icon:"🌱", name:"Curious Beginner",    desc:"10 sawaal poochhe",                 xp:100  },
      { id:"questions_50",    icon:"🧠", name:"Curious Mind",        desc:"50 sawaal poochhe",                 xp:200  },
      { id:"questions_100",   icon:"🔬", name:"Research Scholar",    desc:"100 sawaal poochhe",                xp:400  },
      { id:"questions_500",   icon:"🎓", name:"Knowledge Seeker",    desc:"500 sawaal poochhe",                xp:1000 },
      { id:"all_subjects",    icon:"📚", name:"All Rounder",         desc:"5+ subjects mein questions",        xp:300  },
      { id:"doubt_share",     icon:"💡", name:"Doubt Sharer",        desc:"Community mein doubt share kiya",   xp:75   },
      { id:"group_study",     icon:"👥", name:"Team Player",         desc:"Group study room join kiya",        xp:100  },
      { id:"report_gen",      icon:"📊", name:"Analyst",             desc:"AI progress report generate kiya", xp:100  },
    ]
  },
  {
    cat: "🏆 Test Performance",
    badges: [
      { id:"tests_5",         icon:"🥈", name:"Test Enthusiast",     desc:"5 tests complete kiye",             xp:200  },
      { id:"tests_10",        icon:"🥇", name:"Test Machine",        desc:"10 tests complete kiye",            xp:300  },
      { id:"tests_25",        icon:"🏋️", name:"Test Athlete",       desc:"25 tests complete kiye",            xp:500  },
      { id:"tests_50",        icon:"🚀", name:"Exam Rocket",         desc:"50 tests complete kiye",            xp:750  },
      { id:"score_60",        icon:"📈", name:"Passing Grade",       desc:"Kisi test mein 60%+ score",         xp:100  },
      { id:"score_75",        icon:"🎯", name:"Good Performer",      desc:"Kisi test mein 75%+ score",         xp:150  },
      { id:"score_90",        icon:"🔥", name:"Sharpshooter",        desc:"Kisi test mein 90%+ score",         xp:200  },
      { id:"score_100",       icon:"💯", name:"Perfect Score",       desc:"100% score kiya!",                  xp:500  },
    ]
  },
  {
    cat: "🔥 Consistency",
    badges: [
      { id:"streak_3",        icon:"🔥", name:"3 Din Streak",        desc:"3 din lagataar padha",              xp:150  },
      { id:"streak_7",        icon:"⚡", name:"Week Champion",       desc:"7 din lagataar padha",              xp:300  },
      { id:"streak_14",       icon:"💎", name:"2 Week Warrior",      desc:"14 din lagataar padha",             xp:500  },
      { id:"streak_30",       icon:"👑", name:"Mahina King",         desc:"30 din lagataar padha",             xp:1000 },
      { id:"streak_100",      icon:"🏆", name:"Century Streak",      desc:"100 din lagataar padha",            xp:5000 },
    ]
  },
  {
    cat: "⏰ Special Timing",
    badges: [
      { id:"night_owl",       icon:"🦉", name:"Night Owl",           desc:"Raat 11 baje ke baad padha",        xp:100  },
      { id:"early_bird",      icon:"🌅", name:"Early Bird",          desc:"Subah 6 baje se pehle padha",       xp:100  },
      { id:"weekend_warrior", icon:"🗓️", name:"Weekend Warrior",    desc:"Weekend pe bhi padha",              xp:150  },
    ]
  },
  {
    cat: "🌟 Special Achievements",
    badges: [
      { id:"challenge_win",   icon:"⚔️", name:"Challenge Winner",    desc:"Peer challenge jeeta",              xp:300  },
      { id:"share_app",       icon:"📤", name:"Viral Student",       desc:"App share kiya",                    xp:200  },
      { id:"xp_1000",         icon:"⭐", name:"XP Star",             desc:"1000 XP earn kiya",                 xp:100  },
      { id:"xp_5000",         icon:"🌟", name:"XP Master",           desc:"5000 XP earn kiya",                 xp:250  },
      { id:"xp_10000",        icon:"💫", name:"XP Legend",           desc:"10000 XP earn kiya",                xp:500  },
    ]
  },
];

// Flat list for easy lookup
const BADGES = BADGE_CATEGORIES.flatMap(c => c.badges);

// ─── Levels (unchanged) ───────────────────────────────────────────────────────
const LEVELS = [
  { level:1,  name:"Naya Student",   minXp:0,     icon:"🌱", color:"#94a3b8" },
  { level:2,  name:"Padhai Shuru",   minXp:200,   icon:"📖", color:"#60a5fa" },
  { level:3,  name:"Mehnat Khor",    minXp:500,   icon:"💪", color:"#34d399" },
  { level:4,  name:"Smart Student",  minXp:1000,  icon:"🧠", color:"#a78bfa" },
  { level:5,  name:"Test Expert",    minXp:2000,  icon:"🎯", color:"#f59e0b" },
  { level:6,  name:"Topper",         minXp:3500,  icon:"🏆", color:"#f97316" },
  { level:7,  name:"Scholar",        minXp:5500,  icon:"⭐", color:"#ec4899" },
  { level:8,  name:"Genius",         minXp:8000,  icon:"🔥", color:"#ef4444" },
  { level:9,  name:"Legend",         minXp:12000, icon:"👑", color:"#ffd700" },
  { level:10, name:"ExamGuru",       minXp:18000, icon:"🎓", color:"#fff"    },
];

function getLevel(xp) {
  let lvl = LEVELS[0];
  for (const l of LEVELS) { if (xp >= l.minXp) lvl = l; }
  return lvl;
}
function getNextLevel(xp) {
  for (let i = 0; i < LEVELS.length-1; i++) {
    if (xp < LEVELS[i+1].minXp) return LEVELS[i+1];
  }
  return null;
}

// ─── XP Popup (unchanged) ────────────────────────────────────────────────────
function XPPopup({ xp, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position:"fixed", top:"80px", right:"24px", zIndex:9999,
      background:"linear-gradient(135deg,#f59e0b,#fbbf24)", color:"white",
      padding:"12px 20px", borderRadius:"50px", fontWeight:900, fontSize:"18px",
      boxShadow:"0 8px 32px rgba(245,158,11,0.4)" }}>
      +{xp} XP ⚡
    </div>
  );
}

// ─── Badge Card (unchanged) ──────────────────────────────────────────────────
function BadgeCard({ badge, earned, newlyEarned }) {
  return (
    <div style={{ padding:"14px 12px", borderRadius:"12px", textAlign:"center",
      background:earned?"var(--bg-card)":"var(--bg-secondary)",
      border:`1px solid ${earned?(newlyEarned?"#fbbf24":"var(--border-light)"):"var(--border)"}`,
      opacity:earned?1:0.35, transition:"all 0.2s",
      boxShadow:newlyEarned?"0 0 20px rgba(251,191,36,0.4)":"none",
      position:"relative", overflow:"hidden" }}>
      {newlyEarned && (
        <div style={{ position:"absolute", top:"5px", right:"5px", background:"#fbbf24",
          color:"#000", fontSize:"8px", fontWeight:900, padding:"2px 5px", borderRadius:"8px" }}>NEW!</div>
      )}
      <div style={{ fontSize:"26px", marginBottom:"5px", filter:earned?"none":"grayscale(1)" }}>{badge.icon}</div>
      <div style={{ fontSize:"11px", fontWeight:800, color:earned?"var(--text-primary)":"var(--text-muted)", marginBottom:"2px" }}>{badge.name}</div>
      <div style={{ fontSize:"9px", color:"var(--text-muted)", lineHeight:"1.3", marginBottom:"4px" }}>{badge.desc}</div>
      <div style={{ fontSize:"10px", fontWeight:800, color:"#f59e0b" }}>+{badge.xp} XP</div>
    </div>
  );
}

// ─── Streak Calendar (unchanged) ─────────────────────────────────────────────
function StreakCalendar({ streakData }) {
  const last30 = Array.from({length:30}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate()-(29-i));
    const dateStr = d.toISOString().split("T")[0];
    const activity = streakData?.find(s => s.date === dateStr);
    return { date:dateStr, active:!!activity, count:activity?.activity||0 };
  });
  return (
    <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
      {last30.map((day,i) => (
        <div key={i} title={`${day.date}: ${day.count} activities`}
          style={{ width:"20px", height:"20px", borderRadius:"4px",
            background:day.active?(day.count>=5?"#10b981":day.count>=2?"#34d399":"#6ee7b7"):"var(--bg-secondary)",
            border:"1px solid var(--border)", transition:"transform 0.15s", cursor:"default" }}
          onMouseOver={e => e.currentTarget.style.transform="scale(1.3)"}
          onMouseOut={e => e.currentTarget.style.transform="scale(1)"}/>
      ))}
    </div>
  );
}

// ─── Main Gamification Page ───────────────────────────────────────────────────
export default function GamificationPage() {
  const { user } = useUser();
  const [stats, setStats]       = useState(null);
  const [xpPopup, setXpPopup]   = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [badgeCat, setBadgeCat]  = useState("all"); // filter by category

  // ─── Calculate gamification data ────────────────────────────────────────────
  const calcGamification = (data) => {
    if (!data) return { xp:0, earnedBadgeIds:new Set(), currentStreak:0, totalTests:0, totalQuestions:0, avgScore:0 };

    const totalTests     = data?.totalTests || 0;
    const avgScore       = data?.avgScore || 0;
    const totalQuestions = data?.totalQuestions || 0;
    const streak         = data?.streakData || [];

    // XP calculation
    let xp = 0;
    xp += totalTests * 80;
    xp += totalQuestions * 5;
    xp += Math.round(avgScore * 2);

    // ─── Badge detection ───────────────────────────────────────────────────────
    const earnedBadgeIds = new Set();

    // Getting Started
    if (totalQuestions >= 1)  earnedBadgeIds.add("first_chat");
    if (totalTests >= 1)      earnedBadgeIds.add("first_test");
    // first_scan, first_voice, first_challenge, first_ncert — from localStorage
    if (localStorage.getItem("eg_scanned"))   earnedBadgeIds.add("first_scan");
    if (localStorage.getItem("eg_voiced"))    earnedBadgeIds.add("first_voice");
    if (localStorage.getItem("examguru_challenges")?.length > 2) earnedBadgeIds.add("first_challenge");
    if (localStorage.getItem("ncert_progress")?.length > 2)      earnedBadgeIds.add("first_ncert");

    // Learning
    if (totalQuestions >= 10)  earnedBadgeIds.add("questions_10");
    if (totalQuestions >= 50)  earnedBadgeIds.add("questions_50");
    if (totalQuestions >= 100) earnedBadgeIds.add("questions_100");
    if (totalQuestions >= 500) earnedBadgeIds.add("questions_500");
    if (localStorage.getItem("examguru_doubts")?.length > 2)  earnedBadgeIds.add("doubt_share");
    if (localStorage.getItem("examguru_rooms")?.length > 2)   earnedBadgeIds.add("group_study");

    // Tests
    if (totalTests >= 5)  earnedBadgeIds.add("tests_5");
    if (totalTests >= 10) earnedBadgeIds.add("tests_10");
    if (totalTests >= 25) earnedBadgeIds.add("tests_25");
    if (totalTests >= 50) earnedBadgeIds.add("tests_50");
    if (avgScore >= 60)   earnedBadgeIds.add("score_60");
    if (avgScore >= 75)   earnedBadgeIds.add("score_75");
    if (avgScore >= 90)   earnedBadgeIds.add("score_90");
    // score_100 — check recentTests
    if (data?.recentTests?.some(t => Math.round(t.pct||0) >= 100)) earnedBadgeIds.add("score_100");

    // Streak calc
    let currentStreak = 0;
    const sortedDates = [...new Set(streak.map(s => s.date))].sort().reverse();
    let checkDate = new Date();
    for (const d of sortedDates) {
      const diff = Math.round((checkDate - new Date(d)) / 86400000);
      if (diff <= 1) { currentStreak++; checkDate = new Date(d); }
      else break;
    }
    if (currentStreak >= 3)   { earnedBadgeIds.add("streak_3");   xp += 150;  }
    if (currentStreak >= 7)   { earnedBadgeIds.add("streak_7");   xp += 300;  }
    if (currentStreak >= 14)  { earnedBadgeIds.add("streak_14");  xp += 500;  }
    if (currentStreak >= 30)  { earnedBadgeIds.add("streak_30");  xp += 1000; }
    if (currentStreak >= 100) { earnedBadgeIds.add("streak_100"); xp += 5000; }

    // Timing
    const hour = new Date().getHours();
    if (hour >= 23 || hour < 4) earnedBadgeIds.add("night_owl");
    if (hour >= 5  && hour < 7) earnedBadgeIds.add("early_bird");
    const dow = new Date().getDay();
    if (dow === 0 || dow === 6) earnedBadgeIds.add("weekend_warrior");

    // Special
    if (localStorage.getItem("eg_challenge_won"))  earnedBadgeIds.add("challenge_win");
    if (xp >= 1000)  earnedBadgeIds.add("xp_1000");
    if (xp >= 5000)  earnedBadgeIds.add("xp_5000");
    if (xp >= 10000) earnedBadgeIds.add("xp_10000");

    return { xp, earnedBadgeIds, currentStreak, totalTests, totalQuestions, avgScore };
  };

  // ─── Data loading (unchanged from original) ──────────────────────────────────
  const { profile:appProfile, analytics:appAnalytics, loading } = useAppData();
  useEffect(() => {
    if (appProfile && appAnalytics) {
      const combined = {
        ...appAnalytics,
        totalTests:     appProfile.stats?.total_tests || 0,
        avgScore:       appProfile.stats?.avg_score || 0,
        totalQuestions: appProfile.stats?.total_questions_asked || 0,
      };
      setStats(combined);
    }
  }, [appProfile?.stats?.total_tests, appAnalytics?.recentTests?.length]);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", gap:"12px" }}>
      <div className="loader"/> <span style={{ color:"var(--text-secondary)" }}>XP calculate ho raha hai...</span>
    </div>
  );

  const { xp, earnedBadgeIds, currentStreak, totalTests, totalQuestions, avgScore } = calcGamification(stats);
  const level     = getLevel(xp);
  const nextLevel = getNextLevel(xp);
  const xpInLevel = xp - level.minXp;
  const xpNeeded  = nextLevel ? nextLevel.minXp - level.minXp : 1;
  const progress  = Math.min((xpInLevel / xpNeeded) * 100, 100);
  const earnedCount = earnedBadgeIds.size;
  const totalCount  = BADGES.length;

  return (
    <div style={{ padding:"24px", overflowY:"auto", maxHeight:"100vh" }}>
      {xpPopup && <XPPopup xp={xpPopup} onDone={() => setXpPopup(null)}/>}

      {/* Hero Level Card (unchanged) */}
      <div className="fade-in" style={{ borderRadius:"20px", padding:"28px",
        background:`linear-gradient(135deg,${level.color}20,${level.color}08)`,
        border:`1px solid ${level.color}40`, marginBottom:"24px",
        position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:"-20px", top:"-20px", fontSize:"120px", opacity:0.06 }}>{level.icon}</div>
        <div style={{ display:"flex", alignItems:"center", gap:"20px", marginBottom:"20px" }}>
          <div style={{ width:"80px", height:"80px", borderRadius:"20px",
            background:`linear-gradient(135deg,${level.color}40,${level.color}20)`,
            border:`2px solid ${level.color}60`,
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"2px" }}>
            <span style={{ fontSize:"28px" }}>{level.icon}</span>
            <span style={{ fontSize:"11px", fontWeight:900, color:level.color }}>LVL {level.level}</span>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:"22px", fontWeight:900, marginBottom:"4px" }}>{user.name} <span style={{ color:level.color }}>{level.icon}</span></div>
            <div style={{ fontSize:"15px", fontWeight:700, color:level.color, marginBottom:"8px" }}>{level.name}</div>
            <div style={{ fontSize:"13px", color:"var(--text-muted)" }}>
              {nextLevel ? `${nextLevel.name} tak ${nextLevel.minXp-xp} XP aur chahiye` : "🏆 Maximum Level!"}
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:"36px", fontWeight:900, color:"#f59e0b" }}>{xp.toLocaleString()}</div>
            <div style={{ fontSize:"12px", color:"var(--text-muted)", fontWeight:700 }}>Total XP ⚡</div>
          </div>
        </div>
        {nextLevel && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:"11px", color:"var(--text-muted)", marginBottom:"6px", fontWeight:700 }}>
              <span>{level.name} (Lv.{level.level})</span>
              <span>{Math.round(progress)}% → {nextLevel.name} (Lv.{nextLevel.level})</span>
            </div>
            <div style={{ height:"10px", background:"var(--bg-secondary)", borderRadius:"10px", overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${progress}%`,
                background:`linear-gradient(90deg,${level.color},${level.color}aa)`,
                borderRadius:"10px", transition:"width 1s ease",
                boxShadow:`0 0 10px ${level.color}60` }}/>
            </div>
          </div>
        )}
      </div>

      {/* Stats Row (unchanged) */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px", marginBottom:"24px" }}>
        {[
          { label:"🔥 Streak",    value:`${currentStreak} din`, color:"#f97316" },
          { label:"📝 Tests",     value:totalTests,              color:"var(--accent)" },
          { label:"💬 Sawaal",    value:totalQuestions,          color:"#a78bfa" },
          { label:"🎯 Avg Score", value:`${Math.round(avgScore)}%`, color:"#10b981" },
        ].map((s,i) => (
          <div key={i} className="card fade-in" style={{ textAlign:"center", animationDelay:`${i*0.08}s` }}>
            <div style={{ fontSize:"22px", fontWeight:900, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:"12px", color:"var(--text-muted)", fontWeight:700, marginTop:"2px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"4px", background:"var(--bg-secondary)", borderRadius:"10px", padding:"4px", marginBottom:"20px", width:"fit-content" }}>
        {[["overview","🏠 Overview"],["badges","🏅 Badges"],["streak","🔥 Streak"]].map(([t,l]) => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ padding:"8px 20px", borderRadius:"8px", border:"none",
            background:activeTab===t?"var(--accent)":"transparent",
            color:activeTab===t?"white":"var(--text-muted)",
            fontWeight:700, fontSize:"13px", fontFamily:"var(--font-main)",
            cursor:"pointer", transition:"all 0.15s" }}>{l}
            {t==="badges" && <span style={{ marginLeft:"6px", fontSize:"10px", background:activeTab===t?"rgba(255,255,255,0.2)":"var(--bg-card)", padding:"1px 6px", borderRadius:"10px" }}>{earnedCount}/{totalCount}</span>}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB (unchanged) ─────────────────────────────────────────── */}
      {activeTab==="overview" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          <div className="card fade-in">
            <h3 style={{ fontSize:"15px", fontWeight:800, marginBottom:"14px" }}>⚡ XP Kaise Kamao</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
              {[
                ["💬 AI se sawaal poochho","+5 XP"],["📝 Mock test do","+80 XP"],
                ["🎯 90%+ score karo","+200 XP"],["💯 100% score karo","+500 XP"],
                ["🔥 Daily streak","+50 XP/din"],["📸 Photo scan karo","+10 XP"],
                ["🎙️ Voice class lo","+15 XP"],["📚 Naya subject explore","+25 XP"],
              ].map(([action,reward],i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"var(--bg-secondary)", borderRadius:"8px" }}>
                  <span style={{ fontSize:"13px", color:"var(--text-secondary)" }}>{action}</span>
                  <span style={{ fontSize:"13px", fontWeight:900, color:"#f59e0b" }}>{reward}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card fade-in">
            <h3 style={{ fontSize:"15px", fontWeight:800, marginBottom:"14px" }}>🗺️ Level Roadmap</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {LEVELS.map((l,i) => {
                const isCurrent = l.level===level.level;
                const isPast = xp>=l.minXp;
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 14px",
                    borderRadius:"10px", background:isCurrent?`${l.color}15`:"var(--bg-secondary)",
                    border:`1px solid ${isCurrent?l.color+"40":"var(--border)"}`, opacity:isPast?1:0.5 }}>
                    <span style={{ fontSize:"20px" }}>{l.icon}</span>
                    <div style={{ flex:1 }}>
                      <span style={{ fontSize:"13px", fontWeight:800, color:isCurrent?l.color:"var(--text-primary)" }}>Lv.{l.level} — {l.name}</span>
                    </div>
                    <span style={{ fontSize:"12px", color:"var(--text-muted)", fontWeight:700 }}>{l.minXp.toLocaleString()} XP</span>
                    {isCurrent && <span style={{ fontSize:"11px", background:l.color, color:"#000", padding:"2px 8px", borderRadius:"10px", fontWeight:900 }}>YOU</span>}
                    {isPast && !isCurrent && <span style={{ fontSize:"14px" }}>✅</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── BADGES TAB — NEW: Category filter + grouped display ──────────────── */}
      {activeTab==="badges" && (
        <div>
          {/* Header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
            <h3 style={{ fontSize:"15px", fontWeight:800 }}>🏅 {earnedCount}/{totalCount} Badges Earned</h3>
            <span style={{ padding:"4px 12px", borderRadius:"20px", background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", fontSize:"12px", fontWeight:800, color:"#f59e0b" }}>
              {earnedCount * 100} Badge XP
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height:"8px", background:"var(--bg-secondary)", borderRadius:"4px", overflow:"hidden", marginBottom:"16px" }}>
            <div style={{ height:"100%", width:`${(earnedCount/totalCount)*100}%`,
              background:"linear-gradient(90deg,#f59e0b,#fbbf24)", borderRadius:"4px", transition:"width 1s" }}/>
          </div>

          {/* Category filter pills */}
          <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"16px" }}>
            <button onClick={() => setBadgeCat("all")}
              style={{ padding:"5px 12px", borderRadius:"20px", border:`1px solid ${badgeCat==="all"?"var(--accent)":"var(--border)"}`,
                background:badgeCat==="all"?"var(--accent-glow)":"transparent",
                color:badgeCat==="all"?"var(--accent)":"var(--text-muted)",
                cursor:"pointer", fontSize:"11px", fontWeight:700, fontFamily:"var(--font-main)" }}>
              All ({totalCount})
            </button>
            <button onClick={() => setBadgeCat("earned")}
              style={{ padding:"5px 12px", borderRadius:"20px", border:`1px solid ${badgeCat==="earned"?"#10b981":"var(--border)"}`,
                background:badgeCat==="earned"?"rgba(16,185,129,0.1)":"transparent",
                color:badgeCat==="earned"?"#10b981":"var(--text-muted)",
                cursor:"pointer", fontSize:"11px", fontWeight:700, fontFamily:"var(--font-main)" }}>
              ✅ Earned ({earnedCount})
            </button>
            <button onClick={() => setBadgeCat("locked")}
              style={{ padding:"5px 12px", borderRadius:"20px", border:`1px solid ${badgeCat==="locked"?"#f59e0b":"var(--border)"}`,
                background:badgeCat==="locked"?"rgba(245,158,11,0.1)":"transparent",
                color:badgeCat==="locked"?"#f59e0b":"var(--text-muted)",
                cursor:"pointer", fontSize:"11px", fontWeight:700, fontFamily:"var(--font-main)" }}>
              🔒 Locked ({totalCount-earnedCount})
            </button>
          </div>

          {/* Grouped by category */}
          {BADGE_CATEGORIES.map(({ cat, badges }) => {
            const filtered = badges.filter(b => {
              if (badgeCat === "earned") return earnedBadgeIds.has(b.id);
              if (badgeCat === "locked") return !earnedBadgeIds.has(b.id);
              return true;
            });
            if (filtered.length === 0) return null;
            const catEarned = badges.filter(b => earnedBadgeIds.has(b.id)).length;
            return (
              <div key={cat} style={{ marginBottom:"20px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                  <div style={{ fontSize:"13px", fontWeight:800, color:"var(--text-secondary)" }}>{cat}</div>
                  <div style={{ fontSize:"11px", color:"var(--text-muted)" }}>{catEarned}/{badges.length}</div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))", gap:"10px" }}>
                  {filtered.map(badge => (
                    <BadgeCard key={badge.id} badge={badge} earned={earnedBadgeIds.has(badge.id)} newlyEarned={false}/>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── STREAK TAB (unchanged) ────────────────────────────────────────────── */}
      {activeTab==="streak" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          <div className="card fade-in" style={{ textAlign:"center", padding:"32px" }}>
            <div style={{ fontSize:"64px", marginBottom:"8px" }}>{currentStreak>0?"🔥":"💤"}</div>
            <div style={{ fontSize:"48px", fontWeight:900, color:"#f97316", marginBottom:"4px" }}>{currentStreak}</div>
            <div style={{ fontSize:"16px", color:"var(--text-secondary)", fontWeight:700 }}>din ki streak!</div>
            {currentStreak===0 && <p style={{ color:"var(--text-muted)", fontSize:"14px", marginTop:"12px" }}>Aaj padho — streak shuru karo! 🚀</p>}
            {currentStreak>0  && <p style={{ color:"#f97316", fontSize:"14px", marginTop:"12px" }}>Wah! Lagataar {currentStreak} din padha! 🔥</p>}
          </div>
          <div className="card fade-in">
            <h3 style={{ fontSize:"15px", fontWeight:800, marginBottom:"16px" }}>📅 Last 30 Days Activity</h3>
            <StreakCalendar streakData={stats?.streakData||[]}/>
            <div style={{ display:"flex", gap:"12px", marginTop:"12px", fontSize:"11px", color:"var(--text-muted)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"4px" }}><div style={{ width:"12px", height:"12px", borderRadius:"3px", background:"var(--bg-secondary)", border:"1px solid var(--border)" }}/> No activity</div>
              <div style={{ display:"flex", alignItems:"center", gap:"4px" }}><div style={{ width:"12px", height:"12px", borderRadius:"3px", background:"#6ee7b7" }}/> Padha</div>
              <div style={{ display:"flex", alignItems:"center", gap:"4px" }}><div style={{ width:"12px", height:"12px", borderRadius:"3px", background:"#10b981" }}/> Bahut padha</div>
            </div>
          </div>
          <div className="card fade-in">
            <h3 style={{ fontSize:"15px", fontWeight:800, marginBottom:"14px" }}>🎯 Streak Badges</h3>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px" }}>
              {BADGE_CATEGORIES.find(c=>c.cat.includes("Consistency"))?.badges.map(badge => (
                <BadgeCard key={badge.id} badge={badge} earned={earnedBadgeIds.has(badge.id)}/>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
