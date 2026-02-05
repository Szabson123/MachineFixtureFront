import { useEffect, useState } from 'react';
import { SpeaGenericTable, SpeaItem } from '../SpeaMainTable';
import { useToast } from '../modals/ToastContext';
import { useSpeaFiles } from '../hooks/useSpeaFiles';
import { useSpeaRefresh } from '../context/SpeaRefreshContext';

export const SpeaOutOfCompany = () => {
  const [items, setItems] = useState<SpeaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [search, setSearch] = useState('');
  
  const { addToast } = useToast();
  const { renderDownloadButton } = useSpeaFiles();
  const { refreshKey } = useSpeaRefresh();

  const fetchData = async () => {
    try {
      let url = '/api/spea-card/objects/?location_in_company=False';
      
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

  const handleReturnToCompany = async (id: number) => {
      console.log("Powrót", id);
  };

  if (loading) {
    return (
      <div className="spea-loader-container">
        <div className="spea-spinner"></div>
      </div>
    );
  }

  return (
    <div className="spea-container">
      <div className="spea-row" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        
        <SpeaGenericTable 
          title="Obiekty Poza Firmą (U Klienta/Serwis)" 
          items={items} 
          renderDownloadBtn={renderDownloadButton}
          
          onAction={handleReturnToCompany}
          actionLabel="Wróć do firmy ↩️"
          actionClass="spea-btn-back-company"

          searchQuery={search}
          onSearch={setSearch}
        />
        
      </div>
    </div>
  );
};