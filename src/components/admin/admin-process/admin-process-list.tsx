import React, { useEffect, useState } from 'react';
import './admin-process-list.css';
import { useNavigate } from 'react-router-dom';

interface ProcessItem {
  id: string;
  product_name: string;
  label: string;
}
const AdminProcessesPage: React.FC = () => {
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const navigate = useNavigate(); 

  useEffect(() => {
    const fetchProcesses = async () => {
        try {
          const response = await fetch('/api/process/admin-process/process-list/');
          if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);
          const data: ProcessItem[] = await response.json();
          setProcesses(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Nieznany błąd");
        } finally {
          setLoading(false);
        }
    };
    fetchProcesses();
  }, []);

  const handleProcessClick = (id: string) => {
    navigate(`/admin/mistake-list/${id}`);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
  };

  const filteredProcesses = processes.filter(item => 
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-container">
      
      <div className="p-header-row">
        <header className="p-header-content">
          {/* Przycisk zostaje tutaj */}
          <button 
            className="ag-back-btn" 
            onClick={() => navigate("/admin/main-page")}
            title="Wróć do panelu głównego"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>

          {/* NOWY DIV GRUPUJĄCY TEKST */}
          <div>
            <h1>Lista Procesów</h1>
            <p>Zarządzaj procesami produkcyjnymi</p>
          </div>
        </header>

        <div className="p-search-wrapper">
          <svg className="p-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Szukaj po obszarze..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-search-input"
          />
        </div>
      </div>

      {loading && <div className="p-status-box"><div className="p-spinner"></div><p>Ładowanie...</p></div>}
      {error && <div className="p-status-box error"><p>{error}</p></div>}

      {!loading && !error && (
        <div className="p-list">
          {filteredProcesses.length > 0 ? (
            filteredProcesses.map((item) => {
               return (
                <div key={item.id} className="p-item" onClick={() => handleProcessClick(item.id)}>
                  <div 
                    className="p-avatar" 
                  >
                    {getInitials(item.product_name)}
                  </div>
                  
                  <div className="p-column p-col-main">
                    <span className="p-caption">Produkt</span>
                    <h3 className="p-product-name">{item.product_name}</h3>
                  </div>

                  <div className="p-column p-col-secondary">
                    <span className="p-caption">Obszar</span>
                    <span className="p-label-tag">{item.label}</span>
                  </div>

                  <div className="p-arrow">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-status-box">
              <p>Nie znaleziono: <strong>{searchTerm}</strong></p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminProcessesPage;