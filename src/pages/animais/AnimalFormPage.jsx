import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { animaisApi, responsaveisApi } from "../../api/endpoints";
import { Field } from "../../components/Field";

export default function AnimalFormPage({ mode }) {
  const { id } = useParams();
  const nav = useNavigate();
  const isEdit = mode === "edit";

  const [responsaveis, setResponsaveis] = useState([]);
  const [form, setForm] = useState({
    responsavel_id: "",
    nome: "",
    especie: "Equino",
    raca: "",
    rg: "", // ✅ NOVO
    sexo: "MACHO",
    idade_texto: "",
    status_reprodutivo: "NAO_INFORMADO",
    tempo_prenhez_meses: "",
    valor_estimado: "", // string formatada (ex: 1.234,56)
    identificacao_brinco: "",
    microchip: "",
    pelagem: "",
    peso_base_kg: ""
  });

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    responsaveisApi.list().then(setResponsaveis).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      animaisApi
        .get(id)
        .then((a) => {
          setForm({
            responsavel_id: a.responsavel_id || "",
            nome: a.nome || "",
            especie: a.especie || "Equino",
            raca: a.raca || "",
            rg: a.rg || "", // ✅ NOVO
            sexo: a.sexo || "MACHO",
            idade_texto: a.idade_texto || "",
            status_reprodutivo: a.status_reprodutivo || "NAO_INFORMADO",
            tempo_prenhez_meses: a.tempo_prenhez_meses ?? "",
            valor_estimado:
              a.valor_estimado === null || a.valor_estimado === undefined
                ? ""
                : formatCurrencyBRLInput(String(a.valor_estimado)),
            identificacao_brinco: a.identificacao_brinco || "",
            microchip: a.microchip || "",
            pelagem: a.pelagem || "",
            peso_base_kg: a.peso_base_kg ?? ""
          });
        })
        .catch((e) => setError(e.message));
    }
  }, [id, isEdit]);

  function clearFieldError(field) {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function setFieldError(field, message) {
    setFieldErrors((prev) => ({ ...prev, [field]: message }));
  }

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
    clearFieldError(k);
  }

  // ---------- dinheiro BRL ----------
  function onlyDigits(v) {
    return String(v || "").replace(/\D/g, "");
  }

  // Transforma "123456" -> "1.234,56"
  function formatCurrencyBRLInput(value) {
    const digits = onlyDigits(value);
    if (!digits) return "";
    const cents = Number(digits);
    const reais = cents / 100;
    return reais.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Transforma "1.234,56" -> 1234.56
  function parseCurrencyBRLToNumber(value) {
    if (!value || !String(value).trim()) return null;
    const normalized = String(value).replace(/\./g, "").replace(",", ".");
    const n = Number(normalized);
    return Number.isNaN(n) ? null : n;
  }

  function onChangeValorEstimado(e) {
    const raw = e.target.value;
    const formatted = formatCurrencyBRLInput(raw);
    set("valor_estimado", formatted);
  }
  // -----------------------------------

  function onChangeSexo(value) {
    setForm((f) => {
      if (
        value === "MACHO" &&
        (f.status_reprodutivo === "PRENHE" || f.status_reprodutivo === "LACTANTE")
      ) {
        return {
          ...f,
          sexo: value,
          status_reprodutivo: "NAO_INFORMADO",
          tempo_prenhez_meses: ""
        };
      }
      return { ...f, sexo: value };
    });

    clearFieldError("sexo");
    clearFieldError("status_reprodutivo");
    clearFieldError("tempo_prenhez_meses");
  }

  function onChangeStatusReprodutivo(value) {
    if ((value === "PRENHE" || value === "LACTANTE") && form.sexo !== "FEMEA") {
      setFieldError(
        "status_reprodutivo",
        "Status PRENHE ou LACTANTE só pode ser selecionado para fêmea."
      );
      return;
    }

    setForm((f) => ({
      ...f,
      status_reprodutivo: value,
      tempo_prenhez_meses: value === "PRENHE" ? f.tempo_prenhez_meses : ""
    }));

    clearFieldError("status_reprodutivo");
    clearFieldError("tempo_prenhez_meses");
  }

  function validateForm() {
    const errors = {};

    if (!form.responsavel_id) errors.responsavel_id = "Responsável é obrigatório.";
    if (!form.nome?.trim()) errors.nome = "Nome é obrigatório.";
    if (!form.especie?.trim()) errors.especie = "Espécie é obrigatória.";

    if (
      (form.status_reprodutivo === "PRENHE" || form.status_reprodutivo === "LACTANTE") &&
      form.sexo !== "FEMEA"
    ) {
      errors.status_reprodutivo =
        "Status PRENHE ou LACTANTE só pode ser selecionado para fêmea.";
    }

    if (form.status_reprodutivo === "PRENHE") {
      if (form.tempo_prenhez_meses === "" || form.tempo_prenhez_meses === null) {
        errors.tempo_prenhez_meses = "Informe o tempo de gestação em meses.";
      } else {
        const n = Number(form.tempo_prenhez_meses);
        if (Number.isNaN(n)) {
          errors.tempo_prenhez_meses = "Tempo de gestação inválido.";
        } else if (n < 0 || n > 11) {
          errors.tempo_prenhez_meses = "Tempo de gestação deve estar entre 0 e 11 meses.";
        }
      }
    }

    // valida dinheiro digitado (se preenchido)
    if (form.valor_estimado && parseCurrencyBRLToNumber(form.valor_estimado) === null) {
      errors.valor_estimado = "Valor estimado inválido.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    try {
      const payload = {
        ...form,
        tempo_prenhez_meses:
          form.status_reprodutivo === "PRENHE"
            ? Number(form.tempo_prenhez_meses)
            : null,
        valor_estimado: parseCurrencyBRLToNumber(form.valor_estimado),
        peso_base_kg: form.peso_base_kg === "" ? null : Number(form.peso_base_kg)
        // ✅ rg já vai no payload por estar no ...form
      };

      if (isEdit) await animaisApi.update(id, payload);
      else await animaisApi.create(payload);

      nav("/animais");
    } catch (e2) {
      setError(e2.message || "Erro ao salvar.");
    }
  }

  return (
    <div className="page">
      <h2>{isEdit ? "Editar animal" : "Novo animal"}</h2>
      {error && <div className="alert">{error}</div>}

      <form className="card form-grid" onSubmit={submit}>
        <Field label="Responsável">
          <select
            value={form.responsavel_id}
            onChange={(e) => set("responsavel_id", e.target.value)}
          >
            <option value="">Selecione</option>
            {responsaveis.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
              </option>
            ))}
          </select>
          {fieldErrors.responsavel_id && (
            <small className="error-text">{fieldErrors.responsavel_id}</small>
          )}
        </Field>

        <Field label="Nome">
          <input value={form.nome} onChange={(e) => set("nome", e.target.value)} />
          {fieldErrors.nome && <small className="error-text">{fieldErrors.nome}</small>}
        </Field>

        <Field label="Espécie">
          <select value={form.especie} onChange={(e) => set("especie", e.target.value)}>
            <option value="Equino">Equino</option>
            <option value="Asinino">Asinino</option>
            <option value="Muar">Muar</option>
            <option value="Bovino">Bovino</option>
            <option value="Ovino">Ovino</option>
            <option value="Caprino">Caprino</option>
            <option value="Suíno">Suíno</option>
          </select>
          {fieldErrors.especie && <small className="error-text">{fieldErrors.especie}</small>}
        </Field>

        <Field label="Raça">
          <input value={form.raca} onChange={(e) => set("raca", e.target.value)} />
        </Field>

        {/* ✅ NOVO: RG */}
        <Field label="RG do animal">
          <input value={form.rg} onChange={(e) => set("rg", e.target.value)} />
        </Field>

        <Field label="Sexo">
          <select value={form.sexo} onChange={(e) => onChangeSexo(e.target.value)}>
            <option value="MACHO">MACHO</option>
            <option value="FEMEA">FEMEA</option>
          </select>
          {fieldErrors.sexo && <small className="error-text">{fieldErrors.sexo}</small>}
        </Field>

        <Field label="Idade (texto)">
          <input value={form.idade_texto} onChange={(e) => set("idade_texto", e.target.value)} />
        </Field>

        <Field label="Status reprodutivo">
          <select
            value={form.status_reprodutivo}
            onChange={(e) => onChangeStatusReprodutivo(e.target.value)}
          >
            <option value="CASTRADO">CASTRADO</option>
            <option value="NAO_CASTRADO">NAO_CASTRADO</option>
            <option value="PRENHE">PRENHE</option>
            <option value="LACTANTE">LACTANTE</option>
            <option value="NAO_INFORMADO">NAO_INFORMADO</option>
          </select>
          {fieldErrors.status_reprodutivo && (
            <small className="error-text">{fieldErrors.status_reprodutivo}</small>
          )}
        </Field>

        {form.status_reprodutivo === "PRENHE" && (
          <Field label="Tempo de Gestação (meses)">
            <input
              type="number"
              min="1"
              max="11"
              step="1"
              value={form.tempo_prenhez_meses}
              onChange={(e) => {
                set("tempo_prenhez_meses", e.target.value);
                if (e.target.value !== "") clearFieldError("tempo_prenhez_meses");
              }}
            />
            {fieldErrors.tempo_prenhez_meses && (
              <small className="error-text">{fieldErrors.tempo_prenhez_meses}</small>
            )}
          </Field>
        )}

        <Field label="Valor estimado (R$)">
          <input
            type="text"
            inputMode="numeric"
            placeholder="0,00"
            value={form.valor_estimado}
            onChange={onChangeValorEstimado}
          />
          {fieldErrors.valor_estimado && (
            <small className="error-text">{fieldErrors.valor_estimado}</small>
          )}
        </Field>

        <Field label="Brinco">
          <input
            value={form.identificacao_brinco}
            onChange={(e) => set("identificacao_brinco", e.target.value)}
          />
        </Field>

        <Field label="Microchip">
          <input value={form.microchip} onChange={(e) => set("microchip", e.target.value)} />
        </Field>

        <Field label="Pelagem">
          <input value={form.pelagem} onChange={(e) => set("pelagem", e.target.value)} />
        </Field>

        <Field label="Peso base (kg)">
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.peso_base_kg}
            onChange={(e) => set("peso_base_kg", e.target.value)}
          />
        </Field>

        <div className="form-actions">
          <button type="button" className="btn" onClick={() => nav(-1)}>
            Cancelar
          </button>
          <button className="btn btn-primary" type="submit">
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
