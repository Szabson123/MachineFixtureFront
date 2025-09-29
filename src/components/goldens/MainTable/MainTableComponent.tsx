import React, { useEffect, useState } from "react";
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

  const fetchData = (q: string = "", order: string = "") => {
  let url = `/api/golden-samples/mastersamples/?`;

  if (q) {
    url += q.startsWith("search=") ? q : `search=${q}`;
  }

  if (order) {
    url += `&ordering=${order}`;
  }

  fetch(url)
    .then((res) => res.json())
    .then((json: PaginatedResponse) => setData(json.results))
    .catch((err) => console.error("Error fetching data:", err));
};

  const handleContextMenu = (e: React.MouseEvent) => {
  e.preventDefault();
  setContextMenu({ x: e.clientX, y: e.clientY });

  fetch("/api/golden-samples/mastersamples/client-name/")
    .then((res) => res.json())
    .then((json) => setFilterValues(json))
    .catch((err) => console.error("Error fetching filter values:", err));
};

  const handleSort = (field: string) => {
  let newOrder = field;
  if (ordering === field) {
    newOrder = "-" + field;
  } else if (ordering === "-" + field) {
    newOrder = "";
  }
  setOrdering(newOrder);
  fetchData(searchTerm, newOrder);
};

  const applyFilter = (clientId: number) => {
    fetchData(`${searchTerm}&client=${clientId}`);
    setContextMenu(null);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchData(searchTerm);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  return (
    <div className="all">
      <div className="table-container">
        <div className="table-actions">
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
                <th className="table-title sortable" onClick={() => handleSort("id")}>
                  ID {ordering === "id" && "↑"} {ordering === "-id" && "↓"}
                </th>
                <th className="table-title sortable" onClick={() => handleSort("client__name")} onContextMenu={(e) => handleContextMenu(e)}>
                  Klient {ordering === "client__name" && "↑"} {ordering === "-client__name" && "↓"}
                </th>
                <th className="table-title sortable" onClick={() => handleSort("project_name")}>
                  Projekt {ordering == "project_name" && "↑"} {ordering == "-project_name" && "↓"}</th>
                <th className="table-title">Kod Końcowy</th>
                <th className="table-title">Kod SMD</th>
                <th className="table-title sortable" onClick={() => handleSort("process_name__name")}>
                  Proces {ordering === "process_name__name" && "↑"} {ordering === "-process_name__name" && "↓"}
                </th>
                <th className="table-title sortable" onClick={() => handleSort("sn")}>
                  SN {ordering === "sn" && "↑"} {ordering === "-sn" && "↓"}
                </th>
                <th className="table-title sortable" onClick={() => handleSort("master_type__name")}>
                  Typ {ordering === "master_type__name" && "↑"} {ordering === "-master_type__name" && "↓"}
                </th>
                <th className="table-title sortable" onClick={() => handleSort("date_created")}>
                  Data utworzenia {ordering === "date_created" && "↑"} {ordering === "-date_created" && "↓"}
                </th>
                <th className="table-title sortable" onClick={() => handleSort("expire_date")}>
                  Data wygaśnięcia {ordering === "expire_date" && "↑"} {ordering === "-expire_date" && "↓"}
                </th>
                <th className="table-title sortable" onClick={() => handleSort("pcb_rev_code")}>
                  PCB Rev {ordering === "pcb_rev_code" && "↑"} {ordering === "-pcb_rev_code" && "↓"}
                </th>
                <th className="table-title sortable" onClick={() => handleSort("department__name")}>
                  Wydział {ordering === "department__name" && "↑"} {ordering === "-department__name" && "↓"}
                </th>
                <th className="table-title sortable" onClick={() => handleSort("created_by__last_name")}>
                  Twórca {ordering == "created_by__last_name" && "↑"} {ordering === "-created_by__last_name" && "↓"}</th>
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
  <ul
    className="context-menu"
    style={{ top: contextMenu.y, left: contextMenu.x, position: "absolute" }}
  >
    {filterValues.map((val) => (
      <li key={val.id} onClick={() => applyFilter(val.id)}>
        {val.name}
      </li>
    ))}
  </ul>
)}
    </div>
  );
};

export default MasterSamplesTable;
