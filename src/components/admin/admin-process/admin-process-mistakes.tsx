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
  product_object_name: string | null;
  object_id: number | null;
}

interface PlaceItem {
  id: number;
  name: string;
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

  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [placesLoading, setPlacesLoading] = useState<boolean>(true);

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
    const fetchPlaces = async () => {
      if (!processId) return;
      try {
        const response = await fetch(`/api/process/${processId}/place/`);
        if (!response.ok) throw new Error("Błąd pobierania miejsc");
        const data: PlaceItem[] = await response.json();
        setPlaces(data);
      } catch (err) {
        console.error(err);
      } finally {
        setPlacesLoading(false);
      }
    };

    fetchPlaces();
  }, [processId]);

  useEffect(() => {
    if (processId) {
      setLogs([]);
      setNextPageUrl(null);
      fetchLogs(`/api/process/process/${processId}/admin-logs/`, true);
    }
  }, [processId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextPageUrl && !loading) {
          fetchLogs(nextPageUrl, false);
        }
      },
      { threshold: 0.1 } 
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [nextPageUrl, loading, fetchLogs]);

    const handleGoToObject = (
      objectId: number,
      e: React.MouseEvent
    ) => {
      e.stopPropagation();

      navigate(`/admin/products/objects/${objectId}`);
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

  if (!processId) return <div className="d-container">Błąd: Brak ID</div>;

  return (
    <div className="d-split-layout">
      <div className="d-fixed-header">
        <button onClick={() => navigate('/admin/process-list')} className="d-back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Powrót do listy
        </button>
        <div className="d-header-content">
          <h1>Historia Procesu</h1>
          <div className="d-meta">
            <div className="d-meta-item">ID: <span className="d-mono">{processId}</span></div>
            <div className="d-meta-item">Wpisów: <strong>{totalCount}</strong></div>
          </div>
        </div>
      </div>
      <div className="d-split-content">
        <div className="d-panel-left">
          <h3 className="d-panel-title">Logi Operacji</h3>
          
          {logs.length > 0 ? (
            <div className="d-table-wrapper">
              <table className="d-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>ID</th>
                    <th style={{ width: '120px' }}>Data</th>
                    <th>Obiekt</th> {/* <--- NOWY NAGŁÓWEK */}
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
                     <td>
                        {log.product_object_name ? (
                            <span 
                            onClick={(e) => handleGoToObject(log.object_id!, e)}
                            title={`${log.product_object_name} (Kliknij, aby przekierować)`}
                            className="d-copy-link"
                            style={{ 
                                cursor: 'copy',
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

                      <td style={{ fontWeight: 500 }}>{log.pl_name}</td>
                      <td>{log.who_value}</td>
                      <td style={{ textTransform: 'capitalize' }}>{log.movement}</td>
                      <td>
                        {log.info ? (
                          <div title={log.info}>
                             <span className="d-badge error">Błąd</span>
                          </div>
                        ) : (
                          <span className="d-badge success">OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div ref={observerTarget} className="d-loader-area">
                {loading && <div className="d-spinner"></div>}
              </div>
            </div>
          ) : (
            !loading && <div className="d-empty-state">Brak logów.</div>
          )}
          {error && <div className="d-error-msg">{error}</div>}
        </div>

        <div className="d-panel-right">
          <h3 className="d-panel-title">Dostępne Miejsca</h3>
          
          {placesLoading ? (
             <div className="d-loader-area"><div className="d-spinner"></div></div>
          ) : (
            <div className="d-mini-list">
              {places.length > 0 ? (
                <table className="d-mini-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nazwa Miejsca</th>
                    </tr>
                  </thead>
                 <tbody>
                    {places.map(place => (
                        <tr 
                        key={place.id} 
                        onClick={() => navigate(`/admin/place-list/${place.id}`)}
                        style={{ cursor: 'pointer' }}
                        >
                        <td className="d-mono">#{place.id}</td>
                        <td style={{ fontWeight: 600 }}>{place.name}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
              ) : (
                <div className="d-empty-state small">Brak przypisanych miejsc.</div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminProcessDetailsPage;