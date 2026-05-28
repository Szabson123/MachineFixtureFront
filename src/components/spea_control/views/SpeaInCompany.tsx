import { useEffect, useState } from 'react';
import { SpeaGenericTable, SpeaItem } from '../SpeaMainTable';
import { useToast } from '../modals/ToastContext';
import { useSpeaFiles } from '../hooks/useSpeaFiles';
import { useSpeaRefresh } from '../context/SpeaRefreshContext';

export const SpeaInCompany = () => {
  const [items, setItems] = useState<SpeaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [search, setSearch] = useState('');
  
  const { addToast } = useToast();
  const { renderDownloadButton } = useSpeaFiles();
  const { refreshKey } = useSpeaRefresh();

  const fetchData = async () => {
    try {
      let url = '/api/spea-card/objects/?location_in_company=True';
      
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

  if (loading) {
    return (
      <div className="spea-loader-container">
        <div className="spea-spinner"></div>
      </div>
    );
  }

  const handleReturnToWardrobe = async (id: number) => {
      try {
          const response = await fetch(`/api/spea-card/objects/${id}/back_to_wardrobe/`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
          });

          if (!response.ok) {
              throw new Error(`Błąd: ${response.status}`);
          }
          addToast("Zwrócono do szafy!", "success");
          fetchData();

      } catch (error) {
          console.error(error);
          addToast("Nie udało się zwrócić obiektu", "error");
      }
  };

  return (
    <div className="spea-container">
      <div className="spea-row" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <SpeaGenericTable 
          title="Obiekty na Produkcji (W Firmie)" 
          items={items} 
          renderDownloadBtn={renderDownloadButton}
          onAction={handleReturnToWardrobe}
          actionLabel="Zwróć ↩️"
          actionClass="spea-btn-back-company"
          
          searchQuery={search}
          onSearch={setSearch}
        />
      </div>
    </div>
  );
};