import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

const MoveObjectView: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const selectedProcess = JSON.parse(localStorage.getItem("selectedProcess") || "{}");
  const userId = localStorage.getItem("userIdentifier") || "";
  const navigate = useNavigate();

  const [objectsInTransit, setObjectsInTransit] = useState<ProductObject[]>([]);
  const [showModal, setShowModal] = useState(true);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const fullSnInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_sn: "",
    who_exit: userId,
  });

  useEffect(() => {
    fetch(`/api/process/${productId}/product-objects/?current_process=${selectedProcess.id}&place_isnull=true`)
      .then((res) => res.json())
      .then((data) => setObjectsInTransit(data))
      .catch(() => {});
  }, [productId, selectedProcess.id]);

  useEffect(() => {
    if (showModal && fullSnInputRef.current) {
      fullSnInputRef.current.focus();
    }
  }, [showModal]);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_sn, who_exit }),
      });

      if (response.ok) {
        setFormData({
          full_sn: "",
          who_exit: userId,
        });

        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
        setTimeout(() => fullSnInputRef.current?.focus(), 0);

        // Odśwież tabelę
        fetch(`/api/process/${productId}/product-objects/?current_process=${selectedProcess.id}&place_isnull=true`)
          .then((res) => res.json())
          .then((data) => setObjectsInTransit(data));
      } else {
        alert("Błąd podczas przenoszenia obiektu.");
      }
    } catch (err) {
      alert("Błąd sieci.");
    }
  };

  return (
    <div className="fixture-table-container">
      <h2 className="table-title">Przenieś obiekt z: {selectedProcess.name}</h2>
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
        <table className="fixtures-table">
          <thead>
            <tr>
              <th>Serial Number</th>
              <th>Data Dodania</th>
              <th>Data Produkcji</th>
              <th>Data Ważności</th>
              <th>Wprowadził</th>
            </tr>
          </thead>
          <tbody>
            {objectsInTransit.length > 0 ? (
              objectsInTransit.map((obj) => (
                <tr key={obj.id}>
                  <td>{obj.serial_number}</td>
                  <td>{new Date(obj.created_at).toLocaleString()}</td>
                  <td>{obj.production_date}</td>
                  <td>
                    {obj.exp_date_in_process
                      ? new Date(obj.exp_date_in_process).toLocaleDateString()
                      : new Date(obj.expire_date).toLocaleDateString()}
                  </td>
                  <td>{obj.initial_who_entry}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="italic-muted">Brak obiektów do przeniesienia.</td>
              </tr>
            )}
          </tbody>
        </table>
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

      {showSuccessToast && <div className="toast-success">✅ Obiekt został przeniesiony!</div>}
    </div>
  );
};

export default MoveObjectView;
