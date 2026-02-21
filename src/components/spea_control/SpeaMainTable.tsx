import React from 'react';
import './SpeaStyles.css';

interface Location {
  id: number;
  name: string;
}

export interface SpeaItem {
  id: number;
  sn: string;
  category: string;
  location: Location | null;
  is_broken: boolean;
  first_file: string | null;
  out_of_company?: boolean;
}

interface SpeaGenericTableProps {
  title: string;
  items: SpeaItem[];
  
  onAction?: (id: number) => void; 
  actionLabel?: string;
  actionClass?: string;
  onSecondaryAction?: (id: number) => void;
  secondaryLabel?: string;
  secondaryClass?: string;

  renderActions?: (item: SpeaItem) => React.ReactNode;

  renderDownloadBtn: (fileUrl: string | null, sn: string) => React.ReactNode;
  searchQuery?: string;
  onSearch?: (query: string) => void;
}

export const SpeaGenericTable = ({ 
  title, 
  items, 
  onAction, actionLabel, actionClass,
  onSecondaryAction, secondaryLabel, secondaryClass,
  renderActions,
  renderDownloadBtn,
  searchQuery,
  onSearch
}: SpeaGenericTableProps) => {
  
  return (
    <div className="spea-column spea-table-wrapper">
      
      <div className="spea-table-header">
        <h2 className="spea-title">{title} ({items.length})</h2>

        {onSearch && (
          <input 
            type="text" 
            className="spea-search-input"
            placeholder="🔍 Szukaj po SN, kategorii..."
            value={searchQuery || ''}
            onChange={(e) => onSearch(e.target.value)}
          />
        )}
      </div>
      
      {items.length === 0 ? (
        <p className="spea-empty-state">Brak elementów do wyświetlenia.</p>
      ) : (
        <div className="spea-table-scroll">
          <table className="spea-table">
            <thead>
              <tr>
                <th className="spea-th">Kategoria</th>
                <th className="spea-th">Nr Seryjny (SN)</th>
                <th className="spea-th">Lokalizacja</th>
                <th className="spea-th spea-th-actions">Akcja</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="spea-td">
                    <span className="spea-text-limit" title={item.category}>
                      {item.category}
                    </span>
                  </td>
                  
                  <td className="spea-td spea-td-sn">

                    <span className="spea-text-limit" title={item.sn}>
                      {item.sn}
                    </span>
                  </td>
                  
                  <td className="spea-td">
                    {item.location ? (
                      <span className="spea-location-badge">{item.location.name}</span>
                    ) : (
                      <span className="spea-empty-text">- Brak -</span>
                    )}
                    
                    {item.out_of_company && <span className="spea-status-icon" title="Poza firmą">🌍</span>}
                  </td>
                  
                  <td className="spea-td">
                    <div className="spea-actions-row">
                      
                      {renderActions ? (
                        renderActions(item)
                      ) : (
                        <>
                          {onSecondaryAction && secondaryLabel && (
                            <button className={`spea-btn ${secondaryClass}`} onClick={() => onSecondaryAction(item.id)}>
                              {secondaryLabel}
                            </button>
                          )}
                          {onAction && actionLabel && (
                            <button className={`spea-btn ${actionClass}`} onClick={() => onAction(item.id)}>
                              {actionLabel}
                            </button>
                          )}
                        </>
                      )}
                      {renderDownloadBtn(item.first_file, item.sn)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};