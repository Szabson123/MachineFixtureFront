import React, { useEffect, useState, useCallback } from "react";
import "./golden-list.css";
import AddGoldenModal from "./AddGoldenModal";
import EditGoldenModal from "./EditGoldenModal";
import AddVariantModal from "./AddVariantModal";

type Golden = {
  id: number;
  golden_code: string;
  expire_date: string;
  type_golden: string;
  counter?: number;
};

type Group = {
  id: number;
  name: string;
};

type Variant = {
  code: string;
  group: Group;
  name?: string;
  goldens: Golden[];
};

type ManagedGolden = {
  id: number;
  golden_code: string;
  expire_date: string;
  type_golden: string;
  counter: number;
  variant: {
    code: string;
    name: string;
  };
};

const GoldenList: React.FC = () => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [managedGoldens, setManagedGoldens] = useState<ManagedGolden[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingGolden, setEditingGolden] = useState<ManagedGolden | null>(null);
  const [showVariantModal, setShowVariantModal] = useState(false);

  const fetchData = useCallback(
    (term: string = "") => {
      const url = `/api/golden-samples/goldens-list${term ? `?search=${encodeURIComponent(term)}` : ""}`;
      fetch(url)
        .then((res) => res.json())
        .then((json: Variant[]) => {
          setVariants(json);
          if (selectedCode && !json.some((v) => v.code === selectedCode)) {
            setSelectedCode(null);
          }
        })
        .catch((err) => console.error("Błąd pobierania:", err));
    },
    [selectedCode]
  );

  const fetchManagedGoldens = useCallback(() => {
    fetch("/api/golden-samples/goldens/manage/")
      .then((res) => res.json())
      .then((json: ManagedGolden[]) => setManagedGoldens(json))
      .catch((err) => console.error("Błąd pobierania manage:", err));
  }, []);

  useEffect(() => {
    fetchData();
    fetchManagedGoldens();
  }, [fetchData, fetchManagedGoldens]);

  useEffect(() => {
    const id = setTimeout(() => fetchData(searchTerm), 300);
    return () => clearTimeout(id);
  }, [searchTerm, fetchData]);

  const getGoldenTypeStyle = (type: string) => {
    switch (type.toLowerCase()) {
      case "bad":
        return "bad";
      case "good":
        return "good";
      case "calib":
        return "calib";
      default:
        return "";
    }
  };

  const selectedGoldens = variants.find((v) => v.code === selectedCode)?.goldens ?? [];

  return (
    <div className="golden-app">
      <div className="dashboard">
        {/* PANEL 1 – Warianty */}
        <div className="panel">
          <div className="panel-header">
            <h3>Dostępne Warianty</h3>
            <button onClick={() => setShowVariantModal(true)} className="add-pattern-btn">
            ➕ Dodaj wariant
            </button>
          </div>
          <input
            className="search-input"
            placeholder="Szukaj wariantu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="list-container">
            {variants.map((variant) => (
              <div
                key={variant.code}
                className={`list-item ${selectedCode === variant.code ? "selected" : ""}`}
                onClick={() => setSelectedCode(variant.code)}
              >
                <div>
                  <span>
                    {variant.name ? `${variant.name}` : ""} -- {variant.code}
                  </span>
                </div>
                <span className="status blue">{variant.goldens.length} szt.</span>
              </div>
            ))}
          </div>
        </div>

        {/* PANEL 2 – Goldeny dla wybranego wariantu */}
        <div className="panel">
          <div className="panel-header">
            <h3>{selectedCode ? `Golden: ${selectedCode}` : "Goldeny"}</h3>
            <button
              onClick={() => {
                if (!selectedCode) {
                  alert("Najpierw wybierz wariant!");
                  return;
                }
                setShowModal(true);
              }}
              className="add-pattern-btn"
            >
              ➕ Dodaj
            </button>
          </div>
          <div className="list-container">
            {!selectedCode ? (
              <div className="empty-state centered-message">Wybierz wariant</div>
            ) : selectedGoldens.length === 0 ? (
              <div className="empty-state">Brak goldenów dla tego wariantu</div>
            ) : (
              selectedGoldens.map((golden) => (
                <div key={golden.id} className="list-item">
                  <div className="golden-code-container">
                    <span
                      className={`status-icon ${getGoldenTypeStyle(golden.type_golden)}`}
                      title={golden.type_golden}
                    />
                    <span className={`golden-code ${getGoldenTypeStyle(golden.type_golden)}`}>
                      {golden.golden_code}
                    </span>
                  </div>
                  <div className="expire-date">
                    <span>{new Date(golden.expire_date).toLocaleDateString()}</span>
                    {typeof golden.counter === "number" && (
                      <span className="counter-tag">{golden.counter}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PANEL 3 – Wszystkie goldeny z /manage/ */}
        <div className="panel">
          <div className="panel-header">
            <h3>Wszystkie Wzorce</h3>
          </div>
          <div className="list-container">
            {managedGoldens.map((golden) => (
              <div key={golden.id} className="list-item" onClick={() => setEditingGolden(golden)}>
                <div className="golden-code-container">
                  <span
                    className={`status-icon ${getGoldenTypeStyle(golden.type_golden)}`}
                    title={golden.type_golden}
                  />
                  <span className={`golden-code ${getGoldenTypeStyle(golden.type_golden)}`}>
                    {golden.golden_code}
                  </span>
                </div>
                <div className="expire-date">
                  <span>{new Date(golden.expire_date).toLocaleDateString()}</span>
                  <span className="counter-tag">{golden.counter}</span>
                </div>
              </div>
            ))}
            {managedGoldens.length === 0 && (
              <div className="empty-state">Brak danych</div>
            )}
          </div>
        </div>
      </div>

      {showModal && selectedCode && (
        <AddGoldenModal
          variantCode={selectedCode}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchData(searchTerm);
            fetchManagedGoldens();
          }}
        />
      )}

      {editingGolden && (
        <EditGoldenModal
          golden={editingGolden}
          onClose={() => setEditingGolden(null)}
          onSuccess={() => {
            setEditingGolden(null);
            fetchManagedGoldens();
          }}
        />
      )}

        {showVariantModal && (
          <AddVariantModal
            onClose={() => setShowVariantModal(false)}
            onSuccess={() => {
              setShowVariantModal(false);
              fetchData();
            }}
          />
        )}

      <div className="footer-creditt">
        Created by Krzysztof Balcerzak & Szymon Żaba
      </div>
    </div>
  );
};

export default GoldenList;
