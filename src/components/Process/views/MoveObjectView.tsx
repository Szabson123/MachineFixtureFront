import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProductObjects } from "../hooks/useProductObjects";
import { ProductObjectTable } from "../tables/ProductObjectTable";
import Modal from "../shared/Modal";
import ErrorModal from "../shared/ErrorModal";
import "./views.css";
import Toast from "../shared/Toast";


const MoveObjectView: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const selectedProcess = JSON.parse(localStorage.getItem("selectedProcess") || "{}");
  const userId = localStorage.getItem("userIdentifier") || "";
  const navigate = useNavigate();
  const [ordering, setOrdering] = useState<string>("-expire_date_final");
  const [showToast, setShowToast] = useState(false);


  const endpoint = `/api/process/${productId}/${selectedProcess.id}/product-objects/?place_isnull=true`;
const { objects, totalCount, loaderRef, refetch } = useProductObjects(endpoint, ordering);

  const expectingChild: boolean = !!selectedProcess?.settings?.starts?.expecting_child;

  const [formData, setFormData] = useState({
    full_sn: "",
    who: userId,
    place_name: "",
  });

  const [showMoveModal, setShowMoveModal] = useState(false);

  const [showMultiToMotherModal, setShowMultiToMotherModal] = useState(false);
  const [motherFullSn, setMotherFullSn] = useState("");
  const [motherShortSn, setMotherShortSn] = useState("");
  const [motherPlace, setMotherPlace] = useState("");

  const [expandedMotherId, setExpandedMotherId] = useState<number | null>(null);
  const [childrenMap, setChildrenMap] = useState<Record<number, any[]>>({});

  const [multiSNs, setMultiSNs] = useState<string[]>([""]);
  const [multiErrors, setMultiErrors] = useState<number[]>([]);
  const [error, setError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const multiSNRefs = useRef<HTMLInputElement[]>([]);

  const shortSn = (obj: any) =>
    obj?.serial_number ?? obj?.sn_short ?? (obj?.full_sn ? obj.full_sn.slice(-6) : "");

  const handleSortChange = (field: string) => {
  setOrdering((prev) => (prev === field ? `-${field}` : field));
};

  const parseApiError = (err: any): string => {
    if (!err) return "Wystąpił nieznany błąd.";
    if (typeof err === "string") return err;
    if (err.detail) return err.detail;
    if (err.message) return err.message;
    if (err.error) return err.error;
    if (typeof err === "object") {
      const keys = Object.keys(err);
      if (keys.length) {
        const first = keys[0];
        const val = (err as any)[first];
        if (Array.isArray(val) && val.length) return String(val[0]);
        if (typeof val === "string") return val;
      }
    }
    return "Wystąpił nieznany błąd.";
  };

  const handleMultiSNChange = (index: number, value: string) => {
    const updated = [...multiSNs];
    updated[index] = value;

    const nonEmpty = updated.filter((sn) => sn.trim() !== "");
    const result =
      updated[updated.length - 1].trim() === "" ? [...nonEmpty, ""] : [...nonEmpty];

    const duplicates: number[] = [];
    result.forEach((sn, i) => {
      if (sn && result.filter((s) => s === sn).length > 1) duplicates.push(i);
    });

    setMultiErrors(duplicates);
    setMultiSNs(result);
  };

  const openAddChildModal = (motherObj: {
    full_sn?: string;
    serial_number?: string;
    place_name?: string;
    current_place?: { name?: string };
  }) => {
    if (!expectingChild) return;
    const full = motherObj.full_sn || "";
    const label = motherObj.serial_number || (full ? full.slice(-6) : "");
    const place = motherObj.current_place?.name ?? motherObj.place_name ?? "";

    setMotherFullSn(full);
    setMotherShortSn(label);
    setMotherPlace(place);
    setMultiSNs([""]);
    setMultiErrors([]);
    setShowMultiToMotherModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/process/product-object/move/${selectedProcess.id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": document.cookie.match(/csrftoken=([^;]+)/)?.[1] || "",
        },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          movement_type: "move",
        }),
      });

      const data = await res.json().catch(() => ({}));
      // spodziewamy się teraz: { detail: "...", id: number, is_mother: boolean }

      if (res.ok) {
        setFormData({ full_sn: "", who: userId, place_name: "" });
        refetch();
        setShowToast(true);

        if (expectingChild && data?.is_mother === true && typeof data?.id === "number") {
          try {
            const childrenRes = await fetch(
              `/api/process/${productId}/${selectedProcess.id}/product-objects/${data.id}/children/`
            );
            if (childrenRes.ok) {
              const kids = await childrenRes.json();
              // podtrzymujemy cache dzieci dla UX
              setChildrenMap((prev) => ({ ...prev, [data.id]: kids }));

              // pusto? pokaż modal dodawania dzieci
              if (Array.isArray(kids) && kids.length === 0) {
                openAddChildModal({
                  full_sn: data?.full_sn || formData.full_sn,
                  // jeśli backend nie zwraca short sn / place w tej odpowiedzi, użyjemy fallbacków:
                  serial_number: data?.serial_number,
                  place_name: data?.place_name,
                  current_place: data?.current_place,
                });
              }
            }
          } catch {
            // jeżeli sprawdzenie dzieci się nie uda – nie wymuszamy modala
          }
        }

        setShowMoveModal(false);
      } else {
        setError(data?.detail || "Błąd przenoszenia.");
      }
    } catch {
      setError("Błąd sieci.");
    }
  };

  useEffect(() => {
    if (showMoveModal && inputRef.current) inputRef.current.focus();
  }, [showMoveModal]);

  useEffect(() => {
    if (showMultiToMotherModal) {
      setTimeout(() => multiSNRefs.current[0]?.focus(), 0);
    }
  }, [showMultiToMotherModal]);

  const handleMotherClick = async (obj: any) => {
    if (expandedMotherId === obj.id) {
      setExpandedMotherId(null);
      return;
    }

    setExpandedMotherId(obj.id);

    // zawsze dociągamy dzieci z endpointu children/
    try {
      const res = await fetch(
        `/api/process/${productId}/${selectedProcess.id}/product-objects/${obj.id}/children/`
      );
      if (!res.ok) throw new Error();
      const children = await res.json();
      setChildrenMap((prev) => ({ ...prev, [obj.id]: children }));
    } catch {
      setError("Błąd pobierania dzieci.");
    }

    // dodatkowo: jeśli oczekujemy dzieci, klik w matkę otwiera modal
    if (expectingChild && obj?.full_sn) {
      openAddChildModal({
        full_sn: obj.full_sn,
        serial_number: shortSn(obj),
        place_name: obj?.place_name ?? obj?.place ?? "",
        current_place: obj?.current_place,
      });
    }
  };

  const handleBulkAddChildren = async (e: React.FormEvent) => {
    e.preventDefault();
    const filtered = multiSNs.filter((sn) => sn.trim() !== "");
    const unique = [...new Set(filtered)];
    if (filtered.length !== unique.length) return;

    try {
      const res = await fetch(
        `/api/process/${productId}/${selectedProcess.id}/bulk-create-to-mother/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": document.cookie.match(/csrftoken=([^;]+)/)?.[1] || "",
          },
          credentials: "include",
          body: JSON.stringify({
            who_entry: userId,
            mother_sn: motherFullSn,
            objects: unique.map((sn) => ({ full_sn: sn })),
          }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setMultiSNs([""]);
        setMultiErrors([]);
        if (expandedMotherId) {
          try {
            const childrenRes = await fetch(
              `/api/process/${productId}/${selectedProcess.id}/product-objects/${expandedMotherId}/children/`
            );
            const newChildren = await childrenRes.json();
            setChildrenMap((prev) => ({ ...prev, [expandedMotherId]: newChildren }));
          } catch {}
        }
        setShowMultiToMotherModal(false);
        setShowToast(true);
      } else {
        setError(parseApiError(data) || "Błąd dodawania dzieci.");
      }
    } catch {
      setError("Błąd sieci.");
    }
  };

  useEffect(() => {
  if (error) {
    setFormData({ full_sn: "", who: userId, place_name: "" });
    setMultiSNs([""]);
    setMultiErrors([]);
  }
}, [error]);

  return (
    <div className="fixture-table-container">
      <h2 className="title-label">{selectedProcess.name}</h2>
      <p className="action-label">
        Akcja: <span className="action-name">Przenoszenie produktu</span>
      </p>
      <p className="user-label">
        Zalogowany użytkownik: <span className="user-id">{userId}</span>
      </p>

      <div className="action-button-wrapper">
        <button
          className="back-button"
          onClick={() => navigate(`/process/${productId}/process-action`)}
        >
          ← Powrót
        </button>
        <button className="button-reset" onClick={() => setShowMoveModal(true)}>
          ➕ Przenieś nowy
        </button>
      </div>

      <p className="progress-label margin-plus">Liczba obiektów: {totalCount}</p>

      <ProductObjectTable
        objects={objects}
        childrenMap={childrenMap}
        onMotherClick={handleMotherClick}
        expandedMotherId={expandedMotherId}
        onSortChange={handleSortChange}
        ordering={ordering}
      />
      <div ref={loaderRef} style={{ height: "40px" }} />

      {showMoveModal && (
        <Modal title="Przenieś produkt" onClose={() => setShowMoveModal(false)} hideFooter>
          <form onSubmit={handleSubmit}>
            <label>
              SN:
              <input
                ref={inputRef}
                value={formData.full_sn}
                onChange={(e) => setFormData({ ...formData, full_sn: e.target.value })}
                required
              />
            </label>
            <div className="modal-footer">
              <button className="button-reset" type="submit">Zapisz</button>
              <button className="btn-normal" type="button" onClick={() => setShowMoveModal(false)}>Zamknij</button>
            </div>
          </form>
        </Modal>
      )}

      {showMultiToMotherModal && (
        <Modal title="Dodaj wiele SN do matki" onClose={() => setShowMultiToMotherModal(false)} hideFooter>
          <form onSubmit={handleBulkAddChildren}>
            <div style={{ marginBottom: "8px", fontWeight: 600 }}>
              Matka:{" "}
              <span title={motherFullSn} style={{ fontFamily: "monospace" }}>
                {motherShortSn || (motherFullSn ? motherFullSn.slice(-6) : "(brak)")}
              </span>
            </div>
            {motherPlace && (
              <div style={{ marginBottom: "12px" }}>
                Miejsce matki: <strong>{motherPlace}</strong>
              </div>
            )}

            <label>
              Wprowadził:
              <input value={userId} onChange={() => {}} readOnly />
            </label>

            <div
              style={{
                maxHeight: "400px",
                overflowY: multiSNs.length > 10 ? "auto" : "visible",
                paddingRight: "5px",
                marginBottom: "1rem",
                border: multiSNs.length > 10 ? "1px solid #ccc" : undefined,
              }}
            >
              {multiSNs.map((sn, index) => (
                <div key={index} style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}>
                  <span style={{ width: "24px", textAlign: "right", marginRight: "8px" }}>
                    {index + 1}.
                  </span>
                  <input
                    ref={(el) => { multiSNRefs.current[index] = el!; }}
                    placeholder={`SN ${index + 1}`}
                    value={sn}
                    onChange={(e) => handleMultiSNChange(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const isLast = index === multiSNs.length - 1;
                        const trimmed = sn.trim();
                        if (trimmed !== "" && isLast) {
                          setMultiSNs((prev) => {
                            const updated = [...prev, ""];
                            setTimeout(() => {
                              multiSNRefs.current[updated.length - 1]?.focus();
                            }, 0);
                            return updated;
                          });
                        }
                      }
                    }}
                    style={{ borderColor: multiErrors.includes(index) ? "red" : undefined, flexGrow: 1 }}
                  />
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="button-reset" type="submit">Dodaj dzieci</button>
              <button className="btn-normal" type="button" onClick={() => setShowMultiToMotherModal(false)}>
                Zamknij
              </button>
            </div>
          </form>
        </Modal>
      )}
      {showToast && (
  <Toast message="✅ Operacja zakończona pomyślnie!" onClose={() => setShowToast(false)} />
)}

      {error && <ErrorModal message={error} onClose={() => setError("")} />}
    </div>
  );
};

export default MoveObjectView;
