import React from 'react';
import './admin-main-page.css';
import { useNavigate } from 'react-router-dom';
const Icons = {
  Processes: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  ),
  Groups: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  Products: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <path d="M16 10a4 4 0 0 1-8 0"></path>
    </svg>
  )
};

interface DashboardItem {
  id: string;
  title: string;
  description: string;
  IconComponent: React.FC;
  themeClass: 'blue' | 'orange' | 'teal';
  count?: number;
}

const AdminMainPage: React.FC = () => {
  
    const dashboardItems: DashboardItem[] = [
    {
      id: 'processes',
      title: 'Procesy',
      description: 'Kafelki Procesowe do sprawdzania błędów',
      themeClass: 'blue',
      IconComponent: Icons.Processes,
    },
    {
      id: 'groups',
      title: 'Grupy',
      description: 'Tutaj włączamy i wyłączamy zabijanie aplikacji',
      themeClass: 'orange',
      IconComponent: Icons.Groups,
    },
    {
      id: 'products',
      title: 'Produkty',
      description: 'Wszystkie objekty/produkty w aplikacji',
      themeClass: 'teal',
      IconComponent: Icons.Products,
    },
  ];
    const navigate = useNavigate(); 

    const handleProcessClick = () => {
    navigate(`/admin/process-list`);
  };
  return (
    <div className="a-container">
      <header className="a-header">
        <h1>Panel Administratora</h1>
        <p>Wybierz moduł, aby rozpocząć pracę</p>
      </header>
      
      <div className="a-grid">
        {dashboardItems.map((item) => (
          <div key={item.id} className={`a-card a-${item.themeClass}`} onClick={() => handleProcessClick()} role="button" tabIndex={0}>
            <div className="a-icon-wrapper">
              <item.IconComponent />
            </div>
            <div className="a-content">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminMainPage;