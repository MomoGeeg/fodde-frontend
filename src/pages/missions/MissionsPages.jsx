import { useProjets } from "@/api/depenses";
import {
  CATEGORIES_FRAIS,
  ORDRE_DISPONIBLE,
  STATUTS_MISSION,
  actionsMission,
  creerMission,
  estATraiter,
  etapesMission,
  messageOrdreMission,
  numeroWhatsApp,
  organiserMission,
  preparerMission,
  useDisponibilites,
  useMissions,
} from "@/api/missions";
import Cellule from "@/components/demande/Cellule";
import FicheDemande from "@/components/demande/FicheDemande";
import { CHAMP, CadreFormulaire, Ligne } from "@/components/demande/Formulaire";
import ListeDemandes from "@/components/demande/ListeDemandes";
import { messageErreur } from "@/lib/erreurs";
import { dateCourte, montant } from "@/lib/format";
import { R, aAcces } from "@/lib/navigation";
import useAuthStore from "@/stores/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle, Plus, Printer, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const periode = (m) => `${dateCourte(m.dateDebut)} → ${dateCourte(m.dateFin)}`;
const jours = (n) => `${n} jour${n > 1 ? "s" : ""}`;

const COLONNES = [
  { titre: "Mission", rendu: (m) => <Cellule principal={m.destination} secondaire={periode(m)} /> },
  { titre: "Objet", rendu: (m) => <Cellule principal={m.motif} secondaire={m.demandeurNom} /> },
  { titre: "Équipe", rendu: (m) => (m.participants?.length ? `${m.participants.length} pers.` : "—") },
  { titre: "Budget", droite: true, rendu: (m) => (Number(m.budgetEstime) > 0 ? montant(m.budgetEstime) : "—") },
];

export function MissionsPage() {
  const { user } = useAuthStore();
  const { data, isLoading, isError } = useMissions();
  const aTraiter = useCallback((m) => estATraiter(m, user?.roles ?? [], user?.id), [user]);
  return (
    <ListeDemandes
      demandes={data}
      isLoading={isLoading}
      isError={isError}
      aTraiter={aTraiter}
      statuts={STATUTS_MISSION}
      colonnes={COLONNES}
      texteRecherche={(m) => [m.destination, m.motif, m.demandeurNom, m.projetCode, ...(m.participants ?? []).map((p) => p.nom)]}
      lien={(m) => `/missions/${m.id}`}
      placeholder="Destination, objet, personne, projet…"
      nouveau={{ label: "Nouvel ordre de mission", to: "/missions/nouvelle" }}
    />
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Fiche
// ═════════════════════════════════════════════════════════════════════════════

export function MissionFichePage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const { data = [], isLoading } = useMissions();
  const m = data.find((x) => x.id === id);

  return (
    <FicheDemande
      retour={{ to: "/missions", label: "Missions" }}
      isLoading={isLoading}
      introuvable={!m}
      {...(m && {
        historique: `/api/missions/${m.id}/historique`,
        reference: `Demandée par ${m.demandeurNom ?? "—"}${m.projetCode ? ` · ${m.projetCode}` : ""}`,
        titre: `${m.destination} — ${m.motif}`,
        montant: Number(m.budgetEstime) > 0 ? montant(m.budgetEstime) : null,
        statut: m.statut,
        statuts: STATUTS_MISSION,
        etapes: etapesMission(m),
        arret:
          m.statut === "REJETEE"
            ? { titre: "Mission rejetée", motif: m.motifRejet }
            : m.statut === "ANNULEE"
              ? { titre: "Mission annulée", motif: m.motifRejet }
              : null,
        actions: actionsMission(m, roles, user?.id),
        champs: [
          { libelle: "Destination", valeur: m.destination },
          { libelle: "Période", valeur: `${periode(m)} (${jours(m.nbJours)})` },
          { libelle: "Projet", valeur: m.projetCode },
          { libelle: "Demandée par", valeur: m.demandeurNom },
          { libelle: "Demandée le", valeur: dateCourte(m.createdAt) },
          { libelle: "Accord du supérieur", valeur: m.n1Nom ?? "Sans objet" },
          { libelle: "Objet de la mission", valeur: m.motif },
        ],
      })}
    >
      {m && (
        <>
          <BlocEquipe m={m} />
          {m.statut === "APPROUVEE_N1" && aAcces(roles, [R.LOG, R.ADMIN]) && <FormOrganisation m={m} />}
          {m.statut === "ORGANISEE" && aAcces(roles, [R.RAF, R.ADMIN]) ? (
            <FormPreparation key={m.id + m.budgetEstime} m={m} />
          ) : (
            m.frais?.length > 0 && <BlocBudget m={m} />
          )}
          {ORDRE_DISPONIBLE.includes(m.statut) && <BlocDiffusion m={m} />}
        </>
      )}
    </FicheDemande>
  );
}

function Bloc({ titre, children, action }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">{titre}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function BlocEquipe({ m }) {
  return (
    <Bloc titre="Équipe et logistique">
      {m.participants?.length ? (
        <ul className="divide-y divide-gray-100 text-sm">
          {m.participants.map((p) => (
            <li key={p.employeId} className="flex flex-wrap items-center gap-2 py-1.5">
              <span className="font-medium text-gray-900">{p.nom}</span>
              <span className="text-gray-500">{p.poste}</span>
              {p.chef && <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">Chef de mission</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">Équipe à compléter par le RAF.</p>
      )}
      <dl className="mt-4 grid gap-4 border-t border-gray-100 pt-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-gray-500">Véhicule</dt>
          <dd className="mt-0.5 text-gray-900">
            {m.vehiculeLibelle ?? (m.besoinVehicule ? "Demandé, à affecter par la logistique" : "Pas de véhicule")}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Chauffeur</dt>
          <dd className="mt-0.5 text-gray-900">{m.chauffeurNom ?? "—"}</dd>
        </div>
        {m.besoinsMateriel && (
          <div>
            <dt className="text-xs text-gray-500">Matériel demandé</dt>
            <dd className="mt-0.5 whitespace-pre-line text-gray-900">{m.besoinsMateriel}</dd>
          </div>
        )}
        {m.notesLogistique && (
          <div>
            <dt className="text-xs text-gray-500">Remis par la logistique</dt>
            <dd className="mt-0.5 whitespace-pre-line text-gray-900">{m.notesLogistique}</dd>
          </div>
        )}
      </dl>
    </Bloc>
  );
}

function TableauFrais({ frais }) {
  const total = frais.reduce((s, f) => s + Number(f.montant ?? 0), 0);
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-gray-500">
          <th className="pb-2 font-medium">Frais</th>
          <th className="pb-2 text-right font-medium">Quantité</th>
          <th className="pb-2 text-right font-medium">Prix unitaire</th>
          <th className="pb-2 text-right font-medium">Montant</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {frais.map((f, i) => (
          <tr key={i}>
            <td className="py-1.5">
              {CATEGORIES_FRAIS[f.categorie]}
              {f.libelle ? <span className="text-gray-500"> — {f.libelle}</span> : null}
            </td>
            <td className="py-1.5 text-right tabular-nums">{Number(f.quantite)}</td>
            <td className="py-1.5 text-right tabular-nums">{montant(f.prixUnitaire)}</td>
            <td className="py-1.5 text-right tabular-nums">{montant(f.montant)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="font-semibold">
          <td className="pt-2" colSpan={3}>
            Total
          </td>
          <td className="pt-2 text-right tabular-nums">{montant(total)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

function BlocBudget({ m }) {
  return (
    <Bloc titre="Budget de la mission">
      <TableauFrais frais={m.frais} />
    </Bloc>
  );
}

// ── Logistique : véhicule et chauffeur libres ─────────────────────────────────

function FormOrganisation({ m }) {
  const queryClient = useQueryClient();
  const { data: libres, isLoading } = useDisponibilites(m.dateDebut, m.dateFin, m.id);
  const [vehiculeId, setVehiculeId] = useState("");
  const [chauffeurId, setChauffeurId] = useState("");
  const [notes, setNotes] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const enregistrer = async () => {
    if (m.besoinVehicule && (!vehiculeId || !chauffeurId)) {
      toast.error("Choisissez le véhicule et le chauffeur.");
      return;
    }
    setEnvoi(true);
    try {
      await organiserMission(m.id, { vehiculeId: vehiculeId || null, chauffeurId: chauffeurId || null, notesLogistique: notes });
      await queryClient.invalidateQueries({ queryKey: ["missions"] });
      toast.success("Mission organisée : elle passe au RAF");
    } catch (err) {
      toast.error(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Bloc titre="Organisation (logistique)">
      <p className="mb-4 text-sm text-gray-600">
        Seuls les véhicules et les chauffeurs libres du {dateCourte(m.dateDebut)} au {dateCourte(m.dateFin)} sont proposés.
      </p>
      {isLoading ? (
        <p className="text-sm text-gray-500">Recherche des disponibilités…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Ligne libelle={m.besoinVehicule ? "Véhicule" : "Véhicule (facultatif)"}>
            <select value={vehiculeId} onChange={(e) => setVehiculeId(e.target.value)} className={CHAMP}>
              <option value="">{libres?.vehicules?.length ? "Choisir…" : "Aucun véhicule libre"}</option>
              {libres?.vehicules?.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.libelle}
                </option>
              ))}
            </select>
          </Ligne>
          <Ligne
            libelle={m.besoinVehicule ? "Chauffeur" : "Chauffeur (facultatif)"}
            aide="Fiches RH dont le poste contient « chauffeur »."
          >
            <select value={chauffeurId} onChange={(e) => setChauffeurId(e.target.value)} className={CHAMP}>
              <option value="">{libres?.chauffeurs?.length ? "Choisir…" : "Aucun chauffeur libre"}</option>
              {libres?.chauffeurs?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </Ligne>
          <div className="sm:col-span-2">
            <Ligne libelle="Matériel remis" aide={m.besoinsMateriel ? `Demandé : ${m.besoinsMateriel}` : undefined}>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={CHAMP} />
            </Ligne>
          </div>
        </div>
      )}
      <div className="mt-4 flex justify-end">
        <button
          onClick={enregistrer}
          disabled={envoi || isLoading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {envoi ? "Enregistrement…" : "Transmettre au RAF"}
        </button>
      </div>
    </Bloc>
  );
}

// ── RAF : équipe définitive et budget ─────────────────────────────────────────

const ligneVide = (categorie = "PER_DIEM", quantite = "") => ({ categorie, libelle: "", quantite, prixUnitaire: "" });

function FormPreparation({ m }) {
  const queryClient = useQueryClient();
  const { data: libres } = useDisponibilites(m.dateDebut, m.dateFin, m.id);
  const [equipe, setEquipe] = useState(() => (m.participants ?? []).map((p) => p.employeId));
  const [chef, setChef] = useState(() => m.participants?.find((p) => p.chef)?.employeId ?? "");
  const [lignes, setLignes] = useState(() =>
    m.frais?.length
      ? m.frais.map((f) => ({ ...f, quantite: String(f.quantite), prixUnitaire: String(f.prixUnitaire) }))
      : [ligneVide("PER_DIEM", String(Math.max(1, m.participants?.length ?? 1) * m.nbJours))],
  );
  const [soumettreSe, setSoumettreSe] = useState(m.soumettreSe);
  const [envoi, setEnvoi] = useState(false);

  // Personnes proposées : les agents libres et l'équipe actuelle.
  const personnes = [...(m.participants ?? []).map((p) => ({ id: p.employeId, nom: p.nom, poste: p.poste }))];
  for (const a of libres?.agents ?? []) if (!personnes.some((p) => p.id === a.id)) personnes.push(a);

  const total = lignes.reduce((s, l) => s + (Number(l.quantite) || 0) * (Number(l.prixUnitaire) || 0), 0);
  const versSe = soumettreSe || total >= Number(m.seuilSe ?? 500000);

  const majLigne = (i, cle) => (e) => setLignes((ls) => ls.map((l, j) => (j === i ? { ...l, [cle]: e.target.value } : l)));

  const enregistrer = async () => {
    if (equipe.length === 0) {
      toast.error("Ajoutez au moins une personne à l'équipe.");
      return;
    }
    const frais = lignes.filter((l) => l.quantite !== "" || l.prixUnitaire !== "");
    if (frais.some((l) => !(Number(l.quantite) > 0) || l.prixUnitaire === "" || Number(l.prixUnitaire) < 0)) {
      toast.error("Chaque ligne du budget demande une quantité et un prix.");
      return;
    }
    setEnvoi(true);
    try {
      await preparerMission(m.id, {
        participantIds: equipe,
        chefMissionId: equipe.includes(chef) ? chef : equipe[0],
        frais: frais.map((l) => ({
          categorie: l.categorie,
          libelle: l.libelle?.trim() || null,
          quantite: Number(l.quantite),
          prixUnitaire: Number(l.prixUnitaire),
        })),
        soumettreSe,
      });
      await queryClient.invalidateQueries({ queryKey: ["missions"] });
      toast.success("Équipe et budget enregistrés. Vous pouvez valider la mission.");
    } catch (err) {
      toast.error(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Bloc titre="Équipe et budget (RAF)">
      <p className="mb-3 text-sm text-gray-600">
        Seules les personnes libres sur ces dates sont proposées. Enregistrez, puis validez la mission en haut de la fiche.
      </p>
      <ChoixEquipe personnes={personnes} equipe={equipe} setEquipe={setEquipe} chef={chef} setChef={setChef} />

      <h4 className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Budget</h4>
      <div className="space-y-2">
        {lignes.map((l, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[9rem_1fr_6rem_8rem_auto]">
            <select value={l.categorie} onChange={majLigne(i, "categorie")} className={CHAMP} aria-label="Catégorie">
              {Object.entries(CATEGORIES_FRAIS).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
            <input value={l.libelle ?? ""} onChange={majLigne(i, "libelle")} placeholder="Précision" className={CHAMP} />
            <input type="number" min="0" step="any" value={l.quantite} onChange={majLigne(i, "quantite")} placeholder="Qté" aria-label="Quantité" className={CHAMP} />
            <input type="number" min="0" value={l.prixUnitaire} onChange={majLigne(i, "prixUnitaire")} placeholder="Prix unitaire" aria-label="Prix unitaire" className={CHAMP} />
            <button
              type="button"
              onClick={() => setLignes((ls) => ls.filter((_, j) => j !== i))}
              className="justify-self-start rounded-md p-2 text-gray-400 hover:bg-gray-50 hover:text-danger"
              aria-label="Retirer la ligne"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setLignes((ls) => [...ls, ligneVide("CARBURANT")])}
        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        <Plus size={15} /> Ajouter une ligne
      </button>
      <p className="mt-1 text-xs text-gray-500">Per diem : quantité = personnes × jours ({jours(m.nbJours)}).</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">Total : {montant(total)}</p>
          <label className="mt-1 flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={soumettreSe} onChange={(e) => setSoumettreSe(e.target.checked)} />
            Soumettre au Secrétaire exécutif
          </label>
          <p className="mt-1 text-xs text-gray-500">
            {versSe
              ? "Après votre validation, la mission ira au SE."
              : `Le SE valide à partir de ${montant(m.seuilSe ?? 500000)}, ou si vous cochez la case.`}
          </p>
        </div>
        <button
          onClick={enregistrer}
          disabled={envoi}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {envoi ? "Enregistrement…" : "Enregistrer l'équipe et le budget"}
        </button>
      </div>
    </Bloc>
  );
}

/** Cases à cocher pour l'équipe, et choix du chef de mission parmi elle. */
function ChoixEquipe({ personnes, equipe, setEquipe, chef, setChef }) {
  const basculer = (id) => setEquipe((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));
  if (personnes.length === 0) return <p className="text-sm text-gray-500">Personne n'est libre sur ces dates.</p>;
  return (
    <ul className="max-h-64 divide-y divide-gray-100 overflow-y-auto rounded-md border border-gray-200">
      {personnes.map((p) => {
        const dedans = equipe.includes(p.id);
        return (
          <li key={p.id} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
            <label className="flex flex-1 items-center gap-2">
              <input type="checkbox" checked={dedans} onChange={() => basculer(p.id)} />
              <span className="font-medium text-gray-900">{p.nom}</span>
              <span className="text-gray-500">{p.poste}</span>
            </label>
            {dedans && (
              <label className="flex items-center gap-1 text-xs text-gray-600">
                <input type="radio" name="chef" checked={chef === p.id || (!equipe.includes(chef) && equipe[0] === p.id)} onChange={() => setChef(p.id)} />
                Chef de mission
              </label>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ── Diffusion de l'ordre de mission ───────────────────────────────────────────

function BlocDiffusion({ m }) {
  const destinataires = [
    ...(m.participants ?? []).map((p) => ({ nom: p.nom, telephone: p.telephone, role: p.chef ? "Chef de mission" : p.poste })),
    ...(m.chauffeurNom ? [{ nom: m.chauffeurNom, telephone: m.chauffeurTelephone, role: "Chauffeur" }] : []),
  ];
  return (
    <Bloc
      titre="Ordre de mission"
      action={
        <Link
          to={`/missions/${m.id}/ordre`}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          <Printer size={15} /> Ordre de mission (PDF)
        </Link>
      }
    >
      <p className="mb-3 text-sm text-gray-600">
        Envoyez l'ordre de mission à chaque personne : WhatsApp s'ouvre avec le message déjà rédigé.
      </p>
      <ul className="divide-y divide-gray-100 text-sm">
        {destinataires.map((d) => {
          const numero = numeroWhatsApp(d.telephone);
          return (
            <li key={d.nom + d.role} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                <span className="font-medium text-gray-900">{d.nom}</span>
                <span className="text-gray-500"> — {d.role}</span>
              </span>
              {numero ? (
                <a
                  href={`https://wa.me/${numero}?text=${encodeURIComponent(messageOrdreMission(m, d.nom))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                >
                  <MessageCircle size={14} /> Envoyer par WhatsApp
                </a>
              ) : (
                <span className="text-xs text-gray-400">Pas de téléphone sur sa fiche RH</span>
              )}
            </li>
          );
        })}
      </ul>
    </Bloc>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Ordre de mission imprimable
// ═════════════════════════════════════════════════════════════════════════════

export function OrdreMissionPage() {
  const { id } = useParams();
  const { data = [], isLoading } = useMissions();
  const m = data.find((x) => x.id === id);

  if (isLoading) return <p className="text-sm text-gray-500">Chargement…</p>;
  if (!m || !ORDRE_DISPONIBLE.includes(m.statut))
    return <p className="text-sm text-gray-600">L'ordre de mission est disponible une fois la mission validée.</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link to={`/missions/${m.id}`} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft size={16} /> Retour à la mission
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark"
        >
          <Printer size={15} /> Imprimer ou enregistrer en PDF
        </button>
      </div>

      <article className="rounded-lg border border-gray-200 bg-white p-8 text-sm text-gray-900 print:border-0 print:p-0">
        <header className="border-b border-gray-300 pb-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">ONG FODDE — Kolda</p>
          <h1 className="mt-1 text-xl font-bold">Ordre de mission</h1>
          <p className="mt-1 text-xs text-gray-500">Établi le {dateCourte(new Date())}</p>
        </header>

        <dl className="mt-5 grid grid-cols-[10rem_1fr] gap-y-2">
          <dt className="text-gray-500">Destination</dt>
          <dd className="font-medium">{m.destination}</dd>
          <dt className="text-gray-500">Période</dt>
          <dd>
            Du {dateCourte(m.dateDebut)} au {dateCourte(m.dateFin)} ({jours(m.nbJours)})
          </dd>
          <dt className="text-gray-500">Objet</dt>
          <dd className="whitespace-pre-line">{m.motif}</dd>
          <dt className="text-gray-500">Projet</dt>
          <dd>{m.projetCode ?? "—"}</dd>
          <dt className="text-gray-500">Véhicule</dt>
          <dd>{m.vehiculeLibelle ?? "—"}</dd>
          <dt className="text-gray-500">Chauffeur</dt>
          <dd>{m.chauffeurNom ?? "—"}</dd>
        </dl>

        <h2 className="mt-6 text-sm font-semibold">Équipe</h2>
        <table className="mt-2 w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-300 text-left text-xs text-gray-500">
              <th className="py-1.5 font-medium">Nom</th>
              <th className="py-1.5 font-medium">Fonction</th>
              <th className="py-1.5 font-medium">Rôle</th>
            </tr>
          </thead>
          <tbody>
            {(m.participants ?? []).map((p) => (
              <tr key={p.employeId} className="border-b border-gray-100">
                <td className="py-1.5">{p.nom}</td>
                <td className="py-1.5">{p.poste}</td>
                <td className="py-1.5">{p.chef ? "Chef de mission" : "Membre"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {m.frais?.length > 0 && (
          <>
            <h2 className="mt-6 text-sm font-semibold">Budget</h2>
            <div className="mt-2">
              <TableauFrais frais={m.frais} />
            </div>
          </>
        )}

        <div className="mt-12 grid grid-cols-2 gap-8 text-center text-xs text-gray-600">
          <div>
            <p>Le Responsable administratif et financier</p>
            <div className="mt-14 border-t border-gray-300" />
          </div>
          <div>
            <p>{m.validationSeRequise ? "Le Secrétaire exécutif" : "Le chef de mission"}</p>
            <div className="mt-14 border-t border-gray-300" />
          </div>
        </div>
      </article>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Nouvel ordre de mission
// ═════════════════════════════════════════════════════════════════════════════

const aujourdhui = () => new Date().toISOString().slice(0, 10);

export function MissionFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: projets = [] } = useProjets();
  const [f, setF] = useState({ projetId: "", destination: "", dateDebut: "", dateFin: "", motif: "", besoinsMateriel: "" });
  const [besoinVehicule, setBesoinVehicule] = useState(false);
  const [equipe, setEquipe] = useState([]);
  const [chef, setChef] = useState("");
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);
  const { data: libres, isFetching } = useDisponibilites(f.dateDebut, f.dateFin);
  const agents = libres?.agents ?? [];

  const maj = (cle) => (e) => {
    setF((p) => ({ ...p, [cle]: e.target.value }));
    setErreurs((p) => ({ ...p, [cle]: undefined }));
    if (cle === "dateDebut" || cle === "dateFin") setEquipe([]); // les disponibilités changent
  };

  const soumettre = async () => {
    const e = {};
    if (!f.projetId) e.projetId = "Choisissez le projet qui finance la mission.";
    if (!f.destination.trim()) e.destination = "Indiquez la destination.";
    if (!f.dateDebut) e.dateDebut = "Indiquez la date de départ.";
    if (!f.dateFin) e.dateFin = "Indiquez la date de retour.";
    else if (f.dateDebut && f.dateFin < f.dateDebut) e.dateFin = "Le retour doit suivre le départ.";
    if (!f.motif.trim()) e.motif = "Indiquez l'objet de la mission.";
    if (equipe.length === 0) e.equipe = "Choisissez au moins une personne.";
    setErreurs(e);
    if (Object.keys(e).length) return;

    setEnvoi(true);
    try {
      const creee = await creerMission({
        projetId: f.projetId,
        destination: f.destination.trim(),
        dateDebut: f.dateDebut,
        dateFin: f.dateFin,
        motif: f.motif.trim(),
        participantIds: equipe,
        chefMissionId: equipe.includes(chef) ? chef : equipe[0],
        besoinVehicule,
        besoinsMateriel: f.besoinsMateriel.trim() || null,
      });
      await queryClient.invalidateQueries({ queryKey: ["missions"] });
      toast.success("Ordre de mission envoyé");
      navigate(`/missions/${creee.id}`);
    } catch (err) {
      toast.error(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <CadreFormulaire
      retour={{ to: "/missions", label: "Missions" }}
      titre="Nouvel ordre de mission"
      onSoumettre={soumettre}
      libelleSoumettre="Envoyer"
      envoi={envoi}
    >
      <Ligne libelle="Projet" erreur={erreurs.projetId}>
        <select value={f.projetId} onChange={maj("projetId")} className={CHAMP}>
          <option value="">Choisir…</option>
          {projets
            .filter((p) => p.statut === "ACTIF")
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.titre}
              </option>
            ))}
        </select>
      </Ligne>
      <Ligne libelle="Destination" erreur={erreurs.destination}>
        <input value={f.destination} onChange={maj("destination")} placeholder="Ex. Vélingara, villages de Kandia" className={CHAMP} />
      </Ligne>
      <div className="grid gap-4 sm:grid-cols-2">
        <Ligne libelle="Départ" erreur={erreurs.dateDebut}>
          <input type="date" value={f.dateDebut} min={aujourdhui()} onChange={maj("dateDebut")} className={CHAMP} />
        </Ligne>
        <Ligne libelle="Retour" erreur={erreurs.dateFin}>
          <input type="date" value={f.dateFin} min={f.dateDebut || aujourdhui()} onChange={maj("dateFin")} className={CHAMP} />
        </Ligne>
      </div>
      <Ligne libelle="Objet de la mission" erreur={erreurs.motif}>
        <textarea value={f.motif} onChange={maj("motif")} rows={3} className={CHAMP} />
      </Ligne>
      <Ligne libelle="Équipe proposée" erreur={erreurs.equipe} aide="Le RAF pourra l'ajuster. Seules les personnes libres sur ces dates sont proposées.">
        {!f.dateDebut || !f.dateFin ? (
          <p className="text-sm text-gray-500">Indiquez d'abord les dates.</p>
        ) : isFetching && !libres ? (
          <p className="text-sm text-gray-500">Recherche des personnes libres…</p>
        ) : (
          <ChoixEquipe personnes={agents} equipe={equipe} setEquipe={setEquipe} chef={chef} setChef={setChef} />
        )}
      </Ligne>
      <label className="flex items-center gap-2 text-sm text-gray-800">
        <input type="checkbox" checked={besoinVehicule} onChange={(e) => setBesoinVehicule(e.target.checked)} />
        Besoin d'un véhicule avec chauffeur
      </label>
      <Ligne libelle="Matériel nécessaire (facultatif)" aide="Ex. vidéoprojecteur, tablettes de collecte, groupe électrogène.">
        <textarea value={f.besoinsMateriel} onChange={maj("besoinsMateriel")} rows={2} className={CHAMP} />
      </Ligne>
    </CadreFormulaire>
  );
}
