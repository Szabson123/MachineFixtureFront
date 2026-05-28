import { useState } from 'react';
import '../SpeaStyles.css';
import { useToast } from './ToastContext';

interface SpeaDiagModalProps {
  isOpen: boolean;
  onClose: () => void;
  speaCardId: number | null;
  first_file: string | null;
  onSuccess: () => void;
  onConfirmAction: () => Promise<void>; 
}

export const SpeaDiagModal = ({ isOpen, onClose, speaCardId, onSuccess, onConfirmAction }: SpeaDiagModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { addToast } = useToast();

  if (!isOpen || speaCardId === null) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleClose = () => {
    setErrorMessage(null);
    setFile(null);
    onClose();
  }

const handleSkip = async () => {
    setUploading(true);
    try {
      await onConfirmAction();
      
      addToast("Status zmieniony na uszkodzony (bez pliku)", "success");
      onSuccess();
      handleClose();
    } catch (error) {
    } finally {
       setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setErrorMessage("Musisz wybrać plik przed wysłaniem!");
      return;
    }

    setUploading(true);
    setErrorMessage(null);

    try {
      await onConfirmAction();

      const formData = new FormData();
      formData.append('file', file); 

      const response = await fetch(`/api/spea-card/create-diag-file/${speaCardId}/`, {
        method: 'POST',
        body: formData, 
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Błąd uploadu pliku");
      }
      addToast("Status zmieniony + plik dodany! 📄", "success");
      onSuccess(); 
      handleClose();

    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "Błąd operacji";
      setErrorMessage(msg);
      onSuccess(); 
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="spea-modal-overlay">
      <div className="spea-modal-content">
        
        <button className="spea-close-x" onClick={handleClose} title="Zamknij">
          &times;
        </button>

        <h3 className="spea-modal-title">Dodaj plik Diagnostyczny</h3>
        <p className="spea-modal-subtitle">ID Obiektu: {speaCardId}</p>

        <div className="spea-modal-body">
          <input 
            type="file" 
            accept=".txt"
            onChange={handleFileChange}
            className="spea-file-input"
          />
          
          {errorMessage && (
            <div className="spea-error-msg">
              {errorMessage}
            </div>
          )}
          
          <div className="spea-modal-actions">
            <button 
              className="spea-btn spea-btn-upload"
              onClick={handleSubmit}
              disabled={uploading || !file}
            >
              {uploading ? 'Wysyłanie...' : 'Wyślij plik'}
            </button>
            
            <button className="spea-btn spea-btn-skip" onClick={handleSkip}>
              Pomiń
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};