import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { animaisApi, atendimentosApi, usersApi } from "../../api/endpoints";
import { Field } from "../../components/Field";
import { useAuth } from "../../auth/AuthContext"; // ajuste o path se o seu for diferente

const RESPONSAVEL_INFO_OPTIONS = [
  { value: "PROPRIETARIO", label: "Proprietário" },
  { value: "TRATADOR", label: "Tratador" },
  { value: "VAQUEIRO", label: "Vaqueiro" },
  { value: "VETERINARIO", label: "Veterinário" },
  { value: "OUTRO", label: "Outro" }
];

const QUEM_INDICOU_OPTIONS = [
  { value: "VETERINARIO", label: "Veterinário" },
  { value: "BALCONISTA", label: "Balconista" },
  { value: "AUX_VETERINARIO", label: "Aux. Veterinário" },
  { value: "VAQUEIRO", label: "Vaqueiro" },
  { value: "PROPRIETARIO", label: "Proprietário" },
  { value: "OUTRO", label: "Outro" }
];

const RESPONSAVEL_INFO_LABEL_TO_VALUE = {
  "PROPRIETÁRIO": "PROPRIETARIO",
  PROPRIETARIO: "PROPRIETARIO",
  TRATADOR: "TRATADOR",
  VAQUEIRO: "VAQUEIRO",
  "VETERINÁRIO": "VETERINARIO",
  VETERINARIO: "VETERINARIO",
  OUTRO: "OUTRO"
};

const QUEM_INDICOU_LABEL_TO_VALUE = {
  "VETERINÁRIO": "VETERINARIO",
  VETERINARIO: "VETERINARIO",
  BALCONISTA: "BALCONISTA",
  "AUX. VETERINÁRIO": "AUX_VETERINARIO",
  "AUX. VETERINARIO": "AUX_VETERINARIO",
  "AUX VETERINÁRIO": "AUX_VETERINARIO",
  "AUX VETERINARIO": "AUX_VETERINARIO",
  VAQUEIRO: "VAQUEIRO",
  "PROPRIETÁRIO": "PROPRIETARIO",
  PROPRIETARIO: "PROPRIETARIO",
  OUTRO: "OUTRO"
};

function labelFromValue(options, value) {
  return options.find((o) => o.value === value)?.label || "";
}

function normalizeFromDb(raw, map) {
  if (!raw) return { tipo: "", outro: "" };

  const txt = String(raw).trim();
  const upper = txt.toUpperCase();

  const mapped = map[upper];
  if (mapped && mapped !== "OUTRO") return { tipo: mapped, outro: "" };
  if (mapped === "OUTRO") return { tipo: "OUTRO", outro: "" };

  return { tipo: "OUTRO", outro: txt };
}

function toDateOnly(value) {
  if (!value) return "";
  const s = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}\s/.test(s)) return s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  return "";
}

function fromDateOnly(value) {
  if (!value) return null;
  return value;
}

export default function AtendimentoFormPage({ mode }) {
  const { id } = useParams();
  const nav = useNavigate();
  const isEdit = mode === "edit";

  const { user, loading: authLoading } = useAuth();

  const [animais, setAnimais] = useState([]);
  const [users, setUsers] = useState([]); // lista de usuários (apenas para ADMIN)
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const isAdmin = user?.perfil === "ADMIN";
  const isVet = user?.perfil === "VETERINARIO";

  const [form, setForm] = useState({
    animal_id: "",
    veterinario_id: "",
    data_atendimento: "",

    responsavel_informacoes_tipo: "",
    responsavel_informacoes_outro: "",

    realizou_tratamento: "NAO",

    quem_indicou_tipo: "",
    quem_indicou_outro: "",

    tempo_posse_cuida: "",
    frequencia_cuidados: "",
    duracao_doenca: "",
    historico_doenca: "",
    tratamento_realizado: "",
    houve_melhora: "NAO_SE_APLICA",

    doenca_pregressa_tem: "NAO",
    doenca_pregressa: "",

    distancia_hv_km: "",
    comentario_geral: ""
  });

  // Carrega dados iniciais conforme perfil
  useEffect(() => {
    if (authLoading) return;

    (async () => {
      try {
        setError("");

        // Animais sempre (se der 403, precisa ajustar permissão/endpoints no backend)
        const animaisResp = await animaisApi.list();
        setAnimais(animaisResp);

        if (isAdmin) {
          // ✅ ADMIN: lista todos os usuários e permite escolher
          const list = await usersApi.list();
          setUsers(Array.isArray(list) ? list : []);
        } else {
          // ✅ VET (ou outros): não lista usuários
          setUsers([]);
        }

        // ✅ se for VETERINARIO, fixa o veterinário logado
        if (isVet && user?.id) {
          setForm((f) => ({ ...f, veterinario_id: user.id }));
        }
      } catch (e) {
        setError(e?.message || "Erro ao carregar dados iniciais.");
      }
    })();
  }, [authLoading, isAdmin, isVet, user?.id]);

  // Carrega dados do atendimento para edição
  useEffect(() => {
    if (!isEdit || !id) return;
    if (authLoading) return;

    atendimentosApi
      .get(id)
      .then((d) => {
        const a = d.atendimento;

        const respInfo = normalizeFromDb(a.responsavel_informacoes_nome, RESPONSAVEL_INFO_LABEL_TO_VALUE);
        const quemIndicou = normalizeFromDb(a.quem_indicou, QUEM_INDICOU_LABEL_TO_VALUE);

        const doencaPregressaTexto = a.doenca_pregressa || "";
        const doencaPregressaTem = doencaPregressaTexto.trim() !== "" ? "SIM" : "NAO";

        const tratamentoTexto = a.tratamento_realizado || "";
        const realizouTratamento = tratamentoTexto.trim() !== "" ? "SIM" : "NAO";

        setForm((prev) => ({
          ...prev,
          animal_id: a.animal_id || "",

          // ✅ ADMIN mantém o que veio do banco (e pode trocar no select)
          // ✅ VET força para ele mesmo (evita editar atendimento de outro vet e bater 403)
          veterinario_id: isVet ? (user?.id || a.veterinario_id || "") : (a.veterinario_id || ""),

          data_atendimento: toDateOnly(a.data_atendimento),

          responsavel_informacoes_tipo: respInfo.tipo,
          responsavel_informacoes_outro: respInfo.outro,

          realizou_tratamento: realizouTratamento,

          quem_indicou_tipo: realizouTratamento === "SIM" ? quemIndicou.tipo : "",
          quem_indicou_outro: realizouTratamento === "SIM" ? quemIndicou.outro : "",

          tempo_posse_cuida: a.tempo_posse_cuida || "",
          frequencia_cuidados: a.frequencia_cuidados || "",
          duracao_doenca: a.duracao_doenca || "",
          historico_doenca: a.historico_doenca || "",
          tratamento_realizado: tratamentoTexto,
          houve_melhora: realizouTratamento === "SIM" ? (a.houve_melhora || "NAO_SE_APLICA") : "NAO_SE_APLICA",

          doenca_pregressa_tem: doencaPregressaTem,
          doenca_pregressa: doencaPregressaTexto,

          distancia_hv_km: a.distancia_hv_km ?? "",
          comentario_geral: a.comentario_geral || ""
        }));
      })
      .catch((e) => setError(e.message || "Erro ao carregar atendimento."));
  }, [id, isEdit, authLoading, isVet, user?.id]);

  function clearFieldError(field) {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    clearFieldError(k);
  }

  function onChangeRealizouTratamento(value) {
    setForm((f) => {
      if (value === "NAO") {
        return {
          ...f,
          realizou_tratamento: "NAO",
          tratamento_realizado: "",
          quem_indicou_tipo: "",
          quem_indicou_outro: "",
          houve_melhora: "NAO_SE_APLICA"
        };
      }
      return { ...f, realizou_tratamento: "SIM" };
    });

    clearFieldError("realizou_tratamento");
    clearFieldError("tratamento_realizado");
    clearFieldError("quem_indicou_tipo");
    clearFieldError("quem_indicou_outro");
    clearFieldError("houve_melhora");
  }

  function validate() {
    const errors = {};

    if (!form.animal_id) errors.animal_id = "Selecione o animal.";
    if (!form.veterinario_id) errors.veterinario_id = "Selecione o veterinário.";

    if (!form.responsavel_informacoes_tipo) {
      errors.responsavel_informacoes_tipo = "Selecione o responsável pelas informações.";
    } else if (form.responsavel_informacoes_tipo === "OUTRO" && !form.responsavel_informacoes_outro.trim()) {
      errors.responsavel_informacoes_outro = "Informe qual é o responsável pelas informações.";
    }

    if (!form.realizou_tratamento) {
      errors.realizou_tratamento = "Selecione se realizou tratamento.";
    }

    if (form.realizou_tratamento === "SIM") {
      if (!form.tratamento_realizado.trim()) {
        errors.tratamento_realizado = "Descreva o tratamento realizado.";
      }

      if (!form.quem_indicou_tipo) {
        errors.quem_indicou_tipo = "Selecione quem indicou.";
      } else if (form.quem_indicou_tipo === "OUTRO" && !form.quem_indicou_outro.trim()) {
        errors.quem_indicou_outro = "Informe quem indicou.";
      }
    }

    if (form.doenca_pregressa_tem === "SIM" && !form.doenca_pregressa.trim()) {
      errors.doenca_pregressa = "Descreva a doença pregressa.";
    }

    if (form.distancia_hv_km !== "") {
      const n = Number(form.distancia_hv_km);
      if (Number.isNaN(n) || n < 0) errors.distancia_hv_km = "Informe uma distância válida (>= 0).";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (!validate()) return;

    try {
      const responsavelInfo =
        form.responsavel_informacoes_tipo === "OUTRO"
          ? form.responsavel_informacoes_outro.trim()
          : labelFromValue(RESPONSAVEL_INFO_OPTIONS, form.responsavel_informacoes_tipo);

      const quemIndicou =
        form.realizou_tratamento === "SIM"
          ? form.quem_indicou_tipo === "OUTRO"
            ? form.quem_indicou_outro.trim()
            : labelFromValue(QUEM_INDICOU_OPTIONS, form.quem_indicou_tipo)
          : "";

      // ✅ garante regra de segurança: se é vet, sempre manda ele mesmo
      const veterinarioIdFinal = isVet ? user?.id : form.veterinario_id;

      const payload = {
        animal_id: form.animal_id,
        veterinario_id: veterinarioIdFinal,
        data_atendimento: fromDateOnly(form.data_atendimento),

        responsavel_informacoes_nome: responsavelInfo,
        tempo_posse_cuida: form.tempo_posse_cuida,
        frequencia_cuidados: form.frequencia_cuidados,
        duracao_doenca: form.duracao_doenca,
        historico_doenca: form.historico_doenca,

        tratamento_realizado: form.realizou_tratamento === "SIM" ? form.tratamento_realizado : "",
        quem_indicou: quemIndicou,
        houve_melhora: form.realizou_tratamento === "SIM" ? form.houve_melhora : "NAO_SE_APLICA",

        doenca_pregressa: form.doenca_pregressa_tem === "SIM" ? form.doenca_pregressa : "",
        distancia_hv_km: form.distancia_hv_km === "" ? null : Number(form.distancia_hv_km),
        comentario_geral: form.comentario_geral
      };

      if (isEdit) {
        await atendimentosApi.update(id, payload);
        nav(`/atendimentos/${id}/ver`);
      } else {
        const created = await atendimentosApi.create(payload);
        nav(`/atendimentos/${created.id}/bloco/manejo-sanitario`);
      }
    } catch (e2) {
      setError(e2.message || "Erro ao salvar atendimento.");
    }
  }

  const vetLabel = useMemo(() => {
    if (isVet && user) return `${user.nome}${user.crmv ? ` (${user.crmv})` : ""}`;
    if (!form.veterinario_id) return "—";

    const u = users.find((x) => x.id === form.veterinario_id);
    if (!u) return `ID: ${form.veterinario_id}`;
    return `${u.nome}${u.crmv ? ` (${u.crmv})` : ""} - ${u.perfil}`;
  }, [isVet, user, users, form.veterinario_id]);

  if (authLoading) return <div className="page">Carregando usuário...</div>;
  if (!user) return <div className="page"><div className="alert">Você precisa estar logado.</div></div>;

  return (
    <div className="page">
      <h2>{isEdit ? "Editar atendimento" : "Novo atendimento"}</h2>
      {error && <div className="alert">{error}</div>}

      <form className="card form-grid" onSubmit={submit}>
        <Field label="Animal">
          <select value={form.animal_id} onChange={(e) => set("animal_id", e.target.value)}>
            <option value="">Selecione</option>
            {animais.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome} ({a.especie}) - {a.responsavel_nome}
              </option>
            ))}
          </select>
          {fieldErrors.animal_id && <small className="error-text">{fieldErrors.animal_id}</small>}
        </Field>

        {/* ✅ Veterinário: ADMIN escolhe, VET fica fixo */}
        {isAdmin ? (
          <Field label="Veterinário">
            <select
              value={form.veterinario_id}
              onChange={(e) => set("veterinario_id", e.target.value)}
            >
              <option value="">Selecione</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome} {u.crmv ? `(${u.crmv})` : ""} - {u.perfil}
                </option>
              ))}
            </select>
            {fieldErrors.veterinario_id && <small className="error-text">{fieldErrors.veterinario_id}</small>}
          </Field>
        ) : (
          <Field label="Veterinário (logado)">
            <input value={vetLabel} disabled />
            {fieldErrors.veterinario_id && <small className="error-text">{fieldErrors.veterinario_id}</small>}
          </Field>
        )}

        <Field label="Data">
          <input
            type="date"
            value={form.data_atendimento}
            onChange={(e) => set("data_atendimento", e.target.value)}
          />
        </Field>

        <Field label="Responsável pelas informações">
          <select
            value={form.responsavel_informacoes_tipo}
            onChange={(e) => {
              const v = e.target.value;
              set("responsavel_informacoes_tipo", v);
              if (v !== "OUTRO") set("responsavel_informacoes_outro", "");
            }}
          >
            <option value="">Selecione</option>
            {RESPONSAVEL_INFO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {fieldErrors.responsavel_informacoes_tipo && (
            <small className="error-text">{fieldErrors.responsavel_informacoes_tipo}</small>
          )}
        </Field>

        {form.responsavel_informacoes_tipo === "OUTRO" && (
          <Field label="Informe qual (Responsável pelas informações)">
            <input
              value={form.responsavel_informacoes_outro}
              onChange={(e) => set("responsavel_informacoes_outro", e.target.value)}
              placeholder="Digite aqui..."
            />
            {fieldErrors.responsavel_informacoes_outro && (
              <small className="error-text">{fieldErrors.responsavel_informacoes_outro}</small>
            )}
          </Field>
        )}

        <Field label="Tempo de posse/cuida">
          <input value={form.tempo_posse_cuida} onChange={(e) => set("tempo_posse_cuida", e.target.value)} />
        </Field>

        <Field label="Frequência de cuidados">
          <input value={form.frequencia_cuidados} onChange={(e) => set("frequencia_cuidados", e.target.value)} />
        </Field>

        <Field label="Duração da doença">
          <input value={form.duracao_doenca} onChange={(e) => set("duracao_doenca", e.target.value)} />
        </Field>

        <Field label="Distância ao HV (km)">
          <input
            type="number"
            step="1"
            min="0"
            value={form.distancia_hv_km}
            onChange={(e) => set("distancia_hv_km", e.target.value)}
          />
          {fieldErrors.distancia_hv_km && <small className="error-text">{fieldErrors.distancia_hv_km}</small>}
        </Field>

        <div className="form-col-span-2">
          <Field label="Histórico da doença">
            <textarea
              className="textarea-xl"
              value={form.historico_doenca}
              onChange={(e) => set("historico_doenca", e.target.value)}
              placeholder="Descreva o histórico da doença..."
            />
          </Field>
        </div>

        <Field label="Realizou tratamento">
          <select value={form.realizou_tratamento} onChange={(e) => onChangeRealizouTratamento(e.target.value)}>
            <option value="NAO">NAO</option>
            <option value="SIM">SIM</option>
          </select>
          {fieldErrors.realizou_tratamento && <small className="error-text">{fieldErrors.realizou_tratamento}</small>}
        </Field>

        {form.realizou_tratamento === "SIM" && (
          <>
            <div className="form-col-span-2">
              <Field label="Tratamento realizado">
                <textarea
                  className="textarea-xl"
                  value={form.tratamento_realizado}
                  onChange={(e) => set("tratamento_realizado", e.target.value)}
                  placeholder="Descreva os tratamentos já realizados..."
                />
                {fieldErrors.tratamento_realizado && (
                  <small className="error-text">{fieldErrors.tratamento_realizado}</small>
                )}
              </Field>
            </div>

            <Field label="Quem indicou">
              <select
                value={form.quem_indicou_tipo}
                onChange={(e) => {
                  const v = e.target.value;
                  set("quem_indicou_tipo", v);
                  if (v !== "OUTRO") set("quem_indicou_outro", "");
                }}
              >
                <option value="">Selecione</option>
                {QUEM_INDICOU_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {fieldErrors.quem_indicou_tipo && (
                <small className="error-text">{fieldErrors.quem_indicou_tipo}</small>
              )}
            </Field>

            {form.quem_indicou_tipo === "OUTRO" && (
              <Field label="Informe qual (Quem indicou)">
                <input
                  value={form.quem_indicou_outro}
                  onChange={(e) => set("quem_indicou_outro", e.target.value)}
                  placeholder="Digite aqui..."
                />
                {fieldErrors.quem_indicou_outro && (
                  <small className="error-text">{fieldErrors.quem_indicou_outro}</small>
                )}
              </Field>
            )}

            <Field label="Houve melhora">
              <select value={form.houve_melhora} onChange={(e) => set("houve_melhora", e.target.value)}>
                <option value="SIM">SIM</option>
                <option value="NAO">NAO</option>
                <option value="NAO_SE_APLICA">NÃO SE APLICA</option>
              </select>
            </Field>
          </>
        )}

        <Field label="Doença pregressa">
          <select
            value={form.doenca_pregressa_tem}
            onChange={(e) => {
              const v = e.target.value;
              set("doenca_pregressa_tem", v);
              if (v === "NAO") set("doenca_pregressa", "");
            }}
          >
            <option value="NAO">NAO</option>
            <option value="SIM">SIM</option>
          </select>
        </Field>

        {form.doenca_pregressa_tem === "SIM" && (
          <div className="form-col-span-2">
            <Field label="Descreva a doença pregressa">
              <textarea
                className="textarea-xl"
                value={form.doenca_pregressa}
                onChange={(e) => set("doenca_pregressa", e.target.value)}
                placeholder="Informe doenças anteriores relevantes..."
              />
              {fieldErrors.doenca_pregressa && (
                <small className="error-text">{fieldErrors.doenca_pregressa}</small>
              )}
            </Field>
          </div>
        )}

        <div className="form-col-span-2">
          <Field label="Comentário geral">
            <textarea
              className="textarea-xl"
              value={form.comentario_geral}
              onChange={(e) => set("comentario_geral", e.target.value)}
              placeholder="Observações gerais do atendimento..."
            />
          </Field>
        </div>

        <div className="form-actions">
          <button type="button" className="btn" onClick={() => nav(-1)}>
            Cancelar
          </button>
          <button className="btn btn-primary" type="submit">
            Salvar e Continuar
          </button>
        </div>
      </form>

      {isEdit && (
        <div className="card">
          <h3>Blocos complementares</h3>
          <div className="row-actions">
            <Link className="btn" to={`/atendimentos/${id}/bloco/manejo-sanitario`}>Manejo Sanitário</Link>
            <Link className="btn" to={`/atendimentos/${id}/bloco/manejo-nutricional`}>Manejo Nutricional</Link>
            <Link className="btn" to={`/atendimentos/${id}/bloco/ambiente-epidemiologia`}>Ambiente/Epidemiologia</Link>
            <Link className="btn" to={`/atendimentos/${id}/bloco/exame-fisico`}>Exame Físico</Link>
            <Link className="btn" to={`/atendimentos/${id}/bloco/exames-complementares`}>Exames Complementares</Link>
            <Link className="btn" to={`/atendimentos/${id}/bloco/conduta`}>Conduta</Link>
          </div>
        </div>
      )}
    </div>
  );
}