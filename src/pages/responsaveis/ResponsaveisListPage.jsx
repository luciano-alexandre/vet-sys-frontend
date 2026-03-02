import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { responsaveisApi } from "../../api/endpoints";
import Table from "../../components/Table";
import ConfirmButton from "../../components/ConfirmButton";

export default function ResponsaveisListPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      setRows(await responsaveisApi.list(q));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function remove(id) {
    try {
      setError("");
      await responsaveisApi.remove(id);
      await load();
    } catch (e) {
      setError("Não foi possível excluir o responsável. Verifique se ele está vinculado a algum animal.");
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <h2>Responsáveis</h2>
        <Link className="btn btn-primary" to="/responsaveis/novo">Novo responsável</Link>
      </div>
      <div className="toolbar">
        <input placeholder="Buscar por nome/cpf" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn" onClick={load}>Buscar</button>
      </div>
      {error && <div className="alert">{error}</div>}

      <Table
        columns={[
          { key: "nome", label: "Nome" },
          { key: "cpf", label: "CPF" },
          { key: "telefone", label: "Telefone" },
          { key: "municipio", label: "Município" },
          { key: "estado", label: "UF" }
        ]}
        data={rows}
        actions={(r) => (
          <div className="row-actions">
            <Link className="btn" to={`/responsaveis/${r.id}/editar`}>Editar</Link>
            <ConfirmButton onConfirm={() => remove(r.id)} message="Excluir responsável?">
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