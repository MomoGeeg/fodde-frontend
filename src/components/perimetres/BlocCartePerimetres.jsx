import { perimetresApi } from "@/api/perimetres";
import { Bloc, Vide } from "@/components/tableau/Blocs";
import { useQuery } from "@tanstack/react-query";
import { Suspense, lazy } from "react";

// La bibliothèque de carte n'est chargée que sur les accueils qui l'affichent.
const CartePerimetres = lazy(() => import("./CartePerimetres"));

const hectares = (v) => `${new Intl.NumberFormat("fr-SN", { maximumFractionDigits: 2 }).format(v)} ha`;

/** Accueil du RP et du SE : carte des périmètres maraîchers de tous les projets. */
export default function BlocCartePerimetres() {
  const { data: perimetres = [], isLoading } = useQuery({
    queryKey: ["perimetres", "carte"],
    queryFn: perimetresApi.carte,
    staleTime: 5 * 60_000,
  });
  const localises = perimetres.filter((p) => p.latitude != null && p.longitude != null).length;
  const superficie = perimetres.reduce((s, p) => s + (Number(p.superficieHa) || 0), 0);
  const titre = perimetres.length
    ? `Carte des périmètres (${localises} localisés sur ${perimetres.length}, ${hectares(superficie)})`
    : "Carte des périmètres";

  return (
    <Bloc titre={titre}>
      {isLoading ? (
        <Vide>Chargement…</Vide>
      ) : (
        <Suspense fallback={<Vide>Chargement de la carte…</Vide>}>
          <CartePerimetres perimetres={perimetres} />
        </Suspense>
      )}
    </Bloc>
  );
}
