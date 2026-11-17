import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/axios";
import { useUsers } from "@/api/admin.api";
import { messageErreur } from "@/lib/erreurs";
import { telechargerCsv } from "@/lib/export";

/** Choix de la fenêtre « Supprimer l'historique » : 0 = tout. */
const ANCIENNETES = [
  { jours: 30, label: "Plus de 1 mois" },
  { jours: 90, label: "Plus de 3 mois" },
  { jours: 180, label: "Plus de 6 mois" },
  { jours: 0, label: "Tout l'historique" },
];

const PERIODES = [
  { jours: 1, label: "Aujourd'hui" },
  { jours: 7, label: "7 derniers jours" },
  { jours: 30, label: "30 derniers jours" },
  { jours: 90, label: "3 derniers mois" },
  { jours: 365, label: "12 derniers mois" },
];

const MOTIFS = {
  MOT_DE_PASSE: "Mot de passe incorrect",
  COMPTE_INACTIF: "Compte désactivé",
  COMPTE_VERROUILLE: "Compte verrouillé",
  COMPTE_INCONNU: "Adresse e-mail inconnue",
};

/** Navigateur et système lisibles à partir du User-Agent. */
export function appareil(ua) {
  if (!ua) return "—";
  const nav = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Autre navigateur";
  const os = /Android/.test(ua)
    ? "Android"
    : /iPhone|iPad/.test(ua)
      ? "iOS"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac OS X/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "";
  return os ? `${nav} · ${os}` : nav;
}

const dateHeure = (d) =>
  new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const heure = (d) => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const memeJour = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

/** Fin de session : heure seule si le même jour que la connexion, sinon date et heure. */
function finSession(c) {
  if (!c.succes) return "—";
  if (!c.finSession) return "En cours";
  const quand = memeJour(c.dateConnexion, c.finSession) ? heure(c.finSession) : dateHeure(c.finSession);
  return c.typeFin === "EXPIRATION" ? `${quand} (expirée)` : quand;
}

function useConnexions(userId, jours) {
  return useQuery({
    queryKey: ["admin", "connexions", userId || "tous", jours],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/connexions", { params: { userId: userId || undefined, jours } });
      return data;
    },
  });
}

function useSupprimerConnexions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (avantJours) => api.delete("/api/admin/connexions", { params: { avantJours } }).then((r) => r.data),
    onSuccess: ({ supprimees }) => {
      qc.invalidateQueries({ queryKey: ["admin", "connexions"] });
      toast.success(supprimees === 0 ? "Aucune connexion à supprimer" : `${supprimees} connexion${supprimees > 1 ? "s" : ""} supprimée${supprimees > 1 ? "s" : ""}`);
    },
    onError: (err) => toast.error(messageErreur(err, "Suppression impossible")),
  });
}

function ModaleSuppression({ onClose }) {
  const [jours, setJours] = useState(90);
  const { mutate, isPending } = useSupprimerConnexions();
  const choix = ANCIENNETES.find((a) => a.jours === jours);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900">Supprimer l'historique</h3>
        <label className="mt-4 block text-xs font-medium text-gray-700" htmlFor="anciennete">
          Connexions à supprimer
        </label>
        <select
          id="anciennete"
          value={jours}
          onChange={(e) => setJours(Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          {ANCIENNETES.map((a) => (
            <option key={a.jours} value={a.jours}>
              {a.label}
            </option>
          ))}
        </select>
        <p className="mt-3 text-sm text-gray-600">
          {choix.jours === 0 ? "Tout l'historique sera supprimé." : `Les connexions de ${choix.label.toLowerCase()} seront supprimées.`}{" "}
          Cette action est irréversible.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            disabled={isPending}
            onClick={() => mutate(jours, { onSuccess: onClose })}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isPending ? "Suppression…" : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}

const champ =
  "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";

export default function AdminConnexionsPage() {
  const [params, setParams] = useSearchParams();
  const userId = params.get("userId") || "";
  const jours = Number(params.get("jours")) || 30;
  const resultat = params.get("resultat") || "";

  const changer = (cle, valeur) => {
    const p = new URLSearchParams(params);
    if (valeur) p.set(cle, valeur);
    else p.delete(cle);
    setParams(p, { replace: true });
  };

  const [suppression, setSuppression] = useState(false);
  const { data: users = [] } = useUsers();
  const { data: connexions = [], isLoading, isError } = useConnexions(userId, jours);

  const lignes = useMemo(
    () =>
      connexions.filter((c) => (resultat === "succes" ? c.succes : resultat === "echec" ? !c.succes : true)),
    [connexions, resultat],
  );
  const refusees = connexions.filter((c) => !c.succes).length;

  const exporter = () =>
    telechargerCsv(`connexions_${new Date().toISOString().slice(0, 10)}`, [
      ["Connexion", "Déconnexion", "Utilisateur", "E-mail", "Résultat", "Motif", "Adresse IP", "Appareil"],
      ...lignes.map((c) => [
        dateHeure(c.dateConnexion),
        c.succes && c.finSession ? dateHeure(c.finSession) + (c.typeFin === "EXPIRATION" ? " (expirée)" : "") : c.succes ? "En cours" : "",
        c.nomComplet || "",
        c.email,
        c.succes ? "Réussie" : "Refusée",
        c.succes ? "" : MOTIFS[c.motifEchec] || c.motifEchec || "",
        c.adresseIp || "",
        appareil(c.navigateur),
      ]),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Historique des connexions</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exporter}
            disabled={lignes.length === 0}
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Download size={16} />
            Excel
          </button>
          <button
            onClick={() => setSuppression(true)}
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} />
            Supprimer l'historique
          </button>
        </div>
      </div>
      {suppression && <ModaleSuppression onClose={() => setSuppression(false)} />}

      <div className="flex flex-wrap gap-2">
        <select value={userId} onChange={(e) => changer("userId", e.target.value)} className={champ} aria-label="Utilisateur">
          <option value="">Tous les utilisateurs</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.prenom} {u.nom}
            </option>
          ))}
        </select>
        <select value={jours} onChange={(e) => changer("jours", e.target.value === "30" ? "" : e.target.value)} className={champ} aria-label="Période">
          {PERIODES.map((p) => (
            <option key={p.jours} value={p.jours}>
              {p.label}
            </option>
          ))}
        </select>
        <select value={resultat} onChange={(e) => changer("resultat", e.target.value)} className={champ} aria-label="Résultat">
          <option value="">Toutes ({connexions.length})</option>
          <option value="succes">Réussies ({connexions.length - refusees})</option>
          <option value="echec">Refusées ({refusees})</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Connexion</th>
              <th className="px-4 py-3">Déconnexion</th>
              <th className="px-4 py-3">Utilisateur</th>
              <th className="px-4 py-3">Résultat</th>
              <th className="px-4 py-3">Adresse IP</th>
              <th className="px-4 py-3">Appareil</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Chargement…
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-red-600">
                  Historique indisponible.
                </td>
              </tr>
            ) : lignes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Aucune connexion sur la période.
                </td>
              </tr>
            ) : (
              lignes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/60">
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-gray-700">{dateHeure(c.dateConnexion)}</td>
                  <td
                    className={`whitespace-nowrap px-4 py-3 tabular-nums ${
                      c.succes && !c.finSession ? "font-medium text-green-700" : "text-gray-700"
                    }`}
                  >
                    {finSession(c)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{c.nomComplet || "—"}</p>
                    <p className="text-xs text-gray-500">{c.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {c.succes ? (
                      <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">Réussie</span>
                    ) : (
                      <span className="inline-flex flex-col">
                        <span className="w-fit rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">Refusée</span>
                        <span className="mt-1 text-xs text-gray-500">{MOTIFS[c.motifEchec] || c.motifEchec}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-gray-600">{c.adresseIp || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{appareil(c.navigateur)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
