import React, { useState, useEffect } from "react";
import { testAPI, chatAPI } from "../utils/api";
import { useUser } from "../hooks/useUser";

export default function HistoryPage() {
  const { user } = useUser();
  const [tab, setTab] = useState("tests");
  const [tests, setTests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetchFn = tab === "tests"
      ? testAPI.getHistory(user.id).then(r => setTests(r.data.tests))
      : chatAPI.getSessions(user.id).then(r => setSessions(r.data.sessions));
    fetchFn.catch(() => {}).finally(() => setLoading(false));
  }, [tab, user.id]);

  const formatDate = (dt) => dt ? new Date(dt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

  return (
    <div style={{ padding: "28px 24px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "6px" }}>📚 History</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>Tumhara poora record</p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", background: "var(--bg-secondary)", borderRadius: "10px", padding: "4px", marginBottom: "20px", width: "fit-content" }}>
        {["tests", "chats"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer",
            background: tab === t ? "var(--accent)" : "transparent",
            color: tab === t ? "white" : "var(--text-muted)",
            fontWeight: 700, fontSize: "13px", fontFamily: "var(--font-main)", transition: "all 0.15s",
            textTransform: "capitalize"
          }}>{t === "tests" ? "📝 Mock Tests" : "💬 Chat Sessions"}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "20px" }}>
          <div className="loader" /> <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Load ho raha hai...</span>
        </div>
      ) : tab === "tests" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {tests.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "40px" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>📝</div>
              <p style={{ color: "var(--text-secondary)" }}>Abhi tak koi test nahi diya!</p>
            </div>
          ) : tests.map((t, i) => (
            <div key={i} className="card fade-in" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                width: "50px", height: "50px", borderRadius: "12px", flexShrink: 0,
                background: !t.completed_at ? "var(--bg-secondary)" : t.score / t.total >= 0.75 ? "rgba(16,185,129,0.15)" : t.score / t.total >= 0.5 ? "rgba(59,130,246,0.15)" : "rgba(239,68,68,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, fontSize: "14px",
                color: !t.completed_at ? "var(--text-muted)" : t.score / t.total >= 0.75 ? "var(--success)" : t.score / t.total >= 0.5 ? "var(--accent)" : "var(--danger)"
              }}>
                {t.completed_at ? `${Math.round((t.score / t.total) * 100)}%` : "—"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>{t.subject}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {t.completed_at ? `${t.score}/${t.total} correct` : "Incomplete"} • {formatDate(t.created_at)}
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                <span className="badge badge-blue">{t.exam_type}</span>
                {!t.completed_at && <span className="badge badge-yellow">Incomplete</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {sessions.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "40px" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>💬</div>
              <p style={{ color: "var(--text-secondary)" }}>Abhi tak koi chat session nahi!</p>
            </div>
          ) : sessions.map((s, i) => (
            <div key={i} className="card fade-in" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "var(--accent-glow)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>💬</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>{s.subject}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{s.message_count} messages • {formatDate(s.created_at)}</div>
              </div>
              <span className="badge badge-blue">{s.exam_type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
