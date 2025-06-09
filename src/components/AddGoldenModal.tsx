import React, { useState } from 'react';
import './AddGoldenModal.css';


function getCookie(name: string): string {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift()!;
  return '';
}

type Props = {
  variantCode: string;
  onClose: () => void;
  onSuccess: () => void;
};

const AddGoldenModal: React.FC<Props> = ({ variantCode, onClose, onSuccess }) => {
  const [sn, setSn] = useState('');
  const [variant_code] = useState(variantCode);
  const [typeGolden, setTypeGolden] = useState('good');
  const [expireDate, setExpireDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const password = prompt('Podaj hasło:');
    if (!password) {
      alert('Hasło jest wymagane');
      return;
    }
  
    const payload = {
      sn,
      variant_code,
      type_golden: typeGolden,
      expire_date: expireDate,
      password,
    };
  
    try {
      const res = await fetch('/api/golden-samples/add-golden/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
  
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Wystąpił błąd');
      }
    } catch (error) {
      console.error('Błąd sieci', error);
      setError('Wystąpił błąd sieci');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Dodaj Golden</h3>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

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
            <input
              type="date"
              value={expireDate}
              onChange={(e) => setExpireDate(e.target.value)}
              required
            />
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
