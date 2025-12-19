import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './admin-process-mistakes.css';

interface LogItem {
  id: number;
  log_type: string;
  date: string;
  who_value: string;
  movement: string;
  info: string | null;
  proc_label: string;
  pl_name: string;
  product_object_name: string | null; // <--- NOWE POLE
}

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: LogItem[];
}

const AdminPlaceDetailsPage: React.FC = () => {
  const { placeId } = useParams<{ placeId: string }>();
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
      
      const relativeNext = data.next 
        ? new URL(data.next).pathname + new URL(data.next).search
        : null;

      setNextPageUrl(relativeNext);
      setTotalCount(data.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd sieci");
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    if (placeId) {
      setLogs([]);
      setNextPageUrl(null);
      fetchLogs(`/api/process/place/${placeId}/admin-logs/`, true);
    }
  }, [placeId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
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

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Zapobiega kliknięciu w wiersz tabeli
    navigator.clipboard.writeText(text);
  };

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

  if (!placeId) return <div className="d-container">Błąd: Brak ID miejsca</div>;

  return (
    <div className="d-container">
      
      <button onClick={() => navigate(-1)} className="d-back-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Wróć
      </button>

      <header className="d-header">
        <h1>Historia Miejsca</h1>
        <div className="d-meta">
          <div className="d-meta-item">
            ID Miejsca: <span className="d-mono">{placeId}</span>
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
                <th>Obiekt</th> {/* <--- NOWY NAGŁÓWEK */}
                <th>Proces / Label</th>
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
                  <td>
                    {log.product_object_name ? (
                        <span 
                        onClick={(e) => handleCopy(log.product_object_name!, e)}
                        title={`${log.product_object_name} (Kliknij, aby skopiować)`}
                        className="d-copy-link" // Możesz dodać klasę lub style inline poniżej
                        style={{ 
                            cursor: 'copy', // Kursor sugerujący kopiowanie
                            fontWeight: 500,
                            color: '#2B6CB0',
                        }}
                        >
                        {log.product_object_name.length > 10 
                            ? `${log.product_object_name.substring(0, 10)}...` 
                            : log.product_object_name}
                        </span>
                    ) : (
                        <span style={{ color: '#CBD5E0' }}>-</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 500 }}>{log.proc_label}</td> 
                  <td>{log.who_value}</td>
                  <td style={{ textTransform: 'capitalize' }}>{log.movement}</td>
                  <td>
                    {log.info ? (
                      <div>
                        <span className="d-badge error">Błąd</span>
                        <span className="d-error-text">{log.info}</span>
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
          <p>W tym miejscu nie zarejestrowano jeszcze żadnych akcji.</p>
        </div>
      )}
      
      {!loading && !nextPageUrl && logs.length > 0 && (
        <div className="d-loader-area">Koniec historii.</div>
      )}

    </div>
  );
};

export default AdminPlaceDetailsPage;