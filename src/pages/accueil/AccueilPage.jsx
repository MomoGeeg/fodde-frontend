import api from "@/api/axios";
import { R, aAcces } from "@/lib/navigation";
import useAuthStore from "@/stores/auth.store";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────────────────
// Page d'accueil commune : ce que j'ai à faire, où en sont mes demandes,
// les alertes, et au plus 4 chiffres clés. Remplace les tableaux de bord
// par rôle. Chaque bloc n'apparaît que pour les rôles concernés.
// ─────────────────────────────────────────────────────────────────────────────

/** GET qui renvoie une liste vide si le rôle n'a pas accès ou si l'appel échoue. */
const liste = (url) =>
  api
    .get(url)
    .then((r) => (Array.isArray(r.data) ? r.data : []))
    .catch(() => []);

const fcfa = (n) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Number(n) || 0) + " F CFA";

/** Construit la liste « À traiter » selon les rôles. */
async function chargerATraiter(roles, userId) {
  const taches = [];
  const ajouter = (libelle, nombre, lien) => {
    if (nombre > 0) taches.push({ libelle, nombre, lien });
  };

  const appels = [];

  if (aAcces(roles, [R.RAF])) {
    appels.push(
      Promise.all([liste("/api/depenses?statut=SOUMISE"), liste("/api/depenses?statut=VERIFIEE")]).then(
        ([soumises, verifiees]) =>
          ajouter("Dépenses à vérifier ou valider", soumises.length + verifiees.length, "/finances/depenses"),
      ),
      liste("/api/missions").then((m) =>
        ajouter(
          "Missions à valider",
          m.filter((x) => x.statut === "SOUMISE" || x.statut === "APPROUVEE_N1").length,
          "/missions",
        ),
      ),
      liste("/api/acquisitions").then((a) =>
        ajouter("Acquisitions à valider", a.filter((x) => x.statut === "EN_ATTENTE").length, "/acquisitions"),
      ),
      liste("/api/conges/en-attente").then((c) => ajouter("Congés à approuver", c.length, "/conges")),
    );
  }

  // Accord N+1 sur les missions (responsable des programmes, SE)
  if (aAcces(roles, [R.RP, R.SE])) {
    appels.push(
      liste("/api/missions").then((m) =>
        ajouter(
          "Missions à approuver (accord du responsable)",
          m.filter((x) => x.statut === "SOUMISE" && x.employeId !== userId).length,
          "/missions",
        ),
      ),
    );
  }

  if (aAcces(roles, [R.SE])) {
    appels.push(
      liste("/api/depenses?statut=EN_APPROBATION_SE").then((d) =>
        ajouter("Dépenses à approuver", d.length, "/finances/depenses"),
      ),
      liste("/api/projets").then((p) =>
        ajouter("Projets à valider", p.filter((x) => x.statut === "EN_VALIDATION").length, "/secretariat/validations"),
      ),
      liste("/api/allocations/en-validation").then((a) =>
        ajouter("Allocations budgétaires à valider", a.length, "/secretariat/validations"),
      ),
      liste("/api/documents/en-validation").then((d) =>
        ajouter("Documents à valider", d.length, "/documents/validation"),
      ),
    );
  }

  if (aAcces(roles, [R.COMPTABLE])) {
    appels.push(
      liste(`/api/depenses/mes-depenses?userId=${userId}`).then((d) => {
        ajouter("Dépenses rejetées à corriger", d.filter((x) => x.statut === "REJETEE").length, "/finances/depenses");
        ajouter("Brouillons à soumettre", d.filter((x) => x.statut === "BROUILLON").length, "/finances/depenses");
      }),
    );
  }

  await Promise.all(appels);
  return taches;
}

/** Suivi des demandes de l'utilisateur : missions, achats et, pour le comptable, dépenses. */
async function chargerMesDemandes(roles, userId) {
  const [missions, achats, depenses] = await Promise.all([
    liste("/api/missions/mes-missions"),
    liste("/api/acquisitions/mes-acquisitions"),
    aAcces(roles, [R.COMPTABLE]) ? liste(`/api/depenses/mes-depenses?userId=${userId}`) : Promise.resolve([]),
  ]);
  const compter = (l, statuts) => l.filter((x) => statuts.includes(x.statut)).length;
  return [
    { libelle: "Dépenses en cours de validation", nombre: compter(depenses, ["SOUMISE", "VERIFIEE", "EN_APPROBATION_SE"]), lien: "/finances/depenses?vue=toutes" },
    { libelle: "Dépenses rejetées", nombre: compter(depenses, ["REJETEE"]), lien: "/finances/depenses" },
    { libelle: "Missions en cours de validation", nombre: compter(missions, ["SOUMISE", "APPROUVEE_N1"]), lien: "/missions?vue=toutes" },
    { libelle: "Missions validées", nombre: compter(missions, ["VALIDEE_RAF"]), lien: "/missions?vue=toutes" },
    { libelle: "Achats en attente", nombre: compter(achats, ["EN_ATTENTE"]), lien: "/acquisitions?vue=toutes" },
    { libelle: "Achats validés", nombre: compter(achats, ["VALIDEE"]), lien: "/acquisitions?vue=toutes" },
  ].filter((r) => r.nombre > 0);
}

/** 4 chiffres clés pour la direction et le RAF. */
async function chargerChiffres(roles) {
  const [projets, stats, avances] = await Promise.all([
    liste("/api/projets"),
    api
      .get("/api/depenses/stats/mois-courant")
      .then((r) => r.data?.total ?? 0)
      .catch(() => null),
    aAcces(roles, [R.RAF, R.SE]) ? liste("/api/avances?justifiee=false") : Promise.resolve(null),
  ]);
  const actifs = projets.filter((p) => p.statut === "ACTIF");
  const chiffres = [
    { libelle: "Projets actifs", valeur: actifs.length },
    { libelle: "Budget des projets actifs", valeur: fcfa(actifs.reduce((s, p) => s + Number(p.budgetTotal ?? 0), 0)) },
  ];
  if (stats !== null) chiffres.push({ libelle: "Dépenses validées ce mois", valeur: fcfa(stats) });
  if (avances !== null) chiffres.push({ libelle: "Avances non justifiées", valeur: avances.length });
  return chiffres;
}

export default function AccueilPage() {
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];

  const voitAlertes = aAcces(roles, [R.SE, R.RAF, R.ADMIN]);
  const voitChiffres = aAcces(roles, [R.SE, R.RAF]);

  const aTraiter = useQuery({
    queryKey: ["accueil", "a-traiter", roles],
    queryFn: () => chargerATraiter(roles, user?.id),
    staleTime: 60_000,
  });
  const mesDemandes = useQuery({
    queryKey: ["accueil", "mes-demandes", user?.id],
    queryFn: () => chargerMesDemandes(roles, user?.id),
    staleTime: 60_000,
  });
  const alertes = useQuery({
    queryKey: ["accueil", "alertes"],
    queryFn: () => liste("/api/alertes").then((a) => a.filter((x) => !x.lue).slice(0, 5)),
    enabled: voitAlertes,
    staleTime: 60_000,
  });
  const chiffres = useQuery({
    queryKey: ["accueil", "chiffres", roles],
    queryFn: () => chargerChiffres(roles),
    enabled: voitChiffres,
    staleTime: 5 * 60_000,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <p className="text-sm text-gray-600">Bonjour {user?.prenom},</p>

      {voitChiffres && (
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {(chiffres.data ?? [{}, {}, {}, {}]).map((c, i) => (
            <div key={c.libelle ?? i} className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500">{c.libelle ?? " "}</p>
              <p className="mt-1 text-lg font-semibold text-gray-900 tabular-nums">
                {chiffres.isLoading ? "…" : c.valeur}
              </p>
            </div>
          ))}
        </section>
      )}

      <section className="rounded-lg border border-gray-200 bg-white">
        <h2 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">À traiter</h2>
        {aTraiter.isLoading ? (
          <p className="px-4 py-6 text-sm text-gray-500">Chargement…</p>
        ) : aTraiter.data?.length ? (
          <ul className="divide-y divide-gray-100">
            {aTraiter.data.map((t) => (
              <li key={t.libelle}>
                <Link to={t.lien} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50">
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-xs font-semibold text-white tabular-nums">
                    {t.nombre}
                  </span>
                  <span className="flex-1 text-gray-800">{t.libelle}</span>
                  <ChevronRight size={16} className="text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-6 text-sm text-gray-500">Rien à traiter pour le moment.</p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Mes demandes</h2>
            <span className="flex gap-3 text-xs font-medium">
              <Link to="/missions/nouvelle" className="text-primary hover:underline">
                Mission
              </Link>
              <Link to="/acquisitions/nouvelle" className="text-primary hover:underline">
                Achat
              </Link>
            </span>
          </div>
          {mesDemandes.data?.length ? (
            <ul className="divide-y divide-gray-100">
              {mesDemandes.data.map((m) => (
                <li key={m.libelle}>
                  <Link to={m.lien} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50">
                    <span className="text-gray-700">{m.libelle}</span>
                    <span className="font-semibold text-gray-900 tabular-nums">{m.nombre}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-sm text-gray-500">
              {mesDemandes.isLoading ? "Chargement…" : "Aucune demande en cours."}
            </p>
          )}
        </section>

        {voitAlertes && (
          <section className="rounded-lg border border-gray-200 bg-white">
            <h2 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">Alertes</h2>
            {alertes.data?.length ? (
              <ul className="divide-y divide-gray-100">
                {alertes.data.map((a) => {
                  const contenu = (
                    <>
                      <TriangleAlert
                        size={16}
                        className={`mt-0.5 shrink-0 ${a.niveau === "CRITIQUE" ? "text-danger" : "text-warning"}`}
                      />
                      <span className="min-w-0">
                        <span className="block text-gray-800">{a.titre}</span>
                        {a.description && <span className="block text-xs text-gray-500">{a.description}</span>}
                      </span>
                    </>
                  );
                  return (
                    <li key={a.id}>
                      {a.lien ? (
                        <Link to={a.lien} className="flex gap-3 px-4 py-3 text-sm hover:bg-gray-50">
                          {contenu}
                        </Link>
                      ) : (
                        <div className="flex gap-3 px-4 py-3 text-sm">{contenu}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-4 py-6 text-sm text-gray-500">
                {alertes.isLoading ? "Chargement…" : "Aucune alerte."}
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
