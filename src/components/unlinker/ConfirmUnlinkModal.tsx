import React from "react";
import "./unlinker.css";

type ConfirmUnlinkModalProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
};

const ConfirmUnlinkModal: React.FC<ConfirmUnlinkModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="unl-modal-overlay" style={{ zIndex: 1200 }}>
      <div className="unl-modal-content" style={{ textAlign: "center", borderTop: "5px solid #007bff" }}>
        <h4 style={{ margin: "0 0 15px 0", color: "#333" }}>Potwierdzenie operacji</h4>
        <p style={{ fontSize: "14px", color: "#555", marginBottom: "20px" }}>
          Czy na pewno chcesz wykonać operację UNLINK dla wprowadzonych numerów seryjnych?
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="unl-modal-btn"
            onClick={onConfirm}
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Przetwarzanie..." : "Tak, wykonaj"}
          </button>
          <button
            className="unl-modal-btn"
            style={{ backgroundColor: "#dc3545" }}
            onClick={onCancel}
            disabled={loading}
          >
            Nie, anuluj
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmUnlinkModal;