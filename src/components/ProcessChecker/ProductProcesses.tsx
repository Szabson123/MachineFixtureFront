import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ProductProcesses.css";

type Process = {
  id: number;
  name: string;
  product_name: string;
  is_required: boolean;
  order: number;
};

const ProductProcesses: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        const response = await fetch(`/api/process/${productId}/product-processes/`);
        if (!response.ok) {
          throw new Error("Błąd pobierania procesów produktu");
        }
        const data = await response.json();
        setProcesses(data.sort((a: Process, b: Process) => a.order - b.order));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nieznany błąd");
      } finally {
        setLoading(false);
      }
    };

    fetchProcesses();
  }, [productId]);

  const handleProcessClick = (process: Process) => {
    localStorage.setItem('selectedProcess', JSON.stringify(process));
    navigate(`/process/${productId}/process-action`);
  };

  if (loading) return <div className="loading">Ładowanie procesów...</div>;
  if (error) return <div className="error">Błąd: {error}</div>;

  const productName = processes[0]?.product_name || `#${productId}`;

  return (
    <div className="back">
      <div className="process-flow-container">
        <div className="panel">
          <div className="panel-header-process">
            <button 
              onClick={() => navigate(`/process/`)} 
              className="back-button"
            >
              &larr; Powrót
            </button>
            <h3>Procesy produktu: {productName}</h3>
          </div>
          
          <div className="process-flow">
            <div className="process-flow-inner">
              {processes.map((process, index) => (
                <React.Fragment key={process.id}>
                  <div 
                    className={`process-step ${process.is_required ? "required" : "optional"}`}
                    onClick={() => handleProcessClick(process)}
                  >
                    <div className="step-order">{process.order}</div>
                    <div className="step-name">{process.name}</div>
                    {process.is_required ? (
                      <div className="required-badge">Wymagany</div>
                    ) : (
                      <div className="optional-badge">Opcjonalny</div>
                    )}
                  </div>

                  {index < processes.length - 1 && (
                    <div className="process-arrow">
                      <div className="arrow-line"></div>
                      <div className="arrow-head"></div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductProcesses;