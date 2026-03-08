import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, usersApi } from "../../api/endpoints";
import { Field } from "../../components/Field";

const ASSINATURA_MAX_BYTES = 2 * 1024 * 1024; // 2MB
const ASSINATURA_MIME_PERMITIDOS = new Set(["image/png", "image/jpeg", "image/webp"]);

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
    const [assinaturaPreview, setAssinaturaPreview] = useState("");
    const [assinaturaPayload, setAssinaturaPayload] = useState(null);
    const [assinaturaError, setAssinaturaError] = useState("");
    const [removerAssinatura, setRemoverAssinatura] = useState(false);

    function set(k, v) {
        setForm((f) => ({ ...f, [k]: v }));
    }

    function onTelefoneChange(e) {
        const masked = formatTelefoneBR(e.target.value);
        set("telefone", masked);

        if (!masked) return setTelefoneError("");
        setTelefoneError(isTelefoneValido(masked) ? "" : "Telefone inválido. Use DDD + número (10 ou 11 dígitos).");
    }

    function toDataUrl(base64, mime) {
        if (!base64 || !mime) return "";
        return `data:${mime};base64,${base64}`;
    }

    function fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(new Error("Não foi possível ler o arquivo da assinatura."));
            reader.readAsDataURL(file);
        });
    }

    async function onAssinaturaChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        setAssinaturaError("");
        setRemoverAssinatura(false);

        if (!ASSINATURA_MIME_PERMITIDOS.has(file.type)) {
            setAssinaturaError("Formato inválido. Use PNG, JPG/JPEG ou WEBP.");
            e.target.value = "";
            return;
        }
        if (file.size > ASSINATURA_MAX_BYTES) {
            setAssinaturaError("A assinatura deve ter no máximo 2MB.");
            e.target.value = "";
            return;
        }

        try {
            const dataUrl = await fileToDataUrl(file);
            const [prefix, b64] = dataUrl.split(",", 2);
            const mime = prefix?.match(/^data:(.*);base64$/i)?.[1]?.toLowerCase() || file.type.toLowerCase();
            if (!b64) throw new Error("Arquivo inválido.");

            setAssinaturaPayload({
                assinatura_base64: b64,
                assinatura_nome: file.name,
                assinatura_mime: mime
            });
            setAssinaturaPreview(dataUrl);
        } catch (err) {
            setAssinaturaError(err?.message || "Erro ao carregar assinatura.");
        }
    }

    function clearAssinatura() {
        setAssinaturaError("");
        setAssinaturaPayload(null);
        setAssinaturaPreview("");
        setRemoverAssinatura(true);
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
                setAssinaturaPreview(toDataUrl(me?.assinatura_base64, me?.assinatura_mime));
                setAssinaturaPayload(null);
                setRemoverAssinatura(false);
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
        if (assinaturaError) return;

        try {
            setSaving(true);

            const payload = {
                nome: form.nome,
                email: form.email,
                crmv: form.crmv,
                telefone: onlyDigits(form.telefone)
            };
            if (assinaturaPayload) Object.assign(payload, assinaturaPayload);
            if (removerAssinatura) payload.remover_assinatura = true;

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

                    <Field label="Assinatura (imagem)">
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={onAssinaturaChange}
                        />
                        {assinaturaError && <small style={{ color: "#b91c1c" }}>{assinaturaError}</small>}
                        {assinaturaPreview && (
                            <div style={{ marginTop: 8 }}>
                                <img
                                    src={assinaturaPreview}
                                    alt="Pré-visualização da assinatura"
                                    style={{ maxWidth: 320, maxHeight: 120, objectFit: "contain", border: "1px solid #ddd", padding: 6, borderRadius: 8 }}
                                />
                                <div style={{ marginTop: 8 }}>
                                    <button type="button" className="btn" onClick={clearAssinatura} disabled={saving}>
                                        Remover assinatura
                                    </button>
                                </div>
                            </div>
                        )}
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
