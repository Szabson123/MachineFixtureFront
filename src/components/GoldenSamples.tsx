import React, { useEffect, useState, useCallback } from "react";
import "./golden-list.css";
import AddGoldenModal from "./AddGoldenModal";

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

const GoldenList: React.FC = () => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const id = setTimeout(() => fetchData(searchTerm));
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
  const selectedGoldens =
    variants.find((v) => v.code === selectedCode)?.goldens ?? [];
  return (
    <div className="golden-app">
      <div className="toolbar">
      <button onClick={() => setShowModal(true)} className="add-pattern-btn">
        Dodaj nowy wzorzec
      </button>
      </div>

      <div className="dashboard">
        <div className="panel">
          <div className="panel-header">
            <h3>Dostępne Warianty</h3>
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
                className={`list-item ${
                  selectedCode === variant.code ? "selected" : ""
                }`}
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
        <div className="panel">
          <div className="panel-header">
            <h3>
              {selectedCode ? `Goldeny: ${selectedCode}` : "Wybierz wariant"}
            </h3>
          </div>
          <div className="list-container">
            {selectedGoldens.map((golden) => (
              <div key={golden.id} className="list-item">
                <div className="golden-code-container">
                  <span
                    className={`status-icon ${getGoldenTypeStyle(
                      golden.type_golden
                    )}`}
                    title={golden.type_golden}
                  />
                  <span
                    className={`golden-code ${getGoldenTypeStyle(
                      golden.type_golden
                    )}`}
                  >
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
            ))}

            {selectedCode && selectedGoldens.length === 0 && (
              <div className="empty-state">
                Brak goldenów dla tego wariantu
              </div>
            )}
          </div>
        </div>
      </div>
      {showModal && (
        <AddGoldenModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchData(searchTerm);
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
