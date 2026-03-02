import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.perfil === "ADMIN";

  return (
    <div className="page">
      <h2>Dashboard</h2>
      <div className="grid-3">
        {isAdmin && (
          <Link className="card card-link" to="/usuarios">
            <h3>Usuários</h3>
            <p>Gerenciar administradores e veterinários</p>
          </Link>
        )}
        <Link className="card card-link" to="/responsaveis">
          <h3>Responsáveis</h3>
          <p>Cadastrar tutores/proprietários</p>
        </Link>
        <Link className="card card-link" to="/animais">
          <h3>Animais</h3>
          <p>Cadastrar e vincular aos responsáveis</p>
        </Link>
        <Link className="card card-link" to="/atendimentos">
          <h3>Atendimentos</h3>
          <p>Registrar consultas e evolução clínica</p>
        </Link>
      </div>
    </div>
  );
}