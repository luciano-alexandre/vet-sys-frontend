export default function Table({ columns, data, actions }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => <th key={c.key}>{c.label}</th>)}
            {actions && <th>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {data?.length ? (
            data.map((row) => (
              <tr key={row.id}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
                ))}
                {actions && <td>{actions(row)}</td>}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)}>Nenhum registro encontrado.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}