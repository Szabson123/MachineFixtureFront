import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import Toast from "../shared/Toast";
import ErrorModal from "../shared/ErrorModal";
import "./SimpleCheckView.css";


const SimpleCheckView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();

  let selectedProcess: any = {};
  try {
    selectedProcess = JSON.parse(localStorage.getItem("selectedProcess") || "{}");
    if (selectedProcess?.settings && typeof selectedProcess.settings === "string") {
      selectedProcess.settings = JSON.parse(selectedProcess.settings);
    }
  } catch {}

  const userId = localStorage.getItem("userIdentifier") || "";

  const movementType =
    searchParams.get("movement_type") ||
    searchParams.get("movementType") ||
    selectedProcess?.movement_type ||
    selectedProcess?.settings?.movement_type ||
    "check";

  const processId = selectedProcess?.id;
  const endpoint = processId
    ? `/api/process/product-object/move/${processId}/`
    : "";

  const [sn, setSn] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    if (!processId) {
      setError("Brak ID procesu (selectedProcess.id). Wróć i wybierz proces.");
    }
  }, [processId]);

  const parseApiError = (err: any): string => {
    if (typeof err === "string") return err;
    if (err?.error) return err.error;
    if (err?.detail) return err.detail;
    if (err && typeof err === "object") {
      const k = Object.keys(err)[0];
      const msgs = err[k];
      if (Array.isArray(msgs) && msgs.length) return msgs[0];
    }
    return "Wystąpił nieznany błąd.";
  };

  const submit = async (result: boolean) => {
    if (!processId) {
      setError("Brak ID procesu — nie mogę wysłać żądania.");
      return;
    }
    if (!sn.trim()) {
      setError("Podaj ID/SN obiektu.");
      return;
    }
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": document.cookie.match(/csrftoken=([^;]+)/)?.[1] || "",
        },
        credentials: "include",
        body: JSON.stringify({
          full_sn: sn.trim(),
          movement_type: movementType,
          who: userId || "unknown",
          place_name: selectedProcess?.place_name,
          result,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(parseApiError(err));
      }

      setShowToast(true);
      setSn("");
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch (e: any) {
      setError(e?.message || "Błąd wysyłania danych.");
    }
  };

  return (
    <div className="simple-check-container">
      <div className="simple-check-card">
        <h2 className="simple-check-title">Kontrola</h2>

        <button
          className="back-button"
          onClick={() => navigate(`/process/${productId}`)}
        >
          ← Powrót
        </button>

        <div className="simple-check-input-container">
          <label className="simple-check-label">
            ID / SN obiektu
          </label>
          <input
            ref={inputRef}
            value={sn}
            onChange={(e) => setSn(e.target.value)}
            placeholder="Wpisz ID/SN"
            className="simple-check-input"
          />
        </div>

        <div className="simple-check-buttons">
          <button className="simple-check-button simple-check-button--good" onClick={() => submit(true)}>
            Dobry
          </button>
          <button className="simple-check-button simple-check-button--bad" onClick={() => submit(false)}>
            Zły
          </button>
        </div>

        <div className="simple-check-footer">
          <div className="simple-check-footer-item"><b>Użytkownik:</b> {userId || "Nieznany"}</div>
        </div>
      </div>

      {error && <ErrorModal message={error} onClose={() => setError("")} />}
      {showToast && <Toast message="✅ Zapisano wynik" onClose={() => setShowToast(false)} />}
  </div>
  );
};

export default SimpleCheckView;
