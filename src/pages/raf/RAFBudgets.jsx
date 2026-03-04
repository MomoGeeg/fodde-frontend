import { rafApi } from "@/api/raf.api";
import RoleGate from "@/components/shared/RoleGate";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Lock, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const fmt = (n) => new Intl.NumberFormat("fr-SN").format(n) + " F";

function ProgressBar({ taux }) {
  const pct = Math.min(taux, 100);
  const color =
    taux > 90 ? "bg-red-500" : taux > 70 ? "bg-orange-400" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden min-w-[60px]">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`text-[11px] font-semibold tabular-nums w-9 text-right ${
          taux > 90
            ? "text-red-600"
            : taux > 70
              ? "text-orange-500"
              : "text-emerald-600"
        }`}
      >
        {taux.toFixed(0)}%
      </span>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function RAFBudgets() {
  const qc = useQueryClient();
  const [projetId, setProjetId] = useState("");
  const [showVirement, setShowVirement] = useState(false);
  const [virement, setVirement] = useState({
    ligneSource: "",
    ligneCible: "",
    montant: "",
    motif: "",
  });

  const { data: lignes = [], isLoading } = useQuery({
    queryKey: ["raf-lignes", projetId],
    queryFn: () =>
      rafApi.getLignesBudgetaires(projetId ? Number(projetId) : null),
    staleTime: 5 * 60_000,
  });

  const { data: projetsRAF = [] } = useQuery({
    queryKey: ["raf-projets"],
    queryFn: rafApi.getProjets,
  });

  const mutVirement = useMutation({
    mutationFn: () =>
      rafApi.virementBudgetaire(
        Number(virement.ligneSource),
        Number(virement.ligneCible),
        Number(virement.montant),
        virement.motif,
      ),
    onSuccess: () => {
      toast.success("Virement budgétaire enregistré");
      qc.invalidateQueries({ queryKey: ["raf-lignes"] });
      setShowVirement(false);
      setVirement({ ligneSource: "", ligneCible: "", montant: "", motif: "" });
    },
    onError: () => toast.error("Erreur lors du virement"),
  });

  // Regrouper les lignes par catégorie
  const categories = [
    ...new Set(lignes.filter((l) => l.isCategorie).map((l) => l.categorie)),
  ];
  const lignesDetail = lignes.filter((l) => !l.isCategorie);

  // Totaux globaux
  const totalPrevu = lignesDetail.reduce((s, l) => s + l.prevu, 0);
  const totalDepense = lignesDetail.reduce((s, l) => s + l.depense, 0);
  const totalEngage = lignesDetail.reduce((s, l) => s + l.engage, 0);
  const totalSolde = totalPrevu - totalDepense - totalEngage;
  const tauxGlobal = totalPrevu > 0 ? (totalDepense / totalPrevu) * 100 : 0;

  // Lignes d'une catégorie
  const getLignesByCategorie = (cat) =>
    lignesDetail.filter((l) => l.categorie === cat);

  // Lignes non category pour le virement
  const lignesSelectables = lignesDetail.filter(
    (l) => l.projetId === Number(projetId) || !projetId,
  );

  return (
    <RoleGate allowedRoles={["ROLE_RAF", "ROLE_SE"]}>
      {/* Filtres */}
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-1">
            Projet
          </label>
          <select
            value={projetId}
            onChange={(e) => setProjetId(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-emerald-400 focus:outline-none"
          >
            <option value="">Tous les projets actifs</option>
            {projetsRAF.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.titre}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowVirement(true)}
          disabled={!projetId}
          title={!projetId ? "Sélectionnez un projet" : "Virement budgétaire"}
          className="ml-auto flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowLeftRight size={13} /> Virement budgétaire
        </button>
      </div>

      {/* Totaux globaux */}
      {!isLoading && lignesDetail.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Prévu total",
              value: fmt(totalPrevu),
              color: "text-gray-900",
            },
            {
              label: "Dépensé total",
              value: fmt(totalDepense),
              color: "text-gray-900",
            },
            {
              label: "Engagé total",
              value: fmt(totalEngage),
              color: "text-amber-700",
            },
            {
              label: "Solde disponible",
              value: fmt(totalSolde),
              color: totalSolde < 0 ? "text-red-600" : "text-emerald-700",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-gray-200 bg-white px-4 py-3"
            >
              <p className="text-[10px] text-gray-500">{item.label}</p>
              <p className={`text-sm font-bold tabular-nums ${item.color}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tableau */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg bg-gray-200 h-10"
            />
          ))}
        </div>
      ) : lignes.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-400">
          Sélectionnez un projet pour afficher les lignes budgétaires
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11px] text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Intitulé</th>
                  <th className="px-4 py-3">Catégorie</th>
                  <th className="px-4 py-3 text-right">Prévu</th>
                  <th className="px-4 py-3 text-right">Engagé</th>
                  <th className="px-4 py-3 text-right">Dépensé</th>
                  <th className="px-4 py-3 text-right">Solde disponible</th>
                  <th className="px-4 py-3 min-w-[140px]">Consommation</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => {
                  const catLigne = lignes.find(
                    (l) => l.isCategorie && l.categorie === cat,
                  );
                  const catLines = getLignesByCategorie(cat);
                  const catPrevu = catLines.reduce((s, l) => s + l.prevu, 0);
                  const catDepense = catLines.reduce(
                    (s, l) => s + l.depense,
                    0,
                  );
                  const catEngage = catLines.reduce((s, l) => s + l.engage, 0);
                  const catSolde = catPrevu - catDepense - catEngage;
                  const catTaux =
                    catPrevu > 0 ? (catDepense / catPrevu) * 100 : 0;

                  return [
                    // Ligne catégorie
                    <tr
                      key={`cat-${cat}`}
                      className="border-b border-gray-200 bg-gray-50"
                    >
                      <td className="px-4 py-2.5 font-mono text-[11px] font-bold text-gray-700">
                        {catLigne?.code ?? ""}
                      </td>
                      <td
                        className="px-4 py-2.5 font-semibold text-gray-800"
                        colSpan={2}
                      >
                        {cat}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-800 tabular-nums">
                        {fmt(catPrevu)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-amber-700 tabular-nums">
                        {fmt(catEngage)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-800 tabular-nums">
                        {fmt(catDepense)}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right font-semibold tabular-nums ${catSolde < 0 ? "text-red-600" : "text-gray-700"}`}
                      >
                        {fmt(catSolde)}
                        {catSolde < 0 && (
                          <Lock
                            size={10}
                            className="inline ml-1 text-red-500"
                          />
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <ProgressBar taux={catTaux} />
                      </td>
                    </tr>,

                    // Lignes détail
                    ...catLines.map((ligne) => {
                      const solde = ligne.prevu - ligne.depense - ligne.engage;
                      const taux =
                        ligne.prevu > 0
                          ? (ligne.depense / ligne.prevu) * 100
                          : 0;
                      const rowBg =
                        taux > 90
                          ? "bg-red-50/60"
                          : taux > 70
                            ? "bg-orange-50/40"
                            : "";
                      const estGele = solde < 0;

                      return (
                        <tr
                          key={ligne.id}
                          className={`border-b border-gray-50 hover:bg-gray-50 ${rowBg}`}
                        >
                          <td className="px-4 py-2.5 pl-7 font-mono text-[11px] text-gray-500">
                            {ligne.code}
                          </td>
                          <td className="px-4 py-2.5 text-gray-700">
                            <div className="flex items-center gap-1.5">
                              {estGele && (
                                <Lock
                                  size={10}
                                  className="text-red-500 shrink-0"
                                />
                              )}
                              <span
                                className={
                                  estGele ? "line-through text-gray-400" : ""
                                }
                              >
                                {ligne.intitule}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                              {ligne.categorie}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-700 tabular-nums">
                            {fmt(ligne.prevu)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-amber-700 tabular-nums">
                            {fmt(ligne.engage)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-800 tabular-nums">
                            {fmt(ligne.depense)}
                          </td>
                          <td
                            className={`px-4 py-2.5 text-right font-medium tabular-nums ${estGele ? "text-red-600 font-bold" : "text-gray-700"}`}
                          >
                            {fmt(solde)}
                            {estGele && (
                              <span className="ml-1 rounded bg-red-100 px-1 py-0.5 text-[9px] font-bold text-red-700">
                                BLOQUÉ
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <ProgressBar taux={taux} />
                          </td>
                        </tr>
                      );
                    }),
                  ];
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Virement */}
      {showVirement && (
        <Modal
          title="Virement budgétaire interne"
          onClose={() => setShowVirement(false)}
        >
          <p className="mb-4 text-xs text-gray-600">
            Transférez un montant d'une ligne vers une autre du même projet. Si
            le montant dépasse le seuil SE, la validation du Secrétaire Exécutif
            sera requise.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-1">
                Ligne source <span className="text-red-500">*</span>
              </label>
              <select
                value={virement.ligneSource}
                onChange={(e) =>
                  setVirement((v) => ({ ...v, ligneSource: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-emerald-400 focus:outline-none"
              >
                <option value="">Choisir la ligne source…</option>
                {lignesSelectables.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} — {l.intitule} (Solde :{" "}
                    {fmt(l.prevu - l.depense - l.engage)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-1">
                Ligne de destination <span className="text-red-500">*</span>
              </label>
              <select
                value={virement.ligneCible}
                onChange={(e) =>
                  setVirement((v) => ({ ...v, ligneCible: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-emerald-400 focus:outline-none"
              >
                <option value="">Choisir la ligne destination…</option>
                {lignesSelectables
                  .filter((l) => l.id !== Number(virement.ligneSource))
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.code} — {l.intitule}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-1">
                Montant à virer (F) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={virement.montant}
                onChange={(e) =>
                  setVirement((v) => ({ ...v, montant: e.target.value }))
                }
                placeholder="Ex : 500000"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-emerald-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-700 mb-1">
                Motif <span className="text-red-500">*</span>
              </label>
              <textarea
                value={virement.motif}
                onChange={(e) =>
                  setVirement((v) => ({ ...v, motif: e.target.value }))
                }
                rows={2}
                placeholder="Justification du virement…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-emerald-400 focus:outline-none resize-none"
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setShowVirement(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={() => mutVirement.mutate()}
              disabled={
                mutVirement.isPending ||
                !virement.ligneSource ||
                !virement.ligneCible ||
                !virement.montant ||
                !virement.motif.trim()
              }
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <ArrowLeftRight size={13} />
              {mutVirement.isPending
                ? "Enregistrement…"
                : "Valider le virement"}
            </button>
          </div>
        </Modal>
      )}
    </RoleGate>
  );
}
