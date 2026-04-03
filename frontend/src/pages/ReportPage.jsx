import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../hooks/useUser";
import { useAppData } from "../hooks/useAppData";
import { analyticsAPI, userAPI } from "../utils/api";

export default function ReportPage() {
  const { user } = useUser();
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef(null);

  const { profile: profileData, analytics: analyticsData, loading } = useAppData();
  const data = profileData && analyticsData ? { profile: profileData, analytics: analyticsData } : null;

  const printReport = () => {
    setGenerating(true);
    setTimeout(() => { window.print(); setGenerating(false); }, 300);
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", gap:"12px" }}>
      <div className="loader" /> <span style={{ color:"var(--text-secondary)" }}>Report generate ho rahi hai...</span>
    </div>
  );

  const stats = data?.profile?.stats || {};
  const weakTopics = data?.profile?.weakTopics || [];
  const recentTests = data?.analytics?.recentTests || [];
  const subjectPerf = data?.analytics?.subjectPerformance || [];
  const avgScore = stats.avg_score || 0;
  const grade = avgScore >= 90 ? "A+" : avgScore >= 75 ? "A" : avgScore >= 60 ? "B" : avgScore >= 45 ? "C" : "D";
  const gradeColor = avgScore >= 75 ? "#10b981" : avgScore >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ padding:"24px", overflowY:"auto", maxHeight:"100vh" }}>
      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-card { background: white !important; border: 1px solid #ddd !important; color: black !important; break-inside: avoid; }
          .print-text { color: #333 !important; }
          .print-muted { color: #666 !important; }
        }
      `}</style>

      {/* Actions */}
      <div className="no-print" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
        <div>
          <h1 style={{ fontSize:"24px", fontWeight:800 }}>📊 Performance Report</h1>
          <p style={{ color:"var(--text-secondary)", fontSize:"14px" }}>Weekly AI-generated report card</p>
        </div>
        <button className="btn btn-primary" onClick={printReport} disabled={generating} style={{ gap:"8px" }}>
          {generating ? <><div className="loader" style={{ width:"14px", height:"14px" }} /> Generating...</> : "⬇️ Download PDF"}
        </button>
      </div>

      {/* Report content */}
      <div ref={reportRef} style={{ maxWidth:"800px", margin:"0 auto" }}>
        {/* Header */}
        <div className="card print-card fade-in" style={{ marginBottom:"16px", padding:"28px", background:"linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.05))", borderColor:"rgba(59,130,246,0.3)", textAlign:"center" }}>
          <div style={{ fontSize:"32px", marginBottom:"8px" }}>🎓</div>
          <h2 style={{ fontSize:"28px", fontWeight:900, marginBottom:"4px" }}>ExamGuru AI</h2>
          <p className="print-muted" style={{ fontSize:"14px", color:"var(--text-muted)" }}>Performance Report Card</p>
          <div style={{ display:"flex", justifyContent:"center", gap:"16px", marginTop:"16px", flexWrap:"wrap" }}>
            <div><span style={{ fontWeight:700 }}>Student:</span> {user.name}</div>
            <div><span style={{ fontWeight:700 }}>Exam:</span> {user.examTarget}</div>
            <div><span style={{ fontWeight:700 }}>Date:</span> {new Date().toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}</div>
          </div>
        </div>

        {/* Overall Grade */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"12px", marginBottom:"16px" }}>
          {[
            { label:"Grade", value:grade, color:gradeColor, icon:"🏆" },
            { label:"Avg Score", value:`${Math.round(avgScore)}%`, color:"var(--accent)", icon:"🎯" },
            { label:"Tests", value:stats.total_tests||0, color:"#a78bfa", icon:"📝" },
            { label:"Questions", value:stats.total_questions_asked||0, color:"#10b981", icon:"💬" },
          ].map((s,i) => (
            <div key={i} className="card print-card" style={{ textAlign:"center", border:`1px solid ${s.color}30` }}>
              <div style={{ fontSize:"20px" }}>{s.icon}</div>
              <div style={{ fontSize:"24px", fontWeight:900, color:s.color }}>{s.value}</div>
              <div className="print-muted" style={{ fontSize:"11px", color:"var(--text-muted)", fontWeight:700 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Subject Performance */}
        <div className="card print-card fade-in" style={{ marginBottom:"16px" }}>
          <h3 style={{ fontSize:"15px", fontWeight:800, marginBottom:"14px" }}>📊 Subject Performance</h3>
          {subjectPerf.length === 0 ? (
            <p className="print-muted" style={{ color:"var(--text-muted)", fontSize:"13px" }}>Abhi tak koi data nahi</p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {subjectPerf.map((s,i) => {
                const pct = Math.round(s.avg_pct);
                const c = pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
                return (
                  <div key={i}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                      <span style={{ fontSize:"13px", fontWeight:700 }}>{s.subject}</span>
                      <span style={{ fontSize:"13px", fontWeight:900, color:c }}>{pct}% ({s.attempts} tests)</span>
                    </div>
                    <div style={{ height:"8px", background:"var(--bg-secondary)", borderRadius:"4px", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:c, borderRadius:"4px" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Tests */}
        <div className="card print-card fade-in" style={{ marginBottom:"16px" }}>
          <h3 style={{ fontSize:"15px", fontWeight:800, marginBottom:"14px" }}>📋 Recent Test Results</h3>
          {recentTests.length === 0 ? (
            <p className="print-muted" style={{ color:"var(--text-muted)", fontSize:"13px" }}>Koi test nahi diya abhi tak</p>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"13px" }}>
              <thead>
                <tr style={{ borderBottom:"2px solid var(--border)" }}>
                  {["Subject","Score","Percentage","Date"].map(h => (
                    <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontWeight:800, color:"var(--text-muted)", fontSize:"12px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTests.map((t,i) => {
                  const pct = t.pct || 0;
                  const c = pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
                  return (
                    <tr key={i} style={{ borderBottom:"1px solid var(--border)" }}>
                      <td style={{ padding:"10px 12px", fontWeight:700 }}>{t.subject}</td>
                      <td style={{ padding:"10px 12px" }}>{t.score}/{t.total}</td>
                      <td style={{ padding:"10px 12px", fontWeight:900, color:c }}>{pct}%</td>
                      <td style={{ padding:"10px 12px", color:"var(--text-muted)", fontSize:"12px" }}>
                        {t.completed_at ? new Date(t.completed_at).toLocaleDateString("en-IN") : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Weak Topics */}
        {weakTopics.length > 0 && (
          <div className="card print-card fade-in" style={{ marginBottom:"16px", borderColor:"rgba(245,158,11,0.3)" }}>
            <h3 style={{ fontSize:"15px", fontWeight:800, marginBottom:"12px" }}>⚠️ Areas Needing Attention</h3>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
              {weakTopics.map((t,i) => (
                <span key={i} style={{ padding:"5px 12px", borderRadius:"20px", background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", fontSize:"12px", fontWeight:700, color:"#fbbf24" }}>
                  {t.subject}: {t.topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        <div className="card print-card fade-in" style={{ background:"linear-gradient(135deg, rgba(16,185,129,0.05), rgba(59,130,246,0.05))", borderColor:"rgba(16,185,129,0.2)" }}>
          <h3 style={{ fontSize:"15px", fontWeight:800, marginBottom:"12px" }}>🤖 AI Recommendations</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            {[
              avgScore >= 75 ? "✅ Excellent performance! Consistency maintain karo aur advanced topics explore karo." : avgScore >= 50 ? "📈 Good progress! Weak topics pe focus karo aur daily practice karo." : "💪 Practice aur improvement ki zaroorat hai. Regular AI sessions se score improve hoga.",
              weakTopics.length > 0 ? `🎯 Priority: ${weakTopics.slice(0,3).map(t => t.topic).join(", ")} pe extra practice karo.` : "🌟 Koi major weak topic nahi — balanced preparation chal rahi hai!",
              stats.total_tests >= 10 ? "🏋️ Regular testing excellent hai — mock tests continue karo." : "📝 Zyada mock tests do — har test se improvement hogi.",
              "🎙️ Voice tutor use karo concepts ko better samajhne ke liye.",
              "📸 Doubt scanner se notebook ke questions directly solve karo."
            ].map((rec, i) => (
              <div key={i} style={{ padding:"10px 14px", background:"var(--bg-secondary)", borderRadius:"8px", fontSize:"13px", color:"var(--text-secondary)", lineHeight:"1.5" }}>
                {rec}
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign:"center", marginTop:"20px", fontSize:"11px", color:"var(--text-muted)" }}>
          Generated by ExamGuru AI • {new Date().toLocaleString("en-IN")}
        </div>
      </div>
    </div>
  );
}
