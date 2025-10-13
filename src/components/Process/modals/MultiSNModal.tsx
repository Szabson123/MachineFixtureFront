import React, { useState, useEffect, useRef } from "react";
import Modal from "../shared/Modal";

interface MultiSNModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (sns: string[], placeName: string) => void;
}

const MultiSNModal: React.FC<MultiSNModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [multiSNs, setMultiSNs] = useState<string[]>([""]);
  const [multiErrors, setMultiErrors] = useState<number[]>([]);
  const [placeName, setPlaceName] = useState("");
  const [error, setError] = useState("");

  const placeInputRef = useRef<HTMLInputElement>(null);
  const multiSNRefs = useRef<HTMLInputElement[]>([]);

  // autofocus
  useEffect(() => {
    if (isOpen && placeInputRef.current) {
      setTimeout(() => placeInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleMultiSNChange = (index: number, value: string) => {
    const updated = [...multiSNs];
    updated[index] = value;

    const nonEmpty = updated.filter((sn) => sn.trim() !== "");
    const result =
      updated[updated.length - 1].trim() === "" ? [...nonEmpty, ""] : [...nonEmpty];

    const duplicates: number[] = [];
    result.forEach((sn, i) => {
      if (sn && result.filter((s) => s === sn).length > 1) {
        duplicates.push(i);
      }
    });

    setMultiErrors(duplicates);
    setMultiSNs(result);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filtered = multiSNs.filter((sn) => sn.trim() !== "");
    const unique = [...new Set(filtered)];

    if (!placeName.trim()) {
      setError("Podaj miejsce.");
      return;
    }
    if (filtered.length !== unique.length) {
      setError("Znaleziono duplikaty numerów SN!");
      return;
    }
    if (unique.length === 0) {
      setError("Wprowadź przynajmniej jeden numer SN.");
      return;
    }

    onSubmit(unique, placeName);
    setMultiSNs([""]);
    setMultiErrors([]);
    setPlaceName("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal title="Pobierz z magazynku" onClose={onClose} hideFooter>
      <form onSubmit={handleSubmit}>
        <label>
          Miejsce:
          <input
            ref={placeInputRef}
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                multiSNRefs.current[0]?.focus();
              }
            }}
            required
          />
        </label>

        <div
          style={{
            maxHeight: "400px",
            overflowY: multiSNs.length > 10 ? "auto" : "visible",
            paddingRight: "5px",
            marginBottom: "1rem",
            border: multiSNs.length > 10 ? "1px solid #ccc" : undefined,
          }}
        >
          {multiSNs.map((sn, index) => (
            <div
              key={index}
              style={{ display: "flex", alignItems: "center", marginBottom: "5px" }}
            >
              <span style={{ width: "24px", textAlign: "right", marginRight: "8px" }}>
                {index + 1}.
              </span>
              <input
                ref={(el) => {
                  if (el) multiSNRefs.current[index] = el;
                }}
                placeholder={`SN ${index + 1}`}
                value={sn}
                onChange={(e) => handleMultiSNChange(index, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const isLast = index === multiSNs.length - 1;
                    const trimmed = sn.trim();
                    if (trimmed !== "" && isLast) {
                      setMultiSNs((prev) => {
                        const updated = [...prev, ""];
                        setTimeout(() => {
                          multiSNRefs.current[updated.length - 1]?.focus();
                        }, 0);
                        return updated;
                      });
                    }
                  }
                }}
                style={{
                  borderColor: multiErrors.includes(index) ? "red" : undefined,
                  flexGrow: 1,
                }}
              />
            </div>
          ))}
        </div>

        {error && (
          <p style={{ color: "red", marginBottom: "10px", fontWeight: 600 }}>{error}</p>
        )}

        <div className="modal-footer">
          <button className="button-reset" type="submit">Zapisz</button>
          <button className="btn-normal" type="button" onClick={onClose}>Anuluj</button>
        </div>
      </form>
    </Modal>
  );
};

export default MultiSNModal;
