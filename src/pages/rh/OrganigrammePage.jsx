import { POLES, useOrganigramme } from "@/api/rh-data";
import { R, aAcces } from "@/lib/navigation";
import useAuthStore from "@/stores/auth.store";
import { Link } from "react-router-dom";

const TONS = {
  DIRECTION: "bg-gray-900 text-white",
  RAF: "bg-amber-100 text-amber-800",
  PROGRAMMES: "bg-green-100 text-green-800",
  RED_CAP_COM: "bg-sky-100 text-sky-800",
};

/**
 * Organigramme construit à partir des fiches employés : chacun sous son supérieur direct.
 * Les RH le complètent en renseignant le pôle et le supérieur sur chaque fiche.
 */
export default function OrganigrammePage() {
  const { user } = useAuthStore();
  const peutModifier = aAcces(user?.roles ?? [], [R.RH, R.ADMIN]);
  const { data: personnes = [], isLoading, isError } = useOrganigramme();

  if (isLoading) return <p className="text-sm text-gray-500">Chargement…</p>;
  if (isError) return <p className="text-sm text-red-600">L'organigramme n'a pas pu être chargé.</p>;

  const ids = new Set(personnes.map((p) => p.id));
  const enfants = new Map();
  for (const p of personnes) {
    if (p.superieurId && ids.has(p.superieurId)) {
      if (!enfants.has(p.superieurId)) enfants.set(p.superieurId, []);
      enfants.get(p.superieurId).push(p);
    }
  }
  const racines = personnes.filter((p) => !p.superieurId || !ids.has(p.superieurId));
  // En haut : la direction, puis les autres personnes sans supérieur.
  racines.sort((a, b) => (a.pole === "DIRECTION" ? 0 : 1) - (b.pole === "DIRECTION" ? 0 : 1));

  const aCompleter = personnes.filter(
    (p) => !p.pole || ((!p.superieurId || !ids.has(p.superieurId)) && p.pole !== "DIRECTION"),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organigramme</h1>
        <p className="mt-1 text-sm text-gray-500">
          Chacun sous son supérieur direct, d'après les fiches employés. Les antennes viendront plus tard.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(POLES).map(([code, p]) => (
          <span key={code} className={`rounded-full px-2.5 py-1 text-xs font-medium ${TONS[code]}`} title={p.detail}>
            {p.label}
          </span>
        ))}
      </div>

      {personnes.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Aucune fiche employé pour l'instant.
        </p>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <ul className="space-y-2">
            {racines.map((p) => (
              <Noeud key={p.id} personne={p} enfants={enfants} vus={new Set()} peutModifier={peutModifier} />
            ))}
          </ul>
        </div>
      )}

      {aCompleter.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-sm font-semibold text-amber-900">À compléter ({aCompleter.length})</h2>
          <p className="mt-1 text-xs text-amber-800">
            Pôle ou supérieur direct non renseigné : leurs demandes ne sauront pas à qui aller en premier.
          </p>
          <ul className="mt-3 space-y-1 text-sm text-amber-900">
            {aCompleter.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-2">
                <span>
                  {p.prenom} {p.nom} — {p.poste}
                </span>
                <span className="text-xs text-amber-700">{manque(p, ids)}</span>
                {peutModifier && (
                  <Link to={`/rh/employes/${p.id}/edit`} className="text-xs font-medium text-green-700 hover:underline">
                    Compléter
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** « pôle manquant », « supérieur manquant » ou « pôle et supérieur manquants ». */
function manque(p, ids) {
  const sansPole = !p.pole;
  const sansSuperieur = (!p.superieurId || !ids.has(p.superieurId)) && p.pole !== "DIRECTION";
  if (sansPole && sansSuperieur) return "pôle et supérieur manquants";
  return sansPole ? "pôle manquant" : "supérieur manquant";
}

function Noeud({ personne: p, enfants, vus, peutModifier }) {
  if (vus.has(p.id)) return null; // sécurité : une hiérarchie qui tournerait en rond
  const suite = new Set(vus).add(p.id);
  const sous = enfants.get(p.id) ?? [];
  return (
    <li>
      <div className="flex flex-wrap items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50">
        <span className="text-sm font-medium text-gray-900">
          {p.prenom} {p.nom}
        </span>
        <span className="text-sm text-gray-500">{p.poste}</span>
        {p.pole && (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TONS[p.pole]}`}>
            {POLES[p.pole]?.label}
          </span>
        )}
        {!p.aUnCompte && <span className="text-[11px] text-gray-400">sans compte</span>}
        {peutModifier && (
          <Link to={`/rh/employes/${p.id}`} className="ml-auto text-xs text-gray-400 hover:text-green-700">
            Fiche
          </Link>
        )}
      </div>
      {sous.length > 0 && (
        <ul className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-4">
          {sous.map((e) => (
            <Noeud key={e.id} personne={e} enfants={enfants} vus={suite} peutModifier={peutModifier} />
          ))}
        </ul>
      )}
    </li>
  );
}
