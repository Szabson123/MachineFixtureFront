// src/views/TrashObjectView.tsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProductObjects } from "../hooks/useProductObjects";
import { ProductObjectTable } from "../tables/ProductObjectTable";

import Modal from "../shared/Modal";
import ErrorModal from "../shared/ErrorModal";

const TrashObjectView: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const selectedProcess = JSON.parse(localStorage.getItem("selectedProcess") || "{}");
  const userId = localStorage.getItem("userIdentifier") || "";
  const navigate = useNavigate();
  const [ordering, setOrdering] = useState<string>("-expire_date_final");

  const endpoint = `/api/process/${productId}/${selectedProcess.id}/product-objects/?place_isnull=false`;
  const { objects, totalCount, loaderRef, refetch } = useProductObjects(endpoint, ordering);

  const [formData, setFormData] = useState({
    full_sn: "",
    place_name: "Kosz",
    who: userId,
  });

  const fields = selectedProcess?.settings?.fields ?? null;
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

    const handleSortChange = (field: string) => {
  setOrdering((prev) =>
    prev === field ? `-${field}` : field
  );
};

  const handleTrashSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

    const res = await fetch(`/api/process/trash-obj/${selectedProcess.id}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": document.cookie.match(/csrftoken=([^;]+)/)?.[1] || "",
      },
      credentials: "include",
      body: JSON.stringify({
        ...formData,
        movement_type: "trash",
      }),
    });

    if (res.ok) {
      
      setFormData({ full_sn: "", place_name: "Kosz", who: userId });
      refetch();

      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      const err = await res.json().catch(() => ({}));
      setError(err.detail || "Błąd podczas wyrzucania obiektu.");
    }
  };

  useEffect(() => {
    if (showModal && inputRef.current) inputRef.current.focus();
  }, [showModal]);

  return (
    <div className="fixture-table-container">
      <h2 className="title-label">{selectedProcess.name}</h2>
      <p className="action-label">
        Akcja: <span className="action-name">Wyrzucanie produktu</span>
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
          🗑️ Wyrzuć produkt
        </button>
      </div>

      <p className="progress-label margin-plus">
        Liczba obiektów: {totalCount}
      </p>

      <ProductObjectTable
        objects={objects}
        childrenMap={{}}
        onMotherClick={() => {}}
        expandedMotherId={null}
        onSortChange={handleSortChange}
        ordering={ordering}
        fields={fields}
      />
      <div ref={loaderRef} style={{ height: "40px" }} />

      {/* Modal - Trash Form */}
      {showModal && (
        <Modal title="Wyrzuć produkt" onClose={() => setShowModal(false)} hideFooter>
          <form onSubmit={handleTrashSubmit}>
            <label>
              Obiekt:
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
            <div className="modal-footer">
              <button className="button-reset" type="submit">Wyrzuć</button>
              <button className="btn-normal" type="button" onClick={() => setShowModal(false)}>Anuluj</button>
            </div>
          </form>
        </Modal>
      )}

      {error && <ErrorModal message={error} onClose={() => setError("")} />}
    </div>
  );
};

export default TrashObjectView;
