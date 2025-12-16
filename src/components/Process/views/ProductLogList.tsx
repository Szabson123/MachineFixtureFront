import React, { useState } from "react";
import "./logs.css";

// Aktualizacja typu zgodnie z nową odpowiedzią API
type ProductLog = {
  id: number;
  entry_time: string;
  who_entry: string | null;
  full_sn: string;
  process_name: string;
  place_name: string;
  movement_type: string;
};

const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const getLogStyle = (type: string) => {
  switch (type) {
    case "create":
      return { className: "type-create", label: "Utworzenie" };
    case "receive":
      return { className: "type-receive", label: "Przyjęcie" };
    case "move":
      return { className: "type-move", label: "Wyciągniecie" };
    case "trash":
      return { className: "type-trash", label: "Utylizacja" };
    default:
      return { className: "type-other", label: type || "Inne" };
  }
};

const ProductLogList: React.FC = () => {
  const [sn, setSn] = useState<string>("");
  const [logs, setLogs] = useState<ProductLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fetchLogs = async () => {
    if (!sn) return;

    setLoading(true);
    setError("");
    setLogs([]);

    try {
      const response = await fetch(
        `/api/process/product-object-process-logs/?sn=${sn}`
      );
      if (!response.ok) {
        throw new Error("Błąd pobierania logów");
      }

      const data: ProductLog[] = await response.json();

      if (data.length === 0) {
        throw new Error("Nie znaleziono logów dla podanego numeru SN");
      }

      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      fetchLogs();
      setSn("");
    };

  return (
    <div className="t-container">
      <form onSubmit={handleSubmit} className="t-form">
        <input
          autoFocus
          type="text"
          value={sn}
          onChange={(e) => setSn(e.target.value)}
          placeholder="Wpisz numer SN"
          className="t-input"
        />
        <button type="submit" className="t-button">
          Szukaj
        </button>
      </form>

      {loading && <p className="loading">Ładowanie historii...</p>}
      {error && <p className="center-red">{error}</p>}
      
      {!loading && !error && logs.length === 0 && sn && (
        <p className="loading">Wpisz SN i kliknij Szukaj, aby zobaczyć historię.</p>
      )}

      <ul className="t-log-list">
        {logs.map((log) => {
          const { className, label } = getLogStyle(log.movement_type);

          return (
            <li key={log.id} className={`t-log-item ${className}`}>
              <div className="t-card-header">
                <span className="t-timestamp">
                   {formatDate(log.entry_time)}
                </span>
                <span className="t-badge">{label}</span>
              </div>

              <div className="t-card-body">
                <div className="t-log-title">{log.process_name}</div>
                <div className="t-log-place">
                  Lokalizacja: <strong>{log.place_name}</strong>
                </div>
              </div>

              <div className="t-card-footer">
                <div className="t-user-info">
                  Operator: <strong>{log.who_entry || "System/Nieznany"}</strong>
                </div>
                <div className="t-log-sn">SN: {log.full_sn}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ProductLogList;