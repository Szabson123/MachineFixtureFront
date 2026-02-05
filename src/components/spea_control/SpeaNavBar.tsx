import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { SpeaAddModal } from './modals/SpeaAddModal';
import './SpeaStyles.css';

export const SpeaNavbar = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const getLinkClass = ({ isActive }: { isActive: boolean }) => 
    isActive ? "spea-nav-link active" : "spea-nav-link";

  return (
    <>
      <nav className="spea-navbar">
        
        <div className="spea-nav-links">
          <NavLink to="/spea/wardrobe" className={getLinkClass}>🚪 Szafa</NavLink>
          <NavLink to="/spea/in-company" className={getLinkClass}>🏢 W firmie</NavLink>
          <NavLink to="/spea/outside" className={getLinkClass}>🌍 Poza firmą</NavLink>
          <NavLink to="/spea/all" className={getLinkClass}>👁️ Wszystkie</NavLink>
        </div>
        <button 
          className="spea-btn spea-btn-add" 
          onClick={() => setIsAddModalOpen(true)}
        >
          + Dodaj Obiekt
        </button>

      </nav>
      <SpeaAddModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </>
  );
};