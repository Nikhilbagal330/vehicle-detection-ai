import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <Link to="/" className="brand-mark">
            ParkGuard
          </Link>
          <span className="brand-tag">Violation Ops</span>
        </div>

        <div className="topbar-actions">
          <span className="user-chip">{user?.name || user?.email}</span>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </header>

      <main className="page-main">{children}</main>
    </div>
  );
};

export default Layout;
