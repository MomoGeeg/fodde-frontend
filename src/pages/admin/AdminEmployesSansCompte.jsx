import { useState } from "react";
import { Link2, Unlink, UserPlus, Users, X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  useAssocierCompte,
  useDissocierCompte,
  useEmployesSansCompte,
  useCreerCompteDepuisEmploye,
  useLiensComptesFiches,
} from "@/api/admin.api";
import { useComptesSansFiche } from "@/api/rh-data";
import { ROLES_DISPONIBLES } from "@/lib/roles";

// ── Modale création de compte depuis employé ──────────────────────────────────
function CreerCompteModal({ employe, onClose }) {
  const { mutate: creerCompte, isPending } = useCreerCompteDepuisEmploye();
  const [form, setForm] = useState({
    email: "",
    roles: [],
    password: "",
    passwordConfirm: "",
  });
  const [showPwd, setShowPwd] = useState(false);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const toggleRole = (role) =>
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(role)
        ? f.roles.filter((r) => r !== role)
        : [...f.roles, role],
    }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.roles.length === 0) {
      toast.error("Sélectionnez au moins un rôle");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Mot de passe : minimum 8 caractères");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    creerCompte(
      { employe, email: form.email, roles: form.roles, motDePasse: form.password },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Créer un compte utilisateur
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {employe.prenom} {employe.nom} — {employe.poste}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-gray-100 text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder={`${employe.prenom.toLowerCase()}.${employe.nom.toLowerCase()}@fodde.org`}
            />
          </div>

          {/* Rôles */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Rôle(s) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
              {ROLES_DISPONIBLES.filter((r) => r.value !== "ROLE_ADMIN").map((r) => (
                <label
                  key={r.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                    form.roles.includes(r.value)
                      ? "border-orange-400 bg-orange-50 text-orange-800"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={form.roles.includes(r.value)}
                    onChange={() => toggleRole(r.value)}
                  />
                  <span
                    className={`h-3 w-3 shrink-0 rounded border-2 ${
                      form.roles.includes(r.value)
                        ? "border-orange-500 bg-orange-500"
                        : "border-gray-300"
                    }`}
                  />
                  {r.label}
                </label>
              ))}
            </div>
          </div>

          {/* Mot de passe temporaire */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Mot de passe temporaire <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Minimum 8 caractères"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Confirmer le mot de passe <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={form.passwordConfirm}
              onChange={set("passwordConfirm")}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {isPending ? "Création…" : "Créer le compte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modale : associer un compte déjà créé ─────────────────────────────────────
function AssocierCompteModal({ employe, comptesLibres, onClose }) {
  const { mutate: associer, isPending } = useAssocierCompte();
  const [userId, setUserId] = useState("");
  // Propose en premier les comptes au même nom que la fiche.
  const memeNom = (u) =>
    u.nom?.toLowerCase() === employe.nom?.toLowerCase() && u.prenom?.toLowerCase() === employe.prenom?.toLowerCase();
  const comptes = [...comptesLibres].sort((a, b) => memeNom(b) - memeNom(a));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userId) {
      toast.error("Choisissez un compte");
      return;
    }
    associer({ employeId: employe.id, userId }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Associer un compte existant</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {employe.prenom} {employe.nom} — {employe.poste}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {comptes.length === 0 ? (
            <p className="text-sm text-gray-600">
              Tous les comptes sont déjà liés à une fiche. Créez plutôt un compte pour cet employé.
            </p>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Compte <span className="text-red-500">*</span>
              </label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">Choisir…</option>
                {comptes.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.prenom} {u.nom} — {u.email}
                    {u.statut !== "ACTIF" ? ` (${u.statut.toLowerCase()})` : ""}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-gray-500">
                La personne verra ensuite ses congés et son solde dans la page Congés.
              </p>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending || comptes.length === 0}
              className="flex-1 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {isPending ? "Association…" : "Associer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Comptes sans fiche : la fiche (données RH) est créée par les RH ──────────
function ComptesSansFicheAdmin({ comptes }) {
  if (comptes.length === 0) return null;
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Comptes sans fiche employé ({comptes.length})</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Les RH créent la fiche depuis Équipe › Employés : elle sera liée au compte d'office.
          Si la fiche existe déjà ci-dessus, utilisez plutôt « Associer un compte existant ».
        </p>
      </div>
      <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
        {comptes.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
            <p className="text-sm text-gray-900">
              {c.prenom} {c.nom} <span className="text-xs text-gray-500">— {c.email}</span>
            </p>
            <span className="text-xs text-gray-500">{c.statut === "ACTIF" ? "Compte actif" : `Compte ${c.statut.toLowerCase().replace("_", " ")}`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Fiches déjà liées à un compte ─────────────────────────────────────────────
function FichesLiees({ fiches }) {
  const { mutate: dissocier, isPending } = useDissocierCompte();
  if (fiches.length === 0) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Fiches liées à un compte ({fiches.length})</h3>
      <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
        {fiches.map((f) => (
          <div key={f.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {f.prenom} {f.nom} <span className="font-normal text-gray-500">· {f.poste}</span>
              </p>
              <p className="text-xs text-gray-500">
                Compte : {f.compte ? `${f.compte.prenom} ${f.compte.nom} — ${f.compte.email}` : "introuvable"}
              </p>
            </div>
            <button
              disabled={isPending}
              onClick={() => {
                if (window.confirm(`Retirer le lien entre la fiche de ${f.prenom} ${f.nom} et son compte ?`)) dissocier(f.id);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              <Unlink size={13} /> Dissocier
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function AdminEmployesSansCompte() {
  const { data: employes = [], isLoading } = useEmployesSansCompte();
  const { data: liens } = useLiensComptesFiches();
  const { data: comptesSansFiche = [] } = useComptesSansFiche();
  const [modalTarget, setModalTarget] = useState(null);
  const [associerTarget, setAssocierTarget] = useState(null);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Employés sans compte utilisateur
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Les RH enregistrent la fiche de chaque employé ; vous lui ouvrez ensuite
            l'accès à la plateforme. Créez son compte, ou associez un compte déjà créé.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2">
          <Users size={16} className="text-orange-600" />
          <span className="text-sm font-semibold text-orange-700">
            {employes.length} en attente
          </span>
        </div>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-400">
          Chargement…
        </div>
      ) : employes.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <Users size={20} className="text-green-600" />
          </div>
          <p className="text-sm font-medium text-gray-700">
            Tous les employés ont un compte
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Pour un nouvel employé, les RH enregistrent d'abord sa fiche
            (Équipe › Employés) : elle apparaîtra ici.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {employes.map((emp) => (
            <div
              key={emp.id}
              className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-5 py-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700">
                  {emp.prenom[0]}{emp.nom[0]}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {emp.prenom} {emp.nom}
                  </p>
                  <p className="text-xs text-gray-500">
                    {emp.poste} · {emp.departement}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Embauché le{" "}
                    {new Date(emp.dateEmbauche).toLocaleDateString("fr-SN")}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAssocierTarget(emp)}
                  className="flex items-center gap-2 rounded-xl border border-orange-300 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
                >
                  <Link2 size={15} />
                  Associer un compte existant
                </button>
                <button
                  onClick={() => setModalTarget(emp)}
                  className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  <UserPlus size={15} />
                  Créer le compte
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ComptesSansFicheAdmin comptes={comptesSansFiche} />

      <FichesLiees fiches={liens?.fichesLiees ?? []} />

      {associerTarget && (
        <AssocierCompteModal
          employe={associerTarget}
          comptesLibres={liens?.comptesLibres ?? []}
          onClose={() => setAssocierTarget(null)}
        />
      )}

      {modalTarget && (
        <CreerCompteModal
          employe={modalTarget}
          onClose={() => setModalTarget(null)}
        />
      )}
    </div>
  );
}
