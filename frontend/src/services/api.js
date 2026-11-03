const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export function getToken() {
  return localStorage.getItem("music_token");
}

export function setToken(token) {
  localStorage.setItem("music_token", token);
}

export function clearToken() {
  localStorage.removeItem("music_token");
}

export async function apiRequest(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && token) clearToken();
    throw new Error(data.message || "Có lỗi xảy ra khi gọi API.");
  }

  return data;
}
