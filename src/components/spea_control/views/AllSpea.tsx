import { useEffect, useState } from 'react';
import { SpeaGenericTable, SpeaItem } from '../SpeaMainTable';
import { SpeaDiagModal } from '../modals/SpeaDiagModal';
import { SpeaLocationModal } from '../modals/SpeaLocationModal';
import { useToast } from '../modals/ToastContext';
import { useSpeaFiles } from '../hooks/useSpeaFiles';
import '../SpeaStyles.css';
import { useSpeaRefresh } from '../context/SpeaRefreshContext';

export const AllSpea = () => {
  const [items, setItems] = useState<SpeaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [search, setSearch] = useState('');

  const [isDiagModalOpen, setIsDiagModalOpen] = useState(false);
  const [currentActionId, setCurrentActionId] = useState<number | null>(null);

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [currentIssueId, setCurrentIssueId] = useState<number | null>(null);
  const { refreshKey } = useSpeaRefresh();

  const { addToast } = useToast();
  const { renderDownloadButton } = useSpeaFiles();

  const fetchData = async () => {
    try {
      let url = '/api/spea-card/objects/'; 
      
      if (search) {
        url += `?search=${encodeURIComponent(search)}`;
      }

      const response = await fetch(url); 
      if (!response.ok) throw new Error('Błąd API');
      const data = await response.json();
      setItems(data);
    } catch (error) {
      addToast("Błąd pobierania danych", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 10);

    return () => clearTimeout(delayDebounceFn);
  }, [search, refreshKey]);

  const changeApiStatus = async (id: number, suffix: string) => {
    const response = await fetch(`/api/spea-card/objects/${id}/${suffix}/`, { method: 'POST' });
    if (!response.ok) throw new Error('Błąd API');
  };

  const handleConfirmBreak = async () => {
    if (currentActionId) {
      await changeApiStatus(currentActionId, 'set_object_bad');
    }
  };

  const handleFix = async (id: number) => {
    try {
      await changeApiStatus(id, 'set_object_good');
      addToast("Naprawione! ✅", "success");
      fetchData();
    } catch { addToast("Błąd naprawy", "error"); }
  };
  
  const handleBackToWardrobe = async (id: number) => {
    try {
      await changeApiStatus(id, 'back_to_wardrobe');
      addToast("Zwrócono do szafy! 🚪", "success");
      fetchData();
    } catch { addToast("Błąd zwrotu", "error"); }
  };

  const handleSendService = async (id: number) => {
    try {
      await changeApiStatus(id, 'send_out_of_company');
      addToast("Wysłano do serwisu 🚚", "success");
      fetchData();
    } catch { addToast("Błąd wysyłki", "error"); }
  };
  
  const handleIssueSubmit = async (name: string) => {
    if (!currentIssueId) return;
    try {
      await fetch(`/api/spea-card/objects/${currentIssueId}/change_place/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      addToast(`Wydano na: ${name} 📦`, "success");
      fetchData();
    } catch { addToast("Błąd wydawania", "error"); }
  };

  const renderRowActions = (item: SpeaItem) => {
    
    if (item.out_of_company) {
      return (
        <button className="spea-btn spea-btn-back-company" onClick={() => handleBackToWardrobe(item.id)}>
          Wróć ↩️
        </button>
      );
    }

    if (item.is_broken) {
      return (
        <>
          <button className="spea-btn spea-btn-service" onClick={() => handleSendService(item.id)}>
            Serwis 🚚
          </button>
          <button className="spea-btn spea-btn-fix" onClick={() => handleFix(item.id)}>
            Napraw 🔧
          </button>
        </>
      );
    }

    return (
      <>
        <button 
          className="spea-btn spea-btn-issue" 
          onClick={() => { setCurrentIssueId(item.id); setIsLocationModalOpen(true); }}
        >
          Wydaj 📦
        </button>
        
        <button 
          className="spea-btn spea-btn-break" 
          onClick={() => { setCurrentActionId(item.id); setIsDiagModalOpen(true); }}
        >
          Popsuty 💥
        </button>
      </>
    );
  };

  if (loading) return <div className="spea-loader-container"><div className="spea-spinner"></div></div>;

  return (
    <div className="spea-container">
      <SpeaDiagModal 
        isOpen={isDiagModalOpen} 
        onClose={() => setIsDiagModalOpen(false)} 
        speaCardId={currentActionId}
        first_file={items.find(i => i.id === currentActionId)?.first_file || null}
        onSuccess={fetchData}
        onConfirmAction={handleConfirmBreak}
      />

      <SpeaLocationModal 
        isOpen={isLocationModalOpen} 
        onClose={() => setIsLocationModalOpen(false)} 
        onSubmit={handleIssueSubmit} 
        title="Wydaj na produkcję" 
      />

      <div className="spea-row" style={{ justifyContent: 'center' }}>
        <SpeaGenericTable 
          title="WSZYSTKIE OBIEKTY (Master View)" 
          items={items} 
          renderDownloadBtn={renderDownloadButton}
          
          renderActions={renderRowActions} 

          searchQuery={search}   
          onSearch={setSearch}
        />
      </div>
    </div>
  );
};