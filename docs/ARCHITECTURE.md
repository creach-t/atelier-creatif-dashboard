# 🏛️ Architecture

Vue d'ensemble du code : qui dépend de qui, où ranger une nouvelle chose, et ce qui est vérifié automatiquement.
Pour l'arborescence détaillée fichier par fichier, voir [« Structure du Projet » du README](../README.md#️-structure-du-projet).

## Les couches du front (`src/`)

```
                 App.js
                   │
                  app/            composition : AppShell, Sidebar, Header, BottomNav
                   │
        ┌──────────┴──────────┐
     widgets/             features/overlays/     « fenêtres globales » (fiches et formulaires)
        │                      │
        └──────────┬───────────┘
                features/         un dossier par domaine : orders, products, customers, reports, settings, auth
                   │
        ┌──────────┼───────────┐
       ui/       core/        data/ ──► services/ ──► api/
 (briques)  (moteur générique)  (hooks)   (auth, profil, import)  (fetch + client Supabase)
                   │
                domain/ · utils/         constantes métier, fonctions pures (montants, prix, variantes…)
```

| Couche | Rôle | Peut importer |
|---|---|---|
| `domain/` | Vocabulaire métier : statuts, canaux, valeurs par défaut | rien |
| `utils/` | Fonctions pures testées : montants nets, estimation de prix, variantes, CSV Ko-fi | `domain/` |
| `api/` | Client HTTP (`client.js`, JWT) et client Supabase navigateur | — |
| `services/` | `authService`, `profileService`, `importService` : **seule** porte vers le serveur et Supabase | `api/` |
| `data/` | `DataProvider` (commandes, produits, clients et dérivés partagés), hooks de données (`useResource`, `useAccount`…) | `services/`, `api/`, `utils/` |
| `hooks/` | Hooks génériques sans métier (`useIsNarrow`, `useSort`) | — |
| `core/` | Moteur générique : espace de travail (pages, widgets, grille, annulation, sauvegarde), registre de widgets, métriques et périodes, formulaire de réglages, `Sheet` | `data/`, `services/`, `utils/`, `domain/` |
| `ui/` | Briques d'interface sans logique métier (`Card`, `Button`, `Modal`, `PriceTag`, `BrandMark`…) | `core/ui`, `domain/` |
| `features/` | Un domaine métier : ses composants, ses formulaires, sa logique de saisie | tout ce qui précède |
| `widgets/` | Un fichier = un widget (`defineWidget`) | `core/`, `features/`, `data/`, `ui/` |
| `app/` | Assemblage final : fournisseurs, barre latérale, en-tête | tout |

### Garde-fous (ESLint, `npm run lint`, règle `no-restricted-imports` dans `package.json`)
- **`core/` ne dépend jamais de `features/`, `app/` ni `widgets/`** : le moteur reste générique.
- **Seuls `services/`, `data/` et `api/` parlent au serveur ou à Supabase** : aucun composant, widget ou fichier de `core/` n'importe `api/client`, `api/supabaseClient` ou `@supabase/*`.

## Flux de données

```
Supabase ◄── API Express (api/*, service role) ◄── services/ + data/useResource ──► DataProvider ──► widgets
                  ▲                                                                       │
   webhook Ko-fi ─┘                                                         useData() · useWidgetOrders(period)
```

- **Une seule source** : `DataProvider` charge commandes, produits et clients (rafraîchis toutes les 30 s) et calcule **une fois** les dérivés coûteux (prix estimés, variantes, ventes et revenus par produit, stats par client). Les widgets lisent via `useData()`.
- **Écritures optimistes** : `useResource` répercute création / modification / suppression dans l'état local sans attendre le rafraîchissement.
- **Fenêtres globales** : un widget ne gère jamais ses propres modales. Il appelle `useOverlays().openOrder(order)` (et `openProduct`, `openCustomer`, `newOrder`…) ; `features/overlays/OverlayProvider` affiche la bonne fiche, sans changer de page.
- **Revenus** : toujours comptés **en net** (après commission de la boutique) via `utils/orderAmounts` ; un prix connu prime toujours (voir `utils/computeProductRevenue`).

## Le moteur de widgets (`core/`)

- **`widgets/registry.js`** : `defineWidget({ type, title, size, defaultConfig, schema, presets, component })`. Le catalogue, les réglages, l'aperçu, la grille et la sauvegarde se déduisent du registre ; ajouter un widget = un fichier dans `widgets/` + une ligne dans `widgets/index.js`.
- **`workspace/`** : `model.js` (fonctions **pures** : pages, widgets, dispositions `lg` 12 col. / `md` 6 / `sm` 1), `WorkspaceProvider` (état, historique d'annulation, page active dans l'URL, sauvegarde locale immédiate + serveur différée, la version la plus récente gagne), `Board` (grille `react-grid-layout`).
- **Pas de défilement dans un widget** : `Fit.js` (pagination calculée sur la hauteur) et `ScaleToFit.js` (réduction à l'échelle, centrage optionnel). Un widget reçoit sa taille mesurée (`size`) et ses variantes CSS sont des *container queries* (`@md:`…), jamais `sm:`/`md:`.
- **`metrics/`** : indicateurs (`metrics.js`), périodes (`periods.js`), séries temporelles (`series.js`), formats d'affichage (`format.js` : `money`, dates…). Un nouvel indicateur y est disponible dans tous les widgets configurables.

## L'API (`api/`, servie par `server.js`)

- Chaque route est `route({ GET, POST, PATCH, DELETE }, { withId })` (`api/lib/resource.js`) : authentification par JWT Supabase, UUID validé (404 sinon), méthode inconnue → 405. Toutes les lectures et écritures passent par `listOwned` / `insertOwned` / `updateOwned` / `deleteOwned`, **toujours filtrées par `user_id`**.
- Une erreur base de données ne part jamais au navigateur : `serverError` la logge et répond 500 générique.
- `server.js` enveloppe chaque handler dans `safe()` (Express 4 n'attrape pas les rejets `async`), limite la taille des corps et le débit.
- Les synchronisations produits et clients (`productSync`, `customerSync`) travaillent par **requêtes groupées** : un import de milliers de lignes ne fait pas de requête par ligne.
- L'API ne tolère **pas** l'absence d'une migration : toutes les migrations de `supabase/migrations/` doivent être passées en base (voir `DEPLOYMENT.md`). Seule exception : `profiles.workspace` (migration `0010`), dont l'absence répond `501 workspace_unsupported` et laisse l'app fonctionner en local.

## Où ranger quoi ?

| Je veux… | Je touche |
|---|---|
| Un nouveau widget | `src/widgets/MonWidget.js` (+ import dans `widgets/index.js`) |
| Un nouvel indicateur | `src/core/metrics/metrics.js` |
| Un statut, un canal, une valeur par défaut | `src/domain/constants.js` (et `api/lib/validate.js` côté serveur, qui garde sa copie CommonJS) |
| Un calcul de montant ou de prix | `src/utils/` (fonction pure + test) |
| Un formulaire ou une fiche d'un domaine | `src/features/<domaine>/` ; si la logique de saisie grossit, une fonction pure à côté (voir `features/orders/orderDraft.js`) |
| Un appel serveur | `src/services/` (ou un hook de `src/data/`), jamais dans un composant |
| Une brique visuelle sans métier | `src/ui/` |
| Une nouvelle route API | `api/<ressource>.js` avec `route(...)` et les helpers de `api/lib/resource.js` |
| Un format d'affichage (montant, date) | `src/core/metrics/format.js` — jamais de `.toFixed(2)` écrit en dur |

## Tests

`npm test -- --watchAll=false` (Jest + Testing Library, dans `src/__tests__/`) : modèle de l'espace de travail et son fournisseur, périodes / métriques / séries, estimation de prix et variantes, montants, brouillon de commande et formulaire, mise en page du calendrier, mapping Ko-fi, helpers REST et synchros par lots (faux client Supabase), `useAccount`. Les handlers `api/` se testent depuis `src/__tests__/` (CRA ne cherche des tests que dans `src/`).

Principe : la logique va dans des **fonctions pures** (testables sans React ni réseau), les composants restent fins.
