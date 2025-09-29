import React, { useEffect, useRef, useState } from "react";
import "./MainTable.css";

type MasterSample = {
  id: number;
  project_name: string;
  sn: string;
  date_created: string;
  expire_date: string;
  pcb_rev_code: string;
  client: { id: number; name: string };
  process_name: { id: number; name: string };
  master_type: { id: number; name: string; color: string };
  created_by: { id: number; first_name: string; last_name: string };
  endcodes: { id: number; code: string }[];
  code_smd: { id: number; code: string }[];
  departament: { id: number; name: string; color: string };
};

type PaginatedResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: MasterSample[];
};

const MasterSamplesTable: React.FC = () => {
  const [data, setData] = useState<MasterSample[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [ordering, setOrdering] = useState<string>("");

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [filterValues, setFilterValues] = useState<{ id: number; name: string }[]>([]);
  const [contextField, setContextField] = useState<string | null>(null);
  const [filterLabels, setFilterLabels] = useState<{[key: string]: { [id: number]: string };}>({});
  const [selectedFilters, setSelectedFilters] = useState<{[key: string]: number[];}>({});
  const [loadingFilters, setLoadingFilters] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const fetchData = (filters = selectedFilters, order = ordering) => {
    const params = new URLSearchParams();

    if (searchTerm) {
      params.append("search", searchTerm);
    }

    Object.entries(filters).forEach(([field, values]) => {
      if (values.length > 0) {
        params.append(`${field}`, values.join(","));
      }
    });

    if (order) {
      params.append("ordering", order);
    }

    const url = `/api/golden-samples/mastersamples/?${params.toString()}`;

    fetch(url)
      .then((res) => res.json())
      .then((json: PaginatedResponse) => setData(json.results))
      .catch((err) => console.error("Error fetching data:", err));
  };

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
      .then((res) => res.json())
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

  const toggleFilter = (id: number) => {
    if (!contextField) return;

    setSelectedFilters((prev) => {
      const current = prev[contextField] || [];
      const exists = current.includes(id);
      return {
        ...prev,
        [contextField]: exists
          ? current.filter((v) => v !== id)
          : [...current, id],
      };
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    fetchData();
  }, [selectedFilters, ordering]);

  return (
    <div className="all">
      <div className="table-container">
        <div className="table-actions">
          <div className="active-filters">
            {Object.entries(selectedFilters).map(([field, values]) =>
              values.map((id) => (
                <span key={`${field}-${id}`} className="filter-tag">
                  {filterLabels[field]?.[id] || id}
                  <button
                    className="filter-remove"
                    onClick={() => removeFilter(field, id)}
                  >
                    ✕
                  </button>
                </span>
              ))
            )}
          </div>

          <input
            type="text"
            placeholder="Szukaj..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
                  className="table-title sortable"
                  onClick={() => handleSort("client__name")}
                  onContextMenu={(e) =>
                    handleContextMenu(
                      e,
                      "client",
                      "/api/golden-samples/mastersamples/client-name/"
                    )
                  }
                >
                  Klient {ordering === "client__name" && "↑"}{" "}
                  {ordering === "-client__name" && "↓"}
                </th>
                <th
                  className="table-title sortable"
                  onClick={() => handleSort("project_name")}
                >
                  Projekt {ordering === "project_name" && "↑"}{" "}
                  {ordering === "-project_name" && "↓"}
                </th>
                <th className="table-title">Kod Końcowy</th>
                <th className="table-title">Kod SMD</th>
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
                  Proces {ordering === "process_name__name" && "↑"}{" "}
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
                  Typ {ordering === "master_type__name" && "↑"}{" "}
                  {ordering === "-master_type__name" && "↓"}
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
                  Wydział {ordering === "departament__name" && "↑"}{" "}
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
                <tr key={sample.id}>
                  <td>{sample.id}</td>
                  <td>{sample.client?.name}</td>
                  <td className="highlighted">{sample.project_name}</td>
                  <td>{sample.endcodes.map((e) => e.code).join(", ")}</td>
                  <td>
                    {sample.code_smd.map((c) => (
                      <div key={c.id}>{c.code}</div>
                    ))}
                  </td>
                  <td>
                    <span className="testtest">{sample.process_name?.name}</span>
                  </td>
                  <td className="highlighted">{sample.sn}</td>
                  <td>
                    <span
                      className="badge"
                      style={{ backgroundColor: sample.master_type?.color }}
                    >
                      {sample.master_type?.name}
                    </span>
                  </td>
                  <td>
                    {new Date(sample.date_created).toLocaleDateString("pl-PL", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </td>
                  <td className="highlighted">
                    {new Date(sample.expire_date).toLocaleDateString("pl-PL", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </td>
                  <td>{sample.pcb_rev_code}</td>
                  <td>
                    <span
                      className="badge"
                      style={{ backgroundColor: sample.departament?.color }}
                    >
                      {sample.departament?.name}
                    </span>
                  </td>
                  <td>
                    {sample.created_by?.first_name} {sample.created_by?.last_name}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={13} style={{ textAlign: "center", padding: "20px" }}>
                    Brak wyników
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
              {filterValues.map((val) => (
                <label key={val.id} className="context-menu-option">
                  <input
                    type="checkbox"
                    checked={
                      selectedFilters[contextField!]?.includes(val.id) || false
                    }
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
