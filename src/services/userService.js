/**
 * Service Utilisateurs — Supabase
 * Table : users + user_roles + roles
 */
import { supabase } from "@/lib/supabase";

/**
 * Utilitaire : récupère les rôles pour un user et les ajoute à l'objet.
 */
async function attachRoles(user) {
  if (!user) return user;
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role_id, roles(nom)")
    .eq("user_id", user.id);
  user.roles = roleData?.map((r) => r.roles?.nom).filter(Boolean) ?? [];
  return user;
}

async function attachRolesToList(users) {
  if (!users?.length) return users;
  // Batch : récupérer tous les rôles en une requête
  const ids = users.map((u) => u.id);
  const { data: allRoles } = await supabase
    .from("user_roles")
    .select("user_id, roles(nom)")
    .in("user_id", ids);

  const rolesMap = {};
  for (const r of allRoles ?? []) {
    if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
    if (r.roles?.nom) rolesMap[r.user_id].push(r.roles.nom);
  }
  return users.map((u) => ({ ...u, roles: rolesMap[u.id] ?? [] }));
}

/**
 * Lista tous les utilisateurs avec leurs rôles.
 */
export async function getAllUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("nom", { ascending: true });

  if (error) throw new Error(error.message);
  return attachRolesToList(data);
}

/**
 * Utilisateurs actifs uniquement.
 */
export async function getActiveUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("statut", "ACTIF")
    .order("nom", { ascending: true });

  if (error) throw new Error(error.message);
  return attachRolesToList(data);
}

/**
 * Récupère un utilisateur par ID.
 */
export async function getUserById(id) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return attachRoles(data);
}

/**
 * Crée un nouveau utilisateur.
 * L'inscription Supabase Auth est gérée côté authService (ou admin API).
 */
export async function createUser(userData) {
  const { roles, ...userFields } = userData;
  const { data, error } = await supabase
    .from("users")
    .insert(userFields)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return attachRoles(data);
}

/**
 * Met à jour le profil d'un utilisateur.
 */
export async function updateUser(id, updates) {
  const { roles, ...updateFields } = updates;
  const { data, error } = await supabase
    .from("users")
    .update(updateFields)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return attachRoles(data);
}

/**
 * Active / désactive un utilisateur.
 */
export async function changeUserStatut(id, statut) {
  return updateUser(id, { statut });
}

/**
 * Met à jour les rôles d'un utilisateur.
 */
export async function updateUserRoles(id, roleNames) {
  // 1. Récupérer les IDs des rôles par nom
  const { data: rolesData } = await supabase
    .from("roles")
    .select("id, nom")
    .in("nom", roleNames);

  // 2. Supprimer les anciens rôles
  await supabase.from("user_roles").delete().eq("user_id", id);

  // 3. Insérer les nouveaux
  if (rolesData?.length) {
    await supabase
      .from("user_roles")
      .insert(rolesData.map((r) => ({ user_id: id, role_id: r.id })));
  }

  return getUserById(id);
}
