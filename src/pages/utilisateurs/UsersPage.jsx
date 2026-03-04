import { usersApi } from "@/api/users.api";
import useAuthStore from "@/stores/auth.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, UserCog, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STATUT_COLORS = {
  ACTIF: "bg-green-100 text-green-700",
  EN_ATTENTE: "bg-yellow-100 text-yellow-700",
  SUSPENDU: "bg-orange-100 text-orange-700",
  INACTIF: "bg-gray-100 text-gray-500",
};

const STATUT_LABELS = {
  ACTIF: "Actif",
  EN_ATTENTE: "En attente",
  SUSPENDU: "Suspendu",
  INACTIF: "Inactif",
};

const TOUS_LES_ROLES = [
  "ROLE_SECRETAIRE_EXECUTIF",
  "ROLE_RAF",
  "ROLE_COMPTABLE",
  "ROLE_RESPONSABLE_PROGRAMMES",
  "ROLE_CHARGE_PROGRAMME",
  "ROLE_RESPONSABLE_SE",
  "ROLE_RH",
  "ROLE_ANTENNE",
  "ROLE_TECHNICIEN_TERRAIN",
  "ROLE_CHARGE_COMMUNICATION",
];

const ROLE_LABELS = {
  ROLE_SECRETAIRE_EXECUTIF: "Secrétaire Exécutif",
  ROLE_RAF: "RAF",
  ROLE_COMPTABLE: "Comptable",
  ROLE_RESPONSABLE_PROGRAMMES: "Resp. Programmes",
  ROLE_CHARGE_PROGRAMME: "Chargé Programme",
  ROLE_RESPONSABLE_SE: "Resp. S&E",
  ROLE_RH: "RH",
  ROLE_ANTENNE: "Antenne",
  ROLE_TECHNICIEN_TERRAIN: "Tech. Terrain",
  ROLE_CHARGE_COMMUNICATION: "Communication",
};

function RoleBadge({ role }) {
  const label = ROLE_LABELS[role] ?? role.replace("ROLE_", "");
  return (
    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 border border-green-100">
      {label}
    </span>
  );
}

const emptyForm = {
  nom: "",
  prenom: "",
  email: "",
  motDePasse: "",
  telephone: "",
  service: "",
  roles: [],
};

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: usersApi.getAll,
  });
  const users = data ?? [];

  const { mutate: creer, isPending: creating } = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Utilisateur créé avec succès");
      setShowForm(false);
      setForm(emptyForm);
    },
    onError: (err) => toast.error(err.message ?? "Erreur lors de la création"),
  });

  const { mutate: changerStatut, isPending: changingStatut } = useMutation({
    mutationFn: ({ id, statut }) => usersApi.changerStatut(id, statut),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Statut mis à jour");
    },
    onError: (err) => toast.error(err.message ?? "Erreur"),
  });

  const isPending = creating || changingStatut;

  const toggleRole = (role) => {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...prev.roles, role],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.roles.length === 0) {
      toast.error("Sélectionnez au moins un rôle");
      return;
    }
    creer(form);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="mt-1 text-sm text-gray-500">
            {users.length} utilisateur{users.length !== 1 ? "s" : ""} enregistré
            {users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors"
          style={{ background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)" }}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Annuler" : "Nouvel utilisateur"}
        </button>
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-green-100 bg-white p-6 shadow-sm space-y-5"
        >
          <h2 className="text-base font-semibold text-gray-900">
            Créer un utilisateur
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { label: "Nom", key: "nom", required: true },
              { label: "Prénom", key: "prenom", required: true },
              { label: "Email", key: "email", type: "email", required: true },
              {
                label: "Mot de passe",
                key: "motDePasse",
                type: "password",
                required: true,
              },
              { label: "Téléphone", key: "telephone" },
              { label: "Service / Département", key: "service" },
            ].map(({ label, key, type = "text", required }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  {label} {required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  required={required}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
                />
              </div>
            ))}
          </div>

          {/* Sélection des rôles */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Rôles <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TOUS_LES_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    form.roles.includes(role)
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
                  }`}
                >
                  {ROLE_LABELS[role]}
                </button>
              ))}
            </div>
            {form.roles.length > 0 && (
              <p className="mt-1.5 text-xs text-gray-400">
                {form.roles.length} rôle{form.roles.length > 1 ? "s" : ""}{" "}
                sélectionné{form.roles.length > 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm(emptyForm);
              }}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)",
              }}
            >
              {creating ? "Création..." : "Créer l'utilisateur"}
            </button>
          </div>
        </form>
      )}

      {/* Table des utilisateurs */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-48 animate-pulse rounded bg-gray-200" />
                </div>
                <div className="ml-auto h-6 w-16 animate-pulse rounded-full bg-gray-200" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <UserCog className="mx-auto mb-3 text-gray-300" size={40} />
            <p className="text-sm text-gray-400">Aucun utilisateur trouvé.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Rôles
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Dernière connexion
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {u.prenom?.[0]}
                        {u.nom?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {u.prenom} {u.nom}
                        </p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {u.service ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.length > 0 ? (
                        u.roles.map((r) => <RoleBadge key={r} role={r} />)
                      ) : (
                        <span className="text-xs text-gray-400">
                          Aucun rôle
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_COLORS[u.statut] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {STATUT_LABELS[u.statut] ?? u.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {u.derniereConnexion
                      ? new Date(u.derniereConnexion).toLocaleDateString(
                          "fr-SN",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      : "Jamais connecté"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.id !== currentUser?.userId && (
                      <div className="flex items-center justify-end gap-1">
                        {u.statut === "ACTIF" && (
                          <button
                            disabled={isPending}
                            onClick={() =>
                              changerStatut({ id: u.id, statut: "SUSPENDU" })
                            }
                            className="rounded-lg border border-orange-100 px-2 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50 disabled:opacity-50"
                          >
                            Suspendre
                          </button>
                        )}
                        {["SUSPENDU", "EN_ATTENTE", "INACTIF"].includes(
                          u.statut,
                        ) && (
                          <button
                            disabled={isPending}
                            onClick={() =>
                              changerStatut({ id: u.id, statut: "ACTIF" })
                            }
                            className="rounded-lg border border-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                          >
                            Activer
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
