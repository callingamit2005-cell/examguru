import React, { useState } from "react";
import { userAPI } from "../utils/api";
import { useUser } from "../hooks/useUser";

const COURSE_GROUPS = [
  {
    group: "🏫 School Courses",
    courses: [
      { id: "FOUNDATION",    label: "📚 Foundation (Class 6-8)" },
      { id: "CLASS_9",       label: "📗 Class 9 (CBSE/State Board)" },
      { id: "CLASS_10",      label: "📘 Class 10 (CBSE/State Board)" },
      { id: "CLASS_11_SCI",  label: "🔬 Class 11 — Science" },
      { id: "CLASS_11_COM",  label: "💰 Class 11 — Commerce" },
      { id: "CLASS_11_ARTS", label: "🎨 Class 11 — Arts" },
      { id: "CLASS_12_SCI",  label: "🔬 Class 12 — Science" },
      { id: "CLASS_12_COM",  label: "💰 Class 12 — Commerce" },
      { id: "CLASS_12_ARTS", label: "🎨 Class 12 — Arts" },
      { id: "CLASS_1112_SCI",label: "⭐ Class 11+12 Science (Combined)" },
    ]
  },
  {
    group: "🏆 Competitive Exams",
    courses: [
      { id: "JEE",      label: "🔧 JEE Main & Advanced" },
      { id: "NEET",     label: "⚕️ NEET UG" },
      { id: "UPSC",     label: "🏛️ UPSC CSE (IAS/IPS/IFS)" },
      { id: "UP_PCS",   label: "🏛️ UP PCS (UPPSC)" },
      { id: "MP_PCS",   label: "🏛️ MP PCS (MPPSC)" },
      { id: "RAS",      label: "🏛️ Rajasthan RAS (RPSC)" },
      { id: "BPSC",     label: "🏛️ Bihar BPSC" },
      { id: "MPSC",     label: "🏛️ Maharashtra MPSC" },
      { id: "SSC_CGL",  label: "📋 SSC CGL" },
      { id: "SSC_CHSL", label: "📋 SSC CHSL" },
    ]
  }
];

const ALL_COURSES = COURSE_GROUPS.flatMap(g => g.courses);

export default function LoginPage() {
  const { login } = useUser();
  const [form, setForm] = useState({ name: "", email: "", examTarget: "CLASS_9", role: "student" });
  const [adminSecret, setAdminSecret] = useState("");
  const [showAdminField, setShowAdminField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1=info, 2=course

  const handleNext = () => {
    if (!form.name.trim() || !form.email.trim()) {
      setError("Naam aur email bharo!"); return;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError("Valid email daalo!"); return;
    }
    if (form.role === "admin" && !adminSecret.trim()) {
      setError("Admin secret key daalo!"); return;
    }
    // NOTE: Secret is validated on BACKEND only — not stored in frontend
    setError(""); setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true); setError("");
    try {
      const res = await userAPI.register(form);
      const userData = res.data.user;
      userData.enrolledCourses = res.data.enrolledCourses || [form.examTarget];
      userData.courseDetails   = res.data.courseDetails || [];
      userData.subjects        = res.data.subjects || [];

      // If admin role requested → make admin via backend
      if (form.role === "admin" && adminSecret) {
        try {
          const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
          const adminRes = await fetch(`${API_URL}/admin/make-admin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: form.email, secretKey: adminSecret })
          });
          const adminData = await adminRes.json();
          if (adminRes.ok) {
            userData.role = "admin";
          } else {
            setError("❌ " + (adminData.error || "Admin secret key galat hai!"));
            setLoading(false);
            return;
          }
        } catch(e) {
          setError("❌ Admin verification failed. Backend running hai?");
          setLoading(false);
          return;
        }
      }

      login(userData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedCourse = ALL_COURSES.find(c => c.id === form.examTarget);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "480px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }} className="fade-in">
          <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "linear-gradient(135deg, #3b82f6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", margin: "0 auto 14px", boxShadow: "0 8px 32px rgba(59,130,246,0.4)" }}>🎓</div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "4px" }}>ExamGuru AI</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>India's Smartest AI Tutor — Class 6 se UPSC tak</p>
        </div>

        {/* Step 1 — Basic Info */}
        {step === 1 && (
          <div className="card fade-in">
            <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "4px" }}>Shuru karo! 🚀</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "22px" }}>Free mein sign up karo — koi credit card nahi chahiye</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>Tumhara Naam</label>
                <input className="input" placeholder="e.g. Rahul Sharma" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && handleNext()} />
              </div>

              {/* Role selector */}
              <div>
                <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>Main hoon...</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  {[
                    { id:"student", icon:"🎓", label:"Student", desc:"Padhai karna hai" },
                    { id:"admin",   icon:"👨‍🏫", label:"Teacher/Admin", desc:"Content manage karna hai" },
                  ].map(r => (
                    <button key={r.id} type="button"
                      onClick={() => { setForm(p => ({...p, role: r.id})); setShowAdminField(r.id === "admin"); }}
                      style={{ flex:1, padding:"12px 10px", borderRadius:"10px", cursor:"pointer",
                        border:`2px solid ${form.role===r.id?"var(--accent)":"var(--border)"}`,
                        background:form.role===r.id?"var(--accent-glow)":"var(--bg-secondary)",
                        fontFamily:"var(--font-main)", textAlign:"center", transition:"all 0.15s" }}>
                      <div style={{ fontSize:"22px", marginBottom:"4px" }}>{r.icon}</div>
                      <div style={{ fontSize:"12px", fontWeight:800, color:form.role===r.id?"var(--accent)":"var(--text-primary)" }}>{r.label}</div>
                      <div style={{ fontSize:"10px", color:"var(--text-muted)", marginTop:"2px" }}>{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin secret key field */}
              {showAdminField && (
                <div className="fade-in">
                  <label style={{ fontSize: "13px", fontWeight: 700, color: "#f59e0b", display: "block", marginBottom: "6px" }}>
                    🔑 Admin Secret Key
                  </label>
                  <input className="input" type="password" placeholder="Admin secret key daalo"
                    value={adminSecret} onChange={e => setAdminSecret(e.target.value)}
                    style={{ borderColor:"rgba(245,158,11,0.4)" }}/>
                  <div style={{ fontSize:"11px", color:"var(--text-muted)", marginTop:"4px" }}>
                    Institute se milega — unauthorized access allowed nahi
                  </div>
                </div>
              )}
              <div>
                <label style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>Email Address</label>
                <input className="input" type="email" placeholder="rahul@example.com" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && handleNext()} />
              </div>

              {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 14px", color: "#f87171", fontSize: "13px" }}>❌ {error}</div>}

              <button className="btn btn-primary" onClick={handleNext} style={{ width: "100%", justifyContent: "center", padding: "13px" }}>
                Aage Badhein →
              </button>
            </div>
            <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)", marginTop: "14px" }}>Already account hai? Same email daalte hi log in ho jaoge ✅</p>
          </div>
        )}

        {/* Step 2 — Course Selection */}
        {step === 2 && (
          <div className="card fade-in">
            <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-main)", marginBottom: "14px", padding: 0 }}>
              ← Wapas
            </button>
            <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "4px" }}>Kaun sa course? 📚</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "20px" }}>
              ⚠️ <strong>Dhyan do:</strong> Tumhara AI tutor sirf is course ke hisaab se padhayega
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "380px", overflowY: "auto", paddingRight: "4px" }}>
              {COURSE_GROUPS.map(group => (
                <div key={group.group}>
                  <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-muted)", marginBottom: "8px", letterSpacing: "0.05em" }}>
                    {group.group}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {group.courses.map(course => (
                      <button key={course.id} onClick={() => setForm(p => ({ ...p, examTarget: course.id }))}
                        style={{
                          padding: "10px 14px", borderRadius: "10px", border: "1px solid",
                          borderColor: form.examTarget === course.id ? "var(--accent)" : "var(--border)",
                          background: form.examTarget === course.id ? "var(--accent-glow)" : "var(--bg-secondary)",
                          color: form.examTarget === course.id ? "var(--accent)" : "var(--text-secondary)",
                          cursor: "pointer", textAlign: "left", fontSize: "13px", fontWeight: form.examTarget === course.id ? 800 : 600,
                          fontFamily: "var(--font-main)", transition: "all 0.15s",
                          display: "flex", alignItems: "center", gap: "8px"
                        }}>
                        {form.examTarget === course.id && <span style={{ fontSize: "12px" }}>✅</span>}
                        {course.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Selected course summary */}
            {selectedCourse && (
              <div style={{ marginTop: "16px", padding: "12px 14px", background: "var(--accent-glow)", borderRadius: "10px", border: "1px solid rgba(59,130,246,0.3)" }}>
                <div style={{ fontSize: "12px", color: "var(--accent)", fontWeight: 800 }}>✅ Selected:</div>
                <div style={{ fontSize: "14px", fontWeight: 700, marginTop: "2px" }}>{selectedCourse.label}</div>
              </div>
            )}

            {error && <div style={{ marginTop: "12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 14px", color: "#f87171", fontSize: "13px" }}>❌ {error}</div>}

            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ width: "100%", justifyContent: "center", padding: "13px", marginTop: "16px" }}>
              {loading ? <><div className="loader" style={{ width: "16px", height: "16px" }} /> Loading...</> : "Padhai Shuru Karo 🚀"}
            </button>
          </div>
        )}

        {/* Feature Pills */}
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "18px", flexWrap: "wrap" }}>
          {["🤖 AI Tutor", "📝 Mock Tests", "🎙️ Voice Class", "📸 Photo Scan", "🏆 Gamification"].map(f => (
            <span key={f} style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "20px", background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)", fontWeight: 600 }}>{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
