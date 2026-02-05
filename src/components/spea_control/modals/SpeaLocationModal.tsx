import { useState } from 'react';
import '../SpeaStyles.css';

interface SpeaLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  title: string;
}

export const SpeaLocationModal = ({ isOpen, onClose, onSubmit, title }: SpeaLocationModalProps) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setIsSubmitting(true);
    await onSubmit(name);
    setIsSubmitting(false);
    setName('');
    onClose();
  };

  return (
    <div className="spea-modal-overlay">
      <div className="spea-modal-content">
        <h3 className="spea-modal-title">{title}</h3>
        
        <div className="spea-modal-body">
          <label className="spea-label"></label>
          <input 
            type="text" 
            className="spea-input-text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Np. Linia 1"
            autoFocus
          />

          <div className="spea-modal-actions">
            <button 
              className="spea-btn spea-btn-confirm"
              onClick={handleSubmit}
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? 'Zapisywanie...' : 'Zatwierdź'}
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