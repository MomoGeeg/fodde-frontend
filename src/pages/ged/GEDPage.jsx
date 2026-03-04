import { gedApi } from "@/api/ged.api";
import useAuthStore from "@/stores/auth.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileArchive } from "lucide-react";
import { toast } from "sonner";

const STATUT_COLORS = {
  BROUILLON: "bg-gray-100 text-gray-600",
  EN_VALIDATION: "bg-yellow-100 text-yellow-700",
  VALIDE: "bg-green-100 text-green-700",
  ARCHIVE: "bg-blue-100 text-blue-700",
  REJETE: "bg-red-100 text-red-600",
};

const STATUT_LABELS = {
  BROUILLON: "Brouillon",
  EN_VALIDATION: "En validation",
  VALIDE: "Validé",
  ARCHIVE: "Archivé",
};

const TYPE_LABELS = {
  RAPPORT: "Rapport",
  CONTRAT: "Contrat",
  JUSTIFICATIF: "Justificatif",
  PHOTO: "Photo",
  POLITIQUE: "Politique",
  PV: "Procès-verbal",
  CONVENTION: "Convention",
  AUTRE: "Autre",
};

const VISIBILITE_LABELS = {
  PRIVE: "Privé",
  EQUIPE_PROJET: "Équipe projet",
  ORGANISATION: "Organisation",
  CONSEIL_ADMIN: "Conseil admin",
};

function StatusBadge({ statut }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_COLORS[statut] ?? "bg-gray-100 text-gray-600"}`}
    >
      {STATUT_LABELS[statut] ?? statut}
    </span>
  );
}

export default function GEDPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["documents"],
    queryFn: gedApi.getAll,
  });
  const documents = data?.data ?? [];

  const { mutate: valider, isPending: pendingValider } = useMutation({
    mutationFn: (id) => gedApi.valider(id, user.userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document validé");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Erreur"),
  });

  const { mutate: archiver, isPending: pendingArchiver } = useMutation({
    mutationFn: (id) => gedApi.archiver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document archivé");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Erreur"),
  });

  const isPending = pendingValider || pendingArchiver;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GED — Documents</h1>
          <p className="mt-1 text-sm text-gray-500">
            {documents.length} document{documents.length !== 1 ? "s" : ""} au
            total
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                <div className="space-y-1.5">
                  <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                </div>
                <div className="ml-auto h-6 w-20 animate-pulse rounded-full bg-gray-200" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="px-6 py-12 text-center text-sm text-red-500">
            Erreur lors du chargement.
          </div>
        ) : documents.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FileArchive className="mx-auto mb-3 text-gray-300" size={40} />
            <p className="text-sm text-gray-400">Aucun document trouvé.</p>
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
                  Visibilité
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Statut
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <FileArchive size={15} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {doc.titre}
                        </p>
                        {doc.description && (
                          <p className="text-xs text-gray-400 truncate max-w-xs">
                            {doc.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                      {TYPE_LABELS[doc.typeDocument] ?? doc.typeDocument}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {VISIBILITE_LABELS[doc.visibilite] ?? doc.visibilite}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    v{doc.versionActuelle ?? 1}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge statut={doc.statut} />
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {doc.statut === "EN_VALIDATION" && (
                          <button
                            disabled={isPending}
                            onClick={() => valider(doc.id)}
                            className="rounded-lg border border-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-50 transition-colors"
                          >
                            Valider
                          </button>
                        )}
                        {["VALIDE", "BROUILLON"].includes(doc.statut) && (
                          <button
                            disabled={isPending}
                            onClick={() => archiver(doc.id)}
                            className="rounded-lg border border-blue-100 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors"
                          >
                            Archiver
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
