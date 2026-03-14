import {
  useAllocations,
  useActiverBudgetAnnuel,
  useAjouterLigneAllocation,
  useBudgetsAnnuels,
  useCreerAllocation,
  useCreerBudgetAnnuel,
  useProjetsRAF,
  useSoumettreAllocation,
} from "@/api/raf.api";
import {
  ArrowLeft,
  BarChart2,
  CheckCircle2,
  ChevronRight,
  Clock,
  FolderKanban,
  Lock,
  Plus,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n) =>
  n != null ? new Intl.NumberFormat("fr-SN").format(n) + " F" : "—";

const STATUT_ALLOC = {
  BROUILLON:     { label: "Brouillon",     cls: "bg-gray-100 text-gray-600" },
  EN_VALIDATION: { label: "En validation", cls: "bg-yellow-100 text-yellow-700" },
  ACTIVE:        { label: "Active",         cls: "bg-green-100 text-green-700" },
  REJETEE:       { label: "Rejetée",        cls: "bg-red-100 text-red-700" },
};

const STATUT_BA = {
  BROUILLON: { label: "Brouillon", cls: "bg-gray-100 text-gray-600" },
  ACTIF:     { label: "Actif",     cls: "bg-green-100 text-green-700" },
  CLOTURE:   { label: "Clôturé",   cls: "bg-purple-100 text-purple-700" },
};

function StatutBadge({ statut, map }) {
  const { label, cls } = (map ?? STATUT_ALLOC)[statut] ?? { label: statut, cls: "bg-gray-100 text-gray-500" };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function TauxBar({ taux }) {
  const color = taux >= 90 ? "bg-red-500" : taux >= 70 ? "bg-orange-400" : "bg-primary";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-gray-100">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(taux, 100)}%` }} />
      </div>
      <span className="text-xs text-gray-500">{taux?.toFixed(1)}%</span>
    </div>
  );
}

function KpiCard({ label, value, sub, color = "text-gray-900" }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Modal générique ───────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

// ── Modal Créer Budget Annuel ─────────────────────────────────────────────────

function ModalBudgetAnnuel({ onClose }) {
  const creer = useCreerBudgetAnnuel();
  const activer = useActiverBudgetAnnuel();
  const [form, setForm] = useState({
    exercice: new Date().getFullYear(),
    intitule: "",
    montantTotal: "",
    devise: "XOF",
    dateVote: "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.exercice || !form.montantTotal) {
      toast.error("Exercice et montant total sont obligatoires");
      return;
    }
    creer.mutate(
      {
        exercice: Number(form.exercice),
        intitule: form.intitule || `Budget exercice ${form.exercice}`,
        montantTotal: parseFloat(form.montantTotal),
        devise: form.devise,
        dateVote: form.dateVote || null,
      },
      {
        onSuccess: (data) => {
          activer.mutate(data.id, { onSuccess: onClose });
        },
      }
    );
  };

  return (
    <Modal title="Créer le budget annuel" onClose={onClose}>
      <Field label="Exercice (année)" required>
        <input
          type="number"
          value={form.exercice}
          onChange={(e) => set("exercice", e.target.value)}
          className={inputCls}
          min={2020}
          max={2100}
        />
      </Field>
      <Field label="Intitulé">
        <input
          type="text"
          value={form.intitule}
          onChange={(e) => set("intitule", e.target.value)}
          placeholder={`Budget exercice ${form.exercice}`}
          className={inputCls}
        />
      </Field>
      <Field label="Montant total voté par le CA" required>
        <input
          type="number"
          value={form.montantTotal}
          onChange={(e) => set("montantTotal", e.target.value)}
          placeholder="Ex: 500000000"
          className={inputCls}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Devise">
          <select value={form.devise} onChange={(e) => set("devise", e.target.value)} className={inputCls}>
            <option>XOF</option>
            <option>EUR</option>
            <option>USD</option>
          </select>
        </Field>
        <Field label="Date du vote CA">
          <input
            type="date"
            value={form.dateVote}
            onChange={(e) => set("dateVote", e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Annuler
        </button>
        <button
          onClick={handleSubmit}
          disabled={creer.isPending || activer.isPending}
          className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          Créer et activer
        </button>
      </div>
    </Modal>
  );
}

// ── Modal Nouvelle Allocation ─────────────────────────────────────────────────

function ModalAllocation({ budgetAnnuelId, allocationsExistantes, onClose }) {
  const { data: projets = [] } = useProjetsRAF();
  const creer = useCreerAllocation();
  const [form, setForm] = useState({ projetId: "", montantAlloue: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const projetsDejAlloues = new Set(
    allocationsExistantes
      .filter((a) => a.statut !== "REJETEE")
      .map((a) => a.projetId)
  );
  const projetsDisponibles = projets.filter(
    (p) => !projetsDejAlloues.has(p.id) && p.statut !== "ARCHIVE"
  );

  const handleSubmit = () => {
    if (!form.projetId || !form.montantAlloue) {
      toast.error("Projet et montant sont obligatoires");
      return;
    }
    creer.mutate(
      { budgetAnnuelId, projetId: form.projetId, montantAlloue: parseFloat(form.montantAlloue) },
      { onSuccess: onClose }
    );
  };

  return (
    <Modal title="Nouvelle allocation projet" onClose={onClose}>
      <Field label="Projet" required>
        <select value={form.projetId} onChange={(e) => set("projetId", e.target.value)} className={inputCls}>
          <option value="">— Sélectionner un projet —</option>
          {projetsDisponibles.map((p) => (
            <option key={p.id} value={p.id}>[{p.code}] {p.titre}</option>
          ))}
        </select>
      </Field>
      <Field label="Montant alloué (enveloppe projet)" required>
        <input
          type="number"
          value={form.montantAlloue}
          onChange={(e) => set("montantAlloue", e.target.value)}
          placeholder="Ex: 120000000"
          className={inputCls}
        />
      </Field>
      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Annuler
        </button>
        <button
          onClick={handleSubmit}
          disabled={creer.isPending}
          className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          Créer l'allocation
        </button>
      </div>
    </Modal>
  );
}

// ── Modal Ajouter Ligne ───────────────────────────────────────────────────────

const CATEGORIES = ["Personnel", "Activités", "Équipement", "Frais généraux", "Communication", "Formation", "Autre"];

function ModalLigne({ allocationId, montantRestant, onClose }) {
  const ajouter = useAjouterLigneAllocation();
  const [form, setForm] = useState({ code: "", intitule: "", categorie: "Activités", montantPrevu: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.code || !form.intitule || !form.montantPrevu) {
      toast.error("Code, intitulé et montant sont obligatoires");
      return;
    }
    ajouter.mutate(
      {
        allocationId,
        allocationProjetId: allocationId,
        code: form.code,
        intitule: form.intitule,
        categorie: form.categorie,
        montantPrevu: parseFloat(form.montantPrevu),
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Modal title="Ajouter une ligne budgétaire" onClose={onClose}>
      <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
        Restant à ventiler : <span className="font-semibold">{fmt(montantRestant)}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Code" required>
          <input
            type="text"
            value={form.code}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
            placeholder="Ex: PERS-01"
            className={inputCls}
          />
        </Field>
        <Field label="Catégorie">
          <select value={form.categorie} onChange={(e) => set("categorie", e.target.value)} className={inputCls}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Intitulé" required>
        <input
          type="text"
          value={form.intitule}
          onChange={(e) => set("intitule", e.target.value)}
          placeholder="Ex: Salaires et charges personnel"
          className={inputCls}
        />
      </Field>
      <Field label="Montant prévu" required>
        <input
          type="number"
          value={form.montantPrevu}
          onChange={(e) => set("montantPrevu", e.target.value)}
          className={inputCls}
        />
      </Field>
      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Annuler
        </button>
        <button
          onClick={handleSubmit}
          disabled={ajouter.isPending}
          className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          Ajouter
        </button>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Niveau 3 — Lignes d'une allocation
// ══════════════════════════════════════════════════════════════════════════════

function VueLignes({ allocation, onBack }) {
  const soumettre = useSoumettreAllocation();
  const [showModal, setShowModal] = useState(false);
  const lignes = allocation.lignes ?? [];
  const peutModifier = ["BROUILLON", "REJETEE"].includes(allocation.statut);
  const peutSoumettre = peutModifier && lignes.length > 0;

  const montantVentile = lignes.reduce((s, l) => s + (l.montantPrevu ?? 0), 0);
  const montantRestant = (allocation.montantAlloue ?? 0) - montantVentile;

  return (
    <div className="-m-6 flex flex-col overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <button onClick={onBack} className="mb-3 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
          <ArrowLeft size={14} /> Retour aux allocations
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-gray-700">{allocation.projetCode}</span>
              <StatutBadge statut={allocation.statut} />
            </div>
            <p className="text-base font-bold text-gray-900 mt-0.5">{allocation.projetTitre}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Enveloppe : <span className="font-semibold text-gray-700">{fmt(allocation.montantAlloue)}</span>
              {" · "}Ventilé : <span className="font-semibold">{fmt(montantVentile)}</span>
              {" · "}Restant :{" "}
              <span className={`font-semibold ${montantRestant < 0 ? "text-red-600" : "text-primary"}`}>
                {fmt(montantRestant)}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {peutModifier && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                <Plus size={15} /> Ajouter ligne
              </button>
            )}
            {peutSoumettre && (
              <button
                onClick={() => soumettre.mutate(allocation.id)}
                disabled={soumettre.isPending}
                className="flex items-center gap-1.5 rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm font-semibold text-yellow-800 hover:bg-yellow-100 disabled:opacity-50"
              >
                <Clock size={15} /> Soumettre au SE
              </button>
            )}
          </div>
        </div>

        {/* Bandeaux statut */}
        {allocation.statut === "EN_VALIDATION" && (
          <div className="mt-3 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-2 text-xs text-yellow-800 flex items-center gap-1.5">
            <Clock size={13} />
            En attente de validation par le Secrétaire Exécutif — lignes verrouillées.
          </div>
        )}
        {allocation.statut === "ACTIVE" && (
          <div className="mt-3 rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-xs text-green-800 flex items-center gap-1.5">
            <CheckCircle2 size={13} />
            Allocation validée — les dépenses peuvent être imputées sur les lignes.
          </div>
        )}
        {allocation.statut === "REJETEE" && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-xs text-red-800 flex items-center gap-1.5">
            <XCircle size={13} />
            Rejetée — motif : <span className="font-semibold ml-1">{allocation.motifRejet ?? "—"}</span>
          </div>
        )}
      </div>

      {/* Tableau lignes */}
      <div className="flex-1 overflow-y-auto p-6">
        {lignes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Wallet size={36} className="text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">Aucune ligne budgétaire. Ajoutez la première.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Catégorie / Intitulé</th>
                  <th className="px-4 py-3 text-right">Prévu</th>
                  <th className="px-4 py-3 text-right">Engagé</th>
                  <th className="px-4 py-3 text-right">Dépensé</th>
                  <th className="px-4 py-3 text-right">Solde</th>
                  <th className="px-4 py-3 text-left">Consommation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lignes.map((l) => (
                  <tr key={l.id} className={l.estGelee ? "opacity-60 bg-gray-50" : ""}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-gray-700">{l.code}</span>
                        {l.estGelee && <Lock size={11} className="text-gray-400" />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-400">{l.categorie}</p>
                      <p className="font-medium text-gray-900">{l.intitule}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">{fmt(l.montantPrevu)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{fmt(l.montantEngage ?? 0)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{fmt(l.montantDepense ?? 0)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${(l.soldeDisponible ?? 0) < 0 ? "text-red-600" : "text-primary"}`}>
                      {fmt(l.soldeDisponible)}
                    </td>
                    <td className="px-4 py-3">
                      <TauxBar taux={l.tauxConsommation ?? 0} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <ModalLigne
          allocationId={allocation.id}
          montantRestant={montantRestant}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Niveau 2 — Allocations d'un budget annuel
// ══════════════════════════════════════════════════════════════════════════════

function VueAllocations({ budgetAnnuel, onBack, onSelectAllocation }) {
  const { data: allocations = [], isLoading } = useAllocations(budgetAnnuel.id);
  const soumettre = useSoumettreAllocation();
  const [showModal, setShowModal] = useState(false);

  const peutAjouter = ["BROUILLON", "ACTIF"].includes(budgetAnnuel.statut);
  const taux = budgetAnnuel.montantTotal > 0
    ? ((budgetAnnuel.montantAlloue ?? 0) / budgetAnnuel.montantTotal) * 100
    : 0;

  return (
    <div className="-m-6 flex flex-col overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <button onClick={onBack} className="mb-3 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
          <ArrowLeft size={14} /> Retour aux budgets annuels
        </button>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">{budgetAnnuel.intitule}</h2>
              <StatutBadge statut={budgetAnnuel.statut} map={STATUT_BA} />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Exercice {budgetAnnuel.exercice} · {budgetAnnuel.devise}
              {budgetAnnuel.dateVote &&
                ` · Vote CA : ${new Date(budgetAnnuel.dateVote).toLocaleDateString("fr-SN")}`}
            </p>
          </div>
          {peutAjouter && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              <Plus size={15} /> Nouvelle allocation
            </button>
          )}
        </div>

        {/* KPI */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          <KpiCard label="Budget total" value={fmt(budgetAnnuel.montantTotal)} />
          <KpiCard label="Alloué" value={fmt(budgetAnnuel.montantAlloue)} color="text-primary" />
          <KpiCard
            label="Disponible"
            value={fmt(budgetAnnuel.montantDisponible)}
            color={(budgetAnnuel.montantDisponible ?? 0) < 0 ? "text-red-600" : "text-gray-900"}
          />
          <KpiCard label="Projets" value={`${allocations.length}`} sub={`${taux.toFixed(1)}% alloué`} />
        </div>
      </div>

      {/* Tableau */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100" />)}
          </div>
        ) : allocations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FolderKanban size={36} className="text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">Aucune allocation. Commencez par allouer un projet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-3 text-left">Projet</th>
                  <th className="px-5 py-3 text-right">Enveloppe</th>
                  <th className="px-5 py-3 text-right">Dépensé</th>
                  <th className="px-5 py-3 text-left">Consommation</th>
                  <th className="px-5 py-3 text-left">Statut</th>
                  <th className="px-5 py-3 text-center">Lignes</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allocations.map((a) => {
                  const tauxA = a.montantAlloue > 0
                    ? ((a.montantDepense ?? 0) / a.montantAlloue) * 100
                    : 0;
                  const peutSoumettre =
                    ["BROUILLON", "REJETEE"].includes(a.statut) && (a.lignes?.length ?? 0) > 0;

                  return (
                    <tr
                      key={a.id}
                      onClick={() => onSelectAllocation(a)}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <ChevronRight size={13} className="text-gray-400" />
                          <div>
                            <span className="font-mono text-xs text-gray-500">{a.projetCode}</span>
                            <p className="font-medium text-gray-900">{a.projetTitre}</p>
                          </div>
                        </div>
                        {a.statut === "REJETEE" && a.motifRejet && (
                          <p className="mt-1 text-xs text-red-600 pl-5">↳ {a.motifRejet}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-gray-900">{fmt(a.montantAlloue)}</td>
                      <td className="px-5 py-4 text-right text-gray-600">{fmt(a.montantDepense ?? 0)}</td>
                      <td className="px-5 py-4"><TauxBar taux={tauxA} /></td>
                      <td className="px-5 py-4"><StatutBadge statut={a.statut} /></td>
                      <td className="px-5 py-4 text-center text-gray-500">{a.lignes?.length ?? 0}</td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        {peutSoumettre && (
                          <button
                            onClick={() => soumettre.mutate(a.id)}
                            disabled={soumettre.isPending}
                            className="rounded-lg border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-800 hover:bg-yellow-100 disabled:opacity-50"
                          >
                            Soumettre
                          </button>
                        )}
                        {a.statut === "EN_VALIDATION" && (
                          <span className="flex items-center gap-1 text-xs text-yellow-600">
                            <Clock size={12} /> En attente
                          </span>
                        )}
                        {a.statut === "ACTIVE" && (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 size={12} /> Validée
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <ModalAllocation
          budgetAnnuelId={budgetAnnuel.id}
          allocationsExistantes={allocations}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Niveau 1 — Liste des Budgets Annuels
// ══════════════════════════════════════════════════════════════════════════════

function VueBudgetsAnnuels({ onSelectBudget }) {
  const { data: budgets = [], isLoading } = useBudgetsAnnuels();
  const [showModal, setShowModal] = useState(false);

  const anneeActuelle = new Date().getFullYear();
  const budgetActuel = budgets.find((b) => b.exercice === anneeActuelle);
  const peutCreer = !budgetActuel || budgetActuel.statut === "CLOTURE";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Budgets annuels</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Enveloppes votées par le Conseil d'Administration
          </p>
        </div>
        {peutCreer && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus size={15} /> Nouveau budget annuel
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-24 rounded-2xl bg-gray-100" />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20">
          <BarChart2 size={40} className="text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-600">Aucun budget annuel enregistré</p>
          <p className="text-xs text-gray-400 mt-1">
            Créez le budget de l'exercice en cours pour commencer les allocations.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus size={15} /> Créer le budget {anneeActuelle}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((ba) => {
            const taux = ba.montantTotal > 0
              ? ((ba.montantAlloue ?? 0) / ba.montantTotal) * 100
              : 0;
            return (
              <div
                key={ba.id}
                onClick={() => onSelectBudget(ba)}
                className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl font-black text-gray-900">{ba.exercice}</span>
                      <StatutBadge statut={ba.statut} map={STATUT_BA} />
                    </div>
                    <p className="text-sm text-gray-600">{ba.intitule}</p>
                    {ba.dateVote && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Vote CA : {new Date(ba.dateVote).toLocaleDateString("fr-SN")}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      Saisi par : {ba.saisiPar ?? "—"}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-6">
                    <p className="text-lg font-bold text-gray-900">{fmt(ba.montantTotal)}</p>
                    <p className="text-xs text-gray-500">
                      {fmt(ba.montantAlloue)} alloué · {fmt(ba.montantDisponible)} disponible
                    </p>
                    <div className="mt-2 h-2 w-40 rounded-full bg-gray-100">
                      <div
                        className={`h-2 rounded-full ${taux >= 90 ? "bg-red-400" : "bg-primary"}`}
                        style={{ width: `${Math.min(taux, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {taux.toFixed(1)}% alloué · {ba.nombreProjets} projet(s)
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && <ModalBudgetAnnuel onClose={() => setShowModal(false)} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Composant principal — navigation 3 niveaux
// ══════════════════════════════════════════════════════════════════════════════

function NiveauLignes({ allocationId, budgetAnnuelId, onBack }) {
  const { data: allocations = [] } = useAllocations(budgetAnnuelId);
  const allocation = allocations.find((a) => a.id === allocationId);
  if (!allocation) return null;
  return <VueLignes allocation={allocation} onBack={onBack} />;
}

function NiveauAllocations({ budgetId, onBack, onSelectAllocation }) {
  const { data: budgets = [] } = useBudgetsAnnuels();
  const budget = budgets.find((b) => b.id === budgetId);
  if (!budget) return null;
  return <VueAllocations budgetAnnuel={budget} onBack={onBack} onSelectAllocation={onSelectAllocation} />;
}

export default function RAFBudgets() {
  const [selectedBudgetId, setSelectedBudgetId] = useState(null);
  const [selectedAllocation, setSelectedAllocation] = useState(null); // { id, budgetAnnuelId }

  if (selectedAllocation) {
    return (
      <NiveauLignes
        allocationId={selectedAllocation.id}
        budgetAnnuelId={selectedAllocation.budgetAnnuelId}
        onBack={() => setSelectedAllocation(null)}
      />
    );
  }

  if (selectedBudgetId) {
    return (
      <NiveauAllocations
        budgetId={selectedBudgetId}
        onBack={() => setSelectedBudgetId(null)}
        onSelectAllocation={(a) => setSelectedAllocation({ id: a.id, budgetAnnuelId: a.budgetAnnuelId })}
      />
    );
  }

  return <VueBudgetsAnnuels onSelectBudget={(ba) => setSelectedBudgetId(ba.id)} />;
}
