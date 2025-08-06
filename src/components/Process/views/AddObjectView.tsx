import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProductObjects } from "../hooks/useProductObjects";
import { ProductObjectTable } from "../tables/ProductObjectTable";
import Toast from "../shared/Toast";
import Modal from "../shared/Modal";
import ErrorModal from "../shared/ErrorModal";
import "./views.css";

const AddObjectView: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const selectedProcess = JSON.parse(localStorage.getItem("selectedProcess") || "{}");
  const userId = localStorage.getItem("userIdentifier") || "";
  const navigate = useNavigate();

  const endpoint = `/api/process/${productId}/${selectedProcess.id}/product-objects/?place_isnull=false`;
  const { objects, totalCount, loaderRef, refetch } = useProductObjects(endpoint);

  const [formData, setFormData] = useState({
    full_sn: "",
    place_name: "",
    who_entry: userId,
  });

  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showMultiModal, setShowMultiModal] = useState(false);
  const [multiSNs, setMultiSNs] = useState<string[]>([""]);
  const [multiErrors, setMultiErrors] = useState<number[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const multiSNRefs = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    if (showModal && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showModal]);

  const parseApiError = (err: any): string => {
    if (typeof err === "string") return err;
  
    if (err?.error) return err.error;
    if (err?.detail) return err.detail;
  
    if (typeof err === "object" && err !== null) {
      const firstField = Object.keys(err)[0];
      const messages = err[firstField];
      if (Array.isArray(messages) && messages.length > 0) {
        return messages[0];
      }
    }
  
    return "Wystąpił nieznany błąd.";
  };

  const handleMultiSNChange = (index: number, value: string) => {
    const updated = [...multiSNs];
    updated[index] = value;
  
    // usuń nadmiarowe puste pola, ale zostaw ostatni pusty
    const nonEmpty = updated.filter((sn) => sn.trim() !== "");
    const result =
      updated[updated.length - 1].trim() === "" ? [...nonEmpty, ""] : [...nonEmpty];
  
    // Duplikaty
    const duplicates: number[] = [];
    result.forEach((sn, i) => {
      if (sn && result.filter((s) => s === sn).length > 1) {
        duplicates.push(i);
      }
    });
  
    setMultiErrors(duplicates);
    setMultiSNs(result);
  };

  const handleCancelMultiModal = () => {
    setShowMultiModal(false);
    setMultiSNs([""]);
    setMultiErrors([]);
  };
  const placeInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (showMultiModal && placeInputRef.current) {
      placeInputRef.current.focus();
    }
  }, [showMultiModal]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/process/${productId}/${selectedProcess.id}/product-objects/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": document.cookie.match(/csrftoken=([^;]+)/)?.[1] || "",
      },
      credentials: "include",
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setFormData({ full_sn: "", place_name: "", who_entry: userId });
      refetch();
      setShowModal(false);
      setShowToast(true);
    } else {
      const err = await res.json().catch(() => ({}));
      setError(parseApiError(err));
    }
  };

  return (
    <div className="fixture-table-container">
      <h2 className="title-label">{selectedProcess.name}</h2>
      <p className="action-label">
        Akcja: <span className="action-name">Dodawanie produktu</span>
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
        <button className="button-reset" onClick={() => setShowModal(true)}>
          ➕ Dodaj nowy
        </button>
        {selectedProcess.settings?.starts?.add_multi && (
          <button className="button-reset" onClick={() => setShowMultiModal(true)}>
            ➕ Dodaj wiele
          </button>
        )}
      </div>

      <p className="progress-label margin-plus">Liczba obiektów: {totalCount}</p>

      <ProductObjectTable
        objects={objects}
        childrenMap={{}}
        onMotherClick={() => {}}
        expandedMotherId={null}
      />
      <div ref={loaderRef} style={{ height: "40px" }} />

      {showModal && (
        <Modal title="Dodaj nowy obiekt" onClose={() => setShowModal(false)} hideFooter>
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
              Miejsce:
              <input
                value={formData.place_name}
                onChange={(e) => setFormData({ ...formData, place_name: e.target.value })}
                required
              />
            </label>
            <label>
              Wprowadził:
              <input
                value={formData.who_entry}
                onChange={(e) => setFormData({ ...formData, who_entry: e.target.value })}
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

      {error && <ErrorModal message={error} onClose={() => setError("")} />}

      {showToast && <Toast message="✅ Obiekt dodany!" onClose={() => setShowToast(false)} />}

      {showMultiModal && (
        <Modal title="Dodaj wiele SN" onClose={() => setShowMultiModal(false)} hideFooter>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const filtered = multiSNs.filter(sn => sn.trim() !== "");
              const unique = [...new Set(filtered)];

              if (filtered.length !== unique.length) return;

              const res = await fetch(`/api/process/${productId}/${selectedProcess.id}/bulk-create/`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-CSRFToken": document.cookie.match(/csrftoken=([^;]+)/)?.[1] || "",
                },
                credentials: "include",
                body: JSON.stringify({
                  place: formData.place_name,
                  who_entry: formData.who_entry,
                  objects: unique.map((sn) => ({ full_sn: sn }))
                }),
              });

              if (res.ok) {
                setShowMultiModal(false);
                setMultiSNs([""]);
                setMultiErrors([]);
                refetch();
                setShowToast(true);
              } else {
                const err = await res.json().catch(() => ({}));
                setError(err.detail || "Wystąpił błąd podczas dodawania wielu SN.");
              }
            }}
          >
            <label>
              Miejsce:
              <input
                ref={placeInputRef}
                value={formData.place_name}
                onChange={(e) => setFormData({ ...formData, place_name: e.target.value })}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                    e.preventDefault();
                    multiSNRefs.current[0]?.focus();
                    }
                }}
                required
                />
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
    <div
      key={index}
      style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}
    >
      <span style={{ width: "24px", textAlign: "right", marginRight: "8px" }}>
        {index + 1}.
      </span>
      <input
        ref={(el) => {
          multiSNRefs.current[index] = el!;
        }}
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
        style={{
          borderColor: multiErrors.includes(index) ? "red" : undefined,
          flexGrow: 1,
        }}
      />
    </div>
  ))}
</div>
            <div className="modal-footer">
              <button className="button-reset" type="submit">Zapisz</button>
              <button className="btn-normal" type="button" onClick={handleCancelMultiModal}>Anuluj</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AddObjectView;
