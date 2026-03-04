import { AlertTriangle, RefreshCw, ShieldX, WifiOff } from "lucide-react";

/**
 * Message d'erreur réutilisable avec bouton « Réessayer ».
 *
 * @param {string}   message  – texte affiché
 * @param {"error"|"empty"|"forbidden"|"offline"} type – variante visuelle
 * @param {Function} onRetry  – callback du bouton Réessayer (optionnel)
 */
export default function ErrorMessage({
  message = "Une erreur est survenue",
  type = "error",
  onRetry,
}) {
  const config = {
    error: {
      icon: AlertTriangle,
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
      iconColor: "text-red-400",
    },
    empty: {
      icon: AlertTriangle,
      bg: "bg-gray-50",
      border: "border-gray-200",
      text: "text-gray-500",
      iconColor: "text-gray-300",
    },
    forbidden: {
      icon: ShieldX,
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-700",
      iconColor: "text-orange-400",
    },
    offline: {
      icon: WifiOff,
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      iconColor: "text-blue-400",
    },
  };

  const c = config[type] || config.error;
  const Icon = c.icon;

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border ${c.border} ${c.bg} px-6 py-12 text-center shadow-sm`}
    >
      <Icon className={`mb-3 ${c.iconColor}`} size={40} />
      <p className={`text-sm font-medium ${c.text}`}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={13} />
          Réessayer
        </button>
      )}
    </div>
  );
}
