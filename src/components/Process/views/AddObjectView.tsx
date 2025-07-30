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


  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showModal && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showModal]);

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
      setError(err.detail || "Wystąpił błąd podczas dodawania.");
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
      </div>

      <p className="progress-label">Liczba obiektów: {totalCount}</p>

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
    </div>
  );
};

export default AddObjectView;
