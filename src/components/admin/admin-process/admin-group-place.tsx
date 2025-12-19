import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./admin-group-place.css";

interface AppToKill {
  killing_flag: boolean;
}

interface Place {
  id: number;
  name: string;
  apptokill: AppToKill;
  label: string
}

const GroupPlacesGrid = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // Pobieranie danych
  const fetchPlaces = async () => {
    if (!groupId) return;
    try {
      const res = await fetch(`/api/process/${groupId}/admin-process/places-in-groups/`);
      if (res.ok) {
        const json = await res.json();
        setPlaces(json);
      } else {
        console.error("Błąd sieci:", res.status);
      }
    } catch (err) {
      console.error("Błąd pobierania miejsc:", err);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, [groupId]);

  const toggleKillingFlag = async (placeId: number, currentFlag: boolean) => {
    if (loadingId === placeId) return;
    setLoadingId(placeId);

    try {
      // Endpoint zgodnie z Twoim opisem
      const url = `/api/process/${groupId}/admin-process/places-in-groups/${placeId}/`;
      
      const res = await fetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
            apptokill: {
            killing_flag: !currentFlag,
            },
        }),
        });

      if (res.ok) {
        setPlaces((prev) =>
          prev.map((place) =>
            place.id === placeId
              ? {
                  ...place,
                  apptokill: {
                    ...place.apptokill,
                    killing_flag: !currentFlag,
                  },
                }
              : place
          )
        );
      } else {
        console.error("Błąd aktualizacji flagi");
      }
    } catch (err) {
      console.error("Błąd połączenia:", err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="gp-container">
      <div className="gp-header-wrapper">
        <button 
          className="gp-back-btn" 
          onClick={() => navigate("/admin/groups")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Wróć do grup
        </button>
        <h2 className="gp-title">Miejsca w grupie #{groupId}</h2>
      </div>

      {/* Grid z kafelkami */}
      <div className="gp-grid">
        {places.map((place) => {
          const isKilling = place.apptokill.killing_flag;
          const isLoading = loadingId === place.id;

          return (
            <div
                key={place.id}
                className="gp-card gp-card-clickable"
                onClick={() => navigate(`/admin/place-list/${place.id}`)}
                >
              <div className="gp-card-header">
                <div className="gp-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                </div>
                <h3 className="gp-card-title">{place.name} - {place.label}</h3>
              </div>

              <div className="gp-card-body">
                <div className="gp-status-row">
                  <span className="gp-label">Status Zabijania Aplikacji:</span>
                  <span className={`gp-status-text ${isKilling ? "gp-status-on" : "gp-status-off"}`}>
                    {isKilling ? "AKTYWNE" : "NIEAKTYWNE"}
                  </span>
                </div>
                <div 
                className={`gp-toggle-container ${isKilling ? "gp-toggle-on" : "gp-toggle-off"} ${isLoading ? "gp-toggle-loading" : ""}`}
                onClick={(e) => {
                    e.stopPropagation(); // 🔴 BLOKADA KLIKNIĘCIA CARD
                    toggleKillingFlag(place.id, isKilling);
                }}
                >
                <div
                    className={`gp-toggle-circle ${isKilling ? "gp-toggle-circle-on" : "gp-toggle-circle-off"}`}
                />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {places.length === 0 && (
        <div className="gp-empty">Brak miejsc zdefiniowanych w tej grupie.</div>
      )}
    </div>
  );
};

export default GroupPlacesGrid;