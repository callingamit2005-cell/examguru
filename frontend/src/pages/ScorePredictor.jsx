import React, { useState, useEffect } from "react";
import { useUser } from "../hooks/useUser";
import { useAppData } from "../hooks/useAppData";
import { userAPI, analyticsAPI } from "../utils/api";
import API from "../utils/api";

const EXAM_MAX_SCORES = {
  JEE:     { max:300, cutoff:{ general:90, obc:75, sc:60 } },
  NEET:    { max:720, cutoff:{ general:550, obc:500, sc:450 } },
  UPSC:    { max:2025, cutoff:{ general:950, obc:920, sc:890 } },
  UP_PCS:  { max:400, cutoff:{ general:220, obc:200, sc:180 } },
  SSC_CGL: { max:200, cutoff:{ general:145, obc:135, sc:125 } },
  default: { max:100, cutoff:{ general:60, obc:55, sc:50 } },
};

const MOTIVATIONAL = {
  excellent: ["🔥 Bahut zabardast! Rank aayegi!","⭐ Top performer! Keep going!","🏆 Cut-off clear hoga!"],
  good:      ["💪 Achhi taiyari! Aur mehnat karo","📈 Sahi raste pe ho — keep pushing","✅ Good score predicted!"],
  average:   ["📚 Weak topics pe focus karo","⚡ Ab se roz 2 ghante extra do","🎯 Cut-off improve ho sakta hai"],
  low:       ["💡 Ab se shuru karo — time hai","🔄 Strategy change karo","📋 Coaching guide le lo"],
};

export default function ScorePredictor() {
  const { user } = useUser();
  const [analyzing, setAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [aiInsight, setAiInsight] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [daysLeft, setDaysLeft] = useState(90);

  const examTarget = user?.examTarget || "default";
  const examCfg = EXAM_MAX_SCORES[examTarget] || EXAM_MAX_SCORES.default;

  const { profile, loading } = useAppData();
  const stats = profile?.stats || {};
  const weakTopics = profile?.weakTopics || [];

  const calculatePrediction = () => {
    setAnalyzing(true);
    setTimeout(() => {
      const avgScore = stats?.avg_score || 0;
      const totalTests = stats?.total_tests || 0;
      const weakCount = weakTopics.length;
      const questionsAsked = stats?.total_questions_asked || 0;

      // Score prediction algorithm
      let basePct = avgScore;
      let consistency = totalTests >= 20 ? 1.1 : totalTests >= 10 ? 1.0 : 0.85;
      let studyDepth = questionsAsked >= 100 ? 1.05 : questionsAsked >= 50 ? 1.0 : 0.9;
      let weakPenalty = Math.min(weakCount * 2, 20); // max 20% penalty

      let predictedPct = Math.min(95, Math.round(basePct * consistency * studyDepth - weakPenalty));
      if (predictedPct < 5) predictedPct = 5;

      const predictedScore = Math.round((predictedPct / 100) * examCfg.max);
      const generalCutoff = examCfg.cutoff.general;
      const cutoffPct = Math.round((generalCutoff / examCfg.max) * 100);

      // Improvement potential
      const improvementPct = Math.min(30, Math.round((weakCount * 3 + (daysLeft / 10))));
      const improvedPct = Math.min(98, predictedPct + improvementPct);
      const improvedScore = Math.round((improvedPct / 100) * examCfg.max);

      const level = predictedPct >= 80 ? "excellent" : predictedPct >= 60 ? "good" : predictedPct >= 40 ? "average" : "low";
      const msgs = MOTIVATIONAL[level];
      const motivMsg = msgs[Math.floor(Math.random() * msgs.length)];

      setPrediction({
        predictedPct, predictedScore,
        improvedPct, improvedScore,
        cutoffPct, generalCutoff,
        level, motivMsg,
        willClearCutoff: predictedScore >= generalCutoff,
        canClearWithImprovement: improvedScore >= generalCutoff,
        factors: {
          consistency: Math.round(consistency * 100),
          studyDepth: Math.round(studyDepth * 100),
          weakPenalty,
          daysLeftBonus: Math.round(daysLeft / 10)
        }
      });
      setAnalyzing(false);
    }, 1500);
  };

  const getAIInsight = async () => {
    if (!prediction) return;
    setLoadingAI(true);
    try {
      const res = await API.post("/chat/message", {
        userId: user.id,
        message: `${examTarget} student ki performance: avg score ${Math.round(stats?.avg_score||0)}%, ${stats?.total_tests||0} tests diye, ${weakTopics.length} weak topics hain. ${daysLeft} din baaki hain exam mein. Predicted score ${prediction.predictedScore}/${examCfg.max} hai. Specific improvement plan do — week-wise, kya karna chahiye? Hindi mein, short mein.`,
        examType: examTarget,
        subject: "General"
      });
      setAiInsight(res.data.response?.replace(/\*\*/g,"").replace(/#{1,3}\s/g,"") || "");
    } catch { setAiInsight("AI insight unavailable. Apne weak topics pe focus karo!"); }
    finally { setLoadingAI(false); }
  };

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", gap:"12px" }}>
      <div className="loader"/> Loading your data...
    </div>
  );

  const scoreColor = !prediction ? "var(--accent)" :
    prediction.level === "excellent" ? "#10b981" :
    prediction.level === "good" ? "#3b82f6" :
    prediction.level === "average" ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ padding:"24px", overflowY:"auto", maxHeight:"100vh" }}>
      {/* Header */}
      <div style={{ marginBottom:"20px" }}>
        <h1 style={{ fontSize:"22px", fontWeight:900, marginBottom:"4px" }}>🔮 AI Score Predictor</h1>
        <p style={{ color:"var(--text-secondary)", fontSize:"13px" }}>Tumhari performance analyze karke predict karta hai — {examTarget}</p>
      </div>

      {/* Current stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px", marginBottom:"20px" }}>
        {[
          { l:"Tests Diye", v:stats?.total_tests||0, icon:"📝", c:"var(--accent)" },
          { l:"Avg Score", v:`${Math.round(stats?.avg_score||0)}%`, icon:"🎯", c:"#10b981" },
          { l:"Weak Topics", v:weakTopics.length, icon:"⚠️", c:"#f59e0b" },
        ].map((s,i) => (
          <div key={i} className="card" style={{ textAlign:"center" }}>
            <div style={{ fontSize:"20px", marginBottom:"4px" }}>{s.icon}</div>
            <div style={{ fontSize:"22px", fontWeight:900, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:"11px", color:"var(--text-muted)", fontWeight:700 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Days left slider */}
      <div className="card" style={{ marginBottom:"16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
          <label style={{ fontSize:"13px", fontWeight:700 }}>⏳ Exam mein kitne din baaki?</label>
          <span style={{ fontSize:"14px", fontWeight:900, color:"var(--accent)" }}>{daysLeft} din</span>
        </div>
        <input type="range" min="7" max="365" value={daysLeft}
          onChange={e => setDaysLeft(Number(e.target.value))}
          style={{ width:"100%", accentColor:"var(--accent)" }}/>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"10px", color:"var(--text-muted)", marginTop:"4px" }}>
          <span>1 week</span><span>3 months</span><span>1 year</span>
        </div>
      </div>

      {/* Predict button */}
      {!prediction && (
        <button className="btn btn-primary" onClick={calculatePrediction} disabled={analyzing}
          style={{ width:"100%", justifyContent:"center", padding:"14px", fontSize:"15px", marginBottom:"20px" }}>
          {analyzing ? <><div className="loader" style={{width:"16px",height:"16px"}}/> Analyzing...</>
            : "🔮 Score Predict Karo"}
        </button>
      )}

      {/* Prediction result */}
      {prediction && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          {/* Main prediction card */}
          <div className="card fade-in" style={{ textAlign:"center", padding:"32px",
            background:`linear-gradient(135deg,${scoreColor}12,${scoreColor}05)`,
            border:`2px solid ${scoreColor}35` }}>
            <div style={{ fontSize:"13px", fontWeight:800, color:scoreColor, marginBottom:"8px", textTransform:"uppercase" }}>
              🔮 Predicted Score (Current Performance)
            </div>
            <div style={{ fontSize:"64px", fontWeight:900, color:scoreColor, lineHeight:1, marginBottom:"8px" }}>
              {prediction.predictedScore}
            </div>
            <div style={{ fontSize:"16px", color:"var(--text-secondary)", marginBottom:"4px" }}>
              out of {examCfg.max} ({prediction.predictedPct}%)
            </div>
            <div style={{ fontSize:"14px", fontWeight:700, marginBottom:"16px",
              color: prediction.willClearCutoff ? "#10b981" : "#ef4444" }}>
              {prediction.willClearCutoff ? "✅ Cut-off clear hoga!" : "❌ Cut-off miss ho sakta hai"}
            </div>
            <div style={{ fontSize:"13px", color:"var(--text-muted)", padding:"8px 16px",
              background:"var(--bg-secondary)", borderRadius:"8px", display:"inline-block" }}>
              {prediction.motivMsg}
            </div>
          </div>

          {/* With improvement */}
          <div className="card fade-in" style={{ background:"linear-gradient(135deg,rgba(16,185,129,0.08),rgba(16,185,129,0.03))", borderColor:"rgba(16,185,129,0.3)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
              <div style={{ textAlign:"center", minWidth:"80px" }}>
                <div style={{ fontSize:"32px", fontWeight:900, color:"#10b981" }}>{prediction.improvedScore}</div>
                <div style={{ fontSize:"10px", color:"var(--text-muted)", fontWeight:700 }}>WITH EFFORT</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:"14px", marginBottom:"4px" }}>
                  🚀 Agar aaj se {daysLeft} din mehnat karo
                </div>
                <div style={{ fontSize:"12px", color:"var(--text-secondary)" }}>
                  +{prediction.improvementPct || prediction.improvedPct - prediction.predictedPct}% improvement possible
                </div>
                <div style={{ fontSize:"12px", fontWeight:700, color: prediction.canClearWithImprovement?"#10b981":"#f59e0b", marginTop:"4px" }}>
                  {prediction.canClearWithImprovement ? "✅ Cut-off clear ho sakta hai!" : "⚡ Aur mehnat chahiye"}
                </div>
              </div>
            </div>
          </div>

          {/* Score comparison bars */}
          <div className="card fade-in">
            <h3 style={{ fontSize:"14px", fontWeight:800, marginBottom:"14px" }}>📊 Score Comparison</h3>
            {[
              { l:"Your Current", pct:prediction.predictedPct, c:scoreColor },
              { l:"With Improvement", pct:prediction.improvedPct, c:"#10b981" },
              { l:"Cut-off (General)", pct:prediction.cutoffPct, c:"#f59e0b" },
            ].map((s,i) => (
              <div key={i} style={{ marginBottom:"12px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                  <span style={{ fontSize:"12px", fontWeight:700 }}>{s.l}</span>
                  <span style={{ fontSize:"12px", fontWeight:900, color:s.c }}>{s.pct}%</span>
                </div>
                <div style={{ height:"10px", background:"var(--bg-secondary)", borderRadius:"5px", overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${s.pct}%`, background:s.c, borderRadius:"5px", transition:"width 1s ease" }}/>
                </div>
              </div>
            ))}
          </div>

          {/* Factors */}
          <div className="card fade-in">
            <h3 style={{ fontSize:"14px", fontWeight:800, marginBottom:"12px" }}>🔍 Score Factors</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
              {[
                { l:"Consistency", v:`${prediction.factors.consistency}%`, icon:"📈", good:prediction.factors.consistency>=100 },
                { l:"Study Depth", v:`${prediction.factors.studyDepth}%`, icon:"📚", good:prediction.factors.studyDepth>=100 },
                { l:"Weak Penalty", v:`-${prediction.factors.weakPenalty}%`, icon:"⚠️", good:prediction.factors.weakPenalty<10 },
                { l:"Time Bonus", v:`+${prediction.factors.daysLeftBonus}%`, icon:"⏳", good:prediction.factors.daysLeftBonus>5 },
              ].map((f,i) => (
                <div key={i} style={{ padding:"10px 12px", borderRadius:"8px",
                  background: f.good?"rgba(16,185,129,0.08)":"rgba(239,68,68,0.05)",
                  border:`1px solid ${f.good?"rgba(16,185,129,0.2)":"rgba(239,68,68,0.15)"}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:"12px", color:"var(--text-secondary)" }}>{f.icon} {f.l}</span>
                    <span style={{ fontSize:"13px", fontWeight:900, color:f.good?"#10b981":"#f87171" }}>{f.v}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Improvement Plan */}
          <div className="card fade-in">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
              <h3 style={{ fontSize:"14px", fontWeight:800 }}>🤖 AI Improvement Plan</h3>
              {!aiInsight && (
                <button onClick={getAIInsight} disabled={loadingAI} className="btn btn-primary" style={{ fontSize:"12px", padding:"6px 14px" }}>
                  {loadingAI ? <><div className="loader" style={{width:"12px",height:"12px"}}/></> : "Generate"}
                </button>
              )}
            </div>
            {loadingAI && <div style={{ display:"flex", gap:"8px", alignItems:"center", color:"var(--text-muted)", fontSize:"13px" }}><div className="loader" style={{width:"14px",height:"14px"}}/> AI plan bana raha hai...</div>}
            {aiInsight && (
              <div style={{ fontSize:"13px", lineHeight:"1.8", color:"var(--text-secondary)", whiteSpace:"pre-wrap" }}>
                {aiInsight}
              </div>
            )}
            {!aiInsight && !loadingAI && (
              <p style={{ color:"var(--text-muted)", fontSize:"13px" }}>Click "Generate" — AI tumhare liye personalized plan banega</p>
            )}
          </div>

          {/* Recalculate */}
          <button className="btn btn-secondary" onClick={() => { setPrediction(null); setAiInsight(""); }}
            style={{ justifyContent:"center" }}>
            🔄 Dobara Calculate Karo
          </button>
        </div>
      )}
    </div>
  );
}
