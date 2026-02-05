import { createContext, useContext, useState, ReactNode } from 'react';

interface SpeaRefreshContextType {
  refreshKey: number;
  triggerRefresh: () => void;
}

const SpeaRefreshContext = createContext<SpeaRefreshContextType | undefined>(undefined);

export const SpeaRefreshProvider = ({ children }: { children: ReactNode }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <SpeaRefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </SpeaRefreshContext.Provider>
  );
};

export const useSpeaRefresh = () => {
  const context = useContext(SpeaRefreshContext);
  if (!context) {
    throw new Error('useSpeaRefresh must be used within a SpeaRefreshProvider');
  }
  return context;
};