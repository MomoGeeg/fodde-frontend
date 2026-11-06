# Frontend FODDE — `fodde-frontend`

Application React de la plateforme FODDE. Voir aussi `../CLAUDE.md` (vue d'ensemble, règles de
travail, chantiers restants). Ce fichier remplace l'ancien `CLAUDE.MD` de l'époque Lovable.

## Stack

- React 19 + Vite, Tailwind CSS 4 (couleurs de la charte dans `src/index.css` : `primary`
  #4a7c2f, `black-fodde` #1a1a1a pour le menu, `danger`, `warning`…), police Inter.
- TanStack Query pour les données serveur, Zustand pour la session (`src/stores/auth.store.js`),
  React Router, Axios (`src/api/axios.js`), `sonner` pour les messages, icônes `lucide-react`.
- API : `VITE_API_BASE_URL` (variable Vercel, non sensible, sans `/` final). Un **401** de l'API
  déconnecte l'utilisateur (intercepteur Axios).
- Déploiement : Vercel publie automatiquement la branche `fodde-frontend` à chaque fusion.

## Organisation

- `src/lib/navigation.js` : **menu et droits au même endroit**.
  - `ACCES` : rôles autorisés à **ouvrir** une page (protège les routes via `RequireRole`).
  - `MENU` : rôles qui **voient** l'entrée dans leur menu (plus étroit : ce dont le métier a
    besoin au quotidien). `menu: []` = caché (module pas prêt).
  - `NAVIGATION` : sections et entrées ; `titrePage()` donne le titre de l'en-tête.
- `src/routes/index.jsx` : toutes les routes, groupées par droits ; anciennes adresses redirigées.
- `src/components/layout/AppLayout.jsx` : la seule mise en page (menu, en-tête, menu mobile, impression).
- `src/components/demande/` : **modèle de demande réutilisable**
  - `ListeDemandes` (vues « À traiter » / « Toutes », recherche, statut), `Cellule`
  - `FicheDemande` (en-tête, `Circuit` ou motif d'arrêt, `BarreActions`, informations)
  - `BarreActions` + `ModaleConfirmation` (confirmation, motif obligatoire pour rejeter)
  - `Formulaire` (`CadreFormulaire`, `Ligne`, `CHAMP`), `StatutBadge`, `Jauge` (consommation / réalisation)
- `src/api/<domaine>.js` : appels et règles métier d'un domaine. Pour une demande :
  `STATUTS_…` (`{ label, ton }`), `useListe()`, `estATraiter(d, roles, userId)`,
  `actions…(d, roles, userId)` → `[{ cle, label, style, motif, confirmation, executer(motif) }]`.
  Exemples complets : `depenses.js`, `missions.js`, `acquisitions.js`, `conges.js`.
- `src/pages/` : `accueil/` (accueil « À traiter », « Mes demandes », alertes, chiffres clés),
  `depenses/`, `missions/`, `acquisitions/`, `conges/`, `budgets/` (suivi budgétaire + exports),
  `indicateurs/`, et des pages plus anciennes pas encore refaites (`projets/`, `rh/`, `raf/RAFBudgets`,
  `secretariat/`, `documents/`, `admin/`, `activites/`).
- `src/lib/` : `format.js` (`montant`, `dateCourte`), `export.js` (`telechargerCsv` : CSV `;`,
  UTF-8 avec BOM, lisible par Excel), `erreurs.js` (`messageErreur`), `roles.js`.

## Conventions

- Textes de l'interface courts, en français ; une page = un tableau + un bouton principal.
- Montants : `montant(n, devise)` (espaces insécables, « F CFA »). Dates : `dateCourte`.
- Pas de données fictives ni de bouton qui « fait semblant » : si le backend n'a pas la route,
  ne pas afficher l'action (ou afficher `ModuleEnPreparation`).
- Exports : Excel via `telechargerCsv`, PDF via `window.print()` (le menu et l'en-tête sont
  masqués à l'impression ; utiliser `print:hidden` / `hidden print:block`).
- ESLint : `react/jsx-no-undef` est actif (un composant non importé = page blanche).

## Vérifier un changement

- `npm run lint` (0 erreur attendue) et `npm run build`.
- Test dans le navigateur **sans le vrai backend** (il n'accepte que le domaine Vercel en CORS) :
  un petit serveur Node à états qui imite l'API, lancé sur le port 8099, et
  `.env.mockapi.local` contenant `VITE_API_BASE_URL=http://localhost:8099` avec
  `npm run dev -- --mode mockapi --port 5174`. Session de test : `localStorage` `fodde_token`
  et `fodde_user` (`{ id, nom, prenom, roles: [...] }`). Supprimer `.env.mockapi.local` et ces
  clés après le test.
- Le comportement réel se vérifie ensuite en production avec l'utilisateur.
