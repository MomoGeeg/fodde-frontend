const TONS = {
  neutre: "bg-gray-100 text-gray-700",
  info: "bg-blue-50 text-blue-700",
  attention: "bg-amber-50 text-amber-800",
  succes: "bg-green-50 text-green-700",
  danger: "bg-red-50 text-red-700",
};

/**
 * Badge de statut commun à toutes les demandes.
 * @param {string} statut  code du statut (ex. "SOUMISE")
 * @param {object} statuts table { CODE: { label, ton } }
 */
export default function StatutBadge({ statut, statuts }) {
  const s = statuts[statut] ?? { label: statut, ton: "neutre" };
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${TONS[s.ton]}`}>
      {s.label}
    </span>
  );
}
