import React, { useState, useEffect } from "react";
import { adminAPI, userAPI } from "../utils/api";
import { useUser } from "../hooks/useUser";

const COURSE_LABELS = {
  FOUNDATION:"Foundation (Class 6-8)", CLASS_9:"Class 9", CLASS_10:"Class 10",
  CLASS_11_SCI:"Class 11 Science", CLASS_11_COM:"Class 11 Commerce", CLASS_11_ARTS:"Class 11 Arts",
  CLASS_12_SCI:"Class 12 Science", CLASS_12_COM:"Class 12 Commerce", CLASS_12_ARTS:"Class 12 Arts",
  CLASS_1112_SCI:"Class 11+12 Science", JEE:"JEE Main & Advanced", NEET:"NEET UG",
  UPSC:"UPSC CSE", UP_PCS:"UP PCS", MP_PCS:"MP PCS", RAS:"Rajasthan RAS",
  BPSC:"Bihar BPSC", MPSC:"Maharashtra MPSC", SSC_CGL:"SSC CGL", SSC_CHSL:"SSC CHSL"
};

const ALL_COURSES = [
  { group:"🏫 School", items:[
    {code:"FOUNDATION",label:"Foundation (Class 6-8)"},{code:"CLASS_9",label:"Class 9"},
    {code:"CLASS_10",label:"Class 10"},{code:"CLASS_11_SCI",label:"Class 11 Science"},
    {code:"CLASS_11_COM",label:"Class 11 Commerce"},{code:"CLASS_11_ARTS",label:"Class 11 Arts"},
    {code:"CLASS_12_SCI",label:"Class 12 Science"},{code:"CLASS_12_COM",label:"Class 12 Commerce"},
    {code:"CLASS_12_ARTS",label:"Class 12 Arts"},{code:"CLASS_1112_SCI",label:"Class 11+12 Science"},
  ]},
  { group:"🏆 Competitive", items:[
    {code:"JEE",label:"JEE Main & Advanced"},{code:"NEET",label:"NEET UG"},
    {code:"UPSC",label:"UPSC CSE"},{code:"UP_PCS",label:"UP PCS (UPPSC)"},
    {code:"MP_PCS",label:"MP PCS (MPPSC)"},{code:"RAS",label:"Rajasthan RAS"},
    {code:"BPSC",label:"Bihar BPSC"},{code:"MPSC",label:"Maharashtra MPSC"},
    {code:"SSC_CGL",label:"SSC CGL"},{code:"SSC_CHSL",label:"SSC CHSL"},
  ]}
];

export default function AdminPanel() {
  const { user } = useUser();
  const [tab, setTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text:"", type:"" });
  const [enrollForm, setEnrollForm] = useState({ studentEmail:"", courseCode:"" });
  const [searchStudent, setSearchStudent] = useState("");

  const adminEmail = user?.email;

  const showMsg = (text, type="success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text:"", type:"" }), 4000);
  };

  // Load data based on tab
  useEffect(() => {
    if (!adminEmail) return;
    if (tab === "dashboard") loadStats();
    if (tab === "students") loadStudents();
  }, [tab, adminEmail]);

  const loadStats = async () => {
    try {
      const res = await adminAPI.getStats();
      setStats(res.data);
    } catch (err) {
      showMsg("Stats load nahi hui: " + err.message, "error");
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getStudents();
      setStudents(res.data.students || []);
    } catch (err) {
      showMsg("Students load nahi hue: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!enrollForm.studentEmail.trim()) { showMsg("Student email daalo!", "error"); return; }
    if (!enrollForm.courseCode) { showMsg("Course select karo!", "error"); return; }
    setLoading(true);
    try {
      await adminAPI.enroll(adminEmail, enrollForm);
      showMsg(`✅ ${enrollForm.studentEmail} ko ${COURSE_LABELS[enrollForm.courseCode]} mein enroll kar diya!`);
      setEnrollForm({ studentEmail:"", courseCode:"" });
    } catch (err) {
      showMsg("❌ " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async (studentEmail, courseCode) => {
    if (!window.confirm(`${studentEmail} ka ${courseCode} enrollment hatana chahte ho?`)) return;
    try {
      await adminAPI.unenroll(adminEmail, { studentEmail, courseCode });
      showMsg(`✅ Enrollment hata diya`);
      loadStudents();
    } catch (err) {
      showMsg("❌ " + err.message, "error");
    }
  };

  const filteredStudents = students.filter(s =>
    s.name?.toLowerCase().includes(searchStudent.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchStudent.toLowerCase())
  );

  // Not admin
  if (user?.role !== "admin") return (
    <div style={{ padding:"40px", textAlign:"center" }}>
      <div style={{ fontSize:"48px", marginBottom:"16px" }}>🔒</div>
      <h2 style={{ fontSize:"20px", fontWeight:800, marginBottom:"8px" }}>Admin Access Required</h2>
      <p style={{ color:"var(--text-secondary)", fontSize:"14px" }}>
        CMD mein run karo:<br/>
        <code style={{ background:"var(--bg-secondary)", padding:"4px 8px", borderRadius:"4px", fontSize:"12px" }}>
          curl -X POST http://localhost:5000/api/admin/make-admin -H "Content-Type: application/json" -d {`{"email":"${user?.email}","secretKey":"YOUR_ADMIN_SECRET"}`}
        </code>
      </p>
    </div>
  );

  return (
    <div style={{ padding:"24px", overflowY:"auto", maxHeight:"100vh" }}>
      {/* Header */}
      <div style={{ marginBottom:"20px" }}>
        <h1 style={{ fontSize:"22px", fontWeight:900 }}>⚙️ Admin Panel</h1>
        <p style={{ color:"var(--text-secondary)", fontSize:"13px" }}>Students ko courses assign karo — full control</p>
      </div>

      {/* Message */}
      {msg.text && (
        <div style={{ padding:"10px 16px", borderRadius:"8px", marginBottom:"16px",
          background: msg.type==="error" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
          border: `1px solid ${msg.type==="error" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
          color: msg.type==="error" ? "#f87171" : "#10b981",
          fontSize:"13px", fontWeight:700
        }}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:"flex", gap:"4px", background:"var(--bg-secondary)", borderRadius:"10px", padding:"4px", marginBottom:"20px", width:"fit-content" }}>
        {[
          { id:"dashboard", label:"📊 Dashboard" },
          { id:"enroll",    label:"➕ Enroll Student" },
          { id:"students",  label:"👥 All Students" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:"8px 16px", borderRadius:"8px", border:"none",
            background: tab===t.id ? "var(--accent)" : "transparent",
            color: tab===t.id ? "white" : "var(--text-muted)",
            fontWeight:700, fontSize:"13px", fontFamily:"var(--font-main)",
            cursor:"pointer", transition:"all 0.15s"
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── DASHBOARD TAB ── */}
      {tab === "dashboard" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px" }}>
            {[
              { label:"Total Students", value: stats?.totalStudents ?? "...", icon:"👥", color:"var(--accent)" },
              { label:"Tests Completed", value: stats?.totalTests ?? "...", icon:"📝", color:"var(--success)" },
              { label:"AI Questions", value: stats?.totalMessages ?? "...", icon:"💬", color:"#a78bfa" },
            ].map((s,i) => (
              <div key={i} className="card" style={{ textAlign:"center" }}>
                <div style={{ fontSize:"28px", marginBottom:"6px" }}>{s.icon}</div>
                <div style={{ fontSize:"28px", fontWeight:900, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:"12px", color:"var(--text-muted)", fontWeight:700 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {stats?.courseCounts && Object.keys(stats.courseCounts).length > 0 && (
            <div className="card">
              <h3 style={{ fontSize:"14px", fontWeight:800, marginBottom:"12px" }}>📊 Course-wise Enrollments</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                {Object.entries(stats.courseCounts).sort((a,b)=>b[1]-a[1]).map(([code,count]) => (
                  <div key={code} style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <div style={{ width:"120px", fontSize:"12px", fontWeight:700, color:"var(--text-secondary)" }}>
                      {COURSE_LABELS[code] || code}
                    </div>
                    <div style={{ flex:1, height:"8px", background:"var(--bg-secondary)", borderRadius:"4px", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${Math.min(100,(count/Math.max(...Object.values(stats.courseCounts)))*100)}%`, background:"var(--accent)", borderRadius:"4px" }}/>
                    </div>
                    <div style={{ fontSize:"13px", fontWeight:900, color:"var(--accent)", minWidth:"24px" }}>{count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button className="btn btn-secondary" onClick={loadStats} style={{ width:"fit-content" }}>🔄 Refresh Stats</button>
        </div>
      )}

      {/* ── ENROLL TAB ── */}
      {tab === "enroll" && (
        <div style={{ maxWidth:"560px" }}>
          <div className="card" style={{ marginBottom:"16px" }}>
            <h3 style={{ fontSize:"15px", fontWeight:800, marginBottom:"16px" }}>➕ Student ko Course Assign Karo</h3>

            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div>
                <label style={{ fontSize:"12px", fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:"6px" }}>
                  Student Email *
                </label>
                <input className="input" placeholder="student@gmail.com"
                  value={enrollForm.studentEmail}
                  onChange={e => setEnrollForm(p => ({...p, studentEmail: e.target.value}))}
                />
                <p style={{ fontSize:"11px", color:"var(--text-muted)", marginTop:"4px" }}>
                  💡 Student pehle register kare — phir yahan email daalo
                </p>
              </div>

              <div>
                <label style={{ fontSize:"12px", fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:"6px" }}>
                  Course Select Karo *
                </label>
                <select className="input" value={enrollForm.courseCode}
                  onChange={e => setEnrollForm(p => ({...p, courseCode: e.target.value}))}>
                  <option value="">-- Course choose karo --</option>
                  {ALL_COURSES.map(group => (
                    <optgroup key={group.group} label={group.group}>
                      {group.items.map(c => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {enrollForm.courseCode && (
                <div style={{ padding:"10px 14px", background:"var(--accent-glow)", borderRadius:"8px", border:"1px solid rgba(59,130,246,0.3)", fontSize:"13px" }}>
                  ✅ <strong>{enrollForm.studentEmail || "Student"}</strong> ko <strong>{COURSE_LABELS[enrollForm.courseCode]}</strong> mein enroll karoge
                </div>
              )}

              <button className="btn btn-primary" onClick={handleEnroll} disabled={loading}
                style={{ justifyContent:"center", padding:"12px" }}>
                {loading ? <><div className="loader" style={{width:"14px",height:"14px"}}/> Enrolling...</> : "✅ Enroll Karo"}
              </button>
            </div>
          </div>

          {/* How it works */}
          <div className="card" style={{ borderColor:"rgba(245,158,11,0.3)", background:"rgba(245,158,11,0.04)" }}>
            <h3 style={{ fontSize:"13px", fontWeight:800, marginBottom:"10px", color:"#fbbf24" }}>📋 Step by Step Guide</h3>
            {[
              "Student apne phone/laptop pe register kare",
              "Tum yahan uska email + sahi course select karo",
              "Enroll karo — student ka course lock ho jayega",
              "Student next login pe sirf wahi course dekhega",
              "Student khud course nahi badal sakta"
            ].map((step, i) => (
              <div key={i} style={{ display:"flex", gap:"10px", marginBottom:"6px", alignItems:"flex-start" }}>
                <span style={{ width:"20px", height:"20px", borderRadius:"50%", background:"var(--accent)", color:"white", fontSize:"10px", fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:"1px" }}>{i+1}</span>
                <span style={{ fontSize:"13px", color:"var(--text-secondary)" }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STUDENTS TAB ── */}
      {tab === "students" && (
        <div>
          {/* Search */}
          <div style={{ marginBottom:"14px", display:"flex", gap:"10px", alignItems:"center" }}>
            <input className="input" placeholder="🔍 Student naam ya email search karo..."
              value={searchStudent} onChange={e => setSearchStudent(e.target.value)}
              style={{ maxWidth:"360px" }}/>
            <button className="btn btn-secondary" onClick={loadStudents} style={{ fontSize:"13px" }}>🔄 Refresh</button>
            <span style={{ fontSize:"12px", color:"var(--text-muted)" }}>{filteredStudents.length} students</span>
          </div>

          {loading ? (
            <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"20px" }}>
              <div className="loader"/> <span style={{ color:"var(--text-secondary)" }}>Loading students...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="card" style={{ textAlign:"center", padding:"40px" }}>
              <div style={{ fontSize:"36px", marginBottom:"12px" }}>👥</div>
              <p style={{ color:"var(--text-muted)" }}>
                {searchStudent ? "Koi student nahi mila" : "Abhi koi student registered nahi hai"}
              </p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {filteredStudents.map((s, i) => (
                <div key={i} className="card fade-in" style={{ animationDelay:`${i*0.05}s` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                    {/* Avatar */}
                    <div style={{ width:"44px", height:"44px", borderRadius:"12px", background:"linear-gradient(135deg,#3b82f6,#6366f1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>
                      {s.name?.[0]?.toUpperCase() || "👤"}
                    </div>

                    {/* Info */}
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:"14px" }}>{s.name}</div>
                      <div style={{ fontSize:"12px", color:"var(--text-muted)" }}>{s.email}</div>
                      <div style={{ fontSize:"11px", color:"var(--text-muted)", marginTop:"2px" }}>
                        Joined: {new Date(s.created_at).toLocaleDateString("en-IN")}
                      </div>
                    </div>

                    {/* Enrollments */}
                    <div style={{ display:"flex", flexDirection:"column", gap:"4px", alignItems:"flex-end" }}>
                      {s.enrollments?.length > 0 ? (
                        s.enrollments.map((e, j) => (
                          <div key={j} style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                            <span className="badge badge-green" style={{ fontSize:"11px" }}>
                              ✅ {COURSE_LABELS[e.course_code] || e.course_code}
                            </span>
                            <button onClick={() => handleUnenroll(s.email, e.course_code)}
                              style={{ background:"none", border:"none", cursor:"pointer", color:"#f87171", fontSize:"12px", padding:"0 4px" }}
                              title="Remove enrollment">✕</button>
                          </div>
                        ))
                      ) : (
                        <span className="badge badge-yellow" style={{ fontSize:"11px" }}>⚠️ No Course</span>
                      )}
                    </div>

                    {/* Quick enroll */}
                    <button className="btn btn-secondary"
                      onClick={() => { setTab("enroll"); setEnrollForm(p => ({...p, studentEmail: s.email})); }}
                      style={{ fontSize:"12px", padding:"6px 12px", flexShrink:0 }}>
                      + Enroll
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
