import { gedApi } from "@/api/ged.api";
import { useQuery } from "@tanstack/react-query";
import { FolderOpen, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

const STATUT_PROJET = {
  ACTIF: { label: "Actif", classes: "bg-green-100 text-green-700" },
  SUSPENDU: { label: "Suspendu", classes: "bg-yellow-100 text-yellow-700" },
  EN_CLOTURE: { label: "En clôture", classes: "bg-orange-100 text-orange-700" },
  CLOTURE: { label: "Clôturé", classes: "bg-red-100 text-red-600" },
  ARCHIVE: { label: "Archivé", classes: "bg-gray-100 text-gray-600" },
};

export default function GEDProjetsPage() {
  const navigate = useNavigate();

  const { data: projets = [], isLoading } = useQuery({
    queryKey: ["ged", "projets"],
    queryFn: gedApi.getProjets,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dossiers Projets</h1>
        <p className="mt-1 text-sm text-gray-500">
          Contrats, rapports, justificatifs et documents terrain de chaque projet
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : projets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16">
          <FolderOpen size={40} className="text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">Aucun projet trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projets.map((projet) => {
            const statutConfig = STATUT_PROJET[projet.statut] ?? { label: projet.statut, classes: "bg-gray-100 text-gray-600" };
            const estCloture = ["CLOTURE", "ARCHIVE"].includes(projet.statut);

            return (
              <div
                key={projet.id}
                onClick={() => navigate(`/documents/projets/${projet.id}`)}
                className="relative cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                {/* Badge validation */}
                {projet.nbEnValidation > 0 && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-yellow-100 border border-yellow-200 px-2 py-0.5">
                    <ShieldAlert size={11} className="text-yellow-600" />
                    <span className="text-[10px] font-bold text-yellow-700">{projet.nbEnValidation} en attente</span>
                  </div>
                )}

                {/* Icône */}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 mb-4">
                  <FolderOpen size={24} className="text-blue-600" />
                </div>

                {/* Titre + code */}
                <div className="flex items-start gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 flex-1 min-w-0 truncate">{projet.titre}</h3>
                </div>
                <p className="text-xs text-gray-500 mb-2">{projet.code}</p>

                {/* Bailleur */}
                <p className="text-xs text-gray-400 mb-4 truncate">{projet.bailleur}</p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {projet.nbDocs} document{projet.nbDocs !== 1 ? "s" : ""}
                  </span>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statutConfig.classes}`}>
                    {statutConfig.label}
                  </span>
                </div>

                {/* Badge projet clôturé */}
                {estCloture && (
                  <div className="mt-3 rounded-lg bg-red-50 border border-red-100 px-2.5 py-1.5">
                    <p className="text-[10px] font-medium text-red-600">Projet clôturé — Lecture seule</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
