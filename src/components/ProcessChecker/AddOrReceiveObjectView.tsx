import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ProcessAddView.css";

interface ProductObject {
  id: number;
  serial_number: string;
  created_at: string;
  production_date: string;
  expire_date: string;
  exp_date_in_process?: string;
  current_place?: string | null;
  initial_who_entry: string;
}

interface Props {
  endpointType: "add" | "receive";
}

const AddOrReceiveObjectView: React.FC<Props> = ({ endpointType }) => {
  const { productId } = useParams<{ productId: string }>();
  const selectedProcess = JSON.parse(localStorage.getItem("selectedProcess") || "{}");
  const userId = localStorage.getItem("userIdentifier") || "";
  const navigate = useNavigate();

  const [productObjects, setProductObjects] = useState<ProductObject[]>([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showModal, setShowModal] = useState(true);

  const fullSnInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_sn: "",
    place_name: "",
    who_entry: userId,
  });

  // Endpoint GET do załadowania istniejących obiektów
  const fetchUrl = `/api/process/${productId}/product-objects/?current_process=${selectedProcess.id}&place_isnull=false`;

  useEffect(() => {
    fetch(fetchUrl)
      .then((res) => res.json())
      .then((data) => setProductObjects(data))
      .catch(() => {});
  }, [fetchUrl]);

  useEffect(() => {
    if (showModal && fullSnInputRef.current) {
      fullSnInputRef.current.focus();
    }
  }, [showModal]);

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
        headers: { "Content-Type": "application/json" },
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

        fetch(fetchUrl)
          .then((res) => res.json())
          .then((data) => setProductObjects(data));
      } else {
        alert("Błąd przy zapisie.");
      }
    } catch (err) {
      alert("Wystąpił błąd sieci.");
    }
  };

  return (
    <div className="fixture-table-container">
      <h2 className="table-title">
      {endpointType === "add"
      ? "Dodaj nowy obiekt do procesu"
      : "Przyjmij obiekt do " + selectedProcess.name}
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
      <button className="button-reset" onClick={() => setShowModal(true)} style={{ margin: "1rem 0" }}>
        + {endpointType === "add" ? "Dodaj" : "Odbierz"} nowy
      </button>

      <div className="table-wrapper">
        <table className="fixtures-table">
          <thead>
            <tr>
              <th>Serial Number</th>
              <th>Data Dodania</th>
              <th>Data Produkcji</th>
              <th>Data Ważności</th>
              <th>Miejsce</th>
              <th>Wprowadził</th>
            </tr>
          </thead>
          <tbody>
            {productObjects.length > 0 ? (
              productObjects.map((obj) => (
                <tr key={obj.id}>
                  <td>{obj.serial_number}</td>
                  <td>{new Date(obj.created_at).toLocaleString()}</td>
                  <td>{obj.production_date}</td>
                  <td>
                    {obj.exp_date_in_process
                      ? new Date(obj.exp_date_in_process).toLocaleDateString()
                      : new Date(obj.expire_date).toLocaleDateString()}
                  </td>
                  <td>{obj.current_place || "—"}</td>
                  <td>{obj.initial_who_entry}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="italic-muted">Brak obiektów.</td>
              </tr>
            )}
          </tbody>
        </table>
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

      {showSuccessToast && <div className="toast-success">✅ Obiekt został zapisany!</div>}
    </div>
  );
};

export default AddOrReceiveObjectView;
