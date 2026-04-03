import React, { useState, useEffect } from "react";
import { useUser } from "../hooks/useUser";
import { useAppData } from "../hooks/useAppData";
import { analyticsAPI, userAPI } from "../utils/api";

const BADGES = [
  { min:1, max:1, icon:"🥇", label:"Gold", color:"#fbbf24", bg:"rgba(251,191,36,0.15)" },
  { min:2, max:2, icon:"🥈", label:"Silver", color:"#94a3b8", bg:"rgba(148,163,184,0.15)" },
  { min:3, max:3, icon:"🥉", label:"Bronze", color:"#f97316", bg:"rgba(249,115,22,0.15)" },
  { min:4, max:10, icon:"⭐", label:"Top 10", color:"#a78bfa", bg:"rgba(167,139,250,0.1)" },
  { min:11, max:999, icon:"🎯", label:"Contender", color:"#60a5fa", bg:"rgba(96,165,250,0.08)" },
];

function getRankBadge(rank) {
  return BADGES.find(b => rank >= b.min && rank <= b.max) || BADGES[BADGES.length-1];
}

export default function Leaderboard() {
  const { user } = useUser();
  const { profile: appProfile } = useAppData();
  const [tab, setTab] = useState("global"); // global | friends | weekly
  const [board, setBoard] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareMsg, setShareMsg] = useState("");

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Use global profile data
      const stats = appProfile?.stats || {};
      const weakTopics = appProfile?.weakTopics || [];

      setMyStats({
        name: user.name,
        examTarget: user.examTarget,
        totalTests: stats.total_tests || 0,
        avgScore: stats.avg_score || 0,
        questionsAsked: stats.total_questions_asked || 0,
        weakCount: weakTopics.length,
        xp: calculateXP(stats),
      });

      // Generate leaderboard from localStorage + mock data
      // In production this would be a real API call
      const storedBoard = JSON.parse(localStorage.getItem("eg_leaderboard") || "[]");

      // Add current user
      const myEntry = {
        id: user.id,
        name: user.name,
        examTarget: user.examTarget,
        xp: calculateXP(stats),
        tests: stats.total_tests || 0,
        avg: Math.round(stats.avg_score || 0),
        isMe: true,
      };

      // Mock board data for demo
      const mockBoard = [
        { id:"m1", name:"Rahul Sharma", examTarget:user.examTarget, xp:2850, tests:45, avg:82 },
        { id:"m2", name:"Priya Singh", examTarget:user.examTarget, xp:2640, tests:38, avg:78 },
        { id:"m3", name:"Arjun Patel", examTarget:user.examTarget, xp:2310, tests:32, avg:75 },
        { id:"m4", name:"Sneha Gupta", examTarget:user.examTarget, xp:2100, tests:28, avg:72 },
        { id:"m5", name:"Vikram Yadav", examTarget:user.examTarget, xp:1890, tests:24, avg:69 },
        { id:"m6", name:"Anjali Mishra", examTarget:user.examTarget, xp:1650, tests:20, avg:65 },
        { id:"m7", name:"Rohit Kumar", examTarget:user.examTarget, xp:1420, tests:18, avg:61 },
        { id:"m8", name:"Kavya Nair", examTarget:user.examTarget, xp:1200, tests:15, avg:58 },
        { id:"m9", name:"Amit Verma", examTarget:user.examTarget, xp:980, tests:12, avg:54 },
        myEntry,
      ];

      const sorted = mockBoard.sort((a,b) => b.xp - a.xp).map((e,i) => ({...e, rank:i+1}));
      setBoard(sorted);

      // Save to localStorage
      localStorage.setItem("eg_leaderboard", JSON.stringify(sorted.filter(e => !e.isMe)));
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  function calculateXP(stats) {
    return (stats.total_tests || 0) * 50 +
           Math.round(stats.avg_score || 0) * 10 +
           (stats.total_questions_asked || 0) * 5;
  }

  const shareScore = () => {
    const myRank = board.find(e => e.isMe);
    if (!myRank) return;
    const text = `🎓 Main ExamGuru AI pe ${user.examTarget} ki taiyari kar raha hoon!\n🏆 Rank: #${myRank.rank}\n⭐ XP: ${myRank.xp}\n📊 Avg Score: ${myRank.avg}%\n\nTum bhi join karo: examguru.ai`;
    if (navigator.share) {
      navigator.share({ title:"ExamGuru AI Score", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setShareMsg("✅ Copied! Share karo apne friends ke saath");
        setTimeout(() => setShareMsg(""), 3000);
      });
    }
  };

  const myEntry = board.find(e => e.isMe);
  const myRank = myEntry?.rank || "-";

  return (
    <div style={{ padding:"24px", overflowY:"auto", maxHeight:"100vh" }}>
      {/* Header */}
      <div style={{ marginBottom:"20px" }}>
        <h1 style={{ fontSize:"22px", fontWeight:900, marginBottom:"4px" }}>🏆 Leaderboard</h1>
        <p style={{ color:"var(--text-secondary)", fontSize:"13px" }}>{user.examTarget} students ki ranking — kaun hai #1?</p>
      </div>

      {/* My rank card */}
      {myStats && (
        <div className="card fade-in" style={{ marginBottom:"20px", background:"linear-gradient(135deg,rgba(59,130,246,0.1),rgba(99,102,241,0.05))", borderColor:"rgba(59,130,246,0.3)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
            <div style={{ textAlign:"center", minWidth:"70px" }}>
              <div style={{ fontSize:"36px", fontWeight:900, color:"var(--accent)" }}>#{myRank}</div>
              <div style={{ fontSize:"10px", color:"var(--text-muted)", fontWeight:700 }}>YOUR RANK</div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:900, fontSize:"16px", marginBottom:"4px" }}>{user.name}</div>
              <div style={{ display:"flex", gap:"12px", flexWrap:"wrap" }}>
                <span style={{ fontSize:"12px", color:"#fbbf24", fontWeight:700 }}>⭐ {myEntry?.xp || 0} XP</span>
                <span style={{ fontSize:"12px", color:"#10b981", fontWeight:700 }}>📝 {myStats.totalTests} tests</span>
                <span style={{ fontSize:"12px", color:"#a78bfa", fontWeight:700 }}>📊 {Math.round(myStats.avgScore)}% avg</span>
              </div>
            </div>
            <button onClick={shareScore} className="btn btn-primary" style={{ fontSize:"12px", padding:"8px 14px" }}>
              📤 Share
            </button>
          </div>
          {shareMsg && <div style={{ marginTop:"10px", fontSize:"12px", color:"#10b981", fontWeight:700 }}>{shareMsg}</div>}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:"flex", gap:"4px", background:"var(--bg-secondary)", borderRadius:"10px", padding:"4px", marginBottom:"20px", width:"fit-content" }}>
        {[["global","🌍 Overall"],["weekly","📅 This Week"]].map(([id,l]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:"7px 16px", borderRadius:"8px", border:"none",
            background: tab===id?"var(--accent)":"transparent",
            color: tab===id?"white":"var(--text-muted)",
            fontWeight:700, fontSize:"12px", fontFamily:"var(--font-main)", cursor:"pointer", transition:"all 0.15s" }}>{l}</button>
        ))}
      </div>

      {/* Leaderboard list */}
      {loading ? (
        <div style={{ display:"flex", gap:"10px", padding:"20px" }}><div className="loader"/> Loading...</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          {/* Top 3 podium */}
          <div style={{ display:"flex", gap:"10px", marginBottom:"8px", alignItems:"flex-end", justifyContent:"center" }}>
            {board.slice(0,3).map((entry, i) => {
              const podiumOrder = [1,0,2]; // 2nd, 1st, 3rd
              const heights = [130,160,110];
              const idx = podiumOrder[i];
              const e = board[idx];
              if (!e) return null;
              const badge = getRankBadge(e.rank);
              return (
                <div key={e.id} className="fade-in" style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"8px" }}>
                  <div style={{ fontSize:"11px", fontWeight:800, color:badge.color }}>{e.name.split(" ")[0]}</div>
                  <div style={{ fontSize:"22px" }}>{badge.icon}</div>
                  <div style={{ width:"100%", height:`${heights[i]}px`, background:`linear-gradient(180deg,${badge.bg},${badge.color}20)`,
                    border:`1px solid ${badge.color}40`, borderRadius:"10px 10px 0 0",
                    display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"4px" }}>
                    <div style={{ fontSize:"22px", fontWeight:900, color:badge.color }}>#{e.rank}</div>
                    <div style={{ fontSize:"11px", color:"var(--text-muted)", fontWeight:700 }}>{e.xp} XP</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full list */}
          {board.map((entry) => {
            const badge = getRankBadge(entry.rank);
            return (
              <div key={entry.id} className="card fade-in"
                style={{ display:"flex", alignItems:"center", gap:"14px",
                  border:`1px solid ${entry.isMe?"rgba(59,130,246,0.4)":badge.color+"25"}`,
                  background: entry.isMe?"rgba(59,130,246,0.06)":badge.bg,
                  transition:"all 0.2s" }}>
                {/* Rank */}
                <div style={{ minWidth:"36px", textAlign:"center" }}>
                  <div style={{ fontSize:"18px", fontWeight:900, color:badge.color }}>{badge.icon}</div>
                  <div style={{ fontSize:"11px", color:"var(--text-muted)", fontWeight:700 }}>#{entry.rank}</div>
                </div>
                {/* Name */}
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:"14px" }}>
                    {entry.name} {entry.isMe && <span style={{ fontSize:"11px", color:"var(--accent)", fontWeight:700 }}>(You)</span>}
                  </div>
                  <div style={{ fontSize:"11px", color:"var(--text-muted)" }}>{entry.examTarget}</div>
                </div>
                {/* Stats */}
                <div style={{ display:"flex", gap:"14px", alignItems:"center" }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:"14px", fontWeight:900, color:"#fbbf24" }}>{entry.xp}</div>
                    <div style={{ fontSize:"9px", color:"var(--text-muted)", fontWeight:700 }}>XP</div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:"14px", fontWeight:900, color:"#10b981" }}>{entry.avg}%</div>
                    <div style={{ fontSize:"9px", color:"var(--text-muted)", fontWeight:700 }}>AVG</div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:"14px", fontWeight:900, color:"#a78bfa" }}>{entry.tests}</div>
                    <div style={{ fontSize:"9px", color:"var(--text-muted)", fontWeight:700 }}>TESTS</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* How to earn XP */}
      <div className="card fade-in" style={{ marginTop:"20px", background:"linear-gradient(135deg,rgba(16,185,129,0.05),rgba(59,130,246,0.03))", borderColor:"rgba(16,185,129,0.2)" }}>
        <h3 style={{ fontSize:"13px", fontWeight:800, marginBottom:"10px" }}>⭐ XP Kaise Earn Karo</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
          {[["📝 Mock Test do","50 XP each"],["💬 AI se poochho","5 XP each"],["📊 High score","10 XP/%"],["🔥 Daily streak","20 XP/day"]].map(([a,b],i) => (
            <div key={i} style={{ padding:"8px 12px", background:"var(--bg-secondary)", borderRadius:"8px", display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:"12px", color:"var(--text-secondary)" }}>{a}</span>
              <span style={{ fontSize:"12px", fontWeight:800, color:"#fbbf24" }}>{b}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
