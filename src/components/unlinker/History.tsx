import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./unlinker.css";

type ProcessData = {
  id: number;
  code: string;
  phases: Record<string, boolean>;
  error_code: string | null;
};

type HistoryRecord = {
  id: number;
  status: string;
  time_date: string;
  processdata: ProcessData[];
};

const statusMap: Record<string, { label: string; class: string }> = {
  IP: { label: "W toku", class: "unl-status-ip" },
  SC: { label: "Sukces", class: "unl-status-sc" },
  ER: { label: "Błąd", class: "unl-status-er" },
  UN: { label: "Nieznany", class: "unl-status-un" },
};

const History: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch("/api/unlinker/unlinking/history/");
        
        if (response.status === 401 || response.status === 403) {
          throw new Error("Sesja wygasła. Zaloguj się ponownie.");
        }
        
        if (!response.ok) throw new Error("Błąd podczas pobierania danych");
        
        const data = await response.json();
        setHistory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nieznany błąd");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleRestore = (record: HistoryRecord) => {
    const restoredPhaseIds = new Set<number>();
    let productCode = "";

    record.processdata.forEach(pd => {
      if (!productCode && pd.code) {
        productCode = pd.code;
      }
      
      Object.keys(pd.phases).forEach(phaseId => {
        if (pd.phases[phaseId] === true) {
          restoredPhaseIds.add(Number(phaseId));
        }
      });
    });
    
    navigate("/unlinker/main-page", { 
      state: { 
        restoredPhases: Array.from(restoredPhaseIds),
        restoredProduct: productCode
      } 
    });
  };

  const renderPhases = (phases: Record<string, boolean>) => {
    const keys = Object.keys(phases);
    if (keys.length === 0) return <span>Brak danych</span>;
    const completedCount = keys.filter(k => phases[k]).length;

    return (
      <div title={`Wybrano ${completedCount} z ${keys.length} faz`}>
        {completedCount} / {keys.length}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="back">
      <nav className="unl-navbar">
        <span className="unl-nav-link" onClick={() => navigate("/unlinker/main-page")} style={{ cursor: 'pointer' }}>
          ← Powrót do Panelu
        </span>
      </nav>

      <div className="product-list unl-container">
        <div className="panel">
          <div className="panel-header-process">
            <h3>Twoja Historia Unlinków</h3>
          </div>

          <div style={{ padding: "20px" }}>
            {loading && <div className="loading">Ładowanie historii...</div>}
            {error && (
              <div className="error" style={{ color: '#dc3545', marginBottom: '10px', fontWeight: 'bold' }}>
                {error}
              </div>
            )}

            {!loading && !error && history.length > 0 ? (
              <table className="unl-history-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Data i Czas</th>
                    <th>Status</th>
                    <th>Szczegóły operacji</th>
                    <th style={{ textAlign: "center" }}>Akcja</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record) => (
                    <tr key={record.id}>
                      <td style={{ fontWeight: "bold" }}>#{record.id}</td>
                      <td style={{ fontSize: "14px", color: "#555" }}>
                        {formatDate(record.time_date)}
                      </td>
                      <td>
                        <span className={`unl-status-pill ${statusMap[record.status]?.class || 'unl-status-un'}`}>
                          {statusMap[record.status]?.label || record.status}
                        </span>
                      </td>
                      <td style={{ padding: 0 }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <tbody>
                            {record.processdata.length > 0 ? (
                              record.processdata.map((pd) => (
                                <tr key={pd.id} className="unl-sub-row">
                                  <td style={{ border: "none", width: "40%", padding: "8px" }}>
                                    Kod: <strong>{pd.code}</strong>
                                  </td>
                                  <td style={{ border: "none", width: "30%", padding: "8px" }}>
                                    Fazy: {renderPhases(pd.phases)}
                                  </td>
                                  <td style={{ border: "none", color: pd.error_code ? "#dc3545" : "#28a745", padding: "8px" }}>
                                    {pd.error_code || "OK"}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3} style={{ border: "none", padding: "10px", color: "#666" }}>
                                  Brak szczegółów procesu.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </td>
                      <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                        <button 
                          className="unl-btn-restore" 
                          onClick={() => handleRestore(record)}
                          style={{ 
                            padding: '8px 12px', 
                            cursor: 'pointer', 
                            backgroundColor: '#17a2b8', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            fontWeight: 'bold' 
                          }}
                          disabled={record.processdata.length === 0}
                        >
                          Powtórz
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              !loading && !error && <div className="empty-state">Nie znaleziono żadnych operacji w Twojej historii.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;