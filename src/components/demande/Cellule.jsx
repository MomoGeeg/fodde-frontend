/** Texte principal + ligne secondaire grise, pour les cellules des listes de demandes. */
export default function Cellule({ principal, secondaire }) {
  return (
    <>
      <span className="text-gray-900">{principal}</span>
      {secondaire && <span className="block text-xs text-gray-500">{secondaire}</span>}
    </>
  );
}
