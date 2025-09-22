import React, { useEffect, useState, useCallback, useRef } from "react";
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

type Variant = {
  id: number;
  code: string;
  name?: string;
  group: number;
  golden_count: number;
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
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [selectedVariantCode, setSelectedVariantCode] = useState<string | null>(null);
  const [selectedGoldens, setSelectedGoldens] = useState<Golden[]>([]);
  const [managedGoldens, setManagedGoldens] = useState<ManagedGolden[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchSn, setSearchSn] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [editingGolden, setEditingGolden] = useState<ManagedGolden | null>(null);
  const [showVariantModal, setShowVariantModal] = useState(false);

  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const managedScrollRef = useRef<HTMLDivElement>(null);
  const hasFetchedRef = useRef(false);

  const fetchVariants = useCallback((term: string = "") => {
    const url = `/api/golden-samples/variant/${term ? `?search=${encodeURIComponent(term)}` : ""}`;
    fetch(url)
      .then((res) => res.json())
      .then((json: Variant[]) => {
        setVariants(json);
        if (
          selectedVariantId &&
          !json.some((v) => v.id === selectedVariantId)
        ) {
          setSelectedVariantId(null);
          setSelectedVariantCode(null);
          setSelectedGoldens([]);
        }
      })
      .catch((err) => console.error("Błąd pobierania wariantów:", err));
  }, [selectedVariantId]);

  const fetchInitialGoldens = useCallback(() => {
    fetch("/api/golden-samples/goldens/")
      .then((res) => res.json())
      .then((json) => {
        setManagedGoldens(json.results);
        if (json.next) {
          const parsedUrl = new URL(json.next);
          setNextPageUrl(parsedUrl.pathname + parsedUrl.search);
        } else {
          setNextPageUrl(null);
        }
      })
      .catch((err) => console.error("Błąd pobierania manage:", err));
  }, []);
  
  const fetchGoldensWithSearch = useCallback((searchValue: string) => {
    const url = `/api/golden-samples/goldens/?search=${encodeURIComponent(searchValue)}`;
    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        setManagedGoldens(json.results);
        if (json.next) {
          const parsedUrl = new URL(json.next);
          setNextPageUrl(parsedUrl.pathname + parsedUrl.search);
        } else {
          setNextPageUrl(null);
        }
      })
      .catch((err) => console.error("Błąd pobierania z filtrem:", err));
  }, []);
  
  const loadMoreGoldens = useCallback(() => {
    if (!nextPageUrl || loadingMore || hasFetchedRef.current) return;
  
    hasFetchedRef.current = true;
    setLoadingMore(true);
  
    const url = `${nextPageUrl}${searchSn ? `&search=${encodeURIComponent(searchSn)}` : ""}`;
  
    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        setManagedGoldens((prev) => [...prev, ...json.results]);
        if (json.next) {
          const parsedUrl = new URL(json.next);
          setNextPageUrl(parsedUrl.pathname + parsedUrl.search);
        } else {
          setNextPageUrl(null);
        }
      })
      .catch((err) => console.error("Błąd ładowania kolejnych goldenów:", err))
      .finally(() => {
        setLoadingMore(false);
        hasFetchedRef.current = false;
      });
  }, [nextPageUrl, loadingMore, searchSn]);

  const fetchGoldensForVariant = (variantId: number) => {
    fetch(`/api/golden-samples/${variantId}/goldens/`)
      .then((res) => res.json())
      .then((data: Golden[]) => setSelectedGoldens(data))
      .catch((err) => console.error("Błąd pobierania goldenów:", err));
  };

  useEffect(() => {
    const id = setTimeout(() => {
      fetchVariants(searchTerm);
      if (!searchSn) fetchInitialGoldens();
    }, 100);
    return () => clearTimeout(id);
  }, [searchTerm, fetchVariants, fetchInitialGoldens, searchSn]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (searchSn) fetchGoldensWithSearch(searchSn);
    }, 100);
    return () => clearTimeout(id);
  }, [searchSn, fetchGoldensWithSearch]);

  useEffect(() => {
    const container = managedScrollRef.current;
    if (!container) return;

    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const scrollBuffer = 1100;
        const bottomReached =
          container.scrollTop + container.clientHeight >= container.scrollHeight - scrollBuffer;

        if (bottomReached) {
          loadMoreGoldens();
        }
      }, 100);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [loadMoreGoldens]);

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

  const getExpireClass = (dateStr: string) => {
    const today = new Date();
    const expire = new Date(dateStr);
    const diff = (expire.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return "expired";
    if (diff <= 7) return "expiring-soon";
    return "";
  };

  return (
    <div className="golden-app">
      <div className="dashboard">
        {/* PANEL 1 – Warianty */}
        <div className="panel">
          <div className="panel-header">
            <h3>Kody końcowe</h3>
            <button onClick={() => setShowVariantModal(true)} className="add-pattern-btn">
              ➕ Kod końcowy
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
                key={variant.id}
                className={`list-item ${selectedVariantId === variant.id ? "selected" : ""}`}
                onClick={() => {
                  setSelectedVariantId(variant.id);
                  setSelectedVariantCode(variant.code);
                  fetchGoldensForVariant(variant.id);
                }}
              >
                <div>
                  <span>
                    {variant.name ? `${variant.name}` : ""} -- {variant.code}
                  </span>
                </div>
                <span className="status blue">{variant.golden_count} szt.</span>
              </div>
            ))}
          </div>
        </div>

        {/* PANEL 2 – Goldeny dla wybranego wariantu */}
        <div className="panel">
          <div className="panel-header">
            <h3>{selectedVariantCode ? `Wzorce dla: ${selectedVariantCode}` : "Wzorce"}</h3>
            <button
              onClick={() => {
                if (!selectedVariantId || !selectedVariantCode) {
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
            {!selectedVariantId ? (
              <div className="empty-state centered-message">Wybierz wariant</div>
            ) : selectedGoldens.length === 0 ? (
              <div className="empty-state">Brak wzorców dla tego wariantu</div>
            ) : (
              selectedGoldens.map((golden) => (
                <div
                  key={golden.id}
                  className="list-item"
                  onClick={() => setEditingGolden(golden as ManagedGolden)}
                >
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
                    <span className={getExpireClass(golden.expire_date)}>
                      {new Date(golden.expire_date).toLocaleDateString()}
                    </span>
                    {typeof golden.counter === "number" && (
                      <span className="counter-tag">{golden.counter}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PANEL 3 – Wszystkie goldeny */}
        <div className="panel">
          <div className="panel-header">
            <h3>Wszystkie Wzorce</h3>
          </div>
          <input
            className="search-input"
            placeholder="Szukaj po SN..."
            value={searchSn}
            onChange={(e) => setSearchSn(e.target.value)}
          />
          <div className="list-container" ref={managedScrollRef}>
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
                <div className={`expire-date ${getExpireClass(golden.expire_date)}`}>
                  <span>
                    {new Date(golden.expire_date).toLocaleDateString()}
                  </span>
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

      {showModal && selectedVariantCode && (
        <AddGoldenModal
          variantCode={selectedVariantCode}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            if (selectedVariantId) fetchGoldensForVariant(selectedVariantId);
            fetchInitialGoldens();
          }}
        />
      )}

      {editingGolden && (
        <EditGoldenModal
          golden={editingGolden}
          onClose={() => setEditingGolden(null)}
          onSuccess={() => {
            setEditingGolden(null);
            if (selectedVariantId) fetchGoldensForVariant(selectedVariantId);
            fetchInitialGoldens();
          }}
        />
      )}

      {showVariantModal && (
        <AddVariantModal
          onClose={() => setShowVariantModal(false)}
          onSuccess={() => {
            setShowVariantModal(false);
            fetchVariants();
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
