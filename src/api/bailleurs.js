// ─────────────────────────────────────────────────────────────────────────────
// Bailleurs de fonds et financements (conventions) des projets.
// Une convention = un bailleur finance un projet, pour un montant et une période.
// ─────────────────────────────────────────────────────────────────────────────
import api from "@/api/axios";
import { R } from "@/lib/navigation";
import { useQuery } from "@tanstack/react-query";

/** Rôles qui enregistrent les bailleurs et les conventions. */
export const GESTIONNAIRES_BAILLEURS = [R.RAF, R.SE, R.ADMIN];

const liste = (r) => (Array.isArray(r.data) ? r.data : []);

export function useBailleurs() {
  return useQuery({
    queryKey: ["bailleurs"],
    queryFn: async () => liste(await api.get("/api/bailleurs")),
    staleTime: 5 * 60_000,
  });
}

/** Financements, filtrés par projet et/ou bailleur (facultatifs). */
export function useFinancements({ projetId, bailleurId } = {}) {
  return useQuery({
    queryKey: ["financements", projetId ?? "tous", bailleurId ?? "tous"],
    queryFn: async () => liste(await api.get("/api/financements", { params: { projetId, bailleurId } })),
    staleTime: 60_000,
  });
}

export const creerBailleur = (payload) => api.post("/api/bailleurs", payload).then((r) => r.data);
export const creerFinancement = (payload) => api.post("/api/financements", payload).then((r) => r.data);

/** Nom court d'un bailleur : sigle s'il existe, sinon nom. */
export const nomCourt = (b) => b?.bailleurSigle || b?.sigle || b?.bailleurNom || b?.nom || "—";
