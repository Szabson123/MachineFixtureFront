import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./admin-object-list.css";

interface AdminObject {
  id: number;
  full_sn: string;
  product_name: string;
  last_move: string;
}

interface ApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminObject[];
}

const AdminObjectsList = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<AdminObject[]>([]);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);
  const isFetchingRef = useRef(false);


  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(
  async (url: string, isInitial: boolean = false) => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);

    try {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Fetch failed");

      const json: ApiResponse = await res.json();

      setData(prev =>
        isInitial ? json.results : [...prev, ...json.results]
      );
      setCount(json.count);

      const relativeNext = json.next
        ? new URL(json.next).pathname + new URL(json.next).search
        : null;

      setNextPageUrl(relativeNext);
    } catch (err) {
      console.error("Błąd pobierania obiektów", err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  },
  []
);

useEffect(() => {
  if (!productId) return;

  setData([]);
  setNextPageUrl(null);

  fetchData(`/api/process/${productId}/admin-objects/`, true);
}, [productId, fetchData]);

useEffect(() => {
  if (!nextPageUrl) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !isFetchingRef.current) {
        fetchData(nextPageUrl);
      }
    },
    {
      threshold: 0,
      rootMargin: "200px",
    }
  );

  const target = observerTarget.current;
  if (target) observer.observe(target);

  return () => {
    if (target) observer.unobserve(target);
  };
}, [nextPageUrl, fetchData]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="aol-container">
      <div className="aol-header">
        <button
          className="aol-back-btn"
          onClick={() => navigate("/admin/products")}
          title="Wróć do listy produktów"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>

        <h2 className="aol-title">
          Obiekty ({count})
        </h2>
      </div>

      <div className="aol-table-wrapper">
        <table className="aol-table">
          <thead>
            <tr>
              <th className="aol-th">Full SN</th>
              <th className="aol-th">Produkt</th>
              <th className="aol-th">Ostatni ruch</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                  key={item.id}
                  className="aol-tr"
                  onClick={() =>
                    navigate(`/admin/products/${productId}/objects/${item.id}`)
                  }
                >
                <td className="aol-td aol-td-sn">{item.full_sn}</td>
                <td className="aol-td">{item.product_name}</td>
                <td className="aol-td aol-td-date">
                  {formatDate(item.last_move)}
                </td>
              </tr>
            ))}

            {data.length === 0 && !loading && (
              <tr>
                <td colSpan={3} className="aol-td aol-no-data">
                  Brak danych do wyświetlenia
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div ref={observerTarget} className="aol-loader-area">
          {loading && <div className="aol-spinner" />}
        </div>
      </div>
    </div>
  );
};

export default AdminObjectsList;
