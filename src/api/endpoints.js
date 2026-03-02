import { request } from "./client";

/** Auth */
export const authApi = {
  login: (payload) => request("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request("/api/auth/me")
};

/** Usuários */
export const usersApi = {
  list: () => request("/api/usuarios"),
  get: (id) => request(`/api/usuarios/${id}`),
  create: (payload) => request("/api/usuarios", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/api/usuarios/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  updatePassword: (id, payload) =>
    request(`/api/usuarios/${id}/password`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (id) => request(`/api/usuarios/${id}`, { method: "DELETE" }),

  updateMe: (payload) => request("/api/usuarios/me", { method: "PUT", body: JSON.stringify(payload) }),
  updateMyPassword: (payload) =>
    request("/api/usuarios/me/password", { method: "PUT", body: JSON.stringify(payload) })
};

/** Responsáveis */
export const responsaveisApi = {
  list: (q = "") => request(`/api/responsaveis${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  get: (id) => request(`/api/responsaveis/${id}`),
  create: (payload) => request("/api/responsaveis", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/api/responsaveis/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (id) => request(`/api/responsaveis/${id}`, { method: "DELETE" })
};

/** Animais */
export const animaisApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.append("q", params.q);
    if (params.responsavel_id) qs.append("responsavel_id", params.responsavel_id);
    const suf = qs.toString() ? `?${qs.toString()}` : "";
    return request(`/api/animais${suf}`);
  },
  get: (id) => request(`/api/animais/${id}`),
  create: (payload) => request("/api/animais", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/api/animais/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (id) => request(`/api/animais/${id}`, { method: "DELETE" })
};


export const localidadesApi = {
  ufs: (q = "") =>
    request(`/api/localidades/ufs${q ? `?q=${encodeURIComponent(q)}` : ""}`),

  cidades: (uf, q = "") =>
    request(
      `/api/localidades/cidades?uf=${encodeURIComponent(uf)}${q ? `&q=${encodeURIComponent(q)}` : ""
      }`
    ),
};

/** Atendimentos */
export const atendimentosApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) qs.append(k, v);
    const suf = qs.toString() ? `?${qs.toString()}` : "";
    return request(`/api/atendimentos${suf}`);
  },
  get: (id) => request(`/api/atendimentos/${id}`),
  create: (payload) => request("/api/atendimentos", { method: "POST", body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/api/atendimentos/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  remove: (id) => request(`/api/atendimentos/${id}`, { method: "DELETE" }),

  upsertManejoSanitario: (id, payload) =>
    request(`/api/atendimentos/${id}/manejo-sanitario`, { method: "PUT", body: JSON.stringify(payload) }),
  upsertManejoNutricional: (id, payload) =>
    request(`/api/atendimentos/${id}/manejo-nutricional`, { method: "PUT", body: JSON.stringify(payload) }),
  upsertAmbienteEpidemiologia: (id, payload) =>
    request(`/api/atendimentos/${id}/ambiente-epidemiologia`, { method: "PUT", body: JSON.stringify(payload) }),
  upsertExameFisico: (id, payload) =>
    request(`/api/atendimentos/${id}/exame-fisico`, { method: "PUT", body: JSON.stringify(payload) }),
  upsertExamesComplementares: (id, payload) =>
    request(`/api/atendimentos/${id}/exames-complementares`, { method: "PUT", body: JSON.stringify(payload) }),
  upsertConduta: (id, payload) =>
    request(`/api/atendimentos/${id}/conduta`, { method: "PUT", body: JSON.stringify(payload) }),

  listParticipantes: (id) => request(`/api/atendimentos/${id}/participantes`),
  addParticipante: (id, payload) =>
    request(`/api/atendimentos/${id}/participantes`, { method: "POST", body: JSON.stringify(payload) }),
  removeParticipante: (id, participanteId) =>
    request(`/api/atendimentos/${id}/participantes/${participanteId}`, { method: "DELETE" })
};