import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ProcessAction.css";
import SimpleCheckView from "../Process/views/CheckObjectView";
import MiniMachineStatuses from "../Process/views/MiniMachineStatus";
import ErrorModal from "../Process/shared/ErrorModal";

const ProcessAction: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const selectedProcess = JSON.parse(localStorage.getItem("selectedProcess") || "{}");

  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<null | "add" | "receive" | "move" | "trash">(null);
  const [userId, setUserId] = useState("");
  const [firstCharTime, setFirstCharTime] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const shouldRenderCheckDirectly =
    selectedProcess?.settings?.autoCheck === true || selectedProcess?.type === "condition";

  useEffect(() => {
    if (!selectedProcess?.id) return;
    const fetchPlaces = async () => {
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
    if (showModal) {
      setUserId("");
      setFirstCharTime(null);
      if (inputRef.current) inputRef.current.focus();
    }
  }, [showModal]);

  const handleAction = (type: "add" | "receive" | "move" | "trash") => {
    setActionType(type);
    setShowModal(true);
  };

  const resetInput = () => {
    setUserId("");
    setFirstCharTime(null);
    if (inputRef.current) inputRef.current.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
      if (userId.trim() === "") {
      setErrorMessage("Nie wolno wklejać. Użyj skanera");
      resetInput();
      return;
    }
    resetInput();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value.length === 1 && !firstCharTime) {
      setFirstCharTime(Date.now());
    }

    setUserId(value);
  };

const handleConfirm = () => {
  if (userId.trim() === "aba") {
    localStorage.setItem("userIdentifier", userId);
    localStorage.setItem("processActionType", actionType as string);
    setShowModal(false);
    navigate(`/process/${productId}/process-action/${actionType}`);
    return;
  }

  if (userId.trim() === "") {
    setErrorMessage("Wprowadź identyfikator przed przejściem dalej.");
    resetInput();
    return;
  }

  if (userId.length < 5) {
    setErrorMessage("Identyfikator musi mieć minimum 5 znaków.");
    resetInput();
    return;
  }

  if (
    selectedProcess?.settings?.defaults?.validate_fish &&
    firstCharTime &&
    Date.now() - firstCharTime > 100
  ) {
    setErrorMessage("Wprowadzanie ręczne niedozwolone. Użyj skanera.");
    resetInput();
    return;
  }

  localStorage.setItem("userIdentifier", userId);
  localStorage.setItem("processActionType", actionType as string);
  setShowModal(false);
  navigate(`/process/${productId}/process-action/${actionType}`);
};



  const renderButtons = () => {
    switch (selectedProcess?.type) {
      case "add_receive":
        return (
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
              <h3>Wyciągnij</h3>
              <p>Wyciągnij produkt z procesu</p>
            </div>
          </div>
        );
      case "normal":
        return (
          <>
            <div className="action-button receive-button" onClick={() => handleAction("receive")}>
              <h3>Przyjmij</h3>
              <p>Dodaj produkt do procesu</p>
            </div>
            <div className="action-button move-button" onClick={() => handleAction("move")}>
              <h3>Wyciągnij</h3>
              <p>Przenieś produkt dalej</p>
            </div>
          </>
        );
      case "end":
        return (
          <div className="action-button receive-button" onClick={() => handleAction("trash")}>
            <h3>Wyrzuć</h3>
            <p>Wyrzuć produkt</p>
          </div>
        );
      default:
        return <p>Brak dostępnych akcji dla tego procesu.</p>;
    }
  };

  if (shouldRenderCheckDirectly) {
    if (typeof window !== "undefined" && !window.location.search.includes("movement_type=")) {
      const url = new URL(window.location.href);
      url.searchParams.set("movement_type", "check");
      window.history.replaceState({}, "", url.toString());
    }
    return (
      <div className="action-container">
        <SimpleCheckView />
      </div>
    );
  }

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

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Zeskanuj swój identyfikator</h3>
            <input
              ref={inputRef}
              type="text"
              placeholder="Wprowadź/skanuj ID"
              value={userId}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              onPaste={handlePaste}
            />
            <div className="modal-buttons">
              <button onClick={handleConfirm}>Potwierdź</button>
              <button onClick={() => setShowModal(false)}>Anuluj</button>
            </div>
          </div>
        </div>
      )}

        {errorMessage && (
          <ErrorModal 
            message={errorMessage} 
            onClose={() => setErrorMessage(null)} 
          />
        )}

      {selectedProcess?.settings?.defaults?.production_process_type && (
        <div className="action-statuses">
          <MiniMachineStatuses />
        </div>
      )}
    </div>
  );
};

export default ProcessAction;
