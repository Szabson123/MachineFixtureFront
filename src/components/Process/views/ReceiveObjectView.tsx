// src/views/ReceiveObjectView.tsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProductObjects } from "../hooks/useProductObjects";
import { ProductObjectTable } from "../tables/ProductObjectTable";

import Modal from "../shared/Modal";
import MultiSNModal from "../modals/MultiSNModal";
import ErrorModal from "../shared/ErrorModal";

const ReceiveObjectView: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const selectedProcess = JSON.parse(localStorage.getItem("selectedProcess") || "{}");

  const isProductionProcess = selectedProcess?.settings?.defaults?.production_process_type === true;
  const useListEndpoint = selectedProcess?.settings?.defaults?.use_list_endpoint === true;

  const userId = localStorage.getItem("userIdentifier") || "";
  const navigate = useNavigate();
  const [ordering, setOrdering] = useState<string>("-expire_date_final");
  const endpoint = `/api/process/${productId}/${selectedProcess.id}/product-objects/?place_isnull=false`;
  const { objects, totalCount, loaderRef, refetch } = useProductObjects(endpoint, ordering);

  const [expandedMotherId, setExpandedMotherId] = useState<number | null>(null);
  const [childrenMap, setChildrenMap] = useState<Record<number, any[]>>({});
  const [showMultiModal, setShowMultiModal] = useState(false);

  const [formData, setFormData] = useState({
    full_sn: "",
    place_name: "",
    who: userId,
  });

  const handleSortChange = (field: string) => {
  setOrdering((prev) =>
    prev === field ? `-${field}` : field
  );
};
  const [productionForm, setProductionForm] = useState({ card: "", line: "", paste: "" });

  const [showModal, setShowModal] = useState(false);
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const productionInputRef = useRef<HTMLInputElement>(null);

  const handleMultiSubmit = async (sns: string[]) => {
  const res = await fetch(`/api/process/product-object/move-list/${selectedProcess.id}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": document.cookie.match(/csrftoken=([^;]+)/)?.[1] || "",
    },
    credentials: "include",
    body: JSON.stringify({
      full_sn: sns,
      place_name: formData.place_name,
      who: userId,
      movement_type: "receive"
    }),
  });

  if (res.ok) {
    refetch();
  } else {
    const err = await res.json().catch(() => ({}));
    setError(err.detail || "Błąd podczas odbioru wielu.");
  }
};

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = useListEndpoint 
      ? `/api/process/product-object/move-list/${selectedProcess.id}/`
      : `/api/process/product-object/move/${selectedProcess.id}/`;

    const res = await fetch(endpoint, {
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


  const handleContinueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/process/continue-prod/${selectedProcess.id}/`, {
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
      setError(err.detail || "Błąd podczas kontynuacji produkcji.");
    }
  };

  const handleStartNewProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/process/start-new-prod/${selectedProcess.id}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": document.cookie.match(/csrftoken=([^;]+)/)?.[1] || "",
      },
      credentials: "include",
      body: JSON.stringify({
        full_sn: productionForm.paste,
        movement_type: "receive",
        who: userId,
        place_name: productionForm.line,
        production_card: productionForm.card,
      }),
    });

    if (res.ok) {
      setProductionForm({ card: "", line: "", paste: "" });
      refetch();
      setShowProductionModal(false);
    } else {
      const err = await res.json().catch(() => ({}));
      setError(err.detail || "Błąd podczas uruchamiania nowej produkcji.");
    }
  };

  const handleMotherClick = async (obj: any) => {
    if (expandedMotherId === obj.id) {
      setExpandedMotherId(null);
      return;
    }

    setExpandedMotherId(obj.id);

    if (childrenMap[obj.id]) return;

    try {
      const res = await fetch(`/api/process/${productId}/${selectedProcess.id}/product-objects/${obj.id}/children/`);
      if (!res.ok) throw new Error();
      const children = await res.json();
      setChildrenMap((prev) => ({ ...prev, [obj.id]: children }));
    } catch {
      setError("Błąd pobierania dzieci.");
    }
  };

  useEffect(() => {
    if (showModal && inputRef.current) inputRef.current.focus();
  }, [showModal]);

  useEffect(() => {
    if (showProductionModal && productionInputRef.current) productionInputRef.current.focus();
  }, [showProductionModal]);

  return (
    <div className="fixture-table-container">
      <h2 className="title-label">{selectedProcess.name}</h2>
      <p className="action-label">
        Akcja: <span className="action-name">Odbieranie produktu</span>
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
          {isProductionProcess ? "➕ Kontynuuj produkcję" : "➕ Odbierz obiekt"}
        </button>
        {useListEndpoint && (
  <button className="button-reset" onClick={() => setShowMultiModal(true)}>
    ➕ Odbierz wiele
  </button>
)}
        {isProductionProcess && (
          <button
            className="button-reset-green"
            onClick={() => setShowProductionModal(true)}
          >
            🏁 Rozpocznij nową produkcje
          </button>
        )}
      </div>

      <p className="progress-label margin-plus">
        Liczba obiektów: {totalCount}
      </p>

      <ProductObjectTable
        objects={objects}
        childrenMap={childrenMap}
        onMotherClick={handleMotherClick}
        expandedMotherId={expandedMotherId}
        onSortChange={handleSortChange}
        ordering={ordering}
      />

      <MultiSNModal
        isOpen={showMultiModal}
        onClose={() => setShowMultiModal(false)}
        onSubmit={handleMultiSubmit}
      />

      <div ref={loaderRef} style={{ height: "40px" }} />

      {/* Continue / Receive Modal */}
      {showModal && (
        <Modal title={isProductionProcess ? "Kontynuuj produkcję" : "Dodaj produkt"} onClose={() => setShowModal(false)} hideFooter>
          <form onSubmit={isProductionProcess ? handleContinueSubmit : handleReceiveSubmit}>
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
              <button className="button-reset" type="submit">Zapisz</button>
              <button className="btn-normal" type="button" onClick={() => setShowModal(false)}>Zamknij</button>
            </div>
          </form>
        </Modal>
      )}

      {/* New Production Modal */}
      {showProductionModal && (
        <Modal title="Nowa produkcja" onClose={() => setShowProductionModal(false)} hideFooter>
          <form onSubmit={handleStartNewProduction}>
            <label>
              Karta produkcji:
              <input
                ref={productionInputRef}
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
              Obiekt:
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
