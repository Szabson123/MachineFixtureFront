import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FixtureTable.css';

const FixtureTable = () => {
  const [fixtures, setFixtures] = useState([]);
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFixtures = async () => {
    try {
      const ordering = sortField ? (sortDirection === 'asc' ? sortField : `-${sortField}`) : '';
      const res = await axios.get('http://127.0.0.1:8000/api/machine/get_info/', {
        params: {
          ordering,
          search: searchQuery
        }
      });
      setFixtures(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFixtures();

    const eventSource = new EventSource('http://127.0.0.1:8000/api/events/?channel=fixture-updates');
    eventSource.onmessage = () => fetchFixtures();

    return () => eventSource.close();
  }, [sortField, sortDirection, searchQuery]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getProgressBarClass = (percent) => {
    if (percent > 90) return 'progress-red';
    if (percent > 70) return 'progress-yellow';
    return 'progress-green';
  };

  const handleResetCounter = async (fixtureId) => {
    const inputPassword = prompt('Podaj hasło do czyszczenia licznika:');
    if (!inputPassword) {
      alert('Hasło jest wymagane!');
      return;
    }

    try {
      const url = `http://127.0.0.1:8000/api/clear-counter/${fixtureId}/`;
      const res = await axios.post(url, { password: inputPassword }, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.status === 200) {
        alert('Licznik został wyczyszczony');
        fetchFixtures();
      }
    } catch (err) {
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

  const getSortSymbol = (field) => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? ' 🔼' : ' 🔽';
  };

  return (
    <div className="fixture-table-container">
      <h1 className="table-title">Ilość Cykli Fixtur</h1>

      {/* 🔍 Search bar */}
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
                  {label}{field && getSortSymbol(field)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fixtures.map((fixture, idx) => {
              const limitPercent = fixture.limit_procent ?? 0;

              return (
                <tr key={idx}>
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
                      <div className="progress-container">
                        <div
                          className={`progress-bar ${getProgressBarClass(limitPercent)}`}
                          style={{ width: `${limitPercent}%` }}
                        />
                      </div>
                      <span className="progress-label">{limitPercent}%</span>
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FixtureTable;
