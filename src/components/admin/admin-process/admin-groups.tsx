import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./admin-groups.css";

export interface StatusGroup {
  id: number;
  name: string;
  checking: boolean;
  status: boolean;
  last_check: string;
}

const StatusGroupsTable = () => {
  const [data, setData] = useState<StatusGroup[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  
  const navigate = useNavigate(); // <--- 2. Hook do nawigacji

  const fetchData = async () => {
    try {
      const res = await fetch("/api/process/get-statuses-groups/");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Błąd pobierania danych", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

    const toggleChecking = async (id: number, current: boolean) => {
    if (loadingId === id) return;
    setLoadingId(id);

    try {
        const res = await fetch(
        `/api/process/admin/change-checking/${id}/`,
        {
            method: "PATCH",
            headers: {
            "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
            checking: !current,
            }),
        }
        );

        if (!res.ok) {
        throw new Error("PATCH failed");
        }

        setData((prev) =>
        prev.map((item) =>
            item.id === id ? { ...item, checking: !item.checking } : item
        )
        );
    } catch (err) {
        console.error("Błąd PATCH", err);
    } finally {
        setLoadingId(null);
    }
    };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="ag-container">
      <div className="ag-card">
        {/* ZMIANA W NAGŁÓWKU */}
        <div className="ag-header">
          <button 
            className="ag-back-btn" 
            onClick={() => navigate("/admin/main-page")}
            title="Wróć do panelu głównego"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <h2 className="ag-title">Grupy Statusów</h2>
        </div>
        
        <div className="ag-table-wrapper">
          <table className="ag-table">
            <thead>
              <tr>
                <th className="ag-th">Nazwa</th>
                <th className="ag-th">Status</th>
                <th className="ag-th">Monitoring</th>
                <th className="ag-th">Ostatnie sprawdzenie</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => {
                const isLoading = loadingId === item.id;
                const toggleContainerClass = `ag-toggle-container ${
                  item.checking ? "ag-toggle-on" : "ag-toggle-off"
                } ${isLoading ? "ag-toggle-loading" : ""}`;
                const toggleCircleClass = `ag-toggle-circle ${
                  item.checking ? "ag-toggle-circle-on" : "ag-toggle-circle-off"
                }`;

                return (
                  <tr
                    key={item.id}
                    className="ag-tr ag-tr-clickable"
                    onClick={() => navigate(`/admin/groups/${item.id}/places`)}
                    >
                    <td 
                        className="ag-td ag-td-name" 
                        onClick={() => navigate(`/admin/groups/${item.id}/places`)}
                    >
                        {item.name}
                    </td>
                    <td className="ag-td">
                      <span className={`ag-badge ${item.status ? "ag-badge-active" : "ag-badge-inactive"}`}>
                        {item.status ? "Aktywny" : "Nieaktywny"}
                      </span>
                    </td>
                    <td className="ag-td">
                        <div
                            className={toggleContainerClass}
                            onClick={(e) => {
                            e.stopPropagation();
                            toggleChecking(item.id, item.checking);
                            }}
                        >
                            <div className={toggleCircleClass} />
                        </div>
                    </td>
                    <td className="ag-td ag-td-date">{formatDate(item.last_check)}</td>
                  </tr>
                );
              })}
              {data.length === 0 && (
                <tr>
                  <td colSpan={4} className="ag-td ag-no-data">Brak danych do wyświetlenia</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StatusGroupsTable;