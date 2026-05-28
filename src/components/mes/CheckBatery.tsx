import React, { useState, useEffect, useRef, FormEvent } from 'react';
import './CheckBatery.css';

interface BatteryStatus {
  sn: string;
  isSuccess: boolean;
}

export const CheckBattery: React.FC = () => {
  const [snInput, setSnInput] = useState<string>('');
  const [status, setStatus] = useState<BatteryStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!snInput.trim()) return;

    const currentSn = snInput.trim();
    setIsLoading(true);

    try {
      const response = await fetch('/mes/check-batery/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sn: currentSn }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus({
          sn: currentSn,
          isSuccess: true,
        });
      } else {
        setStatus({
          sn: currentSn,
          isSuccess: false,
        });
      }
    } catch (error) {
      setStatus({
        sn: currentSn,
        isSuccess: false,
      });
    } finally {
      setIsLoading(false);
      setSnInput('');
    }
  };

  return (
    <div className="battery-container">
      <div className="battery-card">
        <h2 className="battery-title">Sprawdź zgodność baterii</h2>
        
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={snInput}
            onChange={(e) => setSnInput(e.target.value)}
            placeholder="Wpisz lub zeskanuj SN..."
            disabled={isLoading}
            className="battery-input"
          />
          <button type="submit" className="battery-button" disabled={isLoading}>
            {isLoading ? 'Sprawdzanie...' : 'Zatwierdź'}
          </button>
        </form>

        {status && (
          <div className={`result-box ${status.isSuccess ? 'success' : 'error'}`}>
            <span className="sn-text">SN: {status.sn}</span>
            <div>{status.isSuccess ? 'Zgodna' : 'Nie Zgodna'}</div>
          </div>
        )}
      </div>
    </div>
  );
};