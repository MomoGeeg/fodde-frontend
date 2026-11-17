import { Link } from "react-router-dom";

/** Carte d'un chiffre clé de tableau de bord. */
export function Carte({ libelle, valeur, detail, chargement, lien, alerte = false }) {
  const contenu = (
    <>
      <p className="text-xs text-gray-500">{libelle}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${alerte && !chargement ? "text-red-600" : "text-gray-900"}`}>
        {chargement ? "…" : valeur}
      </p>
      {detail && !chargement && <p className="text-xs text-gray-500 tabular-nums">{detail}</p>}
    </>
  );
  const classe = "rounded-lg border border-gray-200 bg-white p-4";
  return lien ? (
    <Link to={lien} className={`${classe} block hover:border-primary/40`}>
      {contenu}
    </Link>
  ) : (
    <div className={classe}>{contenu}</div>
  );
}

/** Bloc titré de tableau de bord, avec un lien facultatif en haut à droite. */
export function Bloc({ titre, lien, libelleLien, children }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">{titre}</h2>
        {lien && (
          <Link to={lien} className="text-xs font-medium text-primary hover:underline">
            {libelleLien}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** Message d'un bloc vide ou en chargement. */
export function Vide({ children }) {
  return <p className="px-4 py-6 text-sm text-gray-500">{children}</p>;
}
