import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCSRFToken } from "../../utils";
import "./Login.css"; // <--- Import stylów

const Login = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await fetch("/api/user/auth/csrf/", {
        credentials: "include",
      });

      const res = await fetch("/api/user/auth/login/", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCSRFToken() ?? "",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.detail || "Błędne dane logowania");
      }

      navigate("/admin/main-page", { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Logowanie</h2>

        <input
          className="login-form-input"
          placeholder="Login"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          className="login-form-input"
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="login-error-message">{error}</p>}

        <button 
          className="login-button" 
          disabled={loading || !username || !password}
        >
          {loading ? "Logowanie..." : "Zaloguj"}
        </button>
      </form>
    </div>
  );
};

export default Login;