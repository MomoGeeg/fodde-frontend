/**
 * Service RAF (Responsable Administratif & Financier) — Supabase
 * Tables : projets, depenses, lignes_budgetaires, tresorerie,
 *          missions, acquisitions, rapports, decaissements,
 *          avances, comptes_bancaires
 *
 * Ce service fournit une vue « RAF » transversale sur les données
 * financières de l'ensemble des projets.
 */
import { supabase } from "@/lib/supabase";

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES UI
// ════════════════════════════════════════════════════════════════════════════

export const SEUIL_APPROBATION_SE = 500_000; // XOF

export const STATUT_DEPENSE_COLORS = {
  BROUILLON: "bg-gray-100 text-gray-600",
  SOUMISE: "bg-blue-100 text-blue-700",
  VERIFIEE: "bg-indigo-100 text-indigo-700",
  EN_APPROBATION_SE: "bg-orange-100 text-orange-700",
  VALIDEE: "bg-green-100 text-green-700",
  REJETEE: "bg-red-100 text-red-600",
  ANNULEE: "bg-gray-200 text-gray-400",
};

export const TYPES_RAPPORT = {
  EXECUTION_BUDGETAIRE: "Rapport d'exécution budgétaire",
  RAPPORT_BAILLEUR: "Rapport bailleur",
  GRAND_LIVRE: "Grand livre des dépenses",
  CAISSE_ANTENNES: "Rapport de caisse antennes",
};

export const CATEGORIES_ACQUISITION = [
  "EQUIPEMENT",
  "MATERIEL_AGRICOLE",
  "MATERIEL_MEDICAL",
  "INFORMATIQUE",
  "VEHICULE",
  "MOBILIER",
  "AUTRE",
];

// ════════════════════════════════════════════════════════════════════════════
// PROJETS (vue RAF — tous les projets avec données financières)
// ════════════════════════════════════════════════════════════════════════════

export async function getProjetsRAF() {
  const { data, error } = await supabase
    .from("projets")
    .select("*")
    .in("statut", ["ACTIF", "EN_COURS", "EN_CLOTURE"])
    .order("code", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

// ════════════════════════════════════════════════════════════════════════════
// ALERTES RAF (calcul côté client ou via une vue Supabase)
// ════════════════════════════════════════════════════════════════════════════

export async function getAlertesRAF() {
  // Les alertes sont calculées côté client à partir des données
  // Si une vue ou fonction Supabase existe, l'appeler ici.
  // Sinon, on compose les alertes dans le composant.
  const { data, error } = await supabase
    .from("alertes_raf")
    .select("*")
    .order("niveau", { ascending: true });

  if (error) {
    // Si la table n'existe pas, retourner un tableau vide
    // Les composants calculeront les alertes localement
    console.warn(
      "Table alertes_raf non trouvée, calcul côté client.",
      error.message,
    );
    return [];
  }
  return data;
}

// ════════════════════════════════════════════════════════════════════════════
// DÉPENSES EN ATTENTE (vue RAF)
// ════════════════════════════════════════════════════════════════════════════

export async function getDepensesEnAttente() {
  const { data, error } = await supabase
    .from("depenses")
    .select("*")
    .in("statut", ["SOUMISE", "EN_APPROBATION_SE"])
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getDepensesCount() {
  const { count, error } = await supabase
    .from("depenses")
    .select("*", { count: "exact", head: true })
    .in("statut", ["SOUMISE", "EN_APPROBATION_SE"]);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function validerDepense(id) {
  const { data, error } = await supabase
    .from("depenses")
    .update({
      statut: "VALIDEE",
      date_validation: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function transmettreAuSE(id) {
  const { data, error } = await supabase
    .from("depenses")
    .update({ statut: "EN_APPROBATION_SE" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function rejeterDepense(id, motif) {
  const { data, error } = await supabase
    .from("depenses")
    .update({
      statut: "REJETEE",
      motif_rejet: motif,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ════════════════════════════════════════════════════════════════════════════
// LIGNES BUDGÉTAIRES (vue transversale tous projets)
// ════════════════════════════════════════════════════════════════════════════

export async function getAllLignesBudgetaires() {
  const { data, error } = await supabase
    .from("lignes_budgetaires")
    .select("*")
    .order("code", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getLignesByProjet(projetId) {
  const { data, error } = await supabase
    .from("lignes_budgetaires")
    .select("*")
    .eq("projet_id", projetId)
    .order("code", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function virementBudgetaire(idSource, idCible, montant, motif) {
  const { data, error } = await supabase
    .from("virements_budgetaires")
    .insert({
      ligne_source_id: idSource,
      ligne_cible_id: idCible,
      montant,
      motif,
      date: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ════════════════════════════════════════════════════════════════════════════
// TRÉSORERIE
// ════════════════════════════════════════════════════════════════════════════

export async function getComptes() {
  const { data, error } = await supabase
    .from("comptes_bancaires")
    .select("*")
    .order("nom", { ascending: true });

  if (error) {
    // Fallback vers "tresorerie" si la table s'appelle différemment
    const { data: fallback, error: fbErr } = await supabase
      .from("tresorerie")
      .select("*")
      .order("nom", { ascending: true });
    if (fbErr) throw new Error(fbErr.message);
    return fallback;
  }
  return data;
}

export async function getEvolutionTresorerie() {
  const { data, error } = await supabase
    .from("evolution_tresorerie")
    .select("*")
    .order("mois", { ascending: true });

  if (error) {
    // Si pas de table dédiée, retourner un tableau vide
    console.warn("Table evolution_tresorerie non trouvée", error.message);
    return [];
  }
  return data;
}

export async function getDecaissements() {
  const { data, error } = await supabase
    .from("decaissements")
    .select("*")
    .order("date_prevue", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getAvancesNonJustifiees() {
  const { data, error } = await supabase
    .from("avances")
    .select("*")
    .eq("justifiee", false)
    .order("date_avance", { ascending: true });

  if (error) {
    // Fallback : table "avances_non_justifiees"
    const { data: fallback, error: fbErr } = await supabase
      .from("avances_non_justifiees")
      .select("*")
      .order("date_avance", { ascending: true });
    if (fbErr) throw new Error(fbErr.message);
    return fallback;
  }
  return data;
}

// ════════════════════════════════════════════════════════════════════════════
// MISSIONS (validation RAF)
// ════════════════════════════════════════════════════════════════════════════

export async function getMissions() {
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .order("date_debut", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getMissionsEnAttente() {
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .in("statut", ["SOUMISE", "APPROUVEE_N1"])
    .order("soumis_le", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function validerMission(id) {
  const { data, error } = await supabase
    .from("missions")
    .update({ statut: "VALIDEE_RAF" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function rejeterMission(id, motif) {
  const { data, error } = await supabase
    .from("missions")
    .update({ statut: "REJETEE", motif_rejet: motif })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ════════════════════════════════════════════════════════════════════════════
// ACQUISITIONS
// ════════════════════════════════════════════════════════════════════════════

export async function getAcquisitions() {
  const { data, error } = await supabase
    .from("acquisitions")
    .select("*")
    .order("date_acquisition", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getAcquisitionsEnAttente() {
  const { data, error } = await supabase
    .from("acquisitions")
    .select("*")
    .eq("statut", "EN_ATTENTE")
    .order("date_acquisition", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function validerAcquisition(id) {
  const { data, error } = await supabase
    .from("acquisitions")
    .update({ statut: "VALIDEE" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function rejeterAcquisition(id, motif) {
  const { data, error } = await supabase
    .from("acquisitions")
    .update({ statut: "REJETEE", motif_rejet: motif })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ════════════════════════════════════════════════════════════════════════════
// RAPPORTS
// ════════════════════════════════════════════════════════════════════════════

export async function getRapports() {
  const { data, error } = await supabase
    .from("rapports")
    .select("*")
    .order("date_generation", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function genererRapport(params) {
  const { data, error } = await supabase
    .from("rapports")
    .insert({
      ...params,
      type_label: TYPES_RAPPORT[params.type] || params.type,
      date_generation: new Date().toISOString(),
      archive: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS CLIENT
// ════════════════════════════════════════════════════════════════════════════

/**
 * Calcule les alertes RAF à partir des données projets, dépenses, avances.
 */
export function computeAlertesRAF({
  projets = [],
  depenses = [],
  avances = [],
  lignes = [],
}) {
  const alertes = [];
  const today = new Date();

  // Budget > 90%
  projets.forEach((p) => {
    if (!p.budget || !p.depense) return;
    const taux = (p.depense / p.budget) * 100;
    if (taux >= 90) {
      alertes.push({
        type: "BUDGET_90",
        niveau: "CRITIQUE",
        message: `${p.code} a dépassé 90% de consommation budgétaire`,
        details: `Budget : ${p.budget?.toLocaleString("fr-SN")} F | Dépensé : ${p.depense?.toLocaleString("fr-SN")} F (${taux.toFixed(1)}%)`,
      });
    } else if (taux >= 80) {
      alertes.push({
        type: "BUDGET_80",
        niveau: "WARNING",
        message: `${p.code} a atteint ${taux.toFixed(0)}% de consommation budgétaire`,
        details: `Budget : ${p.budget?.toLocaleString("fr-SN")} F | Dépensé : ${p.depense?.toLocaleString("fr-SN")} F`,
      });
    }
  });

  // Avances non justifiées > 30 jours
  avances.forEach((a) => {
    const jours = Math.floor(
      (today - new Date(a.date_avance ?? a.dateAvance)) / (1000 * 60 * 60 * 24),
    );
    if (jours > 30) {
      alertes.push({
        type: "AVANCE_30J",
        niveau: jours > 45 ? "CRITIQUE" : "DANGER",
        message: `Avance non justifiée > 30 jours — ${a.beneficiaire}`,
        details: `${a.montant?.toLocaleString("fr-SN")} F depuis ${jours} jours`,
      });
    }
  });

  // Dépenses en attente > 7 jours
  const depAttente = depenses.filter((d) =>
    ["SOUMISE", "EN_APPROBATION_SE"].includes(d.statut),
  );
  const depLongues = depAttente.filter((d) => {
    const jours = Math.floor(
      (today - new Date(d.datesoumission ?? d.date_soumission ?? d.date)) /
        (1000 * 60 * 60 * 24),
    );
    return jours > 7;
  });
  if (depLongues.length > 0) {
    alertes.push({
      type: "DEPENSE_7J",
      niveau: "WARNING",
      message: `${depLongues.length} dépense(s) en attente depuis plus de 7 jours`,
      details: depLongues
        .map((d) => d.numero_piece ?? d.numeroPiece)
        .join(", "),
    });
  }

  // Lignes budgétaires épuisées (prévu - dépense - engagé < 0)
  lignes.forEach((l) => {
    const solde = (l.prevu ?? 0) - (l.depense ?? 0) - (l.engage ?? 0);
    if (solde < 0 && !l.is_categorie && !l.isCategorie) {
      alertes.push({
        type: "LIGNE_EPUISEE",
        niveau: "DANGER",
        message: `Ligne ${l.code} (${l.intitule}) solde négatif`,
        details: `Prévu : ${l.prevu?.toLocaleString("fr-SN")} F | Dépensé + Engagé : ${((l.depense ?? 0) + (l.engage ?? 0)).toLocaleString("fr-SN")} F`,
      });
    }
  });

  return alertes;
}
