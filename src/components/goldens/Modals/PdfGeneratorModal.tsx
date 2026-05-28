import React, { useState } from "react";

type PdfGeneratorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (proces: string, produkt: string) => void;
};

const PdfGeneratorModal: React.FC<PdfGeneratorModalProps> = ({ isOpen, onClose, onGenerate }) => {
  const [proces, setProces] = useState("");
  const [produkt, setProdukt] = useState("");

  if (!isOpen) return null;

  const handleGenerate = () => {
    onGenerate(proces, produkt);
    setProces("");
    setProdukt("");
  };

  return (
    <div className="g-modal-overlay" aria-modal="true" role="dialog">
      <div className="g-submodal-content small">
        <div className="g-submodal-header">
          <h3 className="g-submodal-title">Dane do raportu PDF</h3>
          <button className="g-modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="g-submodal-body" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>Proces:</label>
            <input
              type="text"
              className="g-form-input"
              placeholder="np. SMT, THT..."
              value={proces}
              onChange={(e) => setProces(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold" }}>Produkt:</label>
            <input
              type="text"
              className="g-form-input"
              placeholder="np. Nazwa projektu..."
              value={produkt}
              onChange={(e) => setProdukt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGenerate();
              }}
            />
          </div>
        </div>
        <div className="g-submodal-actions">
          <button className="g-cancel-small" onClick={onClose}>
            Anuluj
          </button>
          <button 
            className="g-save-small" 
            onClick={handleGenerate}
            disabled={!proces.trim() || !produkt.trim()}
          >
            Generuj
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfGeneratorModal;