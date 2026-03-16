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

  const getCsrfToken = () => document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/)?.[1] || "";

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

  const changeApiStatus = async (id: number, suffix: string, bodyData: object | null = null) => {
    const response = await fetch(`/api/spea-card/objects/${id}/${suffix}/`, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCsrfToken(),
      },
      credentials: "include",
      body: bodyData ? JSON.stringify(bodyData) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Błąd API');
    }
    return response;
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 10);

    return () => clearTimeout(delayDebounceFn);
  }, [search, refreshKey]);

  const handleBackToWardrobe = async (id: number) => {
    try {
      await changeApiStatus(id, 'back_to_wardrobe');
      addToast("Zwrócono do szafy! 🚪", "success");
      fetchData();
    } catch (error) { 
      addToast("Błąd zwrotu", "error"); 
    }
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
          
          onAction={handleBackToWardrobe}
          actionLabel="Wróć do firmy ↩️"
          actionClass="spea-btn-back-company"

          searchQuery={search}
          onSearch={setSearch}
        />
        
      </div>
    </div>
  );
};