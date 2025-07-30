import React, { useRef, useState } from "react";
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

  const [formData, setFormData] = useState({
    full_sn: "",
    who: userId,
    place_name: "",
  });

  const [showModal, setShowModal] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [childSn, setChildSn] = useState("");
  const [motherFullSn, setMotherFullSn] = useState("");
  const [expandedMotherId, setExpandedMotherId] = useState<number | null>(null);
  const [motherShortSn, setMotherShortSn] = useState("");

  const [childrenMap, setChildrenMap] = useState<Record<number, any[]>>({});
  const [error, setError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const childInputRef = useRef<HTMLInputElement>(null);

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

      const data = await res.json();

      if (res.ok) {
        setFormData({ full_sn: "", who: userId, place_name: "" });
        refetch();

        if (data?.show_add_child_modal) {
          setMotherFullSn(formData.full_sn);
          setMotherShortSn(data?.serial_number || "Nieznany");
          setShowAddChildModal(true);
        }

        setShowModal(false);
      } else {
        setError(data?.detail || "Błąd przenoszenia.");
      }
    } catch {
      setError("Błąd sieci.");
    }
  };

  const handleMotherClick = async (obj: any) => {
    if (expandedMotherId === obj.id) {
      setExpandedMotherId(null);
      setShowAddChildModal(false);
      return;
    }

    setExpandedMotherId(obj.id);
    setMotherShortSn(obj.serial_number);
    setMotherFullSn(obj.full_sn || obj.serial_number);
    setShowAddChildModal(true);

    try {
      const res = await fetch(`/api/process/${productId}/product-objects/${obj.id}/children/`);
      const children = await res.json();
      setChildrenMap((prev) => ({ ...prev, [obj.id]: children }));
    } catch {
      setError("Błąd pobierania dzieci.");
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/process/quick-add-child/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": document.cookie.match(/csrftoken=([^;]+)/)?.[1] || "",
        },
        credentials: "include",
        body: JSON.stringify({
          full_sn: childSn,
          mother_sn: motherFullSn,
          who_entry: userId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setChildSn("");
        childInputRef.current?.focus();

        const childrenRes = await fetch(`/api/process/${productId}/product-objects/${expandedMotherId}/children/`);
        const children = await childrenRes.json();
        setChildrenMap((prev) => ({
          ...prev,
          [expandedMotherId!]: children,
        }));
      } else {
        setError(data?.detail || "Błąd dodawania dziecka.");
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

      <p className="progress-label">Liczba obiektów: {totalCount}</p>

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
        <Modal title={`Karton: ${motherShortSn}`} onClose={() => setShowAddChildModal(false)}>
          <form onSubmit={handleAddChild}>
            <label>
              SN dziecka:
              <input
                ref={childInputRef}
                value={childSn}
                onChange={(e) => setChildSn(e.target.value)}
                required
              />
            </label>
            <button className="button-reset" type="submit">
              Dodaj
            </button>
          </form>
        </Modal>
      )}

      {error && <ErrorModal message={error} onClose={() => setError("")} />}
    </div>
  );
};

export default MoveObjectView;
