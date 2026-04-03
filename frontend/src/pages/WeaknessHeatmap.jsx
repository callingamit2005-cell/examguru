import React, { useState, useEffect } from "react";
import { userAPI, analyticsAPI } from "../utils/api";
import { useUser } from "../hooks/useUser";
import { useAppData } from "../hooks/useAppData";

const INTENSITY_COLORS = [
  { min:0,   max:0,   bg:"var(--bg-secondary)", label:"No Data",   text:"var(--text-muted)" },
  { min:1,   max:2,   bg:"rgba(16,185,129,0.2)",  label:"Strong",   text:"#10b981" },
  { min:3,   max:4,   bg:"rgba(245,158,11,0.25)", label:"OK",        text:"#f59e0b" },
  { min:5,   max:7,   bg:"rgba(249,115,22,0.3)",  label:"Weak",      text:"#f97316" },
  { min:8,   max:99,  bg:"rgba(239,68,68,0.35)",  label:"Critical",  text:"#ef4444" },
];

function getIntensity(wrongCount) {
  return INTENSITY_COLORS.find(c => wrongCount >= c.min && wrongCount <= c.max) || INTENSITY_COLORS[0];
}

function HeatCell({ topic, wrongCount, onClick, isSelected }) {
  const intensity = getIntensity(wrongCount);
  return (
    <div
      onClick={onClick}
      title={`${topic}: ${wrongCount} galat`}
      style={{
        padding:"8px 10px", borderRadius:"8px",
        background: isSelected ? "var(--accent)" : intensity.bg,
        border:`1px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
        cursor:"pointer", transition:"all 0.2s",
        transform: isSelected ? "scale(1.05)" : "scale(1)"
      }}>
      <div style={{ fontSize:"11px", fontWeight:700, color: isSelected ? "white" : intensity.text, lineHeight:"1.3" }}>
        {topic.length > 14 ? topic.slice(0,14)+"…" : topic}
      </div>
      {wrongCount > 0 && (
        <div style={{ fontSize:"10px", color: isSelected ? "rgba(255,255,255,0.8)" : "var(--text-muted)", marginTop:"2px" }}>
          {wrongCount}x galat
        </div>
      )}
    </div>
  );
}

export default function WeaknessHeatmap() {
  const { user } = useUser();
  const { profile, analytics, loading } = useAppData();
  const weakTopics = profile?.weakTopics || [];
  const subjectPerf = analytics?.subjectPerformance || [];
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("heatmap");

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", gap:"12px" }}>
      <div className="loader"/> Loading heatmap...
    </div>
  );

  // Group by subject
  const bySubject = weakTopics.reduce((acc, t) => {
    if (!acc[t.subject]) acc[t.subject] = [];
    acc[t.subject].push(t);
    return acc;
  }, {});

  // Stats
  const critical = weakTopics.filter(t => t.wrong_count >= 8).length;
  const weak     = weakTopics.filter(t => t.wrong_count >= 5 && t.wrong_count < 8).length;
  const ok       = weakTopics.filter(t => t.wrong_count >= 3 && t.wrong_count < 5).length;
  const strong   = weakTopics.filter(t => t.wrong_count < 3).length;

  const maxWrong = Math.max(...weakTopics.map(t => t.wrong_count), 1);

  return (
    <div style={{ padding:"24px", overflowY:"auto", maxHeight:"100vh" }}>
      {/* Header */}
      <div style={{ marginBottom:"20px" }}>
        <h1 style={{ fontSize:"22px", fontWeight:900, marginBottom:"4px" }}>🔥 Weakness Heatmap</h1>
        <p style={{ color:"var(--text-secondary)", fontSize:"13px" }}>Tumhare weak areas ka visual map — dekho kahan focus karna hai</p>
      </div>

      {/* Summary pills */}
      <div style={{ display:"flex", gap:"10px", marginBottom:"20px", flexWrap:"wrap" }}>
        {[
          { label:"Critical", count:critical, color:"#ef4444", bg:"rgba(239,68,68,0.1)", icon:"🔴" },
          { label:"Weak",     count:weak,     color:"#f97316", bg:"rgba(249,115,22,0.1)", icon:"🟠" },
          { label:"OK",       count:ok,       color:"#f59e0b", bg:"rgba(245,158,11,0.1)", icon:"🟡" },
          { label:"Strong",   count:strong,   color:"#10b981", bg:"rgba(16,185,129,0.1)", icon:"🟢" },
        ].map(s => (
          <div key={s.label} style={{ padding:"8px 16px", borderRadius:"20px", background:s.bg, border:`1px solid ${s.color}40`, display:"flex", alignItems:"center", gap:"8px" }}>
            <span>{s.icon}</span>
            <span style={{ fontSize:"13px", fontWeight:800, color:s.color }}>{s.count} {s.label}</span>
          </div>
        ))}
        <div style={{ padding:"8px 16px", borderRadius:"20px", background:"var(--bg-card)", border:"1px solid var(--border)", fontSize:"13px", fontWeight:700, color:"var(--text-muted)" }}>
          Total: {weakTopics.length} topics tracked
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"4px", background:"var(--bg-secondary)", borderRadius:"10px", padding:"4px", marginBottom:"20px", width:"fit-content" }}>
        {["heatmap","subject","timeline"].map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding:"7px 16px", borderRadius:"8px", border:"none",
            background: view===v ? "var(--accent)" : "transparent",
            color: view===v ? "white" : "var(--text-muted)",
            fontWeight:700, fontSize:"12px", fontFamily:"var(--font-main)",
            cursor:"pointer", textTransform:"capitalize", transition:"all 0.15s"
          }}>
            {v === "heatmap" ? "🗺️ Heatmap" : v === "subject" ? "📊 Subject" : "📈 Progress"}
          </button>
        ))}
      </div>

      {/* HEATMAP VIEW */}
      {view === "heatmap" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
          {weakTopics.length === 0 ? (
            <div className="card" style={{ textAlign:"center", padding:"60px" }}>
              <div style={{ fontSize:"48px", marginBottom:"12px" }}>🌟</div>
              <h3 style={{ fontSize:"18px", fontWeight:800, marginBottom:"8px" }}>Koi weak topic nahi!</h3>
              <p style={{ color:"var(--text-secondary)" }}>Mock tests do — AI automatically weak areas track karega</p>
            </div>
          ) : (
            Object.entries(bySubject).map(([subject, topics]) => {
              const subjectAvg = subjectPerf.find(s => s.subject === subject)?.avg_pct || 0;
              const subjectColor = subjectAvg >= 75 ? "#10b981" : subjectAvg >= 50 ? "#f59e0b" : "#ef4444";
              return (
                <div key={subject} className="card fade-in">
                  <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"14px" }}>
                    <h3 style={{ fontSize:"15px", fontWeight:800, flex:1 }}>{subject}</h3>
                    {subjectAvg > 0 && (
                      <div style={{ padding:"4px 12px", borderRadius:"20px", background:`${subjectColor}15`, border:`1px solid ${subjectColor}40`, fontSize:"12px", fontWeight:800, color:subjectColor }}>
                        {Math.round(subjectAvg)}% avg
                      </div>
                    )}
                    <div style={{ fontSize:"12px", color:"var(--text-muted)" }}>{topics.length} weak topics</div>
                  </div>

                  {/* Heat grid */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(110px, 1fr))", gap:"6px" }}>
                    {topics.sort((a,b) => b.wrong_count - a.wrong_count).map((t, i) => (
                      <HeatCell
                        key={i}
                        topic={t.topic}
                        wrongCount={t.wrong_count}
                        isSelected={selected?.topic === t.topic}
                        onClick={() => setSelected(selected?.topic === t.topic ? null : t)}
                      />
                    ))}
                  </div>

                  {/* Selected topic detail */}
                  {selected && topics.some(t => t.topic === selected.topic) && (
                    <div className="fade-in" style={{ marginTop:"14px", padding:"14px", background:"var(--bg-secondary)", borderRadius:"10px", border:"1px solid var(--border-light)" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"10px" }}>
                        <span style={{ fontSize:"18px" }}>🎯</span>
                        <div>
                          <div style={{ fontWeight:800, fontSize:"14px" }}>{selected.topic}</div>
                          <div style={{ fontSize:"12px", color:"var(--text-muted)" }}>{selected.wrong_count} baar galat kiya</div>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div style={{ marginBottom:"10px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>
                          <span>Weakness Level</span>
                          <span>{getIntensity(selected.wrong_count).label}</span>
                        </div>
                        <div style={{ height:"8px", background:"var(--bg-card)", borderRadius:"4px", overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${Math.min(100,(selected.wrong_count/maxWrong)*100)}%`, background: getIntensity(selected.wrong_count).text, borderRadius:"4px", transition:"width 0.5s" }}/>
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:"8px" }}>
                        <div style={{ flex:1, padding:"8px 12px", background:"var(--bg-card)", borderRadius:"8px", fontSize:"12px", color:"var(--text-secondary)" }}>
                          💡 AI Tutor se poochho: "<i>{selected.topic} explain karo simple mein</i>"
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Legend */}
          <div className="card" style={{ padding:"14px" }}>
            <div style={{ fontSize:"12px", fontWeight:800, color:"var(--text-muted)", marginBottom:"10px" }}>📖 Legend</div>
            <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
              {INTENSITY_COLORS.map((c,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                  <div style={{ width:"20px", height:"20px", borderRadius:"4px", background:c.bg, border:"1px solid var(--border)" }}/>
                  <span style={{ fontSize:"11px", color:c.text, fontWeight:700 }}>{c.label}</span>
                  {c.max !== 99 && <span style={{ fontSize:"10px", color:"var(--text-muted)" }}>({c.min}-{c.max}x)</span>}
                  {c.max === 99 && <span style={{ fontSize:"10px", color:"var(--text-muted)" }}>(8+x)</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBJECT VIEW */}
      {view === "subject" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
          {subjectPerf.length === 0 ? (
            <div className="card" style={{ textAlign:"center", padding:"40px" }}>
              <p style={{ color:"var(--text-muted)" }}>Koi test data nahi — pehle mock test do!</p>
            </div>
          ) : (
            subjectPerf.sort((a,b) => a.avg_pct - b.avg_pct).map((s, i) => {
              const pct = Math.round(s.avg_pct);
              const c = pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
              const weakInSubject = weakTopics.filter(t => t.subject === s.subject).length;
              return (
                <div key={i} className="card fade-in" style={{ animationDelay:`${i*0.08}s`, borderLeft:`3px solid ${c}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
                    <div style={{ textAlign:"center", minWidth:"60px" }}>
                      <div style={{ fontSize:"24px", fontWeight:900, color:c }}>{pct}%</div>
                      <div style={{ fontSize:"10px", color:"var(--text-muted)" }}>avg score</div>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:"14px", marginBottom:"6px" }}>{s.subject}</div>
                      <div style={{ height:"8px", background:"var(--bg-secondary)", borderRadius:"4px", overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:c, borderRadius:"4px", transition:"width 1s ease" }}/>
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:"13px", fontWeight:700 }}>{s.attempts} tests</div>
                      {weakInSubject > 0 && (
                        <div style={{ fontSize:"11px", color:"#f97316", marginTop:"2px" }}>⚠️ {weakInSubject} weak</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* PROGRESS VIEW */}
      {view === "timeline" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          <div className="card" style={{ textAlign:"center", padding:"32px" }}>
            <div style={{ fontSize:"40px", marginBottom:"12px" }}>📈</div>
            <h3 style={{ fontSize:"16px", fontWeight:800, marginBottom:"8px" }}>Tumhari Progress</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"16px", marginTop:"16px" }}>
              {[
                { label:"Total Weak Topics", value:weakTopics.length, color:"#f97316" },
                { label:"Critical (8+)", value:critical, color:"#ef4444" },
                { label:"Improving (1-2)", value:strong, color:"#10b981" },
              ].map((s,i) => (
                <div key={i} style={{ padding:"16px", background:"var(--bg-secondary)", borderRadius:"12px" }}>
                  <div style={{ fontSize:"28px", fontWeight:900, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:"11px", color:"var(--text-muted)", marginTop:"4px" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ background:"linear-gradient(135deg, rgba(59,130,246,0.05), rgba(99,102,241,0.03))", borderColor:"rgba(59,130,246,0.2)" }}>
            <h3 style={{ fontSize:"14px", fontWeight:800, marginBottom:"12px" }}>🎯 Action Plan</h3>
            {weakTopics.slice(0,5).map((t,i) => (
              <div key={i} style={{ display:"flex", gap:"10px", marginBottom:"8px", padding:"8px 12px", background:"var(--bg-secondary)", borderRadius:"8px" }}>
                <span style={{ color:getIntensity(t.wrong_count).text, fontWeight:900, fontSize:"14px" }}>#{i+1}</span>
                <div style={{ flex:1 }}>
                  <span style={{ fontWeight:700, fontSize:"13px" }}>{t.topic}</span>
                  <span style={{ fontSize:"11px", color:"var(--text-muted)", marginLeft:"8px" }}>{t.subject}</span>
                </div>
                <span style={{ fontSize:"11px", fontWeight:700, color:getIntensity(t.wrong_count).text }}>
                  {getIntensity(t.wrong_count).label}
                </span>
              </div>
            ))}
            <p style={{ fontSize:"12px", color:"var(--text-muted)", marginTop:"10px" }}>
              💡 In topics pe AI Tutor se practice karo — score improve hoga!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
