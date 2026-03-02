import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { atendimentosApi } from "../../api/endpoints";
import Table from "../../components/Table";
import ConfirmButton from "../../components/ConfirmButton";

export default function AtendimentosListPage() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      setRows(await atendimentosApi.list({ q }));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function remove(id) {
    await atendimentosApi.remove(id);
    load();
  }

  return (
    <div className="page">
      <div className="page-head">
        <h2>Atendimentos</h2>
        <Link className="btn btn-primary" to="/atendimentos/novo">Novo atendimento</Link>
      </div>
      <div className="toolbar">
        <input placeholder="Buscar por animal ou responsável" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn" onClick={load}>Buscar</button>
      </div>
      {error && <div className="alert">{error}</div>}

      <Table
        columns={[
          { key: "data_atendimento", label: "Data", render: (r) => String(r.data_atendimento).replace("T", " ").slice(0, 16) },
          { key: "animal_nome", label: "Animal" },
          { key: "especie", label: "Espécie" },
          { key: "responsavel_nome", label: "Responsável" },
          { key: "veterinario_nome", label: "Veterinário" }
        ]}
        data={rows}
        actions={(r) => (
          <div className="row-actions">
            <Link className="btn" to={`/atendimentos/${r.id}/ver`}>Ver</Link>
            <Link className="btn" to={`/atendimentos/${r.id}/editar`}>Editar</Link>
            <ConfirmButton onConfirm={() => remove(r.id)} message="Excluir atendimento?">
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