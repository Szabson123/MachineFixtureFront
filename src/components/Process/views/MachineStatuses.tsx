import React, { useEffect, useState } from "react";
import "./MachineStatuses.css";
import { useNavigate } from "react-router-dom";

type GroupStatus = {
  id: number;
  name: string;
  last_check: string;
  status: boolean;
};

const MachineStatuses: React.FC = () => {
  const [groups, setGroups] = useState<GroupStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = () => {
    fetch("/api/process/get-statuses-groups/")
      .then((res) => res.json())
      .then((data: GroupStatus[]) => {
        setGroups(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Błąd przy pobieraniu:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="m-loading">Ładowanie danych...</div>;
  }

  return (
    <div className="m-container">
        <button
          className="back-button"
          onClick={() => navigate(`/process/`)}
        >
          ← Powrót
        </button>
      <h2 className="m-header">Statusy grup maszyn</h2>
      
      <table className="m-groups-table">
        <thead className="m-table-header">
          <tr>
            <th>Nazwa grupy</th>
            <th>Ostatnia godzina odpowiedzi</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <tr key={group.id} className="m-table-row">
              <td className="m-table-cell m-group-name" data-label="Nazwa grupy">
                {group.name}
              </td>
              <td className="m-table-cell m-group-time" data-label="Ostatni check">
                {new Date(group.last_check).toLocaleString("pl-PL", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit"
                    })}
              </td>
              <td className="m-table-cell" data-label="Status">
                <div className="m-status-cell">
                  {group.status ? (
                    <>
                      <span className="m-status-icon">✅</span>
                      <span className="m-status-ok">AKTYWNY</span>
                    </>
                  ) : (
                    <>
                      <span className="m-status-icon">❌</span>
                      <span className="m-status-error">NIE AKTYWNY</span>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="m-refresh-info">
        Dane odświeżane automatycznie co 60 sekund
      </div>
    </div>
  );
};

export default MachineStatuses;