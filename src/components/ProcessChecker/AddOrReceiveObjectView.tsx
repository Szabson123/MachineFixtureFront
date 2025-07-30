import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ProcessAddView.css";

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("pl-PL");

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString("pl-PL");

function getCookie(name: string): string {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(";").shift()!;
  return "";
}

interface ProductObject {
  id: number;
  serial_number: string;
  created_at: string;
  production_date: string;
  expire_date: string;
  exp_date_in_process?: string;
  current_place?: string | null;
  initial_who_entry: string;
  quranteen_time?: string | null;
  is_mother?: boolean;
}

interface Props {
  endpointType: "add" | "receive";
}

const AddOrReceiveObjectView: React.FC<Props> = ({ endpointType }) => {
  const { productId } = useParams<{ productId: string }>();
  const selectedProcess = JSON.parse(localStorage.getItem("selectedProcess") || "{}");
  const userId = localStorage.getItem("userIdentifier") || "";
  const navigate = useNavigate();

  const [expandedMotherId, setExpandedMotherId] = useState<number | null>(null);
  const [childrenMap, setChildrenMap] = useState<Record<number, ProductObject[]>>({});

  const [productObjects, setProductObjects] = useState<ProductObject[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [showChangePlaceModal, setShowChangePlaceModal] = useState(false);
  const [placeForm, setPlaceForm] = useState({obj_full_sn: "", place_name: "",});

  const fullSnInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_sn: "",
    place_name: "",
    who_entry: userId,
  });

  const baseUrl = `/api/process/${productId}/${selectedProcess.id}/product-objects/?place_isnull=true`;

  const normalizeUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.pathname + parsed.search;
    } catch {
      return url;
    }
  };
  
  const fetchObjects = async (url: string, append = false) => {
    try {
      const normalizedUrl = normalizeUrl(url);
      const response = await fetch(normalizedUrl);
      const data = await response.json();
  
      setProductObjects((prev) => (append ? [...prev, ...data.results] : data.results));
      setNextPageUrl(data.next);
      setTotalCount(data.count);
    } catch (err) {
    }
  };

  useEffect(() => {
    fetchObjects(baseUrl);
  }, [baseUrl]);

  useEffect(() => {
    if (showModal && fullSnInputRef.current) {
      fullSnInputRef.current.focus();
    }
  }, [showModal]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && nextPageUrl) {
          fetchObjects(nextPageUrl, true);
        }
      },
      { rootMargin: "100px" }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, [nextPageUrl]);

  const handleMotherClick = async (motherId: number) => {
    if (expandedMotherId === motherId) {
      setExpandedMotherId(null);
      return;
    }

    setExpandedMotherId(motherId);

    if (childrenMap[motherId]) return;

    try {
      const response = await fetch(`/api/process/${productId}/product-objects/${motherId}/children/`);
      if (!response.ok) throw new Error("Błąd podczas pobierania dzieci kartonu");

      const data = await response.json();
      setChildrenMap((prev) => ({ ...prev, [motherId]: data }));
    } catch (error) {
      console.error(error);
      alert("Nie udało się pobrać zawartości kartonu.");
    }
  };

  useEffect(() => {
    const availablePlaces: { name: string }[] = JSON.parse(
      localStorage.getItem("availablePlaces") || "[]"
    );

    const inputBufferRef = { current: "" };
    let inputTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.length === 1) {
        inputBufferRef.current += e.key;

        if (inputTimeout) clearTimeout(inputTimeout);

        inputTimeout = setTimeout(() => {
          const scanned = inputBufferRef.current.trim().toLowerCase();
          const match = availablePlaces.find((p) => p.name.toLowerCase() === scanned);

          if (match && !showModal) {
            setFormData((prev) => ({
              ...prev,
              place_name: match.name,
            }));
            setShowModal(true);
            setTimeout(() => fullSnInputRef.current?.focus(), 0);
          }

          inputBufferRef.current = "";
        }, 500);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowErrorModal(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { full_sn, place_name, who_entry } = formData;

    if (!full_sn.trim() || !place_name.trim() || !who_entry.trim()) {
      alert("Uzupełnij wszystkie pola.");
      return;
    }

    const url =
      endpointType === "add"
        ? `/api/process/${productId}/product-objects/`
        : `/api/process/product-object/receive/${selectedProcess.id}/`;

    const payload =
      endpointType === "add"
        ? {
            full_sn,
            place_name,
            who_entry,
            current_process: selectedProcess.id,
          }
        : {
            full_sn,
            place_name,
            who_entry,
          };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setFormData({
          full_sn: "",
          place_name: "",
          who_entry: userId,
        });

        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
        setTimeout(() => fullSnInputRef.current?.focus(), 0);

        fetchObjects(baseUrl);
      } else {
        let backendError = "Wystąpił błąd podczas zapisu.";
        try {
          const errorData = await response.json();
          backendError =
            errorData?.error ||
            errorData?.detail ||
            errorData?.message ||
            (Array.isArray(errorData?.errors) ? errorData.errors.join("\n") : backendError);
        } catch {}

        setErrorMessage(backendError);
        setShowErrorModal(true);
      }
    } catch {
      setErrorMessage("Błąd sieci. Nie można połączyć się z serwerem.");
      setShowErrorModal(true);
    }
  };

  return (
    <div className="fixture-table-container">
      <h2 className="table-title-process">
        {endpointType === "add"
          ? "" + selectedProcess.name
          : "" + selectedProcess.name}
      </h2>
      <p className="progress-label">
        <button onClick={() => navigate(`/process/${productId}/process-action`)} className="back-button">
          &larr; Powrót
        </button>
        Akcja:{" "}
        <span className="text-highlight">
          {endpointType === "add" ? "Dodawanie produktu" : "Odbieranie produktu"}
        </span>
      </p>
      <p className="progress-label">
        Zalogowany użytkownik: <span className="text-highlight">{userId}</span>
      </p>
      <div className="button-row">
        <div className="action-buttons-row">
          <button className="button-reset" onClick={() => setShowModal(true)}>
            + Dodaj nowy
          </button>
          <button
            className="button-reset"
            onClick={() => setShowChangePlaceModal(true)}
            style={{ marginLeft: "0.75rem" }}
          >
            🛠 Przenieś
          </button>
        </div>
      </div>

      <div className="table-wrapper">
          {totalCount !== null && (
            <span className="count-label">Liczba produktów: {totalCount}</span>
          )}
        <table className="fixtures-table">
          <thead>
            <tr>
              <th>Typ</th>
              <th>Serial Number</th>
              <th>Data Dodania</th>
              <th>{productObjects[0]?.quranteen_time ? "Data Kwarantanny" : "Data Produkcji"}</th>
              <th>Data Ważności</th>
              <th>Miejsce</th>
              <th>Wprowadził</th>
            </tr>
          </thead>
          <tbody>
            {productObjects.length > 0 ? (
              productObjects.map((obj) => (
                <React.Fragment key={obj.id}>
                <tr
                  onClick={() => obj.is_mother && handleMotherClick(obj.id)}
                  style={{
                    cursor: obj.is_mother ? "pointer" : "default",
                    backgroundColor: obj.is_mother ? "#f0f9ff" : "inherit"
                  }}
                >
                  <td>{obj.is_mother ? "Karton" : "Produkt"}</td>
                  <td>{obj.serial_number}</td>
                  <td>{formatDateTime(obj.created_at)}</td>
                  <td>
                    {obj.quranteen_time
                      ? formatDateTime(obj.quranteen_time)
                      : formatDate(obj.production_date)}
                  </td>
                  <td>
                    {obj.exp_date_in_process
                      ? formatDate(obj.exp_date_in_process)
                      : formatDate(obj.expire_date)}
                  </td>
                  <td>{obj.current_place || "—"}</td>
                  <td>{obj.initial_who_entry}</td>
                </tr>

                  {expandedMotherId === obj.id && childrenMap[obj.id] && (
                    <tr>
                    <td colSpan={7}>
                      <table className="child-table">
                        <thead>
                          <tr>
                            <th>Serial</th>
                            <th>Data Dodania</th>
                            <th>Data Kwarantanny</th>
                            <th>Data Ważności</th>
                          </tr>
                        </thead>
                        <tbody>
                            {childrenMap[obj.id].map((child) => (
                              <tr key={child.id}>
                                <td>{child.serial_number}</td>
                                <td>{formatDateTime(child.created_at)}</td>
                                <td>
                                  {child.quranteen_time
                                    ? formatDateTime(child.quranteen_time)
                                    : formatDate(child.production_date)}
                                </td>
                                <td>
                                  {child.exp_date_in_process
                                    ? formatDate(child.exp_date_in_process)
                                    : formatDate(child.expire_date)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="italic-muted">Brak obiektów.</td>
              </tr>
            )}
          </tbody>
          </table>
          <div ref={loaderRef} style={{ height: "40px" }} />
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="table-title">
              {endpointType === "add" ? "Dodaj nowy obiekt" : "Odbierz obiekt"}
            </h3>
            <form onSubmit={handleSubmit}>
              <label>
                Pełny SN:
                <input
                  type="text"
                  ref={fullSnInputRef}
                  value={formData.full_sn}
                  onChange={(e) => setFormData({ ...formData, full_sn: e.target.value })}
                  required
                />
              </label>
              <label>
                Miejsce:
                <input
                  type="text"
                  value={formData.place_name}
                  onChange={(e) => setFormData({ ...formData, place_name: e.target.value })}
                  required
                />
              </label>
              <label>
                Wprowadził:
                <input
                  type="text"
                  value={formData.who_entry}
                  onChange={(e) => setFormData({ ...formData, who_entry: e.target.value })}
                  required
                />
              </label>
              <div style={{ marginTop: "1rem" }}>
                <button type="submit" className="button-reset">Zapisz</button>
                <button
                  type="button"
                  className="button-reset"
                  style={{ backgroundColor: "#fca5a5", color: "#991b1b", marginLeft: "1rem" }}
                  onClick={() => setShowModal(false)}
                >
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showChangePlaceModal && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3 className="table-title">Zmień miejsce obiektu</h3>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const response = await fetch(
              `/api/process/${productId}/product-objects/change-place-by-sn/`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  "X-CSRFToken": getCookie("csrftoken"),
                },
                credentials: "include",
                body: JSON.stringify(placeForm),
              }
            );

            const data = await response.json();

            if (response.ok) {
              setPlaceForm({ obj_full_sn: "", place_name: "" });
              setShowChangePlaceModal(false);
              setShowSuccessToast(true);
              setTimeout(() => setShowSuccessToast(false), 3000);
              fetchObjects(baseUrl); // Odśwież dane
            } else {
              const backendError =
                data?.error ||
                data?.detail ||
                data?.message ||
                (Array.isArray(data?.errors) ? data.errors.join("\n") : "Błąd podczas zmiany miejsca.");

              setErrorMessage(backendError);
              setShowErrorModal(true);
            }
          } catch {
            setErrorMessage("Błąd sieci. Nie udało się połączyć z serwerem.");
            setShowErrorModal(true);
          }
        }}
      >
        <label>
          SN obiektu:
          <input
            type="text"
            value={placeForm.obj_full_sn}
            onChange={(e) =>
              setPlaceForm((prev) => ({ ...prev, obj_full_sn: e.target.value }))
            }
            required
            autoFocus
          />
        </label>
        <label>
          Miejsce:
          <input
            type="text"
            value={placeForm.place_name}
            onChange={(e) =>
              setPlaceForm((prev) => ({ ...prev, place_name: e.target.value }))
            }
            required
          />
        </label>
        <div style={{ marginTop: "1rem" }}>
          <button type="submit" className="button-reset">Zapisz</button>
          <button
            type="button"
            className="button-reset"
            style={{ backgroundColor: "#fca5a5", color: "#991b1b", marginLeft: "1rem" }}
            onClick={() => setShowChangePlaceModal(false)}
          >
            Anuluj
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {showSuccessToast && <div className="toast-success">✅ Obiekt został zapisany!</div>}

      {showErrorModal && (
        <div className="modal-overlay active">
          <div className="modal">
            <h2>Błąd przetwarzania danych</h2>
            <p>{errorMessage}</p>
            <div className="modal-buttons">
              <button className="btn btn-ack" onClick={() => setShowErrorModal(false)}>
                Zrozumiano
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddOrReceiveObjectView;
