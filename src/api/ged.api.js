// ============================================================
// API GED — proxy vers les services Supabase
// ============================================================
import * as ged from "@/services/gedService";

// Cache projets (rechargé à chaque call de getProjets)
let _projetsCache = [];
// Cache utilisateurs : Map<userId, { nom, prenom, role }>
let _usersCache = {};

const ROLE_LABELS = {
  ROLE_ADMIN: "Administrateur",
  ROLE_SE: "Secrétaire Exécutif",
  ROLE_SECRETAIRE_EXECUTIF: "Secrétaire Exécutif",
  ROLE_RAF: "RAF",
  ROLE_RH: "Responsable RH",
  ROLE_RESPONSABLE_PROGRAMMES: "Responsable Programmes",
  ROLE_CHARGE_PROGRAMME: "Chargé de Programme",
  ROLE_RESPONSABLE_SE: "Responsable S&E",
  ROLE_CHARGE_COMMUNICATION: "Chargé de Communication",
  ROLE_COMPTABLE: "Comptable",
  ROLE_ANTENNE: "Antenne",
  ROLE_USER: "Utilisateur",
};

/** Résout un UUID utilisateur en "Prénom Nom · Rôle" */
function resolveUserLabel(userId) {
  if (!userId) return "—";
  const u = _usersCache[userId];
  if (!u) return "—";
  const nomComplet = `${u.prenom ?? ""} ${u.nom ?? ""}`.trim() || "—";
  const roleLabel = u.role ? (ROLE_LABELS[u.role] ?? u.role) : null;
  return roleLabel ? `${nomComplet} · ${roleLabel}` : nomComplet;
}

/**
 * Enrichit un document Supabase (colonnes DB) avec les alias
 * attendus par toutes les pages GED de l'application.
 *
 * Colonnes DB → alias UI :
 *   type_document      → type
 *   version_actuelle   → version
 *   created_at         → dateDepot
 *   date_validation    → dateValidation
 *   valide_par         → valideePar (UUID) + valideeParLabel
 *   created_by         → deposePar  (nom complet · rôle)
 *   projet_id          → projetId, projetCode, projetTitre, repertoire
 */
function enrichDoc(doc) {
  if (!doc) return doc;
  const projet = _projetsCache.find((p) => p.id === doc.projet_id);
  return {
    ...doc,
    // Alias attendus par les pages
    type: doc.type_document,
    version: doc.version_actuelle ?? 1,
    dateDepot: doc.created_at,
    dateValidation: doc.date_validation,
    valideePar: doc.valide_par ?? null,
    valideeParLabel: resolveUserLabel(doc.valide_par),
    deposePar: resolveUserLabel(doc.created_by),
    projetId: doc.projet_id,
    projetCode: projet?.code ?? null,
    projetTitre: projet?.titre ?? null,
    repertoire: doc.projet_id ? "projets" : null,
  };
}

function enrichDocs(docs) {
  return docs.map(enrichDoc);
}

/** Charge les projets en cache (appel léger, résultat réutilisé par enrichDoc) */
async function loadProjetsCache() {
  if (_projetsCache.length > 0) return;
  try {
    const { supabase } = await import("@/lib/supabase");
    const { data } = await supabase
      .from("projets")
      .select("id, code, titre, statut")
      .order("code");
    _projetsCache = data ?? [];
  } catch {
    _projetsCache = [];
  }
}

/** Charge les utilisateurs + rôles en cache (users + user_roles + roles) */
async function loadUsersCache() {
  if (Object.keys(_usersCache).length > 0) return;
  try {
    const { supabase } = await import("@/lib/supabase");
    const [usersRes, urRes, rolesRes] = await Promise.all([
      supabase.from("users").select("id, nom, prenom"),
      supabase.from("user_roles").select("user_id, role_id"),
      supabase.from("roles").select("id, nom"),
    ]);
    const users = usersRes.data ?? [];
    const userRoles = urRes.data ?? [];
    const roles = rolesRes.data ?? [];

    const rolesMap = Object.fromEntries(roles.map((r) => [r.id, r.nom]));

    for (const u of users) {
      const ur = userRoles.find((x) => x.user_id === u.id);
      _usersCache[u.id] = {
        nom: u.nom,
        prenom: u.prenom,
        role: ur ? (rolesMap[ur.role_id] ?? null) : null,
      };
    }
  } catch {
    // silently fail
  }
}

export const gedApi = {
  // ─── KPI & Répertoires ──────────────────────────────────
  getKPI: async () => {
    const docs = await ged.getAllDocuments();
    return ged.computeKpiGed(docs);
  },

  getRepertoires: () => ged.getAllRepertoires(),

  // ─── Projets ────────────────────────────────────────────
  getProjets: async () => {
    const { supabase } = await import("@/lib/supabase");
    const { data, error } = await supabase
      .from("projets")
      .select("id, code, titre, statut")
      .order("code");
    if (error) throw new Error(error.message);

    // Enrichir chaque projet avec le nombre de docs
    const docs = await ged.getAllDocuments();
    return data.map((p) => {
      const pDocs = docs.filter(
        (d) => d.projet_id === p.id && d.statut !== "ARCHIVE",
      );
      const enValidation = pDocs.filter(
        (d) => d.statut === "EN_VALIDATION",
      ).length;
      return { ...p, nbDocs: pDocs.length, nbEnValidation: enValidation };
    });
  },

  // ─── Documents par répertoire ────────────────────────────
  // Mapping sous-répertoire → type_document pour filtrage
  _SOUS_REP_TYPE_MAP: {
    // projets
    contrats: ["CONTRAT"],
    rapports: ["RAPPORT"],
    justificatifs: ["JUSTIFICATIF"],
    terrain: ["PHOTO", "AUTRE"],
    // rh
    dossiers_personnel: ["CONTRAT", "AUTRE"],
    politiques_rh: ["POLITIQUE"],
    // institutionnel
    statuts: ["POLITIQUE"],
    pv_ca: ["PV"],
    politiques: ["POLITIQUE"],
    agrements: ["CONVENTION", "AUTRE"],
    // bailleurs
    conventions: ["CONVENTION"],
    rapports_bailleurs: ["RAPPORT"],
    correspondances: ["AUTRE"],
    // communication
    supports: ["AUTRE"],
    photos_terrain: ["PHOTO"],
  },

  getDocumentsByRepertoire: async (
    repertoire,
    { sousRepertoire, projetId } = {},
  ) => {
    await Promise.all([loadProjetsCache(), loadUsersCache()]);
    const allDocs = await ged.getAllDocuments();
    let docs;

    if (repertoire === "projets") {
      if (projetId !== undefined && projetId !== null) {
        docs = allDocs.filter((d) => d.projet_id === projetId);
      } else {
        docs = allDocs.filter((d) => d.projet_id != null);
      }
    } else {
      docs = allDocs.filter((d) => !d.projet_id);
    }

    // Filtrage par sous-répertoire via type_document
    if (sousRepertoire) {
      const types = gedApi._SOUS_REP_TYPE_MAP[sousRepertoire];
      if (types) {
        docs = docs.filter((d) => types.includes(d.type_document));
      }
    }

    return enrichDocs(docs);
  },

  // ─── File de validation ──────────────────────────────────
  // userId : exclut les documents déposés par cet utilisateur
  getDocumentsEnValidation: async (userId) => {
    await Promise.all([loadProjetsCache(), loadUsersCache()]);
    const docs = await ged.getAllDocuments();
    return enrichDocs(
      docs.filter(
        (d) =>
          d.statut === "EN_VALIDATION" && (!userId || d.created_by !== userId),
      ),
    );
  },

  getValidationCount: async (userId) => {
    const docs = await ged.getAllDocuments();
    return docs.filter(
      (d) =>
        d.statut === "EN_VALIDATION" && (!userId || d.created_by !== userId),
    ).length;
  },

  // ─── Document unique ─────────────────────────────────────
  getDocument: async (id) => {
    await Promise.all([loadProjetsCache(), loadUsersCache()]);
    const doc = await ged.getDocumentById(id);
    return enrichDoc(doc);
  },

  // ─── Versions ───────────────────────────────────────────
  getVersions: (docId) => ged.getVersionsByDocument(docId),

  // ─── Journal d'accès ────────────────────────────────────
  getAccessLog: (docId) => ged.getAccessLog(docId),

  // ─── Documents récents ──────────────────────────────────
  getRecentDocuments: async () => {
    await Promise.all([loadProjetsCache(), loadUsersCache()]);
    const docs = await ged.getAllDocuments();
    return enrichDocs(docs.filter((d) => d.statut !== "ARCHIVE").slice(0, 10));
  },

  // ─── Recherche ──────────────────────────────────────────
  searchDocuments: async (query) => {
    if (!query || query.trim().length < 2) return [];
    await Promise.all([loadProjetsCache(), loadUsersCache()]);
    const docs = await ged.getAllDocuments();
    const q = query.toLowerCase();
    const filtered = docs.filter(
      (d) =>
        d.statut !== "ARCHIVE" &&
        ((d.titre ?? "").toLowerCase().includes(q) ||
          (d.type_document ?? "").toLowerCase().includes(q) ||
          (d.description ?? "").toLowerCase().includes(q)),
    );
    return enrichDocs(filtered);
  },

  // ─── Dépôt de document ──────────────────────────────────
  /**
   * Types ne nécessitant PAS de validation — validés automatiquement
   * pour tous les utilisateurs.
   */
  _TYPES_SANS_VALIDATION: ["PHOTO", "AUTRE"],

  deposerDocument: async (data) => {
    if (data.nouvelleVersionDeId) {
      const version = await ged.createVersion({
        document_id: data.nouvelleVersionDeId,
        depose_par: data.deposePar,
        commentaire: data.commentaire,
        taille: data.taille,
        fichier: data.fichier,
      });
      return {
        success: true,
        docId: data.nouvelleVersionDeId,
        estNouvelleVersion: true,
        version,
      };
    }

    // ─── Règles métier de validation ──────────────────────────
    const roles = data.roles ?? [];
    const isSE = roles.includes("ROLE_SE");
    const typeSansValidation = gedApi._TYPES_SANS_VALIDATION.includes(
      data.type,
    );

    // 1) SE → toujours auto-validé
    // 2) Type sans validation (PHOTO, AUTRE) → auto-validé pour tous
    // 3) Sinon → brouillon (nécessite soumission puis validation)
    const autoValide = isSE || typeSansValidation;
    const statut = autoValide ? "VALIDE" : "BROUILLON";

    const doc = await ged.createDocument({
      titre: data.titre,
      type_document: data.type,
      description: data.description,
      visibilite: data.visibilite,
      projet_id: data.projetId ?? null,
      created_by: data.createdBy ?? null,
      statut,
      version_actuelle: 1,
      accessible_ca: false,
      ...(autoValide
        ? {
            date_validation: new Date().toISOString(),
            valide_par: data.createdBy,
          }
        : {}),
    });
    return { success: true, docId: doc.id, statut: doc.statut };
  },

  // ─── Valider / Rejeter ──────────────────────────────────
  validerDocument: async (id, userId) => {
    await ged.updateDocument(id, {
      statut: "VALIDE",
      date_validation: new Date().toISOString(),
      valide_par: userId ?? null,
    });
    return { success: true };
  },

  rejeterDocument: async (id, motif) => {
    // Rejet → retour en BROUILLON pour correction par le déposant
    await ged.updateDocument(id, {
      statut: "BROUILLON",
      motif_rejet: motif,
      date_validation: null,
      valide_par: null,
    });
    return { success: true };
  },

  // ─── Soumettre pour validation ───────────────────────────
  soumettrePourValidation: async (id) => {
    await ged.updateDocument(id, { statut: "EN_VALIDATION" });
    return { success: true };
  },

  // ─── Archiver ───────────────────────────────────────────
  archiverDocument: async (id) => {
    await ged.archiverDocument(id);
    return { success: true };
  },

  // ─── Log téléchargement ──────────────────────────────────
  logTelechargement: async (docId, nom) => {
    await ged.logTelechargement(docId, nom);
    return { success: true };
  },
};
