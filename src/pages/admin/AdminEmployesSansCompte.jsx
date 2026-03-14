import { useState } from "react";
import { UserPlus, Users, X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  useEmployesSansCompte,
  useCreerCompteDepuisEmploye,
} from "@/api/admin.api";
import { ROLES_DISPONIBLES } from "@/data/admin.mock";

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

// ── Page principale ───────────────────────────────────────────────────────────
export default function AdminEmployesSansCompte() {
  const { data: employes = [], isLoading } = useEmployesSansCompte();
  const [modalTarget, setModalTarget] = useState(null);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Employés sans compte utilisateur
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Ces employés ont été ajoutés par le RH mais n'ont pas encore accès
            à la plateforme. Créez leur compte pour leur donner accès.
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
            Aucun employé en attente de création de compte.
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
              <button
                onClick={() => setModalTarget(emp)}
                className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              >
                <UserPlus size={15} />
                Créer le compte
              </button>
            </div>
          ))}
        </div>
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
