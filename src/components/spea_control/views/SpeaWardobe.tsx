import { useEffect, useState } from 'react';
import { SpeaGenericTable, SpeaItem } from '../SpeaMainTable';
import { SpeaDiagModal } from '../modals/SpeaDiagModal';
import { SpeaLocationModal } from '../modals/SpeaLocationModal';
import { useToast } from '../modals/ToastContext';
import { useSpeaFiles } from '../hooks/useSpeaFiles';
import { useSpeaRefresh } from '../context/SpeaRefreshContext';

export const SpeaWardrobe = () => {
  const [items, setItems] = useState<SpeaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBrokenId, setCurrentBrokenId] = useState<number | null>(null);

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [currentIssueId, setCurrentIssueId] = useState<number | null>(null);

  const { addToast } = useToast();
  const { renderDownloadButton } = useSpeaFiles();

  const { refreshKey } = useSpeaRefresh();

const fetchData = async () => {
    try {
      let url = '/api/spea-card/objects/?is_main_wardrobe=True';
      
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
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

  const changeApiStatus = async (id: number, endpointSuffix: string) => {
    const response = await fetch(`/api/spea-card/objects/${id}/${endpointSuffix}/`, { 
      method: 'POST' 
    });
    if (!response.ok) throw new Error('Błąd zmiany statusu');
  };

  const handleTableAction = async (id: number, action: 'break' | 'fix') => {
    if (action === 'break') {
      setCurrentBrokenId(id);
      setIsModalOpen(true);
    } else {
      await changeApiStatus(id, 'set_object_good');
      addToast("Naprawione! ✅", "success");
      fetchData();
    }
  };

  const handleConfirmBreak = async () => {
    if (currentBrokenId) {
      try {
        await changeApiStatus(currentBrokenId, 'set_object_bad');
      } catch (e) {
        addToast("Błąd podczas psucia obiektu", "error");
        throw e;
      }
    }
  };

  const handleOpenIssueModal = (id: number) => {
    setCurrentIssueId(id);
    setIsLocationModalOpen(true);
  };

  const handleIssueToProduction = async (name: string) => {
    if (currentIssueId === null) return;

    try {
      const response = await fetch(`/api/spea-card/objects/${currentIssueId}/change_place/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name })
      });

      if (!response.ok) throw new Error('Błąd zmiany miejsca');

      addToast(`Wydano na: ${name} 📦`, "success");
      fetchData();
      
    } catch (error) {
      console.error(error);
      addToast("Nie udało się wydać obiektu", "error");
    }
  };

  const handleSendToService = async (id: number) => {
    try {
      const response = await fetch(`/api/spea-card/objects/${id}/send_out_of_company/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Błąd wysyłki');

      addToast("Wysłano do serwisu zewn.", "success");
      fetchData();

    } catch (error) {
      console.error(error);
      addToast("Nie udało się wysłać do serwisu", "error");
    }
  };

  if (loading) {
    return <div className="spea-loader-container"><div className="spea-spinner"></div></div>;
  }

  const workingItems = items.filter(i => !i.is_broken);
  const brokenItems = items.filter(i => i.is_broken);

  return (
    <div className="spea-container">
      <SpeaDiagModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        speaCardId={currentBrokenId}
        first_file={items.find(i => i.id === currentBrokenId)?.first_file || null}
        onSuccess={fetchData}
        onConfirmAction={handleConfirmBreak}
      />

      <SpeaLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSubmit={handleIssueToProduction}
        title="Wydaj na produkcję"
      />

      <div 
        className="spea-row" 
        style={{ 
          display: 'flex',
          justifyContent: 'center', 
          alignItems: 'flex-start',
          gap: '20px',
          flexWrap: 'wrap'
        }}
      >
        
        <SpeaGenericTable 
          title="Sprawne w Szafie" 
          
          items={workingItems} 
          renderDownloadBtn={renderDownloadButton}
          
          onAction={(id) => handleTableAction(id, 'break')}
          actionLabel="Popsuty"
          actionClass="spea-btn-break"
          
          onSecondaryAction={handleOpenIssueModal}
          secondaryLabel="Wydaj"
          secondaryClass="spea-btn-issue"
          searchQuery={search}
          onSearch={setSearch}
          
        />
        <SpeaGenericTable 
          title="Uszkodzone w Szafie" 
          items={brokenItems} 
          renderDownloadBtn={renderDownloadButton}
          
          onAction={(id) => handleTableAction(id, 'fix')}
          actionLabel="Napraw"
          actionClass="spea-btn-fix"

          onSecondaryAction={handleSendToService}
          secondaryLabel="Serwis"
          secondaryClass="spea-btn-service"
          searchQuery={search}
          onSearch={setSearch}
        />
      </div>
    </div>
  );
};