import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Pencil,
  KeyRound,
  Power,
  Trash2,
  ShieldCheck,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  useUsers,
  useDeleteUser,
  useToggleStatutUser,
  useResetPassword,
} from "@/api/admin.api";
import { ROLES_DISPONIBLES } from "@/data/admin.mock";

// ── Helpers ───────────────────────────────────────────────────────────────────
function roleLabel(roleValue) {
  return ROLES_DISPONIBLES.find((r) => r.value === roleValue)?.label ?? roleValue;
}

function roleBadgeColor(role) {
  const map = {
    ROLE_SE:                    "bg-indigo-100 text-indigo-800",
    ROLE_ADMIN:                 "bg-orange-100 text-orange-800",
    ROLE_RAF:                   "bg-emerald-100 text-emerald-800",
    ROLE_RH:                    "bg-blue-100 text-blue-800",
    ROLE_RESPONSABLE_PROGRAMMES:"bg-violet-100 text-violet-800",
    ROLE_CHARGE_PROGRAMME:      "bg-purple-100 text-purple-800",
    ROLE_RESPONSABLE_SE:        "bg-cyan-100 text-cyan-800",
    ROLE_COMPTABLE:             "bg-amber-100 text-amber-800",
    ROLE_CHARGE_COMMUNICATION:  "bg-pink-100 text-pink-800",
    ROLE_TECHNICIEN_TERRAIN:    "bg-lime-100 text-lime-800",
    ROLE_ANTENNE:               "bg-teal-100 text-teal-800",
  };
  return map[role] ?? "bg-gray-100 text-gray-700";
}

// ── Modale reset mot de passe ─────────────────────────────────────────────────
function ResetPasswordModal({ user, onClose }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { mutate, isPending } = useResetPassword();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    mutate({ id: user.id, motDePasse: password }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900">
          Réinitialiser le mot de passe
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {user.prenom} {user.nom} — {user.email}
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Minimum 8 caractères"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Répéter le mot de passe"
              required
            />
          </div>
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
              className="flex-1 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {isPending ? "Envoi…" : "Réinitialiser"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Menu actions par ligne ────────────────────────────────────────────────────
function ActionsMenu({ user, onEdit, onReset, onToggle, onDelete }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
            <button
              onClick={() => { setOpen(false); onEdit(); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Pencil size={14} /> Modifier
            </button>
            <button
              onClick={() => { setOpen(false); onReset(); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <KeyRound size={14} /> Réinitialiser le mot de passe
            </button>
            <button
              onClick={() => { setOpen(false); onToggle(); }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                user.statut === "ACTIF" ? "text-amber-700" : "text-green-700"
              }`}
            >
              <Power size={14} />
              {user.statut === "ACTIF" ? "Désactiver le compte" : "Réactiver le compte"}
            </button>
            <div className="my-1 border-t border-gray-100" />
            <button
              onClick={() => { setOpen(false); onDelete(); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 size={14} /> Supprimer
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { data: users = [], isLoading } = useUsers();
  const { mutate: deleteUser } = useDeleteUser();
  const { mutate: toggleStatut } = useToggleStatutUser();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [resetTarget, setResetTarget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.nom.toLowerCase().includes(q) ||
      u.prenom.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchRole = !filterRole || u.roles.includes(filterRole);
    const matchStatut = !filterStatut || u.statut === filterStatut;
    return matchSearch && matchRole && matchStatut;
  });

  const actifCount = users.filter((u) => u.statut === "ACTIF").length;
  const inactifCount = users.filter((u) => u.statut === "INACTIF").length;

  return (
    <div className="space-y-6">
      {/* En-tête KPI */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 flex items-center gap-3">
          <div className="rounded-lg bg-orange-100 p-2">
            <Users size={18} className="text-orange-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total utilisateurs</p>
            <p className="text-xl font-bold text-gray-900">{users.length}</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 flex items-center gap-3">
          <div className="rounded-lg bg-green-100 p-2">
            <UserCheck size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Actifs</p>
            <p className="text-xl font-bold text-gray-900">{actifCount}</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 flex items-center gap-3">
          <div className="rounded-lg bg-gray-100 p-2">
            <UserX size={18} className="text-gray-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Inactifs</p>
            <p className="text-xl font-bold text-gray-900">{inactifCount}</p>
          </div>
        </div>
      </div>

      {/* Barre d'actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Recherche */}
          <div className="relative min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          {/* Filtre rôle */}
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="appearance-none rounded-lg border border-gray-200 py-2 pl-9 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">Tous les rôles</option>
              {ROLES_DISPONIBLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          {/* Filtre statut */}
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="rounded-lg border border-gray-200 py-2 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">Tous les statuts</option>
            <option value="ACTIF">Actif</option>
            <option value="INACTIF">Inactif</option>
          </select>
        </div>
        <button
          onClick={() => navigate("/admin/utilisateurs/nouveau")}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          <Plus size={16} />
          Créer un utilisateur
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-gray-400">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">
            Aucun utilisateur trouvé
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Utilisateur
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Rôle(s)
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Dernière connexion
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700">
                        {u.prenom[0]}{u.nom[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {u.prenom} {u.nom}
                        </p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <span
                          key={r}
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleBadgeColor(r)}`}
                        >
                          {roleLabel(r)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                        u.statut === "ACTIF"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          u.statut === "ACTIF" ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      {u.statut === "ACTIF" ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {u.derniereConnexion
                      ? new Date(u.derniereConnexion).toLocaleDateString("fr-SN")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ActionsMenu
                      user={u}
                      onEdit={() => navigate(`/admin/utilisateurs/${u.id}/edit`)}
                      onReset={() => setResetTarget(u)}
                      onToggle={() => toggleStatut({ id: u.id, statut: u.statut === "ACTIF" ? "INACTIF" : "ACTIF" })}
                      onDelete={() => setDeleteConfirm(u)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Résumé */}
      {filtered.length > 0 && (
        <p className="text-xs text-gray-400">
          {filtered.length} utilisateur{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
          {filtered.length !== users.length && ` sur ${users.length}`}
        </p>
      )}

      {/* Modale reset mot de passe */}
      {resetTarget && (
        <ResetPasswordModal user={resetTarget} onClose={() => setResetTarget(null)} />
      )}

      {/* Modale confirmation suppression */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-full bg-red-100 p-2">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Supprimer le compte</h3>
            </div>
            <p className="text-sm text-gray-600">
              Voulez-vous supprimer définitivement le compte de{" "}
              <strong>{deleteConfirm.prenom} {deleteConfirm.nom}</strong> ({deleteConfirm.email}) ?
              Cette action est irréversible.
            </p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  deleteUser(deleteConfirm.id);
                  setDeleteConfirm(null);
                }}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
