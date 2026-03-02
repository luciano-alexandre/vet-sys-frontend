import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { atendimentosApi } from "../../api/endpoints";
import { Field } from "../../components/Field";
import ConfirmButton from "../../components/ConfirmButton";

import {
  CONCENTRADO_TIPOS,
  VOLUMOSO_TIPOS,
  VOLUMOSO_ESTAGIOS,
  VOLUMOSO_FORMAS,
  AGUA_FORNECIMENTO_OPCOES,
  AGUA_QUALIDADE_OPCOES,
  BAIA_TIPOS,
  CAMA_OPCOES,
  SIM_NAO
} from "./atendimento.constants";

function normalizeKey(v) {
  return String(v ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

function mapTextToSelectWithOutro(text, options) {
  const raw = String(text ?? "").trim();
  if (!raw) return { sel: "", outro: "" };

  const norm = normalizeKey(raw);
  const found = options.find((o) => o.value === norm || normalizeKey(o.label) === norm);

  if (found) return { sel: found.value, outro: "" };
  return { sel: "OUTRO", outro: raw };
}

function resolveSelectWithOutroToText(sel, outro, options) {
  const s = String(sel ?? "").trim();
  if (!s) return "";

  if (s === "OUTRO") return String(outro ?? "").trim();

  const opt = options.find((o) => o.value === s);
  return opt ? opt.label : "";
}

/** ✅ NOVO: opções de desfecho + helper para data de hoje */
const DESFECHO_OPCOES = [
  { key: "ALTA", label: "Alta" },
  { key: "RETORNO", label: "Retorno" },
  { key: "CIRURGIA", label: "Cirurgia" },
  { key: "INTERNAMENTO", label: "Internamento" },
  { key: "PATOLOGIA", label: "Patologia" },
  { key: "OBITO", label: "Óbito" },
  { key: "EUTANASIA", label: "Eutanásia" }
];

function todayISODate() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

const tipos = {
  "manejo-sanitario": {
    title: "Manejo Sanitário",
    fields: [
      ["vacinacao_realiza", "Vacinação realizada"],
      ["vacinacao_tipo_marca", "Vacinação tipo/marca"],
      ["vacinacao_frequencia", "Vacinação frequência"],
      ["vermifugacao_realiza", "Vermifugação realizada"],
      ["vermifugacao_tipo_marca", "Vermifugação  tipo/marca"],
      ["vermifugacao_frequencia", "Vermifugação  frequência"],
      ["controle_ectoparasitas_realiza", "Controle ectoparasitas realizado"],
      ["controle_ectoparasitas_tipo", "Controle ectoparasitas tipo/marca"],
      ["controle_ectoparasitas_freq", "Controle ectoparasitas frequência"],
      ["comentarios", "Comentários", "textarea"]
    ],
    upsert: (id, payload) => atendimentosApi.upsertManejoSanitario(id, payload),
    fromGet: (d) => d.manejo_sanitario || {}
  },

  "manejo-nutricional": {
    title: "Manejo Nutricional",
    fields: [
      ["concentrado_tipo", "Concentrado tipo"],
      ["concentrado_marca", "Concentrado marca"],
      ["concentrado_percentual", "Concentrado percentual"],

      ["concentrado_ofertas_dia", "Concentrado ofertas/dia", "number"],
      ["concentrado_peso_oferta_kg", "Concentrado peso oferta kg", "number"],

      ["volumoso_tipo", "Volumoso tipo"],
      ["volumoso_forma", "Volumoso forma"],
      ["volumoso_estagio", "Volumoso estágio"],
      ["volumoso_peso_kg", "Volumoso peso kg", "number"],
      ["volumoso_ofertas_dia", "Volumoso ofertas/dia", "number"],

      ["oferta_sal", "Oferta Sal"],
      ["sal_tipo", "Tipo de Sal"],
      ["sal_quantidade", "Quantidade de Sal"],

      ["oferta_suplemento", "Oferta Suplemento"],
      ["suplemento_tipo", "Tipo de Suplemento"],
      ["suplemento_quantidade", "Quantidade de Suplemento"],

      ["agua_fornecimento", "Fornecimento de Água"],
      ["agua_fornecimento_outro", "Fornecimento de Água(outro)"],
      ["agua_qualidade", "Qualidade da Água"],
      ["agua_qualidade_outro", "Qualidade da Água(outro)"],
      ["comentarios", "Comentários", "textarea"]
    ],
    upsert: (id, payload) => atendimentosApi.upsertManejoNutricional(id, payload),
    fromGet: (d) => d.manejo_nutricional || {}
  },

  "ambiente-epidemiologia": {
    title: "Ambiente e Epidemiologia",
    fields: [
      ["baia_tipo_construcao", "Tipo de Baia"],
      ["cama", "Cama"],
      ["ventilacao", "Ventilação"],
      ["n_animais_mesma_especie", "Nº animais mesma espécie", "number"],
      ["morreu_algum", "Morreu algum"],
      ["algum_caso_vizinhanca", "Caso na vizinhança"],
      ["contato_outras_especies", "Contato outras espécies"],
      ["diferenca_faixa_etaria", "Diferença faixa etária"],
      ["usou_veneno_adubo_pasto", "Uso veneno/adubo no pasto"],
      ["higiene_geral", "Higiene geral"],
      ["comentarios", "Comentários", "textarea"]
    ],
    upsert: (id, payload) => atendimentosApi.upsertAmbienteEpidemiologia(id, payload),
    fromGet: (d) => d.ambiente_epidemiologia || {}
  },

  "exame-fisico": {
    title: "Exame Físico",
    fields: [
      ["estado_nutricional", "Estado nutricional"],
      ["desidratacao", "Desidratação"],
      ["mucosa", "Mucosa"],
      ["tpc_segundos", "TPC (segundos)", "number"],
      ["conduta_comportamento", "Conduta/comportamento"],
      ["atitude_postura", "Atitude/postura"],
      ["pulso_digital", "Pulso digital"],
      ["temperatura_c", "Temperatura (°C)", "number"],
      ["fc_bpm", "FC (bpm)", "number"],
      ["fr_mpm", "FR (mpm)", "number"],
      ["movimentos_intestinais_rumen", "Mov. intestinais/rumen"],
      ["grau_dor", "Grau de dor"],
      ["anormalidades", "Anormalidades", "textarea"]
    ],
    upsert: (id, payload) => atendimentosApi.upsertExameFisico(id, payload),
    fromGet: (d) => d.exame_fisico || {}
  },

  "exames-complementares": {
    title: "Exames Complementares",
    fields: [
      ["hemograma", "Hemograma"],
      ["bioquimica", "Bioquímica"],
      ["imagem", "Imagem"],
      ["cultura", "Cultura"],
      ["histopatologico", "Histopatológico"],
      ["necropsia", "Necropsia"],
      ["opg", "OPG"],
      ["outros", "Outros", "textarea"],
      ["comentarios", "Comentários", "textarea"]
    ],
    upsert: (id, payload) => atendimentosApi.upsertExamesComplementares(id, payload),

    fromGet: (d) => {
      const base = d.exames_complementares || {};
      if (base.outros == null && base.detalhes != null) base.outros = base.detalhes;
      return base;
    }
  },

  // ✅ ALTERAÇÃO: adiciona diagnostico_tipo e controla habilitação do textarea
  conduta: {
    title: "Conduta",
    fields: [
      ["diagnostico", "Diagnóstico", "textarea"],
      ["prognostico_vida", "Prognóstico de vida"],
      ["prognostico_funcao", "Prognóstico de função"],
      ["tratamento", "Tratamento", "textarea"],
      ["desfecho", "Desfecho"],
      ["desfecho_data", "Data desfecho", "date"],
      ["observacao_desfecho", "Observação desfecho", "textarea"]
    ],
    upsert: (id, payload) => atendimentosApi.upsertConduta(id, payload),
    fromGet: (d) => d.conduta || {}
  }
};

export default function AtendimentoBlocoPage() {
  const { id, tipo } = useParams();
  const nav = useNavigate();

  const cfg = useMemo(() => tipos[tipo], [tipo]);
  const [form, setForm] = useState({});
  const [parts, setParts] = useState([]);
  const [pNome, setPNome] = useState("");
  const [pPapel, setPPapel] = useState("");
  const [pObs, setPObs] = useState("");
  const [error, setError] = useState("");

  const [concentrados, setConcentrados] = useState([]);
  const [volumosos, setVolumosos] = useState([]);

  useEffect(() => {
    if (!cfg) return;

    atendimentosApi
      .get(id)
      .then((d) => {
        const base = cfg.fromGet(d) || {};

        if (tipo === "manejo-sanitario") {
          const vac = String(base.vacinacao_realiza ?? "").toUpperCase();
          base.vacinacao_realiza = vac === "SIM" ? "SIM" : "NAO";

          const verm = String(base.vermifugacao_realiza ?? "").toUpperCase();
          base.vermifugacao_realiza = verm === "SIM" ? "SIM" : "NAO";

          const ecto = String(base.controle_ectoparasitas_realiza ?? "").toUpperCase();
          base.controle_ectoparasitas_realiza = ecto === "SIM" ? "SIM" : "NAO";
        }

        if (tipo === "manejo-nutricional") {
          base.oferta_sal = String(base.oferta_sal ?? "NAO").toUpperCase() === "SIM" ? "SIM" : "NAO";
          base.oferta_suplemento =
            String(base.oferta_suplemento ?? "NAO").toUpperCase() === "SIM" ? "SIM" : "NAO";

          const aguaFornecUp = String(base.agua_fornecimento || "")
            .trim()
            .toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "_");

          const aguaQualUp = String(base.agua_qualidade || "")
            .trim()
            .toUpperCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "_");

          base.agua_fornecimento = AGUA_FORNECIMENTO_OPCOES.some((o) => o.value === aguaFornecUp)
            ? aguaFornecUp
            : "";
          base.agua_qualidade = AGUA_QUALIDADE_OPCOES.some((o) => o.value === aguaQualUp) ? aguaQualUp : "";

          if (base.oferta_sal !== "SIM") {
            base.sal_tipo = "";
            base.sal_quantidade = "";
          }
          if (base.oferta_suplemento !== "SIM") {
            base.suplemento_tipo = "";
            base.suplemento_quantidade = "";
          }
          if (base.agua_fornecimento !== "OUTRO") {
            base.agua_fornecimento_outro = "";
          }
          if (base.agua_qualidade !== "OUTRO") {
            base.agua_qualidade_outro = "";
          }

          const listaConc = Array.isArray(base.concentrados) ? base.concentrados : [];
          setConcentrados(
            listaConc.map((c) => ({
              id: c.id ?? null,
              tipo: c.tipo ?? "",
              outro_descricao: c.outro_descricao ?? "",
              marca: c.marca ?? "",
              percentual: c.percentual ?? ""
            }))
          );

          const listaVol = Array.isArray(base.volumosos) ? base.volumosos : [];
          setVolumosos(
            listaVol.map((v) => {
              const estagioUp = String(v.estagio || "").toUpperCase();
              const formaUp = String(v.forma || "")
                .trim()
                .toUpperCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/\s+/g, "_");

              return {
                id: v.id ?? null,
                tipo: v.tipo ?? "",
                outro_descricao: v.outro_descricao ?? "",
                forma: ["IN_NATURA", "PICADO", "PASTEJO", "OUTRO"].includes(formaUp) ? formaUp : "",
                forma_outro: v.forma_outro ?? "",
                estagio: ["MADURO", "VERDE", "SECO"].includes(estagioUp) ? estagioUp : "",
                percentual: v.percentual ?? ""
              };
            })
          );
        } else {
          setConcentrados([]);
          setVolumosos([]);
        }

        if (tipo === "ambiente-epidemiologia") {
          if (base.sistema_criacao_extensivo_pct == null) base.sistema_criacao_extensivo_pct = "";
          if (base.sistema_criacao_intensivo_pct == null) base.sistema_criacao_intensivo_pct = "";
          delete base.sistema_criacao;

          const baia = mapTextToSelectWithOutro(base.baia_tipo_construcao, BAIA_TIPOS);
          base.baia_tipo_construcao_sel = baia.sel;
          base.baia_tipo_construcao_outro = baia.outro;

          const cama = mapTextToSelectWithOutro(base.cama, CAMA_OPCOES);
          base.cama_sel = cama.sel;
          base.cama_outro = cama.outro;

          base.morreu_algum = String(base.morreu_algum ?? "NAO").toUpperCase() === "SIM" ? "SIM" : "NAO";
          base.algum_caso_vizinhanca =
            String(base.algum_caso_vizinhanca ?? "NAO").toUpperCase() === "SIM" ? "SIM" : "NAO";
          base.contato_outras_especies =
            String(base.contato_outras_especies ?? "NAO").toUpperCase() === "SIM" ? "SIM" : "NAO";

          if (base.morreu_algum !== "SIM") base.morreu_algum_comentario = "";
          if (base.algum_caso_vizinhanca !== "SIM") base.algum_caso_vizinhanca_comentario = "";
          if (base.contato_outras_especies !== "SIM") base.contato_outras_especies_comentario = "";

          base.usou_veneno_adubo_pasto =
            String(base.usou_veneno_adubo_pasto ?? "NAO").toUpperCase() === "SIM" ? "SIM" : "NAO";
          if (base.usou_veneno_adubo_pasto !== "SIM") base.usou_veneno_adubo_pasto_comentario = "";
        }

        // ✅ defaults do Exame Físico (checkboxes) e migração opcional de campos antigos
        if (tipo === "exame-fisico") {
          // defaults
          const chkKeys = [
            "sistema_acometido_tegumentar",
            "sistema_acometido_digestorio",
            "sistema_acometido_respiratorio",
            "sistema_acometido_locomotor",
            "sistema_acometido_nervoso",
            "sistema_acometido_urogenital",
            "sistema_acometido_outro"
          ];
          chkKeys.forEach((k) => {
            base[k] = String(base[k] ?? "NAO").toUpperCase() === "SIM" ? "SIM" : "NAO";
          });
          if (base.sistema_acometido_outro !== "SIM")
            base.sistema_acometido_outro_desc = base.sistema_acometido_outro_desc ?? "";

          // migração opcional: se existirem campos antigos "anormalidade_*", marca checkbox e concatena no textarea
          const legacy = [
            ["anormalidade_tegumentar", "Tegumentar", "sistema_acometido_tegumentar"],
            ["anormalidade_digestorio", "Digestório", "sistema_acometido_digestorio"],
            ["anormalidade_respiratorio", "Respiratório", "sistema_acometido_respiratorio"],
            ["anormalidade_locomotor", "Locomotor", "sistema_acometido_locomotor"],
            ["anormalidade_nervoso", "Nervoso", "sistema_acometido_nervoso"],
            ["anormalidade_urogenital", "Urogenital", "sistema_acometido_urogenital"]
          ];

          const linhas = [];
          legacy.forEach(([k, titulo, chk]) => {
            const v = String(d.exame_fisico?.[k] ?? base[k] ?? "").trim();
            if (v) {
              base[chk] = "SIM";
              linhas.push(`${titulo}: ${v}`);
            }
            // remove do base caso tenha vindo junto (evita regravar lixo)
            delete base[k];
          });

          if (linhas.length) {
            const atual = String(base.anormalidades ?? "").trim();
            base.anormalidades = atual ? `${atual}\n${linhas.join("\n")}` : linhas.join("\n");
          }
        }

        // ✅ ALTERAÇÃO (Conduta): garante defaults do tipo do diagnóstico + desfecho novo
        if (tipo === "conduta") {
          const t = String(base.diagnostico_tipo ?? "").trim();
          base.diagnostico_tipo = t === "DEFINITIVO" || t === "PRESUNTIVO" ? t : "";
          // Se não escolheu tipo, mantém diagnostico como string, mas textarea ficará desabilitado no UI
          base.diagnostico = base.diagnostico ?? "";

          // ✅ NOVO: garante estrutura de desfechos
          if (!base.desfechos || typeof base.desfechos !== "object") base.desfechos = {};
          DESFECHO_OPCOES.forEach(({ key }) => {
            if (!base.desfechos[key]) {
              base.desfechos[key] = { checked: false, data: "", comentario: "" };
            } else {
              base.desfechos[key] = {
                checked: Boolean(base.desfechos[key].checked),
                data: String(base.desfechos[key].data ?? ""),
                comentario: String(base.desfechos[key].comentario ?? "")
              };
            }
          });

          // mantém campos antigos (não remove do objeto), mas não vamos renderizar nem enviar
          base.desfecho = base.desfecho ?? "";
          base.desfecho_data = base.desfecho_data ?? "";
          base.observacao_desfecho = base.observacao_desfecho ?? "";
        }

        setForm(base);
        setParts(d.participantes || []);
      })
      .catch((e) => setError(e.message));
  }, [id, cfg, tipo]);

  if (!cfg) {
    return (
      <div className="page">
        <div className="alert">Bloco inválido.</div>
      </div>
    );
  }

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function addConcentrado() {
    setConcentrados((prev) => [...prev, { tipo: "", outro_descricao: "", marca: "", percentual: "" }]);
  }

  function removeConcentrado(index) {
    setConcentrados((prev) => prev.filter((_, i) => i !== index));
  }

  function setConcentrado(index, key, value) {
    setConcentrados((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, [key]: value };
        if (key === "tipo" && value !== "OUTRO") next.outro_descricao = "";
        return next;
      })
    );
  }

  function addVolumoso() {
    setVolumosos((prev) => [
      ...prev,
      { tipo: "", outro_descricao: "", forma: "", forma_outro: "", estagio: "", percentual: "" }
    ]);
  }

  function removeVolumoso(index) {
    setVolumosos((prev) => prev.filter((_, i) => i !== index));
  }

  function setVolumoso(index, key, value) {
    setVolumosos((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const next = { ...item, [key]: value };
        if (key === "tipo" && value !== "OUTRO") next.outro_descricao = "";
        if (key === "forma" && value !== "OUTRO") next.forma_outro = "";
        return next;
      })
    );
  }

  const somaPercentual = useMemo(() => {
    return concentrados.reduce((acc, c) => {
      const n = Number(c.percentual);
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);
  }, [concentrados]);

  const somaVolumosoPercentual = useMemo(() => {
    return volumosos.reduce((acc, v) => {
      const n = Number(v.percentual);
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);
  }, [volumosos]);

  const somaSistemaCriacao = useMemo(() => {
    const e = Number(form.sistema_criacao_extensivo_pct);
    const i = Number(form.sistema_criacao_intensivo_pct);
    return (Number.isFinite(e) ? e : 0) + (Number.isFinite(i) ? i : 0);
  }, [form.sistema_criacao_extensivo_pct, form.sistema_criacao_intensivo_pct]);

  async function save(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = { ...form };

      if (tipo === "manejo-sanitario") {
        if ((payload.vacinacao_realiza || "NAO") !== "SIM") {
          payload.vacinacao_tipo_marca = "";
          payload.vacinacao_frequencia = "";
          payload.vacinacao_realiza = "NAO";
        } else {
          payload.vacinacao_realiza = "SIM";
        }

        if ((payload.vermifugacao_realiza || "NAO") !== "SIM") {
          payload.vermifugacao_tipo_marca = "";
          payload.vermifugacao_frequencia = "";
          payload.vermifugacao_realiza = "NAO";
        } else {
          payload.vermifugacao_realiza = "SIM";
        }

        if ((payload.controle_ectoparasitas_realiza || "NAO") !== "SIM") {
          payload.controle_ectoparasitas_tipo = "";
          payload.controle_ectoparasitas_freq = "";
          payload.controle_ectoparasitas_realiza = "NAO";
        } else {
          payload.controle_ectoparasitas_realiza = "SIM";
        }
      }

      if (tipo === "exame-fisico") {
        if (payload.estado_nutricional !== "" && payload.estado_nutricional != null) {
          const n = Number(payload.estado_nutricional);
          if (!Number.isFinite(n) || n < 1 || n > 5) {
            throw new Error("Estado nutricional deve ser um número entre 1 e 5.");
          }
          payload.estado_nutricional = n;
        }

        // ✅ normaliza checkboxes
        const chkKeys = [
          "sistema_acometido_tegumentar",
          "sistema_acometido_digestorio",
          "sistema_acometido_respiratorio",
          "sistema_acometido_locomotor",
          "sistema_acometido_nervoso",
          "sistema_acometido_urogenital",
          "sistema_acometido_outro"
        ];
        chkKeys.forEach((k) => {
          payload[k] = (payload[k] || "NAO") === "SIM" ? "SIM" : "NAO";
        });

        if (payload.sistema_acometido_outro === "SIM") {
          const desc = String(payload.sistema_acometido_outro_desc || "").trim();
          if (!desc) throw new Error('Sistema Acometido: ao marcar "Outro", descreva qual.');
          payload.sistema_acometido_outro_desc = desc;
        } else {
          payload.sistema_acometido_outro_desc = "";
        }
      }

      if (tipo === "manejo-nutricional") {
        payload.oferta_sal = (payload.oferta_sal || "NAO") === "SIM" ? "SIM" : "NAO";
        payload.oferta_suplemento = (payload.oferta_suplemento || "NAO") === "SIM" ? "SIM" : "NAO";

        if (payload.oferta_sal !== "SIM") {
          payload.sal_tipo = "";
          payload.sal_quantidade = "";
        }

        if (payload.oferta_suplemento !== "SIM") {
          payload.suplemento_tipo = "";
          payload.suplemento_quantidade = "";
        }

        if (!payload.agua_fornecimento) {
          delete payload.agua_fornecimento;
          payload.agua_fornecimento_outro = "";
        } else if (payload.agua_fornecimento !== "OUTRO") {
          payload.agua_fornecimento_outro = "";
        } else {
          const fornecimentoOutro = String(payload.agua_fornecimento_outro || "").trim();
          if (!fornecimentoOutro) {
            throw new Error('Fornecimento de Água: ao selecionar "Outro", informe qual.');
          }
          payload.agua_fornecimento_outro = fornecimentoOutro;
        }

        if (!payload.agua_qualidade) {
          delete payload.agua_qualidade;
          payload.agua_qualidade_outro = "";
        } else if (payload.agua_qualidade !== "OUTRO") {
          payload.agua_qualidade_outro = "";
        } else {
          const qualidadeOutro = String(payload.agua_qualidade_outro || "").trim();
          if (!qualidadeOutro) {
            throw new Error('Qualidade da Água: ao selecionar "Outro", informe qual.');
          }
          payload.agua_qualidade_outro = qualidadeOutro;
        }

        if (concentrados.length > 0) {
          const tiposUsados = new Set();

          for (let i = 0; i < concentrados.length; i += 1) {
            const c = concentrados[i];
            const linha = i + 1;

            if (!c.tipo) throw new Error(`Concentrado #${linha}: selecione o tipo.`);

            if (c.tipo !== "OUTRO" && tiposUsados.has(c.tipo)) {
              throw new Error(`Concentrado #${linha}: tipo repetido.`);
            }
            if (c.tipo !== "OUTRO") tiposUsados.add(c.tipo);

            const p = Number(c.percentual);
            if (!Number.isFinite(p) || p < 0 || p > 100) {
              throw new Error(`Concentrado #${linha}: percentual deve estar entre 0 e 100.`);
            }

            if (c.tipo === "OUTRO" && !String(c.outro_descricao || "").trim()) {
              throw new Error(`Concentrado #${linha}: informe a descrição de "Outro".`);
            }
          }

          const soma = Math.round((somaPercentual + Number.EPSILON) * 100) / 100;
          if (soma !== 100) {
            throw new Error(`A soma dos percentuais do concentrado deve ser 100%. Atual: ${soma}%.`);
          }

          payload.concentrados = concentrados.map((c) => ({
            tipo: c.tipo,
            outro_descricao: c.tipo === "OUTRO" ? String(c.outro_descricao || "").trim() : null,
            marca: String(c.marca || "").trim() || null,
            percentual: Number(c.percentual)
          }));
        } else {
          delete payload.concentrados;
        }

        if (volumosos.length > 0) {
          const tiposVolUsados = new Set();

          for (let i = 0; i < volumosos.length; i += 1) {
            const v = volumosos[i];
            const linha = i + 1;

            if (!v.tipo) throw new Error(`Volumoso #${linha}: selecione o tipo.`);

            if (v.tipo !== "OUTRO" && tiposVolUsados.has(v.tipo)) {
              throw new Error(`Volumoso #${linha}: tipo repetido.`);
            }
            if (v.tipo !== "OUTRO") tiposVolUsados.add(v.tipo);

            if (!["IN_NATURA", "PICADO", "PASTEJO", "OUTRO"].includes(String(v.forma || "").toUpperCase())) {
              throw new Error(
                `Volumoso #${linha}: selecione uma forma válida (In natura, Picado, Pastejo ou Outro).`
              );
            }

            if (!["MADURO", "VERDE", "SECO"].includes(String(v.estagio || "").toUpperCase())) {
              throw new Error(`Volumoso #${linha}: selecione um estágio válido (Maduro, Verde ou Seco).`);
            }

            const p = Number(v.percentual);
            if (!Number.isFinite(p) || p < 0 || p > 100) {
              throw new Error(`Volumoso #${linha}: percentual deve estar entre 0 e 100.`);
            }

            if (v.tipo === "OUTRO" && !String(v.outro_descricao || "").trim()) {
              throw new Error(`Volumoso #${linha}: informe a descrição de "Outro".`);
            }

            if (String(v.forma || "").toUpperCase() === "OUTRO" && !String(v.forma_outro || "").trim()) {
              throw new Error(`Volumoso #${linha}: ao selecionar forma "Outro", informe a descrição.`);
            }
          }

          const somaVol = Math.round((somaVolumosoPercentual + Number.EPSILON) * 100) / 100;
          if (somaVol !== 100) {
            throw new Error(`A soma dos percentuais do volumoso deve ser 100%. Atual: ${somaVol}%.`);
          }

          payload.volumosos = volumosos.map((v) => ({
            tipo: v.tipo,
            outro_descricao: v.tipo === "OUTRO" ? String(v.outro_descricao || "").trim() : null,
            forma: String(v.forma || "").toUpperCase() || null,
            forma_outro:
              String(v.forma || "").toUpperCase() === "OUTRO"
                ? String(v.forma_outro || "").trim() || null
                : null,
            estagio: String(v.estagio || "").toUpperCase() || null,
            percentual: Number(v.percentual)
          }));
        } else {
          delete payload.volumosos;
        }

        delete payload.concentrado_tipo;
        delete payload.concentrado_marca;
        delete payload.concentrado_percentual;
        delete payload.volumoso_tipo;
        delete payload.volumoso_forma;
        delete payload.volumoso_estagio;
      }

      if (tipo === "ambiente-epidemiologia") {
        const extRaw = payload.sistema_criacao_extensivo_pct;
        const intRaw = payload.sistema_criacao_intensivo_pct;

        const extVazio = extRaw === "" || extRaw == null;
        const intVazio = intRaw === "" || intRaw == null;

        if (extVazio && intVazio) {
          payload.sistema_criacao_extensivo_pct = null;
          payload.sistema_criacao_intensivo_pct = null;
        } else {
          if (extVazio || intVazio) {
            throw new Error('Sistema de Criação: informe os percentuais de "Extensivo" e "Intensivo".');
          }

          const ext = Number(extRaw);
          const intl = Number(intRaw);

          if (!Number.isFinite(ext) || ext < 0 || ext > 100) {
            throw new Error('Sistema de Criação: "Extensivo" deve estar entre 0 e 100.');
          }
          if (!Number.isFinite(intl) || intl < 0 || intl > 100) {
            throw new Error('Sistema de Criação: "Intensivo" deve estar entre 0 e 100.');
          }

          const soma = Math.round((ext + intl + Number.EPSILON) * 100) / 100;
          if (soma !== 100) {
            throw new Error(`Sistema de Criação: a soma deve ser 100%. Atual: ${soma}%.`);
          }

          payload.sistema_criacao_extensivo_pct = ext;
          payload.sistema_criacao_intensivo_pct = intl;
        }

        const baiaSel = payload.baia_tipo_construcao_sel;
        const baiaOutro = String(payload.baia_tipo_construcao_outro ?? "").trim();

        const camaSel = payload.cama_sel;
        const camaOutro = String(payload.cama_outro ?? "").trim();

        if (baiaSel === "OUTRO" && !baiaOutro) {
          throw new Error('Tipo de Baia: ao selecionar "Outro", informe qual.');
        }

        if (camaSel === "OUTRO" && !camaOutro) {
          throw new Error('Cama: ao selecionar "Outro", informe qual.');
        }

        payload.baia_tipo_construcao = resolveSelectWithOutroToText(baiaSel, baiaOutro, BAIA_TIPOS) || "";
        payload.cama = resolveSelectWithOutroToText(camaSel, camaOutro, CAMA_OPCOES) || "";

        payload.morreu_algum = (payload.morreu_algum || "NAO") === "SIM" ? "SIM" : "NAO";
        if (payload.morreu_algum !== "SIM") payload.morreu_algum_comentario = "";

        payload.algum_caso_vizinhanca = (payload.algum_caso_vizinhanca || "NAO") === "SIM" ? "SIM" : "NAO";
        if (payload.algum_caso_vizinhanca !== "SIM") payload.algum_caso_vizinhanca_comentario = "";

        payload.contato_outras_especies = (payload.contato_outras_especies || "NAO") === "SIM" ? "SIM" : "NAO";
        if (payload.contato_outras_especies !== "SIM") payload.contato_outras_especies_comentario = "";

        payload.usou_veneno_adubo_pasto =
          (payload.usou_veneno_adubo_pasto || "NAO") === "SIM" ? "SIM" : "NAO";
        if (payload.usou_veneno_adubo_pasto !== "SIM") payload.usou_veneno_adubo_pasto_comentario = "";

        delete payload.baia_tipo_construcao_sel;
        delete payload.baia_tipo_construcao_outro;
        delete payload.cama_sel;
        delete payload.cama_outro;

        delete payload.sistema_criacao;
      }

      // ✅ ALTERAÇÃO NECESSÁRIA: se ainda existir "detalhes" no form/payload, migra para "outros"
      if (tipo === "exames-complementares") {
        if (payload.outros === undefined && payload.detalhes !== undefined) {
          payload.outros = payload.detalhes;
        }
        delete payload.detalhes;
      }

      // ✅ ALTERAÇÃO (Conduta): valida/normaliza diagnostico_tipo e bloqueia envio do diagnostico se não houver tipo + desfecho novo
      if (tipo === "conduta") {
        const t = String(payload.diagnostico_tipo ?? "").trim();
        const ok = t === "DEFINITIVO" || t === "PRESUNTIVO";
        payload.diagnostico_tipo = ok ? t : "";
        if (!ok) {
          // se não escolheu tipo, não manda diagnóstico (evita salvar texto sem classificar)
          payload.diagnostico = "";
        }

        // ✅ remove campos antigos do desfecho (não enviar mais)
        delete payload.desfecho;
        delete payload.desfecho_data;
        delete payload.observacao_desfecho;

        // ✅ normaliza e envia apenas desfechos marcados
        const desfechos = payload.desfechos && typeof payload.desfechos === "object" ? payload.desfechos : {};
        const limp = {};
        DESFECHO_OPCOES.forEach(({ key }) => {
          const it = desfechos[key];
          if (it && it.checked) {
            limp[key] = {
              checked: true,
              data: String(it.data || todayISODate()),
              comentario: String(it.comentario || "").trim() || ""
            };
          }
        });
        payload.desfechos = limp;
      }

      await cfg.upsert(id, payload);

      if (tipo === "manejo-sanitario") {
        nav(`/atendimentos/${id}/bloco/manejo-nutricional`);
      } else if (tipo === "manejo-nutricional") {
        nav(`/atendimentos/${id}/bloco/ambiente-epidemiologia`);
      } else if (tipo === "ambiente-epidemiologia") {
        nav(`/atendimentos/${id}/bloco/exame-fisico`);
      } else if (tipo === "exame-fisico") {
        nav(`/atendimentos/${id}/bloco/exames-complementares`);
      } else if (tipo === "exames-complementares") {
        nav(`/atendimentos/${id}/bloco/conduta`);
      } else {
        nav(`/atendimentos/${id}/ver`);
      }
    } catch (e2) {
      setError(e2.message || "Erro ao salvar bloco.");
    }
  }

  async function addPart() {
    try {
      await atendimentosApi.addParticipante(id, {
        nome: pNome,
        papel: pPapel,
        observacao: pObs
      });
      setPNome("");
      setPPapel("");
      setPObs("");
      setParts(await atendimentosApi.listParticipantes(id));
    } catch (e) {
      setError(e.message);
    }
  }

  async function delPart(partId) {
    await atendimentosApi.removeParticipante(id, partId);
    setParts(await atendimentosApi.listParticipantes(id));
  }

  const renderedFields = useMemo(() => {
    if (tipo === "manejo-sanitario") {
      const vacSim = (form.vacinacao_realiza || "NAO") === "SIM";
      const vermSim = (form.vermifugacao_realiza || "NAO") === "SIM";
      const ectoSim = (form.controle_ectoparasitas_realiza || "NAO") === "SIM";

      return cfg.fields.filter(([key]) => {
        if (!vacSim && (key === "vacinacao_tipo_marca" || key === "vacinacao_frequencia")) return false;
        if (!vermSim && (key === "vermifugacao_tipo_marca" || key === "vermifugacao_frequencia")) return false;
        if (!ectoSim && (key === "controle_ectoparasitas_tipo" || key === "controle_ectoparasitas_freq"))
          return false;
        return true;
      });
    }

    if (tipo === "manejo-nutricional") {
      const ofertaSalSim = (form.oferta_sal || "NAO") === "SIM";
      const ofertaSupSim = (form.oferta_suplemento || "NAO") === "SIM";
      const aguaFornecOutro = form.agua_fornecimento === "OUTRO";
      const aguaQualOutro = form.agua_qualidade === "OUTRO";

      return cfg.fields.filter(([key]) => {
        if (
          [
            "concentrado_tipo",
            "concentrado_marca",
            "concentrado_percentual",
            "volumoso_tipo",
            "volumoso_forma",
            "volumoso_estagio",
            "volumoso_peso_kg",
            "volumoso_ofertas_dia",
            "concentrado_ofertas_dia",
            "concentrado_peso_oferta_kg",
            "agua_fornecimento",
            "agua_fornecimento_outro",
            "agua_qualidade",
            "agua_qualidade_outro",
            "comentarios"
          ].includes(key)
        ) {
          return false;
        }

        if (!ofertaSalSim && (key === "sal_tipo" || key === "sal_quantidade")) return false;
        if (!ofertaSupSim && (key === "suplemento_tipo" || key === "suplemento_quantidade")) return false;
        if (!aguaFornecOutro && key === "agua_fornecimento_outro") return false;
        if (!aguaQualOutro && key === "agua_qualidade_outro") return false;

        return true;
      });
    }

    if (tipo === "ambiente-epidemiologia") {
      return cfg.fields.filter(
        ([key]) =>
          ![
            "baia_tipo_construcao",
            "cama",
            "ventilacao",
            "n_animais_mesma_especie",
            "morreu_algum",
            "algum_caso_vizinhanca",
            "contato_outras_especies",
            "diferenca_faixa_etaria",
            "usou_veneno_adubo_pasto",
            "higiene_geral",
            "comentarios"
          ].includes(key)
      );
    }

    if (tipo === "exame-fisico") {
      const primeiros = new Set([
        "estado_nutricional",
        "desidratacao",
        "mucosa",
        "tpc_segundos",
        "conduta_comportamento",
        "atitude_postura",
        "pulso_digital",
        "temperatura_c",
        "fc_bpm",
        "fr_mpm",
        "movimentos_intestinais_rumen",
        "grau_dor"
      ]);
      return cfg.fields.filter(([key]) => !primeiros.has(key));
    }

    // ✅ ALTERAÇÃO NECESSÁRIA: não renderiza via map padrão no bloco exames-complementares
    if (tipo === "exames-complementares") {
      return cfg.fields.filter(
        ([key]) =>
          ![
            "hemograma",
            "bioquimica",
            "imagem",
            "cultura",
            "histopatologico",
            "necropsia",
            "opg",
            "outros",
            "comentarios"
          ].includes(key)
      );
    }

    if (tipo === "conduta") {
      return cfg.fields.filter(
        ([key]) =>
          ![
            "diagnostico",
            "prognostico_vida",
            "prognostico_funcao",
            "tratamento",
            "desfecho",
            "desfecho_data",
            "observacao_desfecho"
          ].includes(key)
      );
    }

    return cfg.fields;
  }, [
    cfg.fields,
    tipo,
    form.vacinacao_realiza,
    form.vermifugacao_realiza,
    form.controle_ectoparasitas_realiza,
    form.oferta_sal,
    form.oferta_suplemento,
    form.agua_fornecimento,
    form.agua_qualidade,
    form.morreu_algum,
    form.algum_caso_vizinhanca,
    form.contato_outras_especies,
    form.usou_veneno_adubo_pasto,
    form.diagnostico_tipo,
    form.desfechos
  ]);

  return (
    <div className="page">
      <div className="page-head">
        <h2>{cfg.title}</h2>
        <Link className="btn" to={`/atendimentos/${id}/ver`}>
          Voltar
        </Link>
      </div>
      {error && <div className="alert">{error}</div>}

      <form className="card form-grid" onSubmit={save}>
        {tipo === "manejo-nutricional" && (
          <div className="form-col-span-2 card" style={{ padding: 12 }}>
            <div className="page-head" style={{ marginBottom: 8 }}>
              <h3>Composição do Concentrado (%)</h3>
              <button type="button" className="btn btn-primary" onClick={addConcentrado}>
                + Adicionar item
              </button>
            </div>

            {concentrados.length === 0 ? (
              <p>Nenhum item adicionado.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Outro (descrição)</th>
                      <th>Marca</th>
                      <th>Percentual (%)</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {concentrados.map((c, i) => (
                      <tr key={c.id || i}>
                        <td>
                          <select value={c.tipo} onChange={(e) => setConcentrado(i, "tipo", e.target.value)}>
                            <option value="">Selecione</option>
                            {CONCENTRADO_TIPOS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          {c.tipo === "OUTRO" ? (
                            <input
                              value={c.outro_descricao}
                              onChange={(e) => setConcentrado(i, "outro_descricao", e.target.value)}
                              placeholder="Descreva..."
                            />
                          ) : (
                            <span style={{ opacity: 0.6 }}>—</span>
                          )}
                        </td>
                        <td>
                          <input
                            value={c.marca}
                            onChange={(e) => setConcentrado(i, "marca", e.target.value)}
                            placeholder="Marca (opcional)"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={c.percentual}
                            onChange={(e) => setConcentrado(i, "percentual", e.target.value)}
                          />
                        </td>
                        <td>
                          <button type="button" className="btn" onClick={() => removeConcentrado(i)}>
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: 8, fontWeight: 600 }}>
              Soma atual: {Math.round((somaPercentual + Number.EPSILON) * 100) / 100}%
            </div>
            <small style={{ opacity: 0.75 }}>A soma dos percentuais deve totalizar 100%.</small>
          </div>
        )}

        {tipo === "manejo-nutricional" && (
          <div className="form-col-span-2">
            <div className="grid-2">
              <Field label="Concentrado ofertas/dia">
                <input
                  type="number"
                  value={form.concentrado_ofertas_dia ?? ""}
                  onChange={(e) =>
                    set("concentrado_ofertas_dia", e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </Field>

              <Field label="Concentrado peso oferta kg">
                <input
                  type="number"
                  value={form.concentrado_peso_oferta_kg ?? ""}
                  onChange={(e) =>
                    set("concentrado_peso_oferta_kg", e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </Field>
            </div>
          </div>
        )}

        {tipo === "manejo-nutricional" && (
          <div className="form-col-span-2 card" style={{ padding: 12 }}>
            <div className="page-head" style={{ marginBottom: 8 }}>
              <h3>Composição do Volumoso (%)</h3>
              <button type="button" className="btn btn-primary" onClick={addVolumoso}>
                + Adicionar item
              </button>
            </div>

            {volumosos.length === 0 ? (
              <p>Nenhum item adicionado.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Outro (descrição)</th>
                      <th>Forma</th>
                      <th>Forma (outro)</th>
                      <th>Estágio</th>
                      <th>Percentual (%)</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volumosos.map((v, i) => (
                      <tr key={v.id || i}>
                        <td>
                          <select value={v.tipo} onChange={(e) => setVolumoso(i, "tipo", e.target.value)}>
                            <option value="">Selecione</option>
                            {VOLUMOSO_TIPOS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td>
                          {v.tipo === "OUTRO" ? (
                            <input
                              value={v.outro_descricao}
                              onChange={(e) => setVolumoso(i, "outro_descricao", e.target.value)}
                              placeholder="Descreva..."
                            />
                          ) : (
                            <span style={{ opacity: 0.6 }}>—</span>
                          )}
                        </td>

                        <td>
                          <select value={v.forma || ""} onChange={(e) => setVolumoso(i, "forma", e.target.value)}>
                            <option value="">Selecione</option>
                            {VOLUMOSO_FORMAS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td>
                          {v.forma === "OUTRO" ? (
                            <input
                              value={v.forma_outro || ""}
                              onChange={(e) => setVolumoso(i, "forma_outro", e.target.value)}
                              placeholder="Descreva a forma..."
                            />
                          ) : (
                            <span style={{ opacity: 0.6 }}>—</span>
                          )}
                        </td>

                        <td>
                          <select value={v.estagio || ""} onChange={(e) => setVolumoso(i, "estagio", e.target.value)}>
                            <option value="">Selecione</option>
                            {VOLUMOSO_ESTAGIOS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={v.percentual}
                            onChange={(e) => setVolumoso(i, "percentual", e.target.value)}
                          />
                        </td>

                        <td>
                          <button type="button" className="btn" onClick={() => removeVolumoso(i)}>
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: 8, fontWeight: 600 }}>
              Soma atual: {Math.round((somaVolumosoPercentual + Number.EPSILON) * 100) / 100}%
            </div>
            <small style={{ opacity: 0.75 }}>A soma dos percentuais do volumoso deve totalizar 100%.</small>
          </div>
        )}

        {tipo === "manejo-nutricional" && (
          <div className="form-col-span-2">
            <div className="grid-2">
              <Field label="Volumoso peso kg">
                <input
                  type="number"
                  value={form.volumoso_peso_kg ?? ""}
                  onChange={(e) => set("volumoso_peso_kg", e.target.value === "" ? "" : Number(e.target.value))}
                />
              </Field>

              <Field label="Volumoso ofertas/dia">
                <input
                  type="number"
                  value={form.volumoso_ofertas_dia ?? ""}
                  onChange={(e) =>
                    set("volumoso_ofertas_dia", e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </Field>
            </div>
          </div>
        )}

        {/* ✅ Sistema de Criação agora contém também "Tamanho área" */}
        {tipo === "ambiente-epidemiologia" && (
          <div className="form-col-span-2 card" style={{ padding: 12 }}>
            <div className="page-head" style={{ marginBottom: 8 }}>
              <h3>Sistema de Criação (%)</h3>
              <small style={{ opacity: 0.75 }}>
                Opcional. Se preencher, informe Extensivo e Intensivo e a soma deve ser 100%.
              </small>
            </div>

            <div className="grid-3">
              <Field label="Extensivo (%)">
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={form.sistema_criacao_extensivo_pct ?? ""}
                  onChange={(e) =>
                    set("sistema_criacao_extensivo_pct", e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="0 a 100"
                />
              </Field>

              <Field label="Intensivo (%)">
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={form.sistema_criacao_intensivo_pct ?? ""}
                  onChange={(e) =>
                    set("sistema_criacao_intensivo_pct", e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="0 a 100"
                />
              </Field>

              <Field label="Tamanho/Área">
                <input value={form.tamanho_area ?? ""} onChange={(e) => set("tamanho_area", e.target.value)} />
              </Field>
            </div>

            <div style={{ marginTop: 8, fontWeight: 600 }}>
              Soma atual: {Math.round((somaSistemaCriacao + Number.EPSILON) * 100) / 100}%
            </div>

            <small style={{ opacity: 0.75 }}>Deixe Extensivo/Intensivo em branco para não informar.</small>
          </div>
        )}

        {/* ✅ Seção Caracterização da Baia */}
        {tipo === "ambiente-epidemiologia" && (
          <div className="form-col-span-2 card" style={{ padding: 12 }}>
            <div className="page-head" style={{ marginBottom: 8 }}>
              <h3>Caracterização da Baia</h3>
            </div>

            <div className="grid-3">
              <Field label="Tipo de Baia">
                <select
                  value={form.baia_tipo_construcao_sel ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    set("baia_tipo_construcao_sel", v);
                    if (v !== "OUTRO") set("baia_tipo_construcao_outro", "");
                  }}
                >
                  <option value="">Selecione</option>
                  {BAIA_TIPOS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Cama">
                <select
                  value={form.cama_sel ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    set("cama_sel", v);
                    if (v !== "OUTRO") set("cama_outro", "");
                  }}
                >
                  <option value="">Selecione</option>
                  {CAMA_OPCOES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Ventilação">
                <input value={form.ventilacao ?? ""} onChange={(e) => set("ventilacao", e.target.value)} />
              </Field>
            </div>

            {(form.baia_tipo_construcao_sel === "OUTRO" || form.cama_sel === "OUTRO") && (
              <div className="grid-2" style={{ marginTop: 12 }}>
                {form.baia_tipo_construcao_sel === "OUTRO" ? (
                  <Field label="Tipo de Baia (qual?)">
                    <input
                      value={form.baia_tipo_construcao_outro ?? ""}
                      onChange={(e) => set("baia_tipo_construcao_outro", e.target.value)}
                      placeholder="Informe qual"
                    />
                  </Field>
                ) : (
                  <div />
                )}

                {form.cama_sel === "OUTRO" ? (
                  <Field label="Cama (qual?)">
                    <input
                      value={form.cama_outro ?? ""}
                      onChange={(e) => set("cama_outro", e.target.value)}
                      placeholder="Informe qual"
                    />
                  </Field>
                ) : (
                  <div />
                )}
              </div>
            )}
          </div>
        )}

        {tipo === "ambiente-epidemiologia" && (
          <div className="form-col-span-2 card" style={{ padding: 12 }}>
            <div className="page-head" style={{ marginBottom: 8 }}>
              <h3>Ocorrências</h3>
              <small style={{ opacity: 0.75 }}>
                Em "Uso veneno/adubo no pasto", ao marcar SIM, informe um comentário.
              </small>
            </div>

            <div className="grid-4">
              <Field label="Nº animais mesma espécie">
                <input
                  type="number"
                  value={form.n_animais_mesma_especie ?? ""}
                  onChange={(e) =>
                    set("n_animais_mesma_especie", e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </Field>

              <Field label="Morreu algum">
                <select
                  value={form.morreu_algum ?? "NAO"}
                  onChange={(e) => {
                    const v = e.target.value;
                    set("morreu_algum", v);
                    if (v !== "SIM") set("morreu_algum_comentario", "");
                  }}
                >
                  <option value="SIM">SIM</option>
                  <option value="NAO">NÃO</option>
                </select>
              </Field>

              <Field label="Caso na vizinhança">
                <select
                  value={form.algum_caso_vizinhanca ?? "NAO"}
                  onChange={(e) => {
                    const v = e.target.value;
                    set("algum_caso_vizinhanca", v);
                    if (v !== "SIM") set("algum_caso_vizinhanca_comentario", "");
                  }}
                >
                  <option value="SIM">SIM</option>
                  <option value="NAO">NÃO</option>
                </select>
              </Field>

              <Field label="Contato outras espécies">
                <select
                  value={form.contato_outras_especies ?? "NAO"}
                  onChange={(e) => {
                    const v = e.target.value;
                    set("contato_outras_especies", v);
                    if (v !== "SIM") set("contato_outras_especies_comentario", "");
                  }}
                >
                  <option value="SIM">SIM</option>
                  <option value="NAO">NÃO</option>
                </select>
              </Field>
            </div>

            <div className="grid-3">
              {form.morreu_algum === "SIM" && (
                <Field label='Comentário "Morreu algum"'>
                  <input
                    value={form.morreu_algum_comentario ?? ""}
                    onChange={(e) => set("morreu_algum_comentario", e.target.value)}
                    placeholder="Descreva..."
                  />
                </Field>
              )}

              {form.algum_caso_vizinhanca === "SIM" && (
                <Field label='Comentário "Caso na vizinhança"'>
                  <input
                    value={form.algum_caso_vizinhanca_comentario ?? ""}
                    onChange={(e) => set("algum_caso_vizinhanca_comentario", e.target.value)}
                    placeholder="Descreva..."
                  />
                </Field>
              )}

              {form.contato_outras_especies === "SIM" && (
                <Field label='Comentário "Contato outras espécies"'>
                  <input
                    value={form.contato_outras_especies_comentario ?? ""}
                    onChange={(e) => set("contato_outras_especies_comentario", e.target.value)}
                    placeholder="Descreva..."
                  />
                </Field>
              )}
            </div>

            <div className="grid-3">
              <Field label="Diferença faixa etária">
                <input
                  value={form.diferenca_faixa_etaria ?? ""}
                  onChange={(e) => set("diferenca_faixa_etaria", e.target.value)}
                />
              </Field>

              <Field label="Uso veneno/adubo no pasto">
                <select
                  value={form.usou_veneno_adubo_pasto ?? "NAO"}
                  onChange={(e) => {
                    const v = e.target.value;
                    set("usou_veneno_adubo_pasto", v);
                    if (v !== "SIM") set("usou_veneno_adubo_pasto_comentario", "");
                  }}
                >
                  <option value="SIM">SIM</option>
                  <option value="NAO">NÃO</option>
                </select>
              </Field>

              <Field label="Higiene geral">
                <input value={form.higiene_geral ?? ""} onChange={(e) => set("higiene_geral", e.target.value)} />
              </Field>
            </div>

            {form.usou_veneno_adubo_pasto === "SIM" && (
              <div style={{ marginTop: 12 }}>
                <Field label='Comentário "Uso veneno/adubo no pasto"'>
                  <input
                    value={form.usou_veneno_adubo_pasto_comentario ?? ""}
                    onChange={(e) => set("usou_veneno_adubo_pasto_comentario", e.target.value)}
                    placeholder="Descreva..."
                  />
                </Field>
              </div>
            )}
          </div>
        )}

        {tipo === "ambiente-epidemiologia" && (
          <div className="form-col-span-2">
            <Field label="Comentários">
              <textarea
                value={form.comentarios ?? ""}
                onChange={(e) => set("comentarios", e.target.value)}
                style={{ minHeight: 160, resize: "vertical" }}
              />
            </Field>
          </div>
        )}

        {tipo === "exame-fisico" && (
          <div className="form-col-span-2 card" style={{ padding: 12 }}>
            <div className="page-head" style={{ marginBottom: 8 }}>
              <h3>Parâmetros principais</h3>
            </div>

            {/* Linha 1 */}
            <div className="grid-4">
              <Field label="Estado nutricional (1 a 5)">
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="1"
                  value={form.estado_nutricional ?? ""}
                  onChange={(e) => set("estado_nutricional", e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="1 a 5"
                />
              </Field>

              <Field label="Desidratação">
                <select value={form.desidratacao ?? ""} onChange={(e) => set("desidratacao", e.target.value)}>
                  <option value="">Selecione</option>
                  <option value="NAO">Não</option>
                  <option value="6-8%">6-8%</option>
                  <option value="8-10%">8-10%</option>
                  <option value="10-12%">10-12%</option>
                  <option value=">12%">{">12%"}</option>
                </select>
              </Field>

              <Field label="Mucosa">
                <select value={form.mucosa ?? ""} onChange={(e) => set("mucosa", e.target.value)}>
                  <option value="">Selecione</option>
                  <option value="NORMOCORADA">Normocorada</option>
                  <option value="PALIDA">Pálida</option>
                  <option value="HIPEREMICAS">Hiperêmicas</option>
                  <option value="CONGESTA">Congesta</option>
                  <option value="ICTERICA">Ictérica</option>
                  <option value="CIANOTICA">Cianótica</option>
                </select>
              </Field>

              <Field label="TPC (segundos)">
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="1"
                  value={form.tpc_segundos ?? ""}
                  onChange={(e) => set("tpc_segundos", e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="1 a 10"
                />
              </Field>
            </div>

            {/* Linha 2 */}
            <div className="grid-4" style={{ marginTop: 12 }}>
              <Field label="Conduta/comportamento">
                <select
                  value={form.conduta_comportamento ?? ""}
                  onChange={(e) => set("conduta_comportamento", e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="ATIVO">Ativo</option>
                  <option value="APATICO">Apático</option>
                  <option value="COMATOSO">Comatoso</option>
                  <option value="SEMI_COMATOSO">Semi-comatoso</option>
                  <option value="HIPEREXCITADO">Hiperexcitado</option>
                </select>
              </Field>

              <Field label="Atitude/postura">
                <select value={form.atitude_postura ?? ""} onChange={(e) => set("atitude_postura", e.target.value)}>
                  <option value="">Selecione</option>
                  <option value="EM_ESTACAO">Em estação</option>
                  <option value="DECUBITO_LATERAL_DIREITO">Decúbito lateral direito</option>
                  <option value="DECUBITO_LATERAL_ESQUERDO">Decúbito lateral esquerdo</option>
                  <option value="DECUBITO_ESTERNAL">Decúbito esternal</option>
                </select>
              </Field>

              <Field label="Pulso digital">
                <select value={form.pulso_digital ?? ""} onChange={(e) => set("pulso_digital", e.target.value)}>
                  <option value="">Selecione</option>
                  <option value="NORMAL">Normal</option>
                  <option value="DIMINUIDO">Diminuído</option>
                  <option value="AUMENTADO">Aumentado</option>
                </select>
              </Field>

              <Field label="Temperatura (°C)">
                <input
                  type="number"
                  step="0.1"
                  value={form.temperatura_c ?? ""}
                  onChange={(e) => set("temperatura_c", e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Ex.: 38.5"
                />
              </Field>
            </div>

            {/* Linha 3 */}
            <div className="grid-4" style={{ marginTop: 12 }}>
              <Field label="FC (bpm)">
                <input
                  type="number"
                  value={form.fc_bpm ?? ""}
                  onChange={(e) => set("fc_bpm", e.target.value === "" ? "" : Number(e.target.value))}
                />
              </Field>

              <Field label="FR (mpm)">
                <input
                  type="number"
                  value={form.fr_mpm ?? ""}
                  onChange={(e) => set("fr_mpm", e.target.value === "" ? "" : Number(e.target.value))}
                />
              </Field>

              <Field label="Mov. intestinais/rumen">
                <input
                  value={form.movimentos_intestinais_rumen ?? ""}
                  onChange={(e) => set("movimentos_intestinais_rumen", e.target.value)}
                />
              </Field>

              <Field label="Grau de dor">
                <select value={form.grau_dor ?? ""} onChange={(e) => set("grau_dor", e.target.value)}>
                  <option value="">Selecione</option>
                  <option value="INAPARENTE">Inaparente</option>
                  <option value="LEVE">Leve</option>
                  <option value="MODERADO">Moderado</option>
                  <option value="INTENSO">Intenso</option>
                  <option value="INCONTROLAVEL">Incontrolável</option>
                </select>
              </Field>
            </div>
          </div>
        )}

        {tipo === "exame-fisico" && (
          <div className="form-col-span-2 card" style={{ padding: 12 }}>
            <div className="page-head" style={{ marginBottom: 8 }}>
              <h3>Sistema Acometido</h3>
              <small style={{ opacity: 0.75 }}>
                Marque os sistemas com anormalidade. Se marcar “Outro”, descreva.
              </small>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 6,
                  width: "fit-content"
                }}
              >
                <input
                  type="checkbox"
                  checked={(form.sistema_acometido_tegumentar ?? "NAO") === "SIM"}
                  onChange={(e) => set("sistema_acometido_tegumentar", e.target.checked ? "SIM" : "NAO")}
                  style={{ margin: 0 }}
                />
                <span>Tegumentar</span>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 6,
                  width: "fit-content"
                }}
              >
                {" "}
                <input
                  type="checkbox"
                  checked={(form.sistema_acometido_digestorio ?? "NAO") === "SIM"}
                  onChange={(e) => set("sistema_acometido_digestorio", e.target.checked ? "SIM" : "NAO")}
                />
                Digestório
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 6,
                  width: "fit-content"
                }}
              >
                {" "}
                <input
                  type="checkbox"
                  checked={(form.sistema_acometido_respiratorio ?? "NAO") === "SIM"}
                  onChange={(e) => set("sistema_acometido_respiratorio", e.target.checked ? "SIM" : "NAO")}
                />
                Respiratório
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 6,
                  width: "fit-content"
                }}
              >
                {" "}
                <input
                  type="checkbox"
                  checked={(form.sistema_acometido_locomotor ?? "NAO") === "SIM"}
                  onChange={(e) => set("sistema_acometido_locomotor", e.target.checked ? "SIM" : "NAO")}
                />
                Locomotor
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 6,
                  width: "fit-content"
                }}
              >
                <input
                  type="checkbox"
                  checked={(form.sistema_acometido_nervoso ?? "NAO") === "SIM"}
                  onChange={(e) => set("sistema_acometido_nervoso", e.target.checked ? "SIM" : "NAO")}
                />
                Nervoso
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 6,
                  width: "fit-content"
                }}
              >
                {" "}
                <input
                  type="checkbox"
                  checked={(form.sistema_acometido_urogenital ?? "NAO") === "SIM"}
                  onChange={(e) => set("sistema_acometido_urogenital", e.target.checked ? "SIM" : "NAO")}
                />
                Urogenital
              </label>
            </div>

            <div style={{ marginTop: 12 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 6,
                  width: "fit-content"
                }}
              >
                <input
                  type="checkbox"
                  checked={(form.sistema_acometido_outro ?? "NAO") === "SIM"}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    set("sistema_acometido_outro", checked ? "SIM" : "NAO");
                    if (!checked) set("sistema_acometido_outro_desc", "");
                  }}
                />
                Outro
              </label>

              {form.sistema_acometido_outro === "SIM" && (
                <div style={{ marginTop: 8 }}>
                  <Field label="Outro (qual?)">
                    <input
                      value={form.sistema_acometido_outro_desc ?? ""}
                      onChange={(e) => set("sistema_acometido_outro_desc", e.target.value)}
                      placeholder="Descreva..."
                    />
                  </Field>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ✅ NOVO LAYOUT: Exames Complementares em 2 linhas + Comentários full */}
        {tipo === "exames-complementares" && (
          <>
            <div className="form-col-span-2 card" style={{ padding: 12 }}>
              <div className="page-head" style={{ marginBottom: 8 }}>
                <h3>Exames Complementares</h3>
              </div>

              <div className="grid-4">
                <Field label="Hemograma">
                  <input value={form.hemograma ?? ""} onChange={(e) => set("hemograma", e.target.value)} />
                </Field>
                <Field label="Bioquímica">
                  <input value={form.bioquimica ?? ""} onChange={(e) => set("bioquimica", e.target.value)} />
                </Field>
                <Field label="Imagem">
                  <input value={form.imagem ?? ""} onChange={(e) => set("imagem", e.target.value)} />
                </Field>
                <Field label="Cultura">
                  <input value={form.cultura ?? ""} onChange={(e) => set("cultura", e.target.value)} />
                </Field>
              </div>

              <div className="grid-4" style={{ marginTop: 12 }}>
                <Field label="Histopatológico">
                  <input
                    value={form.histopatologico ?? ""}
                    onChange={(e) => set("histopatologico", e.target.value)}
                  />
                </Field>
                <Field label="Necropsia">
                  <input value={form.necropsia ?? ""} onChange={(e) => set("necropsia", e.target.value)} />
                </Field>
                <Field label="OPG">
                  <input value={form.opg ?? ""} onChange={(e) => set("opg", e.target.value)} />
                </Field>
                <Field label="Outros">
                  <textarea
                    value={form.outros ?? ""}
                    onChange={(e) => set("outros", e.target.value)}
                    style={{ minHeight: 120, resize: "vertical" }}
                  />
                </Field>
              </div>
            </div>

            <div className="form-col-span-2">
              <Field label="Comentários">
                <textarea
                  value={form.comentarios ?? ""}
                  onChange={(e) => set("comentarios", e.target.value)}
                  style={{ minHeight: 160, resize: "vertical" }}
                />
              </Field>
            </div>
          </>
        )}

        {tipo === "conduta" && (
          <div className="form-col-span-2 card" style={{ padding: 12 }}>
            <div className="page-head" style={{ marginBottom: 8 }}>
              <h3>Diagnóstico</h3>
              <small style={{ opacity: 0.75 }}>Selecione "Definitivo" ou "Presuntivo" para habilitar o texto.</small>
            </div>

            <div className="grid-2">
              <Field label="Tipo do diagnóstico">
                <select
                  value={form.diagnostico_tipo ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    set("diagnostico_tipo", v);
                    if (!v) set("diagnostico", "");
                  }}
                >
                  <option value="">Selecione</option>
                  <option value="DEFINITIVO">Definitivo</option>
                  <option value="PRESUNTIVO">Presuntivo</option>
                </select>
              </Field>

              <Field label="Comentário (texto)">
                <textarea
                  value={form.diagnostico ?? ""}
                  onChange={(e) => set("diagnostico", e.target.value)}
                  disabled={!form.diagnostico_tipo}
                  placeholder={!form.diagnostico_tipo ? "Selecione o tipo do diagnóstico para preencher..." : ""}
                  style={{ minHeight: 160, resize: "vertical", opacity: form.diagnostico_tipo ? 1 : 0.7 }}
                />
              </Field>
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="page-head" style={{ marginBottom: 8 }}>
                <h3>Prognóstico</h3>
              </div>

              <div className="grid-2">
                <Field label="Prognóstico de vida">
                  <select
                    value={form.prognostico_vida ?? ""}
                    onChange={(e) => set("prognostico_vida", e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="FAVORAVEL">Favorável</option>
                    <option value="RESERVADO">Reservado</option>
                    <option value="DESFAVORAVEL">Desfavorável</option>
                  </select>
                </Field>

                <Field label="Prognóstico de função">
                  <select
                    value={form.prognostico_funcao ?? ""}
                    onChange={(e) => set("prognostico_funcao", e.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="FAVORAVEL">Favorável</option>
                    <option value="RESERVADO">Reservado</option>
                    <option value="DESFAVORAVEL">Desfavorável</option>
                  </select>
                </Field>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="page-head" style={{ marginBottom: 8 }}>
                <h3>Tratamento</h3>
              </div>

              <div className="form-col-span-2">
                <Field label="Comentários">
                  <textarea
                    value={form.tratamento ?? ""}
                    onChange={(e) => set("tratamento", e.target.value)}
                    style={{ minHeight: 160, resize: "vertical" }}
                  />
                </Field>
              </div>
            </div>

            {/* ✅ NOVO: Desfecho por checkboxes + data + comentário por opção (ALINHADO) */}
            <div style={{ marginTop: 12 }}>
              <div className="page-head" style={{ marginBottom: 8 }}>
                <h3>Desfecho</h3>
                <small style={{ opacity: 0.75 }}>
                  Marque uma ou mais opções. Ao marcar, a data é preenchida automaticamente e você pode adicionar um comentário.
                </small>
              </div>

              {/* Cabeçalho das colunas (opcional, mas ajuda a ficar visualmente alinhado) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "260px 200px 1fr",
                  gap: 12,
                  alignItems: "center",
                  marginBottom: 6,
                  opacity: 0.75,
                  fontSize: 12
                }}
              >
                <div>Opção</div>
                <div>Data</div>
                <div>Comentário</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {DESFECHO_OPCOES.map((opt) => {
                  const item = form.desfechos?.[opt.key] || { checked: false, data: "", comentario: "" };

                  return (
                    <div
                      key={opt.key}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "260px 200px 1fr",
                        gap: 12,
                        alignItems: "center"
                      }}
                    >
                      {/* Coluna 1: checkbox + texto (sempre com mesma “largura visual”) */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <input
                          type="checkbox"
                          checked={!!item.checked}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const next = { ...(form.desfechos || {}) };

                            next[opt.key] = {
                              checked,
                              data: checked ? (item.data || todayISODate()) : "",
                              comentario: checked ? (item.comentario || "") : ""
                            };

                            set("desfechos", next);
                          }}
                          style={{
                            margin: 0,
                            width: 16,
                            height: 16,
                            flex: "0 0 16px" // ✅ impede “andar”
                          }}
                        />
                        <span style={{ display: "inline-block", lineHeight: 1.2 }}>{opt.label}</span>
                      </div>

                      {/* Coluna 2: data (sem Field para não variar altura) */}
                      <input
                        type="date"
                        value={item.data || ""}
                        disabled={!item.checked}
                        onChange={(e) => {
                          const next = { ...(form.desfechos || {}) };
                          next[opt.key] = { ...item, data: e.target.value };
                          set("desfechos", next);
                        }}
                        style={{
                          width: "100%",
                          height: 38 // ✅ força altura consistente
                        }}
                      />

                      {/* Coluna 3: comentário (sem Field para não variar altura) */}
                      <input
                        value={item.comentario || ""}
                        disabled={!item.checked}
                        onChange={(e) => {
                          const next = { ...(form.desfechos || {}) };
                          next[opt.key] = { ...item, comentario: e.target.value };
                          set("desfechos", next);
                        }}
                        placeholder={!item.checked ? "Marque a opção para habilitar..." : ""}
                        style={{
                          width: "100%",
                          height: 38 // ✅ força altura consistente
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {renderedFields.map(([key, label, type]) => {
          const isSanitarioComentarios = tipo === "manejo-sanitario" && key === "comentarios";
          const isExameAnormalidades = tipo === "exame-fisico" && key === "anormalidades";

          const content = (
            <Field key={key} label={label}>
              {tipo === "manejo-sanitario" && key === "vacinacao_realiza" ? (
                <select
                  value={form[key] ?? "NAO"}
                  onChange={(e) => {
                    const v = e.target.value;
                    set("vacinacao_realiza", v);
                    if (v !== "SIM") {
                      set("vacinacao_tipo_marca", "");
                      set("vacinacao_frequencia", "");
                    }
                  }}
                >
                  <option value="SIM">SIM</option>
                  <option value="NAO">NÃO</option>
                </select>
              ) : tipo === "manejo-sanitario" && key === "vermifugacao_realiza" ? (
                <select
                  value={form[key] ?? "NAO"}
                  onChange={(e) => {
                    const v = e.target.value;
                    set("vermifugacao_realiza", v);
                    if (v !== "SIM") {
                      set("vermifugacao_tipo_marca", "");
                      set("vermifugacao_frequencia", "");
                    }
                  }}
                >
                  <option value="SIM">SIM</option>
                  <option value="NAO">NÃO</option>
                </select>
              ) : tipo === "manejo-sanitario" && key === "controle_ectoparasitas_realiza" ? (
                <select
                  value={form[key] ?? "NAO"}
                  onChange={(e) => {
                    const v = e.target.value;
                    set("controle_ectoparasitas_realiza", v);
                    if (v !== "SIM") {
                      set("controle_ectoparasitas_tipo", "");
                      set("controle_ectoparasitas_freq", "");
                    }
                  }}
                >
                  <option value="SIM">SIM</option>
                  <option value="NAO">NÃO</option>
                </select>
              ) : tipo === "manejo-nutricional" && key === "oferta_sal" ? (
                <select
                  value={form.oferta_sal ?? "NAO"}
                  onChange={(e) => {
                    const v = e.target.value;
                    set("oferta_sal", v);
                    if (v !== "SIM") {
                      set("sal_tipo", "");
                      set("sal_quantidade", "");
                    }
                  }}
                >
                  <option value="SIM">SIM</option>
                  <option value="NAO">NÃO</option>
                </select>
              ) : tipo === "manejo-nutricional" && key === "oferta_suplemento" ? (
                <select
                  value={form.oferta_suplemento ?? "NAO"}
                  onChange={(e) => {
                    const v = e.target.value;
                    set("oferta_suplemento", v);
                    if (v !== "SIM") {
                      set("suplemento_tipo", "");
                      set("suplemento_quantidade", "");
                    }
                  }}
                >
                  <option value="SIM">SIM</option>
                  <option value="NAO">NÃO</option>
                </select>
              ) : type === "textarea" ? (
                <textarea
                  value={form[key] ?? ""}
                  onChange={(e) => set(key, e.target.value)}
                  style={
                    isSanitarioComentarios || isExameAnormalidades ? { minHeight: 160, resize: "vertical" } : undefined
                  }
                />
              ) : (
                <input
                  type={type || "text"}
                  value={form[key] ?? ""}
                  onChange={(e) =>
                    set(
                      key,
                      type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value
                    )
                  }
                />
              )}
            </Field>
          );

          if (isSanitarioComentarios || isExameAnormalidades) {
            return (
              <div key={key} className="form-col-span-2">
                {content}
              </div>
            );
          }

          return content;
        })}

        {tipo === "manejo-nutricional" && (
          <div className="form-col-span-2">
            <div className="grid-2">
              <Field label="Fornecimento de Água">
                <select
                  value={form.agua_fornecimento ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    set("agua_fornecimento", v);
                    if (v !== "OUTRO") set("agua_fornecimento_outro", "");
                  }}
                >
                  <option value="">Selecione</option>
                  {AGUA_FORNECIMENTO_OPCOES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Qualidade da Água">
                <select
                  value={form.agua_qualidade ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    set("agua_qualidade", v);
                    if (v !== "OUTRO") set("agua_qualidade_outro", "");
                  }}
                >
                  <option value="">Selecione</option>
                  {AGUA_QUALIDADE_OPCOES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {(form.agua_fornecimento === "OUTRO" || form.agua_qualidade === "OUTRO") && (
              <div className="grid-2" style={{ marginTop: 12 }}>
                {form.agua_fornecimento === "OUTRO" ? (
                  <Field label="Fornecimento de Água  (qual?)">
                    <input
                      value={form.agua_fornecimento_outro ?? ""}
                      onChange={(e) => set("agua_fornecimento_outro", e.target.value)}
                      placeholder="Informe qual"
                    />
                  </Field>
                ) : (
                  <div />
                )}

                {form.agua_qualidade === "OUTRO" ? (
                  <Field label="Qualidade da Água (qual?)">
                    <input
                      value={form.agua_qualidade_outro ?? ""}
                      onChange={(e) => set("agua_qualidade_outro", e.target.value)}
                      placeholder="Informe qual"
                    />
                  </Field>
                ) : (
                  <div />
                )}
              </div>
            )}
          </div>
        )}

        {tipo === "manejo-nutricional" && (
          <div className="form-col-span-2">
            <Field label="Comentários">
              <textarea
                value={form.comentarios ?? ""}
                onChange={(e) => set("comentarios", e.target.value)}
                style={{ minHeight: 160, resize: "vertical" }}
              />
            </Field>
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn" onClick={() => nav(-1)}>
            Cancelar
          </button>
          <button className="btn btn-primary">Salvar e Continuar</button>
        </div>
      </form>

      <div className="card">
        <h3>Participantes do atendimento</h3>
        <div className="grid-3">
          <input placeholder="Nome" value={pNome} onChange={(e) => setPNome(e.target.value)} />

          <select value={pPapel} onChange={(e) => setPPapel(e.target.value)}>
            <option value="">Selecione o papel</option>
            <option value="RESIDENTE">Residente</option>
            <option value="DUPLA">Dupla</option>
            <option value="SUPERVISAO">Supervisão</option>
            <option value="DISCENTE">Discente</option>
            <option value="COLABORADOR">Colaborador</option>
          </select>
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" onClick={addPart} type="button">
            Adicionar participante
          </button>
        </div>

        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Papel</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {parts.length ? (
                parts.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nome}</td>
                    <td>{p.papel}</td>
                    <td>
                      <ConfirmButton onConfirm={() => delPart(p.id)} message="Remover participante?">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          Excluir
                        </span>
                      </ConfirmButton>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>Nenhum participante.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div >
  );
}