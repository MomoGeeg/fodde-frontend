import { SEUIL_ALERTE } from "@/api/budgets";

/**
 * Barre de progression.
 * - mode « consommation » (budget) : verte, orange au-delà du seuil, rouge au-delà de 100 %.
 * - mode « realisation » (indicateur) : orange sous 50 % de la cible, verte au-delà.
 */
export default function Jauge({ taux, mode = "consommation" }) {
  const couleur =
    mode === "realisation"
      ? taux < 0.5
        ? "bg-warning"
        : "bg-primary"
      : taux > 1
        ? "bg-danger"
        : taux >= SEUIL_ALERTE
          ? "bg-warning"
          : "bg-primary";
  const fort = mode === "realisation" ? taux >= 1 : taux >= SEUIL_ALERTE;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-full min-w-16 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full ${couleur}`} style={{ width: `${Math.min(taux, 1) * 100}%` }} />
      </div>
      <span className={`w-10 shrink-0 text-right text-xs tabular-nums ${fort ? "font-semibold text-gray-900" : "text-gray-600"}`}>
        {Math.round(taux * 100)} %
      </span>
    </div>
  );
}
