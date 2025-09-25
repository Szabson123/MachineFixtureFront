import React, { useState, useRef } from "react";
import Modal from "../shared/Modal";

interface MultiSNModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (sns: string[]) => Promise<void>;
  motherLabel?: string;
  motherPlace?: string;
}

const MultiSNModal: React.FC<MultiSNModalProps> = ({ isOpen, onClose, onSubmit, motherLabel, motherPlace }) => {
  const [snList, setSnList] = useState<string[]>([""]);
  const [errors, setErrors] = useState<number[]>([]);
  const inputRefs = useRef<HTMLInputElement[]>([]);

  const handleChange = (index: number, value: string) => {
    const updated = [...snList];
    updated[index] = value;
    const nonEmpty = updated.filter((sn) => sn.trim() !== "");
    const result =
      updated[updated.length - 1].trim() === "" ? [...nonEmpty, ""] : [...nonEmpty];

    // sprawdzamy duplikaty
    const duplicates: number[] = [];
    result.forEach((sn, i) => {
      if (sn && result.filter((s) => s === sn).length > 1) {
        duplicates.push(i);
      }
    });

    setErrors(duplicates);
    setSnList(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sns = snList.filter((sn) => sn.trim() !== "");
    const unique = [...new Set(sns)];

    if (sns.length !== unique.length) return; // są duplikaty

    await onSubmit(unique);
    setSnList([""]);
    setErrors([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal title="Dodaj wiele SN" onClose={onClose} hideFooter>
      {motherLabel && (
        <div>
          Matka: <strong>{motherLabel}</strong>
        </div>
      )}
      {motherPlace && (
        <div>
          Miejsce matki: <strong>{motherPlace}</strong>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        {snList.map((sn, index) => (
          <div key={index} style={{ marginBottom: "5px" }}>
            <input
              ref={(el) => { inputRefs.current[index] = el!; }}
              placeholder={`SN ${index + 1}`}
              value={sn}
              onChange={(e) => handleChange(index, e.target.value)}
              style={{ borderColor: errors.includes(index) ? "red" : undefined }}
            />
          </div>
        ))}
        <div className="modal-footer">
          <button type="submit" className="button-reset">Zapisz</button>
          <button type="button" className="btn-normal" onClick={onClose}>Anuluj</button>
        </div>
      </form>
    </Modal>
  );
};

export default MultiSNModal;
