import React, { useState } from "react";
import './AddVariantModal.css';
type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

const AddVariantModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (!code.trim()) {
      alert("Kod wariantu jest wymagany");
      return;
    }

    fetch("/api/golden-samples/variant/manage/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Nie udało się dodać wariantu");
        return res.json();
      })
      .then(() => onSuccess())
      .catch((err) => alert(err.message));
  };

  return (
    <div className="modal-backdrop">
    <div className="modal">
        <h2>Dodaj nowy wariant</h2>

        <label>Kod wariantu:</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <label>Nazwa wariantu:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="modal-buttons">
          <button onClick={handleSubmit} className="save-btn">Zapisz</button>
          <button onClick={onClose} className="cancel-btn">Anuluj</button>
        </div>
      </div>
    </div>
  );
};

export default AddVariantModal;
