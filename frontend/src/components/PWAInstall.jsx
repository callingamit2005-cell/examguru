import React, { useState, useEffect } from "react";

export default function PWAInstall() {
  const [prompt, setPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true); return;
    }

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      // Show after 30 seconds or on second visit
      const visits = parseInt(localStorage.getItem("eg_visits") || "0") + 1;
      localStorage.setItem("eg_visits", visits);
      if (visits >= 2) setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === "accepted") setInstalled(true);
    setShow(false);
  };

  if (!show || installed) return null;

  return (
    <div style={{
      position: "fixed", bottom: "80px", left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, width: "calc(100% - 40px)", maxWidth: "400px"
    }}>
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--accent)",
        borderRadius: "16px", padding: "16px 20px",
        boxShadow: "0 8px 32px rgba(59,130,246,0.3)",
        display: "flex", alignItems: "center", gap: "14px"
      }}>
        <div style={{ fontSize: "32px" }}>📱</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: "14px", marginBottom: "2px" }}>App Install Karo!</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Home screen pe add karo — offline bhi kaam karega</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <button onClick={install} className="btn btn-primary" style={{ fontSize: "12px", padding: "6px 14px", justifyContent: "center" }}>
            Install
          </button>
          <button onClick={() => setShow(false)} style={{ background: "none", border: "none", fontSize: "11px", color: "var(--text-muted)", cursor: "pointer", fontFamily: "var(--font-main)" }}>
            Baad mein
          </button>
        </div>
      </div>
    </div>
  );
}
