import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { animaisApi } from "../../api/endpoints";
import Table from "../../components/Table";
import ConfirmButton from "../../components/ConfirmButton";

export default function AnimaisListPage() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      setRows(await animaisApi.list({ q }));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, []);


  async function remove(id) {
    try {
      setError("");
      await animaisApi.remove(id);
      await load();
    } catch (e) {
      setError("Não foi possível excluir o animal. Verifique se ele está vinculado a algum atendimento.");
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <h2>Animais</h2>
        <Link className="btn btn-primary" to="/animais/novo">Novo animal</Link>
      </div>
      <div className="toolbar">
        <input placeholder="Buscar por nome/especie/raca" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn" onClick={load}>Buscar</button>
      </div>
      {error && <div className="alert">{error}</div>}

      <Table
        columns={[
          { key: "nome", label: "Nome" },
          { key: "especie", label: "Espécie" },
          { key: "raca", label: "Raça" },
          { key: "sexo", label: "Sexo" },
          { key: "responsavel_nome", label: "Responsável" }
        ]}
        data={rows}
        actions={(r) => (
          <div className="row-actions">
            <Link className="btn" to={`/animais/${r.id}/editar`}>Editar</Link>
            <ConfirmButton onConfirm={() => remove(r.id)} message="Excluir animal?">
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