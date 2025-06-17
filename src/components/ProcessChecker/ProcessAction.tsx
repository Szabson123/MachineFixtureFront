import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ProcessAction.css";

const ProcessAction: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const selectedProcess = JSON.parse(localStorage.getItem("selectedProcess") || "{}");

  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<"add" | "remove" | null>(null);
  const [userId, setUserId] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const selectedProcess = JSON.parse(localStorage.getItem("selectedProcess") || "{}");
  
    const fetchPlaces = async () => {
      if (!selectedProcess?.id) return;
  
      try {
        const response = await fetch(`/api/process/${selectedProcess.id}/place/`);
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem("availablePlaces", JSON.stringify(data));
        } else {
          console.error("Nie udało się pobrać miejsc.");
        }
      } catch (error) {
        console.error("Błąd sieci przy pobieraniu miejsc:", error);
      }
    };
  
    fetchPlaces();
  }, []);

  useEffect(() => {
    if (showModal && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showModal]);

  const handleAction = (type: "add" | "remove") => {
    setActionType(type);
    setShowModal(true);
  };

  const handleConfirm = () => {
    if (userId.trim() !== "") {
      localStorage.setItem("userIdentifier", userId);
      if (actionType) {
        const typeToNavigate =
          actionType === "add"
            ? selectedProcess.order === 1
              ? "add"
              : "receive"
            : "move";
  
        localStorage.setItem("processActionType", typeToNavigate);
        navigate(`/process/${productId}/process-action/${typeToNavigate}`);
      }
    } else {
      alert("Wprowadź identyfikator przed przejściem dalej.");
    }
  };

  return (
    <div className="action-container">
      <div className="action-panel">
        <div className="action-header-process">
        <button 
              onClick={() => navigate(`/process/${productId}`)} 
              className="back-button"
            >
              &larr; Powrót
            </button>
          <h3>Wybierz akcję dla: {selectedProcess.name}</h3>
        </div>

        <div className="action-buttons">
          <div className="action-button add-button" onClick={() => handleAction("add")}>
            <h3>Dodaj</h3>
            <p>Dodaj Produkt do procesu (input)</p>
          </div>

          <div className="action-button remove-button" onClick={() => handleAction("remove")}>
            <h3>Pobierz</h3>
            <p>Pobierz Produkt z tego procesu (output)</p>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
            <div className="modal-content">
            <h3>Zeskanuj swój identyfikator</h3>
            <input
            ref={inputRef}
            type="text"
            placeholder="Wprowadź/skanuj ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                handleConfirm();
                }
            }}
            />
            <div className="modal-buttons">
                <button onClick={handleConfirm}>Potwierdź</button>
                <button onClick={() => setShowModal(false)}>Anuluj</button>
            </div>
            </div>
        </div>
        )}
    </div>
  );
};

export default ProcessAction;
