import React from 'react';
import { useToast } from '../modals/ToastContext';

export const useSpeaFiles = () => {
  const { addToast } = useToast();

  const handleForceDownload = async (e: React.MouseEvent, url: string, filename: string) => {
    e.preventDefault();
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Błąd pobierania pliku");
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      addToast("Nie udało się pobrać pliku 😞", "error");
    }
  };

  const renderDownloadButton = (fileUrl: string | null, sn: string) => {
    if (!fileUrl) return null;
    const prettyFileName = `Raport_SPEA_${sn}.txt`;

    return (
      <a 
        href={fileUrl} 
        className="spea-btn-download"
        title="Pobierz plik diagnostyczny"
        onClick={(e) => handleForceDownload(e, fileUrl, prettyFileName)}
      >
        📄 Pobierz
      </a>
    );
  };

  return { renderDownloadButton };
};