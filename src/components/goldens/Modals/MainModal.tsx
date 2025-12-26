import React, { useEffect, useState } from "react";
import "./MainModal.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Option = { id: number; name: string };

type Sample = {
  sn: string;
  master_type: number | "";
  details?: string;        // opis próbki (opcjonalny)
  _uid?: string;           // lokalny klucz do UI
};

const toNumberOrEmpty = (v: string) => (v === "" ? "" : Number(v));
const uid = () => Math.random().toString(36).slice(2, 9);

/** Mini-modal do edycji opisu pojedyńczej próbki */
const SampleDetailsModal: React.FC<{
  isOpen: boolean;
  title?: string;
  initial: string;
  onSave: (text: string) => void;
  onClose: () => void;
}> = ({ isOpen, title = "Opis próbki", initial, onSave, onClose }) => {
  const [text, setText] = useState(initial);

  useEffect(() => {
    if (!isOpen) return;
    setText(initial);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, initial, onClose]);

  if (!isOpen) return null;

  const handleSave = () => onSave(text.trim());

  return (
    <div className="g-modal-overlay" aria-modal="true" role="dialog">
      <div className="g-submodal-content">
        <div className="g-submodal-header">
          <h3 className="g-submodal-title">{title}</h3>
          <button className="g-modal-close-btn" onClick={onClose} aria-label="Zamknij">×</button>
        </div>
        <div className="g-submodal-body">
          <textarea
            className="g-details-textarea"
            placeholder="Wklej/napisz opis próbki. Enter = zapisz i zamknij, Shift+Enter = nowa linia."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSave();
              }
            }}
            rows={10}
            autoFocus
          />
        </div>
        <div className="g-submodal-actions">
          <button className="g-cancel-small" type="button" onClick={onClose}>Anuluj</button>
          <button className="g-save-small" type="button" onClick={handleSave}>Zapisz</button>
        </div>
      </div>
    </div>
  );
};

const MasterSampleModal: React.FC<ModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [clients, setClients] = useState<Option[]>([]);
  const [processes, setProcesses] = useState<Option[]>([]);
  const [departaments, setDepartaments] = useState<Option[]>([]);
  const [types, setTypes] = useState<Option[]>([]);

  const [client, setClient] = useState<number | "">("");
  const [processName, setProcessName] = useState<number | "">("");
  const [departament, setDepartament] = useState<number | "">("");

  const [projectName, setProjectName] = useState<string>("");
  const [expireDate, setExpireDate] = useState<string>("2025-12-31");
  const [pcbRevCode, setPcbRevCode] = useState<string>("R1");
  const [codeSmd, setCodeSmd] = useState<string>("");
  const [endcodes, setEndcodes] = useState<string>("");

  // Top-level details (pozostaje)
  const [globalDetails, setGlobalDetails] = useState<string>("");

  const [samples, setSamples] = useState<Sample[]>([
    { sn: "", master_type: "", details: "", _uid: uid() },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // stan mini-modala per-sample
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  const resetForm = () => {
    setClient("");
    setProcessName("");
    setDepartament("");
    setProjectName("");
    setExpireDate("2025-12-31");
    setPcbRevCode("R1");
    setCodeSmd("");
    setEndcodes("");
    setGlobalDetails("");
    setSamples([{ sn: "", master_type: "", details: "", _uid: uid() }]);
    setSubmitError(null);
    setEditingIdx(null);
  };

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    document.addEventListener("keydown", onKey);

    (async () => {
      try {
        const [c, p, d, t] = await Promise.all([
          fetch("/api/golden-samples/mastersamples/client-name/").then(async r => {
            if (!r.ok) throw new Error(await r.text());
            return r.json();
          }),
          fetch("/api/golden-samples/mastersamples/process-name/").then(async r => {
            if (!r.ok) throw new Error(await r.text());
            return r.json();
          }),
          fetch("/api/golden-samples/mastersamples/departament-name/").then(async r => {
            if (!r.ok) throw new Error(await r.text());
            return r.json();
          }),
          fetch("/api/golden-samples/mastersamples/type-name/").then(async r => {
            if (!r.ok) throw new Error(await r.text());
            return r.json();
          }),
        ]);
        setClients(c);
        setProcesses(p);
        setDepartaments(d);
        setTypes(t);
      } catch (e) {
        console.error("Błąd ładowania słowników:", e);
      }
    })();

    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSampleChange = <K extends keyof Sample>(index: number, field: K, value: Sample[K]) => {
    setSamples((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const addSample = () => {
    setSamples((prev) => [...prev, { sn: "", master_type: "", details: "", _uid: uid() }]);
  };

  const removeSample = (index: number) => {
    setSamples((prev) => prev.filter((_, i) => i !== index));
  };

  const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    const samplesPayload = samples
      .map((s) => ({
        sn: s.sn.trim(),
        master_type: s.master_type,
        ...(s.details && s.details.trim() ? { details: s.details.trim() } : {}),
      }))
      .filter((s) => s.sn !== "" && s.master_type !== "");

    const payload = {
      client,
      process_name: processName,
      departament,
      project_name: projectName.trim(),
      expire_date: expireDate,
      pcb_rev_code: pcbRevCode.trim(),
      details: globalDetails.trim() || undefined, // top-level details (opcjonalne)
      code_smd: uniq(codeSmd.split(",").map((c) => c.trim()).filter(Boolean)),
      endcodes: uniq(endcodes.split(",").map((c) => c.trim()).filter(Boolean)),
      samples: samplesPayload,
    };

    try {
        const response = await fetch("/api/golden-samples/mastersamples/create/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": document.cookie.match(/csrftoken=([^;]+)/)?.[1] || "",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });

      if (!response.ok) {
        const errorText = await response.text();
        setSubmitError(errorText || "Nie udało się zapisać.");
        console.error("Błąd:", errorText);
        return;
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("Błąd połączenia:", err);
        setSubmitError("Błąd połączenia z serwerem.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="g-modal-overlay" aria-modal="true" role="dialog">
      <div className="g-modal-content">
        <div className="g-modal-header-section">
          <h2 className="g-modal-title">Dodaj Master Sample</h2>
          <button className="g-modal-close-btn" onClick={handleClose} aria-label="Zamknij">×</button>
        </div>

        <form onSubmit={handleSubmit} className="g-modal-form">
          <div className="g-form-grid">
            <div className="g-form-group">
              <label className="g-form-label">Klient</label>
              <select
                className="g-form-select"
                value={client}
                onChange={(e) => setClient(toNumberOrEmpty(e.target.value))}
                required
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
                required
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
                required
              >
                <option value="">-- Wybierz wydział --</option>
                {departaments.map((d) => (
                  <option key={d.id} value={String(d.id)}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="g-form-group">
              <label className="g-form-label">Nazwa projektu</label>
              <input
                type="text"
                className="g-form-input"
                placeholder="Wprowadź nazwę projektu"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
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
                placeholder="Wprowadź kod PCB"
                value={pcbRevCode}
                onChange={(e) => setPcbRevCode(e.target.value)}
              />
            </div>

            {/* Code SMD / Endcodes */}
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

          {/* Samples */}
          <div className="g-samples-section">
            <div className="g-section-header">
              <h3 className="g-section-title">Samples</h3>
              <button type="button" className="g-add-sample-btn" onClick={addSample}>
                <span className="g-btn-icon">➕</span>
                Dodaj sample
              </button>
            </div>

            <div className="g-samples-list">
              {samples.map((sample, idx) => {
                const hasDetails = !!(sample.details && sample.details.trim());
                return (
                  <div key={sample._uid ?? idx} className="g-sample-row">
                    <div className="g-sample-inputs">
                      <input
                        type="text"
                        className="g-form-input"
                        placeholder="Serial Number (SN)"
                        value={sample.sn}
                        onChange={(e) => handleSampleChange(idx, "sn", e.target.value)}
                      />
                      <select
                        className="g-form-select"
                        value={sample.master_type}
                        onChange={(e) => handleSampleChange(idx, "master_type", toNumberOrEmpty(e.target.value))}
                      >
                        <option value="">-- Wybierz typ --</option>
                        {types.map((t) => (
                          <option key={t.id} value={String(t.id)}>{t.name}</option>
                        ))}
                      </select>

                      {/* Przycisk otwierający osobny modal opisu */}
                      <button
                        type="button"
                        className="g-details-btn"
                        onClick={() => setEditingIdx(idx)}
                        title={hasDetails ? "Edytuj opis próbki" : "Dodaj opis próbki"}
                      >
                        📝 {hasDetails && <span className="g-details-dot" aria-label="opis dodany" />}
                      </button>

                      {samples.length > 1 && (
                        <button
                          type="button"
                          className="g-remove-sample-btn"
                          onClick={() => removeSample(idx)}
                        >
                          ❌ Usuń
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {submitError && (
            <div style={{ color: "#c53030", marginBottom: 12 }}>
              {submitError}
            </div>
          )}

          <div className="g-modal-actions">
            <button type="button" className="g-cancel-btn" onClick={handleClose} disabled={isSubmitting}>
              Anuluj
            </button>
            <button type="submit" className="g-save-btn" disabled={isSubmitting}>
              {isSubmitting ? "Zapisywanie..." : "Zapisz Master Sample"}
            </button>
          </div>
        </form>
      </div>

      {editingIdx !== null && (
        <SampleDetailsModal
          isOpen={true}
          initial={samples[editingIdx]?.details ?? ""}
          title={`Opis próbki #${editingIdx + 1}${samples[editingIdx]?.sn ? ` (SN: ${samples[editingIdx].sn})` : ""}`}
          onSave={(text) => {
            handleSampleChange(editingIdx, "details", text);
            setEditingIdx(null);
          }}
          onClose={() => setEditingIdx(null)}
        />
      )}
    </div>
  );
};

export default MasterSampleModal;
