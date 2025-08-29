import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProductObjects } from "../hooks/useProductObjects";
import { ProductObjectTable } from "../tables/ProductObjectTable";
import Modal from "../shared/Modal";
import ErrorModal from "../shared/ErrorModal";
import "./views.css";

const MoveObjectView: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const selectedProcess = JSON.parse(localStorage.getItem("selectedProcess") || "{}");
  const userId = localStorage.getItem("userIdentifier") || "";
  const navigate = useNavigate();

  const endpoint = `/api/process/${productId}/${selectedProcess.id}/product-objects/?place_isnull=true`;
  const { objects, totalCount, loaderRef, refetch } = useProductObjects(endpoint);

  const expectingChild: boolean = !!selectedProcess?.settings?.starts?.expecting_child;

  const [formData, setFormData] = useState({
    full_sn: "",
    who: userId,
    place_name: "",
  });

  const [showModal, setShowModal] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [expandedMotherId, setExpandedMotherId] = useState<number | null>(null);

  // Mother context
  const [motherFullSn, setMotherFullSn] = useState("");
  const [motherShortSn, setMotherShortSn] = useState("");

  // Multi-add state (the same UX as in AddObjectView)
  const [multiSNs, setMultiSNs] = useState<string[]>([""]);
  const [multiErrors, setMultiErrors] = useState<number[]>([]);

  const [childrenMap, setChildrenMap] = useState<Record<number, any[]>>({});
  const [error, setError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const multiSNRefs = useRef<HTMLInputElement[]>([]);

  const shortSn = (obj: any) => obj?.serial_number ?? obj?.sn_short ?? (obj?.full_sn ? obj.full_sn.slice(-6) : "");

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
    const result = updated[updated.length - 1].trim() === "" ? [...nonEmpty, ""] : [...nonEmpty];

    const duplicates: number[] = [];
    result.forEach((sn, i) => {
      if (sn && result.filter((s) => s === sn).length > 1) duplicates.push(i);
    });

    setMultiErrors(duplicates);
    setMultiSNs(result);
  };

  const openAddChildModal = (mother: { full_sn?: string; serial_number?: string }) => {
    if (!expectingChild) return; // tylko gdy proces oczekuje dzieci
    const full = mother.full_sn || "";
    const label = mother.serial_number || (full ? full.slice(-6) : "");
    setMotherFullSn(full);
    setMotherShortSn(label);
    setShowAddChildModal(true);
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

      if (res.ok) {
        setFormData({ full_sn: "", who: userId, place_name: "" });
        refetch();

        const backendSuggests = Boolean(data?.show_add_child_modal);
        if (backendSuggests) {
          openAddChildModal({ full_sn: formData.full_sn, serial_number: data?.serial_number });
        }
        setShowModal(false);
      } else {
        setError(data?.detail || "Błąd przenoszenia.");
      }
    } catch {
      setError("Błąd sieci.");
    }
  };

  useEffect(() => {
    if (showModal && inputRef.current) inputRef.current.focus();
  }, [showModal]);

  useEffect(() => {
    if (showAddChildModal) {
      // focus w pierwsze pole SN dziecka
      setTimeout(() => multiSNRefs.current[0]?.focus(), 0);
    }
  }, [showAddChildModal]);

  const handleMotherClick = async (obj: any) => {
    if (expandedMotherId === obj.id) {
      setExpandedMotherId(null);
      setShowAddChildModal(false);
      return;
    }

    setExpandedMotherId(obj.id);

    let children = childrenMap[obj.id];
    if (!children) {
      try {
        const res = await fetch(`/api/process/${productId}/${selectedProcess.id}/product-objects/${obj.id}/children/`);
        if (!res.ok) throw new Error();
        children = await res.json();
        setChildrenMap((prev) => ({ ...prev, [obj.id]: children! }));
      } catch {
        setError("Błąd pobierania dzieci.");
      }
    }

    if (expectingChild && Array.isArray(children) && children.length === 0) {
      openAddChildModal({ full_sn: obj.full_sn, serial_number: shortSn(obj) });
    }
  };

  const handleBulkAddChildren = async (e: React.FormEvent) => {
    e.preventDefault();
    const filtered = multiSNs.filter((sn) => sn.trim() !== "");
    const unique = [...new Set(filtered)];
    if (filtered.length !== unique.length) return;

    try {
      const res = await fetch(`/api/process/${productId}/${selectedProcess.id}/bulk-create-to-mother/`, {
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
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setMultiSNs([""]);
        setMultiErrors([]);
        if (expandedMotherId) {
          try {
            const childrenRes = await fetch(`/api/process/${productId}/${selectedProcess.id}/product-objects/${expandedMotherId}/children/`);
            const newChildren = await childrenRes.json();
            setChildrenMap((prev) => ({ ...prev, [expandedMotherId]: newChildren }));
          } catch {}
        }
      } else {
        setError(parseApiError(data) || "Błąd dodawania dzieci.");
      }
    } catch {
      setError("Błąd sieci.");
    }
  };

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
        <button className="back-button" onClick={() => navigate(`/process/${productId}/process-action`)}>
          ← Powrót
        </button>
        <button className="button-reset" onClick={() => setShowModal(true)}>
          ➕ Przenieś nowy
        </button>
      </div>

      <p className="progress-label margin-plus">Liczba obiektów: {totalCount}</p>

      <ProductObjectTable
        objects={objects}
        childrenMap={childrenMap}
        onMotherClick={handleMotherClick}
        expandedMotherId={expandedMotherId}
      />
      <div ref={loaderRef} style={{ height: "40px" }} />

      {showModal && (
        <Modal title="Dodaj produkt" onClose={() => setShowModal(false)} hideFooter>
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
            <label>
              Kto wysłał:
              <input
                value={formData.who}
                onChange={(e) => setFormData({ ...formData, who: e.target.value })}
                required
              />
            </label>
            <div className="modal-footer">
              <button className="button-reset" type="submit">Zapisz</button>
              <button className="btn-normal" type="button" onClick={() => setShowModal(false)}>Zamknij</button>
            </div>
          </form>
        </Modal>
      )}

      {showAddChildModal && (
        <Modal title={`Karton: ${motherShortSn || motherFullSn.slice(-6)}`} onClose={() => setShowAddChildModal(false)} hideFooter>
          <form onSubmit={handleBulkAddChildren}>
            <div style={{ marginBottom: "8px" }}>
              Matka: <span title={motherFullSn} style={{ fontFamily: "monospace" }}>{motherShortSn || motherFullSn.slice(-6)}</span>
            </div>
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
                  <span style={{ width: "24px", textAlign: "right", marginRight: "8px" }}>{index + 1}.</span>
                  <input
                    ref={(el) => { multiSNRefs.current[index] = el!; }}
                    placeholder={`SN dziecka ${index + 1}`}
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
                            setTimeout(() => { multiSNRefs.current[updated.length - 1]?.focus(); }, 0);
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
              <button className="btn-normal" type="button" onClick={() => setShowAddChildModal(false)}>Zamknij</button>
            </div>
          </form>
        </Modal>
      )}

      {error && <ErrorModal message={error} onClose={() => setError("")} />}
    </div>
  );
};

export default MoveObjectView;