import { useState } from 'react';
import '../SpeaStyles.css';
import { useToast } from './ToastContext';
import { useSpeaRefresh } from '../context/SpeaRefreshContext';

interface SpeaAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpeaAddModal = ({ isOpen, onClose }: SpeaAddModalProps) => {
  const [sn, setSn] = useState('');
  const [category, setCategory] = useState('');
  const [locationName, setLocationName] = useState('Szafa'); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { triggerRefresh } = useSpeaRefresh();

  const { addToast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!sn.trim() || !category.trim()) {
      addToast("Uzupełnij SN i Kategorię!", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        sn: sn,
        category: category,
        location: {
          name: locationName
        }
      };

      const response = await fetch('/api/spea-card/objects/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Błąd dodawania');
      }

      addToast("Dodano nowy obiekt! 🎉", "success");
      
      setSn('');
      setCategory('');
      onClose();
      triggerRefresh();

    } catch (error) {
      console.error(error);
      addToast("Nie udało się dodać obiektu", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="spea-modal-overlay">
      <div className="spea-modal-content">
        <button className="spea-close-x" onClick={onClose}>&times;</button>
        
        <h3 className="spea-modal-title">Dodaj Nowy Obiekt</h3>

        <div className="spea-modal-body">
          <label className="spea-label">Kategoria</label>
          <input 
            className="spea-input-text" 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Np. YASPS1000"
          />

          <label className="spea-label">Numer Seryjny (SN)</label>
          <input 
            className="spea-input-text" 
            value={sn}
            onChange={(e) => setSn(e.target.value)}
            placeholder="Np. SN123456"
          />

          <label className="spea-label">Lokalizacja (Domyślnie: Szafa)</label>
          <input 
            className="spea-input-text" 
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
          />

          <div className="spea-modal-actions">
            <button 
              className="spea-btn spea-btn-confirm" 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Dodawanie...' : 'Dodaj'}
            </button>
            <button className="spea-btn spea-btn-cancel" onClick={onClose}>
              Anuluj
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};