import { Outlet } from 'react-router-dom';
import { ToastProvider } from './modals/ToastContext';
import { SpeaNavbar } from './SpeaNavBar';
import './SpeaStyles.css';
import { SpeaRefreshProvider } from './context/SpeaRefreshContext';

export const SpeaLayout = () => {
  return (
    <ToastProvider>
      <SpeaRefreshProvider>
        <div className="spea-layout-container">
          <SpeaNavbar />
          <div className="spea-content-area">
            <Outlet />
          </div>
        </div>
      </SpeaRefreshProvider>
    </ToastProvider>
  );
};