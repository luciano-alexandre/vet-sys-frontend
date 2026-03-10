import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { responsaveisApi, localidadesApi } from "../../api/endpoints";
import { Field } from "../../components/Field";

export default function ResponsavelFormPage({ mode }) {
  const { id } = useParams();
  const nav = useNavigate();
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    email: "",
    telefone: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    uf: "",        // exibição/compatibilidade
    cidade: "",    // exibição/compatibilidade
    uf_id: null,   // <- NOVO
    cidade_id: null // <- NOVO
  });

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Dados de autocomplete
  const [ufs, setUfs] = useState([]);
  const [ufQuery, setUfQuery] = useState("");
  const [ufsLoading, setUfsLoading] = useState(false);

  const [cidades, setCidades] = useState([]);
  const [cidadeQuery, setCidadeQuery] = useState("");
  const [cidadesLoading, setCidadesLoading] = useState(false);

  const [showUfList, setShowUfList] = useState(false);
  const [showCidadeList, setShowCidadeList] = useState(false);

  const onlyDigits = (v) => (v || "").replace(/\D/g, "");

  function formatCPF(v) {
    const d = onlyDigits(v).slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }

  function formatTelefoneBR(v) {
    const d = onlyDigits(v).slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  function formatCEP(v) {
    const d = onlyDigits(v).slice(0, 8);
    if (d.length <= 5) return d;
    return `${d.slice(0, 5)}-${d.slice(5)}`;
  }

  function isEmailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim());
  }

  function isTelefoneValido(tel) {
    const len = onlyDigits(tel).length;
    return len === 10 || len === 11;
  }

  function isCepValido(cep) {
    return onlyDigits(cep).length === 8;
  }

  function isCPFValido(cpf) {
    const s = onlyDigits(cpf);
    if (!s || s.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(s)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += Number(s[i]) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== Number(s[9])) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += Number(s[i]) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;
    if (resto !== Number(s[10])) return false;

    return true;
  }

  function set(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function setFieldError(field, msg) {
    setFieldErrors((prev) => ({ ...prev, [field]: msg }));
  }

  function clearFieldError(field) {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  // ---------- Carrega UFs ----------
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setUfsLoading(true);
        const data = await localidadesApi.ufs(ufQuery);
        if (active) setUfs(data || []);
      } catch {
        // opcional: setError("Erro ao carregar UFs.");
      } finally {
        if (active) setUfsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [ufQuery]);

  // ---------- Carrega cidades ----------
  useEffect(() => {
    let active = true;
    if (!form.uf) {
      setCidades([]);
      return;
    }

    (async () => {
      try {
        setCidadesLoading(true);
        const data = await localidadesApi.cidades(form.uf, cidadeQuery);
        if (active) setCidades(data || []);
      } catch {
        // opcional: setError("Erro ao carregar cidades.");
      } finally {
        if (active) setCidadesLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [form.uf, cidadeQuery]);

  useEffect(() => {
    if (!isEdit || !id) return;

    responsaveisApi
      .get(id)
      .then((r) => {
        const ufSigla = (r.uf_sigla || r.uf || "").toUpperCase();
        const ufNome = r.uf_nome || "";
        const cidadeNome = r.cidade_nome || r.cidade || "";

        setForm({
          nome: r.nome || "",
          cpf: formatCPF(r.cpf || ""),
          email: r.email || "",
          telefone: formatTelefoneBR(r.telefone || ""),
          cep: formatCEP(r.cep || ""),
          logradouro: r.logradouro || "",
          numero: r.numero || "",
          complemento: r.complemento || "",
          bairro: r.bairro || "",
          uf: ufSigla,
          cidade: cidadeNome,
          uf_id: r.uf_id ?? null,
          cidade_id: r.cidade_id ?? null,
        });

        // importante: preencher os inputs visíveis com os campos corretos
        setUfQuery(ufSigla ? `${ufSigla}${ufNome ? ` - ${ufNome}` : ""}` : "");
        setCidadeQuery(cidadeNome);
      })
      .catch((e) => setError(e.message || "Erro ao carregar responsável."));
  }, [id, isEdit]);

  // ---------- Validações em tempo real ----------
  function onCpfChange(e) {
    const v = formatCPF(e.target.value);
    set("cpf", v);
    if (!v) return clearFieldError("cpf");
    if (!isCPFValido(v)) setFieldError("cpf", "CPF inválido.");
    else clearFieldError("cpf");
  }

  function onTelefoneChange(e) {
    const v = formatTelefoneBR(e.target.value);
    set("telefone", v);
    if (!v) return clearFieldError("telefone");
    if (!isTelefoneValido(v)) setFieldError("telefone", "Telefone inválido.");
    else clearFieldError("telefone");
  }

  function onEmailChange(e) {
    const v = e.target.value;
    set("email", v);
    if (!v) return clearFieldError("email");
    if (!isEmailValido(v)) setFieldError("email", "E-mail inválido.");
    else clearFieldError("email");
  }

  function onCepChange(e) {
    const v = formatCEP(e.target.value);
    set("cep", v);
    if (!v) return clearFieldError("cep");
    if (!isCepValido(v)) setFieldError("cep", "CEP inválido.");
    else clearFieldError("cep");
  }

  function handleSelectUf(u) {
    setForm((prev) => ({
      ...prev,
      uf: u.sigla,
      uf_id: u.id,
      cidade: "",
      cidade_id: null,
    }));
    setUfQuery(`${u.sigla} - ${u.nome}`);
    setCidadeQuery("");
    clearFieldError("uf");
    clearFieldError("cidade");
    setShowUfList(false);
  }

  function handleSelectCidade(c) {
    setForm((prev) => ({
      ...prev,
      cidade: c.nome,
      cidade_id: c.id,
    }));
    setCidadeQuery(c.nome);
    clearFieldError("cidade");
    setShowCidadeList(false);
  }

  // tenta casar texto digitado com lista carregada
  function resolveUfFromQuery() {
    const raw = (ufQuery || "").trim().toLowerCase();
    if (!raw) return "";

    const bySigla = ufs.find((u) => u.sigla.toLowerCase() === raw);
    if (bySigla) return bySigla.sigla;

    const byNome = ufs.find((u) => u.nome.toLowerCase() === raw);
    if (byNome) return byNome.sigla;

    const byCombo = ufs.find(
      (u) => `${u.sigla} - ${u.nome}`.toLowerCase() === raw
    );
    if (byCombo) return byCombo.sigla;

    return "";
  }

  function resolveCidadeFromQuery() {
    const raw = (cidadeQuery || "").trim().toLowerCase();
    if (!raw) return "";

    const byNome = cidades.find((c) => c.nome.toLowerCase() === raw);
    return byNome ? byNome.nome : "";
  }

  async function submit(e) {
    if (e) e.preventDefault();
    setShowUfList(false);
    setShowCidadeList(false);

    // tenta resolver caso digitou e não clicou na lista
    const ufResolvida = form.uf || resolveUfFromQuery();
    const cidadeResolvida = form.cidade || resolveCidadeFromQuery();

    let ufId = form.uf_id;
    let cidadeId = form.cidade_id;


    if (!ufId && ufResolvida) {
      const ufObj = ufs.find((u) => u.sigla.toLowerCase() === ufResolvida.toLowerCase());
      ufId = ufObj?.id ?? null;
    }

    if (!cidadeId && cidadeResolvida && ufId) {
      const cObj = cidades.find((c) => c.nome.toLowerCase() === cidadeResolvida.toLowerCase());
      cidadeId = cObj?.id ?? null;
    }

    const newErrors = {};
    if (!form.nome.trim()) newErrors.nome = "Nome é obrigatório.";
    if (!isCPFValido(form.cpf)) newErrors.cpf = "CPF inválido.";
    if (form.email.trim() && !isEmailValido(form.email)) newErrors.email = "E-mail inválido.";
    if (!isTelefoneValido(form.telefone)) newErrors.telefone = "Telefone inválido.";
    if (!isCepValido(form.cep)) newErrors.cep = "CEP inválido.";
    if (!ufId) newErrors.uf = "UF é obrigatória.";
    if (!cidadeId) newErrors.cidade = "Cidade é obrigatória.";
    if (!form.logradouro.trim()) newErrors.logradouro = "Logradouro é obrigatório.";
    if (!form.bairro.trim()) newErrors.bairro = "Bairro é obrigatório.";

    console.log("[SUBMIT] clicou salvar", newErrors);

    if (Object.keys(newErrors).length) {
      setFieldErrors(newErrors);
      return;
    }

    try {
      const payload = {
        nome: form.nome.trim(),
        cpf: onlyDigits(form.cpf),
        email: form.email.trim() ? form.email.trim().toLowerCase() : null,
        telefone: onlyDigits(form.telefone),
        cep: onlyDigits(form.cep),
        logradouro: form.logradouro.trim(),
        numero: form.numero?.trim() || null,
        complemento: form.complemento?.trim() || null,
        bairro: form.bairro.trim(),
        uf_id: ufId,
        cidade_id: cidadeId,
      };
      console.log(payload);
      if (isEdit) await responsaveisApi.update(id, payload);
      else await responsaveisApi.create(payload);

      nav("/responsaveis");
    } catch (e2) {
      setError(e2.message || "Erro ao salvar.");
    }
  }

  return (
    <div className="page">
      <h2>{isEdit ? "Editar responsável" : "Novo responsável"}</h2>
      {error && <div className="alert">{error}</div>}

      <form className="card form-grid" onSubmit={submit} noValidate>
        <Field label="Nome">
          <input
            value={form.nome}
            onChange={(e) => {
              set("nome", e.target.value);
              clearFieldError("nome");
            }}
          />
          {fieldErrors.nome && <small className="error-text">{fieldErrors.nome}</small>}
        </Field>

        <Field label="CPF">
          <input
            value={form.cpf}
            onChange={onCpfChange}
            placeholder="000.000.000-00"
            inputMode="numeric"
            maxLength={14}
          />
          {fieldErrors.cpf && <small className="error-text">{fieldErrors.cpf}</small>}
        </Field>

        <Field label="E-mail">
          <input
            type="email"
            value={form.email}
            onChange={onEmailChange}
            placeholder="email@dominio.com"
          />
          {fieldErrors.email && <small className="error-text">{fieldErrors.email}</small>}
        </Field>

        <Field label="Telefone">
          <input
            type="tel"
            value={form.telefone}
            onChange={onTelefoneChange}
            placeholder="(83) 99999-9999"
            inputMode="numeric"
            maxLength={15}
          />
          {fieldErrors.telefone && <small className="error-text">{fieldErrors.telefone}</small>}
        </Field>

        <Field label="CEP">
          <input
            value={form.cep}
            onChange={onCepChange}
            placeholder="00000-000"
            inputMode="numeric"
            maxLength={9}
          />
          {fieldErrors.cep && <small className="error-text">{fieldErrors.cep}</small>}
        </Field>

        <Field label="Estado (UF)">
          <div style={{ position: "relative" }}>
            <input
              placeholder="Pesquise por UF ou nome (ex: PB ou Paraíba)"
              value={ufQuery}
              onFocus={() => setShowUfList(true)}
              onChange={(e) => {
                const v = e.target.value;
                setUfQuery(v);
                setForm((prev) => ({
                  ...prev,
                  uf: "",
                  uf_id: null,
                  cidade: "",
                  cidade_id: null,
                }));
                setCidadeQuery("");
                setShowUfList(true);
              }}
              onBlur={() => setTimeout(() => setShowUfList(false), 150)}
              autoComplete="off"
            />

            {showUfList && (
              <div
                style={{
                  position: "absolute",
                  zIndex: 20,
                  top: "100%",
                  left: 0,
                  right: 0,
                  maxHeight: 220,
                  overflowY: "auto",
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  marginTop: 4,
                }}
              >
                {ufsLoading && <div style={{ padding: 10 }}>Carregando estados...</div>}
                {!ufsLoading && ufs.length === 0 && (
                  <div style={{ padding: 10 }}>Nenhum estado encontrado.</div>
                )}

                {!ufsLoading &&
                  ufs.map((u) => (
                    <button
                      type="button"
                      key={u.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectUf(u)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 12px",
                        border: 0,
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    >
                      {u.sigla} - {u.nome}
                    </button>
                  ))}
              </div>
            )}
          </div>
          {fieldErrors.uf && <small className="error-text">{fieldErrors.uf}</small>}
        </Field>

        <Field label="Cidade">
          <div style={{ position: "relative" }}>
            <input
              placeholder={form.uf ? "Pesquise a cidade" : "Selecione uma UF primeiro"}
              value={cidadeQuery}
              disabled={!form.uf_id}
              onFocus={() => form.uf && setShowCidadeList(true)}
              onChange={(e) => {
                const v = e.target.value;
                setCidadeQuery(v);
                setForm((prev) => ({
                  ...prev,
                  cidade: "",
                  cidade_id: null,
                }));
                if (form.uf_id) setShowCidadeList(true);
              }}
              onBlur={() => setTimeout(() => setShowCidadeList(false), 150)}
              autoComplete="off"
            />

            {form.uf && showCidadeList && (
              <div
                style={{
                  position: "absolute",
                  zIndex: 20,
                  top: "100%",
                  left: 0,
                  right: 0,
                  maxHeight: 220,
                  overflowY: "auto",
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  marginTop: 4,
                }}
              >
                {cidadesLoading && <div style={{ padding: 10 }}>Carregando cidades...</div>}
                {!cidadesLoading && cidades.length === 0 && (
                  <div style={{ padding: 10 }}>Nenhuma cidade encontrada.</div>
                )}

                {!cidadesLoading &&
                  cidades.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectCidade(c)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 12px",
                        border: 0,
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    >
                      {c.nome}
                    </button>
                  ))}
              </div>
            )}
          </div>
          {fieldErrors.cidade && <small className="error-text">{fieldErrors.cidade}</small>}
        </Field>

        <Field label="Logradouro">
          <input
            value={form.logradouro}
            onChange={(e) => {
              set("logradouro", e.target.value);
              clearFieldError("logradouro");
            }}
          />
          {fieldErrors.logradouro && (
            <small className="error-text">{fieldErrors.logradouro}</small>
          )}
        </Field>

        <Field label="Número">
          <input value={form.numero} onChange={(e) => set("numero", e.target.value)} />
        </Field>

        <Field label="Complemento">
          <input value={form.complemento} onChange={(e) => set("complemento", e.target.value)} />
        </Field>

        <Field label="Bairro">
          <input
            value={form.bairro}
            onChange={(e) => {
              set("bairro", e.target.value);
              clearFieldError("bairro");
            }}
          />
          {fieldErrors.bairro && <small className="error-text">{fieldErrors.bairro}</small>}
        </Field>

        <div className="form-actions">
          <button type="button" className="btn" onClick={() => nav(-1)}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            type="submit"
            onClick={submit}
          >
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
