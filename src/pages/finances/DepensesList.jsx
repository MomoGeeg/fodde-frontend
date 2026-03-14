import useAuthStore from "@/stores/auth.store";
import {
  AlertTriangle,
  Calendar,
  FileWarning,
  Filter,
  Lock,
  Plus,
  Search,
  Shield,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DepenseFormModal from "./DepenseForm";
import {
  MODE_PAIEMENT_LABELS,
  SEUIL_APPROBATION_SE,
  STATUT_COLORS,
  STATUTS_DEPENSE,
  useDepenses,
  useLignesParProjet,
  useProjetsFinances,
} from "./finances-data";

// ── Helpers ─────────────────────────────────────────────────
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtMontant = (n, devise = "XOF") =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: devise,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

function Badge({ children, className }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight ${className}`}
    >
      {children}
    </span>
  );
}

function StatutBadge({ statut }) {
  const label =
    STATUTS_DEPENSE.find((s) => s.value === statut)?.label ?? statut;
  return (
    <Badge className={STATUT_COLORS[statut] ?? "bg-gray-100 text-gray-600"}>
      {label}
    </Badge>
  );
}

// ════════════════════════════════════════════════════════════
// PAGE — Liste des dépenses
// ════════════════════════════════════════════════════════════
export default function DepensesList() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);

  // ── Données Spring Boot ─────────────────────────────────
  const { data: allDepenses = [], isLoading: loadingDep } = useDepenses();
  const { data: allProjets = [], isLoading: loadingProjets } = useProjetsFinances();
  const isLoading = loadingDep || loadingProjets;

  // ── Détection du rôle ───────────────────────────────────
  const isComptable = user?.roles?.includes("ROLE_COMPTABLE");
  const isSE = user?.roles?.includes("ROLE_SE");

  // ── Filtres ─────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterProjet, setFilterProjet] = useState("TOUS");
  const [filterStatut, setFilterStatut] = useState("TOUS");
  const [filterLigne, setFilterLigne] = useState("TOUS");
  const [filterMode, setFilterMode] = useState("TOUS");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Lignes du projet sélectionné (pour le filtre)
  const { data: lignesFiltres = [] } = useLignesParProjet(
    filterProjet !== "TOUS" ? filterProjet : null,
  );

  // ── Données filtrées ────────────────────────────────────
  // Pour le SE, on affiche uniquement EN_APPROBATION_SE par défaut
  const baseDepenses = useMemo(() => {
    if (isSE && !user?.roles?.some((r) => ["ROLE_RAF", "ROLE_ADMIN"].includes(r))) {
      return allDepenses.filter((d) => d.statut === "EN_APPROBATION_SE");
    }
    return allDepenses;
  }, [isSE, allDepenses, user?.roles]);

  const depenses = useMemo(() => {
    let list = [...baseDepenses];

    if (filterProjet !== "TOUS")
      list = list.filter((d) => d.projetId === filterProjet);
    if (filterStatut !== "TOUS")
      list = list.filter((d) => d.statut === filterStatut);
    if (filterLigne !== "TOUS")
      list = list.filter((d) => d.ligneBudgetaireId === filterLigne);
    if (filterMode !== "TOUS")
      list = list.filter((d) => d.modePaiement === filterMode);
    if (dateDebut) list = list.filter((d) => (d.date ?? "") >= dateDebut);
    if (dateFin) list = list.filter((d) => (d.date ?? "") <= dateFin);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          (d.libelle ?? "").toLowerCase().includes(q) ||
          (d.beneficiaire ?? "").toLowerCase().includes(q) ||
          (d.numeroPiece ?? "").toLowerCase().includes(q) ||
          (d.projetCode ?? "").toLowerCase().includes(q),
      );
    }

    return list.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  }, [
    baseDepenses,
    filterProjet,
    filterStatut,
    filterLigne,
    filterMode,
    dateDebut,
    dateFin,
    search,
  ]);

  // ── KPIs ─────────────────────────────────────────────────
  const totalMontant = depenses.reduce((s, d) => s + (d.montantXOF ?? 0), 0);
  const nbSoumises = depenses.filter((d) => d.statut === "SOUMISE").length;
  const nbEnAttentesSE = depenses.filter(
    (d) => d.statut === "EN_APPROBATION_SE",
  ).length;
  const nbValidees = depenses.filter((d) => d.statut === "VALIDEE").length;

  // ── Badges alertes ───────────────────────────────────────
  const getAlertBadges = (dep) => {
    const badges = [];
    if (dep.statut === "SOUMISE" && dep.joursAttente > 7) {
      badges.push(
        <Badge key="attente" className="bg-orange-100 text-orange-700">
          <Calendar size={10} /> &gt; 7j sans validation
        </Badge>,
      );
    }
    if (dep.montantXOF > SEUIL_APPROBATION_SE) {
      badges.push(
        <Badge key="seuil" className="bg-purple-100 text-purple-700">
          <Shield size={10} /> &gt; seuil SE
        </Badge>,
      );
    }
    if (!dep.justificatif && dep.montantXOF > 100_000) {
      badges.push(
        <Badge key="piece" className="bg-yellow-100 text-yellow-700">
          <FileWarning size={10} /> Pièce manquante
        </Badge>,
      );
    }
    return badges;
  };

  const hasActiveFilters =
    filterProjet !== "TOUS" ||
    filterStatut !== "TOUS" ||
    filterLigne !== "TOUS" ||
    filterMode !== "TOUS" ||
    dateDebut ||
    dateFin;

  const clearFilters = () => {
    setFilterProjet("TOUS");
    setFilterStatut("TOUS");
    setFilterLigne("TOUS");
    setFilterMode("TOUS");
    setDateDebut("");
    setDateFin("");
    setSearch("");
  };

  return (
    <>
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dépenses</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isLoading ? "Chargement..." : `${depenses.length} dépense${depenses.length !== 1 ? "s" : ""}`}
            {isComptable && " — vos saisies"}
            {isSE && !user?.roles?.some((r) => ["ROLE_RAF", "ROLE_ADMIN"].includes(r)) &&
              " — en attente de votre approbation"}
          </p>
        </div>
        {isComptable && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors"
            style={{ background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)" }}
          >
            <Plus size={16} />
            Nouvelle dépense
          </button>
        )}
      </div>

      {/* ── KPIs ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Montant total
          </p>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {fmtMontant(totalMontant)}
          </p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">
            Soumises
          </p>
          <p className="mt-1 text-lg font-bold text-blue-700">{nbSoumises}</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-500">
            En attente SE
          </p>
          <p className="mt-1 text-lg font-bold text-orange-700">{nbEnAttentesSE}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-green-500">
            Validées
          </p>
          <p className="mt-1 text-lg font-bold text-green-700">{nbValidees}</p>
        </div>
      </div>

      {/* ── Recherche + Toggle filtres ───────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-2.5 text-gray-400"
          />
          <input
            type="text"
            placeholder="Libellé, bénéficiaire, n° pièce, projet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-700 shadow-sm focus:border-green-500 focus:outline-none"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
            showFilters || hasActiveFilters
              ? "border-green-300 bg-green-50 text-green-700"
              : "border-gray-200 text-gray-500 hover:bg-gray-50"
          }`}
        >
          <Filter size={14} />
          Filtres
          {hasActiveFilters && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-[9px] text-white">
              !
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500"
          >
            <X size={12} />
            Réinitialiser
          </button>
        )}
      </div>

      {/* ── Filtres avancés ──────────────────────────────── */}
      {showFilters && (
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-3 lg:grid-cols-6">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-400">
              Projet
            </label>
            <select
              value={filterProjet}
              onChange={(e) => {
                setFilterProjet(e.target.value);
                setFilterLigne("TOUS");
              }}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-green-500 focus:outline-none"
            >
              <option value="TOUS">Tous</option>
              {allProjets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-400">
              Statut
            </label>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-green-500 focus:outline-none"
            >
              <option value="TOUS">Tous</option>
              {STATUTS_DEPENSE.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-400">
              Ligne budgétaire
            </label>
            <select
              value={filterLigne}
              onChange={(e) => setFilterLigne(e.target.value)}
              disabled={filterProjet === "TOUS"}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-green-500 focus:outline-none disabled:opacity-50"
            >
              <option value="TOUS">
                {filterProjet === "TOUS" ? "Sélectionner un projet" : "Toutes"}
              </option>
              {lignesFiltres.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code} — {l.intitule}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-400">
              Mode paiement
            </label>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-green-500 focus:outline-none"
            >
              <option value="TOUS">Tous</option>
              <option value="ESPECES">Espèces</option>
              <option value="VIREMENT">Virement</option>
              <option value="CHEQUE">Chèque</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-400">
              Date début
            </label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-green-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-gray-400">
              Date fin
            </label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-green-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* ── Tableau ─────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            Chargement des dépenses...
          </div>
        ) : depenses.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Search className="mx-auto mb-3 text-gray-300" size={40} />
            <p className="text-sm text-gray-400">Aucune dépense trouvée.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    N° pièce
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Libellé
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Projet
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Ligne budg.
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Mode
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Bénéficiaire
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Alertes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {depenses.map((dep) => {
                  const isAnnulee = dep.statut === "ANNULEE";
                  const badges = getAlertBadges(dep);

                  return (
                    <tr
                      key={dep.id}
                      onClick={() => navigate(`/finances/depenses/${dep.id}`)}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${isAnnulee ? "opacity-50" : ""}`}
                    >
                      <td className="px-4 py-3 text-xs font-mono font-medium text-gray-900">
                        {dep.numeroPiece}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {fmtDate(dep.date)}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-sm font-medium text-gray-900">
                        {dep.libelle}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-gray-700">
                          {dep.projetCode}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">
                          {dep.ligneBudgetaireCode}
                        </span>
                        {dep.ligneBudgetaireCode && (
                          <span className="ml-1 hidden text-[10px] text-gray-400 sm:inline">
                            {dep.ligneBudgetaireIntitule?.slice(0, 20)}
                            {dep.ligneBudgetaireIntitule?.length > 20 ? "…" : ""}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {fmtMontant(dep.montant, dep.devise)}
                        </p>
                        {dep.devise !== "XOF" && (
                          <p className="text-[10px] text-gray-400">
                            ≈ {fmtMontant(dep.montantXOF)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {MODE_PAIEMENT_LABELS[dep.modePaiement] ?? dep.modePaiement}
                      </td>
                      <td className="max-w-[150px] truncate px-4 py-3 text-xs text-gray-600">
                        {dep.beneficiaire}
                      </td>
                      <td className="px-4 py-3">
                        <StatutBadge statut={dep.statut} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          {badges}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>

    {/* Modal nouvelle dépense */}
    <DepenseFormModal
      open={showModal}
      onClose={() => setShowModal(false)}
    />
    </>
  );
}
