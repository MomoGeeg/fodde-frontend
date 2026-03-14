import { useFormulairesAssignes, useMesSoumissions } from "@/api/terrain.api";
import {
  AlertTriangle,
  CheckCircle,
  ClipboardList,
  Clock,
  Eye,
  PlayCircle,
  Search,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const STATUT_CONFIG = {
  PUBLIE:  { label: "Actif",   color: "bg-green-100 text-green-700",  dot: "bg-green-500" },
  CLOTURE: { label: "Clôturé", color: "bg-gray-100 text-gray-500",    dot: "bg-gray-400" },
};

const STATUT_SOUMISSION = {
  VALIDE:     { label: "Validée",     icon: CheckCircle,    color: "text-green-600" },
  EN_ATTENTE: { label: "En attente",  icon: Clock,          color: "text-yellow-600" },
  REJETE:     { label: "Rejetée",     icon: XCircle,        color: "text-red-600" },
};

export default function TerrainCollecte() {
  const navigate = useNavigate();
  const { data: formulaires = [], isLoading } = useFormulairesAssignes();
  const { data: soumissions = [] } = useMesSoumissions();
  const [search, setSearch] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("TOUS");
  const [onglet, setOnglet] = useState("formulaires");

  const today = new Date();

  const formulairesFiltres = formulaires.filter((f) => {
    const txt = search.toLowerCase();
    const matchSearch = !txt || f.titre.toLowerCase().includes(txt) || f.projetCode.toLowerCase().includes(txt);
    const matchStatut = filtreStatut === "TOUS" || f.statut === filtreStatut;
    return matchSearch && matchStatut;
  });

  const soumissionsFiltrees = soumissions.filter((s) => {
    const txt = search.toLowerCase();
    return !txt || s.formulaireTitre.toLowerCase().includes(txt) || s.localisation?.toLowerCase().includes(txt);
  });

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 h-9 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Rechercher un formulaire, projet…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {onglet === "formulaires" && (
          <select
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value)}
            className="h-9 text-sm border border-gray-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="TOUS">Tous les statuts</option>
            <option value="PUBLIE">Actifs</option>
            <option value="CLOTURE">Clôturés</option>
          </select>
        )}
      </div>

      {/* Onglets */}
      <div className="flex border-b border-gray-200">
        {[
          { key: "formulaires", label: "Formulaires assignés", count: formulaires.filter((f) => f.statut === "PUBLIE").length },
          { key: "soumissions", label: "Mes soumissions", count: soumissions.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setOnglet(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              onglet === t.key
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
              onglet === t.key ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Onglet Formulaires */}
      {onglet === "formulaires" && (
        <>
          {isLoading ? (
            <div className="text-center py-12 text-sm text-gray-400">Chargement…</div>
          ) : formulairesFiltres.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-400">Aucun formulaire trouvé</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formulairesFiltres.map((f) => {
                const meta = STATUT_CONFIG[f.statut] ?? STATUT_CONFIG.CLOTURE;
                const jours = f.dateEcheance
                  ? Math.ceil((new Date(f.dateEcheance) - today) / (1000 * 60 * 60 * 24))
                  : null;
                const nbSoum = soumissions.filter((s) => s.formulaireId === f.id).length;
                const isActif = f.statut === "PUBLIE";

                return (
                  <div
                    key={f.id}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm hover:border-primary/30 transition-colors"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 leading-tight">{f.titre}</h3>
                          <p className="text-xs text-gray-400 mt-1">{f.projetCode}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 flex items-center gap-1 ${meta.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 line-clamp-2 mb-4">{f.description}</p>

                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <ClipboardList size={13} className="text-gray-400" />
                          {f.nbChamps} champs
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle size={13} className="text-gray-400" />
                          {nbSoum} soumission(s)
                        </span>
                        {jours !== null && (
                          <span className={`flex items-center gap-1 ml-auto font-medium ${
                            jours <= 0 ? "text-red-600"
                            : jours <= 3 ? "text-orange-600"
                            : "text-gray-500"
                          }`}>
                            <Clock size={13} />
                            {jours <= 0 ? "Expiré" : `J-${jours}`}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {isActif && (
                          <button
                            onClick={() => navigate(`/se/collecte/${f.id}`)}
                            className="flex-1 flex items-center justify-center gap-2 h-8 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
                          >
                            <PlayCircle size={14} />
                            Remplir
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/se/collecte/${f.id}`)}
                          className={`flex items-center gap-2 h-8 px-3 rounded-lg border border-gray-200 text-gray-600 text-xs hover:bg-gray-50 transition-colors ${isActif ? "" : "flex-1 justify-center"}`}
                        >
                          <Eye size={13} />
                          {isActif ? "" : "Voir"}
                        </button>
                      </div>
                    </div>

                    {jours !== null && jours <= 3 && jours > 0 && (
                      <div className="px-5 py-2 bg-orange-50 border-t border-orange-100 rounded-b-xl flex items-center gap-2">
                        <AlertTriangle size={13} className="text-orange-500 shrink-0" />
                        <p className="text-xs text-orange-700">Échéance dans {jours} jour(s) !</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Onglet Soumissions */}
      {onglet === "soumissions" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {soumissionsFiltrees.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-400">Aucune soumission</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Formulaire</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Localisation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {soumissionsFiltrees.map((s) => {
                  const meta = STATUT_SOUMISSION[s.statut];
                  const Icon = meta?.icon ?? Clock;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 truncate max-w-48">{s.formulaireTitre}</p>
                        <p className="text-xs text-gray-400">{s.projetCode}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">
                        {s.localisation || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(s.dateCollecte).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 text-xs font-medium ${meta?.color ?? "text-gray-500"}`}>
                          <Icon size={13} />
                          {meta?.label ?? s.statut}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
