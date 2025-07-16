import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ProcessAction.css";

const ProcessAction: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const selectedProcess = JSON.parse(localStorage.getItem("selectedProcess") || "{}");

  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<null | "add" | "receive" | "move">(null);
  const [userId, setUserId] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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
  }, [selectedProcess]);

  useEffect(() => {
    if (showModal && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showModal]);

  const handleAction = (type: "add" | "receive" | "move") => {
    setActionType(type);
    setShowModal(true);
  };

  const handleConfirm = () => {
    if (userId.trim() !== "") {
      localStorage.setItem("userIdentifier", userId);
      localStorage.setItem("processActionType", actionType as string);
      setShowModal(false);

      navigate(`/process/${productId}/process-action/${actionType}`);
    } else {
      alert("Wprowadź identyfikator przed przejściem dalej.");
    }
  };

  const renderButtons = () => {
    switch (selectedProcess?.type) {
      case "add_receive":
        return (
          <>
            <div className="action-buttons">
              <div className="action-button add-button" onClick={() => handleAction("add")}>
                <h3>Dodaj</h3>
                <p>Dodaj nowy produkt</p>
              </div>

              <div className="action-button receive-button" onClick={() => handleAction("receive")}>
                <h3>Przyjmij</h3>
                <p>Przyjmij produkt do procesu</p>
              </div>

              <div className="action-button move-button" onClick={() => handleAction("move")}>
                <h3>Wydaj</h3>
                <p>Wydaj produkt z procesu</p>
              </div>
            </div>
          </>
        );
      case "normal":
        return (
          <>
            <div className="action-button receive-button" onClick={() => handleAction("receive")}>
              <h3>Przyjmij</h3>
              <p>Dodaj produkt do procesu</p>
            </div>
            <div className="action-button move-button" onClick={() => handleAction("move")}>
              <h3>Wydaj</h3>
              <p>Przenieś produkt dalej</p>
            </div>
          </>
        );
        case "end":
          return (
            <>
              <div className="action-button receive-button" onClick={() => handleAction("receive")}>
                <h3>Wyrzuć</h3>
                <p>Wyrzuć produkt</p>
              </div>
            </>
          );
      default:
        return <p>Brak dostępnych akcji dla tego procesu.</p>;
    }
  };

  return (
    <div className="action-container">
      <div className="action-panel">
        <div className="action-header-process">
          <button onClick={() => navigate(`/process/${productId}`)} className="back-button">
            &larr; Powrót
          </button>
          <h2 className="flow-title-action">Wybierz akcję dla: {selectedProcess.name}</h2>
        </div>

        <div className="action-buttons" style={{ justifyContent: "center", gap: "2rem" }}>
          {renderButtons()}
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
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
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
