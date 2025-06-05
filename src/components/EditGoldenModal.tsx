import React, { useState } from "react";
import './EditGoldenModal.css';


function getCookie(name: string): string {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift()!;
  return '';
}

type Props = {
  golden: {
    id: number;
    golden_code: string;
    expire_date: string;
    type_golden: string;
    counter: number;
    variant: {
      code: string;
      name: string;
    };
  };
  onClose: () => void;
  onSuccess: () => void;
};

const EditGoldenModal: React.FC<Props> = ({ golden, onClose, onSuccess }) => {
  const [typeGolden, setTypeGolden] = useState(golden.type_golden);
  const [expireDate, setExpireDate] = useState(golden.expire_date);

  const handleSave = () => {
    fetch(`/api/golden-samples/goldens/manage/${golden.id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken")
      },
      credentials: "include",
      body: JSON.stringify({
        type_golden: typeGolden,
        expire_date: expireDate,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Błąd aktualizacji");
        return res.json();
      })
      .then(() => {
        onSuccess();
      })
      .catch((err) => alert("Wystąpił błąd: " + err.message));
  };

  const handleDelete = () => {
    if (!window.confirm("Czy na pewno chcesz usunąć ten wzorzec?")) return;

    fetch(`/api/golden-samples/goldens/${golden.id}/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken")
      },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Błąd podczas usuwania");
        onSuccess();
        onClose();
      })
      .catch((err) => alert("Błąd usuwania: " + err.message));
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <button className="delete-button" onClick={handleDelete} title="Usuń wzorzec">
          🗑
        </button>
        <h2>Edytuj wzorzec</h2>
        <p><strong>SN:</strong> {golden.golden_code}</p>
        {golden.variant && (
          <p>
            <strong>Wariant:</strong> {golden.variant.name} ({golden.variant.code})
          </p>
        )}
        <label>Typ:</label>
        <select value={typeGolden} onChange={(e) => setTypeGolden(e.target.value)}>
          <option value="good">Good</option>
          <option value="bad">Bad</option>
          <option value="calib">Calib</option>
        </select>

        <label>Data ważności:</label>
        <input
          type="date"
          value={expireDate}
          onChange={(e) => setExpireDate(e.target.value)}
        />

        <div className="modal-buttons">
          <button onClick={handleSave} className="save-btn">Zapisz</button>
          <button onClick={onClose} className="cancel-btn">Anuluj</button>
        </div>
      </div>
    </div>
  );
};

export default EditGoldenModal;
