import React, { useState, useEffect } from "react";
import { analyticsAPI, userAPI } from "../utils/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

// ─── Parent Login ─────────────────────────────────────────────────────────────
function ParentLogin({ onLogin }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  // Parent code = student email first 4 chars + "1234" (demo)
  const handleLogin = () => {
    const savedUsers = Object.keys(localStorage)
      .filter(k => k === "examguru_user")
      .map(k => JSON.parse(localStorage.getItem(k)));

    if (savedUsers.length > 0) {
      onLogin(savedUsers[0]);
    } else {
      setError("Koi student account nahi mila. Pehle student login kare.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>👨‍👩‍👧</div>
          <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Parent Dashboard</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "6px" }}>
            Apne bachche ki progress dekho
          </p>
        </div>
        <div className="card">
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
            Isi device pe student ka account linked hai — seedha dekho
          </p>
          {error && <div style={{ color: "#f87171", fontSize: "13px", marginBottom: "12px" }}>❌ {error}</div>}
          <button className="btn btn-primary" onClick={handleLogin} style={{ width: "100%", justifyContent: "center", padding: "13px" }}>
            👨‍👩‍👧 Bachche ki Progress Dekho
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Report Card ──────────────────────────────────────────────────────────────
function ReportCard({ label, value, icon, color, sub }) {
  return (
    <div className="card" style={{ textAlign: "center", border: `1px solid ${color}30` }}>
      <div style={{ fontSize: "24px", marginBottom: "6px" }}>{icon}</div>
      <div style={{ fontSize: "26px", fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", marginTop: "2px" }}>{label}</div>
      {sub && <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{sub}</div>}
    </div>
  );
}

// ─── Main Parent Dashboard ────────────────────────────────────────────────────
export default function ParentDashboard() {
  const [studentData, setStudentData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  const student = React.useMemo(() => JSON.parse(localStorage.getItem("examguru_user") || "null"), []);

  useEffect(() => {
    if (!loggedIn || !student) return;
    Promise.all([
      userAPI.getProfile(student.id),
      analyticsAPI.getDashboard(student.id)
    ]).then(([profileRes, dashRes]) => {
      setStudentData(profileRes.data);
      setAnalytics(dashRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [loggedIn, student]);

  if (!loggedIn) return <ParentLogin onLogin={() => setLoggedIn(true)} />;
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", gap: "12px" }}>
      <div className="loader" /> <span style={{ color: "var(--text-secondary)" }}>Report load ho rahi hai...</span>
    </div>
  );

  const stats = studentData?.stats || {};
  const weakTopics = studentData?.weakTopics || [];
  const recentTests = analytics?.recentTests || [];
  const subjectPerf = analytics?.subjectPerformance || [];
  const streakData = analytics?.streakData || [];

  // Calculate streak
  let streak = 0;
  const today = new Date(); today.setHours(0,0,0,0);
  const sortedDates = [...new Set(streakData.map(s => s.date))].sort().reverse();
  let checkDate = new Date();
  for (const d of sortedDates) {
    const diff = Math.round((checkDate - new Date(d)) / 86400000);
    if (diff <= 1) { streak++; checkDate = new Date(d); } else break;
  }

  const avgScore = stats.avg_score || 0;
  const grade = avgScore >= 90 ? "A+" : avgScore >= 75 ? "A" : avgScore >= 60 ? "B" : avgScore >= 45 ? "C" : "D";
  const gradeColor = avgScore >= 75 ? "#10b981" : avgScore >= 50 ? "#f59e0b" : "#ef4444";

  const radarData = subjectPerf.map(s => ({ subject: s.subject.slice(0,8), score: Math.round(s.avg_pct) }));

  return (
    <div style={{ padding: "24px", overflowY: "auto", maxHeight: "100vh" }}>
      {/* Header */}
      <div className="card fade-in" style={{
        marginBottom: "24px", padding: "24px",
        background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.05))",
        borderColor: "rgba(59,130,246,0.3)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "60px", height: "60px", borderRadius: "16px", background: "linear-gradient(135deg, #3b82f6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>🧑‍🎓</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "22px", fontWeight: 900, marginBottom: "4px" }}>{student?.name}</h2>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span className="badge badge-blue">{student?.examTarget} Student</span>
              <span className="badge badge-green">🔥 {streak} din streak</span>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{student?.email}</span>
            </div>
          </div>
          <div style={{ textAlign: "center", padding: "12px 20px", background: `${gradeColor}15`, border: `2px solid ${gradeColor}40`, borderRadius: "12px" }}>
            <div style={{ fontSize: "36px", fontWeight: 900, color: gradeColor }}>{grade}</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)" }}>Overall Grade</div>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
        <ReportCard label="Tests Diye" value={stats.total_tests || 0} icon="📝" color="var(--accent)" />
        <ReportCard label="Avg Score" value={`${Math.round(avgScore)}%`} icon="🎯" color={gradeColor} />
        <ReportCard label="AI Sawaal" value={stats.total_questions_asked || 0} icon="💬" color="#a78bfa" sub="Curiosity score" />
        <ReportCard label="Study Streak" value={`${streak}🔥`} icon="📅" color="#f97316" sub="din lagataar" />
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
        {/* Score Trend */}
        <div className="card fade-in">
          <h3 style={{ fontSize: "14px", fontWeight: 800, marginBottom: "12px" }}>📈 Score Trend</h3>
          {recentTests.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={[...recentTests].reverse()}>
                <XAxis dataKey="subject" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} formatter={v => [`${v}%`, "Score"]} />
                <Line type="monotone" dataKey="pct" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill: "var(--accent)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "13px" }}>Abhi tak koi test nahi diya</div>}
        </div>

        {/* Subject Radar */}
        <div className="card fade-in">
          <h3 style={{ fontSize: "14px", fontWeight: 800, marginBottom: "12px" }}>🕸️ Subject Performance</h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
                <Radar dataKey="score" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "13px" }}>Data available nahi</div>}
        </div>
      </div>

      {/* Weak Topics Alert */}
      {weakTopics.length > 0 && (
        <div className="card fade-in" style={{ marginBottom: "16px", borderColor: "rgba(245,158,11,0.4)", background: "rgba(245,158,11,0.04)" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 800, marginBottom: "12px" }}>⚠️ Weak Topics — Dhyan Do</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {weakTopics.map((t, i) => (
              <div key={i} style={{ padding: "6px 14px", borderRadius: "20px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", fontSize: "12px", fontWeight: 700, color: "#fbbf24" }}>
                {t.subject}: {t.topic} ({t.wrong_count}x galat)
              </div>
            ))}
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "10px" }}>
            💡 Suggestion: In topics pe aur practice karwao — AI Tutor se poochh sakte hain
          </p>
        </div>
      )}

      {/* Recent Tests */}
      <div className="card fade-in" style={{ marginBottom: "16px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 800, marginBottom: "12px" }}>📋 Recent Tests</h3>
        {recentTests.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Abhi tak koi test nahi diya</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recentTests.slice(0, 5).map((t, i) => {
              const pct = t.pct || 0;
              const c = pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "var(--bg-secondary)", borderRadius: "8px" }}>
                  <div style={{ width: "46px", height: "46px", borderRadius: "10px", background: `${c}15`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "14px", color: c }}>{pct}%</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "13px" }}>{t.subject}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{t.score}/{t.total} correct • {new Date(t.completed_at).toLocaleDateString("en-IN")}</div>
                  </div>
                  <div style={{ width: "80px", height: "6px", background: "var(--border)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: c, borderRadius: "3px" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Parent Tips */}
      <div className="card fade-in" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.05), rgba(59,130,246,0.05))", borderColor: "rgba(16,185,129,0.2)" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 800, marginBottom: "12px" }}>💡 Aapke Liye Tips</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[
            streak >= 7 ? `🔥 Wah! ${student?.name} ne ${streak} din lagataar padha — bahut achha!` : `📅 ${student?.name} ki study streak ${streak} din hai — daily padhne ke liye encourage karo`,
            avgScore >= 75 ? `🎯 Average score ${Math.round(avgScore)}% hai — excellent performance!` : `📈 Average score ${Math.round(avgScore)}% hai — practice tests se improve hoga`,
            weakTopics.length > 0 ? `⚠️ ${weakTopics[0]?.subject} mein ${weakTopics[0]?.topic} weak hai — extra attention do` : `✅ Koi major weak topic nahi — great balance!`,
            `💬 ${stats.total_questions_asked || 0} sawaal AI se poochhe hain — curiosity achhi hai!`
          ].map((tip, i) => (
            <div key={i} style={{ padding: "10px 14px", background: "var(--bg-secondary)", borderRadius: "8px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              {tip}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
