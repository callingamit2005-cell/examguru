import React, { useState } from "react";
import { useUser } from "../hooks/useUser";
import API from "../utils/api";

const EXAM_TRENDS = {
  JEE: {
    Physics:     [{ topic:"Mechanics", freq:28, trend:"↑", years:"2019-2024" },{ topic:"Electrostatics",freq:22,trend:"↑",years:"2020-2024" },{ topic:"Modern Physics",freq:18,trend:"→",years:"2018-2024" },{ topic:"Optics",freq:15,trend:"↓",years:"2017-2022" },{ topic:"Thermodynamics",freq:12,trend:"↑",years:"2021-2024" }],
    Chemistry:   [{ topic:"Organic Chemistry",freq:35,trend:"↑",years:"2019-2024" },{ topic:"Coordination Compounds",freq:20,trend:"↑",years:"2020-2024" },{ topic:"Electrochemistry",freq:15,trend:"→",years:"2018-2023" }],
    Mathematics: [{ topic:"Calculus",freq:30,trend:"↑",years:"2019-2024" },{ topic:"Coordinate Geometry",freq:25,trend:"→",years:"2018-2024" },{ topic:"Probability",freq:20,trend:"↑",years:"2021-2024" }],
  },
  NEET: {
    Biology:     [{ topic:"Human Physiology",freq:40,trend:"↑",years:"2019-2024" },{ topic:"Genetics",freq:25,trend:"↑",years:"2020-2024" },{ topic:"Cell Biology",freq:20,trend:"→",years:"2018-2023" }],
    Physics:     [{ topic:"Mechanics",freq:25,trend:"→",years:"2019-2024" },{ topic:"Modern Physics",freq:20,trend:"↑",years:"2021-2024" }],
    Chemistry:   [{ topic:"Biomolecules",freq:30,trend:"↑",years:"2020-2024" },{ topic:"Organic Chemistry",freq:25,trend:"↑",years:"2019-2024" }],
  },
  UPSC: {
    History:     [{ topic:"Modern India",freq:35,trend:"↑",years:"2019-2024" },{ topic:"Art & Culture",freq:28,trend:"↑",years:"2020-2024" }],
    Polity:      [{ topic:"Constitutional Amendments",freq:30,trend:"↑",years:"2020-2024" },{ topic:"Governance",freq:25,trend:"↑",years:"2021-2024" }],
    Economy:     [{ topic:"Budget & Fiscal Policy",freq:32,trend:"↑",years:"2021-2024" },{ topic:"Agriculture",freq:20,trend:"→",years:"2019-2023" }],
  }
};

export default function ExamPrediction() {
  const { user } = useUser();
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const examType = user?.examTarget;
  const trends = EXAM_TRENDS[examType] || EXAM_TRENDS.UPSC;
  const subjects = Object.keys(trends);

  const getPrediction = async (subject) => {
    setSelectedSubject(subject);
    setLoading(true);
    setPrediction(null);
    try {
      const topTopics = trends[subject].slice(0,3).map(t => t.topic).join(", ");
      const res = await API.post("/chat/message", {
        userId: user.id,
        message: `${examType} ${subject} mein 2025-2026 mein kaunse topics aane ki highest probability hai? Past trends: ${topTopics}. Short prediction do with probability %.`,
        examType,
        subject
      });
      setPrediction(res.data.response);
    } catch {
      setPrediction("AI prediction temporarily unavailable. Past trends dekho!");
    } finally {
      setLoading(false);
    }
  };

  const trendIcon = (t) => t === "↑" ? "🔺" : t === "↓" ? "🔻" : "➡️";
  const trendColor = (t) => t === "↑" ? "#10b981" : t === "↓" ? "#ef4444" : "#f59e0b";

  return (
    <div style={{ padding:"24px", overflowY:"auto", maxHeight:"100vh" }}>
      <div style={{ marginBottom:"20px" }}>
        <h1 style={{ fontSize:"22px", fontWeight:900, marginBottom:"4px" }}>🔮 Exam Prediction Engine</h1>
        <p style={{ color:"var(--text-secondary)", fontSize:"13px" }}>Past papers analyze karke future topics predict karta hai — {examType} ke liye</p>
      </div>

      {/* Info banner */}
      <div style={{ padding:"12px 16px", borderRadius:"10px", background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.2)", marginBottom:"20px", display:"flex", gap:"10px", alignItems:"flex-start" }}>
        <span style={{ fontSize:"20px" }}>💡</span>
        <div style={{ fontSize:"13px", color:"var(--text-secondary)", lineHeight:"1.6" }}>
          <strong style={{ color:"var(--text-primary)" }}>Kaise kaam karta hai:</strong> 2015-2024 ke past papers analyze karke AI predict karta hai ki 2025-2026 mein kaunse topics aane ki zyada chances hain. <strong style={{ color:"#f59e0b" }}>High frequency + Upward trend = Must prepare!</strong>
        </div>
      </div>

      {/* Subject cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))", gap:"16px", marginBottom:"20px" }}>
        {subjects.map(subject => {
          const topicList = trends[subject];
          const hotTopic = topicList[0];
          return (
            <div key={subject} className="card fade-in" style={{
              border:`1px solid ${selectedSubject===subject ? "var(--accent)" : "var(--border)"}`,
              background: selectedSubject===subject ? "var(--accent-glow)" : "var(--bg-card)",
              cursor:"pointer", transition:"all 0.2s"
            }} onClick={() => getPrediction(subject)}>
              <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"14px" }}>
                <h3 style={{ fontSize:"15px", fontWeight:800, flex:1 }}>{subject}</h3>
                <span style={{ fontSize:"11px", padding:"3px 10px", borderRadius:"20px", background:"rgba(239,68,68,0.1)", color:"#f87171", fontWeight:700 }}>
                  🔥 Hot
                </span>
              </div>

              {/* Topic frequency bars */}
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                {topicList.slice(0,4).map((t, i) => (
                  <div key={i}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"3px" }}>
                      <span style={{ fontSize:"12px", fontWeight:700 }}>{t.topic}</span>
                      <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                        <span style={{ fontSize:"12px", color:trendColor(t.trend) }}>{trendIcon(t.trend)}</span>
                        <span style={{ fontSize:"11px", color:"var(--text-muted)" }}>{t.freq}%</span>
                      </div>
                    </div>
                    <div style={{ height:"5px", background:"var(--bg-secondary)", borderRadius:"3px", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${t.freq}%`, background: i===0 ? "#ef4444" : i===1 ? "#f97316" : i===2 ? "#f59e0b" : "#10b981", borderRadius:"3px", transition:"width 0.8s ease" }}/>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop:"12px", padding:"8px 12px", background:"var(--bg-secondary)", borderRadius:"8px", fontSize:"12px", color:"var(--text-muted)" }}>
                🎯 <strong style={{ color:"var(--text-primary)" }}>{hotTopic.topic}</strong> — {hotTopic.years} mein consistently aaya
              </div>

              {selectedSubject === subject && (
                <div style={{ marginTop:"10px", textAlign:"center" }}>
                  <span style={{ fontSize:"12px", color:"var(--accent)", fontWeight:700 }}>✅ AI Prediction loading...</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* AI Prediction result */}
      {(loading || prediction) && (
        <div className="card fade-in" style={{ borderColor:"rgba(99,102,241,0.3)", background:"rgba(99,102,241,0.04)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"12px" }}>
            <div style={{ width:"36px", height:"36px", borderRadius:"10px", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>🔮</div>
            <div>
              <div style={{ fontWeight:800, fontSize:"14px" }}>AI Prediction — {selectedSubject}</div>
              <div style={{ fontSize:"11px", color:"var(--text-muted)" }}>Based on 10 years of past papers</div>
            </div>
          </div>
          {loading ? (
            <div style={{ display:"flex", gap:"8px", alignItems:"center", color:"var(--text-muted)", fontSize:"13px" }}>
              <div className="loader" style={{ width:"16px", height:"16px" }}/> AI analyze kar raha hai...
            </div>
          ) : (
            <div style={{ fontSize:"14px", lineHeight:"1.8", color:"var(--text-primary)", whiteSpace:"pre-wrap" }}>
              {prediction?.replace(/\*\*/g, "").replace(/#{1,3}\s/g, "")}
            </div>
          )}
        </div>
      )}

      {/* Study tip */}
      <div style={{ marginTop:"20px", padding:"16px", borderRadius:"12px", background:"linear-gradient(135deg,rgba(16,185,129,0.08),rgba(59,130,246,0.05))", border:"1px solid rgba(16,185,129,0.2)" }}>
        <h3 style={{ fontSize:"14px", fontWeight:800, marginBottom:"10px" }}>🏆 Smart Preparation Strategy</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
          {[
            { icon:"🔴", text:"High freq + ↑ trend → Must prepare (70% priority)" },
            { icon:"🟡", text:"High freq + → trend → Important (20% priority)" },
            { icon:"🟢", text:"Low freq + ↑ trend → New topic, prepare karo" },
            { icon:"⚪", text:"Low freq + ↓ trend → Skip or quick revision" },
          ].map((t,i) => (
            <div key={i} style={{ padding:"8px 12px", background:"var(--bg-secondary)", borderRadius:"8px", fontSize:"12px", color:"var(--text-secondary)", display:"flex", gap:"8px" }}>
              <span>{t.icon}</span><span>{t.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
