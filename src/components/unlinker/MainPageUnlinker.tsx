import React, { useState, useEffect } from "react";
import "./unlinker.css";
import { useNavigate, useLocation } from "react-router-dom";
import ConfirmUnlinkModal from "./ConfirmUnlinkModal";

const getCSRFToken = () => {
  return document.cookie.match(/csrftoken=([^;]+)/)?.[1] || "";
};

type Phase = {
  process_step_id: number;
  description: string;
  level: number;
};

type UserData = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  last_login: string;
};

const MainPageUnlinker: React.FC = () => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [targetCode, setTargetCode] = useState("");
  const [phases, setPhases] = useState<Phase[]>([]);
  const [selectedPhases, setSelectedPhases] = useState<Phase[]>([]);
  const [serialNumbers, setSerialNumbers] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    const state = location.state as { restoredPhases: number[], restoredProduct: string } | null;
    if (state && state.restoredProduct) {
      setTargetCode(state.restoredProduct);
      setSerialNumbers("");
      fetchPhasesWithRestoration(state.restoredProduct, state.restoredPhases);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, navigate, location.pathname]);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user/auth/me/");
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        localStorage.setItem("lastLoginTimestamp", Date.now().toString());
      } else {
        setUser(null);
        localStorage.removeItem("lastLoginTimestamp");
      }
    } catch {
      setUser(null);
      localStorage.removeItem("lastLoginTimestamp");
    }
  };

  const checkSessionTimeout = (lastLoginString?: string) => {
    if (!lastLoginString) return true; 

    const lastLoginTimestamp = new Date(lastLoginString).getTime();
    const diffInMinutes = (Date.now() - lastLoginTimestamp) / 1000 / 60;
    
    return diffInMinutes > 20;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/user/auth/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCSRFToken()
        },
        body: JSON.stringify(loginForm),
      });

      if (response.ok) {
        await fetchUserData();
        setIsLoginModalOpen(false);
        setLoginForm({ username: "", password: "" });
      } else {
        alert("Błąd logowania");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/user/auth/logout/", {
      method: "POST",
      headers: { "X-CSRFToken": getCSRFToken() }
    });
    setUser(null);
    localStorage.removeItem("lastLoginTimestamp");
  };

  const fetchPhasesWithRestoration = async (code: string, restoredIds: number[]) => {
    setLoading(true);
    setSelectedPhases([]);
    try {
      const response = await fetch(`/unlinker-micro/get-all-phases/${code}/`);
      const data: Phase[] = await response.json();
      const sortedData = data.sort((a, b) => a.level - b.level);
      setPhases(sortedData);
      setSelectedPhases(sortedData.filter(p => restoredIds.includes(p.process_step_id)));
    } finally {
      setLoading(false);
    }
  };

  const handleFetchPhases = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCode) return;
    setLoading(true);
    try {
      const response = await fetch(`/unlinker-micro/get-all-phases/${targetCode}/`);
      const data: Phase[] = await response.json();
      setPhases(data.sort((a, b) => a.level - b.level));
      setSelectedPhases([]);
      setSearchTerm("");
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteUnlinkClick = () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    if (checkSessionTimeout(user.last_login)) {
      setIsLoginModalOpen(true);
      return;
    }

    if (!serialNumbers.trim() || phases.length === 0) return;
    setIsConfirmModalOpen(true);
  };

  const confirmAndExecuteUnlink = async () => {
    const topLevelPhase = phases.reduce((p, c) => (p.level > c.level) ? p : c);
    const payload = {
      product: targetCode,
      top_level_process: String(topLevelPhase.process_step_id),
      processes: selectedPhases.map(p => String(p.process_step_id)),
      sn_list_to_rework: serialNumbers.split(/[,\n]+/).map(s => s.trim()).filter(s => s !== ""),
      full_sn_list: phases.reduce((acc, p) => {
        acc[String(p.process_step_id)] = selectedPhases.some(sp => sp.process_step_id === p.process_step_id);
        return acc;
      }, {} as Record<string, boolean>)
    };

    setLoading(true);
    try {
      const response = await fetch("/api/unlinker/unlinking/start-process/", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": getCSRFToken() },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        localStorage.setItem("lastLoginTimestamp", Date.now().toString());
        setSerialNumbers("");
        setSelectedPhases([]);
        setIsConfirmModalOpen(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectPhase = (phase: Phase) => {
    if (selectedPhases.find(p => p.process_step_id === phase.process_step_id)) {
      setSelectedPhases(selectedPhases.filter(p => p.process_step_id !== phase.process_step_id));
    } else {
      setSelectedPhases([...selectedPhases, phase]);
    }
  };

  return (
    <div className="back">
      <nav className="unl-navbar">
        <div className="unl-logo"><span style={{ color: "#007bff" }}>UNLINKER</span></div>
        <div className="unl-nav-actions">
          {user ? (
            <>
              <div className="unl-nav-item" onClick={() => navigate("/history")}>🕒 Historia</div>
              <div className="unl-user-badge">👤 {user.first_name} {user.last_name}</div>
              <button className="unl-btn-logout" onClick={handleLogout}>Wyloguj</button>
            </>
          ) : (
            <button className="unl-btn-login" onClick={() => setIsLoginModalOpen(true)}>Zaloguj</button>
          )}
        </div>
      </nav>

      <div className="product-list unl-container">
        <div className="panel">
          <div className="panel-header-process" style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Unlinker System</h3>
            <form onSubmit={handleFetchPhases}>
              <input className="unl-search-input" style={{ width: '120px', margin: 0 }} type="text" placeholder="Kod..." value={targetCode} onChange={(e) => setTargetCode(e.target.value)} />
              <button type="submit" className="button-reset" disabled={loading}>{loading ? '...' : 'Pobierz'}</button>
            </form>
          </div>

          <div className="unl-main-grid">
            <div className="unl-column">
              <div className="unl-col-header unl-header-available">
                <span>Fazy ({phases.length})</span>
                <input type="text" className="unl-search-input" placeholder="Szukaj..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="unl-scroll-area">
                {phases.filter(p => p.description.toLowerCase().includes(searchTerm.toLowerCase())).map(phase => (
                  <div key={phase.process_step_id} onClick={() => toggleSelectPhase(phase)} className={`unl-phase-item ${selectedPhases.some(p => p.process_step_id === phase.process_step_id) ? 'selected' : ''}`}>
                    <div style={{ fontSize: '11px', color: '#888' }}>ID: {phase.process_step_id} | LVL: {phase.level}</div>
                    <div style={{ fontSize: '14px' }}>{phase.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="unl-column">
              <div className="unl-col-header unl-header-selected">Wybrane ({selectedPhases.length})</div>
              <div className="unl-scroll-area">
                {selectedPhases.map(phase => (
                  <div key={phase.process_step_id} className="unl-selected-item">
                    <span>{phase.description}</span>
                    <button onClick={() => toggleSelectPhase(phase)} className="unl-remove-btn">&times;</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="unl-column">
              <div className="unl-col-header unl-header-action">Numery Seryjne</div>
              <div className="unl-scroll-area" style={{ display: 'flex', flexDirection: 'column' }}>
                <textarea className="unl-textarea" value={serialNumbers} onChange={(e) => setSerialNumbers(e.target.value)} placeholder="SN..." />
                <button className={`unl-execute-btn ${selectedPhases.length && serialNumbers ? 'unl-btn-active' : 'unl-btn-inactive'}`} disabled={!selectedPhases.length || !serialNumbers || loading} onClick={handleExecuteUnlinkClick}>
                  {loading ? '...' : 'WYKONAJ UNLINK'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoginModalOpen && (
        <div className="unl-modal-overlay">
          <div className="unl-modal-content">
            <h4>Logowanie</h4>
            <form onSubmit={handleLogin}>
              <input className="unl-modal-input" type="text" placeholder="Login" value={loginForm.username} onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} />
              <input className="unl-modal-input" type="password" placeholder="Hasło" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="unl-modal-btn">Zaloguj</button>
                <button type="button" className="unl-modal-btn" style={{ backgroundColor: '#ccc' }} onClick={() => setIsLoginModalOpen(false)}>Anuluj</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmUnlinkModal isOpen={isConfirmModalOpen} onConfirm={confirmAndExecuteUnlink} onCancel={() => setIsConfirmModalOpen(false)} loading={loading} />
    </div>
  );
};

export default MainPageUnlinker;