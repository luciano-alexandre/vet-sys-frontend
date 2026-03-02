import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usersApi } from "../../api/endpoints";
import { Field } from "../../components/Field";

export default function UserFormPage({ mode }) {
  const { id } = useParams();
  const nav = useNavigate();
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    perfil: "VETERINARIO",
    ativo: true,
    crmv: "",
    telefone: ""
  });

  const [novaSenha, setNovaSenha] = useState("");
  const [error, setError] = useState("");
  const [telefoneError, setTelefoneError] = useState("");

  // Mantém somente números
  function onlyDigits(v) {
    return (v || "").replace(/\D/g, "");
  }

  // Aplica máscara BR para telefone (10 ou 11 dígitos)
  function formatTelefoneBR(value) {
    const d = onlyDigits(value).slice(0, 11);

    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`; // 11 dígitos
  }

  // Válido quando tiver 10 (fixo) ou 11 (celular) dígitos
  function isTelefoneValido(v) {
    const len = onlyDigits(v).length;
    return len === 10 || len === 11;
  }

  useEffect(() => {
    if (isEdit && id) {
      usersApi
        .get(id)
        .then((u) =>
          setForm({
            nome: u.nome || "",
            email: u.email || "",
            senha: "",
            perfil: u.perfil || "VETERINARIO",
            ativo: !!u.ativo,
            crmv: u.crmv || "",
            telefone: formatTelefoneBR(u.telefone || "")
          })
        )
        .catch((e) => setError(e.message));
    }
  }, [id, isEdit]);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function onTelefoneChange(e) {
    const masked = formatTelefoneBR(e.target.value);
    set("telefone", masked);

    if (!masked) {
      setTelefoneError("");
      return;
    }

    setTelefoneError(isTelefoneValido(masked) ? "" : "Telefone inválido. Use DDD + número (10 ou 11 dígitos).");
  }

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (!isTelefoneValido(form.telefone)) {
      setTelefoneError("Telefone inválido. Formato esperado: (99) 99999-9999 ou (99) 9999-9999.");
      return;
    }

    try {
      const payload = {
        ...form,
        // envia só dígitos para o backend (recomendado)
        telefone: onlyDigits(form.telefone)
      };

      if (payload.perfil !== "VETERINARIO") payload.crmv = null;

      if (isEdit) {
        delete payload.senha;
        await usersApi.update(id, payload);

        if (novaSenha.trim()) {
          await usersApi.updatePassword(id, { senha: novaSenha });
        }
      } else {
        await usersApi.create(payload);
      }

      nav("/usuarios");
    } catch (e2) {
      setError(e2.message);
    }
  }

  return (
    <div className="page">
      <h2>{isEdit ? "Editar usuário" : "Novo usuário"}</h2>
      {error && <div className="alert">{error}</div>}

      <form className="card form-grid" onSubmit={submit}>
        <Field label="Nome">
          <input
            value={form.nome}
            onChange={(e) => set("nome", e.target.value)}
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>

        {!isEdit && (
          <Field label="Senha">
            <input
              type="password"
              value={form.senha}
              onChange={(e) => set("senha", e.target.value)}
            />
          </Field>
        )}

        {isEdit && (
          <Field label="Nova senha (opcional)">
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
            />
          </Field>
        )}

        <Field label="Perfil">
          <select
            value={form.perfil}
            onChange={(e) => set("perfil", e.target.value)}
          >
            <option value="ADMIN">ADMIN</option>
            <option value="VETERINARIO">MÉDICO (A) VETERINÁRIO (A)</option>
          </select>
        </Field>

        <Field label="CRMV - PB">
          <input
            type="number"
            value={form.crmv}
            onChange={(e) => set("crmv", e.target.value)}
            disabled={form.perfil !== "VETERINARIO"}
          />
        </Field>

        <Field label="Telefone">
          <input
            type="tel"
            value={form.telefone}
            onChange={onTelefoneChange}
            placeholder="(83) 99999-9999"
            inputMode="numeric"
            pattern="\(\d{2}\)\s\d{4,5}-\d{4}"
            aria-invalid={telefoneError ? "true" : "false"}
          />
          {telefoneError && (
            <small style={{ color: "#b91c1c", marginTop: 4 }}>{telefoneError}</small>
          )}
        </Field>

        <Field label="Ativo">
          <select
            value={String(form.ativo)}
            onChange={(e) => set("ativo", e.target.value === "true")}
          >
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        </Field>

        <div className="form-actions">
          <button type="button" className="btn" onClick={() => nav(-1)}>
            Cancelar
          </button>
          <button className="btn btn-primary">Salvar</button>
        </div>
      </form>
    </div>
  );
}