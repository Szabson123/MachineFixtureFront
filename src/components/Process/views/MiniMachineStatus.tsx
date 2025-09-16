import React, { useEffect, useState } from "react";
import "./MiniMachineStatuses.css";

type GroupStatus = {
  id: number;
  name: string;
  status: boolean;
};

const MiniMachineStatuses: React.FC = () => {
  const [groups, setGroups] = useState<GroupStatus[]>([]);
  const [loading, setLoading] = useState(true);

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
    return <div className="mini-loading">Ładowanie statusów...</div>;
  }

  return (
    <div className="mini-container">
      {groups.map((group) => (
        <div key={group.id} className="mini-card">
          <span className="mini-name">{group.name}</span>
          <span
            className={group.status ? "mini-status-ok" : "mini-status-error"}
          >
            {group.status ? "✅ Aktywny" : "❌ Nieaktywny"}
          </span>
        </div>
      ))}
    </div>
  );
};

export default MiniMachineStatuses;
