import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ProcessAddView.css";

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('pl-PL');

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString('pl-PL');

function getCookie(name: string): string {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift()!;
  return '';
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
  full_sn?: string;
}

const MoveObjectView: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const selectedProcess = JSON.parse(localStorage.getItem("selectedProcess") || "{}");
  const userId = localStorage.getItem("userIdentifier") || "";
  const navigate = useNavigate();

  const [expandedMotherId, setExpandedMotherId] = useState<number | null>(null);
  const [childrenMap, setChildrenMap] = useState<Record<number, ProductObject[]>>({});
  const [motherFullSn, setMotherFullSn] = useState("");
  const [motherShortSn, setMotherShortSn] = useState("");

  const [objectsInTransit, setObjectsInTransit] = useState<ProductObject[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const [showModal, setShowModal] = useState(true);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fullSnInputRef = useRef<HTMLInputElement>(null);
  const childInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_sn: "",
    who_exit: userId,
  });

  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [childSn, setChildSn] = useState("");

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
  
      setObjectsInTransit(prev =>
        append ? [...prev, ...data.results] : data.results
      );
      setNextPageUrl(data.next);
      setTotalCount(data.count);
    } catch (err) {
      console.error("Błąd ładowania danych:", err);
    }
  };

  const handleMotherClick = async (obj: ProductObject) => {
    const motherId = obj.id;

    if (expandedMotherId === motherId) {
      setExpandedMotherId(null);
      setShowAddChildModal(false);
      return;
    }

    setExpandedMotherId(motherId);
    setMotherFullSn(obj.full_sn || obj.serial_number);
    setMotherShortSn(obj.serial_number);
    setShowAddChildModal(true);

    try {
      const response = await fetch(`/api/process/${productId}/product-objects/${motherId}/children/`);
      if (!response.ok) throw new Error("Błąd podczas pobierania dzieci kartonu");

      const data = await response.json();
      setChildrenMap(prev => ({ ...prev, [motherId]: data }));
    } catch (error) {
      console.error(error);
      setErrorMessage("Nie udało się pobrać zawartości kartonu.");
      setShowErrorModal(true);
    }
  };

  useEffect(() => {
    const initialUrl = `/api/process/${productId}/product-objects/?current_process=${selectedProcess.id}&place_isnull=true`;
    fetchObjects(initialUrl);
  }, [productId, selectedProcess.id]);

  useEffect(() => {
    if (showModal && fullSnInputRef.current) {
      fullSnInputRef.current.focus();
    }
  }, [showModal]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowErrorModal(false);
        setShowModal(false);
        setShowAddChildModal(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    if (expandedMotherId === null) return;

    const fetchChildren = async () => {
      try {
        const response = await fetch(`/api/process/${productId}/product-objects/${expandedMotherId}/children/`);
        if (!response.ok) throw new Error("Błąd podczas odświeżania dzieci kartonu");
        const data = await response.json();
        setChildrenMap(prev => ({ ...prev, [expandedMotherId]: data }));
      } catch (err) {
        console.error("Błąd odświeżania dzieci:", err);
      }
    };

    fetchChildren();
  }, [expandedMotherId, productId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { full_sn, who_exit } = formData;

    if (!full_sn.trim() || !who_exit.trim()) {
      alert("Uzupełnij wymagane pola.");
      return;
    }

    try {
      const response = await fetch(`/api/process/product-object/move/${selectedProcess.id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie('csrftoken'),
        },
        credentials: 'include',
        body: JSON.stringify({ full_sn, who_exit }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result?.show_add_child_modal) {
          setMotherFullSn(formData.full_sn);
          setMotherShortSn(result?.serial_number || "Nieznany");
          setShowAddChildModal(true);
          return;
        }

        setFormData({ full_sn: "", who_exit: userId });
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
        setTimeout(() => fullSnInputRef.current?.focus(), 0);

        const url = `/api/process/${productId}/product-objects/?current_process=${selectedProcess.id}&place_isnull=true`;
        fetchObjects(url);
      } else {
        let backendError = result?.error || result?.detail || result?.message ||
          (Array.isArray(result?.errors) ? result.errors.join("\n") : "Wystąpił błąd podczas przenoszenia.");
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
      <h2 className="table-title-process">{selectedProcess.name}</h2>
      <p className="progress-label">
        <button onClick={() => navigate(`/process/${productId}/process-action`)} className="back-button">
          &larr; Powrót
        </button>
        Akcja: <span className="text-highlight">Przenoszenie produktu</span>
      </p>
      <p className="progress-label">
        Zalogowany użytkownik: <span className="text-highlight">{userId}</span>
      </p>
      <button className="button-reset" onClick={() => setShowModal(true)} style={{ margin: "1rem 0" }}>
        + Przenieś nowy
      </button>

      <div className="table-wrapper">
      <div className="table-meta">
          {totalCount !== null && (
            <span className="count-label">Liczba produktów: {totalCount}</span>
          )}
        </div>
        <table className="fixtures-table">
          <thead>
            <tr>
              <th>Typ</th>
              <th>Serial Number</th>
              <th>Data Dodania</th>
              <th>{objectsInTransit[0]?.quranteen_time ? "Data Kwarantanny" : "Data Produkcji"}</th>
              <th>Data Ważności</th>
              <th>Wprowadził</th>
            </tr>
          </thead>
          <tbody>
            {objectsInTransit.length > 0 ? (
              objectsInTransit.map((obj) => (
                <React.Fragment key={obj.id}>
                  <tr
                    onClick={() => obj.is_mother && handleMotherClick(obj)}
                    style={{
                      cursor: obj.is_mother ? "pointer" : "default",
                      backgroundColor: obj.is_mother ? "#f0f9ff" : "inherit",
                    }}
                  >
                    <td>{obj.is_mother ? "Karton" : "Produkt"}</td>
                    <td>{obj.serial_number}</td>
                    <td>{formatDateTime(obj.created_at)}</td>
                    <td>{obj.quranteen_time ? formatDateTime(obj.quranteen_time) : formatDate(obj.production_date)}</td>
                    <td>{obj.exp_date_in_process ? formatDate(obj.exp_date_in_process) : formatDate(obj.expire_date)}</td>
                    <td>{obj.initial_who_entry}</td>
                  </tr>

                  {expandedMotherId === obj.id && childrenMap[obj.id] && (
                    <tr>
                      <td colSpan={6}>
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
                              <td>{child.quranteen_time ? formatDateTime(child.quranteen_time) : formatDate(child.production_date)}</td>
                              <td>{formatDate(child.exp_date_in_process ?? child.expire_date)}</td>
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
                <td colSpan={6} className="italic-muted">Brak obiektów w drodze.</td>
              </tr>
            )}
          </tbody>
          </table>
          <div ref={loaderRef} style={{ height: "40px" }} />
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="table-title">Przenieś obiekt</h3>
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
                Wysyłający:
                <input
                  type="text"
                  value={formData.who_exit}
                  onChange={(e) => setFormData({ ...formData, who_exit: e.target.value })}
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

      {/* 🔧 MODAL DODAWANIA DZIECI */}
      {showAddChildModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="table-title">Dodaj produkty do kartonu</h3>
            <p className="progress-label">Karton: <span className="text-highlight">{motherShortSn}</span></p>

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await fetch("/api/process/quick-add-child/", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCookie('csrftoken'),
                  },
                  credentials: "include",
                  body: JSON.stringify({
                    full_sn: childSn,
                    mother_sn: motherFullSn,
                    who_entry: userId,
                  }),
                });

                if (res.ok) {
                  setChildSn("");
                  setShowSuccessToast(true);
                  setTimeout(() => setShowSuccessToast(false), 2000);
                  setTimeout(() => childInputRef.current?.focus(), 0);
                
                  try {
                    const childrenRes = await fetch(`/api/process/${productId}/product-objects/${expandedMotherId}/children/`);
                    if (childrenRes.ok) {
                      const childrenData = await childrenRes.json();
                      setChildrenMap(prev => ({
                        ...prev,
                        [expandedMotherId!]: childrenData,
                      }));
                    }
                  } catch (err) {
                    console.error("Błąd odświeżania dzieci:", err);
                  }
                } else {
                  const err = await res.json().catch(() => ({}));
                  const msg =
                    err?.error ||
                    err?.detail ||
                    err?.message ||
                    (Array.isArray(err?.errors) ? err.errors.join("\n") : null) ||
                    "Błąd dodawania dziecka.";
                  setErrorMessage(msg);
                  setShowErrorModal(true);
                }
              } catch {
                setErrorMessage("Błąd sieci podczas dodawania dziecka.");
                setShowErrorModal(true);
              }
            }}>
              <label>
                Pełny SN dziecka:
                <input
                  type="text"
                  ref={childInputRef}
                  value={childSn}
                  onChange={(e) => setChildSn(e.target.value)}
                  required
                  autoFocus
                />
              </label>

              <div style={{ marginTop: "1rem" }}>
                <button type="submit" className="button-reset">Dodaj</button>
                <button
                  type="button"
                  className="button-reset"
                  style={{ backgroundColor: "#fca5a5", color: "#991b1b", marginLeft: "1rem" }}
                  onClick={() => setShowAddChildModal(false)}
                >
                  Zamknij
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSuccessToast && <div className="toast-success">✅ Obiekt został przeniesiony!</div>}

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

export default MoveObjectView;
