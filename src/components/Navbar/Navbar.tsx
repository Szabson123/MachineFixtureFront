import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

// 👇 importujemy logo z katalogu src/assets
import logo from "../../assets/logo.png";

const Navbar: React.FC = () => {
  return (
    <nav>
      <div className="navbar-container">
        <Link to="/" className="logo">
          <img
            src={logo}
            alt="SolderMon Logo"
            className="logo-img"
          />
        </Link>
        <ul className="nav-links">
          <li><Link to="/traceability" className="logo-text-small">Traceability</Link></li>
          <li><Link to="/machine-statuses" className="logo-text-small">Monitor Pracy Maszyn</Link></li>
          <li><Link to="/process" className="logo-text-small">Planowanie produkcji</Link></li>
          <li><Link to="/process" className="logo-text-small">Statystyki</Link></li>
          <li><Link to="/new-flow" className="logo-text-small">Nowy Produkt</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
