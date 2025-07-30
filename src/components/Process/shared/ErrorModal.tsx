import React from "react";
import "./modal.css";

interface ErrorModalProps {
  message: string;
  onClose: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ message, onClose }) => {
  return (
    <div className="modal-overlay active">
      <div className="modal">
        <h2>Błąd</h2>
        <p>{message}</p>
        <div className="modal-buttons">
          <button className="btn btn-ack" onClick={onClose}>
            Zrozumiano
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;