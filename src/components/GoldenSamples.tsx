import React, { useEffect, useState, useCallback, useRef } from "react";
import "./golden-list.css";
import { useNavigate } from "react-router-dom";

type MasterType = {
  id: number;
  name: string;
  color: string | null;
};

type Golden = {
  id: number;
  sn: string;
  master_type: MasterType;
  counter: number;
};

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

function useDebouncedValue<T>(value: T, delayMs = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

function normalizeNext(next: string | null): string | null {
  if (!next) return null;
  try {
    const u = new URL(next, window.location.origin);
    return `${u.pathname}${u.search}`;
  } catch {
    if (next.startsWith("/")) return next;
    return `/${next}`;
  }
}

const GoldenList: React.FC = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const [projectGoldens, setProjectGoldens] = useState<Golden[]>([]);
  const [allGoldens, setAllGoldens] = useState<Golden[]>([]);

  const [searchProject, setSearchProject] = useState("");
  const [searchSn, setSearchSn] = useState("");

  const debouncedProject = useDebouncedValue(searchProject, 350);
  const debouncedSn = useDebouncedValue(searchSn, 350);

  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const projectsAbortRef = useRef<AbortController | null>(null);
  const allAbortRef = useRef<AbortController | null>(null);
  const projectGoldensAbortRef = useRef<AbortController | null>(null);

  const loadMoreLockRef = useRef(false);

  const typeClass = useCallback((name: string) => {
    const n = name.toLowerCase();
    if (n.includes("dobry")) return "good";
    if (n.includes("kal")) return "calib";
    return "bad";
  }, []);

  const fetchJson = useCallback(async <T,>(url: string, controllerRef: React.MutableRefObject<AbortController | null>): Promise<T> => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, []);

  const fetchProjects = useCallback(async () => {
    const url = `/api/golden-samples/variant/${debouncedProject ? `?search=${encodeURIComponent(debouncedProject)}` : ""}`;
    try {
      const data = await fetchJson<string[]>(url, projectsAbortRef);
      setProjects(data);
      if (selectedProject && !data.includes(selectedProject)) {
        setSelectedProject(null);
        setProjectGoldens([]);
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") console.error("Błąd pobierania projektów:", e);
    }
  }, [debouncedProject, fetchJson, selectedProject]);

  const fetchGoldensByProject = useCallback(async (project: string) => {
    try {
      const url = `/api/golden-samples/goldens/${encodeURIComponent(project)}/`;
      const data = await fetchJson<Golden[]>(url, projectGoldensAbortRef);
      setProjectGoldens(data);
    } catch (e: any) {
      if (e?.name !== "AbortError") console.error("Błąd pobierania goldenów projektu:", e);
    }
  }, [fetchJson]);

  const fetchAllFirstPage = useCallback(async () => {
    const base = "/api/golden-samples/all/";
    const url = debouncedSn ? `${base}?search=${encodeURIComponent(debouncedSn)}` : base;

    try {
      const data = await fetchJson<PaginatedResponse<Golden>>(url, allAbortRef);
      setAllGoldens(data.results);
      setNextPageUrl(normalizeNext(data.next));
    } catch (e: any) {
      if (e?.name !== "AbortError") console.error("Błąd pobierania wszystkich goldenów:", e);
    }
  }, [debouncedSn, fetchJson]);

  const loadMore = useCallback(async () => {
    if (!nextPageUrl) return;
    if (loadingMore) return;
    if (loadMoreLockRef.current) return;

    loadMoreLockRef.current = true;
    setLoadingMore(true);

    try {
      const res = await fetch(nextPageUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PaginatedResponse<Golden> = await res.json();

      setAllGoldens(prev => [...prev, ...data.results]);
      setNextPageUrl(normalizeNext(data.next));
    } catch (e) {
      console.error("Błąd loadMore:", e);
    } finally {
      setLoadingMore(false);
      loadMoreLockRef.current = false;
    }
  }, [nextPageUrl, loadingMore]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchAllFirstPage();
  }, [fetchAllFirstPage]);

  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      entries => {
        const first = entries[0];
        if (first.isIntersecting) {
          if (nextPageUrl) loadMore();
        }
      },
      {
        root: null,
        rootMargin: "800px",
        threshold: 0.0,
      }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, nextPageUrl]);

  return (
    <div className="golden-app">
      <div className="dashboard">

        <div className="panel">
          <div className="panel-header">
            <h3>Projekty</h3>
          </div>

          <input
            className="search-input"
            placeholder="Szukaj projektu..."
            value={searchProject}
            onChange={(e) => setSearchProject(e.target.value)}
          />

          <div className="list-container">
            {projects.map(p => (
              <div
                key={p}
                className={`list-item ${p === selectedProject ? "selected" : ""}`}
                onClick={() => {
                  setSelectedProject(p);
                  fetchGoldensByProject(p);
                }}
              >
                <span>{p}</span>
              </div>
            ))}
            {projects.length === 0 && <div className="empty-state">Brak danych</div>}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>{selectedProject ? `Wzorce dla: ${selectedProject}` : "Wzorce"}</h3>
          </div>

          <div className="list-container">
            {!selectedProject ? (
              <div className="empty-state centered-message">Wybierz projekt</div>
            ) : projectGoldens.length === 0 ? (
              <div className="empty-state">Brak wzorców dla tego projektu</div>
            ) : (
              projectGoldens.map(g => (
                <div key={g.id} className="list-item">
                  <div className="golden-code-container">
                    <span className={`status-icon ${typeClass(g.master_type.name)}`} title={g.master_type.name} />
                    <span className={`golden-code ${typeClass(g.master_type.name)}`}>{g.sn}</span>
                  </div>
                  <div className="expire-date">
                    <span className="counter-tag">{g.counter}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="panel">
          <div className="panel-header">
            <h3>Wszystkie Wzorce</h3>
            <button
              className="go-to-main-btn"
              onClick={() => navigate("/goldens/main-table")}
            >
              Szczegóły
            </button>
          </div>

          <input
            className="search-input"
            placeholder="Szukaj po SN..."
            value={searchSn}
            onChange={(e) => setSearchSn(e.target.value)}
          />

          <div className="list-container">
            {allGoldens.map(g => (
              <div key={g.id} className="list-item">
                <div className="golden-code-container">
                  <span className={`status-icon ${typeClass(g.master_type.name)}`} title={g.master_type.name} />
                  <span className={`golden-code ${typeClass(g.master_type.name)}`}>{g.sn}</span>
                </div>
                <div className="expire-date">
                  <span className="counter-tag">{g.counter}</span>
                </div>
              </div>
            ))}

            {allGoldens.length === 0 && <div className="empty-state">Brak danych</div>}

            <div ref={bottomRef} style={{ height: 1 }} />

            {loadingMore && <div className="empty-state">Ładowanie...</div>}
          </div>
        </div>
      </div>

      <div className="footer-creditt">
        Created by Krzysztof Balcerzak &amp; Szymon Żaba
      </div>
    </div>
  );
};

export default GoldenList;
