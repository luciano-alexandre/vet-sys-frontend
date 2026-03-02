import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { atendimentosApi } from "../../api/endpoints";
import ConfirmButton from "../../components/ConfirmButton";

function V({ v }) {
  const s = (v ?? "").toString().trim();
  return s || "—";
}

function fmtDateTime(v) {
  if (!v) return "";
  const s = String(v);
  return s.replace("T", " ").slice(0, 16);
}

function firstOf(...vals) {
  for (const v of vals) {
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return "";
}

function fmtMoneyBRL(v) {
  if (v === undefined || v === null || v === "") return "";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtNumber(v, frac = 2) {
  if (v === undefined || v === null || v === "") return "";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: frac
  });
}

function fmtYesNo(v) {
  const up = String(v ?? "").toUpperCase();
  if (up === "SIM") return "Sim";
  if (up === "NAO") return "Não";
  return String(v ?? "");
}

function escHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function nl2br(s) {
  const t = String(s ?? "").trim();
  return t ? escHtml(t).replaceAll("\n", "<br/>") : "—";
}

function td(v) {
  const t = String(v ?? "").trim();
  return t ? escHtml(t) : "—";
}

function pick(obj, ...keys) {
  for (const k of keys) {
    if (!obj) continue;
    const v = obj[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return "";
}

function openPdfLikePrintWindow({ title, html }) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");

  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document;

  if (!win || !doc) {
    try {
      document.body.removeChild(iframe);
    } catch {}
    alert("Não foi possível gerar o PDF (iframe indisponível).");
    return;
  }

  const css = [
    ":root { --fg:#111; --muted:#666; --border:#e5e7eb; --bg:#fff; }",
    "* { box-sizing: border-box; }",
    "body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: var(--fg); background: var(--bg); }",
    ".page { padding: 24px; max-width: 980px; margin: 0 auto; }",
    ".topbar { display:flex; justify-content:space-between; align-items:flex-start; gap: 12px; margin-bottom: 16px; }",
    "h1 { font-size: 20px; margin: 0; }",
    ".meta { font-size: 12px; color: var(--muted); line-height: 1.4; text-align: right; }",
    ".section { border: 1px solid var(--border); border-radius: 10px; padding: 14px; margin: 12px 0; }",
    ".section h2 { font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: .4px; }",
    ".grid2 { display:grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }",
    ".grid3 { display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px 12px; }",
    ".row { font-size: 12px; line-height: 1.35; word-break: break-word; }",
    ".row b { display:inline-block; min-width: 140px; }",
    ".muted { color: var(--muted); }",
    "table { width:100%; border-collapse: collapse; font-size: 12px; }",
    "th, td { border: 1px solid var(--border); padding: 6px 8px; vertical-align: top; }",
    "th { background: #f6f7f9; text-align: left; }",
    ".block-title { font-size: 13px; margin: 0 0 6px 0; font-weight: 700; }",
    ".hr { height: 1px; background: var(--border); margin: 10px 0; }",
    ".badge { display:inline-block; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--border); font-size: 11px; color: var(--muted); }",
    "@media print { .page { padding: 0; } .section { break-inside: avoid; } table { break-inside: avoid; } }"
  ].join("\n");

  const full =
    "<!doctype html>" +
    '<html lang="pt-BR">' +
    "<head>" +
    '<meta charset="utf-8"/>' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"/>' +
    "<title>" +
    escHtml(title) +
    "</title>" +
    "<style>" +
    css +
    "</style>" +
    "</head>" +
    "<body>" +
    '<div class="page">' +
    html +
    "</div>" +
    "</body>" +
    "</html>";

  doc.open();
  doc.write(full);
  doc.close();

  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } finally {
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {}
      }, 1000);
    }
  }, 350);
}

function renderPairs(pairs) {
  return pairs
    .map(([k, v]) => `<div class="row"><b>${escHtml(k)}:</b> ${td(v)}</div>`)
    .join("");
}

function renderTextarea(label, value) {
  return `<div class="row" style="margin-top:8px"><b>${escHtml(label)}:</b><div style="margin-top:4px">${nl2br(
    value
  )}</div></div>`;
}

export default function AtendimentoViewPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");
      const resp = await atendimentosApi.get(id);
      setData(resp);
    } catch (e) {
      setError(e.message || "Erro ao carregar atendimento.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function remove() {
    try {
      await atendimentosApi.remove(id);
      nav("/atendimentos");
    } catch (e) {
      setError(e.message || "Erro ao excluir atendimento.");
    }
  }

  // ✅ Gera relatório completo (para salvar como PDF)
  function openPdfReport() {
    if (!data) return;

    const d = data.detalhado || {};
    const a = data.atendimento || {};

    const ms = data.manejo_sanitario || {};
    const mn = data.manejo_nutricional || {};
    const ae = data.ambiente_epidemiologia || {};
    const ef = data.exame_fisico || {};
    const ec = data.exames_complementares || {};
    const c = data.conduta || {};

    const participantes = Array.isArray(data.participantes)
      ? data.participantes
      : Array.isArray(d.participantes)
        ? d.participantes
        : Array.isArray(a.participantes)
          ? a.participantes
          : [];

    // RESPONSÁVEL
    const responsavelNome = firstOf(d.responsavel_nome, a.responsavel_nome);
    const responsavelTelefone = firstOf(d.responsavel_telefone, a.responsavel_telefone);
    const responsavelCpf = firstOf(d.responsavel_cpf, a.responsavel_cpf);
    const responsavelEmail = firstOf(d.responsavel_email, a.responsavel_email);

    const logradouro = firstOf(d.logradouro, a.logradouro, d.endereco, a.endereco);
    const numero = firstOf(d.numero, a.numero);
    const bairro = firstOf(d.bairro, a.bairro);
    const cep = firstOf(d.cep, a.cep);
    const complemento = firstOf(d.complemento, a.complemento);
    const cidade = firstOf(d.cidade, a.cidade, d.municipio, a.municipio);
    const estado = firstOf(d.estado, a.estado);

    // ANIMAL
    const animalNome = firstOf(d.animal_nome, a.animal_nome);
    const especie = firstOf(d.especie, a.especie);
    const raca = firstOf(d.raca, a.raca);
    const sexo = firstOf(d.sexo, a.sexo);
    const idadeTexto = firstOf(d.idade_texto, a.idade_texto);
    const statusReprodutivo = firstOf(d.status_reprodutivo, a.status_reprodutivo);
    const tempoPrenhezMeses = firstOf(d.tempo_prenhez_meses, a.tempo_prenhez_meses);
    const valorEstimado = firstOf(d.valor_estimado, a.valor_estimado);
    const identificacaoBrinco = firstOf(d.identificacao_brinco, a.identificacao_brinco);
    const microchip = firstOf(d.microchip, a.microchip);
    const pelagem = firstOf(d.pelagem, a.pelagem);
    const pesoBaseKg = firstOf(d.peso_base_kg, a.peso_base_kg);
    const rg = firstOf(d.rg, a.rg, d.animal_rg, a.animal_rg);

    // VETERINÁRIO
    const veterinarioNome = firstOf(d.veterinario_nome, a.veterinario_nome);
    const veterinarioCrmv = firstOf(d.veterinario_crmv, a.veterinario_crmv);
    const veterinarioEmail = firstOf(d.veterinario_email, a.veterinario_email);
    const veterinarioTelefone = firstOf(d.veterinario_telefone, a.veterinario_telefone);

    // Manejo Nutricional - listas
    const conc = Array.isArray(mn.concentrados) ? mn.concentrados : [];
    const vol = Array.isArray(mn.volumosos) ? mn.volumosos : [];

    // Conduta - desfechos
    const desfechosObj = c.desfechos && typeof c.desfechos === "object" ? c.desfechos : {};
    const desfechosMarcados = Object.keys(desfechosObj)
      .filter((k) => desfechosObj[k]?.checked)
      .map((k) => ({
        key: k,
        data: desfechosObj[k]?.data,
        comentario: desfechosObj[k]?.comentario
      }));

    const stamp = new Date().toLocaleString("pt-BR");

    const html = `
      <div class="section">
        <h1><center>Responsável</center></h1><br />
        <div class="grid2">
          ${renderPairs([
            ["Nome", responsavelNome],
            ["Telefone", responsavelTelefone],
            ["CPF", responsavelCpf],
            ["Email", responsavelEmail],
            ["Município/UF", `${cidade || "—"} / ${estado || "—"}`],
            ["Logradouro", `${logradouro || "—"}, ${numero || "—"}`],
            ["Bairro", bairro],
            ["CEP", cep],
            ["Complemento", complemento]
          ])}
        </div>
      </div>

      <div class="section">
        <h1><center>Animal</center></h1><br />
        <div class="grid2">
          ${renderPairs([
            ["Nome", animalNome],
            ["Espécie", especie],
            ["Raça", raca],
            ["RG", rg],
            ["Sexo", sexo],
            ["Idade (texto)", idadeTexto],
            ["Status reprodutivo", statusReprodutivo],
            ["Tempo prenhez (meses)", tempoPrenhezMeses !== "" ? String(tempoPrenhezMeses) : ""],
            ["Valor estimado", fmtMoneyBRL(valorEstimado)],
            ["Brinco", identificacaoBrinco],
            ["Microchip", microchip],
            ["Pelagem", pelagem],
            ["Peso base (kg)", fmtNumber(pesoBaseKg, 2)]
          ])}
        </div>
      </div>

      <div class="section">
        <h1><center>Atendimento</center></h1><br />
        <div class="grid2">
          ${renderPairs([
            ["Data", fmtDateTime(a.data_atendimento)],
            ["Veterinário", `${veterinarioNome || "—"} (${veterinarioCrmv || "—"})`],
            ["Email veterinário", veterinarioEmail],
            ["Telefone veterinário", veterinarioTelefone],
            ["Responsável pelas informações", a.responsavel_informacoes_nome],
            ["Tempo de posse/cuida", a.tempo_posse_cuida],
            ["Frequência de cuidados", a.frequencia_cuidados],
            ["Duração da doença", a.duracao_doenca],
            ["Quem indicou", a.quem_indicou],
            ["Houve melhora", a.houve_melhora],
            ["Doença pregressa", a.doenca_pregressa],
            ["Distância HV (km)", a.distancia_hv_km]
          ])}
        </div>
        ${renderTextarea("Histórico da doença", a.historico_doenca)}
        ${renderTextarea("Tratamento realizado", a.tratamento_realizado)}
        ${renderTextarea("Comentário geral", a.comentario_geral)}
      </div>

      <div class="section">
        <h1><center>Blocos do Atendimento<center></h1><br />

        <div class="block-title"><h2><center>Manejo Sanitário</center></h2></div><br />
        <div class="grid2">
          ${renderPairs([
            ["Vacinação realizada", fmtYesNo(ms.vacinacao_realiza)],
            ["Vacinação tipo/marca", ms.vacinacao_tipo_marca],
            ["Vacinação frequência", ms.vacinacao_frequencia],
            ["Vermifugação realizada", fmtYesNo(ms.vermifugacao_realiza)],
            ["Vermifugação tipo/marca", ms.vermifugacao_tipo_marca],
            ["Vermifugação frequência", ms.vermifugacao_frequencia],
            ["Controle ectoparasitas realizado", fmtYesNo(ms.controle_ectoparasitas_realiza)],
            ["Controle ectoparasitas tipo/marca", ms.controle_ectoparasitas_tipo],
            ["Controle ectoparasitas frequência", ms.controle_ectoparasitas_freq]
          ])}
        </div>
        ${renderTextarea("Comentários", ms.comentarios)}
        <div class="hr"></div>

        <div class="block-title"><h2><center>Manejo Nutricional</center></h2></div><br />
        <div class="grid2">
          ${renderPairs([
            ["Concentrado ofertas/dia", mn.concentrado_ofertas_dia],
            ["Concentrado peso oferta kg", mn.concentrado_peso_oferta_kg],
            ["Volumoso peso kg", mn.volumoso_peso_kg],
            ["Volumoso ofertas/dia", mn.volumoso_ofertas_dia],
            ["Oferta sal", fmtYesNo(mn.oferta_sal)],
            ["Tipo de sal", mn.sal_tipo],
            ["Quantidade de sal", mn.sal_quantidade],
            ["Oferta suplemento", fmtYesNo(mn.oferta_suplemento)],
            ["Tipo de suplemento", mn.suplemento_tipo],
            ["Quantidade de suplemento", mn.suplemento_quantidade],
            ["Fornecimento de água", mn.agua_fornecimento === "OUTRO" ? `Outro: ${mn.agua_fornecimento_outro || ""}` : mn.agua_fornecimento],
            ["Qualidade da água", mn.agua_qualidade === "OUTRO" ? `Outro: ${mn.agua_qualidade_outro || ""}` : mn.agua_qualidade]
          ])}
        </div>

        <div style="margin-top:10px">
          <div class="block-title" style="font-size:12px">Composição do Concentrado (%)</div>
          ${
            conc.length
              ? `<table>
                  <thead><tr><th>Tipo</th><th>Outro (descrição)</th><th>Marca</th><th>Percentual (%)</th></tr></thead>
                  <tbody>
                    ${conc
                      .map(
                        (x) => `<tr>
                          <td>${td(pick(x, "tipo"))}</td>
                          <td>${td(pick(x, "outro_descricao"))}</td>
                          <td>${td(pick(x, "marca"))}</td>
                          <td>${td(pick(x, "percentual"))}</td>
                        </tr>`
                      )
                      .join("")}
                  </tbody>
                </table>`
              : `<div class="muted">Nenhum item.</div>`
          }
        </div>

        <div style="margin-top:10px">
          <div class="block-title" style="font-size:12px">Composição do Volumoso (%)</div>
          ${
            vol.length
              ? `<table>
                  <thead><tr><th>Tipo</th><th>Outro (descrição)</th><th>Forma</th><th>Forma (outro)</th><th>Estágio</th><th>Percentual (%)</th></tr></thead>
                  <tbody>
                    ${vol
                      .map(
                        (x) => `<tr>
                          <td>${td(pick(x, "tipo"))}</td>
                          <td>${td(pick(x, "outro_descricao"))}</td>
                          <td>${td(pick(x, "forma"))}</td>
                          <td>${td(pick(x, "forma_outro"))}</td>
                          <td>${td(pick(x, "estagio"))}</td>
                          <td>${td(pick(x, "percentual"))}</td>
                        </tr>`
                      )
                      .join("")}
                  </tbody>
                </table>`
              : `<div class="muted">Nenhum item.</div>`
          }
        </div>

        ${renderTextarea("Comentários", mn.comentarios)}
        <div class="hr"></div>

        <div class="block-title"><h2><center>Ambiente / Epidemiologia</center></h2></div><br />
        <div class="grid2">
          ${renderPairs([
            ["Tipo de Baia", pick(ae, "baia_tipo_construcao")],
            ["Cama", pick(ae, "cama")],
            ["Ventilação", pick(ae, "ventilacao")],
            ["Nº animais mesma espécie", pick(ae, "n_animais_mesma_especie")],
            ["Morreu algum", fmtYesNo(pick(ae, "morreu_algum"))],
            ["Comentário morreu algum", pick(ae, "morreu_algum_comentario")],
            ["Caso na vizinhança", fmtYesNo(pick(ae, "algum_caso_vizinhanca"))],
            ["Comentário caso vizinhança", pick(ae, "algum_caso_vizinhanca_comentario")],
            ["Contato outras espécies", fmtYesNo(pick(ae, "contato_outras_especies"))],
            ["Comentário contato outras espécies", pick(ae, "contato_outras_especies_comentario")],
            ["Diferença faixa etária", pick(ae, "diferenca_faixa_etaria")],
            ["Uso veneno/adubo no pasto", fmtYesNo(pick(ae, "usou_veneno_adubo_pasto"))],
            ["Comentário veneno/adubo", pick(ae, "usou_veneno_adubo_pasto_comentario")],
            ["Higiene geral", pick(ae, "higiene_geral")],
            ["Tamanho/Área", pick(ae, "tamanho_area")],
            ["Sistema criação extensivo (%)", pick(ae, "sistema_criacao_extensivo_pct")],
            ["Sistema criação intensivo (%)", pick(ae, "sistema_criacao_intensivo_pct")]
          ])}
        </div>
        ${renderTextarea("Comentários", pick(ae, "comentarios"))}
        <div class="hr"></div>
        <div class="block-title"><h2><center>Exame Físico</center></h2></div><br />
        <div class="grid2">
          ${renderPairs([
            ["Estado nutricional", ef.estado_nutricional],
            ["Desidratação", ef.desidratacao],
            ["Mucosa", ef.mucosa],
            ["TPC (segundos)", ef.tpc_segundos],
            ["Conduta/comportamento", ef.conduta_comportamento],
            ["Atitude/postura", ef.atitude_postura],
            ["Pulso digital", ef.pulso_digital],
            ["Temperatura (°C)", ef.temperatura_c],
            ["FC (bpm)", ef.fc_bpm],
            ["FR (mpm)", ef.fr_mpm],
            ["Mov. intestinais/rumen", ef.movimentos_intestinais_rumen],
            ["Grau de dor", ef.grau_dor],
            ["Sistema acometido (tegumentar)", fmtYesNo(ef.sistema_acometido_tegumentar)],
            ["Sistema acometido (digestório)", fmtYesNo(ef.sistema_acometido_digestorio)],
            ["Sistema acometido (respiratório)", fmtYesNo(ef.sistema_acometido_respiratorio)],
            ["Sistema acometido (locomotor)", fmtYesNo(ef.sistema_acometido_locomotor)],
            ["Sistema acometido (nervoso)", fmtYesNo(ef.sistema_acometido_nervoso)],
            ["Sistema acometido (urogenital)", fmtYesNo(ef.sistema_acometido_urogenital)],
            ["Sistema acometido (outro)", fmtYesNo(ef.sistema_acometido_outro)],
            ["Outro (descrição)", ef.sistema_acometido_outro_desc]
          ])}
        </div>
        ${renderTextarea("Anormalidades", ef.anormalidades)}
        <div class="hr"></div>

        <div class="block-title"><h2><center>Exames Complementares</center></h2></div><br />
        <div class="grid2">
          ${renderPairs([
            ["Hemograma", ec.hemograma],
            ["Bioquímica", ec.bioquimica],
            ["Imagem", ec.imagem],
            ["Cultura", ec.cultura],
            ["Histopatológico", ec.histopatologico],
            ["Necropsia", ec.necropsia],
            ["OPG", ec.opg]
          ])}
        </div>
        ${renderTextarea("Outros", ec.outros)}
        ${renderTextarea("Comentários", ec.comentarios)}
        <div class="hr"></div>

        <div class="block-title"><h2><center>Conduta</center></h2></div><br />
        <div class="grid2">
          ${renderPairs([
            ["Tipo do diagnóstico", c.diagnostico_tipo],
            ["Diagnóstico", c.diagnostico],
            ["Prognóstico de vida", c.prognostico_vida],
            ["Prognóstico de função", c.prognostico_funcao]
          ])}
        </div>
        ${renderTextarea("Tratamento", c.tratamento)}

        <div style="margin-top:10px">
          <div class="block-title" style="font-size:12px">Desfechos</div>
          ${
            desfechosMarcados.length
              ? `<table>
                  <thead><tr><th>Opção</th><th>Data</th><th>Comentário</th></tr></thead>
                  <tbody>
                    ${desfechosMarcados
                      .map(
                        (x) => `<tr>
                          <td>${td(x.key)}</td>
                          <td>${td(x.data)}</td>
                          <td>${td(x.comentario)}</td>
                        </tr>`
                      )
                      .join("")}
                  </tbody>
                </table>`
              : `<div class="muted">Nenhum desfecho marcado.</div>`
          }
        </div>
      </div>

      <div class="section">
        <h2><center>Participantes</center></h2><br />
        ${
          participantes.length
            ? `<table>
                <thead><tr><th>Nome</th><th>Papel</th></tr></thead>
                <tbody>
                  ${participantes
                    .map((p) => `<tr><td>${td(p.nome)}</td><td>${td(p.papel)}</td></tr>`)
                    .join("")}
                </tbody>
              </table>`
            : `<div class="muted">Nenhum participante cadastrado.</div>`
        }
      </div>
    `;

    openPdfLikePrintWindow({ title: `Atendimento_${id}_relatorio`, html });
  }

  if (error) {
    return (
      <div className="page">
        <div className="alert">{error}</div>
      </div>
    );
  }

  if (!data) return <div className="page">Carregando...</div>;

  const d = data.detalhado || {};
  const a = data.atendimento || {};

  // RESPONSÁVEL
  const responsavelNome = firstOf(d.responsavel_nome, a.responsavel_nome);
  const responsavelTelefone = firstOf(d.responsavel_telefone, a.responsavel_telefone);
  const responsavelCpf = firstOf(d.responsavel_cpf, a.responsavel_cpf);
  const responsavelEmail = firstOf(d.responsavel_email, a.responsavel_email);

  const logradouro = firstOf(d.logradouro, a.logradouro, d.endereco, a.endereco);
  const numero = firstOf(d.numero, a.numero);
  const bairro = firstOf(d.bairro, a.bairro);
  const cep = firstOf(d.cep, a.cep);
  const complemento = firstOf(d.complemento, a.complemento);
  const cidade = firstOf(d.cidade, a.cidade, d.municipio, a.municipio);
  const estado = firstOf(d.estado, a.estado);

  // ANIMAL
  const animalNome = firstOf(d.animal_nome, a.animal_nome);
  const especie = firstOf(d.especie, a.especie);
  const raca = firstOf(d.raca, a.raca);
  const sexo = firstOf(d.sexo, a.sexo);
  const idadeTexto = firstOf(d.idade_texto, a.idade_texto);
  const statusReprodutivo = firstOf(d.status_reprodutivo, a.status_reprodutivo);
  const tempoPrenhezMeses = firstOf(d.tempo_prenhez_meses, a.tempo_prenhez_meses);
  const valorEstimado = firstOf(d.valor_estimado, a.valor_estimado);
  const identificacaoBrinco = firstOf(d.identificacao_brinco, a.identificacao_brinco);
  const microchip = firstOf(d.microchip, a.microchip);
  const pelagem = firstOf(d.pelagem, a.pelagem);
  const pesoBaseKg = firstOf(d.peso_base_kg, a.peso_base_kg);
  const rg = firstOf(d.rg, a.rg, d.animal_rg, a.animal_rg);

  // VETERINÁRIO
  const veterinarioNome = firstOf(d.veterinario_nome, a.veterinario_nome);
  const veterinarioCrmv = firstOf(d.veterinario_crmv, a.veterinario_crmv);
  const veterinarioEmail = firstOf(d.veterinario_email, a.veterinario_email);
  const veterinarioTelefone = firstOf(d.veterinario_telefone, a.veterinario_telefone);

  return (
    <div className="page">
      <div className="page-head">
        <h2>Atendimento #{id}</h2>
        <div className="row-actions">
          <Link className="btn" to={`/atendimentos/${id}/editar`}>
            Editar
          </Link>

          <button className="btn btn-primary" type="button" onClick={openPdfReport}>
            Gerar PDF (relatório)
          </button>

          <ConfirmButton onConfirm={remove} message="Excluir atendimento definitivamente?">
            <label>Excluir</label>
          </ConfirmButton>
        </div>
      </div>

      <div className="card">
        <h3>👤 Responsável</h3>
        <div className="grid-2">
          <p>
            <b>Nome:</b> <V v={responsavelNome} />
          </p>
          <p>
            <b>Telefone:</b> <V v={responsavelTelefone} />
          </p>
          <p>
            <b>CPF:</b> <V v={responsavelCpf} />
          </p>
          <p>
            <b>Email:</b> <V v={responsavelEmail} />
          </p>

          <p>
            <b>Município/UF:</b> <V v={cidade} /> / <V v={estado} />
          </p>
          <p>
            <b>Logradouro:</b> <V v={logradouro} />, <V v={numero} />
          </p>
          <p>
            <b>Bairro:</b> <V v={bairro} />
          </p>
          <p>
            <b>CEP:</b> <V v={cep} />
          </p>
          <p>
            <b>Complemento:</b> <V v={complemento} />
          </p>
        </div>
      </div>

      <div className="card">
        <h3>🐾 Animal</h3>
        <div className="grid-2">
          <p>
            <b>Nome:</b> <V v={animalNome} />
          </p>
          <p>
            <b>Espécie:</b> <V v={especie} />
          </p>
          <p>
            <b>Raça:</b> <V v={raca} />
          </p>
          <p>
            <b>RG:</b> <V v={rg} />
          </p>
          <p>
            <b>Sexo:</b> <V v={sexo} />
          </p>
          <p>
            <b>Idade (texto):</b> <V v={idadeTexto} />
          </p>
          <p>
            <b>Status reprodutivo:</b> <V v={statusReprodutivo} />
          </p>
          <p>
            <b>Tempo prenhez (meses):</b>{" "}
            <V v={tempoPrenhezMeses !== "" ? String(tempoPrenhezMeses) : ""} />
          </p>
          <p>
            <b>Valor estimado:</b> <V v={fmtMoneyBRL(valorEstimado)} />
          </p>
          <p>
            <b>Brinco:</b> <V v={identificacaoBrinco} />
          </p>
          <p>
            <b>Microchip:</b> <V v={microchip} />
          </p>
          <p>
            <b>Pelagem:</b> <V v={pelagem} />
          </p>
          <p>
            <b>Peso base (kg):</b> <V v={fmtNumber(pesoBaseKg, 2)} />
          </p>
        </div>
      </div>

      <div className="card">
        <h3>🩺 Atendimento</h3>
        <div className="grid-2">
          <p>
            <b>Data:</b> <V v={fmtDateTime(a.data_atendimento)} />
          </p>
          <p>
            <b>Veterinário:</b> <V v={veterinarioNome} /> (<V v={veterinarioCrmv} />)
          </p>
          <p>
            <b>Email veterinário:</b> <V v={veterinarioEmail} />
          </p>
          <p>
            <b>Telefone veterinário:</b> <V v={veterinarioTelefone} />
          </p>

          <p>
            <b>Responsável pelas informações:</b> <V v={a.responsavel_informacoes_nome} />
          </p>
          <p>
            <b>Tempo de posse/cuida:</b> <V v={a.tempo_posse_cuida} />
          </p>
          <p>
            <b>Frequência de cuidados:</b> <V v={a.frequencia_cuidados} />
          </p>
          <p>
            <b>Duração da doença:</b> <V v={a.duracao_doenca} />
          </p>
          <p>
            <b>Quem indicou:</b> <V v={a.quem_indicou} />
          </p>
          <p>
            <b>Houve melhora:</b> <V v={a.houve_melhora} />
          </p>
          <p>
            <b>Doença pregressa:</b> <V v={a.doenca_pregressa} />
          </p>
          <p>
            <b>Distância HV (km):</b> <V v={a.distancia_hv_km} />
          </p>
        </div>

        <p>
          <b>Histórico da doença:</b> <V v={a.historico_doenca} />
        </p>
        <p>
          <b>Tratamento realizado:</b> <V v={a.tratamento_realizado} />
        </p>
        <p>
          <b>Comentário geral:</b> <V v={a.comentario_geral} />
        </p>
      </div>

      <div className="row-actions row-actions--grid">
        <Link className="tile" to={`/atendimentos/${id}/bloco/manejo-sanitario`}>
          Manejo Sanitário
        </Link>
        <Link className="tile" to={`/atendimentos/${id}/bloco/manejo-nutricional`}>
          Manejo Nutricional
        </Link>
        <Link className="tile" to={`/atendimentos/${id}/bloco/ambiente-epidemiologia`}>
          Ambiente/Epidemiologia
        </Link>
        <Link className="tile" to={`/atendimentos/${id}/bloco/exame-fisico`}>
          Exame Físico
        </Link>
        <Link className="tile" to={`/atendimentos/${id}/bloco/exames-complementares`}>
          Exames Complementares
        </Link>
        <Link className="tile" to={`/atendimentos/${id}/bloco/conduta`}>
          Conduta
        </Link>
      </div>
    </div>
  );
}