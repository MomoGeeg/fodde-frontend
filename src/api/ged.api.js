// ============================================================
// API GED — proxy vers les services Supabase
// ============================================================
import * as ged from "@/services/gedService";

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
      .in("statut", ["ACTIF", "EN_COURS"])
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
  getDocumentsByRepertoire: async (
    repertoire,
    { sousRepertoire, projetId } = {},
  ) => {
    let docs = await ged.getDocumentsByRepertoire(repertoire);
    if (sousRepertoire)
      docs = docs.filter((d) => d.sous_repertoire === sousRepertoire);
    if (projetId !== undefined && projetId !== null)
      docs = docs.filter((d) => d.projet_id === projetId);
    return docs;
  },

  // ─── File de validation ──────────────────────────────────
  getDocumentsEnValidation: async () => {
    const docs = await ged.getAllDocuments();
    return docs.filter((d) => d.statut === "EN_VALIDATION");
  },

  getValidationCount: async () => {
    const docs = await ged.getAllDocuments();
    return docs.filter((d) => d.statut === "EN_VALIDATION").length;
  },

  // ─── Document unique ─────────────────────────────────────
  getDocument: (id) => ged.getDocumentById(id),

  // ─── Versions ───────────────────────────────────────────
  getVersions: (docId) => ged.getVersionsByDocument(docId),

  // ─── Journal d'accès ────────────────────────────────────
  getAccessLog: (docId) => ged.getAccessLog(docId),

  // ─── Recherche ──────────────────────────────────────────
  searchDocuments: async (query) => {
    if (!query || query.trim().length < 2) return [];
    const docs = await ged.getAllDocuments();
    const q = query.toLowerCase();
    return docs.filter(
      (d) =>
        d.statut !== "ARCHIVE" &&
        ((d.titre ?? "").toLowerCase().includes(q) ||
          (d.type ?? "").toLowerCase().includes(q) ||
          (d.description ?? "").toLowerCase().includes(q)),
    );
  },

  // ─── Dépôt de document ──────────────────────────────────
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

    const doc = await ged.createDocument({
      titre: data.titre,
      type: data.type,
      repertoire: data.repertoire,
      sous_repertoire: data.sousRepertoire,
      projet_id: data.projetId ?? null,
      visibilite: data.visibilite,
      depose_par: data.deposePar,
      description: data.description,
      fichier: data.fichier,
      format: data.fichier?.split(".").pop()?.toUpperCase() ?? "PDF",
      taille: data.taille,
    });
    return { success: true, docId: doc.id, statut: doc.statut };
  },

  // ─── Valider / Rejeter ──────────────────────────────────
  validerDocument: async (id) => {
    await ged.validerDocument(id);
    return { success: true };
  },

  rejeterDocument: async (id, motif) => {
    await ged.rejeterDocument(id, motif);
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
