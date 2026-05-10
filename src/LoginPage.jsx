import { useState } from "react";

const API_BASE = "/api";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) { setError("Please enter username and password."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed."); return; }
      onLogin(data.user);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans','Segoe UI',sans-serif", padding: 16,
    }}>
      {/* Background glow */}
      <div style={{ position: "fixed", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, background: "radial-gradient(circle, #ffffff08 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 400, position: "relative" }}>
        {/* Card */}
        <div style={{
          background: "#111111", border: "1px solid #2a2a2a", borderRadius: 20,
          padding: "40px 36px 36px", boxShadow: "0 32px 80px #00000088",
        }}>
          {/* Logo + Title */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div style={{
                width: 62, height: 60, borderRadius: 10,
                background: "#1a1a1a", border: "1px solid #333",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <img src="/images/SilverGroupfaviconsondisplay.png" alt="Logo"
                  style={{ width: 60, height: 65, objectFit: "contain", borderRadius: 15, display: "block", }}
                  onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "block"; }}
                />
                <span style={{ display: "none", fontSize: 28 }}>🏢</span>
              </div>
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#f0f0f0", letterSpacing: -0.5 }}>
              Silver Group
            </h1>
            <p style={{ margin: "6px 0 0", color: "#555", fontSize: 13 }}>
              Dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Username */}
            <div>
              <label style={{ display: "block", color: "#888", fontSize: 12, fontWeight: 600, letterSpacing: 0.5, marginBottom: 7 }}>
                USERNAME
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#444" }}>
                  <UserIcon />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  style={{
                    width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a",
                    borderRadius: 10, padding: "11px 14px 11px 40px",
                    color: "#e0e0e0", fontSize: 14, outline: "none", boxSizing: "border-box",
                    transition: "border-color .2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "#555"}
                  onBlur={e => e.target.style.borderColor = "#2a2a2a"}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: "block", color: "#888", fontSize: 12, fontWeight: 600, letterSpacing: 0.5, marginBottom: 7 }}>
                PASSWORD
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#444" }}>
                  <LockIcon />
                </span>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{
                    width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a",
                    borderRadius: 10, padding: "11px 40px 11px 40px",
                    color: "#e0e0e0", fontSize: 14, outline: "none", boxSizing: "border-box",
                    transition: "border-color .2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "#555"}
                  onBlur={e => e.target.style.borderColor = "#2a2a2a"}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#555", cursor: "pointer", padding: 4, display: "flex" }}
                >
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: "#1a0a0a", border: "1px solid #ef444444", borderRadius: 9, padding: "10px 14px", color: "#f87171", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <span>⚠</span> {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? "#1a1a1a" : "#222222",
                border: "1px solid #444",
                color: loading ? "#555" : "#e0e0e0",
                borderRadius: 10, padding: "12px",
                fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                marginTop: 4, transition: "all .2s",
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = "#666"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#444"; }}
            >
              {loading ? (
                <>
                  <span style={{ width: 14, height: 14, border: "2px solid #444", borderTopColor: "#888", borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block" }} />
                  Signing in…
                </>
              ) : "Sign In →"}
            </button>
          </form>

          {/* Footer note */}
          <p style={{ margin: "24px 0 0", textAlign: "center", color: "#333", fontSize: 11.5 }}>
            Contact your admin to create or reset accounts
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #3a3a3a !important; }
      `}</style>
    </div>
  );
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
const UserIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const LockIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);
const EyeIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
