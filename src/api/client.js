const API_URL = import.meta.env.VITE_API_URL;

export function getToken() {
  return localStorage.getItem("vet_token");
}

export function setToken(token) {
  localStorage.setItem("vet_token", token);
}

export function clearToken() {
  localStorage.removeItem("vet_token");
}

async function parseJsonSafe(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { error: text || "Resposta inválida do servidor." };
  }
}

export async function request(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    const message = data?.error || `Erro HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}