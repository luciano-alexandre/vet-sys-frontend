import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useState } from "react";

function MenuItem({ to, icon, children, collapsed }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `menu-item ${isActive ? "active" : ""} ${collapsed ? "collapsed" : ""}`
      }
      title={collapsed ? children : undefined} // tooltip quando recolhido
    >
      <span className="menu-icon" aria-hidden="true">{icon}</span>
      <span className="menu-text">{children}</span>
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = user?.perfil === "ADMIN";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${collapsed ? "is-collapsed" : ""}`}>
        <div className="sidebar-top">
          <Link to="/" className="brand" title="VetSys">
            <span className="brand-emoji" aria-hidden="true">🐾</span>
            <span className="brand-text">VetSys</span>
          </Link>

          <button
            className="btn btn-ghost sidebar-toggle"
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            title={collapsed ? "Expandir" : "Recolher"}
          >
            {collapsed ? "➡" : "⬅"}
          </button>
        </div>

        <nav className="menu">
          <MenuItem to="/" icon="🏠" collapsed={collapsed}>Dashboard</MenuItem>
          {isAdmin && <MenuItem to="/usuarios" icon="👤" collapsed={collapsed}>Usuários</MenuItem>}
          <MenuItem to="/responsaveis" icon="🧑‍🤝‍🧑" collapsed={collapsed}>Responsáveis</MenuItem>
          <MenuItem to="/animais" icon="🐴" collapsed={collapsed}>Animais</MenuItem>
          <MenuItem to="/atendimentos" icon="🩺" collapsed={collapsed}>Atendimentos</MenuItem>
        </nav>

        <div className="sidebar-footer">
          <div className="muted sidebar-user">
            <div className="user-name" title={user?.nome}>{user?.nome}</div>
            <div className="user-role" title={user?.perfil}>{user?.perfil}</div>
          </div>

          <button
            className="btn btn-ghost"
            onClick={() => {
              logout();
              nav("/login");
            }}
            type="button"
            title="Sair"
          >
            {collapsed ? "🚪" : "Sair"}
          </button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}