import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./admin-object-details.css";

interface AdminObject {
  id: number;
  is_mother: boolean;
  last_move: string;
  sito_basic_unnamed_place: string | null;
  free_plain_text: string | null;
  serial_number: string | null;
  full_sn: string;
  created_at: string;
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
}

const AdminObjectDetails = () => {
  const { productId, objectId } = useParams<{
    productId: string;
    objectId: string;
  }>();
  const navigate = useNavigate();

  const [data, setData] = useState<AdminObject | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!productId || !objectId) return;

    fetch(`/api/process/${productId}/admin-objects/${objectId}/`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(setData)
      .catch(() => alert("Błąd pobierania danych"));
  }, [productId, objectId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!data) return;
    const { name, type, value, checked } = e.target;

    setData({
      ...data,
      [name]: type === "checkbox" ? checked : value || null,
    });
  };

  const handleSave = async () => {
    if (!data || !productId || !objectId) return;

    setSaving(true);

    try {
      const res = await fetch(
        `/api/process/${productId}/admin-objects/${objectId}/`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!res.ok) throw new Error();
      navigate(`/admin/products/${productId}`);
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
        <Field label="ID" value={data.id} />
        <Checkbox label="Karton (is_mother)" name="is_mother" checked={data.is_mother} onChange={handleChange} />

        <Field label="Ostatni ruch" value={data.last_move} />
        <Input label="Miejsce w szafie" name="sito_basic_unnamed_place" value={data.sito_basic_unnamed_place} onChange={handleChange} />
        <Input label="Program testujący" name="free_plain_text" value={data.free_plain_text} onChange={handleChange} />
        <Input label="Krótki SN" name="serial_number" value={data.serial_number} onChange={handleChange} />
        <Input label="Pełny SN" name="full_sn" value={data.full_sn} onChange={handleChange} />

        <Field label="Utworzony" value={data.created_at} />
        <Input label="Data przydatności" name="expire_date" value={data.expire_date} onChange={handleChange} type="date" />
        <Input label="Data produkcji" name="production_date" value={data.production_date} onChange={handleChange} type="date" />
        <Input label="Przydatność w procesie" name="exp_date_in_process" value={data.exp_date_in_process} onChange={handleChange} type="date" />
        <Input label="Kwarantanna" name="quranteen_time" value={data.quranteen_time} onChange={handleChange} />

        <Input label="Max w procesie" name="max_in_process" value={data.max_in_process} onChange={handleChange} type="number" />
        <Input label="Limit cykli" name="sito_cycle_limit" value={data.sito_cycle_limit} onChange={handleChange} type="number" />
        <Field label="Ilość cykli" value={data.sito_cycles_count} />

        <Checkbox label="Życie zakończone" name="end" checked={data.end} onChange={handleChange} />

        <Field label="Obecny proces" value={data.current_process_name} />
        <Field label="Obecne miejsce" value={data.current_place_name} />
        <Field label="Produkt" value={data.product_name} />
        <Field label="Producent" value={data.sub_product_name} />
      </div>

      <div className="aod-actions">
        <button onClick={() => navigate(`/admin/products/${productId}`)}>
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

/* 🔹 POMOCNICZE KOMPONENTY */

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
