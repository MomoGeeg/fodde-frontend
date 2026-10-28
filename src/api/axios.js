import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8080";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// Intercepteur requête — ajouter le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fodde_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Intercepteur réponse — gérer les erreurs globalement
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("fodde_token");
      localStorage.removeItem("fodde_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
