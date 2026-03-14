import useAuthStore from "@/stores/auth.store";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
  Lock,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  createFinanceHelpers,
  STATUT_COLORS,
  STATUTS_DEPENSE,
  useDepensesParProjet,
  useLignesParProjet,
  useProjetsFinances,
} from "./finances-data";

const fmtMontant = (n, devise = "XOF") =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: devise,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
      })
    : "—";

function ProgressBar({ taux, height = "h-2" }) {
  const color =
    taux > 90 ? "bg-red-500" : taux > 70 ? "bg-orange-500" : "bg-green-500";
  const bgColor =
    taux > 90 ? "bg-red-100" : taux > 70 ? "bg-orange-100" : "bg-green-100";
  return (
    <div className={`${height} w-full rounded-full ${bgColor}`}>
      <div
        className={`h-full rounded-full ${color} transition-all`}
        style={{ width: `${Math.min(taux, 100)}%` }}
      />
    </div>
  );
}

// ── Modale Virement budgétaire ─────────────────────────────
function VirementModal({ lignes, devise, onClose }) {
  const [sourceId, setSourceId] = useState("");
  const [destId, setDestId] = useState("");
  const [montant, setMontant] = useState("");
  const [motif, setMotif] = useState("");

  const source = lignes.find((l) => l.id === sourceId);
  const soldeSource = source ? source.prevu - source.depense : 0;
  const montantNum = parseFloat(montant) || 0;

  const handleConfirm = () => {
    if (!sourceId || !destId)
      return toast.error("Sélectionnez source et destination");
    if (sourceId === destId)
      return toast.error("Source et destination identiques");
    if (!montantNum || montantNum <= 0) return toast.error("Montant invalide");
    if (montantNum > soldeSource)
      return toast.error("Montant dépasse le solde disponible");
    if (!motif.trim()) return toast.error("Motif obligatoire");
    toast.success(`Virement de ${fmtMontant(montantNum, devise)} effectué`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Virement budgétaire
        </h3>
        <p className="text-sm text-gray-500 mb-5">
          Transférer un montant d'une ligne à une autre
        </p>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Ligne source
            </label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            >
              <option value="">— Sélectionner —</option>
              {lignes
                .filter((l) => !l.gele)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} — {l.intitule} (solde:{" "}
                    {fmtMontant(l.prevu - l.depense, devise)})
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Ligne destination
            </label>
            <select
              value={destId}
              onChange={(e) => setDestId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            >
              <option value="">— Sélectionner —</option>
              {lignes
                .filter((l) => !l.gele && l.id !== sourceId)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} — {l.intitule}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Montant à transférer ({devise})
            </label>
            <input
              type="number"
              min="0"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              placeholder="0"
            />
            {source && montantNum > soldeSource && (
              <p className="mt-1 text-xs text-red-500">
                Dépasse le solde disponible ({fmtMontant(soldeSource, devise)})
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Motif *
            </label>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={2}
              placeholder="Justification du virement..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)" }}
          >
            <ArrowRightLeft size={14} />
            Confirmer le virement
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PAGE — Structure budgétaire d'un projet
// ════════════════════════════════════════════════════════════
export default function BudgetProjetDetail() {
  const { projet_id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Données Spring Boot
  const { data: allProjets = [] } = useProjetsFinances();
  const { data: lignes = [], isLoading: loadingLignes } = useLignesParProjet(projet_id);
  const { data: depenses = [], isLoading: loadingDep } = useDepensesParProjet(projet_id);

  const helpers = useMemo(
    () => createFinanceHelpers(allProjets, lignes, depenses),
    [allProjets, lignes, depenses],
  );

  const projet = helpers.getProjet(projet_id);
  const stats = helpers.getBudgetStatsForProjet(projet_id);

  const isRAF = user?.roles?.some((r) => ["ROLE_RAF", "ROLE_ADMIN"].includes(r));
  const isSE = user?.roles?.includes("ROLE_SE");
  const isRP = user?.roles?.includes("ROLE_RESPONSABLE_PROGRAMMES");
  const canVirement = isRAF || isSE;

  const [expandedLigne, setExpandedLigne] = useState(null);
  const [showVirement, setShowVirement] = useState(false);
  const [searchLigne, setSearchLigne] = useState("");

  // Grouper lignes par catégorie
  const categories = useMemo(() => {
    const map = new Map();
    lignes
      .filter((l) => {
        if (!searchLigne) return true;
        const q = searchLigne.toLowerCase();
        return (
          l.code.toLowerCase().includes(q) ||
          l.intitule.toLowerCase().includes(q) ||
          (l.categorie ?? "").toLowerCase().includes(q)
        );
      })
      .forEach((l) => {
        const cat = l.categorie ?? "Autre";
        if (!map.has(cat)) map.set(cat, []);
        map.get(cat).push(l);
      });
    return map;
  }, [lignes, searchLigne]);

  const isLoading = loadingLignes || loadingDep;

  if (!isLoading && !projet) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={16} /> Retour
        </button>
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="text-gray-500">Projet introuvable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Retour */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} /> Retour au suivi budgétaire
      </button>

      {/* Header projet */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-gray-400">{projet?.code}</p>
            <h2 className="text-xl font-bold text-gray-900">{projet?.titre}</h2>
            <p className="mt-1 text-sm text-gray-500">
              Devise : {projet?.devise ?? "XOF"}
              {isRP && (
                <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-gray-500">
                  <Lock size={9} /> Lecture seule
                </span>
              )}
            </p>
          </div>
          {canVirement && lignes.length > 0 && (
            <button
              onClick={() => setShowVirement(true)}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white"
              style={{ background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)" }}
            >
              <ArrowRightLeft size={15} />
              Virement budgétaire
            </button>
          )}
        </div>

        {/* Résumé global */}
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatBox label="Prévu" value={fmtMontant(stats.prevu, projet?.devise)} />
          <StatBox
            label="Engagé"
            value={fmtMontant(stats.engage, projet?.devise)}
            className="text-blue-700"
          />
          <StatBox
            label="Dépensé"
            value={fmtMontant(stats.depense, projet?.devise)}
            className="text-orange-700"
          />
          <StatBox
            label="Solde"
            value={fmtMontant(stats.solde, projet?.devise)}
            className={stats.solde < 0 ? "text-red-600" : "text-green-600"}
          />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Consommation
            </p>
            <p
              className={`text-lg font-bold ${stats.taux > 90 ? "text-red-600" : stats.taux > 70 ? "text-orange-600" : "text-green-600"}`}
            >
              {stats.taux}%
            </p>
            <ProgressBar taux={stats.taux} />
          </div>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative max-w-sm">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-2.5 text-gray-400"
        />
        <input
          type="text"
          placeholder="Rechercher une ligne budgétaire..."
          value={searchLigne}
          onChange={(e) => setSearchLigne(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-700 shadow-sm focus:border-green-500 focus:outline-none"
        />
      </div>

      {/* Arborescence lignes */}
      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-sm text-gray-400">Chargement des lignes budgétaires...</p>
        </div>
      ) : categories.size === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-sm text-gray-400">
            {lignes.length === 0
              ? "Aucune ligne budgétaire — le budget n'a pas encore été créé par le RAF."
              : "Aucune ligne trouvée."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...categories.entries()].map(([cat, catLignes]) => (
            <div
              key={cat}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
                <h4 className="text-sm font-semibold text-gray-700">{cat}</h4>
              </div>

              <div className="divide-y divide-gray-100">
                {catLignes.map((ligne) => {
                  const taux =
                    ligne.prevu > 0
                      ? Math.round((ligne.depense / ligne.prevu) * 100)
                      : 0;
                  const solde = ligne.prevu - ligne.depense;
                  const isExpanded = expandedLigne === ligne.id;
                  const depensesLigne = helpers.getDepensesForLigne(ligne.id);

                  return (
                    <div key={ligne.id}>
                      <div
                        className={`flex cursor-pointer items-center gap-4 px-5 py-3 transition-colors hover:bg-gray-50 ${
                          ligne.gele ? "bg-gray-50 opacity-60" : ""
                        } ${taux > 90 ? "bg-red-50/40" : taux > 70 ? "bg-orange-50/30" : ""}`}
                        onClick={() =>
                          setExpandedLigne(isExpanded ? null : ligne.id)
                        }
                      >
                        <div className="shrink-0 text-gray-400">
                          {isExpanded ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-semibold text-gray-500">
                              {ligne.code}
                            </span>
                            <span className="truncate text-sm font-medium text-gray-900">
                              {ligne.intitule}
                            </span>
                            {ligne.gele && (
                              <span className="flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                                <Lock size={9} /> Gelée
                              </span>
                            )}
                            {solde < 0 && (
                              <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                                <AlertTriangle size={9} /> Dépassé
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="hidden w-[500px] shrink-0 grid-cols-5 gap-4 text-right text-xs sm:grid">
                          <div>
                            <p className="text-gray-400">Prévu</p>
                            <p className="font-semibold text-gray-900">
                              {fmtMontant(ligne.prevu, projet?.devise)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Engagé</p>
                            <p className="font-semibold text-blue-700">
                              {fmtMontant(ligne.engage, projet?.devise)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Dépensé</p>
                            <p className="font-semibold text-orange-700">
                              {fmtMontant(ligne.depense, projet?.devise)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Solde</p>
                            <p
                              className={`font-semibold ${solde < 0 ? "text-red-600" : "text-green-600"}`}
                            >
                              {fmtMontant(solde, projet?.devise)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Taux</p>
                            <p
                              className={`font-bold ${taux > 90 ? "text-red-600" : taux > 70 ? "text-orange-600" : "text-green-600"}`}
                            >
                              {taux}%
                            </p>
                            <ProgressBar taux={taux} height="h-1.5" />
                          </div>
                        </div>
                      </div>

                      {/* Dépenses imputées */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
                          <p className="mb-2 text-[10px] font-semibold uppercase text-gray-400">
                            Dépenses imputées ({depensesLigne.length})
                          </p>
                          {depensesLigne.length === 0 ? (
                            <p className="py-2 text-xs text-gray-400">
                              Aucune dépense sur cette ligne.
                            </p>
                          ) : (
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-left text-gray-400">
                                  <th className="pb-1 font-semibold">N° pièce</th>
                                  <th className="pb-1 font-semibold">Date</th>
                                  <th className="pb-1 font-semibold">Libellé</th>
                                  <th className="pb-1 text-right font-semibold">Montant</th>
                                  <th className="pb-1 font-semibold">Statut</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {depensesLigne.map((dep) => (
                                  <tr
                                    key={dep.id}
                                    className={`${isRP ? "" : "cursor-pointer hover:bg-white"}`}
                                    onClick={(e) => {
                                      if (isRP) return;
                                      e.stopPropagation();
                                      navigate(`/finances/depenses/${dep.id}`);
                                    }}
                                  >
                                    <td className="py-1.5 font-mono">{dep.numeroPiece}</td>
                                    <td className="py-1.5">{fmtDate(dep.date)}</td>
                                    <td className="max-w-[200px] truncate py-1.5">
                                      {dep.libelle}
                                    </td>
                                    <td className="py-1.5 text-right font-semibold">
                                      {fmtMontant(dep.montant, dep.devise)}
                                    </td>
                                    <td className="py-1.5">
                                      <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUT_COLORS[dep.statut]}`}
                                      >
                                        {STATUTS_DEPENSE.find((s) => s.value === dep.statut)?.label ?? dep.statut}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale virement */}
      {showVirement && (
        <VirementModal
          lignes={lignes}
          devise={projet?.devise ?? "XOF"}
          onClose={() => setShowVirement(false)}
        />
      )}
    </div>
  );
}

function StatBox({ label, value, className = "text-gray-900" }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <p className={`text-lg font-bold ${className}`}>{value}</p>
    </div>
  );
}
