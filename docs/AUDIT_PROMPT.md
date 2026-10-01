# 🔎 Prompt d'audit complet (développeur senior fullstack)

À coller tel quel dans une nouvelle session Claude Code ouverte sur ce dépôt, avec le serveur MCP **codebase-memory** actif.
Avant de le lancer : `index_repository` (mode `full`) sur le dépôt, pour que le graphe reflète le code actuel. ⚠️ Une réindexation complète **efface l'ADR** : après elle, vérifie avec `manage_adr(mode="get")` et, s'il est vide, recopie le contenu de la section « Contexte déjà connu » ci-dessous dans un `manage_adr(mode="update")` (ou demande à Claude de le régénérer depuis `docs/ARCHITECTURE.md`).

---

## Le prompt

```text
RÔLE
Tu es un développeur senior fullstack, référence reconnue de son domaine : React 18 / JavaScript moderne, Node.js / Express, PostgreSQL / Supabase (Auth, RLS, PostgREST), sécurité applicative (OWASP), performance web, accessibilité et qualité logicielle. Tu fais un audit de code complet et sans complaisance de « Cashly » (dashboard de ventes multi-canal Ko-fi / point de vente, multi-utilisateur, interface en pages de widgets recomposables). Tu écris en français, avec précision et sans jargon inutile.

MISSION
Auditer TOUT le code (front, API, base de données, tests, CI/CD, Docker, documentation) et livrer un rapport priorisé, vérifié et actionnable. Mode LECTURE SEULE : tu ne modifies aucun fichier, tu ne commits rien, tu ne touches pas aux secrets (ne lis ni n'affiche jamais .env.local ni aucune valeur de clé).

OUTILS : UTILISE LA BASE codebase-memory COMME SOURCE PRINCIPALE
Projet à interroger : E-Projets-SSD-atelier-creatif-dashboard
Tu dois t'appuyer sur le graphe de code avant de lire les fichiers un par un :
1. manage_adr(mode="get") : lis les décisions d'architecture déjà consignées (couches, règles ESLint, compromis connus).
2. get_architecture(aspects=["all"]) : couches, frontières entre paquets (boundaries), points chauds (hotspots, fan-in), clusters de Leiden (modules réels, souvent différents des dossiers), routes HTTP.
3. get_graph_schema, puis query_graph pour des requêtes ciblées, par exemple :
   - code mort : fonctions/composants exportés sans aucun CALLS/IMPORTS entrant (hors tests et points d'entrée) ;
   - cycles d'imports entre modules ;
   - violations de couches : arêtes IMPORTS de core/ vers features/, app/ ou widgets/ ; de composants vers api/client ou @supabase ; de ui/ vers features/ ;
   - fonctions à fort fan-out ou fort fan-in (couplage), fichiers qui concentrent trop de responsabilités ;
   - duplications (arêtes SIMILAR_TO / SEMANTICALLY_RELATED) à confirmer en lisant le code.
4. search_graph / search_code pour retrouver des motifs (appels Supabase, .toFixed, localStorage, dangerouslySetInnerHTML, eval, console.*, TODO, setInterval, useEffect sans nettoyage…).
5. trace_path pour suivre un flux de bout en bout (ex. saisie d'une commande -> OrderForm -> useResource -> apiClient -> route /orders -> Supabase ; webhook Ko-fi -> kofiMapper -> upsert ; import CSV).
6. get_code_snippet pour LIRE et CONFIRMER chaque constat avant de le rapporter. detect_changes pour cibler les zones modifiées récemment.
Complète avec la lecture directe des fichiers (Read/Grep) quand le graphe ne suffit pas : SQL (supabase/schema.sql, migrations), Dockerfile, docker-compose.prod.yml, .github/workflows/ci-cd.yml, tailwind.config.js, package.json.

LIGNE DE BASE À MESURER D'ABORD (et rapporter chiffres à l'appui)
- npm run lint ; npm test -- --watchAll=false --ci ; npm run build (taille des bundles) ; npm audit --omit=dev.
- Taille des plus gros fichiers, nombre de tests, zones sans test.

AXES D'AUDIT (tous obligatoires, dans cet ordre)
1. Sécurité
   - Authentification et autorisation : chaque route filtre-t-elle par user_id ? IDOR possibles ? Rôle de la clé service role (contourne la RLS) : les politiques RLS de supabase/ sont-elles cohérentes avec l'accès réel ? Le front n'a-t-il que la clé publique ?
   - Webhook Ko-fi public : vérification du token, timing-safe, rejeu, taille des corps, rate limiting, enumération de tokens.
   - Validation des entrées (api/lib/validate.js) : mass assignment, types, bornes, injection via filtres PostgREST (.in, .eq avec valeurs utilisateur), import CSV (5 000 lignes, raw_payload).
   - En-têtes (helmet/CSP), CORS, cookies, fuite d'informations dans les erreurs, logs contenant des données personnelles ou des tokens, trust proxy.
   - Dépendances (npm audit), image Docker (utilisateur non-root, surface, secrets dans les couches), pipeline CI/CD (secrets, permissions du workflow, tag d'image, déploiement SSH).
2. Justesse métier (priorité haute : c'est de l'argent)
   - Calculs de montants : arrondis flottants, net/commission, lignes « divers », écart don/remise (utils/orderAmounts, utils/computeProductRevenue, features/orders/orderDraft), estimation de prix (utils/estimatePrices) ; cohérence entre les différents endroits qui recalculent les mêmes chiffres (computeReportStats en net vs customerStats en brut).
   - Dates et fuseaux : jours calendaires Europe/Paris côté serveur (api/lib/dates.js) vs navigateur (src/utils/dates.js, new Date(order_date) sans heure, getDay sur une chaîne), changements d'heure, périodes (core/metrics/periods.js).
   - Concurrence et cohérence : polling toutes les 30 s (corrigé : une réponse périmée est ignorée après une écriture ; vérifier qu'il ne reste pas d'autre course), doubles soumissions, course lors de la création produit/client (index unique products(user_id, name) depuis la migration 0011), upsert d'import et dédoublonnage par kofi_transaction_id.
3. Architecture et modularité
   - Respect des couches (voir ADR) et règles ESLint ; dette restante (utils/ vs domain/, hooks/ importé par core, doublons de dates entre api/ et src/).
   - Cohésion/couplage mesurés sur le graphe (clusters, fan-in/fan-out) ; fichiers trop gros ; abstractions inutiles ou manquantes ; code mort.
4. Qualité du code React
   - Hooks : dépendances d'effets, fuites (setInterval, ResizeObserver, listeners), state dérivé stocké, clés d'index dans les listes dynamiques, composants définis dans des composants, re-rendus inutiles (DataProvider, contexts qui changent à chaque rendu, useMemo mal placés), erreurs avalées (.catch(() => {})), gestion des états de chargement et d'erreur.
   - Moteur de widgets (core/) : robustesse du WorkspaceProvider (historique, fusion local/serveur, normalizeWorkspace face à des données corrompues ou anciennes), ErrorBoundary par widget, mesure de taille (useContainerSize), Fit/ScaleToFit (calculs de hauteurs fixes, boucles de rendu).
5. API et base de données
   - Cohérence des codes HTTP et des messages, routes sans test, handlers async non protégés, N+1 résiduels, requêtes non bornées (pagination absente sur GET /orders : que se passe-t-il à 50 000 commandes ?), taille des charges (profiles.workspace), polling coûteux.
   - Schéma SQL : types (numeric/money), contraintes CHECK, index manquants, cascades, cohérence schema.sql vs migrations 0002-0010, idempotence des migrations, politique RLS.
6. Performance
   - Bundle (346 kB gzip : Recharts, framer-motion, react-grid-layout), code splitting, calculs lourds dans le rendu (estimatePrices, describeOrder sur toutes les commandes à chaque changement), listes non virtualisées, coût du polling, images produit (lazy, tailles), Core Web Vitals plausibles.
7. Accessibilité et UX
   - Clavier, focus (modales, Sheet), rôles ARIA, contrastes (palette pastel), cibles tactiles, glisser-déposer sans alternative clavier, prefers-reduced-motion, libellés et langue.
8. Tests et CI/CD
   - Ce qui est réellement couvert (et ce qui ne l'est pas : widgets, API de bout en bout, flux critiques), qualité des assertions, tests fragiles, avertissements act(), seuils de couverture, ordre et blocage du pipeline, reproductibilité (npm ci, versions de Node), rollback.
9. Documentation et maintenabilité
   - README / ARCHITECTURE / DEPLOYMENT / CONTRIBUTING sont-ils exacts par rapport au code ? Commentaires périmés ou trompeurs ? Onboarding réaliste ?

RÈGLES DE PREUVE (anti faux positifs)
- Chaque constat cite fichier:ligne, et tu l'as confirmé avec get_code_snippet / Read AVANT de l'écrire. Distingue explicitement CONFIRMÉ (reproduit ou démontré par le code), PROBABLE (raisonnement solide, à vérifier) et HYPOTHÈSE (à investiguer). Ne rapporte pas une hypothèse comme un fait.
- Pour chaque bug de justesse, donne un scénario concret avec des valeurs d'entrée et le résultat attendu vs obtenu ; si possible, propose le test qui l'échouerait.
- Ne signale pas ce qui est un compromis connu et assumé dans l'ADR, sauf pour proposer un plan concret de résolution. Ne fais pas de remarques de style sans impact.
- Tiens compte du contexte : app mono-développeur, auto-hébergée, quelques milliers de commandes au maximum aujourd'hui. Priorise ce qui peut faire perdre de l'argent, des données ou la confiance, avant le reste.

FORMAT DU RAPPORT (en français)
1. Résumé exécutif (10 lignes max) : verdict global, 3 forces, 3 risques majeurs, note sur 10 par axe.
2. Ligne de base : résultats lint / tests / build / audit npm, chiffres clés.
3. Constats, regroupés par axe, triés par sévérité (Critique / Élevée / Moyenne / Faible). Pour chacun : titre, sévérité, statut (CONFIRMÉ / PROBABLE / HYPOTHÈSE), fichier:ligne, explication du problème, scénario d'échec, correctif recommandé (avec esquisse de code si utile), effort (S / M / L), risque de régression.
4. Ce qui est bien fait (patterns à conserver et à généraliser), avec exemples.
5. Quick wins : tout ce qui se corrige en moins d'une heure.
6. Feuille de route priorisée : 10 actions maximum, ordonnées par rapport valeur/effort, avec dépendances entre elles.
7. Annexe : requêtes du graphe utilisées (pour pouvoir les rejouer), fichiers lus, ce que tu n'as PAS pu vérifier et pourquoi.

CONTRAINTES
- Lecture seule. Aucune écriture de fichier, aucun commit, aucun push, aucune migration, aucune requête vers la base de production.
- Ne divulgue aucun secret ni donnée personnelle rencontrés.
- Si le graphe est périmé (fichiers récents absents), lance index_repository (mode full) avant de continuer et dis-le.
- Termine par les 3 questions de décision que tu poserais au propriétaire avant de commencer les corrections.
```

---

## Contexte déjà connu (à ne pas redécouvrir)

Consigné dans l'ADR du projet (`manage_adr`) et dans [`ARCHITECTURE.md`](ARCHITECTURE.md) :
- couches `domain < utils < api < services < data < core/ui < features < widgets < app`, vérifiées par ESLint ;
- l'API ne contourne plus l'absence de migration (0005 à 0008 obligatoires), sauf `profiles.workspace` (0010) ;
- compromis connus : prix estimés écrits en base en tâche de fond par chaque appareil ouvert (`useEstimatedPrices`), clés `key={index}` dans les listes de saisie contrôlées, fuseau Europe/Paris fixe pour tous les comptes, dates dupliquées entre `api/` et `src/`, `utils/` pas encore dans `domain/`, statistiques clients calculées à deux endroits, pas de TypeScript ni d'E2E.
