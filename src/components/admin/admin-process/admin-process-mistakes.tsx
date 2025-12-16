import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './admin-process-mistakes.css';

interface LogItem {
  id: number;
  log_type: string;
  date: string;
  who: string;
  movement_type: string;
  error_message: string | null;
  process_label: string;
  place_name: string;
}

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: LogItem[];
}

const AdminProcessDetailsPage: React.FC = () => {
  const { processId } = useParams<{ processId: string }>();
  const navigate = useNavigate();

  const [logs, setLogs] = useState<LogItem[]>([]);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);

  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async (url: string, isInitial: boolean = false) => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data: ApiResponse = await response.json();

      setLogs(prev => isInitial ? data.results : [...prev, ...data.results]);
      
      // --- TUTAJ FIX ---
      // Backend zwraca np: "http://127.0.0.1:8000/api/...?page=2"
      // My wyciągamy z tego tylko: "/api/...?page=2"
      const relativeNext = data.next 
        ? new URL(data.next).pathname + new URL(data.next).search
        : null;

      setNextPageUrl(relativeNext);
      // ----------------

      setTotalCount(data.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd sieci");
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Pierwsze ładowanie
  useEffect(() => {
    if (processId) {
      setLogs([]);
      setNextPageUrl(null);
      fetchLogs(`/api/process/process/${processId}/admin-logs/`, true);
    }
  }, [processId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Jeśli widoczny + mamy następny URL + nie ładujemy teraz
        if (entries[0].isIntersecting && nextPageUrl && !loading) {
          fetchLogs(nextPageUrl, false);
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [nextPageUrl, loading, fetchLogs]);

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return (
      <>
        <span style={{ fontWeight: 600 }}>{d.toLocaleDateString()}</span>
        <br />
        <span style={{ fontSize: '0.8em', color: '#718096' }}>{d.toLocaleTimeString()}</span>
      </>
    );
  };

  if (!processId) return <div className="d-container">Błąd: Brak ID</div>;

  return (
    <div className="d-container">
      
      <button onClick={() => navigate('/admin/process-list')} className="d-back-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Powrót do listy
      </button>

      <header className="d-header">
        <h1>Historia Procesu</h1>
        <div className="d-meta">
          <div className="d-meta-item">
            ID: <span className="d-mono">{processId}</span>
          </div>
          <div className="d-meta-item">
            Wpisów: <strong>{totalCount}</strong>
          </div>
        </div>
      </header>

      {logs.length > 0 && (
        <div className="d-table-wrapper">
          <table className="d-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th style={{ width: '150px' }}>Data</th>
                <th>Stanowisko</th>
                <th>Operator</th>
                <th>Ruch</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td><span className="d-mono">#{log.id}</span></td>
                  <td>{formatDate(log.date)}</td>
                  <td style={{ fontWeight: 500 }}>{log.place_name}</td>
                  <td>{log.who}</td>
                  <td style={{ textTransform: 'capitalize' }}>{log.movement_type}</td>
                  <td>
                    {log.error_message ? (
                      <div>
                        <span className="d-badge error">Błąd</span>
                        <span className="d-error-text">{log.error_message}</span>
                      </div>
                    ) : (
                      <span className="d-badge success">OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Infinite scroll trigger */}
      <div ref={observerTarget} className="d-loader-area">
        {loading && (
          <>
            <div className="d-spinner"></div>
            <div>Pobieranie danych...</div>
          </>
        )}
      </div>

      {error && (
        <div className="d-loader-area" style={{ color: '#E53E3E' }}>
          Wystąpił błąd: {error}
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="d-empty-state">
          <h3>Brak historii</h3>
          <p>Dla wybranego procesu nie znaleziono żadnych logów.</p>
        </div>
      )}
      
      {!loading && !nextPageUrl && logs.length > 0 && (
        <div className="d-loader-area">Koniec historii.</div>
      )}

    </div>
  );
};

export default AdminProcessDetailsPage;