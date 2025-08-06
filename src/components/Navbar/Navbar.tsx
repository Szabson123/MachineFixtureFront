import React from "react";
import { Link } from "react-router-dom"; // 👈 Importujemy Link z react-router-dom
import "./Navbar.css";

const Navbar: React.FC = () => {
  return (
    <nav>
      <div className="navbar-container">
        <Link to="/" className="logo">
          Konkurs (Nie wiadomo)
        </Link>
        <ul className="nav-links">
          <li><Link to="/traceability">Traceability</Link></li>
          <li><Link to="/process">Planowanie produkcji</Link></li>
          <li><Link to="/process">Statystyki</Link></li>
          <li><Link to="/new-flow">Nowy Produkt </Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
