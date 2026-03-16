import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import './DashboardGoldens.css';

// Rejestracja modułów Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

interface Stats {
  total_samples: number;
  out_of_date_samples: number;
  in_date: number;
  pass_type: number;
  fail_type: number;
  calib_type: number;
  testers: number;
  no_testers: number;
  highest_counter: number | null;
}

interface TopClient {
  id: number;
  name: string;
}

interface TopUser {
  id: number;
  first_name: string;
  last_name: string;
}

interface DashboardData {
  stats: Stats;
  top_client: TopClient | null;
  top_adding_user: TopUser | null;
}

const DashboardGoldens: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/golden-samples/statistics/')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="da-container">Ładowanie...</div>;
  if (!data) return <div className="da-container">Brak danych.</div>;

  // Konfiguracja wykresu
  const chartData = {
    labels: ['Pass', 'Fail', 'Calib'],
    datasets: [
      {
        data: [data.stats.pass_type, data.stats.fail_type, data.stats.calib_type],
        backgroundColor: ['#10b981', '#ef4444', '#3b82f6'],
        borderColor: '#ffffff',
        borderWidth: 4,
        hoverOffset: 10,
      },
    ],
  };

  const chartOptions = {
    cutout: '75%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: { size: 12 }
        },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="da-container">
      <header className="da-header">
        <div>
          <h1 className="da-title">Master Samples</h1>
        </div>
      </header>

      {/* Karty liczbowe */}
      <div className="da-stats-grid">
        <div className="da-card">
          <h2 className="da-card-title">Wszystkie sample</h2>
          <p className="da-card-value">{data.stats.total_samples}</p>
        </div>

        <div className="da-card da-card-red">
          <h2 className="da-card-title" style={{ color: '#ef4444' }}>Przeterminowane</h2>
          <p className="da-card-value" style={{ color: '#dc2626' }}>{data.stats.out_of_date_samples}</p>
        </div>

        <div className="da-card da-card-green">
          <h2 className="da-card-title" style={{ color: '#10b981' }}>Aktualne</h2>
          <p className="da-card-value" style={{ color: '#059669' }}>{data.stats.in_date}</p>
        </div>
      </div>

      <div className="da-tester-bar">
        <div className="da-tester-item">
          <span className="da-tester-label">Testery:</span>
          <span className="da-tester-value">{data.stats.testers}</span>
        </div>
        <div className="da-tester-divider"></div>
        <div className="da-tester-item">
          <span className="da-tester-label">Inne:</span>
          <span className="da-tester-value">{data.stats.no_testers}</span>
        </div>
      </div>

      {/* Grid główny: Wykres + Hala Sław */}
      <div className="da-main-grid">
        
        {/* Lewa kolumna: Wykres */}
        <div className="da-card">
          <h2 className="da-card-title" style={{ marginBottom: '1rem' }}>📊 Podział typów</h2>
          <div className="da-chart-wrapper">
            <div style={{ height: '250px' }}>
              <Doughnut data={chartData} options={chartOptions} />
            </div>
            <div className="da-chart-center-text">
              <span className="da-total-number"></span>
              <span className="da-total-label"></span>
            </div>
          </div>
        </div>

        {/* Prawa kolumna: Hala Sław */}
        <div className="da-card" style={{ borderTop: '1px solid #e5e7eb' }}>
          <h2 className="da-card-title" style={{ marginBottom: '1.5rem', color: '#1f2937' }}>🏆 Hala Sław</h2>
          <div className="da-hall-list">
            
            <div className="da-hall-item">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="da-icon-box">🏢</div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>Top Klient</p>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{data.top_client?.name ?? 'Brak danych'}</p>
                </div>
              </div>
            </div>

            <div className="da-hall-item">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="da-icon-box">👤</div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>Najaktywniejszy użytkownik</p>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>
                    {data.top_adding_user 
                      ? `${data.top_adding_user.first_name} ${data.top_adding_user.last_name}` 
                      : 'Brak danych'}
                  </p>
                </div>
              </div>
            </div>

            <div className="da-hall-item">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="da-icon-box">⏱️</div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>Najwięcej cykli sampla</p>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{data.stats.highest_counter ?? 0}</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardGoldens;