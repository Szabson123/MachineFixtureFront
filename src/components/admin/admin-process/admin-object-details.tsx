import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./admin-object-details.css";
import { getCSRFToken } from "../../../utils";

interface AdminObject {
  id: number;
  is_mother: boolean;
  last_move: string;
  sito_basic_unnamed_place: string | null;
  free_plain_text: string | null;
  serial_number: string | null;
  full_sn: string;
  created_at: string;
  product_id: number
  
  expire_date: string | null;
  production_date: string | null;
  exp_date_in_process: string | null;
  
  quranteen_time: string | null;

  max_in_process: number | null;
  sito_cycle_limit: number | null;
  sito_cycles_count: number;
  end: boolean;
  is_full: boolean;
  
  current_process_name: string;
  current_place_name: string; 
  product_name: string;
  sub_product_name: string;

  current_process_id: string | null;
  current_place_id: number | null;
}

interface HelperItem {
  id: number | string;
  name: string;
}

const AdminObjectDetails = () => {
  const {objectId } = useParams<{
    objectId: string;
  }>();

  const navigate = useNavigate();

  const [data, setData] = useState<AdminObject | null>(null);
  
  const [processes, setProcesses] = useState<HelperItem[]>([]);
  const [places, setPlaces] = useState<HelperItem[]>([]);
  
  const [saving, setSaving] = useState(false);

useEffect(() => {
  if (!objectId) return;

  fetch(`/api/process/admin-objects/${objectId}/`, {
    credentials: "include",
  })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(setData)
    .catch(() => alert("Błąd pobierania danych obiektu"));
}, [objectId]);

useEffect(() => {
  if (!data?.product_id) return;

  fetch(`/api/process/place/helper/${data.product_id}/`, {
    credentials: "include",
  })
    .then(res => res.json())
    .then(apiData => {
      setPlaces(Array.isArray(apiData) ? apiData : apiData.results ?? []);
    });

  fetch(`/api/process/process/helper/${data.product_id}/`, {
    credentials: "include",
  })
    .then(res => res.json())
    .then(apiData => {
      setProcesses(Array.isArray(apiData) ? apiData : apiData.results ?? []);
    });

}, [data?.product_id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | 
    { target: { name: string; value: any; type?: string; tagName?: string } }
  ) => {
    if (!data) return;
    
    const target = e.target;
    const name = target.name;
    const value = target.value;
    const tagName = 'tagName' in target ? target.tagName : null;
    const type = 'type' in target ? target.type : undefined;
    
    let checked = false;
    if ('checked' in target) {
        checked = (target as HTMLInputElement).checked;
    }

    let newValue: any = value;

    if (tagName === "SELECT") {
        if (value === "") {
            newValue = null;
        } else {
            if (name === "current_place_id") {
                newValue = parseInt(value, 10);
            } else {
                newValue = value;
            }
        }
    } 
    else if (type === "checkbox") {
        newValue = checked;
    }
    else if (newValue === "") {
        newValue = null;
    }

    setData({
      ...data,
      [name]: newValue,
    });
  };

  const handleSave = async () => {
  if (!data || !objectId) return;

  setSaving(true);
  const csrfToken = getCSRFToken();

  try {
    const res = await fetch(
      `/api/process/admin-objects/${objectId}/`,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken || "",
        },
        body: JSON.stringify(data),
      }
    );

    if (!res.ok) throw new Error();
    navigate(-1);
  } catch {
    alert("Błąd zapisu");
  } finally {
    setSaving(false);
  }
};

  if (!data) return <div className="aod-container">Ładowanie…</div>;

  return (
    <div className="aod-container">
      <h2>Obiekt #{data.full_sn}</h2>

      <div className="aod-form">
        <div className="aod-row">
          <label>ID</label>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="aod-readonly">{data.id}</div>

            <button
              type="button"
              className="aod-link-btn"
              onClick={() => navigate(`/admin/product-object/${data.id}`)}
              title="Przejdź do szczegółów obiektu"
            >
              Szczegóły
            </button>
          </div>
        </div>
        <Checkbox label="Karton (is_mother)" name="is_mother" checked={data.is_mother} onChange={handleChange} />

        {/* Zmienione na DateTimeRow z readOnly */}
        <DateTimeRow 
            label="Ostatni ruch" 
            name="last_move" 
            value={data.last_move} 
            readOnly={true} 
        />
        
        <Input label="Miejsce w szafie" name="sito_basic_unnamed_place" value={data.sito_basic_unnamed_place} onChange={handleChange} />
        <Input label="Program testujący" name="free_plain_text" value={data.free_plain_text} onChange={handleChange} />
        <Input label="Krótki SN" name="serial_number" value={data.serial_number} onChange={handleChange} />
        <Input label="Pełny SN" name="full_sn" value={data.full_sn} onChange={handleChange} />

        {/* Zmienione na DateTimeRow z readOnly */}
        <DateTimeRow 
            label="Utworzony" 
            name="created_at" 
            value={data.created_at} 
            readOnly={true} 
        />
        
        {/* Pola typu DATA (tylko dzień) */}
        <Input label="Data przydatności" name="expire_date" value={data.expire_date} onChange={handleChange} type="date" />
        <Input label="Data produkcji" name="production_date" value={data.production_date} onChange={handleChange} type="date" />
        <Input label="Przydatność w procesie" name="exp_date_in_process" value={data.exp_date_in_process} onChange={handleChange} type="date" />
        
        {/* Pole typu DATA + CZAS (edytowalne) */}
        <DateTimeRow label="Kwarantanna" name="quranteen_time" value={data.quranteen_time} onChange={handleChange} />

        <Input label="Max w procesie" name="max_in_process" value={data.max_in_process} onChange={handleChange} type="number" />
        <Input label="Limit cykli" name="sito_cycle_limit" value={data.sito_cycle_limit} onChange={handleChange} type="number" />
        <Field label="Ilość cykli" value={data.sito_cycles_count} />

        <Checkbox label="Życie zakończone" name="end" checked={data.end} onChange={handleChange} />

        <Select 
            label="Obecny proces" 
            name="current_process_id" 
            value={data.current_process_id} 
            options={processes} 
            onChange={handleChange} 
        />
        
        <Select 
            label="Obecne miejsce" 
            name="current_place_id" 
            value={data.current_place_id} 
            options={places} 
            onChange={handleChange} 
        />

        <Field label="Produkt" value={data.product_name} />
        <Field label="Producent" value={data.sub_product_name} />
      </div>

      <div className="aod-actions">
        <button onClick={() => navigate(-1)}>
          Anuluj
        </button>
        <button onClick={handleSave} disabled={saving}>
          {saving ? "Zapisywanie…" : "Zapisz"}
        </button>
      </div>
    </div>
  );
};

export default AdminObjectDetails;

const Field = ({ label, value }: any) => (
  <div className="aod-row">
    <label>{label}</label>
    <div className="aod-readonly">{value ?? "—"}</div>
  </div>
);

const Input = ({ label, name, value, onChange, type = "text" }: any) => (
  <div className="aod-row">
    <label>{label}</label>
    <input name={name} value={value ?? ""} onChange={onChange} type={type} />
  </div>
);

const Checkbox = ({ label, name, checked, onChange }: any) => (
  <div className="aod-row aod-checkbox">
    <label>
      <input type="checkbox" name={name} checked={checked} onChange={onChange} />
      {label}
    </label>
  </div>
);

const Select = ({ label, name, value, options, onChange }: any) => {
    const safeOptions = Array.isArray(options) ? options : [];

    return (
      <div className="aod-row">
        <label>{label}</label>
        <select name={name} value={value ?? ""} onChange={onChange}>
            <option value="">— Wybierz —</option>
            {safeOptions.map((opt: HelperItem) => (
                <option key={opt.id} value={opt.id}>
                    {opt.name}
                </option>
            ))}
        </select>
        {!Array.isArray(options) && options !== undefined && (
            <span style={{color:'red', fontSize: '0.7em'}}>Błąd danych listy</span>
        )}
      </div>
    );
};

const DateTimeRow = ({ label, name, value, onChange, readOnly = false }: any) => {
  let datePart = "";
  let timePart = "";

  if (value) {
    const parts = value.split("T");
    datePart = parts[0];
    if (parts[1]) {
        timePart = parts[1].substring(0, 5); 
    }
  }

  const handleLocalChange = (newDate: string, newTime: string) => {
    if (readOnly || !onChange) return;

    if (!newDate) {
      onChange({ target: { name, value: null } });
      return;
    }

    const finalTime = newTime || "00:00";
    const isoString = `${newDate}T${finalTime}:00`;

    onChange({ target: { name, value: isoString } });
  };

  return (
    <div className="aod-row">
      <label>{label}</label>
      <div style={{ display: "flex", gap: "10px" }}>
        <input
          type="date"
          style={{ flex: 2, backgroundColor: readOnly ? '#f8fafc' : undefined }} 
          value={datePart}
          disabled={readOnly}
          onChange={(e) => handleLocalChange(e.target.value, timePart)}
        />
        <input
          type="time"
          style={{ flex: 1, backgroundColor: readOnly ? '#f8fafc' : undefined }}
          value={timePart}
          disabled={readOnly}
          onChange={(e) => handleLocalChange(datePart, e.target.value)}
        />
      </div>
    </div>
  );
};