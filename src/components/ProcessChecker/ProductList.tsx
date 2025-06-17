import React, { useEffect, useState } from "react";
import "./product-list.css";
import { useNavigate } from "react-router-dom";

type Product = {
  id: number;
  name: string;
};

const ProductList: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const url = `/api/process/products/`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Błąd pobierania produktów");
        }
        const data: Product[] = await response.json();
        setProducts(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nieznany błąd");
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="back">
      <div className="product-list">
        <div className="panel">
          <div className="panel-header-process">
            <h3>Lista Produktów</h3>
          </div>
          {loading && <div className="loading">Ładowanie...</div>}
          {error && <div className="error">{error}</div>}
          {!loading && !error && products.length === 0 && (
            <div className="empty-state">Brak produktów</div>
          )}
          <div className="grid-container">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="grid-item" 
                onClick={() => navigate(`/process/${product.id}`)}
              >
                <div className="square">
                  <span className="product-name">{product.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductList;