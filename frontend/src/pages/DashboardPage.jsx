import React, { useState, useEffect } from "react";
import { useUser } from "../hooks/useUser";
import { useAppData } from "../hooks/useAppData";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import API from "../utils/api";

function ContentStats({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [folders, setFolders] = useState([]);

  useEffect(() => {
    API.get("/content/stats").then(r => setStats(r.data)).catch(()=>{});
    API.get("/content/folders").then(r => setFolders(r.data.folders||[])).catch(()=>{});
  }, []);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
        <h2 style={{ fontSize:"16px", fontWeight:800 }}>📚 Uploaded Content</h2>
        <button onClick={() => onNavigate("content")}
          style={{ padding:"6px 14px", borderRadius:"8px", border:"1px solid var(--accent)",
            background:"var(--accent-glow)", color:"var(--accent)", cursor:"pointer",
            fontSize:"12px", fontWeight:700, fontFamily:"var(--font-main)" }}>
          + Add Content
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px", marginBottom:"16px" }}>
        {[
          { label:"Total Files", value: stats?.total || 0,       icon:"📄" },
          { label:"Folders",     value: stats?.folders || 0,     icon:"📁" },
          { label:"Total Size",  value: `${stats?.totalSizeKB||0} KB`, icon:"💾" },
        ].map(s => (
          <div key={s.label} style={{ padding:"14px", borderRadius:"12px",
            background:"var(--bg-card)", border:"1px solid var(--border)", textAlign:"center" }}>
            <div style={{ fontSize:"22px", marginBottom:"4px" }}>{s.icon}</div>
            <div style={{ fontSize:"20px", fontWeight:900, color:"var(--accent)" }}>{s.value}</div>
            <div style={{ fontSize:"11px", color:"var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Folder list */}
      {folders.length > 0 ? (
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          {folders.map(f => (
            <div key={f.id} style={{ padding:"12px 16px", borderRadius:"10px",
              background:"var(--bg-card)", border:"1px solid var(--border)",
              display:"flex", alignItems:"center", gap:"12px" }}>
              <span style={{ fontSize:"20px" }}>📁</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:"13px" }}>{f.name}</div>
                <div style={{ fontSize:"11px", color:"var(--text-muted)" }}>
                  {f.count||0} files • {f.subject||""} {f.exam_type ? `• ${f.exam_type}` : ""}
                </div>
              </div>
              <span style={{ fontSize:"11px", color:"var(--text-muted)" }}>
                {f.last_updated ? new Date(f.last_updated).toLocaleDateString("en-IN") : ""}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding:"32px", textAlign:"center", borderRadius:"12px",
          background:"var(--bg-card)", border:"2px dashed var(--border)" }}>
          <div style={{ fontSize:"40px", marginBottom:"10px" }}>📭</div>
          <div style={{ fontWeight:700, marginBottom:"8px" }}>Koi content upload nahi hua</div>
          <div style={{ fontSize:"12px", color:"var(--text-muted)", marginBottom:"16px" }}>
            Google Drive se PDF import karo ya URL paste karo
          </div>
          <button onClick={() => onNavigate("content")}
            style={{ padding:"10px 24px", borderRadius:"10px", border:"none",
              background:"var(--accent)", color:"white", cursor:"pointer",
              fontWeight:700, fontSize:"13px", fontFamily:"var(--font-main)" }}>
            📤 Content Upload Karo
          </button>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage({ onNavigate }) {
  const { user } = useUser();
  const { analytics: data, loading } = useAppData();

  // Check admin from user object OR localStorage
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem("examguru_user")||"{}"); } catch { return {}; } })();
  const isAdmin = user?.role === "admin" || storedUser?.role === "admin";

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", gap: "12px" }}>
      <div className="loader" /> <span style={{ color: "var(--text-secondary)" }}>Dashboard load ho raha hai...</span>
    </div>
  );

  // ── ADMIN DASHBOARD ─────────────────────────────────────────────────────────
  if (isAdmin) return (
    <div style={{ padding:"28px 24px", overflowY:"auto", maxHeight:"100vh" }}>
      <div className="fade-in" style={{ marginBottom:"24px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"8px" }}>
          <div style={{ width:"44px", height:"44px", borderRadius:"12px",
            background:"linear-gradient(135deg,#ef4444,#f97316)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px" }}>⚙️</div>
          <div>
            <h1 style={{ fontSize:"22px", fontWeight:900 }}>Admin Dashboard</h1>
            <p style={{ color:"var(--text-muted)", fontSize:"12px" }}>Namaste, {user.name}! 👋 Aap admin ke roop mein logged in hain</p>
          </div>
        </div>
      </div>

      {/* Admin Quick Actions */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"14px", marginBottom:"24px" }}>
        {[
          { icon:"📤", title:"Content Upload", desc:"PDF, URL ya text upload karo", color:"#10b981", page:"content" },
          { icon:"⚙️", title:"Admin Panel",    desc:"Users aur settings manage karo", color:"#f87171", page:"admin" },
          { icon:"🤖", title:"AI Tutor Test",  desc:"Student ki tarah AI test karo", color:"#3b82f6", page:"chat" },
          { icon:"📝", title:"Mock Test",      desc:"Test system check karo", color:"#a78bfa", page:"test" },
        ].map(item => (
          <button key={item.page} onClick={() => onNavigate(item.page)}
            style={{ padding:"18px", borderRadius:"14px", border:`1px solid ${item.color}30`,
              background:`${item.color}08`, cursor:"pointer", textAlign:"left",
              fontFamily:"var(--font-main)", transition:"all 0.2s" }}
            onMouseOver={e => e.currentTarget.style.background=`${item.color}15`}
            onMouseOut={e => e.currentTarget.style.background=`${item.color}08`}>
            <div style={{ fontSize:"28px", marginBottom:"8px" }}>{item.icon}</div>
            <div style={{ fontWeight:800, fontSize:"14px", color:"var(--text-primary)", marginBottom:"4px" }}>{item.title}</div>
            <div style={{ fontSize:"12px", color:"var(--text-muted)" }}>{item.desc}</div>
          </button>
        ))}
      </div>

      {/* Content Stats */}
      <ContentStats onNavigate={onNavigate} />
    </div>
  );

  const hasData = data?.recentTests?.length > 0;

  return (
    <div style={{ padding: "28px 24px", overflowY: "auto", maxHeight: "100vh" }}>
      {/* Welcome */}
      <div className="fade-in" style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800 }}>Namaste, {user.name}! 👋</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
          {({JEE:"JEE",NEET:"NEET",UPSC:"UPSC CSE",UP_PCS:"UP PCS",MP_PCS:"MP PCS",
             RAS:"Rajasthan RAS",BPSC:"Bihar BPSC",MPSC:"Maharashtra MPSC",
             SSC_CGL:"SSC CGL",SSC_CHSL:"SSC CHSL"}[user.examTarget] || user.examTarget)} preparation — chalo aaj bhi kuch seekhte hain 🚀
        </p>
      </div>

      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Tests Diye", value: data?.recentTests?.length || 0, icon: "📝", color: "var(--accent)" },
          { label: "Avg Score", value: data?.recentTests?.length ? Math.round(data.recentTests.reduce((a, b) => a + (b.pct || 0), 0) / data.recentTests.length) + "%" : "—", icon: "🎯", color: "var(--success)" },
          { label: "Weak Areas", value: data?.weakTopics?.length || 0, icon: "⚠️", color: "var(--warning)" }
        ].map((s, i) => (
          <div key={i} className="card fade-in" style={{ textAlign: "center", animationDelay: `${i * 0.1}s` }}>
            <div style={{ fontSize: "24px", marginBottom: "6px" }}>{s.icon}</div>
            <div style={{ fontSize: "26px", fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {!hasData ? (
        /* Empty state */
        <div className="card fade-in" style={{ textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎓</div>
          <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>Shuru karo padhai!</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
            Abhi tak koi test nahi diya. Pehla mock test do ya AI tutor se kuch seekho.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button className="btn btn-primary" onClick={() => onNavigate("chat")}>💬 AI Tutor</button>
            <button className="btn btn-secondary" onClick={() => onNavigate("test")}>📝 Mock Test</button>
          </div>
        </div>
      ) : (
        <>
          {/* Score trend chart */}
          <div className="card fade-in" style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "16px" }}>📈 Score Trend</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={[...data.recentTests].reverse()}>
                <XAxis dataKey="subject" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <Tooltip
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(v) => [`${v}%`, "Score"]}
                />
                <Line type="monotone" dataKey="pct" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill: "var(--accent)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Subject performance */}
          {data.subjectPerformance?.length > 0 && (
            <div className="card fade-in" style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "16px" }}>📊 Subject Performance</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data.subjectPerformance}>
                  <XAxis dataKey="subject" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                  <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }} formatter={(v) => [`${Math.round(v)}%`, "Avg Score"]} />
                  <Bar dataKey="avg_pct" radius={[4, 4, 0, 0]}>
                    {data.subjectPerformance.map((entry, i) => (
                      <Cell key={i} fill={entry.avg_pct >= 75 ? "var(--success)" : entry.avg_pct >= 50 ? "var(--accent)" : "var(--danger)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent Tests */}
          <div className="card fade-in" style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "14px" }}>🕐 Recent Tests</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {data.recentTests.slice(0, 5).map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", background: "var(--bg-secondary)", borderRadius: "var(--radius-sm)" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: t.pct >= 75 ? "rgba(16,185,129,0.15)" : t.pct >= 50 ? "rgba(59,130,246,0.15)" : "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "13px", color: t.pct >= 75 ? "var(--success)" : t.pct >= 50 ? "var(--accent)" : "var(--danger)", flexShrink: 0 }}>
                    {t.pct}%
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 700 }}>{t.subject}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{t.score}/{t.total} correct</div>
                  </div>
                  <span className={`badge ${t.pct >= 75 ? "badge-green" : t.pct >= 50 ? "badge-blue" : "badge-red"}`} style={{ fontSize: "11px" }}>{t.exam_type}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Weak Topics */}
      {data?.weakTopics?.length > 0 && (
        <div className="card fade-in" style={{ borderColor: "rgba(245,158,11,0.3)" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "12px" }}>🎯 Focus karo inpe</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {data.weakTopics.map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "rgba(245,158,11,0.05)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(245,158,11,0.15)" }}>
                <span style={{ fontSize: "14px" }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>{t.topic}</span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "8px" }}>{t.subject}</span>
                </div>
                <span style={{ fontSize: "11px", color: "var(--warning)", fontWeight: 700 }}>{t.wrong_count}x galat</span>
              </div>
            ))}
          </div>
          <button className="btn btn-secondary" onClick={() => onNavigate("chat")} style={{ marginTop: "12px", fontSize: "13px" }}>
            💬 In topics pe AI se padho →
          </button>
        </div>
      )}
    </div>
  );
}
