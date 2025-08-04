import React, { useState } from "react";
import "./logs.css";

const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

type ProductLog = {
  entry_time: string;
  who_entry: string | null;
  exit_time: string | null;
  who_exit: string | null;
  full_sn: string;
  process_name: string;
  place_name: string;
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
    setLogs([]); // Czyść logi przed nowym zapytaniem

    try {
      const response = await fetch(`/api/process/product-object-process-logs/?sn=${sn}`);
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
    setSn(""); // Czyść input po wyszukiwaniu
  };

  return (
    <div className="t-container">
      <form onSubmit={handleSubmit} className="t-form">
        <input
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

      {loading && <p className="loading">Ładowanie...</p>}
      {error && <p className="center-red">{error}</p>}
      {!loading && !error && logs.length === 0 && (
        <p className="loading">Brak wyników dla podanego numeru SN.</p>
      )}

      <ul className="t-log-list">
        {logs.map((log, idx) => (
          <li key={idx} className="t-log-item">
            <div className="t-log-entry">
              <strong>Wejście:</strong> {formatDate(log.entry_time)}
              {log.who_entry && ` (osoba: ${log.who_entry})`}
            </div>
            {log.exit_time && (
              <div className="t-log-exit">
                <strong>Wyjście:</strong> {formatDate(log.exit_time)}
                {log.who_exit && ` (osoba: ${log.who_exit})`}
              </div>
            )}
            <div className="t-log-title">{log.process_name}</div>
            <div className="t-log-place">{log.place_name}</div>
            <div className="t-log-sn">SN: {log.full_sn}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductLogList;
