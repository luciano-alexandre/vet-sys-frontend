import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, usersApi } from "../../api/endpoints";
import { Field } from "../../components/Field";

function onlyDigits(v) {
    return (v || "").replace(/\D/g, "");
}

function formatTelefoneBR(value) {
    const d = onlyDigits(value).slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function isTelefoneValido(v) {
    const len = onlyDigits(v).length;
    return len === 10 || len === 11;
}

export default function PerfilPage() {
    const nav = useNavigate();

    const [form, setForm] = useState({
        nome: "",
        email: "",
        telefone: "",
        crmv: ""
    });

    const [novaSenha, setNovaSenha] = useState("");
    const [telefoneError, setTelefoneError] = useState("");
    const [error, setError] = useState("");
    const [ok, setOk] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    function set(k, v) {
        setForm((f) => ({ ...f, [k]: v }));
    }

    function onTelefoneChange(e) {
        const masked = formatTelefoneBR(e.target.value);
        set("telefone", masked);

        if (!masked) return setTelefoneError("");
        setTelefoneError(isTelefoneValido(masked) ? "" : "Telefone inválido. Use DDD + número (10 ou 11 dígitos).");
    }

    useEffect(() => {
        async function load() {
            try {
                setError("");
                setOk("");
                setLoading(true);

                const me = await authApi.me();

                setForm({
                    nome: me?.nome ?? "",
                    email: me?.email ?? "",
                    crmv: me?.crmv ?? "",
                    telefone: formatTelefoneBR(me?.telefone ?? "")
                });
            } catch (e) {
                setError(e?.message ?? "Erro ao carregar perfil.");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    async function submit(e) {
        e.preventDefault();
        setError("");
        setOk("");

        if (form.telefone && !isTelefoneValido(form.telefone)) {
            setTelefoneError("Telefone inválido. Formato esperado: (99) 99999-9999 ou (99) 9999-9999.");
            return;
        }

        try {
            setSaving(true);

            const payload = {
                nome: form.nome,
                email: form.email,
                crmv: form.crmv,
                telefone: onlyDigits(form.telefone)
            };

            await usersApi.updateMe(payload);

            if (novaSenha.trim()) {
                await usersApi.updateMyPassword({ senha: novaSenha.trim() });
                setNovaSenha("");
            }

            setOk("Perfil atualizado com sucesso.");
        } catch (e2) {
            setError(e2?.message ?? "Erro ao salvar perfil.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="page">
            <h2>Meu Perfil</h2>

            {error && <div className="alert">{error}</div>}
            {ok && <div className="alert alert-success">{ok}</div>}
            
            {loading ? (
                <div className="card">Carregando...</div>
            ) : (
                <form className="card form-grid" onSubmit={submit}>
                    <Field label="Nome">
                        <input value={form.nome} onChange={(e) => set("nome", e.target.value)} />
                    </Field>

                    <Field label="Email">
                        <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
                    </Field>

                    <Field label="CRMV - PB">
                        <input value={form.crmv} onChange={(e) => set("crmv", e.target.value)} />
                    </Field>

                    <Field label="Telefone">
                        <input
                            type="tel"
                            value={form.telefone}
                            onChange={onTelefoneChange}
                            placeholder="(83) 99999-9999"
                            inputMode="numeric"
                            aria-invalid={telefoneError ? "true" : "false"}
                        />
                        {telefoneError && <small style={{ color: "#b91c1c" }}>{telefoneError}</small>}
                    </Field>

                    <Field label="Nova senha (opcional)">
                        <input
                            type="password"
                            value={novaSenha}
                            onChange={(e) => setNovaSenha(e.target.value)}
                            placeholder="Deixe em branco para não alterar"
                        />
                    </Field>

                    <div className="form-actions">
                        <button type="button" className="btn" onClick={() => nav(-1)} disabled={saving}>
                            Voltar
                        </button>
                        <button className="btn btn-primary" disabled={saving}>
                            {saving ? "Salvando..." : "Salvar"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}