// src/views/ReceiveObjectView.tsx
import React, { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProductObjects } from "../hooks/useProductObjects"; 
import { ProductObjectTable } from "../tables/ProductObjectTable"; 

import Modal from "../shared/Modal";
import ErrorModal from "../shared/ErrorModal";

const ReceiveObjectView: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const selectedProcess = JSON.parse(localStorage.getItem("selectedProcess") || "{}");
  const isProductionProcess = selectedProcess?.settings?.defaults?.production_process_type === true;
  const userId = localStorage.getItem("userIdentifier") || "";
  const navigate = useNavigate();

  const endpoint = `/api/process/${productId}/${selectedProcess.id}/product-objects/?place_isnull=false`;
  const { objects, totalCount, loaderRef, refetch } = useProductObjects(endpoint);

  const [formData, setFormData] = useState({
    full_sn: "",
    place_name: "",
    who: userId,
  });

  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [productionForm, setProductionForm] = useState({card: "", line: "", paste: "",});

  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/process/product-object/move/${selectedProcess.id}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": document.cookie.match(/csrftoken=([^;]+)/)?.[1] || "",
      },
      credentials: "include",
      body: JSON.stringify({
        ...formData,
        movement_type: "receive",
      }),
    });

    if (res.ok) {
      setFormData({ full_sn: "", place_name: "", who: userId });
      refetch();
      setShowModal(false);
    } else {
      const err = await res.json().catch(() => ({}));
      setError(err.detail || "Błąd podczas odbioru.");
    }
  };

  return (
    <div className="fixture-table-container">
        <h2 className="title-label">{selectedProcess.name}</h2>
        <p className="action-label">Akcja: <span className="action-name">Odbieranie produktu</span></p>
        <p className="user-label">Zalogowany użytkownik: <span className="user-id">{userId}</span></p>

        <div className="action-button-wrapper">
            <button className="back-button"onClick={() => navigate(`/process/${productId}/process-action`)}>← Powrót</button>
            <button className="button-reset" onClick={() => setShowModal(true)}>
                {isProductionProcess ? "➕ Kontynuuj produkcję" : "➕ Odbierz obiekt"}
            </button>
            { isProductionProcess && (
                <button className="button-reset-green" onClick={() => setShowProductionModal(true)}>🏁 Rozpocznij nową produkcje</button>
            )}
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
        <Modal title="Dodaj produkt" onClose={() => setShowModal(false)} hideFooter>
            <form onSubmit={handleSubmit}>
            <label>
                Pasta:
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
                    <button className="button-reset" type="submit">Zapisz</button>
                    <button className="btn-normal" type="button" onClick={() => setShowModal(false)}>Zamknij</button>
                </div>
            </form>
        </Modal> 
)}
{showProductionModal && (
  <Modal title="Nowa produkcja" onClose={() => setShowProductionModal(false)} hideFooter>
    <form
      onSubmit={(e) => {
        e.preventDefault();
        console.log("Wysyłam dane produkcji:", productionForm);
        setShowProductionModal(false);
      }}
    >
      <label>
        Karta produkcji:
        <input
          value={productionForm.card}
          onChange={(e) => setProductionForm({ ...productionForm, card: e.target.value })}
          required
        />
      </label>

      <label>
        Linia:
        <input
          value={productionForm.line}
          onChange={(e) => setProductionForm({ ...productionForm, line: e.target.value })}
          required
        />
      </label>

      <label>
        Pasta:
        <input
          value={productionForm.paste}
          onChange={(e) => setProductionForm({ ...productionForm, paste: e.target.value })}
          required
        />
      </label>

      <div className="modal-footer">
        <button className="button-reset" type="submit">Rozpocznij</button>
        <button className="btn-normal" type="button" onClick={() => setShowProductionModal(false)}>Anuluj</button>
      </div>
    </form>
  </Modal>
)}
{error && <ErrorModal message={error} onClose={() => setError("")} />}
    </div>
  );
};

export default ReceiveObjectView;
