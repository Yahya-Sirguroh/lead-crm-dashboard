import { useState, useEffect } from "react";

const API_BASE = "/api";

export default function UserManagementModal({ currentUser, onClose }) {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // Add user form
  const [name, setName]         = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole]         = useState("user");
  const [showPw, setShowPw]     = useState(false);
  const [adding, setAdding]     = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  const fetchUsers = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/users`);
      if (!res.ok) throw new Error("Failed to load users");
      setUsers(await res.json());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddError(""); setAddSuccess("");
    if (!name.trim() || !username.trim() || !password) { setAddError("All fields are required."); return; }
    setAdding(true);
    try {
      const res = await fetch(`${API_BASE}/auth/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), username: username.trim(), password, role }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error || "Failed to add user."); return; }
      setAddSuccess(`User "${data.name}" created successfully!`);
      setName(""); setUsername(""); setPassword(""); setRole("user");
      fetchUsers();
    } catch (err) { setAddError("Network error."); }
    finally { setAdding(false); }
  };

  const handleDeactivate = async (userId, currentActive) => {
    if (userId === currentUser._id?.toString()) { alert("You cannot deactivate your own account."); return; }
    try {
      await fetch(`${API_BASE}/auth/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      fetchUsers();
    } catch (err) { alert("Failed to update user."); }
  };

  const inputStyle = {
    background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 9,
    padding: "9px 12px", color: "#e0e0e0", fontSize: 13, outline: "none",
    width: "100%", boxSizing: "border-box", transition: "border-color .2s",
  };
  const labelStyle = { color: "#666", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, display: "block", marginBottom: 5 };

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 800 }} />

      {/* Panel */}
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: "min(560px, 95vw)", maxHeight: "90vh", overflowY: "auto",
        background: "#111", border: "1px solid #2a2a2a", borderRadius: 18,
        zIndex: 900, padding: "28px 28px 24px",
        boxShadow: "0 32px 80px #000000aa",
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#f0f0f0" }}>User Management</h2>
            <p style={{ margin: "4px 0 0", color: "#555", fontSize: 12 }}>Manage dashboard access</p>
          </div>
          <button onClick={onClose} style={{ background: "#1a1a1a", border: "1px solid #333", color: "#888", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CloseIcon />
          </button>
        </div>

        {/* Add User Form */}
        <div style={{ background: "#161616", border: "1px solid #222", borderRadius: 13, padding: "20px", marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "#aaa", letterSpacing: 0.5 }}>➕ ADD NEW USER</h3>
          <form onSubmit={handleAdd} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 14px" }}>
            <div>
              <label style={labelStyle}>FULL NAME</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rahul Sharma" style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#555"} onBlur={e => e.target.style.borderColor = "#2a2a2a"} />
            </div>
            <div>
              <label style={labelStyle}>USERNAME</label>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. rahul.sharma" style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#555"} onBlur={e => e.target.style.borderColor = "#2a2a2a"} />
            </div>
            <div style={{ position: "relative" }}>
              <label style={labelStyle}>PASSWORD</label>
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Set a password" style={{ ...inputStyle, paddingRight: 36 }}
                onFocus={e => e.target.style.borderColor = "#555"} onBlur={e => e.target.style.borderColor = "#2a2a2a"} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: "absolute", right: 10, bottom: 9, background: "none", border: "none", color: "#555", cursor: "pointer", display: "flex" }}>
                {showPw ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            <div>
              <label style={labelStyle}>ROLE</label>
              <select value={role} onChange={e => setRole(e.target.value)}
                style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {addError && (
              <div style={{ gridColumn: "1/-1", background: "#1a0a0a", border: "1px solid #ef444444", borderRadius: 8, padding: "8px 12px", color: "#f87171", fontSize: 12 }}>
                ⚠ {addError}
              </div>
            )}
            {addSuccess && (
              <div style={{ gridColumn: "1/-1", background: "#0a1a0a", border: "1px solid #4ade8055", borderRadius: 8, padding: "8px 12px", color: "#4ade80", fontSize: 12 }}>
                ✓ {addSuccess}
              </div>
            )}

            <button type="submit" disabled={adding} style={{
              gridColumn: "1/-1", background: adding ? "#1a1a1a" : "#222",
              border: "1px solid #444", color: adding ? "#555" : "#e0e0e0",
              borderRadius: 9, padding: "10px", fontSize: 13, fontWeight: 700,
              cursor: adding ? "not-allowed" : "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", gap: 7,
            }}>
              {adding ? "Creating…" : "Create User"}
            </button>
          </form>
        </div>

        {/* Existing Users */}
        <div>
          <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#aaa", letterSpacing: 0.5 }}>👥 EXISTING USERS</h3>
          {loading && <div style={{ color: "#555", fontSize: 13, padding: "20px 0", textAlign: "center" }}>Loading…</div>}
          {error && <div style={{ color: "#f87171", fontSize: 13 }}>⚠ {error}</div>}
          {!loading && !error && users.length === 0 && <div style={{ color: "#444", fontSize: 13 }}>No users found.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {users.map(u => (
              <div key={u._id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "#161616", border: "1px solid #222", borderRadius: 10,
                padding: "12px 14px", gap: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", color: "#666", flexShrink: 0 }}>
                    <UserIcon />
                  </div>
                  <div>
                    <div style={{ color: "#e0e0e0", fontWeight: 700, fontSize: 13 }}>{u.name}</div>
                    <div style={{ color: "#555", fontSize: 11.5 }}>@{u.username || "—"}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    padding: "3px 10px", borderRadius: 20, fontSize: 10.5, fontWeight: 700,
                    background: u.role === "admin" ? "#1a1a3a" : "#1a1a1a",
                    color: u.role === "admin" ? "#818cf8" : "#666",
                    border: `1px solid ${u.role === "admin" ? "#3730a3" : "#2a2a2a"}`,
                  }}>
                    {u.role === "admin" ? "ADMIN" : "USER"}
                  </span>
                  {u._id?.toString() !== currentUser._id?.toString() && (
                    <button
                      onClick={() => handleDeactivate(u._id?.toString(), u.isActive)}
                      title={u.isActive ? "Deactivate user" : "Reactivate user"}
                      style={{
                        background: "none", border: `1px solid ${u.isActive ? "#3a1a1a" : "#1a3a1a"}`,
                        color: u.isActive ? "#ef4444" : "#4ade80",
                        borderRadius: 7, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600,
                      }}>
                      {u.isActive ? "Deactivate" : "Reactivate"}
                    </button>
                  )}
                  {u._id?.toString() === currentUser._id?.toString() && (
                    <span style={{ fontSize: 11, color: "#444" }}>you</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const CloseIcon = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const UserIcon  = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const EyeIcon   = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
const EyeOffIcon = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
