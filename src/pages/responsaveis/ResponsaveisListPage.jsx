import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { responsaveisApi } from "../../api/endpoints";
import Table from "../../components/Table";
import ConfirmButton from "../../components/ConfirmButton";

const PAGE_SIZE = 20;

export default function ResponsaveisListPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  async function load() {
    try {
      setError("");
      const data = await responsaveisApi.list(q);
      setRows(data);
      setPage(1); // ao buscar/recarregar, volta pra primeira página
    } catch (e) {
      setError(e?.message ?? "Erro ao carregar responsáveis.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id) {
    try {
      setError("");
      await responsaveisApi.remove(id);
      // recarrega mantendo a regra de voltar pra página 1 (você pode mudar se preferir)
      await load();
    } catch (e) {
      setError(
        "Não foi possível excluir o responsável. Verifique se ele está vinculado a algum animal."
      );
    }
  }

  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  // garante página válida quando total muda (ex: exclusão)
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    if (page < 1) setPage(1);
  }, [page, totalPages]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);

  const pageNumbers = useMemo(() => {
    const maxButtons = 7;
    const half = Math.floor(maxButtons / 2);

    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);

    const nums = [];
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  }, [page, totalPages]);

  return (
    <div className="page">
      <div className="page-head">
        <h2>Responsáveis</h2>
        <Link className="btn btn-primary" to="/responsaveis/novo">
          Novo responsável
        </Link>
      </div>

      <div className="toolbar">
        <input
          placeholder="Buscar por nome/cpf"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") load();
          }}
        />
        <button className="btn" onClick={load} type="button">
          Buscar
        </button>
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
        data={pageRows}
        actions={(r) => (
          <div className="row-actions">
            <Link className="btn" to={`/responsaveis/${r.id}/editar`}>
              Editar
            </Link>
            <ConfirmButton
              onConfirm={() => remove(r.id)}
              message="Excluir responsável?"
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                Excluir
              </span>
            </ConfirmButton>
          </div>
        )}
      />

      {/* PAGINAÇÃO */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 12,
          flexWrap: "wrap"
        }}
      >
        <div style={{ fontSize: 14 }}>
          Mostrando{" "}
          <strong>
            {totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, totalItems)}
          </strong>{" "}
          de <strong>{totalItems}</strong>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            className="btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            type="button"
          >
            Anterior
          </button>

          {pageNumbers[0] > 1 && (
            <>
              <button className="btn" type="button" onClick={() => setPage(1)}>
                1
              </button>
              {pageNumbers[0] > 2 && <span style={{ padding: "0 4px" }}>…</span>}
            </>
          )}

          {pageNumbers.map((n) => (
            <button
              key={n}
              type="button"
              className={`btn ${n === page ? "btn-primary" : ""}`}
              onClick={() => setPage(n)}
              aria-current={n === page ? "page" : undefined}
            >
              {n}
            </button>
          ))}

          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <span style={{ padding: "0 4px" }}>…</span>
              )}
              <button
                className="btn"
                type="button"
                onClick={() => setPage(totalPages)}
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            className="btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            type="button"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}