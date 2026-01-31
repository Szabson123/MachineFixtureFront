import React, { useEffect, useState } from "react";
import "./MainModal.css";
import { getCSRFToken } from "../../../utils";

type Option = { id: number; name: string };

interface EditModalProps {
  id: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedRow: any) => void;
  onDeleteSuccess?: (deletedId: number) => void; 
}

const toNumberOrEmpty = (v: string) => (v === "" ? "" : Number(v));

const normalizeCodes = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    if (value.length === 0) return [];
    if (typeof value[0] === "string") return value as string[];
    if (typeof value[0] === "object" && value[0]?.code) {
      return (value as any[]).map((x) => String(x.code));
    }
  }
  return [];
};

const normalizeId = (value: any): number | "" => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return value;
  if (typeof value === "object" && typeof value.id === "number") return value.id;
  return "";
};

const MasterSampleEditModal: React.FC<EditModalProps> = ({
  id,
  isOpen,
  onClose,
  onSuccess,
  onDeleteSuccess,
}) => {
  const [clients, setClients] = useState<Option[]>([]);
  const [processes, setProcesses] = useState<Option[]>([]);
  const [departaments, setDepartaments] = useState<Option[]>([]);
  const [types, setTypes] = useState<Option[]>([]);

  const [client, setClient] = useState<number | "">("");
  const [processName, setProcessName] = useState<number | "">("");
  const [departament, setDepartament] = useState<number | "">("");
  const [masterType, setMasterType] = useState<number | "">("");
  const [createdBy, setCreatedBy] = useState<number | "">("");

  const [projectName, setProjectName] = useState("");
  const [sn, setSn] = useState("");
  const [expireDate, setExpireDate] = useState("2025-12-31");
  const [pcbRevCode, setPcbRevCode] = useState("R1");
  const [details, setDetails] = useState("");

  const [codeSmd, setCodeSmd] = useState<string>("");
  const [endcodes, setEndcodes] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [loadingDicts, setLoadingDicts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [location, setLocation] = useState("");

  useEffect(() => {
    if (!isOpen || !id) return;
    setLoadingDicts(true);
    Promise.all([
      fetch("/api/golden-samples/mastersamples/client-name/").then(r => r.json()),
      fetch("/api/golden-samples/mastersamples/process-name/").then(r => r.json()),
      fetch("/api/golden-samples/mastersamples/departament-name/").then(r => r.json()),
      fetch("/api/golden-samples/mastersamples/type-name/").then(r => r.json()),
    ])
      .then(([c, p, d, t]) => {
        setClients(c); setProcesses(p); setDepartaments(d); setTypes(t);
      })
      .catch((e) => console.error("Dicts error:", e))
      .finally(() => setLoadingDicts(false));
  }, [isOpen, id]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !id) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/golden-samples/mastersamples/${id}/`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        setClient(normalizeId(data.client));
        setProcessName(normalizeId(data.process_name));
        setDepartament(normalizeId(data.departament));
        setMasterType(normalizeId(data.master_type));
        setCreatedBy(normalizeId(data.created_by));

        setProjectName(data.project_name ?? "");
        setSn(data.sn ?? "");
        setExpireDate(data.expire_date ?? "2025-12-31");
        setPcbRevCode(data.pcb_rev_code ?? "R1");
        setDetails((data.details ?? "") || "");

        setLocation((data.location ?? "") || "");

        const smd = normalizeCodes(data.code_smd);
        const end = normalizeCodes(data.endcodes);
        setCodeSmd(smd.join(", "));
        setEndcodes(end.join(", "));
      } catch (e: any) {
        console.error(e);
        setError("Nie udało się pobrać danych rekordu.");
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, id]);

  if (!isOpen || !id) return null;

  const buildCodes = (value: string) =>
    Array.from(new Set(value.split(",").map(s => s.trim()).filter(Boolean)));

  const handleDelete = async () => {
    if (!window.confirm("Czy na pewno chcesz trwale usunąć ten Master Sample? Operacji nie można cofnąć.")) {
      return;
    }

    setSaving(true);
    setError(null);
    const csrfToken = getCSRFToken();

    try {
      const res = await fetch(`/api/golden-samples/mastersamples/${id}/`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "X-CSRFToken": csrfToken || "",
        },
      });

      if (!res.ok) throw new Error(await res.text());

      if (onDeleteSuccess) {
        onDeleteSuccess(id);
      } else {
        onClose(); 
      }
    } catch (e: any) {
      console.error(e);
      setError("Nie udało się usunąć rekordu.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: any = {
      client,
      process_name: processName,
      departament,
      master_type: masterType,
      created_by: createdBy || null,
      project_name: projectName.trim(),
      sn: sn.trim(),
      expire_date: expireDate,
      pcb_rev_code: pcbRevCode.trim(),
      details: details.trim() || null,
      location: location.trim(),
      code_smd: buildCodes(codeSmd),
      endcodes: buildCodes(endcodes),
    };

    const csrfToken = getCSRFToken();
    if (!csrfToken) {
      setError("Brak CSRF tokena – odśwież stronę.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/golden-samples/mastersamples/${id}/`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      const updatedListItem = await res.json();
      onSuccess(updatedListItem);
      onClose();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Nie udało się zapisać zmian.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="g-modal-overlay" aria-modal="true" role="dialog">
      <div className="g-modal-content g-modal-wide">
        <div className="g-modal-header-section">
          <h2 className="g-modal-title">Edytuj Master Sample #{id}</h2>
          <button className="g-modal-close-btn" onClick={onClose} aria-label="Zamknij">×</button>
        </div>

        <form onSubmit={handleSubmit} className="g-modal-form">
          {loading || loadingDicts ? (
            <div>Ładowanie…</div>
          ) : (
            <>
              <div className="g-form-grid">
                <div className="g-form-group">
                  <label className="g-form-label">Klient</label>
                  <select className="g-form-select" value={client} onChange={(e) => setClient(toNumberOrEmpty(e.target.value))}>
                    <option value="">-- Wybierz klienta --</option>
                    {clients.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                  </select>
                </div>
                <div className="g-form-group">
                  <label className="g-form-label">Proces</label>
                  <select className="g-form-select" value={processName} onChange={(e) => setProcessName(toNumberOrEmpty(e.target.value))}>
                    <option value="">-- Wybierz proces --</option>
                    {processes.map((p) => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                  </select>
                </div>
                <div className="g-form-group">
                  <label className="g-form-label">Wydział</label>
                  <select className="g-form-select" value={departament} onChange={(e) => setDepartament(toNumberOrEmpty(e.target.value))}>
                    <option value="">-- Wybierz wydział --</option>
                    {departaments.map((d) => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
                  </select>
                </div>
                <div className="g-form-group">
                  <label className="g-form-label">Typ</label>
                  <select className="g-form-select" value={masterType} onChange={(e) => setMasterType(toNumberOrEmpty(e.target.value))}>
                    <option value="">-- Wybierz typ --</option>
                    {types.map((t) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
                  </select>
                </div>
                <div className="g-form-group">
                  <label className="g-form-label">Nazwa projektu</label>
                  <input type="text" className="g-form-input" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                </div>
                <div className="g-form-group">
                  <label className="g-form-label">SN</label>
                  <input type="text" className="g-form-input" value={sn} onChange={(e) => setSn(e.target.value)} />
                </div>
                <div className="g-form-group">
                  <label className="g-form-label">Data ważności</label>
                  <input type="date" className="g-form-input" value={expireDate} onChange={(e) => setExpireDate(e.target.value)} />
                </div>
                <div className="g-form-group">
                  <label className="g-form-label">PCB Rev Code</label>
                  <input type="text" className="g-form-input" value={pcbRevCode} onChange={(e) => setPcbRevCode(e.target.value)} />
                </div>
                <div className="g-form-group g-fullspan">
                  <label className="g-form-label">Szczegóły (details)</label>
                  <textarea className="g-form-textarea" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Opis / notatki do Master Sample" />
                </div>
                <div style={{ display: "flex", gap: "16px", gridColumn: "1 / -1" }}>
  
                {/* Code SMD */}
                <div className="g-form-group" style={{ flex: 1 }}>
                  <label className="g-form-label">Code SMD</label>
                  <input 
                    type="text" 
                    className="g-form-input" 
                    placeholder="np. 20415664..." 
                    value={codeSmd} 
                    onChange={(e) => setCodeSmd(e.target.value)} 
                  />
                  <div className="g-form-hint">Oddzielone przecinkami</div>
                </div>

                {/* Lokalizacja */}
                <div className="g-form-group" style={{ flex: 1 }}>
                  <label className="g-form-label">Lokalizacja</label>
                  <input 
                    type="text" 
                    className="g-form-input" 
                    placeholder="np. 5/1234" 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)} 
                  />
                </div>

                {/* Kody Końcowe */}
                <div className="g-form-group" style={{ flex: 1 }}>
                  <label className="g-form-label">Kody Końcowe</label>
                  <input 
                    type="text" 
                    className="g-form-input" 
                    placeholder="np. 30415999..." 
                    value={endcodes} 
                    onChange={(e) => setEndcodes(e.target.value)} 
                  />
                  <div className="g-form-hint">Oddzielone przecinkami</div>
                </div>

              </div>
              </div>

              {error && <div style={{ color: "#c53030", marginTop: 8 }}>{error}</div>}

              <div className="g-modal-actions" style={{ justifyContent: 'space-between', display: 'flex', gap: '10px' }}>

                <button 
                  type="button" 
                  className="g-delete-btn" 
                  onClick={handleDelete} 
                  disabled={saving}
                  title="Usuń ten rekord"
                >
                  <svg 
                    width="16" height="16" viewBox="0 0 24 24" 
                    fill="none" stroke="currentColor" strokeWidth="2" 
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ marginRight: 6 }}
                  >
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                  Usuń
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className="g-cancel-btn" onClick={onClose} disabled={saving}>
                    Anuluj
                  </button>
                  <button type="submit" className="g-save-btn" disabled={saving}>
                    {saving ? "Zapisywanie..." : "Zapisz zmiany"}
                  </button>
                </div>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default MasterSampleEditModal;