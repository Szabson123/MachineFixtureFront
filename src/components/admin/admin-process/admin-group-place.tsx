import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./admin-group-place.css";
import { getCSRFToken } from "../../../utils";

interface AppToKill {
  killing_flag: boolean;
}

interface Place {
  id: number;
  name: string;
  apptokill: AppToKill | null;
  label: string;
}

const GroupPlacesGrid = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  const [places, setPlaces] = useState<Place[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const fetchPlaces = async () => {
    if (!groupId) return;
    try {
      const res = await fetch(
        `/api/process/${groupId}/admin-process/places-in-groups/`
      );
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

  const toggleKillingFlag = async (
    placeId: number,
    currentFlag: boolean,
    hasKillSupport: boolean
  ) => {
    if (!hasKillSupport) return;
    if (loadingId === placeId) return;

    setLoadingId(placeId);

    try {
      const url = `/api/process/${groupId}/admin-process/places-in-groups/${placeId}/`;

      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCSRFToken() || "",
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
        <button className="gp-back-btn" onClick={() => navigate("/admin/groups")}>
          ← Wróć do grup
        </button>
        <h2 className="gp-title">Miejsca w grupie #{groupId}</h2>
      </div>

      <div className="gp-grid">
        {places.map((place) => {
          const hasKillSupport = place.apptokill !== null;
          const isKilling = place.apptokill?.killing_flag ?? false;
          const isLoading = loadingId === place.id;

          return (
            <div
              key={place.id}
              className={`gp-card gp-card-clickable ${
                !hasKillSupport ? "gp-card-disabled" : ""
              }`}
              onClick={() => navigate(`/admin/place-list/${place.id}`)}
            >
              <div className="gp-card-header">
                <h3 className="gp-card-title">
                  {place.name} – {place.label}
                </h3>
              </div>

              <div className="gp-card-body">
                <div className="gp-status-row">
                  <span className="gp-label">
                    Status Zabijania Aplikacji:
                  </span>
                  <span
                    className={`gp-status-text ${
                      !hasKillSupport
                        ? "gp-status-disabled"
                        : isKilling
                        ? "gp-status-on"
                        : "gp-status-off"
                    }`}
                  >
                    {!hasKillSupport
                      ? "NIEDOSTĘPNE"
                      : isKilling
                      ? "AKTYWNE"
                      : "NIEAKTYWNE"}
                  </span>
                </div>

                {hasKillSupport ? (
                  <div
                    className={`gp-toggle-container ${
                      isKilling ? "gp-toggle-on" : "gp-toggle-off"
                    } ${isLoading ? "gp-toggle-loading" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleKillingFlag(
                        place.id,
                        isKilling,
                        hasKillSupport
                      );
                    }}
                  >
                    <div
                      className={`gp-toggle-circle ${
                        isKilling
                          ? "gp-toggle-circle-on"
                          : "gp-toggle-circle-off"
                      }`}
                    />
                  </div>
                ) : (
                  <div className="gp-no-toggle">Brak obsługi</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {places.length === 0 && (
        <div className="gp-empty">
          Brak miejsc zdefiniowanych w tej grupie.
        </div>
      )}
    </div>
  );
};

export default GroupPlacesGrid;
