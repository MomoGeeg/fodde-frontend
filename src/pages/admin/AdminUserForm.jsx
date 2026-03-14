import { useCreateUser, useUpdateUser, useUser } from "@/api/admin.api";
import { ROLES_DISPONIBLES } from "@/data/admin.mock";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const emptyForm = {
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  service: "",
  roles: [],
  statut: "ACTIF",
  password: "",
  passwordConfirm: "",
};

export default function AdminUserForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const { data: existingUser } = useUser(id);
  const { mutate: createUser, isPending: creating } = useCreateUser();
  const { mutate: updateUser, isPending: updating } = useUpdateUser();
  const isPending = creating || updating;

  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isEditMode && existingUser) {
      setForm({
        nom: existingUser.nom ?? "",
        prenom: existingUser.prenom ?? "",
        email: existingUser.email ?? "",
        telephone: existingUser.telephone ?? "",
        service: existingUser.service ?? "",
        roles: existingUser.roles ?? [],
        statut: existingUser.statut ?? "ACTIF",
        password: "",
        passwordConfirm: "",
      });
    }
  }, [isEditMode, existingUser]);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const toggleRole = (role) => {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(role)
        ? f.roles.filter((r) => r !== role)
        : [...f.roles, role],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.roles.length === 0) {
      toast.error("Sélectionnez au moins un rôle");
      return;
    }

    if (!isEditMode) {
      if (form.password.length < 8) {
        toast.error("Le mot de passe doit contenir au moins 8 caractères");
        return;
      }
      if (form.password !== form.passwordConfirm) {
        toast.error("Les mots de passe ne correspondent pas");
        return;
      }
    }

    const payload = {
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      email: form.email.trim().toLowerCase(),
      telephone: form.telephone.trim() || null,
      service: form.service.trim() || null,
      roles: form.roles,
      statut: form.statut,
      ...(isEditMode ? {} : { motDePasse: form.password }),
    };

    const onError = (error) => {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Une erreur est survenue";
      toast.error(msg);
    };

    if (isEditMode) {
      updateUser(
        { id, ...payload },
        {
          onSuccess: () => {
            toast.success("Compte mis à jour");
            navigate("/admin/utilisateurs");
          },
          onError,
        },
      );
    } else {
      createUser(payload, {
        onSuccess: () => {
          toast.success("Compte créé avec succès");
          navigate("/admin/utilisateurs");
        },
        onError,
      });
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Bouton retour */}
      <button
        onClick={() => navigate("/admin/utilisateurs")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft size={16} />
        Retour à la liste
      </button>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations personnelles */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Informations personnelles
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.prenom}
                onChange={set("prenom")}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Aminata"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.nom}
                onChange={set("nom")}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Diallo"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Adresse email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              required
              disabled={isEditMode}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-50 disabled:text-gray-400"
              placeholder="aminata.diallo@fodde.org"
            />
            {isEditMode && (
              <p className="mt-1 text-xs text-gray-400">
                L'adresse email ne peut pas être modifiée
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={form.telephone}
                onChange={set("telephone")}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="+221 77 000 00 00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Service / Département
              </label>
              <input
                type="text"
                value={form.service}
                onChange={set("service")}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Programmes"
              />
            </div>
          </div>
        </div>

        {/* Rôle(s) */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-orange-500" />
            <h3 className="text-sm font-semibold text-gray-900">
              Rôle(s) assigné(s) <span className="text-red-500">*</span>
            </h3>
          </div>
          <p className="text-xs text-gray-500">
            Sélectionnez un ou plusieurs rôles pour cet utilisateur.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {ROLES_DISPONIBLES.map((r) => (
              <label
                key={r.value}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  form.roles.includes(r.value)
                    ? "border-orange-400 bg-orange-50 text-orange-800"
                    : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={form.roles.includes(r.value)}
                  onChange={() => toggleRole(r.value)}
                />
                <span
                  className={`h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center ${
                    form.roles.includes(r.value)
                      ? "border-orange-500 bg-orange-500"
                      : "border-gray-300"
                  }`}
                >
                  {form.roles.includes(r.value) && (
                    <svg
                      viewBox="0 0 12 12"
                      className="h-2.5 w-2.5 text-white"
                      fill="currentColor"
                    >
                      <path
                        d="M10 3L5 8.5 2 5.5"
                        stroke="white"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                {r.label}
              </label>
            ))}
          </div>
        </div>

        {/* Statut (edit uniquement) */}
        {isEditMode && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Statut du compte
            </h3>
            <div className="flex gap-3">
              {["ACTIF", "INACTIF"].map((s) => (
                <label
                  key={s}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm ${
                    form.statut === s
                      ? s === "ACTIF"
                        ? "border-green-400 bg-green-50 text-green-800"
                        : "border-gray-400 bg-gray-100 text-gray-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="statut"
                    value={s}
                    checked={form.statut === s}
                    onChange={set("statut")}
                    className="hidden"
                  />
                  <span
                    className={`h-3 w-3 rounded-full ${
                      form.statut === s
                        ? s === "ACTIF"
                          ? "bg-green-500"
                          : "bg-gray-400"
                        : "bg-gray-200"
                    }`}
                  />
                  {s === "ACTIF" ? "Actif" : "Inactif"}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Mot de passe (création uniquement) */}
        {!isEditMode && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Mot de passe
            </h3>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Minimum 8 caractères"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Confirmer le mot de passe{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={form.passwordConfirm}
                  onChange={set("passwordConfirm")}
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Répéter le mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/utilisateurs")}
            className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {isPending
              ? isEditMode
                ? "Mise à jour…"
                : "Création…"
              : isEditMode
                ? "Enregistrer les modifications"
                : "Créer le compte"}
          </button>
        </div>
      </form>
    </div>
  );
}
