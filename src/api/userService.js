/**
 * Service Utilisateurs — Spring Boot API
 * Remplace les appels Supabase par des appels JWT via Axios.
 * Note : GET /api/users est restreint à ROLE_ADMIN — les non-admins reçoivent []
 */
import api from "@/api/axios";

async function safeGet(url) {
  try {
    const res = await api.get(url);
    return res.data;
  } catch {
    return [];
  }
}

export async function getAllUsers() {
  return safeGet("/api/users");
}

export async function getActiveUsers() {
  const users = await safeGet("/api/users");
  return users.filter((u) => u.statut === "ACTIF");
}

export async function getUserById(id) {
  try {
    const res = await api.get(`/api/users/${id}`);
    return res.data;
  } catch {
    return null;
  }
}

// Les mutations ci-dessous sont gérées par admin.api.js — stubs de compatibilité
export async function createUser() { return null; }
export async function updateUser() { return null; }
export async function changeUserStatut() { return null; }
export async function updateUserRoles() { return null; }
