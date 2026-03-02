import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usersApi } from "../../api/endpoints";
import Table from "../../components/Table";
import ConfirmButton from "../../components/ConfirmButton";

export default function UsersListPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      setRows(await usersApi.list());
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function remove(id) {
    try {
      setError("");
      await usersApi.remove(id);
      await load();
    } catch (e) {
      setError("Não foi possível excluir o usuário. Verifique se ele está vinculado a algum atendimento.");

    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <h2>Usuários</h2>
        <Link className="btn btn-primary" to="/usuarios/novo">Novo usuário</Link>
      </div>
      {error && <div className="alert">{error}</div>}

      <Table
        columns={[
          { key: "nome", label: "Nome" },
          { key: "email", label: "Email" },
          { key: "perfil", label: "Perfil" },
          { key: "crmv", label: "CRMV - PB" },
          { key: "ativo", label: "Ativo", render: (r) => (r.ativo ? "Sim" : "Não") }
        ]}
        data={rows}
        actions={(r) => (
          <div className="row-actions">
            <Link className="btn" to={`/usuarios/${r.id}/editar`}>Editar</Link>
            <ConfirmButton onConfirm={() => remove(r.id)} message="Excluir usuário?">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                Excluir
              </span>
            </ConfirmButton>
          </div>
        )}
      />
    </div>
  );
}