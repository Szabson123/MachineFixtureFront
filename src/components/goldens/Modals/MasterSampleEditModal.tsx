import React, { useEffect, useState } from "react";
import "./MainModal.css";

type Option = { id: number; name: string };

interface EditModalProps {
  id: number | null;
  isOpen: boolean;
  onClose: () => void;
  // dostaje odpowiedź z PATCH (format listy) i ma zaktualizować wiersz
  onSuccess: (updatedRow: any) => void;
}

const toNumberOrEmpty = (v: string) => (v === "" ? "" : Number(v));

// helper: z GET (różne możliwe formaty) wyciąga tablicę stringów
const normalizeCodes = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    if (value.length === 0) return [];
    if (typeof value[0] === "string") return value as string[];
    // czasem może przyjść [{id, code}] – mapujemy do code
    if (typeof value[0] === "object" && value[0]?.code) {
      return (value as any[]).map((x) => String(x.code));
    }
  }
  return [];
};

// helper: FKs z GET: może przyjść number lub {id, name}
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
}) => {
  const [clients, setClients] = useState<Option[]>([]);
  const [processes, setProcesses] = useState<Option[]>([]);
  const [departaments, setDepartaments] = useState<Option[]>([]);
  const [types, setTypes] = useState<Option[]>([]);

  // formularz
  const [client, setClient] = useState<number | "">("");
  const [processName, setProcessName] = useState<number | "">("");
  const [departament, setDepartament] = useState<number | "">("");
  const [masterType, setMasterType] = useState<number | "">("");
  const [createdBy, setCreatedBy] = useState<number | "">(""); // jeśli backend wymaga

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

  // Ładowanie słowników i danych rekordu
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

        // znormalizuj wartości z GET
        setClient(normalizeId(data.client));
        setProcessName(normalizeId(data.process_name));
        setDepartament(normalizeId(data.departament));
        setMasterType(normalizeId(data.master_type));
        setCreatedBy(normalizeId(data.created_by)); // jeżeli będzie zwracane

        setProjectName(data.project_name ?? "");
        setSn(data.sn ?? "");
        setExpireDate(data.expire_date ?? "2025-12-31");
        setPcbRevCode(data.pcb_rev_code ?? "R1");
        setDetails((data.details ?? "") || "");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: any = {
      // PATCH — wyślij po prostu bieżące wartości (możesz też różnicować zmienione pola)
      client,
      process_name: processName,
      departament,
      master_type: masterType,
      created_by: createdBy || null, // jeśli chcesz przepchnąć null
      project_name: projectName.trim(),
      sn: sn.trim(),
      expire_date: expireDate,
      pcb_rev_code: pcbRevCode.trim(),
      details: details.trim() || null,
      code_smd: buildCodes(codeSmd),
      endcodes: buildCodes(endcodes),
    };

    try {
      const res = await fetch(`/api/golden-samples/mastersamples/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const updatedListItem = await res.json(); // <- backend zwraca serializer listy
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
                  <select
                    className="g-form-select"
                    value={client}
                    onChange={(e) => setClient(toNumberOrEmpty(e.target.value))}
                  >
                    <option value="">-- Wybierz klienta --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={String(c.id)}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="g-form-group">
                  <label className="g-form-label">Proces</label>
                  <select
                    className="g-form-select"
                    value={processName}
                    onChange={(e) => setProcessName(toNumberOrEmpty(e.target.value))}
                  >
                    <option value="">-- Wybierz proces --</option>
                    {processes.map((p) => (
                      <option key={p.id} value={String(p.id)}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="g-form-group">
                  <label className="g-form-label">Wydział</label>
                  <select
                    className="g-form-select"
                    value={departament}
                    onChange={(e) => setDepartament(toNumberOrEmpty(e.target.value))}
                  >
                    <option value="">-- Wybierz wydział --</option>
                    {departaments.map((d) => (
                      <option key={d.id} value={String(d.id)}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="g-form-group">
                  <label className="g-form-label">Typ</label>
                  <select
                    className="g-form-select"
                    value={masterType}
                    onChange={(e) => setMasterType(toNumberOrEmpty(e.target.value))}
                  >
                    <option value="">-- Wybierz typ --</option>
                    {types.map((t) => (
                      <option key={t.id} value={String(t.id)}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="g-form-group">
                  <label className="g-form-label">Nazwa projektu</label>
                  <input
                    type="text"
                    className="g-form-input"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>

                <div className="g-form-group">
                  <label className="g-form-label">SN</label>
                  <input
                    type="text"
                    className="g-form-input"
                    value={sn}
                    onChange={(e) => setSn(e.target.value)}
                  />
                </div>

                <div className="g-form-group">
                  <label className="g-form-label">Data ważności</label>
                  <input
                    type="date"
                    className="g-form-input"
                    value={expireDate}
                    onChange={(e) => setExpireDate(e.target.value)}
                  />
                </div>

                <div className="g-form-group">
                  <label className="g-form-label">PCB Rev Code</label>
                  <input
                    type="text"
                    className="g-form-input"
                    value={pcbRevCode}
                    onChange={(e) => setPcbRevCode(e.target.value)}
                  />
                </div>

                <div className="g-form-group g-fullspan">
                  <label className="g-form-label">Szczegóły (details)</label>
                  <textarea
                    className="g-form-textarea"
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Opis / notatki do Master Sample"
                  />
                </div>

                <div className="g-form-group">
                  <label className="g-form-label">Code SMD</label>
                  <input
                    type="text"
                    className="g-form-input"
                    placeholder="np. 20415664, 20415666"
                    value={codeSmd}
                    onChange={(e) => setCodeSmd(e.target.value)}
                  />
                  <div className="g-form-hint">Kody SMD oddzielone przecinkami</div>
                </div>

                <div className="g-form-group">
                  <label className="g-form-label">Kody Końcowe</label>
                  <input
                    type="text"
                    className="g-form-input"
                    placeholder="np. 30415999, 30415998"
                    value={endcodes}
                    onChange={(e) => setEndcodes(e.target.value)}
                  />
                  <div className="g-form-hint">Endcodes oddzielone przecinkami</div>
                </div>
              </div>

              {error && <div style={{ color: "#c53030", marginTop: 8 }}>{error}</div>}

              <div className="g-modal-actions">
                <button type="button" className="g-cancel-btn" onClick={onClose} disabled={saving}>
                  Anuluj
                </button>
                <button type="submit" className="g-save-btn" disabled={saving}>
                  {saving ? "Zapisywanie..." : "Zapisz zmiany"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default MasterSampleEditModal;
