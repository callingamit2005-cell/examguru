import React, { useState, useRef } from "react";
import { useUser } from "../hooks/useUser";
import { useAppData } from "../hooks/useAppData";
import API from "../utils/api";

export default function ProgressReport() {
  const { user } = useUser();
  const { profile, analytics } = useAppData();
  const [aiReport, setAiReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const reportRef = useRef(null);

  const stats    = profile?.stats || {};
  const weakTopics = profile?.weakTopics || [];
  const tests    = analytics?.recentTests || [];
  const avgScore = stats.avg_score ? Math.round(stats.avg_score) : 0;
  const totalTests = stats.total_tests || 0;
  const totalQs  = stats.total_questions_asked || 0;

  // Score trend
  const trend = tests.slice(-7).map((t,i) => ({ week:`Test ${i+1}`, score: Math.round(t.pct||0) }));
  const improving = trend.length >= 2 && trend[trend.length-1].score > trend[0].score;

  const generateReport = async () => {
    setLoading(true);
    try {
      const res = await API.post("/chat/message", {
        userId: user.id,
        message: `Generate a detailed weekly progress report for this student:
- Name: ${user.name}
- Exam: ${user.examTarget}
- Total tests: ${totalTests}
- Average score: ${avgScore}%
- Questions asked: ${totalQs}
- Weak topics: ${weakTopics.slice(0,5).map(t=>t.topic).join(", ") || "None identified"}
- Score trend: ${improving ? "Improving" : "Needs improvement"}

Write in Hinglish. Include:
1. Overall performance summary
2. Strengths (kya achha kar rahe ho)
3. Areas to improve (weak topics)
4. Next week ka action plan (3 specific steps)
5. Motivational closing line`,
        examType: user.examTarget,
        subject: "General"
      });
      setAiReport(res.data.response?.replace(/\*\*/g,"").replace(/#{1,3}\s/g,"") || "");
      setGenerated(true);
    } catch { setAiReport("Report generate nahi ho saka. Dobara try karo!"); }
    finally { setLoading(false); }
  };

  const printReport = () => {
    const content = reportRef.current?.innerHTML;
    const w = window.open("", "_blank");
    w.document.write(`
      <html><head><title>ExamGuru Progress Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; color: #1e293b; max-width: 800px; margin: 0 auto; }
        h1 { color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; }
        .stat { display: inline-block; background: #f1f5f9; padding: 10px 20px; border-radius: 8px; margin: 6px; text-align: center; }
        .stat-num { font-size: 28px; font-weight: 900; color: #3b82f6; }
        .stat-label { font-size: 11px; color: #64748b; }
        .section { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 14px; margin: 14px 0; border-radius: 0 8px 8px 0; }
        .weak { color: #ef4444; } .strong { color: #10b981; }
        pre { white-space: pre-wrap; font-family: Arial; line-height: 1.8; }
      </style></head>
      <body>${content}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 500);
  };

  return (
    <div style={{ padding:"24px", overflowY:"auto", maxHeight:"100vh" }}>
      <div style={{ marginBottom:"20px" }}>
        <h1 style={{ fontSize:"22px", fontWeight:900, marginBottom:"4px" }}>📊 AI Progress Report</h1>
        <p style={{ color:"var(--text-secondary)", fontSize:"13px" }}>Weekly performance analysis — AI se personalized feedback lo</p>
      </div>

      {/* Stats cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px", marginBottom:"20px" }}>
        {[
          { icon:"📝", v:totalTests,  l:"Tests Diye",    c:"var(--accent)" },
          { icon:"🎯", v:`${avgScore}%`, l:"Avg Score",  c:"#10b981" },
          { icon:"💬", v:totalQs,     l:"AI Questions",  c:"#f59e0b" },
        ].map((s,i) => (
          <div key={i} className="card" style={{ textAlign:"center" }}>
            <div style={{ fontSize:"22px", marginBottom:"4px" }}>{s.icon}</div>
            <div style={{ fontSize:"24px", fontWeight:900, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:"11px", color:"var(--text-muted)", fontWeight:700 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Score trend bars */}
      {trend.length > 0 && (
        <div className="card" style={{ marginBottom:"16px" }}>
          <div style={{ fontSize:"13px", fontWeight:800, marginBottom:"12px" }}>
            📈 Score Trend {improving ? "🔼 Improving!" : "📉 Needs Work"}
          </div>
          <div style={{ display:"flex", gap:"8px", alignItems:"flex-end", height:"80px" }}>
            {trend.map((t,i) => (
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"4px" }}>
                <div style={{ fontSize:"10px", color:"var(--accent)", fontWeight:700 }}>{t.score}%</div>
                <div style={{ width:"100%", borderRadius:"4px 4px 0 0", transition:"height 0.5s",
                  height:`${Math.max(8,t.score*0.6)}px`,
                  background:`linear-gradient(180deg,${t.score>=60?"#10b981":"#ef4444"},${t.score>=60?"#10b981aa":"#ef4444aa"})` }}/>
                <div style={{ fontSize:"9px", color:"var(--text-muted)" }}>{t.week}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weak topics */}
      {weakTopics.length > 0 && (
        <div className="card" style={{ marginBottom:"16px", borderColor:"rgba(239,68,68,0.2)", background:"rgba(239,68,68,0.02)" }}>
          <div style={{ fontSize:"13px", fontWeight:800, marginBottom:"10px", color:"#f87171" }}>⚠️ Focus Areas</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
            {weakTopics.slice(0,6).map((t,i) => (
              <span key={i} style={{ padding:"4px 12px", borderRadius:"20px", fontSize:"12px",
                background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)",
                color:"#f87171", fontWeight:700 }}>
                {t.topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Generate button */}
      {!generated && (
        <button className="btn btn-primary" onClick={generateReport} disabled={loading}
          style={{ width:"100%", justifyContent:"center", padding:"14px", fontSize:"15px", marginBottom:"16px" }}>
          {loading
            ? <><div className="loader" style={{width:"16px",height:"16px"}}/> AI Report Bana Raha Hai...</>
            : "🤖 AI Progress Report Generate Karo"}
        </button>
      )}

      {/* AI Report */}
      {aiReport && (
        <div ref={reportRef}>
          {/* Printable header */}
          <div className="card fade-in" style={{ marginBottom:"16px", background:"linear-gradient(135deg,rgba(59,130,246,0.08),rgba(99,102,241,0.04))", borderColor:"rgba(59,130,246,0.3)" }}>
            <div style={{ textAlign:"center", marginBottom:"16px", paddingBottom:"16px", borderBottom:"1px solid var(--border)" }}>
              <div style={{ fontSize:"20px", fontWeight:900, marginBottom:"4px" }}>🎓 ExamGuru AI — Progress Report</div>
              <div style={{ fontSize:"13px", color:"var(--text-muted)" }}>
                {user.name} • {user.examTarget} • {new Date().toLocaleDateString("en-IN", {day:"numeric",month:"long",year:"numeric"})}
              </div>
            </div>

            {/* Mini stats for print */}
            <div style={{ display:"flex", gap:"12px", marginBottom:"16px", flexWrap:"wrap" }}>
              {[
                {l:"Tests",v:totalTests,c:"var(--accent)"},
                {l:"Avg Score",v:`${avgScore}%`,c:"#10b981"},
                {l:"Trend",v:improving?"↑ Up":"→ Flat",c:improving?"#10b981":"#f59e0b"},
                {l:"Weak Topics",v:weakTopics.length,c:"#ef4444"},
              ].map((s,i) => (
                <div key={i} style={{ padding:"8px 14px", borderRadius:"8px", background:"var(--bg-secondary)",
                  border:"1px solid var(--border)", textAlign:"center", flex:1, minWidth:"80px" }}>
                  <div style={{ fontSize:"18px", fontWeight:900, color:s.c }}>{s.v}</div>
                  <div style={{ fontSize:"10px", color:"var(--text-muted)" }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* AI analysis */}
            <div style={{ fontSize:"10px", fontWeight:800, color:"var(--accent)", marginBottom:"8px" }}>🤖 AI ANALYSIS</div>
            <div style={{ fontSize:"13px", lineHeight:"1.9", color:"var(--text-secondary)", whiteSpace:"pre-wrap" }}>
              {aiReport}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display:"flex", gap:"10px" }}>
            <button className="btn btn-primary" onClick={printReport} style={{ flex:1, justifyContent:"center" }}>
              🖨️ Print / Save PDF
            </button>
            <button className="btn btn-secondary" onClick={() => { setGenerated(false); setAiReport(""); }} style={{ flex:1, justifyContent:"center" }}>
              🔄 New Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
