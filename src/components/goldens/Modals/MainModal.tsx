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

  const [samples, setSamples] = useState<Sample[]>([
    { sn: "", master_type: "" },
  ]);

  // Funkcja resetująca formularz
  const resetForm = () => {
    setClient("");
    setProcessName("");
    setDepartament("");
    setProjectName("");
    setExpireDate("2025-12-31");
    setPcbRevCode("R1");
    setCodeSmd("");
    setEndcodes("");
    setSamples([{ sn: "", master_type: "" }]);
  };

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/golden-samples/mastersamples/client-name/")
      .then((res) => res.json())
      .then(setClients);
    fetch("/api/golden-samples/mastersamples/process-name/")
      .then((res) => res.json())
      .then(setProcesses);
    fetch("/api/golden-samples/mastersamples/departament-name/")
      .then((res) => res.json())
      .then(setDepartaments);
    fetch("/api/golden-samples/mastersamples/type-name/")
      .then((res) => res.json())
      .then(setTypes);
  }, [isOpen]);

  if (!isOpen) return null;

  // obsługa dynamicznych samples
  const handleSampleChange = (index: number, field: keyof Sample, value: string | number) => {
    setSamples((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      )
    );
  };

  const addSample = () => {
    setSamples((prev) => [...prev, { sn: "", master_type: "" }]);
  };

  const removeSample = (index: number) => {
    setSamples((prev) => prev.filter((_, i) => i !== index));
  };

  // wysyłka
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      client,
      process_name: processName,
      departament,
      project_name: projectName,
      expire_date: expireDate,
      pcb_rev_code: pcbRevCode,
      code_smd: codeSmd.split(",").map((c) => c.trim()).filter(Boolean),
      endcodes: endcodes.split(",").map((c) => c.trim()).filter(Boolean),
      samples: samples
        .filter((s) => s.sn && s.master_type)
        .map((s) => ({
          sn: s.sn,
          master_type: s.master_type,
        })),
    };

    try {
      const response = await fetch("/api/golden-samples/mastersamples/create/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Błąd:", errorText);
        return;
      }

      // Resetuj formularz przed zamknięciem
      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Błąd połączenia:", err);
    }
  };

    const handleClose = () => {
    onClose();
    };

  return (
    <div className="g-modal-overlay">
      <div className="g-modal-content">
        <div className="g-modal-header-section">
          <h2 className="g-modal-title">Dodaj Master Sample</h2>
          <button className="g-modal-close-btn" onClick={handleClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="g-modal-form">
          <div className="g-form-grid">
            <div className="g-form-group">
              <label className="g-form-label">Klient</label>
              <select 
                className="g-form-select"
                value={client} 
                onChange={(e) => setClient(Number(e.target.value))} 
                required
              >
                <option value="">-- Wybierz klienta --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="g-form-group">
              <label className="g-form-label">Proces</label>
              <select 
                className="g-form-select"
                value={processName} 
                onChange={(e) => setProcessName(Number(e.target.value))} 
                required
              >
                <option value="">-- Wybierz proces --</option>
                {processes.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="g-form-group">
              <label className="g-form-label">Wydział</label>
              <select 
                className="g-form-select"
                value={departament} 
                onChange={(e) => setDepartament(Number(e.target.value))} 
                required
              >
                <option value="">-- Wybierz wydział --</option>
                {departaments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
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

            {/* Code SMD i Endcodes obok siebie */}
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

          <div className="g-samples-section">
            <div className="g-section-header">
              <h3 className="g-section-title">Samples</h3>
              <button type="button" className="g-add-sample-btn" onClick={addSample}>
                <span className="g-btn-icon">➕</span>
                Dodaj sample
              </button>
            </div>
            
            <div className="g-samples-list">
              {samples.map((sample, idx) => (
                <div key={idx} className="g-sample-row">
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
                      onChange={(e) => handleSampleChange(idx, "master_type", Number(e.target.value))}
                    >
                      <option value="">-- Wybierz typ --</option>
                      {types.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
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
              ))}
            </div>
          </div>

          <div className="g-modal-actions">
            <button type="button" className="g-cancel-btn" onClick={handleClose}>Anuluj</button>
            <button type="submit" className="g-save-btn">Zapisz Master Sample</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MasterSampleModal;