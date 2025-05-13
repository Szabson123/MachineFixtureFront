import React, { useState } from 'react';
import './AddGoldenModal.css';

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

const AddGoldenModal: React.FC<Props> = ({onClose, onSuccess }) => {
  const [sn, setSn] = useState('');
  const [variant_code, setVariant] = useState('');
  const [typeGolden, setTypeGolden] = useState('good');
  const [expireDate, setExpireDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      sn,
      variant_code: variant_code,
      type_golden: typeGolden,
      expire_date: expireDate,
    };

    try {
      const res = await fetch('http://127.0.0.1:8000/api/golden-samples/add-golden/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        console.error('Błąd dodawania');
      }
    } catch (error) {
      console.error('Błąd sieci', error);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Dodaj Golden</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Kod:
            <input value={variant_code} onChange={(e) => setVariant(e.target.value)} />
          </label>
          <label>
            SN:
            <input value={sn} onChange={(e) => setSn(e.target.value)} required />
          </label>

          <label>
            Typ:
            <select value={typeGolden} onChange={(e) => setTypeGolden(e.target.value)}>
              <option value="good">Good</option>
              <option value="bad">Bad</option>
              <option value="calib">Calib</option>
            </select>
          </label>

          <label>
            Data wygaśnięcia:
            <input type="date" value={expireDate} onChange={(e) => setExpireDate(e.target.value)} required />
          </label>

          <div className="modal-buttons">
            <button type="submit">Dodaj</button>
            <button type="button" onClick={onClose}>Anuluj</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGoldenModal;
