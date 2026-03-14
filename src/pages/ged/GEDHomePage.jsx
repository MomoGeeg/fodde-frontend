import { gedApi } from "@/api/ged.api";
import useAuthStore from "@/stores/auth.store";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Building2,
  Clock,
  FileArchive,
  FolderKanban,
  HardDrive,
  Image,
  Landmark,
  Lock,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GEDDocumentForm from "./GEDDocumentForm";

const REPERTOIRE_CONFIG = {
  projets: { icon: FolderKanban, couleur: "blue", path: "/documents/projets" },
  rh: { icon: Users, couleur: "purple", path: "/documents/rh" },
  institutionnel: {
    icon: Landmark,
    couleur: "amber",
    path: "/documents/institutionnel",
  },
  bailleurs: {
    icon: Building2,
    couleur: "green",
    path: "/documents/bailleurs",
  },
  communication: {
    icon: Image,
    couleur: "pink",
    path: "/documents/communication",
  },
};

const COULEUR_CLASSES = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
    badge: "bg-blue-100 text-blue-700",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-100",
    badge: "bg-purple-100 text-purple-700",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-100",
    badge: "bg-amber-100 text-amber-700",
  },
  green: {
    bg: "bg-green-50",
    text: "text-green-600",
    border: "border-green-100",
    badge: "bg-green-100 text-green-700",
  },
  pink: {
    bg: "bg-pink-50",
    text: "text-pink-600",
    border: "border-pink-100",
    badge: "bg-pink-100 text-pink-700",
  },
};

const TYPE_LABELS = {
  RAPPORT: "Rapport",
  CONTRAT: "Contrat",
  JUSTIFICATIF: "Justificatif",
  PHOTO: "Photo",
  POLITIQUE: "Politique",
  PV: "PV",
  STATUTS: "Statuts",
  AUTRE: "Autre",
};

const STATUT_CLASSES = {
  BROUILLON: "bg-gray-100 text-gray-600",
  EN_VALIDATION: "bg-yellow-100 text-yellow-700",
  VALIDE: "bg-green-100 text-green-700",
  ARCHIVE: "bg-blue-100 text-blue-700",
};

function hasRepertoireAccess(repertoireId, roles) {
  const access = {
    projets: [
      "ROLE_ADMIN",
      "ROLE_SE",
      "ROLE_RAF",
      "ROLE_RESPONSABLE_PROGRAMMES",
      "ROLE_CHARGE_PROGRAMME",
    ],
    rh: ["ROLE_RH", "ROLE_SE", "ROLE_ADMIN"],
    institutionnel: ["ROLE_SE", "ROLE_ADMIN"],
    bailleurs: ["ROLE_RAF", "ROLE_SE", "ROLE_ADMIN"],
    communication: ["ROLE_SE", "ROLE_ADMIN"],
  };
  return roles?.some((r) => access[repertoireId]?.includes(r)) ?? false;
}

export default function GEDHomePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [openForm, setOpenForm] = useState(false);

  const { data: kpi, isLoading: kpiLoading } = useQuery({
    queryKey: ["ged", "kpi"],
    queryFn: gedApi.getKPI,
  });

  const { data: repertoires = [], isLoading: repLoading } = useQuery({
    queryKey: ["ged", "repertoires"],
    queryFn: gedApi.getRepertoires,
  });

  const { data: recentDocs = [], isLoading: recentLoading } = useQuery({
    queryKey: ["ged", "recent-documents"],
    queryFn: gedApi.getRecentDocuments,
  });

  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ["ged", "search", searchQuery],
    queryFn: () => gedApi.searchDocuments(searchQuery),
    enabled: searchQuery.trim().length >= 2,
  });

  const userRoles = user?.roles ?? [];

  function handleRepertoireClick(rep) {
    if (!hasRepertoireAccess(rep.id, userRoles)) return;
    navigate(REPERTOIRE_CONFIG[rep.id]?.path ?? "/documents");
  }

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion Documentaire
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Centralisez, versionnez et sécurisez tous les documents de
            l'organisation
          </p>
        </div>
        <button
          onClick={() => setOpenForm(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          <FileArchive size={16} />
          Déposer un document
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiLoading ? (
          [...Array(4)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 h-24"
            />
          ))
        ) : (
          <>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                  <FileArchive size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Documents actifs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {kpi?.totalActifs ?? "—"}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50">
                  <ShieldAlert size={20} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    En attente de validation
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {kpi?.enValidation ?? "—"}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                  <Clock size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Déposés ce mois</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {kpi?.depositsMois ?? "—"}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50">
                  <HardDrive size={20} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Stockage utilisé</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {kpi?.stockageUtilise ?? "—"}
                  </p>
                  <div className="mt-1 h-1.5 w-24 rounded-full bg-gray-100">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${kpi?.stockagePourcent ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un document par titre, type, projet, auteur..."
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <span className="text-xs">✕</span>
          </button>
        )}
      </div>

      {/* Résultats de recherche */}
      {searchQuery.trim().length >= 2 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-4 py-3 flex items-center gap-2">
            <BarChart3 size={15} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {searchLoading
                ? "Recherche..."
                : `${searchResults.length} résultat${searchResults.length !== 1 ? "s" : ""} pour "${searchQuery}"`}
            </span>
          </div>
          {searchLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded-lg bg-gray-100"
                />
              ))}
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">
              Aucun document trouvé
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Titre
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Type
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Projet
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Statut
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {searchResults.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileArchive
                          size={14}
                          className="text-gray-400 shrink-0"
                        />
                        <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {doc.titre}
                        </span>
                        {doc.version > 1 && (
                          <span className="text-[10px] font-bold bg-gray-100 text-gray-600 rounded px-1">
                            V{doc.version}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {TYPE_LABELS[doc.type] ?? doc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {doc.projetCode ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_CLASSES[doc.statut] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {doc.statut === "EN_VALIDATION"
                          ? "En validation"
                          : doc.statut === "VALIDE"
                            ? "Validé"
                            : doc.statut === "BROUILLON"
                              ? "Brouillon"
                              : "Archivé"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {fmtDate(doc.dateDepot)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Répertoires */}
      {!searchQuery && (
        <>
          <h2 className="text-base font-semibold text-gray-900">Répertoires</h2>
          {repLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-36 animate-pulse rounded-2xl bg-gray-100"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {repertoires.map((rep) => {
                const config = REPERTOIRE_CONFIG[rep.id];
                const couleur = COULEUR_CLASSES[config?.couleur ?? "blue"];
                const Icon = config?.icon ?? FileArchive;
                const accessible = hasRepertoireAccess(rep.id, userRoles);

                return (
                  <div
                    key={rep.id}
                    onClick={() => handleRepertoireClick(rep)}
                    className={`relative rounded-2xl border bg-white p-5 shadow-sm transition-all ${accessible ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 border-gray-200" : "cursor-not-allowed opacity-60 border-gray-200"}`}
                  >
                    {/* Cadenas */}
                    {!accessible && (
                      <div className="absolute top-3 right-3">
                        <Lock size={14} className="text-gray-400" />
                      </div>
                    )}

                    {/* Badge validation */}
                    {accessible && rep.nbEnValidation > 0 && (
                      <div className="absolute top-3 right-3">
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-500 px-1.5 text-[10px] font-bold text-white leading-none">
                          {rep.nbEnValidation}
                        </span>
                      </div>
                    )}

                    {/* Icône */}
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${couleur.bg} mb-4`}
                    >
                      <Icon size={24} className={couleur.text} />
                    </div>

                    {/* Contenu */}
                    <h3 className="text-sm font-semibold text-gray-900">
                      {rep.nom}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                      {rep.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${couleur.badge}`}
                      >
                        {rep.nbDocuments} document
                        {rep.nbDocuments !== 1 ? "s" : ""}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {fmtDate(rep.derniereMAJ)}
                      </span>
                    </div>

                    {!accessible && (
                      <p className="mt-2 text-xs text-gray-400">
                        Accès non autorisé
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Documents récents */}
      {!searchQuery && (
        <>
          <h2 className="text-base font-semibold text-gray-900">
            Documents récents
          </h2>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {recentLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded-lg bg-gray-100"
                  />
                ))}
              </div>
            ) : recentDocs.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">
                Aucun document pour le moment
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Titre
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Type
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Statut
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Visibilité
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentDocs.map((doc) => (
                    <tr
                      key={doc.id}
                      onClick={() => navigate(`/documents/${doc.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileArchive
                            size={14}
                            className="text-gray-400 shrink-0"
                          />
                          <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {doc.titre}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {TYPE_LABELS[doc.type] ?? doc.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_CLASSES[doc.statut] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {doc.statut === "EN_VALIDATION"
                            ? "En validation"
                            : doc.statut === "VALIDE"
                              ? "Validé"
                              : doc.statut === "BROUILLON"
                                ? "Brouillon"
                                : "Archivé"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {doc.visibilite ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {fmtDate(doc.dateDepot)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Modal formulaire */}
      <GEDDocumentForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        repertoire="projets"
      />
    </div>
  );
}
