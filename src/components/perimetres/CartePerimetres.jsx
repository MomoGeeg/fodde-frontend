import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";

// Centre du Sénégal, utilisé tant qu'aucun périmètre n'est localisé.
const CENTRE_PAR_DEFAUT = [14.5, -14.45];
const COULEURS = ["#4A7C2F", "#2563EB", "#D97706", "#7C3AED", "#DC2626", "#0891B2", "#DB2777", "#65A30D"];

const hectares = (v) => `${new Intl.NumberFormat("fr-SN").format(v)} ha`;

/** Cadre la carte sur les périmètres affichés. */
function Cadrage({ points }) {
  const map = useMap();
  const cle = JSON.stringify(points);
  useEffect(() => {
    const liste = JSON.parse(cle);
    if (liste.length === 1) map.setView(liste[0], 12);
    else if (liste.length > 1) map.fitBounds(liste, { padding: [30, 30], maxZoom: 12 });
  }, [map, cle]);
  return null;
}

/** Carte des périmètres localisés, une couleur par projet. */
export default function CartePerimetres({ perimetres }) {
  const localises = perimetres.filter((p) => p.latitude != null && p.longitude != null);
  const projets = [...new Map(localises.map((p) => [p.projetId, p.projetCode])).entries()];
  const couleur = (projetId) => COULEURS[projets.findIndex(([id]) => id === projetId) % COULEURS.length];
  const points = localises.map((p) => [Number(p.latitude), Number(p.longitude)]);

  return (
    <div>
      <MapContainer center={CENTRE_PAR_DEFAUT} zoom={7} scrollWheelZoom={false} className="h-96 w-full rounded-b-lg z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Cadrage points={points} />
        {localises.map((p) => (
          <CircleMarker
            key={p.id}
            center={[Number(p.latitude), Number(p.longitude)]}
            radius={8}
            pathOptions={{ color: "#ffffff", weight: 2, fillColor: couleur(p.projetId), fillOpacity: 0.9 }}
          >
            <Popup>
              <div className="font-semibold">{p.nom}</div>
              <div>{[p.village, p.commune].filter(Boolean).join(", ")}</div>
              <div>{p.projetCode}</div>
              {p.superficieHa != null && <div>{hectares(p.superficieHa)}</div>}
              {p.cultures?.length > 0 && <div>{p.cultures.join(", ")}</div>}
              {p.technicienNom && <div>Technicien : {p.technicienNom}</div>}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      {projets.length > 0 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-3 text-xs text-gray-600">
          {projets.map(([id, code]) => (
            <li key={id} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: couleur(id) }} />
              {code}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
