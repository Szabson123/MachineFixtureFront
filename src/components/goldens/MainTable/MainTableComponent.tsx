import React, { useCallback, useEffect, useRef, useState } from "react";
import "./MainTable.css";
import MasterSampleModal from "../Modals/MainModal";
import MasterSampleEditModal from "../Modals/MasterSampleEditModal";
import PdfGeneratorModal from "../Modals/PdfGeneratorModal";

import { useNavigate } from "react-router-dom";
import { getCSRFToken } from "../../../utils";

import { generateGoldenSamplePDF } from "./PdfGenerator";

type MasterSample = {
  id: number;
  project_name: string;
  sn: string;
  date_created: string;
  expire_date: string;
  pcb_rev_code: string;
  location: string;
  client: { id: number; name: string };
  process_name: { id: number; name: string };
  master_type: { id: number; name: string; color: string };
  created_by: { id: number; first_name: string; last_name: string };
  endcodes: { id: number; code: string }[];
  code_smd: { id: number; code: string }[];
  departament: { id: number; name: string; color: string };
  additional_project_name: { id: number; name: string } | null;
};

type PaginatedResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: MasterSample[];
};

type UserData = {
  first_name: string;
  last_name: string;
};

const FIELD_LABELS: Record<string, string> = {
  client: "klienta",
  process_name: "proces",
  master_type: "typ",
  additional_project_name: "dodatkową nazwę projektu",
};

const MasterSamplesTable: React.FC = () => {
  const [data, setData] = useState<MasterSample[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [ordering, setOrdering] = useState<string>("");
  const [editId, setEditId] = useState<number | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [filterValues, setFilterValues] = useState<{ id: number; name: string }[]>([]);
  const [contextField, setContextField] = useState<string | null>(null);
  const [filterLabels, setFilterLabels] = useState<{ [key: string]: { [id: number]: string } }>({});
  const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: number[] }>({});
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const listAbortRef = useRef<AbortController | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);

  const buildBaseUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.append("search", searchTerm);

    Object.entries(selectedFilters).forEach(([field, values]) => {
      if (values.length > 0) {
        params.append(field, values.join(","));
      }
    });

    if (ordering) params.append("ordering", ordering);

    return `/api/golden-samples/mastersamples/?${params.toString()}`;
  }, [searchTerm, selectedFilters, ordering]);

  const fetchPage = useCallback(
    async (url: string, append: boolean) => {
      try {
        listAbortRef.current?.abort();
        const ac = new AbortController();
        listAbortRef.current = ac;
        setIsLoading(true);

        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) throw new Error(await res.text());
        const json: PaginatedResponse = await res.json();
        setData((prev) => (append ? [...prev, ...json.results] : json.results));
        setTotalCount(json.count);
        setNextUrl(
          json.next
            ? new URL(json.next).pathname + new URL(json.next).search
            : null
        );
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Error fetching data:", err);
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/user/auth/me/", {
          credentials: "include",
        });
        if (res.ok) {
          const userData: UserData = await res.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const url = buildBaseUrl();
    setData([]);
    setNextUrl(null);
    fetchPage(url, false);
  }, [buildBaseUrl, fetchPage]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isLoading && nextUrl) {
          fetchPage(nextUrl, true);
        }
      },
      { root: document.querySelector(".table-scroll"), rootMargin: "200px", threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isLoading, nextUrl, fetchPage]);


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleContextMenu = (
    e: React.MouseEvent,
    field: string,
    endpoint: string
  ) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
    setContextField(field);

    setLoadingFilters(true);
    fetch(endpoint)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((json) => {
        setFilterValues(json);
        setFilterLabels((prev) => ({
          ...prev,
          [field]: json.reduce(
            (acc: { [id: number]: string }, item: { id: number; name: string }) => {
              acc[item.id] = item.name;
              return acc;
            },
            {}
          ),
        }));
      })
      .catch((err) => console.error("Error fetching filter values:", err))
      .finally(() => setLoadingFilters(false));
  };
const handleExportPDF = async (proces: string, produkt: string) => {
  setIsPdfModalOpen(false);
  try {
    setIsExporting(true);
    
    let url = buildBaseUrl();
    url = url.replace(/[?&]$/, "");
    const finalUrl = url.includes("?") 
      ? `${url}&no_pagination=true` 
      : `${url}?no_pagination=true`;

    const res = await fetch(finalUrl);
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Serwer zwrócił błąd ${res.status}: ${errorText}`);
    }

    const rawText = await res.text();
    console.log("Surowa odpowiedź z serwera (pierwsze 100 znaków):", rawText.substring(0, 100));

    let json;
    try {
      json = JSON.parse(rawText);
    } catch (e) {
      throw new Error("Serwer nie zwrócił poprawnego JSONa. Sprawdź zakładkę Network -> Response.");
    }

    let dataToExport = [];
    if (Array.isArray(json)) {
      dataToExport = json;
    } else if (json && json.results && Array.isArray(json.results)) {
      dataToExport = json.results;
    } else {
      console.error("Niespodziewana struktura JSON:", json);
      throw new Error("Struktura danych z API jest nieprawidłowa (brak listy rekordów).");
    }

    if (dataToExport.length === 0) {
      alert("Brak danych do wygenerowania PDF (lista jest pusta).");
      return;
    }

    // Wywołanie generatora
    generateGoldenSamplePDF(dataToExport, user, proces, produkt);

  } catch (err: any) {
    alert(`Błąd: ${err.message}`);
  } finally {
    setIsExporting(false);
  }
};

  const handleAddNewItem = async () => {
    if (!contextField || !newItemName.trim()) return;
    setIsAdding(true);

    const endpointMap: Record<string, string> = {
      client: "/api/golden-samples/mastersamples/client-name/",
      process_name: "/api/golden-samples/mastersamples/process-name/",
      master_type: "/api/golden-samples/mastersamples/type-name/",
      additional_project_name: "/api/golden-samples/mastersamples/additional-name/",
    };

    const endpoint = endpointMap[contextField];
    if (!endpoint) return;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": document.cookie.match(/csrftoken=([^;]+)/)?.[1] || "",
        },
        credentials: "include",
        body: JSON.stringify({ name: newItemName.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());

      setNewItemName("");
      setIsAddModalOpen(false);
      setContextMenu(null);

      const refetchRes = await fetch(endpoint);
      if (refetchRes.ok) {
        const json = await refetchRes.json();
        setFilterValues(json);
        setFilterLabels((prev) => ({
          ...prev,
          [contextField!]: json.reduce(
            (acc: { [id: number]: string }, item: { id: number; name: string }) => {
              acc[item.id] = item.name;
              return acc;
            },
            {}
          ),
        }));
      }
    } catch (err) {
      console.error("Błąd przy dodawaniu nowego elementu:", err);
    } finally {
      setIsAdding(false);
    }
  };

  const toggleFilter = (id: number) => {
    if (!contextField) return;
    setSelectedFilters((prev) => {
      const current = prev[contextField] || [];
      const exists = current.includes(id);
      const updated = {
        ...prev,
        [contextField]: exists ? current.filter((v) => v !== id) : [...current, id],
      };
      return updated;
    });
  };

  const removeFilter = (field: string, id: number) => {
    setSelectedFilters((prev) => {
      const updated = {
        ...prev,
        [field]: prev[field].filter((v) => v !== id),
      };
      if (updated[field].length === 0) {
        delete updated[field];
      }
      return updated;
    });
  };

  const handleSort = (field: string) => {
    let newOrder = field;
    if (ordering === field) {
      newOrder = "-" + field;
    } else if (ordering === "-" + field) {
      newOrder = "";
    }
    setOrdering(newOrder);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/user/auth/logout/", {
        method: "POST",
        credentials: "include",
        headers: {
          "X-CSRFToken": getCSRFToken() ?? "",
        },
      });
    } finally {
      setUser(null);
    }
  };

  return (
    <div className="all">
      <div className="table-container">
        <div 
          className="table-actions" 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginRight: 'auto' }}>
            {user ? (
              <div 
                onClick={handleLogout}
                title="Kliknij, aby wylogować"
                style={{ 
                  cursor: 'pointer', 
                  fontSize: '15px', 
                  color: '#333', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span>👋 Cześć, <strong>{user.first_name} {user.last_name}</strong></span>
                <span style={{ fontSize: '12px', color: '#888', marginLeft: '4px' }}>(Wyloguj)</span>
              </div>
            ) : (
              <button
                className="a-auth-btn"
                onClick={() => navigate("/login")}
                style={{ margin: 0 }}
              >
                Zaloguj
              </button>
            )}

             <div className="active-filters" style={{ marginLeft: '16px' }}>
                {Object.entries(selectedFilters).map(([field, values]) =>
                  values.map((id) => (
                    <span key={`${field}-${id}`} className="filter-tag">
                      {filterLabels[field]?.[id] || id}
                      <button
                        className="filter-remove"
                        onClick={() => removeFilter(field, id)}
                        title="Usuń filtr"
                      >
                        ✕
                      </button>
                    </span>
                  ))
                )}
              </div>
          </div>

          {/* PRAWA STRONA: Wyszukiwarka i Dodawanie */}
          <div style={{ display: "flex", gap: 8, alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', marginRight: '8px' }}>
              Wszystkich: {totalCount}
            </span>
            {user && (
              <button
                className="go-to-main-btn-blue"
                onClick={() => setIsPdfModalOpen(true)}
                disabled={isExporting}
                style={{ backgroundColor: isExporting ? '#ccc' : '#d2b6ff', border: 'none' }}
              >
                {isExporting ? "Generowanie..." : "📄 Generuj PDF"}
              </button>
            )}
            <input
              type="text"
              placeholder="Szukaj..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              className="px-4 py-2 bg-green-600 text-white rounded"
              onClick={() => setIsModalOpen(true)}
            >
              ➕ Dodaj Master Sample
            </button>
                        <button
              className="go-to-main-btn-blue"
              onClick={() => navigate("/goldens/dashboard")}
            >
              Statystyki
            </button>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th
                  className="table-title sortable"
                  onClick={() => handleSort("id")}
                >
                  ID {ordering === "id" && "↑"} {ordering === "-id" && "↓"}
                </th>
                <th
                  className="table-title sortable filterable"
                  onClick={() => handleSort("client__name")}
                  onContextMenu={(e) =>
                    handleContextMenu(
                      e,
                      "client",
                      "/api/golden-samples/mastersamples/client-name/"
                    )
                  }
                >
                  Klient ⚙ {ordering === "client__name" && "↑"}{" "}
                  {ordering === "-client__name" && "↓"}
                </th>
                <th
                  className="table-title sortable filterable"
                  onClick={() => handleSort("additional_project_name__name")}
                  onContextMenu={(e) =>
                    handleContextMenu(
                      e,
                      "additional_project_name",
                      "/api/golden-samples/mastersamples/additional-name/"
                    )
                  }
                >
                  Projekt ⚙ {ordering === "additional_project_name__name" && "↑"}
                  {ordering === "-additional_project_name__name" && "↓"}
                </th>
                <th
                  className="table-title sortable"
                  onClick={() => handleSort("project_name")}
                >
                  Nazwa {ordering === "project_name" && "↑"}{" "}
                  {ordering === "-project_name" && "↓"}
                </th>
                <th
                  className="table-title sortable"
                  onClick={() => handleSort("min_endcode")}
                >
                  Kod Końcowy {ordering === "min_endcode" && "↑"} {ordering === "-min_endcode" && "↓"}
                </th>
                <th
                  className="table-title sortable"
                  onClick={() => handleSort("min_smd_code")}
                >
                  Kod SMD {ordering === "min_smd_code" && "↑"} {ordering === "-min_smd_code" && "↓"}
                </th>
                <th
                  className="table-title sortable"
                  onClick={() => handleSort("process_name__name")}
                  onContextMenu={(e) =>
                    handleContextMenu(
                      e,
                      "process_name",
                      "/api/golden-samples/mastersamples/process-name/"
                    )
                  }
                >
                  Proces ⚙{ordering === "process_name__name" && "↑"}{" "}
                  {ordering === "-process_name__name" && "↓"}
                </th>
                <th
                  className="table-title sortable"
                  onClick={() => handleSort("sn")}
                >
                  SN {ordering === "sn" && "↑"} {ordering === "-sn" && "↓"}
                </th>
                <th
                  className="table-title sortable"
                  onClick={() => handleSort("master_type__name")}
                  onContextMenu={(e) =>
                    handleContextMenu(
                      e,
                      "master_type",
                      "/api/golden-samples/mastersamples/type-name/"
                    )
                  }
                >
                  Typ ⚙{ordering === "master_type__name" && "↑"}{" "}
                  {ordering === "-master_type__name" && "↓"}
                </th>
                <th
                  className="table-title sortable"
                  onClick={() => handleSort("location")}
                >
                  Lokalizacja {ordering === "location" && "↑"} {ordering === "-location" && "↓"}
                </th>
                <th
                  className="table-title sortable"
                  onClick={() => handleSort("date_created")}
                >
                  Data utworzenia {ordering === "date_created" && "↑"}{" "}
                  {ordering === "-date_created" && "↓"}
                </th>
                <th
                  className="table-title sortable"
                  onClick={() => handleSort("expire_date")}
                >
                  Data wygaśnięcia {ordering === "expire_date" && "↑"}{" "}
                  {ordering === "-expire_date" && "↓"}
                </th>
                <th
                  className="table-title sortable"
                  onClick={() => handleSort("pcb_rev_code")}
                >
                  PCB Rev {ordering === "pcb_rev_code" && "↑"}{" "}
                  {ordering === "-pcb_rev_code" && "↓"}
                </th>
                <th
                  className="table-title sortable"
                  onClick={() => handleSort("departament__name")}
                  onContextMenu={(e) =>
                    handleContextMenu(
                      e,
                      "departament",
                      "/api/golden-samples/mastersamples/departament-name/"
                    )
                  }
                >
                  Wydział ⚙{ordering === "departament__name" && "↑"}{" "}
                  {ordering === "-departament__name" && "↓"}
                </th>
                <th
                  className="table-title sortable"
                  onClick={() => handleSort("created_by__last_name")}
                >
                  Twórca {ordering === "created_by__last_name" && "↑"}{" "}
                  {ordering === "-created_by__last_name" && "↓"}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((sample) => (
                <tr
                  key={sample.id}
                  className="row-clickable"
                  onDoubleClick={() => setEditId(sample.id)}
                >
                  <td>{sample.id}</td>
                  <td>{sample.client?.name}</td>
                  <td className="highlighted">
                    {sample.additional_project_name ? (
                      <span>{sample.additional_project_name.name}</span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="highlighted">{sample.project_name}</td>
                  <td>
                    {sample.endcodes.map((e) => (
                      <div key={e.id}>{e.code}</div>
                    ))}
                  </td>
                  <td>
                    {sample.code_smd.map((c) => (
                      <div key={c.id}>{c.code}</div>
                    ))}
                  </td>
                  <td><span className="chip-process">{sample.process_name?.name}</span></td>
                  <td className="highlighted sn-cell" title={sample.sn}>
                    {sample.sn}
                  </td>
                  <td>
                    <span className="badge" style={{ backgroundColor: sample.master_type?.color }}>
                      {sample.master_type?.name}
                    </span>
                  </td>
                  <td>
                    {sample.location}
                  </td>
                  <td>{new Date(sample.date_created).toLocaleDateString("pl-PL",{year:"numeric",month:"2-digit",day:"2-digit"})}</td>
                  <td className="highlighted">
                    {new Date(sample.expire_date).toLocaleDateString("pl-PL",{year:"numeric",month:"2-digit",day:"2-digit"})}
                  </td>
                  <td>{sample.pcb_rev_code}</td>
                  <td>
                    <span className="badge" style={{ backgroundColor: sample.departament?.color }}>
                      {sample.departament?.name}
                    </span>
                  </td>
                  <td>{sample.created_by?.first_name} {sample.created_by?.last_name}</td>
                </tr>
              ))}

              {data.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={13} style={{ textAlign: "center", padding: "20px" }}>
                    Brak wyników
                  </td>
                </tr>
              )}

              {isLoading && (
                <tr>
                  <td colSpan={13} style={{ textAlign: "center", padding: "16px" }}>
                    Ładowanie...
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div ref={sentinelRef} style={{ height: 1 }} />
        </div>
      </div>

      <MasterSampleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          const url = buildBaseUrl();
          setData([]);
          setNextUrl(null);
          fetchPage(url, false);
        }}
      />

       <MasterSampleEditModal
        id={editId}
        isOpen={!!editId}
        onClose={() => setEditId(null)}
        onDeleteSuccess={() => {
          setEditId(null);
          const url = buildBaseUrl();
          setData([]);
          setNextUrl(null);
          fetchPage(url, false);

        }}
        onSuccess={(updatedRow) => {
          setData((prev) => prev.map((it) => (it.id === updatedRow.id ? { ...it, ...updatedRow } : it)));
        }}
      />
      <PdfGeneratorModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onGenerate={handleExportPDF}
      />

      {isAddModalOpen && (
        <div className="g-modal-overlay" aria-modal="true" role="dialog">
          <div className="g-submodal-content small">
            <div className="g-submodal-header">
              <h3 className="g-submodal-title">
                Dodaj nowy {FIELD_LABELS[contextField || ""] || contextField}
              </h3>
              <button
                className="g-modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="g-submodal-body">
              <input
                type="text"
                className="g-form-input"
                placeholder="Wpisz nazwę..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddNewItem();
                }}
                autoFocus
              />
            </div>
            <div className="g-submodal-actions">
              <button
                className="g-cancel-small"
                onClick={() => setIsAddModalOpen(false)}
              >
                Anuluj
              </button>
              <button
                className="g-save-small"
                onClick={handleAddNewItem}
                disabled={isAdding}
              >
                {isAdding ? "Zapisywanie..." : "Zapisz"}
              </button>
            </div>
          </div>
        </div>
      )}
      {contextMenu && (
        <div
          ref={menuRef}
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {loadingFilters ? (
            <div className="context-menu-loading">Ładowanie...</div>
          ) : (
           <>
            {["client", "process_name", "master_type", "additional_project_name"].includes(contextField || "") && (
              <>
                <button
                  className="context-add-btn"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  ➕ Dodaj nowy
                </button>
                <div className="context-separator" />
              </>
            )}

            {filterValues.map((val) => (
              <label key={val.id} className="context-menu-option">
                <input
                  type="checkbox"
                  checked={selectedFilters[contextField!]?.includes(val.id) || false}
                  onChange={() => toggleFilter(val.id)}
                />
                {val.name}
              </label>
            ))}
          </>
          )}
        </div>
      )}
    </div>
  );
};

export default MasterSamplesTable;