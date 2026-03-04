import useAuthStore from "@/stores/auth.store";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Eye,
  Filter,
  Loader2,
  MessageSquare,
  Search,
  Shield,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  createSEHelpers,
  STATUT_COLORS,
  STATUTS_COLLECTE,
  useCollectes,
  useIndicateurs,
  useMembres,
  useProjets,
  useReponsesEnAttente,
} from "./se-data";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

// ════════════════════════════════════════════════════════════
// PAGE 8 — File de validation (deux niveaux)
// ════════════════════════════════════════════════════════════
export default function SEValidation() {
  const { user } = useAuthStore();

  const isResponsableSE = user?.roles?.includes("ROLE_RESPONSABLE_SE");
  const isCP = user?.roles?.includes("ROLE_CHARGE_PROGRAMME");
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");
  const canFinalValidate = isResponsableSE || isAdmin;
  // Données Supabase
  const { data: projets = [] } = useProjets();
  const { data: indicateurs = [] } = useIndicateurs();
  const { data: membres = [] } = useMembres();
  const { data: collectes = [] } = useCollectes();
  const { data: reponses = [] } = useReponsesEnAttente();

  const { getIndicateur, getMembre, getProjet } = createSEHelpers(
    projets,
    membres,
    indicateurs,
    collectes,
    [],
    reponses,
  );
  // ── Onglets ──────────────────────────────────────────────
  const [tab, setTab] = useState("collectes"); // collectes | reponses

  // ── Filtres ──────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterProjet, setFilterProjet] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // ── Modal ────────────────────────────────────────────────
  const [modal, setModal] = useState(null); // { type, item, action }
  const [motifRejet, setMotifRejet] = useState("");
  const [processing, setProcessing] = useState(false);

  // ── Données collectes ────────────────────────────────────
  const collectesData = useMemo(() => {
    let list = collectes.filter(
      (c) => c.statut === "EN_ATTENTE" || c.statut === "PRE_VALIDEE",
    );

    // CP ne voit que ses projets
    if (isCP && !canFinalValidate) {
      const mesProjectIds = ["p001", "p002", "p003"]; // mock
      list = list.filter((c) => {
        const ind = getIndicateur(c.indicateurId);
        return ind && mesProjectIds.includes(ind.projetId);
      });
    }

    // Filtres
    if (filterProjet !== "all") {
      list = list.filter((c) => {
        const ind = getIndicateur(c.indicateurId);
        return ind?.projetId === filterProjet;
      });
    }
    if (filterStatut !== "all") {
      list = list.filter((c) => c.statut === filterStatut);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((c) => {
        const ind = getIndicateur(c.indicateurId);
        return (
          ind?.libelle?.toLowerCase().includes(s) ||
          ind?.code?.toLowerCase().includes(s)
        );
      });
    }

    return list;
  }, [
    filterProjet,
    filterStatut,
    search,
    isCP,
    canFinalValidate,
    collectes,
    indicateurs,
  ]);

  // ── Données réponses formulaires ─────────────────────────
  const reponsesData = useMemo(() => {
    let list = reponses.filter((r) => r.statut === "EN_ATTENTE");

    if (isCP && !canFinalValidate) {
      const mesProjectIds = ["p001", "p002", "p003"];
      list = list.filter((r) => mesProjectIds.includes(r.projetId));
    }

    if (filterProjet !== "all") {
      list = list.filter((r) => {
        return r.projetId === filterProjet;
      });
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.formulaireId?.toLowerCase().includes(s) ||
          r.id?.toLowerCase().includes(s),
      );
    }

    return list;
  }, [filterProjet, search, isCP, canFinalValidate, reponses]);

  const activeFilters = [filterProjet, filterStatut].filter(
    (f) => f !== "all",
  ).length;

  // ── Compteurs ────────────────────────────────────────────
  const enAttente = collectes.filter((c) => c.statut === "EN_ATTENTE").length;
  const preValidees = collectes.filter(
    (c) => c.statut === "PRE_VALIDEE",
  ).length;
  const reponsesEnAttente = reponses.filter(
    (r) => r.statut === "EN_ATTENTE",
  ).length;

  // ── Actions ──────────────────────────────────────────────
  const handleAction = (type, item, action) => {
    if (action === "reject") {
      setModal({ type, item, action });
      setMotifRejet("");
    } else {
      setModal({ type, item, action });
    }
  };

  const confirmAction = () => {
    if (modal.action === "reject" && !motifRejet.trim()) {
      toast.error("Veuillez saisir un motif de rejet");
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      const labels = {
        prevalidate: "pré-validé",
        validate: "validé",
        reject: "rejeté",
      };
      toast.success(`Élément ${labels[modal.action]} avec succès`);
      setModal(null);
    }, 500);
  };

  return (
    <div className="space-y-5">
      {/* KPIs de validation */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <div className="rounded-lg bg-orange-100 p-2">
            <Clock size={18} className="text-orange-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-700">{enAttente}</p>
            <p className="text-[10px] text-orange-500">Collectes en attente</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="rounded-lg bg-blue-100 p-2">
            <Shield size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-700">{preValidees}</p>
            <p className="text-[10px] text-blue-500">Pré-validées (→ final)</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-purple-200 bg-purple-50 p-4">
          <div className="rounded-lg bg-purple-100 p-2">
            <MessageSquare size={18} className="text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-700">
              {reponsesEnAttente}
            </p>
            <p className="text-[10px] text-purple-500">Réponses formulaires</p>
          </div>
        </div>
      </div>

      {/* Workflow explication */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h4 className="text-xs font-semibold text-gray-500 mb-2">
          Workflow de validation à 2 niveaux
        </h4>
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-orange-700 font-semibold">
            <Clock size={9} /> EN_ATTENTE
          </span>
          <span>→</span>
          <span className="text-gray-400">
            {isCP ? "Vous pré-validez" : "Le CP pré-valide"}
          </span>
          <span>→</span>
          <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-blue-700 font-semibold">
            <Shield size={9} /> PRÉ-VALIDÉE
          </span>
          <span>→</span>
          <span className="text-gray-400">
            {canFinalValidate ? "Vous validez" : "Le Resp. S&E valide"}
          </span>
          <span>→</span>
          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-green-700 font-semibold">
            <CheckCircle2 size={9} /> VALIDÉE
          </span>
        </div>
      </div>

      {/* Onglets Collectes / Réponses */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab("collectes")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "collectes"
              ? "border-green-600 text-green-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <ClipboardCheck size={14} className="inline mr-1.5 -mt-0.5" />
          Collectes
          {enAttente + preValidees > 0 && (
            <span className="ml-1.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-700">
              {enAttente + preValidees}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("reponses")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "reponses"
              ? "border-green-600 text-green-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <MessageSquare size={14} className="inline mr-1.5 -mt-0.5" />
          Réponses formulaires
          {reponsesEnAttente > 0 && (
            <span className="ml-1.5 rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-700">
              {reponsesEnAttente}
            </span>
          )}
        </button>
      </div>

      {/* Barre de filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={15}
          />
          <input
            type="text"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm shadow-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100 w-56"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium shadow-sm transition-colors ${
            showFilters || activeFilters
              ? "border-green-300 bg-green-50 text-green-700"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Filter size={13} /> Filtres
          {activeFilters > 0 && (
            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-[9px] text-white">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Projet
            </label>
            <select
              value={filterProjet}
              onChange={(e) => setFilterProjet(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-green-400 focus:ring-2 focus:ring-green-100"
            >
              <option value="all">Tous</option>
              {projets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code}
                </option>
              ))}
            </select>
          </div>
          {tab === "collectes" && (
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Statut
              </label>
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-green-400 focus:ring-2 focus:ring-green-100"
              >
                <option value="all">Tous</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="PRE_VALIDEE">Pré-validée</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Contenu onglet */}
      {tab === "collectes" ? (
        <CollectesTab
          data={collectesData}
          isCP={isCP}
          canFinalValidate={canFinalValidate}
          onAction={handleAction}
          getIndicateur={getIndicateur}
          getProjet={getProjet}
          getMembre={getMembre}
        />
      ) : (
        <ReponsesTab
          data={reponsesData}
          canFinalValidate={canFinalValidate}
          isCP={isCP}
          onAction={handleAction}
          getMembre={getMembre}
        />
      )}

      {/* Modal de confirmation/rejet */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-sm font-bold text-gray-900">
                {modal.action === "prevalidate" && "Pré-valider"}
                {modal.action === "validate" && "Valider définitivement"}
                {modal.action === "reject" && "Rejeter"}
              </h3>
              <button
                onClick={() => setModal(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {modal.action === "reject" ? (
                <>
                  <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <p>
                      Le rejet renverra les données au collecteur pour
                      correction. Cette action est irréversible.
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Motif du rejet *
                    </label>
                    <textarea
                      value={motifRejet}
                      onChange={(e) => setMotifRejet(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                      placeholder="Expliquez la raison du rejet…"
                    />
                  </div>
                </>
              ) : modal.action === "validate" ? (
                <div className="flex items-start gap-2 rounded-xl bg-green-50 border border-green-200 p-3 text-xs text-green-700">
                  <ShieldCheck size={14} className="shrink-0 mt-0.5" />
                  <p>
                    La validation finale est <strong>irréversible</strong>. Les
                    données seront verrouillées et intégrées aux rapports.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
                  <Shield size={14} className="shrink-0 mt-0.5" />
                  <p>
                    La pré-validation confirme la cohérence des données. Le
                    Responsable S&E devra encore effectuer la validation finale.
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3">
              <button
                onClick={() => setModal(null)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmAction}
                disabled={processing}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium text-white disabled:opacity-50 ${
                  modal.action === "reject"
                    ? "bg-red-600 hover:bg-red-700"
                    : modal.action === "validate"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {processing && <Loader2 size={12} className="animate-spin" />}
                {modal.action === "prevalidate" && "Pré-valider"}
                {modal.action === "validate" && "Valider"}
                {modal.action === "reject" && "Rejeter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tableau des collectes en attente ────────────────────────
function CollectesTab({
  data,
  isCP,
  canFinalValidate,
  onAction,
  getIndicateur,
  getProjet,
  getMembre,
}) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
        <CheckCircle2 className="mx-auto mb-3 text-green-300" size={40} />
        <p className="text-sm text-gray-400">
          Aucune collecte en attente de validation.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-left">
            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Indicateur
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Projet
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Date collecte
            </th>
            <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Valeur
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Collecteur
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Statut
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Badges
            </th>
            <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((col) => {
            const ind = getIndicateur(col.indicateurId);
            const projet = ind ? getProjet(ind.projetId) : null;
            const collecteur = getMembre(col.collecteurId);
            const isEnAttente = col.statut === "EN_ATTENTE";
            const isPreValidee = col.statut === "PRE_VALIDEE";

            return (
              <tr key={col.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <span className="font-mono text-[10px] text-gray-400">
                      {ind?.code}
                    </span>
                    <p className="text-xs font-medium text-gray-900 truncate max-w-48">
                      {ind?.libelle}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {projet?.code}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {fmtDate(col.dateCollecte)}
                </td>
                <td className="px-4 py-3 text-center font-semibold text-gray-900">
                  {col.valeur}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {collecteur ? `${collecteur.prenom} ${collecteur.nom}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUT_COLORS[col.statut]}`}
                  >
                    {STATUTS_COLLECTE.find((s) => s.value === col.statut)
                      ?.label ?? col.statut}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {col.horsDelai && (
                      <span className="flex items-center gap-0.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-700">
                        <Clock size={8} /> Hors délai
                      </span>
                    )}
                    {col.horsLigne && (
                      <span className="flex items-center gap-0.5 rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-700">
                        Hors-ligne
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    {/* Pré-valider (CP si EN_ATTENTE) */}
                    {isEnAttente && (isCP || canFinalValidate) && (
                      <button
                        onClick={() => onAction("collecte", col, "prevalidate")}
                        className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700 hover:bg-blue-100"
                        title="Pré-valider"
                      >
                        <Shield size={10} /> Pré-val.
                      </button>
                    )}
                    {/* Valider final (Resp SE si PRE_VALIDEE) */}
                    {isPreValidee && canFinalValidate && (
                      <button
                        onClick={() => onAction("collecte", col, "validate")}
                        className="flex items-center gap-1 rounded-lg bg-green-50 px-2 py-1 text-[10px] font-medium text-green-700 hover:bg-green-100"
                        title="Valider"
                      >
                        <ShieldCheck size={10} /> Valider
                      </button>
                    )}
                    {/* Rejeter */}
                    {(isEnAttente || isPreValidee) &&
                      (isCP || canFinalValidate) && (
                        <button
                          onClick={() => onAction("collecte", col, "reject")}
                          className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-100"
                          title="Rejeter"
                        >
                          <XCircle size={10} /> Rejeter
                        </button>
                      )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Tableau des réponses formulaires ────────────────────────
function ReponsesTab({ data, canFinalValidate, isCP, onAction, getMembre }) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
        <CheckCircle2 className="mx-auto mb-3 text-green-300" size={40} />
        <p className="text-sm text-gray-400">
          Aucune réponse en attente de validation.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-left">
            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              ID Réponse
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Formulaire
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Répondant
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Date soumission
            </th>
            <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((rep) => {
            const repondant = getMembre(rep.repondantId);
            return (
              <tr key={rep.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {rep.id}
                </td>
                <td className="px-4 py-3 text-xs font-medium text-gray-900">
                  {rep.formulaireId}
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {repondant ? `${repondant.prenom} ${repondant.nom}` : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {fmtDate(rep.dateSoumission)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      className="flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-600 hover:bg-gray-100"
                      title="Voir les données"
                    >
                      <Eye size={10} /> Voir
                    </button>
                    {(isCP || canFinalValidate) && (
                      <button
                        onClick={() => onAction("reponse", rep, "validate")}
                        className="flex items-center gap-1 rounded-lg bg-green-50 px-2 py-1 text-[10px] font-medium text-green-700 hover:bg-green-100"
                      >
                        <ShieldCheck size={10} /> Valider
                      </button>
                    )}
                    {(isCP || canFinalValidate) && (
                      <button
                        onClick={() => onAction("reponse", rep, "reject")}
                        className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-100"
                      >
                        <XCircle size={10} /> Rejeter
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
