import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./admin-products-list.css";

interface Product {
  id: number;
  name: string;
}

const AdminProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/process/products/", {
        credentials: "include",
      });

      if (res.ok) {
        const json = await res.json();
        setProducts(json);
      } else {
        console.error("Błąd pobierania produktów:", res.status);
      }
    } catch (err) {
      console.error("Błąd sieci:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="aol-container">
      <div className="aol-header">
        <button
            className="aol-back-btn"
            onClick={() => navigate("/admin/main-page")}
            title="Wróć do panelu głównego"
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

        <h2 className="aol-title">Lista Produktów</h2>
        </div>

      <div className="aol-grid">
        {products.map((product) => (
          <div
            key={product.id}
            className="aol-card"
            onClick={() => navigate(`/admin/products/${product.id}`)}
          >
            <h3 className="aol-card-title">{product.name}</h3>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="aol-empty">
          Brak produktów do wyświetlenia.
        </div>
      )}
    </div>
  );
};

export default AdminProductList;
