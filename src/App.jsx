import { useState, useEffect } from "react";
import LoginPage from "./LoginPage";
import LeadsDashboard from "./LeadsDashboard";

const SESSION_KEY = "sg_dashboard_user";

export default function App() {
  const [user, setUser] = useState(() => {
    // Restore session from sessionStorage (cleared when tab/browser closes)
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const handleLogin = (userData) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <LeadsDashboard currentUser={user} onLogout={handleLogout} />;
}
