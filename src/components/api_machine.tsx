import axios from 'axios';
import { useState, useEffect } from 'react';

interface Machine {
  id: number;
  machine_id: string;
  machine_name: string;
}

const APIComponent = () => {
  const [data, setData] = useState<Machine[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios.get<Machine[]>('http://127.0.0.1:8000/machine/machine')
      .then(response => {
        setData(response.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Ładowanie danych...</div>;
  if (error) return <div className="error">Błąd: {error}</div>;
  if (!data || data.length === 0) return <div className="info">Brak dostępnych maszyn</div>;

  return (
    <div className="machine-container">
      <h1 className="header">Lista Maszyn</h1>
      <div className="machine-list">
        {data.map((machine) => (
          <div key={machine.id} className="machine-card">
            <h2>{machine.machine_name}</h2>
            <div className="machine-details">
              <p><span className="label">ID maszyny:</span> {machine.machine_id}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default APIComponent;