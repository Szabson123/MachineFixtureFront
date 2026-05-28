import React, { useState, useEffect } from "react";

export type Subobject = {
  msn: string;
  desc: string;
  _uid?: string;
};

interface SubobjectsModalProps {
  isOpen: boolean;
  initial: Subobject[];
  onSave: (subobjects: Subobject[]) => void;
  onClose: () => void;
  title?: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const SampleSubobjectsModal: React.FC<SubobjectsModalProps> = ({
  isOpen,
  initial,
  onSave,
  onClose,
  title = "Pod-części (Subobjects)"
}) => {
  const [list, setList] = useState<Subobject[]>([]);

  useEffect(() => {
    if (isOpen) {
      setList(initial.length > 0 ? initial : [{ msn: "", desc: "", _uid: uid() }]);
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const addItem = () => {
    setList([...list, { msn: "", desc: "", _uid: uid() }]);
  };

  const removeItem = (index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof Subobject, value: string) => {
    setList(list.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleSave = () => {
    const filtered = list.filter(item => item.msn.trim() !== "");
    onSave(filtered);
  };

  return (
    <div className="g-modal-overlay" aria-modal="true" role="dialog">
      <div className="g-submodal-content" style={{ maxWidth: "600px" }}>
        <div className="g-submodal-header">
          <h3 className="g-submodal-title">{title}</h3>
          <button className="g-modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="g-submodal-body" style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "5px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 1 }}>
              <tr style={{ textAlign: "left" }}>
                <th style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>MSN</th>
                <th style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>Opis</th>
                <th style={{ borderBottom: "1px solid #ddd" }}></th>
              </tr>
            </thead>
            <tbody>
              {list.map((item, idx) => (
                <tr key={item._uid ?? idx}>
                  <td style={{ padding: "4px" }}>
                    <input
                      className="g-form-input"
                      value={item.msn}
                      onChange={(e) => handleChange(idx, "msn", e.target.value)}
                      placeholder="np. MSN-1-A"
                    />
                  </td>
                  <td style={{ padding: "4px" }}>
                    <input
                      className="g-form-input"
                      value={item.desc}
                      onChange={(e) => handleChange(idx, "desc", e.target.value)}
                      placeholder="Opis..."
                    />
                  </td>
                  <td style={{ padding: "4px" }}>
                    <button 
                        type="button" 
                        onClick={() => removeItem(idx)} 
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px" }}
                    >
                      ❌
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="g-add-sample-btn" onClick={addItem} style={{ marginTop: "10px" }}>
            ➕ Dodaj wiersz
          </button>
        </div>

        <div className="g-submodal-actions">
          <button className="g-cancel-small" onClick={onClose}>Anuluj</button>
          <button className="g-save-small" onClick={handleSave}>Zapisz pod-części</button>
        </div>
      </div>
    </div>
  );
};

export default SampleSubobjectsModal;