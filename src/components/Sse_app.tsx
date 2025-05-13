import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FixtureTable.css';

interface Fixture {
  id: number;
  name: string;
  counter_all: number;
  last_maint_date: string | null;
  counter_last_maint: number;
  limit_procent: number;
  cycles_limit: number;
}

const FixtureTable: React.FC = () => {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchFixtures = async () => {
    try {
      const ordering = sortField ? (sortDirection === 'asc' ? sortField : `-${sortField}`) : '';
      const res = await axios.get<Fixture[]>('/api/machine/get_info/', {
        params: { ordering, search: searchQuery },
      });
      setFixtures(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFixtures();

    const eventSource = new EventSource('/api/events/?channel=fixture-updates');
    eventSource.onmessage = () => fetchFixtures();

    return () => eventSource.close();
  }, [sortField, sortDirection, searchQuery]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getProgressBarClass = (percent: number): string => {
    if (percent > 90) return 'progress-red';
    if (percent > 70) return 'progress-yellow';
    return 'progress-green';
  };

  const handleResetCounter = async (fixtureId: number) => {
    const inputPassword = prompt('Podaj hasło do czyszczenia licznika:');
    if (!inputPassword) {
      alert('Hasło jest wymagane!');
      return;
    }

    try {
      const url = `/api/clear-counter/${fixtureId}/`;
      const res = await axios.post(
        url,
        { password: inputPassword },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res.status === 200) {
        alert('Licznik został wyczyszczony');
        fetchFixtures();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Błąd podczas czyszczenia licznika');
    }
  };

  const columns = [
    { label: 'Nazwa', field: 'name' },
    { label: 'Wszystkich', field: 'counter_all_value' },
    { label: 'Ostatni Przegląd', field: 'last_maint_date' },
    { label: 'Od przeglądu', field: 'counter_last_maint_value' },
    { label: 'Pasek Postępu', field: 'limit_procent' },
    { label: 'Przegląd', field: null },
  ];

  const getSortSymbol = (field: string) => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? ' 🔼' : ' 🔽';
  };

  return (
    <div className="fixture-table-container">
      <h1 className="table-title">Ilość Cykli Fixtur</h1>

      <input
        type="text"
        placeholder="Szukaj..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="search-input"
      />

      <div className="table-wrapper">
        <table className="fixtures-table">
          <thead>
            <tr>
              {columns.map(({ label, field }) => (
                <th
                  key={label}
                  onClick={() => field && handleSort(field)}
                  className={field ? 'sortable-header' : ''}
                >
                  {label}
                  {field && getSortSymbol(field)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fixtures.map((fixture) => (
              <tr key={fixture.id}>
                <td className="text-highlight">{fixture.name}</td>
                <td>{new Intl.NumberFormat().format(fixture.counter_all)}</td>
                <td>
                  {fixture.last_maint_date ? (
                    new Date(fixture.last_maint_date).toLocaleDateString('pl-PL')
                  ) : (
                    <span className="italic-muted">Nigdy nie wykonano przeglądu</span>
                  )}
                </td>
                <td>{new Intl.NumberFormat().format(fixture.counter_last_maint)}</td>
                <td>
                  <div className="progress-row">
                  <div
                      className="progress-container"
                      title={`Limit: ${fixture.counter_last_maint} / ${fixture.cycles_limit}`}
                    >
                      <div
                        className={`progress-bar ${getProgressBarClass(fixture.limit_procent)}`}
                        style={{ width: `${fixture.limit_procent}%` }}
                      />
                    </div>
                    <span className="progress-label">{fixture.limit_procent}%</span>
                  </div>
                </td>
                <td>
                  <button
                    className="button-reset"
                    onClick={() => handleResetCounter(fixture.id)}
                  >
                    Wyczyść licznik
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="footer-credit">Created by Szymon Żaba & Krzysztof Balcerzak</p>
    </div>
  );
};

export default FixtureTable;