import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function MenuItem({ to, children }) {
  return (
    <NavLink to={to} className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}>
      {children}
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const isAdmin = user?.perfil === "ADMIN";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/" className="brand">🐾 VetSys</Link>
        <nav className="menu">
          <MenuItem to="/">Dashboard</MenuItem>
          {isAdmin && <MenuItem to="/usuarios">Usuários</MenuItem>}
          <MenuItem to="/responsaveis">Responsáveis</MenuItem>
          <MenuItem to="/animais">Animais</MenuItem>
          <MenuItem to="/atendimentos">Atendimentos</MenuItem>
        </nav>

        <div className="sidebar-footer">
          <div className="muted">{user?.nome}</div>
          <div className="muted">{user?.perfil}</div>
          <button
            className="btn btn-ghost"
            onClick={() => {
              logout();
              nav("/login");
            }}
          >
            Sair
          </button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}