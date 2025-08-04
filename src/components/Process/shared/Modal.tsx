import React, { useEffect } from "react";
import "./modal.css";

interface ModalProps {
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  hideFooter?: boolean;
}

const Modal: React.FC<ModalProps> = ({ title, children, onClose, hideFooter = false }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-white">
        {title && <h3 className="modal-title">{title}</h3>}
        {children}
        {!hideFooter && (
          <div className="modal-footer">
            <button className="btn-normal" onClick={onClose}>Zamknij</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
