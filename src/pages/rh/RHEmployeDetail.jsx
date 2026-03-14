import useAuthStore from "@/stores/auth.store";
import {
  ArrowLeft,
  Calendar,
  Edit,
  FileText,
  MapPin,
  Star,
  Upload,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useConges,
  useDocumentsEmploye,
  useEmployes,
  useEvaluations,
  useMissions,
} from "./rh-data";

// ── Helpers ────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("fr-SN").format(n);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

const STATUT_COLORS = {
  ACTIF: "bg-green-100 text-green-700",
  EN_CONGE: "bg-blue-100 text-blue-700",
  SUSPENDU: "bg-orange-100 text-orange-700",
  PARTI: "bg-gray-100 text-gray-400",
};

const STATUT_CONGE_COLORS = {
  EN_ATTENTE: "bg-yellow-100 text-yellow-700",
  VALIDE_N1: "bg-blue-100 text-blue-700",
  APPROUVE: "bg-green-100 text-green-700",
  REJETE: "bg-red-100 text-red-600",
  ANNULE: "bg-gray-100 text-gray-500",
};

const STATUT_EVAL_COLORS = {
  EN_COURS: "bg-blue-100 text-blue-700",
  COMPLETEE: "bg-green-100 text-green-700",
  SIGNEE: "bg-purple-100 text-purple-700",
  EN_RETARD: "bg-red-100 text-red-700",
};

const STATUT_MISSION_COLORS = {
  VALIDE: "bg-green-100 text-green-700",
  EN_ATTENTE: "bg-yellow-100 text-yellow-700",
  REJETE: "bg-red-100 text-red-600",
};

function Badge({ statut, colors }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[statut] ?? "bg-gray-100 text-gray-600"}`}
    >
      {statut?.replace(/_/g, " ")}
    </span>
  );
}

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
        active
          ? "bg-white border border-gray-200 text-gray-900 shadow-sm"
          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
      }`}
    >
      <Icon size={15} />
      {children}
    </button>
  );
}

function InfoRow({ label, value, hidden }) {
  if (hidden) return null;
  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-40 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-gray-900">{value || "—"}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// PAGE DOSSIER EMPLOYÉ
// ══════════════════════════════════════════════════════════
export default function RHEmployeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const isRH = user?.roles?.some((r) => ["ROLE_RH", "ROLE_ADMIN"].includes(r));
  const isSE = user?.roles?.includes("ROLE_SE");
  const isRAF = user?.roles?.includes("ROLE_RAF");
  const isRP = user?.roles?.includes("ROLE_RESPONSABLE_PROGRAMMES");
  const canSeeSalaire = isRH || isSE;
  const canSeeContrats = isRH || isSE; // RP ne voit ni salaires ni contrats

  const [tab, setTab] = useState("infos");

  const { data: allEmployes = [] } = useEmployes();
  const { data: allConges = [] } = useConges();
  const { data: allEvaluations = [] } = useEvaluations();
  const { data: allMissions = [] } = useMissions();
  const { data: allDocuments = [] } = useDocumentsEmploye(id);

  const employe = allEmployes.find((e) => e.id === id);

  const empConges = useMemo(
    () => allConges.filter((c) => c.employeId === id),
    [id, allConges],
  );
  const empEvaluations = useMemo(
    () => allEvaluations.filter((e) => e.employeId === id),
    [id, allEvaluations],
  );
  const empMissions = useMemo(
    () => allMissions.filter((m) => m.employeId === id),
    [id, allMissions],
  );
  const empDocuments = useMemo(
    () => allDocuments.filter((d) => d.employeId === id),
    [id, allDocuments],
  );

  const superviseur = employe?.superviseurId
    ? allEmployes.find((e) => e.id === employe.superviseurId)
    : null;

  if (!employe) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={16} /> Retour
        </button>
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <User className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="text-sm text-gray-500">Employé introuvable.</p>
        </div>
      </div>
    );
  }

  const isParti = employe.statut === "PARTI";

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 transition-colors mt-1"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-lg font-bold text-green-700">
              {employe.prenom[0]}
              {employe.nom[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {employe.prenom} {employe.nom}
              </h1>
              <p className="text-sm text-gray-500">
                {employe.matricule} · {employe.poste}
              </p>
            </div>
            <Badge statut={employe.statut} colors={STATUT_COLORS} />
            {isParti && (
              <span className="rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium text-gray-400">
                Dossier archivé — lecture seule
              </span>
            )}
          </div>
        </div>
        {isRH && !isParti && (
          <button
            onClick={() => navigate(`/rh/employes/${id}/edit`)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Edit size={14} />
            Modifier
          </button>
        )}
      </div>

      {/* Onglets */}
      <div className="flex gap-1 flex-wrap rounded-xl bg-gray-100 p-1 w-fit">
        <TabButton
          active={tab === "infos"}
          onClick={() => setTab("infos")}
          icon={User}
        >
          Informations
        </TabButton>
        {canSeeContrats && (
          <TabButton
            active={tab === "contrats"}
            onClick={() => setTab("contrats")}
            icon={FileText}
          >
            Contrats & Documents
          </TabButton>
        )}
        <TabButton
          active={tab === "conges"}
          onClick={() => setTab("conges")}
          icon={Calendar}
        >
          Congés
        </TabButton>
        {!isRP && (
          <TabButton
            active={tab === "evaluations"}
            onClick={() => setTab("evaluations")}
            icon={Star}
          >
            Évaluations
          </TabButton>
        )}
        <TabButton
          active={tab === "missions"}
          onClick={() => setTab("missions")}
          icon={MapPin}
        >
          Missions
        </TabButton>
      </div>

      {/* ── Onglet 1 : Informations générales ──────────── */}
      {tab === "infos" && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Identité
              </h3>
              <InfoRow label="Matricule" value={employe.matricule} />
              <InfoRow
                label="Nom complet"
                value={`${employe.prenom} ${employe.nom}`}
              />
              <InfoRow
                label="Date de naissance"
                value={fmtDate(employe.dateNaissance)}
              />
              <InfoRow
                label="Lieu de naissance"
                value={employe.lieuNaissance}
              />
              <InfoRow label="Nationalité" value={employe.nationalite} />
              <InfoRow label="Téléphone" value={employe.telephone} />
              <InfoRow label="Adresse" value={employe.adresse} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Poste & Organisation
              </h3>
              <InfoRow label="Poste" value={employe.poste} />
              <InfoRow label="Département" value={employe.departement} />
              <InfoRow
                label="Supérieur"
                value={
                  superviseur
                    ? `${superviseur.prenom} ${superviseur.nom}`
                    : "Aucun"
                }
              />
              <InfoRow
                label="Date d'embauche"
                value={fmtDate(employe.dateEmbauche)}
                hidden={isRP}
              />
              <InfoRow
                label="Type de contrat"
                value={employe.typeContrat}
                hidden={isRP}
              />
              <InfoRow
                label="Début contrat"
                value={fmtDate(employe.dateDebutContrat)}
                hidden={isRP}
              />
              <InfoRow
                label="Fin contrat"
                value={fmtDate(employe.dateFinContrat)}
                hidden={isRP}
              />
              <InfoRow
                label="Salaire brut"
                value={
                  canSeeSalaire
                    ? `${fmt(employe.salaireBase)} ${employe.devise}`
                    : null
                }
                hidden={!canSeeSalaire}
              />
              <InfoRow
                label="Solde congés"
                value={`${employe.soldeConges} jours`}
              />
              <InfoRow
                label="Récupération"
                value={`${employe.soldeRecuperation} jours`}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Onglet 2 : Contrats & Documents ────────────── */}
      {tab === "contrats" && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-800">
              Documents contractuels
            </h3>
            {isRH && !isParti && (
              <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                <Upload size={13} />
                Déposer un document
              </button>
            )}
          </div>
          {empDocuments.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">
              Aucun document contractuel.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Titre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Date dépôt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Statut GED
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {empDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {doc.titre}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      {doc.type}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {doc.version}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {fmtDate(doc.dateDepot)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          doc.statutGED === "Validé"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {doc.statutGED}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Onglet 3 : Congés ──────────────────────────── */}
      {tab === "conges" && (() => {
        const pad = (n) => String(n).padStart(2, "0");
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const congeActif = empConges.find(
          (c) => c.statut === "APPROUVE" && c.dateFin >= todayStr
        );
        const joursRestantsConge = congeActif
          ? Math.max(0, Math.ceil((new Date(congeActif.dateFin) - now) / (1000 * 60 * 60 * 24)))
          : null;
        return (
        <div className="space-y-4">
          {/* Congé actif en cours */}
          {congeActif && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 flex items-center gap-3">
              <Calendar size={16} className="text-blue-500 shrink-0" />
              <div className="flex-1 text-sm text-blue-800">
                En congé <span className="font-semibold">{congeActif.typeConge?.replace(/_/g, " ")}</span> jusqu'au{" "}
                <span className="font-semibold">{fmtDate(congeActif.dateFin)}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-2xl font-bold text-blue-700">{joursRestantsConge}</span>
                <span className="text-xs text-blue-500 ml-1">j restants</span>
              </div>
            </div>
          )}

          {/* Solde */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Congé annuel</p>
              <p className="text-xl font-bold text-gray-900">
                {employe.soldeConges}{" "}
                <span className="text-sm font-normal text-gray-400">
                  jours restants
                </span>
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">Récupération</p>
              <p className="text-xl font-bold text-gray-900">
                {employe.soldeRecuperation}{" "}
                <span className="text-sm font-normal text-gray-400">
                  jours restants
                </span>
              </p>
            </div>
          </div>

          {/* Bouton nouvelle demande — masqué pour le RP */}
          {!isParti && !isRP && (
            <button
              onClick={() => navigate("/rh/conges")}
              className="flex items-center gap-2 rounded-lg border border-green-200 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-50 transition-colors"
            >
              <Calendar size={13} />
              Nouvelle demande de congé
            </button>
          )}

          {/* Historique */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {empConges.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-gray-400">
                Aucun congé enregistré.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Début
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Fin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Jours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Validé par
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {empConges.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          {c.typeConge}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {fmtDate(c.dateDebut)}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {fmtDate(c.dateFin)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {c.nbJours}j
                      </td>
                      <td className="px-6 py-4">
                        <Badge statut={c.statut} colors={STATUT_CONGE_COLORS} />
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {c.valideurRH || c.valideurN1 || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        );
      })()}

      {/* ── Onglet 4 : Évaluations ────────────────────── */}
      {tab === "evaluations" && (
        <div className="space-y-4">
          {isRH && !isParti && (
            <button className="flex items-center gap-2 rounded-lg border border-green-200 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-50 transition-colors">
              <Star size={13} />
              Nouvelle évaluation
            </button>
          )}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {empEvaluations.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-gray-400">
                Aucune évaluation.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Année
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Note
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Évalué par
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {empEvaluations.map((ev) => (
                    <tr key={ev.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {ev.annee}
                      </td>
                      <td className="px-6 py-4">
                        {ev.noteGlobale != null ? (
                          <span className="text-sm font-bold text-gray-900">
                            {ev.noteGlobale.toFixed(1)}
                            <span className="text-xs text-gray-400">/5</span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge statut={ev.statut} colors={STATUT_EVAL_COLORS} />
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {ev.evaluePar}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {fmtDate(ev.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Onglet 5 : Missions ───────────────────────── */}
      {tab === "missions" && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {empMissions.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">
              Aucune mission enregistrée.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Destination
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Projet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Statut RAF
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {empMissions.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {m.destination}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-600">
                      {m.projet}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {fmtDate(m.dateDebut)} → {fmtDate(m.dateFin)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {fmt(m.budget)} XOF
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        statut={m.statutRAF}
                        colors={STATUT_MISSION_COLORS}
                      />
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
}
