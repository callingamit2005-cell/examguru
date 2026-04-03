import React, { useState, useEffect } from "react";
import { userAPI } from "../utils/api";
import { useUser } from "../hooks/useUser";
import { useAppData } from "../hooks/useAppData";

export default function WeakTopicsPage({ onNavigate }) {
  const { user } = useUser();
  const { profile, loading } = useAppData();

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", gap: "10px" }}>
      <div className="loader" /> <span style={{ color: "var(--text-secondary)" }}>Load ho raha hai...</span>
    </div>
  );

  const weakTopics = profile?.weakTopics || [];
  const bySubject = weakTopics.reduce((acc, t) => {
    if (!acc[t.subject]) acc[t.subject] = [];
    acc[t.subject].push(t);
    return acc;
  }, {});

  const maxWrong = Math.max(...weakTopics.map(t => t.wrong_count), 1);

  return (
    <div style={{ padding: "28px 24px", overflowY: "auto", maxHeight: "100vh" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "6px" }}>🎯 Weak Topics</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "28px" }}>
        AI ne tumhare galat answers se yeh topics identify kiye — inhe focus karo
      </p>

      {weakTopics.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px 24px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏆</div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>Koi weak topic nahi!</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
            Pehle kuch mock tests do — AI automatically tumhare weak areas identify karega.
          </p>
          <button className="btn btn-primary" onClick={() => onNavigate("test")}>📝 Mock Test Do</button>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "var(--warning)" }}>{weakTopics.length}</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Total Weak Topics</div>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "var(--danger)" }}>{weakTopics[0]?.topic?.slice(0, 12) || "—"}</div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Most Weak</div>
            </div>
          </div>

          {/* By subject */}
          {Object.entries(bySubject).map(([subject, topics]) => (
            <div key={subject} className="card fade-in" style={{ marginBottom: "16px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 800, marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                📚 {subject}
                <span className="badge badge-yellow">{topics.length} topics</span>
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {topics.sort((a, b) => b.wrong_count - a.wrong_count).map((t, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600 }}>{t.topic}</span>
                      <span style={{ fontSize: "12px", color: "var(--danger)", fontWeight: 700 }}>{t.wrong_count}x galat</span>
                    </div>
                    <div style={{ height: "6px", background: "var(--bg-secondary)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: "3px",
                        width: `${(t.wrong_count / maxWrong) * 100}%`,
                        background: t.wrong_count >= 3 ? "var(--danger)" : t.wrong_count >= 2 ? "var(--warning)" : "var(--accent)",
                        transition: "width 0.5s ease"
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="btn btn-secondary"
                onClick={() => onNavigate("chat")}
                style={{ marginTop: "14px", fontSize: "12px", padding: "8px 14px" }}
              >
                💬 {subject} ke topics AI se padho →
              </button>
            </div>
          ))}

          <div className="card fade-in" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.05), rgba(99,102,241,0.05))", borderColor: "rgba(59,130,246,0.2)", textAlign: "center", padding: "24px" }}>
            <div style={{ fontSize: "24px", marginBottom: "10px" }}>💡</div>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px" }}>
              In weak topics pe mock test do ya AI tutor se practice karo — score aapne aap badhega!
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button className="btn btn-primary" onClick={() => onNavigate("test")}>📝 Targeted Test</button>
              <button className="btn btn-secondary" onClick={() => onNavigate("chat")}>💬 AI Se Seekho</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
